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
    if clave == "jog-3":
        im = im.crop((140, 0, im.width, im.height))  # texto vertical "PANTALÓN JOGGER CARGO"
    if clave in BRILLO:
        im = ImageEnhance.Brightness(im).enhance(BRILLO[clave])
    return im


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


def mascara_pantalon(im, sesion):
    """Pantalón detectado por la IA, recortado a la tela (sin piel, zapatillas, etiquetas ni cordones blancos)."""
    from rembg import remove

    # u2net_cloth_seg devuelve 3 máscaras apiladas: parte de arriba, parte de abajo y prenda entera.
    m = np.asarray(remove(im, session=sesion, only_mask=True).convert("L"))
    ia = (np.maximum(m[im.height:2 * im.height], m[2 * im.height:]) if m.shape[0] == 3 * im.height else m) > 127
    lab_im = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2LAB).astype(np.float32)
    mediana = np.median(lab_im[ia], axis=0)
    # Reason: la IA a veces toma algo de piel o zapatilla en el borde; se queda solo lo que se parece a la tela.
    distancia = np.sqrt(((lab_im[..., 1:] - mediana[1:]) ** 2).sum(-1) + (0.35 * (lab_im[..., 0] - mediana[0])) ** 2)
    tela = ia & (distancia < 28)
    tela = cv2.morphologyEx(tela.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    tela = cv2.morphologyEx(tela, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    alfa = cv2.GaussianBlur(tela.astype(np.float32) / 255, (0, 0), 1.6)  # borde suave, sin halo
    return alfa, lab_im, mediana


def pintar(im, alfa, lab_im, mediana, hexa):
    """Lleva el pantalón al color pedido conservando la luz y la textura de la foto."""
    meta = lab(hexa)
    nuevo = lab_im.copy()
    # Luz: se mantiene el relieve (arrugas, costuras) y se escala según lo claro u oscuro del color nuevo.
    escala = np.clip((meta[0] + 25) / (mediana[0] + 25), 0.45, 1.5)
    nuevo[..., 0] = meta[0] + (lab_im[..., 0] - mediana[0]) * escala
    nuevo[..., 1:] = meta[1:] + (lab_im[..., 1:] - mediana[1:]) * 0.5
    rgb = cv2.cvtColor(np.clip(nuevo, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)
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
        alfa, lab_im, mediana = mascara_pantalon(base, sesion)
        for color, hexa in colores[prod].items():
            im = base if color == color_base else pintar(base, alfa, lab_im, mediana, hexa)
            guardar(im, f"{SAL}/{prod}/{slug(color)}.webp")
    for prod, claves in CUERPO_ENTERO.items():
        for i, clave in enumerate(claves, 1):
            guardar(ajustar(foto(clave)), f"{SAL}/{prod}/modelo-{i}.webp")
