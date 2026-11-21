"""Fotos del catálogo con fondo blanco (dueño, 2026-11-21: "profesional, Full HD, vertical, que contraste con la página").

Uso: python3 herramientas/fotos_fondo_blanco.py CARPETA_FOTOS REPO
  CARPETA_FOTOS: fotos BEESER-N.jpg de la sesión (Drive "Fotos Galmor"). Requiere: pillow numpy "rembg[cpu]".

Por cada color: <color>.webp (frente) y, si hay, <color>-2.webp (espalda o detalle), 1920 x 1920, prenda vertical
(cintura arriba) sobre blanco con sombra suave; más <color>-m.webp y <color>-2-m.webp de 800 px para tarjetas.
Los colores no se tocan: solo se quita el fondo. Las fotos con modelo (modelo-N.webp) se conservan.
"""
import glob
import os
import sys
import unicodedata

import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

ORIGEN, REPO = sys.argv[1], sys.argv[2]
REVISION = sys.argv[3] if len(sys.argv) > 3 else None  # carpeta opcional para revisar los recortes
LADO = 1920

# carpeta en fotos/ -> {color: [(foto, giro), ...]}  giro = grados (antihorario) para dejar la cintura arriba.
# Colores y números elegidos de las carpetas del dueño en Drive; él revisa los colores (2026-11-21).
FOTOS = {
    "drill-semi-pitillo": {"Azul noche": [(209, 90), (207, 90)], "Beige": [(201, 0)], "Cocoa": [(217, 90)],
                           "Hueso": [(205, 90), (203, 0)], "Negro": [(225, 90)], "Plomo oscuro": [(221, 90)],
                           "Verde arena": [(213, 90), (211, 90)]},
    "drill-clasico": {"Azul noche": [(242, 90), (240, 90)], "Beige": [(238, 90), (237, 90)],
                      "Cocoa": [(235, 90), (233, 90)], "Hueso": [(255, 90), (252, 90)], "Negro": [(229, 0), (227, 90)],
                      "Plomo oscuro": [(250, 90), (248, 90)], "Verde arena": [(246, 0), (244, 90)]},
    # Segunda foto: el pantalón doblado, que muestra el bolsillo cargo (dueño, 2026-11-21: "todos con 2 fotos").
    "drill-tri-cargo": {"Beige": [(79, 90), (81, 90)], "Cocoa": [(68, 90), (73, 90)], "Negro": [(83, 90), (84, 90)],
                        "Plomo oscuro": [(86, 90), (88, 90)], "Verde arena": [(75, 90), (77, 90)]},
    # Dueño (2026-11-21): el que se llamó "Azul oscuro" es Plomo plata.
    "doble-cargo": {"Beige": [(139, 90), (137, 90)], "Camello": [(106, 90), (108, 90)], "Cocoa": [(94, 90), (96, 90)],
                    "Plomo plata": [(110, 0), (112, 90)], "Hueso": [(135, 0), (104, 90)], "Negro": [(120, 0), (92, 90)],
                    "Plomo oscuro": [(123, 90), (125, 90)], "Verde arena": [(98, 90), (100, 90)]},
    # Jogger: la foto vertical va primero (las dobladas en diagonal no lucen como principal).
    "jogger-cargo": {"Beige": [(268, 90), (266, 0)], "Cocoa": [(274, 0), (276, 0)], "Hueso": [(143, 90), (258, 90)],
                     # En la carpeta hay dos tonos oscuros: negro puro (278-281) y uno azulado (145-148, 262-265),
                     # que queda como Plomo oscuro hasta que el dueño confirme el nombre.
                     "Negro": [(278, 90), (280, 0)], "Plomo oscuro": [(147, 0), (264, 90)],
                     "Verde arena": [(272, 0), (270, 0)]},
    # Dueño (2026-11-21): el #165 "no es celeste"; queda como Plomo lápiz hasta que él confirme el nombre.
    "jean-clasico-grueso": {"Cristal": [(150, 0)], "Grafito azul": [(155, 90), (154, 90)],
                            "Plomo lápiz": [(165, 90), (163, 90)], "Negro": [(160, 90), (157, 90)]},
    "bermuda-torero": {"Beige": [(197, 0), (195, 0)], "Cocoa": [(172, 90), (174, 0)], "Hueso": [(185, 0), (183, 0)],
                       "Negro": [(187, 0), (189, 0)], "Plomo oscuro": [(193, 0), (191, 0)],
                       "Verde arena": [(176, 0), (177, 0)]},
    "bermuda-jean-clasico": {"Acero": [(44, 0), (46, 0)], "Azul medio": [(57, 0), (58, 0)],
                             "Celeste": [(65, 90), (66, 90)], "Plomo oscuro": [(48, 0), (50, 0)]},
    "bermuda-jean-sin-basta": {"Cristal": [(34, 0), (35, 0)], "Madera": [(30, 0), (32, 0)],
                               "Maíz": [(36, 0), (38, 0)], "Plomo oscuro": [(26, 0), (28, 0)]},
    "bermuda-jean-rasgado": {"Celeste": [(2, 0), (20, 0)], "Madera": [(14, 0), (15, 0)],
                             "Plomo oscuro": [(16, 0), (17, 0)]},
}


def slug(s: str) -> str:  # igual que slug() de app.js
    s = unicodedata.normalize("NFD", s.lower())
    return "-".join("".join(c for c in s if not unicodedata.combining(c)).split())


def enderezar(rgba: Image.Image) -> Image.Image:
    """Pone vertical el eje largo de la prenda (hasta ±60°: también las dobladas en diagonal).

    Reason (dueño, 2026-11-21: "fotos que salen horizontales o en diagonal"). Solo si la prenda es alargada: en una
    bermuda casi cuadrada el eje no dice nada y se deja como está.
    """
    ys, xs = np.nonzero(np.asarray(rgba)[..., 3] > 128)
    valores, vectores = np.linalg.eigh(np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()])))
    vx, vy = vectores[:, -1]
    ang = (np.degrees(np.arctan2(vx, vy)) + 90) % 180 - 90  # 0 = eje vertical
    alargada = valores[-1] > 1.6 * valores[0]
    return rgba.rotate(-ang, expand=True, resample=Image.Resampling.BICUBIC) if alargada and abs(ang) <= 60 else rgba


def ficha(sesion, n: int, giro: int) -> Image.Image:
    im = Image.open(os.path.join(ORIGEN, f"BEESER-{n}.jpg")).convert("RGB")
    rgba = enderezar(remove(im, session=sesion, post_process_mask=True).rotate(giro, expand=True))
    rgba = rgba.crop(rgba.getbbox())
    rgba.thumbnail((int(LADO * 0.80), int(LADO * 0.90)), Image.Resampling.LANCZOS)
    # Nitidez suave en la tela (dueño: "mejorar la calidad"); el color no cambia.
    r, g, b, a = rgba.split()
    rgba = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=3))
    rgba.putalpha(a)
    if REVISION:  # recorte sobre fondo oscuro: ahí se ve cualquier resto de piso que quedó
        oscuro = Image.new("RGB", rgba.size, "#20262e")
        oscuro.paste(rgba, (0, 0), rgba)
        oscuro.save(os.path.join(REVISION, f"BEESER-{n}.jpg"), quality=80)
    lienzo = Image.new("RGB", (LADO, LADO), "white")
    x, y = (LADO - rgba.width) // 2, (LADO - rgba.height) // 2
    # Sombra suave abajo a la derecha: la prenda "se apoya" en el blanco y no se pierde sobre el crema de la página.
    sombra = Image.new("L", (LADO, LADO), 0)
    sombra.paste(rgba.split()[3].point(lambda v: v * 0.28), (x + 12, y + 22))
    lienzo.paste(Image.new("RGB", (LADO, LADO), "#6f6f6f"), mask=sombra.filter(ImageFilter.GaussianBlur(24)))
    lienzo.paste(rgba, (x, y), rgba)
    return lienzo


def guardar(im: Image.Image, base: str) -> None:
    im.save(base + ".webp", "WEBP", quality=82, method=6)
    chica = im.copy()
    chica.thumbnail((800, 800), Image.Resampling.LANCZOS)
    chica.save(base + "-m.webp", "WEBP", quality=78, method=6)


if __name__ == "__main__":
    sesion = new_session("birefnet-general-lite")
    for carpeta, colores in FOTOS.items():
        destino = os.path.join(REPO, "fotos", carpeta)
        os.makedirs(destino, exist_ok=True)
        for viejo in glob.glob(os.path.join(destino, "*.webp")):  # fotos anteriores de color; las de modelo se quedan
            if not os.path.basename(viejo).startswith("modelo-"):
                os.remove(viejo)
        for color, fotos in colores.items():
            for i, (n, giro) in enumerate(fotos):
                guardar(ficha(sesion, n, giro), os.path.join(destino, slug(color) + ("-2" if i else "")))
                print(f"{carpeta}/{slug(color)}{'-2' if i else ''}  #{n}", flush=True)
