"""Prepara las fotos web del catálogo a partir de fotos-originales/.

Uso: python3 herramientas/preparar_fotos.py REPO   (requiere Pillow, numpy y opencv-python-headless)
Recorta un pantalón por color de las fotos grupales, borra el nombre del color escrito encima de la prenda
(la tienda ya lo muestra) y limpia marcas ajenas. No cambia brillo, contraste ni color.
"""
import functools, os, sys, unicodedata

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps

REPO = sys.argv[1]
ORIG = os.path.join(REPO, "fotos-originales", "Fotos Galmor")
SAL = os.path.join(REPO, "fotos")
CARPETAS = {
    "f1": "Pantalon Drill Strech Semi Pitillo/Formato 1",
    "f2": "Pantalon Drill Strech Semi Pitillo/Formato 2",
    "drill": "Pantalon Drill Strech Semi Pitillo",
    "jog": "Pantalon Jogger Cargo Tacto Papel",
    "dc": "Pantalon Doble Cargo Tela Carbon",
    "ber": "Bermuda Cargo Cintura Elastico Tacto Papel",
    "jean": "Pantalon Jean Strech Semi Pitillo",
}


# Nombre del color escrito sobre la prenda: (x1, y1, x2, y2, tipo) en píxeles de la foto original.
# tipo "claro" = letras blancas; "oscuro" = letras negras (sobre la prenda blanca);
# "sombra" = letras blancas con sombra oscura (jean).
TEXTOS = {
    "f1-1": [(245, 705, 345, 910, "claro"), (607, 735, 700, 902, "claro"), (990, 690, 1090, 928, "claro")],
    "f1-2": [(245, 625, 345, 885, "claro"), (607, 698, 705, 905, "oscuro"), (967, 632, 1060, 873, "claro")],
    "f1-3": [(222, 647, 340, 892, "claro"), (585, 632, 712, 910, "claro"), (986, 596, 1104, 942, "claro")],
    "f1-4": [(283, 683, 375, 888, "claro"), (640, 695, 726, 870, "claro"), (948, 669, 1041, 895, "claro")],
    "f1-5": [(283, 680, 384, 895, "claro"), (632, 695, 732, 880, "claro"), (977, 669, 1078, 905, "claro")],
    # Reason: las cajas del jogger empiezan debajo de los stickers redondos para no borronearlos.
    "jog-1": [(330, 680, 452, 955, "claro"), (552, 690, 656, 917, "claro"), (785, 702, 903, 946, "claro"),
              (1010, 690, 1121, 946, "claro")],
    "jog-2": [(334, 716, 438, 931, "claro"), (504, 729, 609, 910, "claro"), (770, 722, 874, 920, "claro"),
              (1051, 730, 1151, 920, "claro")],
    # Etiquetas rojas con el nombre del color (Formato 2 del Drill y bermudas).
    "f2-2": [(753, 371, 1175, 487, "rojo"), (150, 1331, 521, 1443, "rojo")],
    "ber-1": [(367, 57, 869, 171, "rojo"), (642, 1400, 1172, 1535, "rojo")],
    "ber-3": [(329, 11, 795, 142, "rojo"), (676, 1391, 1186, 1521, "rojo")],
    "ber-4": [(393, 25, 677, 158, "rojo"), (862, 1297, 1138, 1429, "rojo")],
    "ber-5": [(677, 89, 924, 223, "rojo"), (894, 335, 1157, 468, "rojo"), (815, 1365, 1122, 1500, "rojo")],
    "ber-6": [(367, 30, 645, 162, "rojo"), (809, 1324, 1129, 1460, "rojo")],
    "ber-7": [(357, 34, 788, 165, "rojo"), (853, 1308, 1200, 1441, "rojo")],
    "jean-4": [(860, 755, 1210, 870, "sombra"), (775, 2305, 1490, 2440, "sombra")],
    "jean-6": [(690, 830, 1460, 965, "sombra"), (793, 2380, 1240, 2515, "sombra")],
    "jean-7": [(520, 792, 1335, 927, "sombra"), (585, 2323, 1345, 2458, "sombra")],
    "jean-8": [(804, 842, 1478, 973, "sombra"), (793, 2354, 1515, 2485, "sombra")],
    "jean-9": [(842, 762, 1200, 897, "sombra"), (766, 2369, 1395, 2507, "sombra")],
}


def borrar_texto(im, cajas):
    """Rellena las letras con la tela de alrededor (inpainting), solo dentro de cada caja."""
    rgb = np.array(im)
    mascara = np.zeros(rgb.shape[:2], np.uint8)
    for x1, y1, x2, y2, tipo in cajas:
        zona = rgb[y1:y2, x1:x2]
        if tipo == "rojo":  # etiqueta roja rectangular: se reemplaza completa, con margen para su borde
            mascara[max(0, y1 - 16):y2 + 16, max(0, x1 - 16):x2 + 16] = 255
            continue
        if tipo == "oscuro":
            letras = zona.max(axis=2) < 95
        else:
            letras = zona.min(axis=2) > (200 if tipo == "sombra" else 232)
        if tipo == "sombra":
            # Reason: la sombra de las letras es más oscura que la tela vecina; se marca también.
            gris = cv2.cvtColor(np.ascontiguousarray(zona), cv2.COLOR_RGB2GRAY)
            letras |= gris.astype(int) < cv2.medianBlur(gris, 41).astype(int) - 18
        mascara[y1:y2, x1:x2] |= letras.astype(np.uint8) * 255
    # Reason: se agranda la máscara para cubrir el borde suavizado y la sombra de las letras.
    mascara = cv2.dilate(mascara, np.ones((7, 7), np.uint8))
    sale = cv2.inpaint(rgb, mascara, 9, cv2.INPAINT_TELEA).astype(np.int16)
    for x1, y1, x2, y2, tipo in cajas:
        if tipo not in ("sombra", "rojo"):
            continue
        # Reason: el relleno queda liso; se le suma el grano (tela o piso) de la franja vecina.
        h = y2 - y1
        vecina = rgb[y1 - h:y1, x1:x2] if y1 >= h else rgb[y2:y2 + h, x1:x2]
        if vecina.shape[0] != h:
            continue
        vecina = vecina.astype(np.int16)
        grano = vecina - cv2.GaussianBlur(vecina, (0, 0), 3)
        m = mascara[y1:y2, x1:x2, None] > 0
        sale[y1:y2, x1:x2] = np.where(m, sale[y1:y2, x1:x2] + grano, sale[y1:y2, x1:x2])
    return Image.fromarray(np.clip(sale, 0, 255).astype(np.uint8))


@functools.lru_cache(maxsize=None)
def foto(clave):
    """'f1-3' -> tercera foto (orden alfabético) de la carpeta f1, ya sin el nombre del color escrito."""
    c, n = clave.split("-")
    d = os.path.join(ORIG, CARPETAS[c])
    fs = sorted(f for f in os.listdir(d) if f.lower().endswith((".jpg", ".jpeg")))
    im = ImageOps.exif_transpose(Image.open(os.path.join(d, fs[int(n) - 1]))).convert("RGB")
    return borrar_texto(im, TEXTOS[clave]) if clave in TEXTOS else im


def slug(s):
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
    return "-".join(s.split())


# Recorte (x1, y1, x2, y2) en píxeles de la foto original, una prenda por color.
RECORTES = {
    "drill-semi-pitillo": {
        # Reason: los de la derecha suben 50 px para no cortar la punta del logo de abajo a la derecha.
        "Cocoa": ("f1-1", (110, 290, 650, 1010)), "Caqui": ("f1-1", (490, 290, 1030, 1010)),
        "Verde arena": ("f1-1", (880, 240, 1420, 960)),
        "Verde militar": ("f1-2", (100, 270, 640, 990)), "Blanco": ("f1-2", (450, 270, 990, 990)),
        "Camello": ("f1-2", (860, 220, 1400, 940)),
        "Negro": ("f1-3", (100, 290, 640, 1010)), "Plomo plata": ("f1-3", (490, 290, 1030, 1010)),
        "Plomo oscuro": ("f1-3", (870, 240, 1410, 960)),
        "Azul acero": ("f1-4", (140, 310, 680, 1030)), "Hueso": ("f1-4", (500, 310, 1040, 1030)),
        "Azul noche": ("f1-4", (860, 260, 1400, 980)),
        "Canela": ("f1-5", (150, 290, 690, 1010)), "Beige": ("f1-5", (520, 290, 1060, 1010)),
        "Marrón": ("f1-5", (870, 240, 1410, 960)),
        "Plomo intermedio": ("f2-2", (0, 370, 855, 1510)),
    },
    "jogger-cargo": {
        "Caqui": ("jog-1", (190, 255, 590, 955)), "Verde militar": ("jog-1", (440, 255, 840, 955)),
        "Hueso": ("jog-1", (670, 255, 1070, 955)), "Plomo plata": ("jog-1", (910, 255, 1310, 955)),
        "Verde arena": ("jog-2", (220, 280, 620, 980)), "Beige": ("jog-2", (440, 280, 840, 980)),
        "Cocoa": ("jog-2", (660, 280, 1060, 980)), "Negro": ("jog-2", (900, 280, 1300, 980)),
    },
    "doble-cargo": {
        # Reason: encuadre abierto para ver el pantalón casi completo (las prendas van en diagonal).
        "Beige": ("dc-5", (50, 620, 1625, 2720)), "Negro": ("dc-5", (960, 620, 2560, 2753)),
        "Cocoa": ("dc-5", (1790, 520, 3310, 2547)),
        "Hueso": ("dc-1", (480, 340, 2430, 2940)), "Plomo oscuro": ("dc-1", (1300, 440, 3100, 2840)),
        "Camello": ("dc-2", (250, 350, 2200, 2950)), "Verde arena": ("dc-2", (1350, 400, 3150, 2800)),
    },
    "bermuda-cargo": {
        "Plomo plata": ("ber-1", (0, 100, 870, 1260)), "Plomo oscuro": ("ber-1", (330, 400, 1200, 1560)),
        "Verde arena": ("ber-3", (0, 80, 870, 1240)), "Verde militar": ("ber-3", (330, 400, 1200, 1560)),
        "Cocoa": ("ber-4", (0, 130, 870, 1290)), "Hueso": ("ber-4", (330, 400, 1200, 1560)),
        "Beige": ("ber-5", (0, 100, 780, 1140)), "Caqui": ("ber-5", (60, 260, 930, 1420)),
        "Canela": ("ber-5", (330, 400, 1200, 1560)),
        "Negro": ("ber-6", (0, 100, 870, 1260)), "Blanco": ("ber-6", (330, 400, 1200, 1560)),
        "Acero oscuro": ("ber-7", (0, 120, 870, 1280)), "Cemento": ("ber-7", (330, 400, 1200, 1560)),
    },
    "jean-semi-pitillo": {
        "Verde": ("jean-4", (150, 0, 1950, 2400)), "Azul cristal": ("jean-4", (50, 1700, 1850, 4100)),
        "Celeste claro": ("jean-6", (150, 0, 1950, 2400)), "Madera": ("jean-6", (50, 1700, 1850, 4100)),
        "Celeste oscuro": ("jean-7", (150, 0, 1950, 2400)), "Grafito azul": ("jean-7", (50, 1700, 1850, 4100)),
        "Plomo claro": ("jean-8", (150, 0, 1950, 2400)), "Plomo oscuro": ("jean-8", (50, 1700, 1850, 4100)),
        "Negro": ("jean-9", (150, 0, 1950, 2400)), "Azul acero": ("jean-9", (50, 1700, 1850, 4100)),
    },
}

# Fotos con modelo, en el orden en que se muestran (la primera es la portada).
MODELOS = {
    "drill-semi-pitillo": ["drill-2", "drill-1", "drill-3", "drill-4"],
    "jean-semi-pitillo": ["jean-1", "jean-2", "jean-3", "jean-5"],
    "jogger-cargo": ["jog-3"],
    "doble-cargo": ["dc-4"],
    "bermuda-cargo": ["ber-2"],
}


def limpiar(clave, im):
    if clave == "drill-3":
        # Reason: borra la marca "PhotoRoom" del piso copiando el piso de su izquierda (tablas horizontales).
        im.paste(im.crop((360, 1190, 590, 1265)), (590, 1190))
        borde = im.crop((575, 1185, 605, 1270)).filter(ImageFilter.GaussianBlur(3))
        im.paste(borde, (575, 1185))
        im = im.crop((0, 0, im.width, im.height - 14))  # quita la franja negra del borde inferior
    if clave == "jog-3":
        im = im.crop((140, 0, im.width, im.height))  # quita el texto vertical "PANTALÓN JOGGER CARGO"
    return im


def mejorar(im, caja):
    """Ajusta a la caja (agranda hasta 2.2x) y, solo si se agrandó, recupera nitidez muy suave.

    Reason: no se tocan brillo, contraste ni color. Un ajuste de niveles cambiaba el tono de piel
    entre modelos y quemaba los blancos; la prenda debe verse igual que en la foto original.
    """
    esc = min(caja[0] / im.width, caja[1] / im.height, 2.2)
    if abs(esc - 1) <= 0.01:
        return im
    im = im.resize((round(im.width * esc), round(im.height * esc)), Image.Resampling.LANCZOS)
    if esc > 1:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=4))
    return im


def guardar(im, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    # Reason: WebP pesa ~40 % menos que JPEG con la misma calidad; la tienda carga rápido en celular.
    for calidad in (80, 72, 64, 56):  # máximo ~150 KB por foto (el denim tiene mucho detalle)
        im.save(ruta, "WEBP", quality=calidad, method=6)
        if os.path.getsize(ruta) <= 150 * 1024:
            break
    print(f"{os.path.relpath(ruta, REPO)}  {im.width}x{im.height}  {os.path.getsize(ruta) // 1024} KB")


for prod, colores in RECORTES.items():
    for color, (clave, caja) in colores.items():
        guardar(mejorar(foto(clave).crop(caja), (960, 1280)), f"{SAL}/{prod}/{slug(color)}.webp")
for prod, claves in MODELOS.items():
    for i, clave in enumerate(claves, 1):
        guardar(mejorar(limpiar(clave, foto(clave).copy()), (1000, 1500)), f"{SAL}/{prod}/modelo-{i}.webp")
