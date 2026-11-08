/**
 * Registro de pedidos de la tienda Galmor en una hoja de Google (gratis).
 *
 * Instalación (una sola vez):
 * 1. Crea una hoja de cálculo nueva en Google Sheets, llamada "Pedidos Galmor".
 * 2. Menú Extensiones → Apps Script. Borra lo que hay y pega este archivo completo.
 * 3. Menú Configuración del proyecto (engranaje) → Propiedades de la secuencia de comandos →
 *    Agregar propiedad: nombre CLAVE, valor = una clave secreta tuya (ej. galmor2026).
 * 4. Botón Implementar → Nueva implementación → tipo "Aplicación web".
 *    Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario. Implementar y autorizar.
 * 5. Copia la "URL de la aplicación web" (termina en /exec) y pásala para ponerla en productos.js → registro.
 *
 * La tienda envía cada pedido nuevo (sin clave). El panel lee y cambia estados solo con la CLAVE.
 */
const HOJA = "Pedidos";
const COLUMNAS = ["numero", "fecha", "despacho", "estado", "cliente", "dni", "celular", "total", "datos"];

function hoja_() {
  const libro = SpreadsheetApp.getActive();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function respuesta_(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}

function claveCorrecta_(clave) {
  const real = PropertiesService.getScriptProperties().getProperty("CLAVE");
  return !!real && clave === real;
}

/** Panel: lista de pedidos. GET ...?clave=XXXX */
function doGet(e) {
  if (!claveCorrecta_(e.parameter.clave)) return respuesta_({ error: "Clave incorrecta" });
  const filas = hoja_().getDataRange().getValues().slice(1);
  const pedidos = filas.map((f) => Object.assign(JSON.parse(f[8]), { estado: f[3] }));
  return respuesta_({ pedidos: pedidos.reverse() });
}

/** Tienda: {accion:"nuevo", pedido}. Panel: {accion:"estado", clave, numero, estado}. */
function doPost(e) {
  const cuerpo = JSON.parse(e.postData.contents);
  const hoja = hoja_();
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);
  try {
    if (cuerpo.accion === "nuevo") {
      const p = cuerpo.pedido;
      const numeros = hoja.getRange(1, 1, hoja.getLastRow(), 1).getValues().flat();
      if (numeros.indexOf(p.n) === -1) {
        hoja.appendRow([p.n, new Date(p.d), p.s, "nuevo", p.c.nombre, "'" + p.c.dni, "'" + p.c.celular, p.t, JSON.stringify(p)]);
      }
      return respuesta_({ ok: true });
    }
    if (cuerpo.accion === "estado" && claveCorrecta_(cuerpo.clave)) {
      const numeros = hoja.getRange(1, 1, hoja.getLastRow(), 1).getValues().flat();
      const fila = numeros.indexOf(cuerpo.numero) + 1;
      if (fila > 1) hoja.getRange(fila, 4).setValue(cuerpo.estado);
      return respuesta_({ ok: fila > 1 });
    }
    return respuesta_({ error: "Acción no válida" });
  } finally {
    bloqueo.releaseLock();
  }
}
