"""Fotos del catálogo con fondo blanco (dueño, 2026-11-21: "profesional, Full HD, vertical, que contraste con la página").

Uso: python3 herramientas/fotos_fondo_blanco.py CARPETA_FOTOS REPO [CARPETA_REVISION] [producto ...]
  CARPETA_FOTOS: fotos BEESER-N.jpg de la sesión (Drive "Fotos Galmor"). Requiere: pillow numpy opencv "rembg[cpu]".
  CARPETA_REVISION ("-" = ninguna): guarda cada recorte sobre fondo oscuro, para ver restos de piso.
  producto: carpeta de fotos/ (ej. jogger-cargo); sin productos, se hacen todos.

Por cada color: <color>.webp (frente) y <color>-2.webp (espalda o doblado), 1920 x 1920, prenda vertical (cintura
arriba) sobre blanco con sombra suave; más <color>-m.webp y <color>-2-m.webp de 800 px para tarjetas y miniaturas.
Los colores no se tocan: solo se quita el fondo. Las fotos con modelo (modelo-N.webp) se conservan.
"""
import glob
import math
import os
import subprocess
import sys
import unicodedata

import cv2
import numpy as np
from PIL import Image, ImageFilter

LADO = 1920
# Reason (dueño, 2026-11-22: "el hueso tiene partes mal recortadas"): el modelo "lite" dejaba el borde con dientes en
# prendas claras sobre el piso claro. El completo recorta limpio, pero usa mucha memoria: una foto por proceso.
MODELO = "birefnet-general"

# carpeta en fotos/ -> {color: [(foto, giro), (foto, giro)]}: frente y segunda foto (espalda o doblado).
# giro = grados (antihorario) que dejan la cintura arriba, a ojo; enderezar() lo afina hasta ±25°.
# Colores y números elegidos de las carpetas del dueño en Drive; él revisa los colores.
FOTOS = {
    "drill-semi-pitillo": {"Azul noche": [(209, 90), (207, 90)], "Beige": [(201, 0), (199, 0)],
                           "Cocoa": [(217, 90), (215, 80)], "Hueso": [(205, 90), (203, 0)],
                           "Negro": [(225, 90), (223, 85)], "Plomo oscuro": [(221, 90), (219, 75)],
                           "Verde arena": [(213, 90), (211, 85)]},
    "drill-clasico": {"Azul noche": [(242, 90), (240, 90)], "Beige": [(238, 90), (237, 90)],
                      "Cocoa": [(235, 90), (233, 90)], "Hueso": [(255, 90), (252, 90)], "Negro": [(229, 0), (227, 90)],
                      "Plomo oscuro": [(250, 90), (248, 90)], "Verde arena": [(246, 0), (244, 90)]},
    "drill-tri-cargo": {"Beige": [(79, 90), (81, 70)], "Cocoa": [(68, 90), (73, 75)], "Negro": [(83, 90), (84, 95)],
                        "Plomo oscuro": [(86, 90), (88, 0)], "Verde arena": [(75, 90), (77, 80)]},
    # Dueño (2026-11-21): el que se llamó "Azul oscuro" es Plomo plata.
    "doble-cargo": {"Beige": [(139, 90), (137, 90)], "Camello": [(106, 90), (108, 80)], "Cocoa": [(94, 90), (96, 80)],
                    "Plomo plata": [(110, 0), (112, 75)], "Hueso": [(135, 0), (104, 80)], "Negro": [(120, 0), (92, 85)],
                    "Plomo oscuro": [(123, 90), (125, 90)], "Verde arena": [(98, 90), (100, 80)]},
    # Jogger: la foto vertical va primero. En la carpeta hay dos tonos oscuros: negro puro (278-281) y uno azulado
    # (145-148, 262-265), que queda como Plomo oscuro hasta que el dueño confirme el nombre.
    "jogger-cargo": {"Beige": [(268, 90), (266, 45)], "Cocoa": [(274, 0), (276, 70)], "Hueso": [(143, 90), (258, 90)],
                     "Negro": [(278, 90), (280, 50)], "Plomo oscuro": [(147, 0), (264, 90)],
                     "Verde arena": [(272, 0), (270, 50)]},
    # Dueño (2026-11-21): el #165 "no es celeste"; queda como Plomo lápiz hasta que él confirme el nombre.
    # Cristal: su segunda foto (152/153) pesa más de 10 MB en Drive y aún no se pudo bajar.
    "jean-clasico-grueso": {"Cristal": [(150, 0)], "Grafito azul": [(155, 90), (154, 75)],
                            "Plomo lápiz": [(165, 90), (163, 85)], "Negro": [(160, 90), (157, 75)]},
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
    """Deja verticales los bordes largos de la prenda (las costuras de la pierna), hasta ±25°.

    Reason (dueño, 2026-11-22: "la segunda foto sale horizontal o en diagonal"): en un pantalón doblado el eje
    principal de la figura no dice hacia dónde va la pierna; sus bordes rectos sí. En un pantalón abierto en "V" las
    costuras se inclinan igual a cada lado y el promedio queda en cero.
    """
    mascara = (np.asarray(rgba)[..., 3] > 128).astype(np.uint8)
    contornos, _ = cv2.findContours(mascara, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contornos:
        return rgba
    c = max(contornos, key=cv2.contourArea)
    pol = cv2.approxPolyDP(c, 0.008 * cv2.arcLength(c, True), True)[:, 0, :].astype(float)
    suma = peso = 0.0
    for p, q in zip(pol, np.roll(pol, -1, axis=0)):
        dx, dy = q - p
        ang = (math.degrees(math.atan2(dx, dy)) + 90) % 180 - 90  # 0 = borde vertical
        if abs(ang) <= 25:
            largo = math.hypot(dx, dy)
            suma, peso = suma + ang * largo, peso + largo
    if not peso or abs(suma / peso) < 0.5:
        return rgba
    return rgba.rotate(-suma / peso, expand=True, resample=Image.Resampling.BICUBIC)


def ficha(sesion, n: int, giro: int, revision: str | None = None) -> Image.Image:
    from rembg import remove

    im = Image.open(os.path.join(ORIGEN, f"BEESER-{n}.jpg")).convert("RGB")
    rgba = remove(im, session=sesion, post_process_mask=True)
    rgba = enderezar(rgba.rotate(giro, expand=True, resample=Image.Resampling.BICUBIC))
    rgba = rgba.crop(rgba.getbbox())
    rgba.thumbnail((int(LADO * 0.80), int(LADO * 0.90)), Image.Resampling.LANCZOS)
    # Nitidez suave en la tela (dueño: "mejorar la calidad"); el color no cambia.
    r, g, b, a = rgba.split()
    rgba = Image.merge("RGB", (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=3))
    rgba.putalpha(a)
    if revision:
        oscuro = Image.new("RGB", rgba.size, "#20262e")
        oscuro.paste(rgba, (0, 0), rgba)
        oscuro.save(os.path.join(revision, f"BEESER-{n}.jpg"), quality=80)
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
    ORIGEN, REPO = sys.argv[1], sys.argv[2]
    if len(sys.argv) > 3 and sys.argv[3] == "--una":  # proceso hijo: una sola foto (libera la memoria al terminar)
        carpeta, color, i, revision = sys.argv[4], sys.argv[5], int(sys.argv[6]), sys.argv[7]
        from rembg import new_session

        n, giro = FOTOS[carpeta][color][i]
        base = os.path.join(REPO, "fotos", carpeta, slug(color) + ("-2" if i else ""))
        guardar(ficha(new_session(MODELO), n, giro, None if revision == "-" else revision), base)
        sys.exit(0)
    revision = sys.argv[3] if len(sys.argv) > 3 else "-"
    productos = sys.argv[4:] or list(FOTOS)
    for carpeta in productos:
        destino = os.path.join(REPO, "fotos", carpeta)
        os.makedirs(destino, exist_ok=True)
        esperadas = {slug(c) + ("-2" if i else "") + s for c, fs in FOTOS[carpeta].items() for i in range(len(fs))
                     for s in (".webp", "-m.webp")}
        for viejo in glob.glob(os.path.join(destino, "*.webp")):  # sobran: colores que ya no están (modelo-N se queda)
            if not os.path.basename(viejo).startswith("modelo-") and os.path.basename(viejo) not in esperadas:
                os.remove(viejo)
        for color, fotos in FOTOS[carpeta].items():
            for i, (n, _) in enumerate(fotos):
                r = subprocess.run([sys.executable, __file__, ORIGEN, REPO, "--una", carpeta, color, str(i), revision],
                                   capture_output=True, text=True)
                print(f"{carpeta}/{slug(color)}{'-2' if i else ''}  #{n}  {'ok' if r.returncode == 0 else 'ERROR ' + r.stderr[-300:]}", flush=True)
