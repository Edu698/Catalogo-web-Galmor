// Catálogo Galmor Textiles — ÚNICO archivo que hay que editar para cambiar productos, precios, colores o datos de pago.
// Precios DE EJEMPLO; ya incluyen IGV.
//
// Fotos: van solas por nombre, sin escribirlas aquí.
//   fotos/<id>/<color>.webp     una por color (ej. fotos/jogger-cargo/verde-militar.webp)
//   fotos/<id>/modelo-N.webp    fotos con modelo; "modelos" dice cuántas hay. La 1 es la portada.
window.CATALOGO = {
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

  // Dirección de la hoja de Google que guarda los pedidos para el panel (pedidos.html).
  // Se obtiene al publicar herramientas/registro-pedidos.gs; mientras esté vacía, los pedidos no llegan al panel.
  registro: "",

  // Opiniones de clientes reales. Agregar así: { nombre: "Carlos M.", texto: "Muy buena tela…", estrellas: 5 },
  opiniones: [],

  // Packs: descuento automático en el carrito según cuántas prendas se lleven (porcentajes DE EJEMPLO).
  packs: [
    { prendas: 2, descuento: 5 },
    { prendas: 3, descuento: 10, etiqueta: "Más popular" },
    { prendas: 4, descuento: 15, etiqueta: "Mejor precio" },
  ],

  redes: { facebook: "#", instagram: "#", tiktok: "#" }, // pegar los enlaces cuando estén las páginas

  marcas: { zoroz: "Zoroz 77", galmor: "Galmor" },

  // colores: nombre → tono de la muestra. El primero es el que se ve al abrir el producto.
  productos: [
    {
      id: "drill-semi-pitillo", marca: "zoroz", precio: 69.9, modelos: 4,
      nombre: "Pantalón Drill Strech Semi Pitillo",
      descripcion: "El pantalón de todos los días: drill con elasticidad, corte semi pitillo que estiliza sin apretar. Viene en 16 colores.",
      colores: {
        "Negro": "#1a1a1c", "Azul noche": "#171c2e", "Azul acero": "#1f3a73", "Plomo oscuro": "#262b33",
        "Plomo intermedio": "#4a5258", "Plomo plata": "#8d97a5", "Beige": "#d6c4a6", "Caqui": "#c9ad84",
        "Hueso": "#ddd6cb", "Blanco": "#f4f4f2", "Camello": "#b0742f", "Canela": "#7a3f1f",
        "Cocoa": "#5a4337", "Marrón": "#2e211d", "Verde arena": "#4f5546", "Verde militar": "#2f3329",
      },
      tallas: ["28", "30", "32", "34", "36", "40"],
      ficha: { "Tela": "Drill strech", "Calce": "Semi pitillo", "Bolsillos": "2 delanteros sesgados · 2 traseros (uno con botón)", "Cierre": "Bragueta con cierre y botón", "Cuidado": "Lavar en frío, del revés" },
    },
    {
      id: "jean-semi-pitillo", marca: "zoroz", precio: 79.9, modelos: 4,
      nombre: "Pantalón Jean Strech Semi Pitillo",
      descripcion: "Denim strech de la línea Black Collection: cómodo desde el primer uso, corte semi pitillo y 10 lavados distintos.",
      colores: {
        "Grafito azul": "#1b2440", "Madera": "#2c3a58", "Azul cristal": "#2e4a7c", "Azul acero": "#2b4f8f",
        "Celeste oscuro": "#2f5fa8", "Celeste claro": "#7ca2cf", "Verde": "#2b4568", "Plomo claro": "#4b4f57",
        "Plomo oscuro": "#2a2c31", "Negro": "#141416",
      },
      tallas: ["28", "30", "32", "34", "36", "40"],
      ficha: { "Tela": "Denim strech", "Calce": "Semi pitillo", "Bolsillos": "5 bolsillos", "Cierre": "Cierre y botón metálico", "Cuidado": "Lavar en frío, no usar lejía" },
    },
    {
      id: "jogger-cargo", marca: "zoroz", precio: 64.9, modelos: 1,
      nombre: "Pantalón Jogger Cargo Tacto Papel",
      descripcion: "Tela tacto papel, ligera y fresca. Cintura elástica con cordón, bolsillos cargo y puño en la basta.",
      colores: {
        "Beige": "#cbbba5", "Caqui": "#c9a878", "Hueso": "#dcd9d2", "Plomo plata": "#7f8fa3",
        "Cocoa": "#6a5548", "Verde arena": "#4c5248", "Verde militar": "#2f342c", "Negro": "#19191a",
      },
      tallas: ["28", "30", "32", "34", "36", "40"],
      ficha: { "Tela": "Tacto papel", "Calce": "Jogger con puño elástico", "Cintura": "Elástica con cordón", "Bolsillos": "Cargo laterales con tapa", "Cuidado": "Lavar en frío, secar a la sombra" },
    },
    {
      id: "doble-cargo", marca: "zoroz", precio: 74.9, modelos: 1,
      nombre: "Pantalón Doble Cargo Tela Carbón",
      descripcion: "Tela carbón resistente y caída recta. Doble bolsillo cargo por pierna: estilo urbano que aguanta todo.",
      colores: {
        "Beige": "#b9a58c", "Hueso": "#cfd0cc", "Camello": "#9c6431", "Cocoa": "#7b6a5e",
        "Verde arena": "#4a4f40", "Plomo oscuro": "#2c3238", "Negro": "#161616",
      },
      tallas: ["28", "30", "32", "34", "36", "40"],
      ficha: { "Tela": "Carbón", "Calce": "Recto", "Bolsillos": "Doble cargo con tapa por pierna", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío, secar a la sombra" },
    },
    {
      id: "bermuda-cargo", marca: "zoroz", precio: 54.9, modelos: 1,
      nombre: "Bermuda Cargo Cintura Elástico Tacto Papel",
      descripcion: "Fresca para el verano: tela tacto papel, cintura elástica con cordón y bolsillos cargo. 13 colores.",
      colores: {
        "Verde arena": "#5a5f50", "Verde militar": "#2f3229", "Beige": "#c8b296", "Caqui": "#bfa27c",
        "Hueso": "#e3d9cf", "Blanco": "#f3f3f3", "Cemento": "#8e9a92", "Plomo plata": "#8f93a3",
        "Plomo oscuro": "#25272b", "Acero oscuro": "#1f2a4d", "Canela": "#6e3b1e", "Cocoa": "#4a3426",
        "Negro": "#161616",
      },
      tallas: ["28", "30", "32", "34", "36", "40"],
      ficha: { "Tela": "Tacto papel", "Calce": "Recto, sobre la rodilla", "Cintura": "Elástica con cordón", "Bolsillos": "Cargo laterales con tapa", "Cuidado": "Lavar en frío" },
    },
  ],
};
