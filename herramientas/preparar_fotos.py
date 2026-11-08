"""Prepara las fotos web de la tienda a partir de fotos-originales/.

Uso: python3 herramientas/preparar_fotos.py REPO   (requiere: pip install pillow numpy opencv-python-headless "rembg[cpu]")

Dueño (2026-11-08): las fotos del pantalón doblado se quitan. Cada color se muestra en el modelo:
la foto "de la cintura para abajo" de cada producto se usa de base y la IA (rembg, modelo u2net_cloth_seg)
detecta el pantalón; solo el pantalón se pinta con el color elegido, conservando arrugas, sombras y textura.
Las fotos de cuerpo entero se muestran tal cual.

Salida en fotos/<id>/:  <color>.webp (una por color, en el modelo)  y  modelo-N.webp (cuerpo entero).
"""
import os
import sys
import unicodedata

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO = sys.argv[1]
ORIG = os.path.join(REPO, "fotos-originales", "Fotos Galmor")
SAL = os.path.join(REPO, "fotos")
CARPETAS = {
    "drill": "Pantalon Drill Strech Semi Pitillo",
    "jog": "Pantalon Jogger Cargo Tacto Papel",
    "dc": "Pantalon Doble Cargo Tela Carbon",
    "ber": "Bermuda Cargo Cintura Elastico Tacto Papel",
    "jean": "Pantalon Jean Strech Semi Pitillo",
}

# Foto base (cintura para abajo) y el color que lleva puesto el modelo en ella.
BASES = {
    "drill-semi-pitillo": ("drill-4", "Beige"),
    "jean-semi-pitillo": ("jean-2", "Grafito azul"),
    "jogger-cargo": ("jog-3", "Beige"),
    "doble-cargo": ("dc-4", "Beige"),
    "bermuda-cargo": ("ber-2", "Verde arena"),
}
# Fotos de cuerpo entero (se muestran después del color elegido). En productos.js, "modelos" = cuántas hay.
CUERPO_ENTERO = {
    "drill-semi-pitillo": ["drill-2", "drill-3"],
    "jean-semi-pitillo": ["jean-1", "jean-5"],
}
# Fotos con demasiado brillo (dueño, 2026-11-08: el jogger se ve muy brilloso).
BRILLO = {"jog-3": 0.92}


def foto(clave):
    """'drill-3' -> tercera foto (orden alfabético) de la carpeta drill."""
    c, n = clave.split("-")
    d = os.path.join(ORIG, CARPETAS[c])
    fs = sorted(f for f in os.listdir(d) if f.lower().endswith((".jpg", ".jpeg")))
    im = ImageOps.exif_transpose(Image.open(os.path.join(d, fs[int(n) - 1]))).convert("RGB")
    if clave == "drill-3":
        # Reason: borra la marca "PhotoRoom" del piso copiando el piso de su izquierda (tablas horizontales).
        im.paste(im.crop((360, 1190, 590, 1265)), (590, 1190))
        im.paste(im.crop((575, 1185, 605, 1270)).filter(ImageFilter.GaussianBlur(3)), (575, 1185))
        im = im.crop((0, 0, im.width, im.height - 14))  # franja negra del borde inferior
    if clave.startswith("drill-"):
        im = borrar_sello(im)
    if clave == "jog-3":
        im = im.crop((140, 0, im.width, im.height))  # texto vertical "PANTALÓN JOGGER CARGO"
    if clave in BRILLO:
        im = ImageEnhance.Brightness(im).enhance(BRILLO[clave])
    return im


def borrar_sello(im):
    """Borra el sello "ZOROZ 77" (zorro, letras y marco) de la esquina inferior izquierda; queda el piso."""
    rgb = np.asarray(im).copy()
    h, w = rgb.shape[:2]
    y1, x2 = int(h * 0.80), int(w * 0.36)
    zona = rgb[y1:, :x2]
    gris = cv2.cvtColor(zona, cv2.COLOR_RGB2GRAY).astype(np.int16)
    fondo = cv2.medianBlur(cv2.cvtColor(zona, cv2.COLOR_RGB2GRAY), 31).astype(np.int16)
    marca = (np.abs(gris - fondo) > 14).astype(np.uint8) * 255
    # Reason: no se toca la zapatilla (blanca) que a veces entra en esa esquina.
    marca[cv2.cvtColor(zona, cv2.COLOR_RGB2GRAY) > 200] = 0
    mascara = np.zeros((h, w), np.uint8)
    mascara[y1:, :x2] = cv2.dilate(marca, np.ones((5, 5), np.uint8))
    return Image.fromarray(cv2.inpaint(rgb, mascara, 7, cv2.INPAINT_TELEA))


def slug(s):
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
    return "-".join(s.split())


def ajustar(im, caja=(1000, 1500)):
    """Ajusta a la caja (agranda hasta 2.2x); solo si se agrandó, nitidez muy suave. No cambia brillo ni color."""
    esc = min(caja[0] / im.width, caja[1] / im.height, 2.2)
    if abs(esc - 1) <= 0.01:
        return im
    im = im.resize((round(im.width * esc), round(im.height * esc)), Image.Resampling.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=4)) if esc > 1 else im


def agrandar(im, alto=1500):
    """Agranda una foto pequeña (recorte de cuadrícula de Gemini) a tamaño web: limpia el ruido de compresión,
    agranda con Lanczos y enfoca suave. No cambia colores ni proporción."""
    rgb = np.asarray(im)
    if im.height < 800:
        rgb = cv2.fastNlMeansDenoisingColored(rgb, None, 3, 3, 7, 21)
    esc = min(alto / im.height, 5)
    salida = Image.fromarray(rgb).resize((round(im.width * esc), round(im.height * esc)), Image.Resampling.LANCZOS)
    return salida.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))


def guardar(im, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    for calidad in (80, 72, 64, 56):  # máximo ~150 KB por foto
        im.save(ruta, "WEBP", quality=calidad, method=6)
        if os.path.getsize(ruta) <= 150 * 1024:
            break
    print(f"{os.path.relpath(ruta, REPO)}  {im.width}x{im.height}  {os.path.getsize(ruta) // 1024} KB")


def lab(hexa):
    rgb = np.array([[[int(hexa[i:i + 2], 16) for i in (1, 3, 5)]]], np.uint8)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[0, 0].astype(np.float32)


def mascara_pantalon(im, sesion, fuelle=False):
    """Pantalón detectado por la IA, recortado a la tela (sin piel, zapatillas, etiquetas ni cordones blancos)."""
    from rembg import remove

    # u2net_cloth_seg devuelve 3 máscaras apiladas: parte de arriba, parte de abajo y prenda entera.
    m = np.asarray(remove(im, session=sesion, only_mask=True).convert("L"))
    ia = (np.maximum(m[im.height:2 * im.height], m[2 * im.height:]) if m.shape[0] == 3 * im.height else m) > 127
    lab_im = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2LAB).astype(np.float32)
    mediana = np.median(lab_im[ia], axis=0)
    # Reason (dueño, 2026-11-08: bastas, entrepierna y forros quedaban sin pintar): se toma toda la prenda que
    # marca la IA, incluso las zonas en sombra, y solo se quitan la piel y las zapatillas (por color, no por luz).
    L, a, b = lab_im[..., 0], lab_im[..., 1] - 128, lab_im[..., 2] - 128
    piel = (a > 8) & (b > 12) & (a > mediana[1] - 128 + 6) & (L > 90)
    # La piel (cintura, manos) solo aparece en la parte alta del pantalón; más abajo, un tono parecido es forro de bolsillo.
    filas = np.where(ia.any(axis=1))[0]
    piel[int(filas[0] + 0.33 * (filas[-1] - filas[0])):] = False
    zapatilla = (L > 215) & (np.hypot(a, b) < 10) & (L > mediana[0] + 25)
    # Partes que sobresalen del borde (fuelle del bolsillo cargo): tela vecina del mismo color que el pantalón.
    # Reason: solo en el Doble Cargo; en las demás fotos el piso de madera tiene un color parecido a la tela.
    if fuelle:
        cerca = cv2.dilate(ia.astype(np.uint8), np.ones((1, 45), np.uint8)) > 0  # solo hacia los costados
        distancia = np.sqrt(((lab_im[..., 1:] - mediana[1:]) ** 2).sum(-1) + (0.4 * (L - mediana[0])) ** 2)
        ia = ia | (cerca & (distancia < 9) & (np.hypot(a, b) > 6))
        # Fuelle del bolsillo derecho de la foto dc-4 (más iluminado que el resto): tela beige dentro de esa zona.
        zona = np.zeros_like(ia)
        zona[530:780, 690:775] = True
        ia = ia | (zona & (b > 4))
    # Reason (dueño, 2026-11-08: la cortina entre las piernas del jean salía azul): fuera lo que no se parece a la tela.
    lejos = np.sqrt(((lab_im[..., 1:] - mediana[1:]) ** 2).sum(-1) + (0.4 * (L - mediana[0])) ** 2) > 26
    tela = (ia & ~piel & ~zapatilla & ~lejos).astype(np.uint8) * 255
    tela = cv2.morphologyEx(tela, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    # Rellena huecos encerrados (bolsillos, forros, etiquetas pequeñas) para que no queden manchas del color original.
    n, etiquetas, datos, _ = cv2.connectedComponentsWithStats(cv2.bitwise_not(tela), connectivity=4)
    for i in range(1, n):
        if datos[i, cv2.CC_STAT_AREA] < 15000:
            tela[etiquetas == i] = 255
    tela = cv2.morphologyEx(tela, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    alfa = cv2.GaussianBlur(tela.astype(np.float32) / 255, (0, 0), 1.4)  # borde suave, sin halo
    return alfa, lab_im, mediana


def a_lineal(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def a_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055) * 255


def pintar(im, alfa, lab_im, mediana, hexa):
    """Cambia solo el color de la tela, como si fuera otra tela bajo la misma luz.

    Reason (dueño, 2026-11-08: "se ve artificial"): se conserva la proporción de luz de cada punto
    (pliegue más oscuro, rodilla más clara) y se multiplica por el color nuevo en luz lineal. Así un
    pantalón negro conserva sus brillos y un azul no queda plano ni chillón.
    """
    orig = a_lineal(np.asarray(im).astype(np.float32))
    luz = orig @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    ref = np.median(luz[alfa > 0.5])
    sombra = np.clip(luz / max(ref, 1e-4), 0, 3)
    meta = a_lineal(np.array([int(hexa[i:i + 2], 16) for i in (1, 3, 5)], np.float32))
    # Telas de algodón: el tono real es algo menos saturado que la muestra.
    gris = meta @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    meta = gris + (meta - gris) * 0.85
    # Reason (dueño: "negro demasiado intenso"): una tela negra real se ve gris carbón muy oscuro, no negro puro.
    if gris < 0.03:
        meta = meta + (0.03 - gris)
        gris = 0.03
    # Reason (dueño: "el blanco brilla mucho"): en telas claras las zonas iluminadas se comprimen para no quemarse.
    if gris > 0.35:
        sombra = np.where(sombra > 1, 1 + (sombra - 1) * 0.45, sombra)
    nuevo = meta * sombra[..., None]
    # Brillo de la tela (solo telas oscuras): lo muy iluminado se aclara un poco hacia el gris, como en la foto.
    if gris < 0.2:
        nuevo = nuevo + np.clip(luz - ref * 1.3, 0, None)[..., None] * 0.15
    rgb = a_srgb(nuevo)
    salida = np.asarray(im).astype(np.float32) * (1 - alfa[..., None]) + rgb * alfa[..., None]
    return Image.fromarray(np.clip(salida, 0, 255).astype(np.uint8))


def productos():
    """Colores de cada producto, leídos de productos.js (mismo orden y tonos que la tienda)."""
    import json
    import re

    texto = open(os.path.join(REPO, "productos.js"), encoding="utf-8").read()
    salida = {}
    for bloque in re.findall(r'id: "([^"]+)".*?colores: \{(.*?)\}', texto, re.S):
        salida[bloque[0]] = dict(re.findall(r'"([^"]+)": "(#[0-9a-fA-F]{6})"', bloque[1]))
    return json.loads(json.dumps(salida))


if __name__ == "__main__":
    from rembg import new_session

    sesion = new_session("u2net_cloth_seg")
    colores = productos()
    for prod, (clave, color_base) in BASES.items():
        base = ajustar(foto(clave))
        alfa, lab_im, mediana = mascara_pantalon(base, sesion, fuelle=prod == "doble-cargo")
        for color, hexa in colores[prod].items():
            gemini = os.path.join(REPO, "fotos-gemini", prod, slug(color) + ".png")
            if os.path.exists(gemini):
                im = agrandar(Image.open(gemini).convert("RGB"))  # foto hecha por Gemini (dueño, 2026-11-08)
            else:
                im = base if color == color_base else pintar(base, alfa, lab_im, mediana, hexa)
            guardar(im, f"{SAL}/{prod}/{slug(color)}.webp")
    for prod, claves in CUERPO_ENTERO.items():
        for i, clave in enumerate(claves, 1):
            guardar(ajustar(foto(clave)), f"{SAL}/{prod}/modelo-{i}.webp")
    # Nueva versión: el navegador baja las fotos nuevas en vez de mostrar las que tenía guardadas.
    import re
    import time

    ruta = os.path.join(REPO, "productos.js")
    js = open(ruta, encoding="utf-8").read()
    open(ruta, "w", encoding="utf-8").write(re.sub(r'versionFotos: "[^"]*"', f'versionFotos: "{time.strftime("%Y%m%d%H%M")}"', js))
