// Datos de la tienda Galmor Textiles: contacto, pagos, fotos y colores.
// Nombres, tallas, precios y costos NO van aquí: se editan en el panel (pedidos.html → Precios) o subiendo el Excel.
//
// Fotos: van solas por nombre, sin escribirlas aquí.
//   fotos/<código>/<color>.webp     una por color, el pantalón en el modelo (ej. fotos/jogger-cargo/verde-militar.webp)
//   fotos/<código>/modelo-N.webp    fotos de cuerpo entero; "modelos" dice cuántas hay.
// Un producto sin fotos aquí sale en la web con la imagen "Foto pronto" y color a coordinar.
window.CATALOGO = {
  versionFotos: "202611211900", // la cambia herramientas/preparar_fotos.py; obliga al navegador a bajar las fotos nuevas
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
  // portada: color que muestra la tarjeta en el catálogo (para que no salga todo en negro); sin portada, el primero.
  // dos: colores con segunda foto (<color>-2.webp, espalda o detalle). descripcion: tela, corte y detalles.
  // Fotos con fondo blanco (dueño, 2026-11-21): herramientas/fotos_fondo_blanco.py. Solo colores con foto.
  detalles: [
    // Orden = de más a menos vendido (ventas 2026, dueño 2026-11-21): así salen en "Recomendados".
    // ficha: lo que sale en "Ficha técnica" (la tela del panel se reemplaza por la de aquí).
    { id: "drill-semi-pitillo", portada: "Beige", fotos: "drill-semi-pitillo", modelos: { "Plomo oscuro": [1], "Beige": [2] }, // cada foto con modelo, solo en su color dos: ["Azul noche", "Hueso", "Verde arena"],
      descripcion: "Drill stretch, cómodo y flexible. Corte semi pitillo. Bolsillos delanteros sesgados y bolsillo trasero con botón.",
      ficha: { "Tela": "Drill stretch (estira)", "Corte": "Semi pitillo: ajustado sin apretar", "Bolsillos": "2 delanteros sesgados y 2 traseros con botón", "Cierre": "Cierre y botón", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Cocoa": "#5a4337", "Plomo oscuro": "#2c3238", "Verde arena": "#4f5546", "Hueso": "#ddd6cb" } },
    { id: "drill-clasico", portada: "Azul noche", fotos: "drill-clasico", dos: ["Negro", "Beige", "Cocoa", "Azul noche", "Verde arena", "Plomo oscuro", "Hueso"],
      descripcion: "Drill rígido, firme y resistente. Corte recto. 5 bolsillos con parche de cuero atrás.",
      ficha: { "Tela": "Drill rígido", "Corte": "Recto clásico", "Bolsillos": "5 bolsillos (estilo jean)", "Detalle": "Parche de cuero en la pretina trasera", "Cierre": "Cierre y botón", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Cocoa": "#5a4337", "Azul noche": "#171c2e", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Hueso": "#ddd6cb" } },
    { id: "bermuda-torero", fotos: "bermuda-torero", dos: ["Beige", "Cocoa", "Hueso", "Negro", "Plomo oscuro", "Verde arena"],
      descripcion: "Tela Paper Touch. Largo debajo de la rodilla. Bolsillos normales adelante y atrás.",
      ficha: { "Tela": "Paper Touch: ligera, fresca y suave", "Largo": "Debajo de la rodilla", "Bolsillos": "2 delanteros y 2 traseros", "Cierre": "Cierre y botón", "Confección": "Galmor · Lima, Perú" },
      colores: { "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Cocoa": "#5a4337", "Hueso": "#ddd6cb", "Plomo oscuro": "#2c3238" } },
    { id: "jogger-cargo", portada: "Hueso", fotos: "jogger-cargo", dos: ["Negro", "Beige", "Verde arena", "Cocoa", "Plomo oscuro", "Hueso"],
      descripcion: "Tela Paper Touch. Cintura elástica con cordón, puño elástico y doble bolsillo cargo.",
      ficha: { "Tela": "Paper Touch: ligera, fresca y suave", "Corte": "Jogger con puño elástico en el tobillo", "Cintura": "Elástica con cordón", "Bolsillos": "Doble bolsillo cargo con tapa", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Plomo oscuro": "#2c3238", "Hueso": "#ddd6cb" } },
    { id: "pantalon-carbon", portada: "Camello", fotos: "doble-cargo", dos: ["Negro", "Beige", "Plomo oscuro", "Cocoa", "Verde arena", "Hueso", "Camello", "Plomo plata"],
      descripcion: "Tela Paper Touch: ligera, fresca y suave. Doble bolsillo cargo con tapa. Corte recto.",
      ficha: { "Tela": "Paper Touch: ligera, fresca y suave", "Corte": "Recto", "Bolsillos": "Doble bolsillo cargo con tapa", "Cierre": "Cierre y botón", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Verde arena": "#4f5546", "Hueso": "#ddd6cb", "Camello": "#c4914f", "Plomo plata": "#7f8c95" } },
    { id: "drill-tri-cargo", portada: "Verde arena", fotos: "drill-tri-cargo", dos: ["Negro", "Verde arena", "Cocoa", "Beige", "Plomo oscuro"],
      descripcion: "Drill stretch. Doble bolsillo cargo con tapa. Pretina con elástico y cierre.",
      ficha: { "Tela": "Drill stretch (estira)", "Corte": "Recto", "Cintura": "Pretina con elástico, cordón y cierre", "Bolsillos": "Doble bolsillo cargo con tapa", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Verde arena": "#4f5546", "Cocoa": "#5a4337", "Beige": "#d6c4a6", "Plomo oscuro": "#2c3238" } },
    { id: "jean-clasico-grueso", portada: "Cristal", fotos: "jean-clasico-grueso", dos: ["Negro", "Grafito azul", "Plomo lápiz"],
      descripcion: "Jean de 14 onzas, resistente. Corte recto. 5 bolsillos.",
      ficha: { "Tela": "Jean grueso de 14 onzas", "Corte": "Recto clásico", "Bolsillos": "5 bolsillos", "Detalle": "Parche de cuero en la pretina trasera", "Cierre": "Cierre y botón", "Confección": "Galmor · Lima, Perú" },
      colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Grafito azul": "#1b2440", "Plomo lápiz": "#3d4f63" } },
    { id: "bermuda-jean-clasico", fotos: "bermuda-jean-clasico", dos: ["Acero", "Azul medio", "Celeste", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Basta cosida y 5 bolsillos.",
      ficha: { "Tela": "Jean", "Lavado": "Frosteado / focalizado", "Basta": "Cosida", "Bolsillos": "5 bolsillos", "Confección": "Galmor · Lima, Perú" },
      colores: { "Acero": "#6582b3", "Azul medio": "#3f6fa8", "Celeste": "#a7c3e3", "Plomo oscuro": "#5f636b" } },
    { id: "bermuda-jean-sin-basta", fotos: "bermuda-jean-sin-basta", dos: ["Cristal", "Madera", "Maíz", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Borde sin coser, estilo juvenil.",
      ficha: { "Tela": "Jean", "Lavado": "Frosteado / focalizado", "Basta": "Sin coser, con hilos sueltos", "Detalle": "Rasgados de moda", "Confección": "Galmor · Lima, Perú" },
      colores: { "Cristal": "#6f8fbd", "Maíz": "#b9c6d6", "Madera": "#55698c", "Plomo oscuro": "#5f636b" } },
    { id: "bermuda-jean-rasgado", fotos: "bermuda-jean-rasgado", dos: ["Celeste", "Madera", "Plomo oscuro"],
      descripcion: "Jean con lavado frosteado / focalizado. Rasgados de moda.",
      ficha: { "Tela": "Jean", "Lavado": "Frosteado / focalizado", "Basta": "Cosida", "Detalle": "Rasgados de moda adelante", "Confección": "Galmor · Lima, Perú" },
      colores: { "Celeste": "#a7c3e3", "Plomo oscuro": "#5f636b", "Madera": "#55698c" } },
    // Ocultos en la web (sin fotos, dueño 2026-11-21): se vuelven a mostrar desde el panel cuando tengan fotos.
    { id: "short-corto", colores: { "Hueso": "#ddd6cb", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Negro": "#1a1a1c", "Plomo oscuro": "#2c3238", "Blanco": "#f4f4f2" } },
    { id: "bermuda-torero-drill", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Verde arena": "#4f5546", "Plomo oscuro": "#2c3238", "Cocoa": "#5a4337", "Hueso": "#ddd6cb" } },
    { id: "drill-nino", colores: { "Negro": "#1a1a1c", "Beige": "#d6c4a6", "Azul noche": "#171c2e", "Hueso": "#ddd6cb", "Canela": "#7a3f1f", "Cocoa": "#5a4337", "Camello": "#b0742f" } },
    { id: "tactico-cargo" },
    { id: "jean-clasico-delgado", fotos: "jean-semi-pitillo", modelos: 2, alias: {"Cristal":  "azul-cristal", "Celeste":  "celeste-claro"}, colores: { "Negro": "#1a1a1c", "Cristal": "#2e4a7c", "Plomo lápiz": "#4a4d52", "Grafito azul": "#1b2440", "Celeste": "#7ca2cf" } },
  ],
};
