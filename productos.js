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

  redes: { facebook: "#", instagram: "#", tiktok: "#" }, // pegar los enlaces cuando estén las páginas

  marcas: { zoroz: "Zoroz 77", galmor: "Galmor" },

  // Fotos y textos de cada producto, por código (el mismo código del panel y del Excel).
  // colores: nombre → tono de la muestra. El primero es el que se ve al abrir el producto.
  detalles: [
    {
      id: "drill-semi-pitillo", modelos: 2,
      descripcion: "El pantalón de todos los días: drill con elasticidad, corte semi pitillo que estiliza sin apretar. Viene en 16 colores.",
      colores: {
        "Negro": "#1a1a1c", "Azul noche": "#171c2e", "Azul acero": "#2b3a5c", "Plomo oscuro": "#262b33",
        "Plomo intermedio": "#4a5258", "Plomo plata": "#8d97a5", "Beige": "#d6c4a6", "Caqui": "#c9ad84",
        "Hueso": "#ddd6cb", "Blanco": "#f4f4f2", "Camello": "#b0742f", "Canela": "#7a3f1f",
        "Cocoa": "#5a4337", "Marrón": "#2e211d", "Verde arena": "#4f5546", "Verde militar": "#2f3329",
      },
      ficha: { "Tela": "Drill strech", "Calce": "Semi pitillo", "Bolsillos": "2 delanteros sesgados · 2 traseros (uno con botón)", "Cierre": "Bragueta con cierre y botón", "Cuidado": "Lavar en frío, del revés" },
    },
    {
      id: "jean-semi-pitillo", modelos: 2,
      descripcion: "Denim strech de la línea Black Collection: cómodo desde el primer uso, corte semi pitillo y 10 lavados distintos.",
      colores: {
        "Grafito azul": "#1b2440", "Madera": "#2c3a58", "Azul cristal": "#2e4a7c", "Azul acero": "#2b4f8f",
        "Celeste oscuro": "#2f5fa8", "Celeste claro": "#7ca2cf", "Verde": "#2b4568", "Plomo claro": "#4b4f57",
        "Plomo oscuro": "#2a2c31", "Negro": "#141416",
      },
      ficha: { "Tela": "Denim strech", "Calce": "Semi pitillo", "Bolsillos": "5 bolsillos", "Cierre": "Cierre y botón metálico", "Cuidado": "Lavar en frío, no usar lejía" },
    },
    {
      id: "jogger-cargo", modelos: 0,
      descripcion: "Tela paper touch, ligera y fresca. Cintura elástica con cordón, bolsillos cargo y puño en la basta.",
      colores: {
        "Beige": "#cbbba5", "Caqui": "#c9a878", "Hueso": "#dcd9d2", "Plomo plata": "#7f8fa3",
        "Cocoa": "#6a5548", "Verde arena": "#4c5248", "Verde militar": "#2f342c", "Negro": "#19191a",
      },
      ficha: { "Tela": "Paper touch", "Calce": "Jogger con puño elástico", "Cintura": "Elástica con cordón", "Bolsillos": "Cargo laterales con tapa", "Cuidado": "Lavar en frío, secar a la sombra" },
    },
    {
      id: "doble-cargo", modelos: 0,
      descripcion: "Tela carbón resistente y caída recta. Doble bolsillo cargo por pierna: estilo urbano que aguanta todo.",
      colores: {
        "Beige": "#b9a58c", "Hueso": "#cfd0cc", "Camello": "#9c6431", "Cocoa": "#7b6a5e",
        "Verde arena": "#4a4f40", "Plomo oscuro": "#2c3238", "Negro": "#161616",
      },
      ficha: { "Tela": "Carbón", "Calce": "Recto", "Bolsillos": "Doble cargo con tapa por pierna", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío, secar a la sombra" },
    },
    {
      id: "bermuda-cargo", modelos: 0,
      descripcion: "Fresca para el verano: tela paper touch, cintura elástica con cordón y bolsillos cargo. 13 colores.",
      colores: {
        "Verde arena": "#5a5f50", "Verde militar": "#2f3229", "Beige": "#c8b296", "Caqui": "#bfa27c",
        "Hueso": "#e3d9cf", "Blanco": "#f3f3f3", "Cemento": "#8e9a92", "Plomo plata": "#8f93a3",
        "Plomo oscuro": "#25272b", "Acero oscuro": "#1f2a4d", "Canela": "#6e3b1e", "Cocoa": "#4a3426",
        "Negro": "#161616",
      },
      ficha: { "Tela": "Paper touch", "Calce": "Recto, sobre la rodilla", "Cintura": "Elástica con cordón", "Bolsillos": "Cargo laterales con tapa", "Cuidado": "Lavar en frío" },
    },
  ],
};
