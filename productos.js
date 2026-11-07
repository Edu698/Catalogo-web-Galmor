// Catálogo Galmor Textiles — ÚNICO archivo que hay que editar para cambiar productos, precios, colores o fotos.
// Los precios son DE EJEMPLO (S/ 50–80) y ya incluyen IGV.
window.CATALOGO = {
  whatsapp: "51983573288", // 51 = Perú + celular, sin espacios

  // Datos para pagar. Reemplazar "POR DEFINIR" con los datos reales.
  pago: {
    transferencia: { banco: "POR DEFINIR", cuenta: "POR DEFINIR", cci: "POR DEFINIR", titular: "Galmor Textiles" },
    yape: { numero: "983 573 288", titular: "POR DEFINIR" },
    plin: { numero: "983 573 288", titular: "POR DEFINIR" },
  },

  redes: { facebook: "#", instagram: "#", tiktok: "#" }, // pegar los enlaces cuando estén las páginas

  marcas: { galmor: "Galmor", zoroz: "Zoroz 77" },

  // Color → tono para la muestra y para el dibujo cuando aún no hay foto.
  colores: {
    "Negro": "#1f1f22", "Azul noche": "#1e2a44", "Beige": "#d6c2a1", "Camello": "#b58a5a", "Caqui": "#a89a6e",
    "Verde militar": "#4b5136", "Plomo oscuro": "#4a4d52", "Cocoa": "#6b4b3a", "Hueso": "#ece5d6",
    "Celeste": "#8fb3d6", "Azul acero": "#4d6a8a", "Celeste oscuro": "#3f6489", "Marrón": "#5c3d2e",
  },

  // tipo = silueta del dibujo provisional: clasico | jean | cargo | jogger | baggy | bermuda | bermuda-cargo
  // fotos (opcional): por color, lista de fotos en orden de giro (frente, lado, espalda...). Ejemplo:
  //   fotos: { "Negro": ["fotos/drill-strech/negro-1.jpg", "fotos/drill-strech/negro-2.jpg"] }
  productos: [
    {
      id: "drill-strech", marca: "galmor", tipo: "clasico", precio: 70,
      nombre: "Pantalón Drill Strech",
      descripcion: "El clásico de todos los días: drill con elasticidad que se mueve contigo y mantiene la forma lavado tras lavado.",
      colores: ["Negro", "Azul noche", "Beige", "Camello", "Plomo oscuro", "Verde militar"],
      tallas: ["28", "30", "32", "34", "36", "38"],
      ficha: { "Tela": "Drill strech", "Composición": "97 % algodón · 3 % spandex", "Calce": "Slim recto", "Bolsillos": "2 delanteros · 2 traseros", "Cierre": "Bragueta con cierre y botón", "Cuidado": "Lavar a máquina en frío, del revés" },
      fotos: {},
    },
    {
      id: "jean-strech", marca: "galmor", tipo: "jean", precio: 80,
      nombre: "Pantalón Jean Strech",
      descripcion: "Denim strech de lavado uniforme y costuras reforzadas. Cómodo desde el primer uso.",
      colores: ["Celeste", "Azul acero", "Celeste oscuro", "Negro"],
      tallas: ["28", "30", "32", "34", "36", "38"],
      ficha: { "Tela": "Denim strech", "Composición": "98 % algodón · 2 % spandex", "Calce": "Slim", "Bolsillos": "5 bolsillos", "Cierre": "Cierre metálico y botón", "Cuidado": "Lavar en frío, no usar lejía" },
      fotos: {},
    },
    {
      id: "cargo", marca: "zoroz", tipo: "cargo", precio: 80,
      nombre: "Pantalón Cargo",
      descripcion: "Bolsillos laterales con tapa, tela resistente y caída moderna. Estilo urbano que aguanta todo.",
      colores: ["Negro", "Verde militar", "Caqui", "Beige"],
      tallas: ["28", "30", "32", "34", "36"],
      ficha: { "Tela": "Drill pesado", "Composición": "100 % algodón", "Calce": "Recto", "Bolsillos": "6 bolsillos (2 cargo con tapa)", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío, secar a la sombra" },
      fotos: {},
    },
    {
      id: "jogger", marca: "zoroz", tipo: "jogger", precio: 60,
      nombre: "Pantalón Jogger",
      descripcion: "Pretina elástica con cordón y puño en la basta. Para moverte cómodo sin perder estilo.",
      colores: ["Negro", "Plomo oscuro", "Verde militar", "Cocoa"],
      tallas: ["S", "M", "L", "XL"],
      ficha: { "Tela": "Drill strech", "Composición": "97 % algodón · 3 % spandex", "Calce": "Jogger con puño", "Bolsillos": "2 delanteros · 1 trasero", "Cintura": "Elástica con cordón", "Cuidado": "Lavar en frío, del revés" },
      fotos: {},
    },
    {
      id: "baggy", marca: "zoroz", tipo: "baggy", precio: 80,
      nombre: "Pantalón Baggy",
      descripcion: "Corte amplio y relajado, tendencia de temporada. Combina con zapatillas y polos oversize.",
      colores: ["Celeste", "Negro", "Beige"],
      tallas: ["28", "30", "32", "34", "36"],
      ficha: { "Tela": "Denim rígido", "Composición": "100 % algodón", "Calce": "Baggy (amplio)", "Bolsillos": "5 bolsillos", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío" },
      fotos: {},
    },
    {
      id: "chino-tacto", marca: "galmor", tipo: "clasico", precio: 70,
      nombre: "Pantalón Chino Tacto",
      descripcion: "Acabado suave al tacto, ideal para oficina o salidas. Elegancia sin esfuerzo.",
      colores: ["Azul noche", "Hueso", "Camello", "Plomo oscuro"],
      tallas: ["28", "30", "32", "34", "36", "38"],
      ficha: { "Tela": "Chino acabado tacto durazno", "Composición": "97 % algodón · 3 % spandex", "Calce": "Slim", "Bolsillos": "2 sesgados · 2 traseros con botón", "Cierre": "Cierre y botón", "Cuidado": "Planchar a temperatura media" },
      fotos: {},
    },
    {
      id: "bermuda-chino", marca: "galmor", tipo: "bermuda", precio: 50,
      nombre: "Bermuda Clásico Chino",
      descripcion: "Fresca y bien acabada, para el verano limeño. Largo sobre la rodilla.",
      colores: ["Beige", "Azul noche", "Camello", "Negro"],
      tallas: ["28", "30", "32", "34", "36"],
      ficha: { "Tela": "Drill strech", "Composición": "97 % algodón · 3 % spandex", "Calce": "Recto, sobre la rodilla", "Bolsillos": "4 bolsillos", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío" },
      fotos: {},
    },
    {
      id: "bermuda-cargo", marca: "zoroz", tipo: "bermuda-cargo", precio: 50,
      nombre: "Bermuda Cargo",
      descripcion: "Bolsillos cargo laterales y tela resistente. Práctica para todo el día.",
      colores: ["Verde militar", "Caqui", "Negro"],
      tallas: ["28", "30", "32", "34", "36"],
      ficha: { "Tela": "Drill", "Composición": "100 % algodón", "Calce": "Recto", "Bolsillos": "6 bolsillos", "Cierre": "Cierre y botón", "Cuidado": "Lavar en frío" },
      fotos: {},
    },
  ],
};
