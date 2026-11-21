// Datos de la tienda Galmor Textiles: contacto, pagos, fotos y colores.
// Nombres, tallas, precios y costos NO van aquí: se editan en el panel (pedidos.html → Precios) o subiendo el Excel.
//
// Fotos: van solas por nombre, sin escribirlas aquí.
//   fotos/<código>/<color>.webp     una por color, el pantalón en el modelo (ej. fotos/jogger-cargo/verde-militar.webp)
//   fotos/<código>/modelo-N.webp    fotos de cuerpo entero; "modelos" dice cuántas hay.
// Un producto sin fotos aquí sale en la web con la imagen "Foto pronto" y color a coordinar.
window.CATALOGO = {
  versionFotos: "202611211200", // la cambia herramientas/preparar_fotos.py; obliga al navegador a bajar las fotos nuevas
  whatsapp: "51908341818", // WhatsApp Business de Galmor. 51 = Perú + celular, sin espacios. Es el único lugar donde se escribe.

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

  // Pegar los enlaces; con "#" el ícono no se muestra. Los usan el pie del catálogo y enlaces.html.
  redes: {
    facebook: "https://www.facebook.com/profile.php?id=61596384419335",
    instagram: "https://www.instagram.com/galmortextiles.oficial/",
    tiktok: "https://www.tiktok.com/@galmor.textilesoficial",
    youtube: "#",
  },

  // Datos legales de la empresa: salen en el pie, en las políticas y en el Libro de Reclamaciones.
  // Vacío = no se muestra. Completar con los datos reales (no usar datos de ejemplo).
  empresa: { razonSocial: "", ruc: "", direccion: "", correo: "" },

  marcas: { zoroz: "Zoroz 77", galmor: "Galmor" },

  // Colores de venta y fotos de cada producto, por código (el mismo del panel y del Excel).
  // colores: nombre → tono de la muestra, en orden de más vendido. Sin colores sale "Color a coordinar".
  // fotos: carpeta en fotos/ con una foto por color (fotos/<carpeta>/<color>.webp). Sin carpeta, o si falta
  //   la foto de un color, se muestra "Foto pronto". modelos: cuántas fotos de cuerpo entero (modelo-N.webp).
  // alias: color → nombre del archivo de foto, cuando no se llaman igual.
  // dos: colores con segunda foto (<color>-2.webp, espalda o detalle). descripcion: tela, corte y detalles.
  // Fotos con fondo blanco (dueño, 2026-11-21): herramientas/fotos_fondo_blanco.py. Solo colores con foto.
  detalles: [
    { id: "drill-semi-pitillo", fotos: "drill-semi-pitillo", modelos: 2, dos: ["Azul noche", "Hueso", "Verde arena"],
      descripcion: "Drill stretch, cómodo y flexible. Corte semi pitillo. Bolsillos delanteros sesgados y bolsillo trasero con botón.",
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Cocoa": "#5a4337", "Plomo oscuro": "#2c3238", "Verde arena": "#4f5546", "Hueso": "#ddd6cb" } },
    { id: "drill-clasico", fotos: "drill-clasico", dos: ["Negro", "Beige", "Cocoa", "Azul noche", "Verde arena", "Plomo oscuro", "Hueso"],
      descripcion: "Drill rígido, firme y resistente. Corte recto. 5 bolsillos con parche de cuero atrás.",
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Cocoa": "#5a4337", "Azul noche": "#171c2e", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Hueso": "#ddd6cb" } },
    { id: "drill-tri-cargo", fotos: "drill-tri-cargo", dos: ["Cocoa"],
      descripcion: "Drill stretch. Doble bolsillo cargo con tapa. Pretina con elástico y cierre.",
      colores: { "Negro": "#1a1a1c", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238" } },
    { id: "pantalon-carbon", fotos: "doble-cargo", dos: ["Negro", "Beige", "Plomo oscuro", "Cocoa", "Verde arena", "Hueso", "Camello", "Azul oscuro"],
      descripcion: "Tela Paper Touch: ligera, fresca y suave. Doble bolsillo cargo con tapa. Corte recto.",
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Verde arena": "#4f5546", "Hueso": "#ddd6cb", "Camello": "#c4914f", "Azul oscuro": "#5f7a88" } },
    { id: "jogger-cargo", fotos: "jogger-cargo", dos: ["Negro", "Beige", "Verde arena", "Cocoa", "Hueso"],
      descripcion: "Tela Paper Touch. Cintura elástica con cordón, puño elástico y doble bolsillo cargo.",
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Hueso": "#ddd6cb" } },
    { id: "jean-clasico-grueso", fotos: "jean-clasico-grueso", dos: ["Negro", "Grafito azul", "Celeste"],
      descripcion: "Jean de 14 onzas, resistente. Corte recto. 5 bolsillos.",
      colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Grafito azul": "#1b2440", "Celeste": "#7ca2cf" } },
    { id: "bermuda-torero", fotos: "bermuda-torero", dos: ["Beige", "Cocoa", "Hueso", "Negro", "Plomo oscuro", "Verde arena"],
      descripcion: "Tela Paper Touch. Largo debajo de la rodilla. Bolsillos normales adelante y atrás.",
      colores: { "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Cocoa": "#5a4337", "Hueso": "#ddd6cb", "Plomo oscuro": "#2c3238" } },
    { id: "bermuda-jean-clasico", fotos: "bermuda-jean-clasico", dos: ["Acero", "Azul medio", "Celeste", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Basta cosida y 5 bolsillos.",
      colores: { "Acero": "#6582b3", "Azul medio": "#3f6fa8", "Celeste": "#a7c3e3", "Plomo oscuro": "#5f636b" } },
    { id: "bermuda-jean-sin-basta", fotos: "bermuda-jean-sin-basta", dos: ["Cristal", "Madera", "Maíz", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Borde sin coser, estilo juvenil.",
      colores: { "Cristal": "#6f8fbd", "Maíz": "#b9c6d6", "Madera": "#55698c", "Plomo oscuro": "#5f636b" } },
    { id: "bermuda-jean-rasgado", fotos: "bermuda-jean-rasgado", dos: ["Celeste", "Madera", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Rasgados de moda.",
      colores: { "Celeste": "#a7c3e3", "Plomo oscuro": "#5f636b", "Madera": "#55698c" } },
    // Ocultos en la web (sin fotos, dueño 2026-11-21): se vuelven a mostrar desde el panel cuando tengan fotos.
    { id: "short-corto", colores: { "Hueso": "#ddd6cb", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Plomo oscuro": "#2c3238", "Blanco": "#f4f4f2" } },
    { id: "bermuda-torero-drill", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Hueso": "#ddd6cb" } },
    { id: "drill-nino", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Hueso": "#ddd6cb", "Canela": "#7a3f1f", "Cocoa": "#5a4337", "Camello": "#b0742f" } },
    { id: "tactico-cargo" },
    { id: "jean-clasico-delgado", fotos: "jean-semi-pitillo", modelos: 2, alias: {"Cristal":  "azul-cristal", "Celeste":  "celeste-claro"}, colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Plomo lápiz": "#4a4d52", "Grafito azul": "#1b2440", "Celeste": "#7ca2cf" } },
  ],
};
