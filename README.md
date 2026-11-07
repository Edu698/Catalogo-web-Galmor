# Catálogo web Galmor Textiles

Tienda estática (HTML + CSS + JS, sin instalar nada) para GitHub Pages.

- Bienvenida animada "GALMOR TEXTILES", filtro por marca (Galmor / Zoroz 77).
- Detalle de producto: cambio de color, arrastrar para girar, zoom, ficha técnica, marca de agua.
- Carrito con IGV desglosado; el pedido se envía por WhatsApp al 983 573 288 con nombre, DNI, celular, correo, envío, comprobante y método de pago.

## Editar productos, precios y datos de pago

Todo está en [`productos.js`](productos.js). Los precios, fichas técnicas y datos de cuenta son de ejemplo.

## Subir fotos

Las fotos originales van en `fotos-originales/`, tal como salen de la cámara (por producto, modelos, etc.).
Desde ahí se preparan las versiones web en `fotos/`:

1. Crear una carpeta por producto: `fotos/<id-producto>/` (ej. `fotos/cargo/`).
2. Nombrar las fotos por color y orden de giro: `negro-1.jpg` (frente), `negro-2.jpg` (lado), `negro-3.jpg` (espalda)…
3. En `productos.js`, en ese producto: `fotos: { "Negro": ["fotos/cargo/negro-1.jpg", "fotos/cargo/negro-2.jpg", "fotos/cargo/negro-3.jpg"] }`.

Mientras un color no tenga fotos se muestra un dibujo del pantalón en ese color. Más fotos por color = giro más fluido.

## Ver en local

Abrir `index.html` en el navegador.

## Publicar (GitHub Pages)

Repositorio → Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
El repositorio debe ser público (GitHub Pages gratis no publica repos privados).
