"""Corta las cuadrículas que entrega Gemini (varios colores en una imagen) en una foto por color.

Uso: python3 herramientas/cortar_cuadricula.py REPO
Lee para-editar/para-editar/<Producto>/ y escribe fotos-gemini/<id>/<color>.png (tamaño original de cada celda).
Las franjas blancas entre celdas (con o sin texto) se detectan solas; el texto de los nombres queda fuera.
"""
import os
import shutil
import sys
import unicodedata

import numpy as np
from PIL import Image

REPO = sys.argv[1]
ENT = os.path.join(REPO, "para-editar", "para-editar")
SAL = os.path.join(REPO, "fotos-gemini")


def slug(s):
    s = unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
    return "-".join(s.split())


def tramos(claro, minimo):
    """Rangos [ini, fin) de filas/columnas que NO son franja blanca, de al menos `minimo` píxeles."""
    salida, ini = [], None
    for i, es_claro in enumerate(list(claro) + [True]):
        if not es_claro and ini is None:
            ini = i
        elif es_claro and ini is not None:
            if i - ini >= minimo:
                salida.append((ini, i))
            ini = None
    return salida


def tramos(es_franja, minimo):
    """Rangos [ini, fin) que NO son franja, de al menos `minimo` píxeles."""
    salida, ini = [], None
    for i, franja in enumerate(list(es_franja) + [True]):
        if not franja and ini is None:
            ini = i
        elif franja and ini is not None:
            if i - ini >= minimo:
                salida.append((ini, i))
            ini = None
    return salida


def celdas_blancas(im):
    """Cuadrícula con franjas blancas (con o sin texto): una fila/columna es franja si la mitad o más es blanca.
    El texto de los nombres ocupa poco ancho, así que sus filas también cuentan como franja."""
    blanco = np.asarray(im.convert("L")) > 243
    return tramos(blanco.mean(axis=1) > 0.5, im.height // 12), tramos(blanco.mean(axis=0) > 0.5, im.width // 12)


def recortar_margen(celda):
    """Quita el marco y el margen blanco que quede alrededor de la foto."""
    blanco = np.asarray(celda.convert("L")) > 243
    filas = np.where(blanco.mean(axis=1) < 0.5)[0]
    cols = np.where(blanco.mean(axis=0) < 0.5)[0]
    if len(filas) < 50 or len(cols) < 50:
        return celda
    m = 3  # quita también la línea fina del marco que dibuja Gemini
    return celda.crop((cols[0] + m, filas[0] + m, cols[-1] + 1 - m, filas[-1] + 1 - m))


# Por producto: archivo de cuadrícula, (filas, columnas) si no hay franjas blancas, y nombre de cada celda
# en orden de lectura (None = se descarta).
CUADRICULAS = {
    "drill-semi-pitillo": ("Pantalón Drill Strech Semi Pitillo/Todas las colores.jpeg", "blanco", [
        "Beige", "Verde arena", "Blanco", "Azul noche",  # la primera celda es la foto original (beige)
        None, None, None, None,  # Gemini escribió el nombre sobre la foto: se usa la versión pintada
        None, None, None, None,
        "Hueso", "Marrón", "Cocoa", "Camello",
    ]),
    "jean-semi-pitillo": ("Pantalón Jean Strech Semi Pitillo/Todas las colores.jpeg", (3, 3), [
        "Madera", "Azul cristal", "Azul acero",
        "Celeste oscuro", "Celeste claro", "Verde",
        "Plomo claro", "Plomo oscuro", "Negro",
    ]),
    "jogger-cargo": ("Pantalón Jogger Cargo Paper Touch/Todas las colores.jpeg", "blanco", [
        "Beige", "Caqui", "Hueso",  # la primera celda es la foto original (beige)
        "Plomo plata", "Cocoa", "Verde arena",
        "Verde militar", "Negro", None,
        None, None, None,
    ]),
    "bermuda-cargo": ("Bermuda Cargo Cintura Elástica Paper Touch/Bermuda Cargo Cintura Elástica Paper Touch.jpeg", ([0, 317, 843, 1264], 4), [
        "Verde militar", "Beige", "Caqui", "Hueso",
        "Blanco", "Cemento", "Plomo plata", "Plomo oscuro",
        "Acero oscuro", "Canela", "Cocoa", "Negro",
    ]),
}
# Fotos ya separadas (una por color), tal como las entregó Gemini.
SUELTAS = {
    "doble-cargo": "Pantalón Doble Cargo",
    "drill-semi-pitillo": "Pantalón Drill Strech Semi Pitillo",
}

shutil.rmtree(SAL, ignore_errors=True)
def dividir(largo, n):
    return [(round(i * largo / n), round((i + 1) * largo / n)) for i in range(n)]


for prod, (archivo, modo, nombres) in CUADRICULAS.items():
    im = Image.open(os.path.join(ENT, archivo)).convert("RGB")
    if modo == "blanco":
        f, c = celdas_blancas(im)
    else:
        filas, nc = modo
        f = list(zip(filas[:-1], filas[1:])) if isinstance(filas, list) else dividir(im.height, filas)
        c = dividir(im.width, nc)
    print(f"{prod}: filas {[y2 - y1 for y1, y2 in f]} columnas {[x2 - x1 for x1, x2 in c]}")
    assert len(f) * len(c) == len(nombres), f"{prod}: {len(f) * len(c)} celdas pero {len(nombres)} nombres"
    os.makedirs(os.path.join(SAL, prod), exist_ok=True)
    alto_comun = min(y2 - y1 for y1, y2 in f)  # Reason: todas las fotos del producto con el mismo encuadre
    k = 0
    for y1, y2 in f:
        for x1, x2 in c:
            nombre = nombres[k]
            k += 1
            if not nombre:
                continue
            celda = im.crop((x1, y1, x2, y2))
            celda = recortar_margen(celda) if modo == "blanco" else celda.crop((0, 0, x2 - x1, alto_comun))
            celda.save(os.path.join(SAL, prod, slug(nombre) + ".png"))
for prod, carpeta in SUELTAS.items():
    os.makedirs(os.path.join(SAL, prod), exist_ok=True)
    for a in os.listdir(os.path.join(ENT, carpeta)):
        base, ext = os.path.splitext(a)
        if ext.lower() == ".jpeg" and " " not in base or base in ("Verde arena", "Plomo oscuro"):
            Image.open(os.path.join(ENT, carpeta, a)).convert("RGB").save(os.path.join(SAL, prod, slug(base) + ".png"))
for prod in sorted(os.listdir(SAL)):
    print(prod, sorted(os.listdir(os.path.join(SAL, prod))))
