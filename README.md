# Catálogo web Galmor Textiles

Tienda estática (HTML + CSS + JS, sin instalar nada) para GitHub Pages.

- Bienvenida animada "GALMOR TEXTILES", filtro por marca (Galmor / Zoroz 77).
- Detalle de producto: cambio de color, arrastrar para girar, zoom, ficha técnica, marca de agua.
- Carrito con IGV desglosado; el pedido se envía por WhatsApp al 983 573 288 con nombre, DNI, celular, correo, envío, comprobante y método de pago.

## Editar productos, precios y datos de pago

Todo está en [`productos.js`](productos.js). Los precios, fichas técnicas y datos de cuenta son de ejemplo.

## Subir fotos

Las fotos originales van en `fotos-originales/`. [`herramientas/preparar_fotos.py`](herramientas/preparar_fotos.py)
genera `fotos/<id-producto>/`:

- `<color>.webp`: el pantalón en el modelo, en cada color. Se toma la foto "de la cintura para abajo" del producto;
  la IA (rembg, `u2net_cloth_seg`) detecta el pantalón y solo él se pinta con el tono de `productos.js`.
- `modelo-N.webp`: fotos de cuerpo entero; en `productos.js`, `modelos` indica cuántas hay.

Requiere `pip install pillow numpy opencv-python-headless "rembg[cpu]"`; se ejecuta con
`python3 herramientas/preparar_fotos.py .`

## Ver en local

Abrir `index.html` en el navegador.

## Publicar (GitHub Pages)

Repositorio → Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
El repositorio debe ser público (GitHub Pages gratis no publica repos privados).
