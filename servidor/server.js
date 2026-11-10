// Servidor de la tienda (sin dependencias, Node 24): sirve la página y guarda los pedidos para el panel.
//   GET  /...                    archivos de la tienda (carpeta sitio)
//   POST /api/pedidos            la tienda registra un pedido (público, validado, sin duplicados)
//   GET  /api/panel/pedidos      panel: lista de pedidos            (cabecera x-clave)
//   POST /api/panel/estado       panel: {numero, estado}            (cabecera x-clave)
//   POST /api/pedidos/imagen?n= la tienda sube la imagen PNG del pedido (una vez, hasta 15 min después)
//   GET  /pedido/<n>-<clave>.png  imagen del pedido (link del WhatsApp); ?descargar=1 la baja como archivo
//   GET  /api/catalogo           productos y precios de venta para la tienda (sin costo)
//   GET  /api/panel/catalogo     panel: productos con costo              (cabecera x-clave)
//   POST /api/panel/catalogo     panel: {productos} reemplaza la lista    (cabecera x-clave)
//   GET  /api/seguimiento?n=&dni=  el cliente ve el estado de su pedido (número + DNI)
//   POST /api/opiniones          el cliente deja una opinión; queda oculta hasta aprobarla
//   GET  /api/opiniones          opiniones aprobadas (se muestran en la tienda)
//   GET  /api/panel/opiniones    panel: todas las opiniones          (cabecera x-clave)
//   POST /api/panel/opinion      panel: {id, accion: aprobar|ocultar|borrar} (cabecera x-clave)
// Datos en DATOS/pedidos.json y DATOS/opiniones.json. La clave del panel llega en la variable PANEL_CLAVE.
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SITIO = process.env.SITIO || path.join(__dirname, "..");
const DATOS = process.env.DATOS || "/data";
const ARCHIVO = path.join(DATOS, "pedidos.json");
const ARCHIVO_OPINIONES = path.join(DATOS, "opiniones.json");
const IMAGENES = path.join(DATOS, "imagenes");
const ARCHIVO_CATALOGO = path.join(DATOS, "catalogo.json");
const MAX_IMAGEN = 4 * 1024 * 1024;
const MAX_PENDIENTES = 200; // Reason: tope de opiniones sin revisar para que nadie llene el disco
const CLAVE = process.env.PANEL_CLAVE || "";
const PUERTO = +(process.env.PUERTO || 80);
const HORA_CORTE = 17; // pedidos desde las 5 p.m. (hora de Lima) salen un día después
const ESTADOS = ["nuevo", "pagado", "despachado"];
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json" };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

const leer = (archivo) => { try { return JSON.parse(fs.readFileSync(archivo, "utf8")); } catch { return []; } };
let pedidos = leer(ARCHIVO);
let opiniones = leer(ARCHIVO_OPINIONES);
// Reason: la primera vez el catálogo sale de catalogo-inicial.json (precios del Excel); luego se edita desde el panel.
const inicial = leer(path.join(__dirname, "catalogo-inicial.json"));
let catalogo = fs.existsSync(ARCHIVO_CATALOGO) ? leer(ARCHIVO_CATALOGO) : inicial;
// Costo vacío: se completa con el del Excel de stock (P. costo). Un costo ya escrito en el panel no se toca.
for (const p of catalogo) if (p.costo === null) p.costo = inicial.find((x) => x.codigo === p.codigo)?.costo ?? null;
function escribir(archivo, datos) {
  fs.mkdirSync(DATOS, { recursive: true });
  const tmp = archivo + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(datos));
  fs.renameSync(tmp, archivo); // escritura atómica: nunca queda un archivo a medias
}
const guardar = () => escribir(ARCHIVO, pedidos);
const guardarOpiniones = () => escribir(ARCHIVO_OPINIONES, opiniones);
const guardarCatalogo = () => escribir(ARCHIVO_CATALOGO, catalogo);

// Fecha y hora de Lima (UTC−5 todo el año, Perú no cambia de horario).
function lima(fecha) { return new Date(fecha.getTime() - 5 * 3600e3); }
function despacho(fecha) {
  const l = lima(fecha);
  const dia = new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() + (l.getUTCHours() >= HORA_CORTE ? 2 : 1)));
  return dia.toISOString().slice(0, 10);
}

function texto(v, largo) { return String(v ?? "").trim().slice(0, largo); }
function validar(p) {
  const c = p.c || {};
  if (!/^GT-\d{6}-[A-Z0-9]{4}$/.test(String(p.n))) throw new Error("número de pedido inválido");
  if (!/^\d{8}$/.test(String(c.dni)) || !/^9\d{8}$/.test(String(c.celular))) throw new Error("DNI o celular inválido");
  if (texto(c.nombre, 120).split(/\s+/).length < 2) throw new Error("falta el nombre completo");
  const items = Array.isArray(p.i) ? p.i : [];
  if (items.length < 1 || items.length > 50) throw new Error("pedido sin prendas");
  const limpias = items.map(([id, color, talla, cant, precio]) => {
    if (!(+cant >= 1 && +cant <= 500 && +precio > 0 && +precio < 10000)) throw new Error("cantidad o precio fuera de rango");
    return [texto(id, 60), texto(color, 40), texto(talla, 6), Math.floor(+cant), +precio];
  });
  const bruto = limpias.reduce((s, [, , , q, pr]) => s + q * pr, 0);
  const total = +p.t;
  if (!(total > 0 && total <= bruto + 0.01)) throw new Error("total inválido");
  const campos = ["nombre", "dni", "celular", "correo", "envio", "direccion", "distrito", "agencia", "departamento", "ciudad", "sede", "comprobante", "pago"];
  return { n: p.n, c: Object.fromEntries(campos.map((k) => [k, texto(c[k], 160)])), i: limpias, t: Math.round(total * 100) / 100, x: Math.round((+p.x || 0) * 100) / 100 };
}

function validarOpinion(o) {
  const nombre = texto(o.nombre, 40), comentario = texto(o.texto, 500), estrellas = Math.round(+o.estrellas);
  if (nombre.length < 2) throw new Error("falta tu nombre");
  if (comentario.length < 10) throw new Error("escribe un comentario un poco más largo");
  if (!(estrellas >= 1 && estrellas <= 5)) throw new Error("elige de 1 a 5 estrellas");
  return { nombre, texto: comentario, estrellas };
}

// Producto del catálogo. Precios de Cant. 1, 3, 6 y 12 son de talla chica; la talla media (36, niño 10-16) y la extra (38-40) suman su recargo.
function validarProducto(x, i) {
  const fila = `Producto ${i + 1}${x.nombre ? ` (${texto(x.nombre, 80)})` : ""}: `;
  const num = (v) => (v === null || v === undefined || v === "" || isNaN(+v) ? null : Math.round(+v * 100) / 100);
  const codigo = texto(x.codigo, 60).toLowerCase();
  if (!/^[a-z0-9-]{2,60}$/.test(codigo)) throw new Error(fila + "código inválido (solo letras, números y guiones)");
  const nombre = texto(x.nombre, 80);
  if (nombre.length < 3) throw new Error(fila + "falta el nombre");
  if (!["zoroz", "galmor"].includes(x.marca)) throw new Error(fila + "marca debe ser Zoroz 77 o Galmor");
  if (!["Adulto", "Niño"].includes(x.publico)) throw new Error(fila + "público debe ser Adulto o Niño");
  const tallas = (Array.isArray(x.tallas) ? x.tallas : []).map((t) => texto(t, 3)).filter((t) => /^\d{1,2}$/.test(t));
  if (!tallas.length || tallas.length > 15) throw new Error(fila + "faltan las tallas");
  const precios = [0, 1, 2, 3].map((k) => num((x.precios || [])[k]));
  if (!(precios[0] > 0 && precios[0] < 10000)) throw new Error(fila + "falta el precio de Cant. 1");
  for (let k = 1; k < 4; k++) if (!(precios[k] > 0)) precios[k] = precios[k - 1]; // vacío = igual al anterior
  const costo = num(x.costo);
  if (costo !== null && !(costo >= 0 && costo < 10000)) throw new Error(fila + "costo inválido");
  const recargo = (v) => { const r = num(v) ?? 0; if (!(r >= 0 && r <= 500)) throw new Error(fila + "recargo inválido"); return r; };
  return { codigo, nombre, marca: x.marca, tipo: texto(x.tipo, 30) || "Pantalón", publico: x.publico, tallas, tela: texto(x.tela, 40),
    costo, precios, recargoMedia: recargo(x.recargoMedia), recargoExtra: recargo(x.recargoExtra), web: x.web !== false };
}
function validarCatalogo(lista) {
  if (!Array.isArray(lista) || !lista.length || lista.length > 500) throw new Error("lista de productos vacía");
  const limpia = lista.map(validarProducto);
  const repetido = limpia.find((x, i) => limpia.findIndex((y) => y.codigo === x.codigo) !== i);
  if (repetido) throw new Error(`código repetido: ${repetido.codigo}`);
  return limpia;
}

function responder(res, codigo, datos, extra = {}) {
  res.writeHead(codigo, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra });
  res.end(JSON.stringify(datos));
}
function leerCuerpo(req, limite = 12000) {
  return new Promise((ok, mal) => {
    let cuerpo = "";
    req.on("data", (d) => { cuerpo += d; if (cuerpo.length > limite) { mal(new Error("muy grande")); req.destroy(); } });
    req.on("end", () => ok(cuerpo));
    req.on("error", mal);
  });
}
function leerBinario(req, limite) {
  return new Promise((ok, mal) => {
    const partes = [];
    let largo = 0;
    req.on("data", (d) => { largo += d.length; if (largo > limite) { mal(new Error("muy grande")); req.destroy(); } else partes.push(d); });
    req.on("end", () => ok(Buffer.concat(partes)));
    req.on("error", mal);
  });
}
function claveOk(req) {
  const dada = Buffer.from(String(req.headers["x-clave"] || ""));
  const real = Buffer.from(CLAVE);
  return CLAVE.length >= 6 && dada.length === real.length && crypto.timingSafeEqual(dada, real);
}

function servirArchivo(req, res) {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta.endsWith("/")) ruta += "index.html";
  const archivo = path.normalize(path.join(SITIO, ruta));
  if (!archivo.startsWith(SITIO) || archivo.includes(`${path.sep}servidor${path.sep}`)) { res.writeHead(404); return res.end(); }
  fs.readFile(archivo, (err, datos) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado"); }
    const ext = path.extname(archivo);
    const cache = [".webp", ".png", ".jpg"].includes(ext) ? "public, max-age=86400" : "no-cache";
    res.writeHead(200, { "Content-Type": TIPOS[ext] || "application/octet-stream", "Cache-Control": cache });
    res.end(datos);
  });
}

const servidor = http.createServer(async (req, res) => {
  const ruta = new URL(req.url, "http://x").pathname;
  try {
    if (ruta === "/api/pedidos") {
      if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
      if (req.method !== "POST") return responder(res, 405, { ok: false }, CORS);
      let p;
      try { p = validar(JSON.parse(await leerCuerpo(req)).pedido || {}); }
      catch (e) { return responder(res, 400, { ok: false, error: e.message }, CORS); }
      if (!pedidos.some((x) => x.n === p.n)) {
        const ahora = new Date();
        pedidos.push({ ...p, d: ahora.toISOString(), s: despacho(ahora), estado: "nuevo", pagado: null });
        guardar();
      }
      return responder(res, 200, { ok: true }, CORS);
    }
    if (ruta === "/api/pedidos/imagen" && req.method === "POST") {
      const p = pedidos.find((x) => x.n === new URL(req.url, "http://x").searchParams.get("n"));
      // Reason: solo el pedido recién hecho y sin imagen; así nadie reemplaza ni sube imágenes sueltas.
      if (!p || p.img || Date.now() - new Date(p.d) > 15 * 60e3) return responder(res, 400, { ok: false });
      let png;
      try { png = await leerBinario(req, MAX_IMAGEN); } catch { return responder(res, 413, { ok: false }); }
      if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return responder(res, 400, { ok: false });
      p.img = `${p.n}-${crypto.randomBytes(9).toString("base64url")}`;
      fs.mkdirSync(IMAGENES, { recursive: true });
      fs.writeFileSync(path.join(IMAGENES, p.img + ".png"), png);
      guardar();
      return responder(res, 200, { ok: true, url: `/pedido/${p.img}.png` });
    }
    const img = ruta.match(/^\/pedido\/(GT-\d{6}-[A-Z0-9]{4}-[\w-]{12})\.png$/);
    if (img && req.method === "GET") {
      return fs.readFile(path.join(IMAGENES, img[1] + ".png"), (err, datos) => {
        if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("No encontrado"); }
        const bajar = new URL(req.url, "http://x").searchParams.has("descargar");
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex",
          ...(bajar ? { "Content-Disposition": `attachment; filename="pedido-${img[1].slice(0, 14)}.png"` } : {}) });
        res.end(datos);
      });
    }
    if (ruta === "/api/catalogo" && req.method === "GET") {
      return responder(res, 200, { productos: catalogo.filter((x) => x.web).map(({ costo, ...venta }) => venta) });
    }
    if (ruta === "/api/seguimiento" && req.method === "GET") {
      const q = new URL(req.url, "http://x").searchParams;
      const p = pedidos.find((x) => x.n === String(q.get("n") || "").trim().toUpperCase() && x.c.dni === String(q.get("dni") || "").trim());
      if (!p) return responder(res, 404, { ok: false });
      return responder(res, 200, { ok: true, estado: p.estado, pedido: p.d, despacho: p.s, envio: p.c.envio, total: p.t });
    }
    if (ruta === "/api/opiniones") {
      if (req.method === "GET") return responder(res, 200, { opiniones: opiniones.filter((o) => o.ok).reverse().map(({ nombre, texto, estrellas }) => ({ nombre, texto, estrellas })) });
      if (req.method !== "POST") return responder(res, 405, { ok: false });
      let o;
      try { o = validarOpinion(JSON.parse(await leerCuerpo(req, 3000))); }
      catch (e) { return responder(res, 400, { ok: false, error: e.message }); }
      if (opiniones.filter((x) => !x.ok).length >= MAX_PENDIENTES) return responder(res, 429, { ok: false, error: "intenta más tarde" });
      if (!opiniones.some((x) => x.texto === o.texto)) {
        opiniones.push({ ...o, id: crypto.randomUUID(), d: new Date().toISOString(), ok: false });
        guardarOpiniones();
      }
      return responder(res, 200, { ok: true });
    }
    if (ruta.startsWith("/api/panel/")) {
      if (!claveOk(req)) return responder(res, 401, { error: "Clave incorrecta" });
      if (ruta === "/api/panel/pedidos" && req.method === "GET") return responder(res, 200, { pedidos: [...pedidos].reverse() });
      if (ruta === "/api/panel/estado" && req.method === "POST") {
        const { numero, estado } = JSON.parse(await leerCuerpo(req, 2000));
        const p = pedidos.find((x) => x.n === numero);
        if (!p || !ESTADOS.includes(estado)) return responder(res, 400, { ok: false });
        p.estado = estado;
        if (estado === "pagado" && !p.pagado) p.pagado = new Date().toISOString();
        if (estado === "nuevo") p.pagado = null;
        guardar();
        return responder(res, 200, { ok: true });
      }
      if (ruta === "/api/panel/catalogo" && req.method === "GET") return responder(res, 200, { productos: catalogo });
      if (ruta === "/api/panel/catalogo" && req.method === "POST") {
        try { catalogo = validarCatalogo(JSON.parse(await leerCuerpo(req, 400000)).productos); }
        catch (e) { return responder(res, 400, { ok: false, error: e.message }); }
        guardarCatalogo();
        return responder(res, 200, { ok: true, productos: catalogo });
      }
      if (ruta === "/api/panel/opiniones" && req.method === "GET") return responder(res, 200, { opiniones: [...opiniones].reverse() });
      if (ruta === "/api/panel/opinion" && req.method === "POST") {
        const { id, accion } = JSON.parse(await leerCuerpo(req, 2000));
        const o = opiniones.find((x) => x.id === id);
        if (!o || !["aprobar", "ocultar", "borrar"].includes(accion)) return responder(res, 400, { ok: false });
        if (accion === "borrar") opiniones = opiniones.filter((x) => x !== o);
        else o.ok = accion === "aprobar";
        guardarOpiniones();
        return responder(res, 200, { ok: true });
      }
      return responder(res, 404, { ok: false });
    }
    if (req.method === "GET" || req.method === "HEAD") return servirArchivo(req, res);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    responder(res, 500, { ok: false });
  }
});

if (require.main === module) servidor.listen(PUERTO, () => console.log(`Tienda en el puerto ${PUERTO}`));
module.exports = { servidor, validar, validarOpinion, validarCatalogo, despacho };
