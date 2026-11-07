"""Extrae logos con fondo transparente desde las referencias PNG y los agranda con bordes nítidos."""
import sys
import numpy as np
from PIL import Image, ImageFilter

ASSETS, SALIDA = sys.argv[1], sys.argv[2]


def recortar(ruta, caja, escala, nombre):
    im = Image.open(ruta).convert("RGB").crop(caja)
    im = im.resize((im.width * escala, im.height * escala), Image.Resampling.LANCZOS)
    a = np.asarray(im).astype(float)
    # Opacidad = qué tan lejos está del blanco; se endurece para bordes limpios.
    tinta = 255 - a.min(axis=2)
    alfa = np.clip((tinta - 40) * 2.2, 0, 255).astype(np.uint8)
    alfa = np.asarray(Image.fromarray(alfa).filter(ImageFilter.GaussianBlur(0.6)))
    rgba = np.dstack([a.astype(np.uint8), alfa])
    out = Image.fromarray(rgba, "RGBA")
    out = out.crop(out.getbbox())
    out.save(f"{SALIDA}/{nombre}.png", optimize=True)
    print(nombre, out.size)


recortar(f"{ASSETS}/bolsa-zoroz77.png", (55, 85, 408, 495), 4, "logo-zoroz77")
recortar(f"{ASSETS}/cartoneria-galmor.png", (185, 395, 420, 470), 5, "logo-galmor")
