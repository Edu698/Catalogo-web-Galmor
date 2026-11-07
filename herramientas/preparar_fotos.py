"""Prepara las fotos web del catálogo a partir de fotos-originales/.

Uso: python3 -I procesar.py REPO
Recorta un pantalón por color de las fotos grupales, limpia marcas ajenas y mejora nitidez/contraste
de forma suave (sin filtros ni cambios de color) para que la prenda se vea natural.
"""
import os, sys, unicodedata
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


def foto(clave):
    """'f1-3' -> tercera foto (orden alfabético) de la carpeta f1."""
    c, n = clave.split("-")
    d = os.path.join(ORIG, CARPETAS[c])
    fs = sorted(f for f in os.listdir(d) if f.lower().endswith((".jpg", ".jpeg")))
    return ImageOps.exif_transpose(Image.open(os.path.join(d, fs[int(n) - 1]))).convert("RGB")


def slug(s):
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
    return "-".join(s.split())


# Recorte (x1, y1, x2, y2) en píxeles de la foto original, una prenda por color.
RECORTES = {
    "drill-semi-pitillo": {
        "Cocoa": ("f1-1", (140, 320, 620, 960)), "Caqui": ("f1-1", (520, 320, 1000, 960)),
        "Verde arena": ("f1-1", (910, 320, 1390, 960)),
        "Verde militar": ("f1-2", (130, 300, 610, 940)), "Blanco": ("f1-2", (480, 300, 960, 940)),
        "Camello": ("f1-2", (890, 300, 1370, 940)),
        "Negro": ("f1-3", (130, 320, 610, 960)), "Plomo plata": ("f1-3", (520, 320, 1000, 960)),
        "Plomo oscuro": ("f1-3", (900, 320, 1380, 960)),
        "Azul acero": ("f1-4", (170, 340, 650, 980)), "Hueso": ("f1-4", (530, 340, 1010, 980)),
        "Azul noche": ("f1-4", (890, 340, 1370, 980)),
        "Canela": ("f1-5", (180, 320, 660, 960)), "Beige": ("f1-5", (550, 320, 1030, 960)),
        "Marrón": ("f1-5", (900, 320, 1380, 960)),
        "Plomo intermedio": ("f2-2", (100, 420, 550, 1020)),
    },
    "jogger-cargo": {
        "Caqui": ("jog-1", (190, 255, 590, 955)), "Verde militar": ("jog-1", (440, 255, 840, 955)),
        "Hueso": ("jog-1", (670, 255, 1070, 955)), "Plomo plata": ("jog-1", (910, 255, 1310, 955)),
        "Verde arena": ("jog-2", (220, 280, 620, 980)), "Beige": ("jog-2", (440, 280, 840, 980)),
        "Cocoa": ("jog-2", (660, 280, 1060, 980)), "Negro": ("jog-2", (900, 280, 1300, 980)),
    },
    "doble-cargo": {
        "Beige": ("dc-5", (450, 650, 1450, 1983)), "Negro": ("dc-5", (1300, 630, 2350, 2030)),
        "Cocoa": ("dc-5", (2300, 560, 3350, 1960)),
        "Hueso": ("dc-1", (800, 400, 1900, 1867)), "Plomo oscuro": ("dc-1", (1600, 450, 2800, 2050)),
        "Camello": ("dc-2", (400, 400, 1700, 2133)), "Verde arena": ("dc-2", (1550, 420, 2750, 2020)),
    },
    "bermuda-cargo": {
        "Plomo plata": ("ber-1", (320, 200, 920, 1000)), "Plomo oscuro": ("ber-1", (500, 500, 1100, 1300)),
        "Verde arena": ("ber-3", (320, 150, 920, 950)), "Verde militar": ("ber-3", (500, 520, 1100, 1320)),
        "Cocoa": ("ber-4", (100, 370, 700, 1170)), "Hueso": ("ber-4", (520, 400, 1120, 1200)),
        "Beige": ("ber-5", (320, 220, 680, 700)), "Caqui": ("ber-5", (300, 380, 900, 1180)),
        "Canela": ("ber-5", (550, 560, 1150, 1360)),
        "Negro": ("ber-6", (150, 370, 750, 1170)), "Blanco": ("ber-6", (550, 450, 1150, 1250)),
        "Acero oscuro": ("ber-7", (200, 370, 800, 1170)), "Cemento": ("ber-7", (580, 400, 1180, 1200)),
    },
    "jean-semi-pitillo": {
        "Verde": ("jean-4", (300, 100, 1650, 1900)), "Azul cristal": ("jean-4", (100, 1600, 1950, 4067)),
        "Celeste claro": ("jean-6", (300, 100, 1650, 1900)), "Madera": ("jean-6", (100, 1600, 1950, 4067)),
        "Celeste oscuro": ("jean-7", (300, 100, 1650, 1900)), "Grafito azul": ("jean-7", (100, 1600, 1950, 4067)),
        "Plomo claro": ("jean-8", (300, 100, 1650, 1900)), "Plomo oscuro": ("jean-8", (100, 1600, 1950, 4067)),
        "Negro": ("jean-9", (300, 100, 1650, 1900)), "Azul acero": ("jean-9", (100, 1600, 1950, 4067)),
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
    im.save(ruta, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"{os.path.relpath(ruta, REPO)}  {im.width}x{im.height}  {os.path.getsize(ruta) // 1024} KB")


for prod, colores in RECORTES.items():
    for color, (clave, caja) in colores.items():
        guardar(mejorar(foto(clave).crop(caja), (960, 1280)), f"{SAL}/{prod}/{slug(color)}.jpg")
for prod, claves in MODELOS.items():
    for i, clave in enumerate(claves, 1):
        guardar(mejorar(limpiar(clave, foto(clave)), (1000, 1500)), f"{SAL}/{prod}/modelo-{i}.jpg")
