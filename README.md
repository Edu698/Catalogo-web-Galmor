# Catálogo web Galmor Textiles

Tienda estática (HTML + CSS + JS, sin instalar nada) para GitHub Pages.

- Bienvenida animada "GALMOR TEXTILES", filtro por marca (Galmor / Zoroz 77).
- Detalle de producto: cambio de color, arrastrar para girar, zoom, ficha técnica, marca de agua.
- Carrito con IGV desglosado; el pedido se envía por WhatsApp al 983 573 288 con nombre, DNI, celular, correo, envío, comprobante y método de pago.

## Editar productos, precios y datos de pago

Todo está en [`productos.js`](productos.js). Los precios, fichas técnicas y datos de cuenta son de ejemplo.

## Subir fotos

Las fotos originales van en `fotos-originales/`, tal como salen de la cámara (por producto, modelos, etc.).
Desde ahí se preparan las versiones web en `fotos/<id-producto>/`, que la tienda encuentra por nombre:

- `<color>.jpg` — una por color, en minúsculas y con guiones (ej. `fotos/jogger-cargo/verde-militar.jpg`).
- `modelo-1.jpg`, `modelo-2.jpg`… — fotos con modelo; en `productos.js`, `modelos` indica cuántas hay.

[`herramientas/preparar_fotos.py`](herramientas/preparar_fotos.py) genera `fotos/` desde los originales: recorta un
pantalón por color de las fotos grupales, limpia marcas ajenas (ej. "PhotoRoom") y mejora nitidez y niveles
sin cambiar el color. Requiere Pillow: `python3 herramientas/preparar_fotos.py .`

## Ver en local

Abrir `index.html` en el navegador.

## Publicar (GitHub Pages)

Repositorio → Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
El repositorio debe ser público (GitHub Pages gratis no publica repos privados).
