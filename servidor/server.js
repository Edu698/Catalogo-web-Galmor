// Servidor de la tienda (sin dependencias, Node 24): sirve la página y guarda los pedidos para el panel.
//   GET  /...                    archivos de la tienda (carpeta sitio)
//   POST /api/pedidos            la tienda registra un pedido (público, validado, sin duplicados)
//   GET  /api/panel/pedidos      panel: lista de pedidos            (cabecera x-clave)
//   POST /api/panel/estado       panel: {numero, estado}            (cabecera x-clave)
// Datos en DATOS/pedidos.json. La clave del panel llega en la variable PANEL_CLAVE.
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SITIO = process.env.SITIO || path.join(__dirname, "..");
const DATOS = process.env.DATOS || "/data";
const ARCHIVO = path.join(DATOS, "pedidos.json");
const CLAVE = process.env.PANEL_CLAVE || "";
const PUERTO = +(process.env.PUERTO || 80);
const HORA_CORTE = 17; // pedidos desde las 5 p.m. (hora de Lima) salen un día después
const ESTADOS = ["nuevo", "pagado", "despachado"];
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

let pedidos = [];
try { pedidos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); } catch { pedidos = []; }
function guardar() {
  fs.mkdirSync(DATOS, { recursive: true });
  const tmp = ARCHIVO + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(pedidos));
  fs.renameSync(tmp, ARCHIVO); // escritura atómica: nunca queda un archivo a medias
}

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
module.exports = { servidor, validar, despacho };
