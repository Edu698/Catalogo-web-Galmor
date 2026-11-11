// Datos de la tienda Galmor Textiles: contacto, pagos, fotos y colores.
// Nombres, tallas, precios y costos NO van aquí: se editan en el panel (pedidos.html → Precios) o subiendo el Excel.
//
// Fotos: van solas por nombre, sin escribirlas aquí.
//   fotos/<código>/<color>.webp     una por color, el pantalón en el modelo (ej. fotos/jogger-cargo/verde-militar.webp)
//   fotos/<código>/modelo-N.webp    fotos de cuerpo entero; "modelos" dice cuántas hay.
// Un producto sin fotos aquí sale en la web con la imagen "Foto pronto" y color a coordinar.
window.CATALOGO = {
  versionFotos: "202611082348", // la cambia herramientas/preparar_fotos.py; obliga al navegador a bajar las fotos nuevas
  whatsapp: "51983573288", // número de contacto (por ahora el del dueño). 51 = Perú + celular, sin espacios

  // Datos para pagar.
  pago: {
    transferencia: { banco: "BCP · Cuenta en soles", cuenta: "1919410266090", cci: "00219100941026609052", titular: "Galmor Textiles" },
    yape: { numero: "929 406 608", titular: "Eduardo Fernández" },
    // Reason: Yape y Plin son interoperables; se paga por Plin al mismo número de Yape.
    plin: { numero: "929 406 608", titular: "Eduardo Fernández" },
  },

  // Hora de corte (hora de Lima): pedidos antes de esta hora se despachan mañana; desde esta hora, pasado mañana.
  horaCorte: 17,

  // Cada pedido se guarda en el servidor de la tienda y se ve en el panel (pedidos.html).
  registro: "/api/pedidos",

  // Opiniones de clientes reales. Agregar así: { nombre: "Carlos M.", texto: "Muy buena tela…", estrellas: 5 },
  opiniones: [],

  redes: { facebook: "#", instagram: "#", tiktok: "#", youtube: "#" }, // pegar los enlaces; con "#" el ícono no se muestra

  // Datos legales de la empresa: salen en el pie, en las políticas y en el Libro de Reclamaciones.
  // Vacío = no se muestra. Completar con los datos reales (no usar datos de ejemplo).
  empresa: { razonSocial: "", ruc: "", direccion: "", correo: "" },

  marcas: { zoroz: "Zoroz 77", galmor: "Galmor" },

  // Colores de venta y fotos de cada producto, por código (el mismo del panel y del Excel).
  // colores: nombre → tono de la muestra, en orden de más vendido. Sin colores sale "Color a coordinar".
  // fotos: carpeta en fotos/ con una foto por color (fotos/<carpeta>/<color>.webp). Sin carpeta, o si falta
  //   la foto de un color, se muestra "Foto pronto". modelos: cuántas fotos de cuerpo entero (modelo-N.webp).
  // alias: color → nombre del archivo de foto, cuando no se llaman igual.
  detalles: [
    { id: "drill-clasico", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Cocoa": "#5a4337", "Azul noche": "#171c2e", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Hueso": "#ddd6cb" } },
    { id: "jogger-cargo", fotos: "jogger-cargo", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Plomo oscuro": "#2c3238", "Hueso": "#ddd6cb" } },
    { id: "bermuda-torero", fotos: "bermuda-cargo", colores: { "Blanco": "#f4f4f2", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Cocoa": "#5a4337", "Hueso": "#ddd6cb", "Plomo oscuro": "#2c3238" } },
    { id: "jean-clasico-grueso", colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Plomo lápiz": "#4a4d52", "Grafito azul": "#1b2440", "Celeste": "#7ca2cf" } },
    { id: "drill-tri-cargo", colores: { "Negro": "#1a1a1c", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238" } },
    { id: "pantalon-carbon", fotos: "doble-cargo", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Verde arena": "#4f5546", "Hueso": "#ddd6cb" } },
    { id: "bermuda-jean-clasico", colores: { "Cristal froz": "#6f8fbd", "Maíz froz": "#b9c6d6", "Celeste froz": "#a7c3e3", "Plomo oscuro froz": "#5f636b", "Madera froz": "#55698c", "Acero froz": "#6582b3", "Plomo oscuro": "#2c3238" } },
    { id: "short-corto", colores: { "Hueso": "#ddd6cb", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Plomo oscuro": "#2c3238", "Blanco": "#f4f4f2" } },
    { id: "bermuda-torero-drill", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Hueso": "#ddd6cb" } },
    { id: "drill-semi-pitillo", fotos: "drill-semi-pitillo", modelos: 2, colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Cocoa": "#5a4337", "Plomo oscuro": "#2c3238", "Verde arena": "#4f5546", "Hueso": "#ddd6cb" } },
    { id: "drill-nino", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Hueso": "#ddd6cb", "Canela": "#7a3f1f", "Cocoa": "#5a4337", "Camello": "#b0742f" } },
    { id: "bermuda-jean-sin-basta", colores: { "Cristal froz": "#6f8fbd", "Maíz froz": "#b9c6d6", "Celeste froz": "#a7c3e3", "Plomo oscuro froz": "#5f636b", "Madera froz": "#55698c", "Acero froz": "#6582b3", "Plomo oscuro": "#2c3238" } },
    { id: "tactico-cargo" },
    { id: "jean-clasico-delgado", fotos: "jean-semi-pitillo", modelos: 2, alias: {"Cristal":  "azul-cristal", "Celeste":  "celeste-claro"}, colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Plomo lápiz": "#4a4d52", "Grafito azul": "#1b2440", "Celeste": "#7ca2cf" } },
    { id: "bermuda-jean-rasgado", colores: { "Cristal froz": "#6f8fbd", "Maíz froz": "#b9c6d6", "Celeste froz": "#a7c3e3", "Plomo oscuro froz": "#5f636b", "Madera froz": "#55698c", "Acero froz": "#6582b3", "Plomo oscuro": "#2c3238" } },
  ],
};
