(() => {
  const C = window.CATALOGO;
  const $ = (s, el = document) => el.querySelector(s);
  const soles = (n) => "S/ " + n.toFixed(2);
  const producto = (id) => C.productos.find((p) => p.id === id);
  const wsp = (texto) => `https://wa.me/${C.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  // ---------- Bienvenida: una vez por visita ----------
  const splash = $("#splash");
  if (sessionStorage.getItem("galmor_visto")) splash.remove();
  else {
    sessionStorage.setItem("galmor_visto", "1");
    setTimeout(() => splash.classList.add("fuera"), 2200);
    setTimeout(() => splash.remove(), 3100);
  }

  // ---------- Fotos: fotos/<id>/<color>.jpg y fotos/<id>/modelo-N.jpg ----------
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
  const fotoColor = (p, color) => `fotos/${p.id}/${slug(color)}.jpg`;
  const modelos = (p) => Array.from({ length: p.modelos || 0 }, (_, i) => `fotos/${p.id}/modelo-${i + 1}.jpg`);
  const vistas = (p, color) => [fotoColor(p, color), ...modelos(p)];
  const nombresColor = (p) => Object.keys(p.colores);
  const marcaAgua = (p) =>
    `<div class="marca-agua"><span>${C.marcas[p.marca].toUpperCase()}</span></div><div class="sello">GALMOR TEXTILES</div>`;

  // ---------- Catálogo ----------
  let filtro = "todos";
  function pintarFiltros() {
    const opciones = { todos: "Todos", ...C.marcas };
    $("#filtros").innerHTML = Object.entries(opciones)
      .map(([id, n]) => `<button data-marca="${id}" class="${id === filtro ? "activo" : ""}">${n}</button>`)
      .join("");
  }
  function pintarCatalogo() {
    $("#rejilla").innerHTML = C.productos
      .filter((p) => filtro === "todos" || p.marca === filtro)
      .map((p) => {
        const b = fotoColor(p, nombresColor(p)[0]);
        const a = modelos(p)[0] || b;
        return `<article class="tarjeta" data-id="${p.id}">
          <div class="foto"><img src="${a}" alt="${p.nombre}" loading="lazy"><img src="${b}" alt="" loading="lazy">
            <span class="etiqueta-colores">${nombresColor(p).length} colores</span>${marcaAgua(p)}</div>
          <div class="marca">${C.marcas[p.marca]}</div>
          <h3>${p.nombre}</h3>
          <div class="precio">${soles(p.precio)}</div>
          <div class="puntos">${nombresColor(p).map((c) => `<span class="punto" title="${c}" style="background:${p.colores[c]}"></span>`).join("")}</div>
        </article>`;
      })
      .join("") || `<p class="vacio">Próximamente: nueva colección ${C.marcas[filtro]}.</p>`;
  }
  $("#filtros").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    filtro = b.dataset.marca;
    pintarFiltros();
    pintarCatalogo();
  });
  $("#rejilla").addEventListener("click", (e) => {
    const t = e.target.closest(".tarjeta");
    if (t) abrirDetalle(t.dataset.id);
  });

  // ---------- Detalle: colores, tallas, fotos y zoom ----------
  const dlg = $("#detalle");
  function abrirDetalle(id) {
    const p = producto(id);
    const sel = { color: nombresColor(p)[0], talla: null, cant: 1, vista: 0 };

    dlg.innerHTML = `<button class="cerrar" aria-label="Cerrar">×</button>
      <div class="detalle-cuerpo">
        <div class="galeria">
          <div class="visor"><img alt="${p.nombre}">${marcaAgua(p)}</div>
          <p class="ayuda-visor">Arrastra para ver más fotos · toca para hacer zoom</p>
          <div class="miniaturas"></div>
        </div>
        <div class="info">
          <div class="marca">${C.marcas[p.marca]}</div>
          <h2>${p.nombre}</h2>
          <div class="precio">${soles(p.precio)}</div>
          <div class="igv">Precio incluye IGV</div>
          <p>${p.descripcion}</p>
          <div class="etiqueta">Color: <b class="nombre-color"></b></div>
          <div class="muestras">${nombresColor(p).map((c) => `<button class="muestra" data-color="${c}" title="${c}" style="background:${p.colores[c]}"></button>`).join("")}</div>
          <div class="etiqueta">Talla</div>
          <div class="tallas">${p.tallas.map((t) => `<button data-talla="${t}">${t}</button>`).join("")}</div>
          <div class="etiqueta">Cantidad</div>
          <div class="cantidad"><button data-d="-1">−</button><span class="cant">1</span><button data-d="1">+</button></div>
          <p class="aviso"></p>
          <button class="btn btn-bloque btn-naranja agregar">Agregar al carrito</button>
          <details class="ficha" open><summary>Ficha técnica</summary>
            <table>${Object.entries(p.ficha).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
              <tr><td>Tallas</td><td>${p.tallas.join(" · ")}</td></tr></table>
          </details>
          <p class="envio-nota">Lima: pide hoy y recíbelo mañana en motorizado. Provincias: despachamos mañana por Shalom, Olva u otra agencia.</p>
        </div>
      </div>`;

    const visor = $(".visor", dlg);
    const img = $("img", visor);
    function mostrar(i) {
      const fotos = vistas(p, sel.color);
      sel.vista = (i + fotos.length) % fotos.length;
      img.src = fotos[sel.vista];
      $(".miniaturas", dlg).innerHTML = fotos
        .map((f, j) => `<img src="${f}" data-i="${j}" class="${j === sel.vista ? "activa" : ""}" alt="">`)
        .join("");
    }
    function elegirColor(c) {
      sel.color = c;
      $(".nombre-color", dlg).textContent = c;
      dlg.querySelectorAll(".muestra").forEach((m) => m.classList.toggle("activa", m.dataset.color === c));
      mostrar(0); // la foto de ese color
    }
    elegirColor(sel.color);
    if (p.modelos) mostrar(1); // al abrir, primero la foto con modelo

    // Arrastrar a los lados cambia de foto. Tocar sin arrastrar hace zoom; mover el dedo/ratón recorre la foto.
    let x0 = null, arrastro = false, zoom = false;
    const origen = (e) => {
      const r = visor.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    };
    visor.addEventListener("pointerdown", (e) => { x0 = e.clientX; arrastro = false; });
    visor.addEventListener("pointermove", (e) => {
      if (zoom) return origen(e);
      if (x0 === null || Math.abs(e.clientX - x0) < 40) return;
      arrastro = true;
      mostrar(sel.vista + (e.clientX < x0 ? 1 : -1));
      x0 = e.clientX;
    });
    visor.addEventListener("pointerup", (e) => {
      if (!arrastro) {
        zoom = !zoom;
        visor.classList.toggle("zoom", zoom);
        origen(e);
      }
      x0 = null;
    });
    visor.addEventListener("pointerleave", () => (x0 = null));

    dlg.onclick = (e) => {
      const t = e.target;
      if (t === dlg || t.classList.contains("cerrar")) return dlg.close();
      if (t.dataset.i) mostrar(+t.dataset.i);
      if (t.dataset.color) elegirColor(t.dataset.color);
      if (t.dataset.talla) {
        sel.talla = t.dataset.talla;
        dlg.querySelectorAll(".tallas button").forEach((b) => b.classList.toggle("activa", b === t));
        $(".aviso", dlg).textContent = "";
      }
      if (t.dataset.d) {
        sel.cant = Math.max(1, sel.cant + +t.dataset.d);
        $(".cant", dlg).textContent = sel.cant;
      }
      if (t.classList.contains("agregar")) {
        if (!sel.talla) return ($(".aviso", dlg).textContent = "Elige tu talla.");
        agregar(p.id, sel.color, sel.talla, sel.cant);
        dlg.close();
        avisar(`${p.nombre} · ${sel.color} · Talla ${sel.talla}`);
      }
    };
    dlg.showModal();
  }

  // Aviso corto al agregar: el cliente sigue comprando, el carrito no se abre solo.
  let tAviso;
  function avisar(texto) {
    const a = $("#aviso-flotante");
    a.innerHTML = `<span>✓ Agregado: ${texto}</span><button>Ver carrito</button>`;
    a.querySelector("button").onclick = abrirCarrito;
    a.classList.add("visible");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => a.classList.remove("visible"), 3500);
  }

  // ---------- Carrito (se guarda en el navegador) ----------
  let carrito = JSON.parse(localStorage.getItem("galmor_carrito") || "[]").filter((i) => producto(i.id));
  const guardar = () => localStorage.setItem("galmor_carrito", JSON.stringify(carrito));
  const total = () => carrito.reduce((s, i) => s + producto(i.id).precio * i.cant, 0);
  const piezas = () => carrito.reduce((s, i) => s + i.cant, 0);

  function agregar(id, color, talla, cant) {
    const ya = carrito.find((i) => i.id === id && i.color === color && i.talla === talla);
    if (ya) ya.cant += cant;
    else carrito.push({ id, color, talla, cant });
    guardar();
    pintarCarrito();
    const b = $("#abrir-carrito");
    b.classList.remove("salta");
    void b.offsetWidth; // reinicia la animación
    b.classList.add("salta");
  }
  function desglose(t) {
    const base = t / 1.18;
    return [["Op. gravada", soles(base)], ["IGV (18 %)", soles(t - base)]];
  }
  function pintarCarrito() {
    $("#contador").textContent = piezas();
    $("#ir-pagar").hidden = !carrito.length;
    if (!carrito.length) {
      $("#carrito-items").innerHTML = `<p class="vacio">Tu carrito está vacío.</p>`;
      $("#carrito-totales").innerHTML = "";
      return;
    }
    $("#carrito-items").innerHTML = carrito
      .map((i, k) => {
        const p = producto(i.id);
        return `<div class="item"><img src="${fotoColor(p, i.color)}" alt="">
          <div><b>${p.nombre}</b><small>${i.color} · Talla ${i.talla}</small>
            <div class="cantidad"><button data-k="${k}" data-d="-1">−</button><span>${i.cant}</span><button data-k="${k}" data-d="1">+</button></div>
            <button class="quitar" data-quitar="${k}">Quitar</button></div>
          <b>${soles(p.precio * i.cant)}</b></div>`;
      })
      .join("");
    const t = total();
    $("#carrito-totales").innerHTML = desglose(t).map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join("")
      + `<div class="total"><span>Total</span><span>${soles(t)}</span></div>`
      + `<div><span>Envío</span><span>se coordina por WhatsApp</span></div>`;
  }
  $("#carrito-items").addEventListener("click", (e) => {
    const d = e.target.dataset;
    if (d.quitar) carrito.splice(+d.quitar, 1);
    else if (d.k) {
      const i = carrito[+d.k];
      i.cant += +d.d;
      if (i.cant < 1) carrito.splice(+d.k, 1);
    } else return;
    guardar();
    pintarCarrito();
  });

  // Pasos del panel: 1 carrito → 2 datos y pago → 3 pedido listo.
  const panel = $("#carrito"), velo = $("#velo");
  function paso(n) {
    $("#paso-carrito").hidden = n !== 1;
    $("#form-pedido").hidden = n !== 2;
    $("#paso-listo").hidden = n !== 3;
    $("#carrito-titulo").textContent = ["Tu carrito", "Datos y pago", "Pedido listo"][n - 1];
    panel.scrollTop = 0;
    if (n === 2) pintarPago();
  }
  function abrirCarrito() {
    paso(1);
    panel.classList.add("abierto"); velo.classList.add("visible"); panel.setAttribute("aria-hidden", "false");
  }
  function cerrarCarrito() { panel.classList.remove("abierto"); velo.classList.remove("visible"); panel.setAttribute("aria-hidden", "true"); }
  $("#abrir-carrito").onclick = abrirCarrito;
  $("#cerrar-carrito").onclick = cerrarCarrito;
  $("#seguir-comprando").onclick = cerrarCarrito;
  velo.onclick = cerrarCarrito;
  $("#ir-pagar").onclick = () => paso(2);
  $("#volver-carrito").onclick = () => paso(1);

  // ---------- Datos y pago ----------
  const form = $("#form-pedido");
  function pintarPago() {
    const metodo = form.pago.value;
    const d = C.pago[metodo === "Transferencia" ? "transferencia" : metodo.toLowerCase()];
    const filas = metodo === "Transferencia"
      ? [["Banco", d.banco], ["Cuenta", d.cuenta], ["CCI", d.cci], ["Titular", d.titular]]
      : [[metodo, d.numero], ["Titular", d.titular]];
    $("#datos-pago").innerHTML = filas.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")
      + `<div><span>Monto</span><b>${soles(total())}</b></div>`;
  }
  form.addEventListener("change", (e) => {
    if (e.target.name === "pago") pintarPago();
    if (e.target.name === "envio") {
      const lima = form.envio.value.startsWith("Lima");
      $("#envio-lima").hidden = !lima;
      $("#envio-provincia").hidden = lima;
    }
  });

  // ---------- Pedido en imagen (PNG) ----------
  const cargarImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  async function imagenPedido(f, numero) {
    await Promise.all(["40px Anton", "700 20px Inter", "20px Inter"].map((fuente) => document.fonts.load(fuente)));
    const fotos = await Promise.all(carrito.map((i) => cargarImg(fotoColor(producto(i.id), i.color))));
    const W = 1080, FILA = 190, P = 60;
    const envio = f.envio.startsWith("Lima") ? `${f.envio} — ${f.direccion || "dirección por coordinar"}`
      : `${f.envio} — ${f.destino || "destino por coordinar"} — ${f.agencia}`;
    const cliente = [["Cliente", f.nombre], ["DNI", f.dni], ["Celular", f.celular], ...(f.correo ? [["Correo", f.correo]] : []),
      ["Envío", envio], ["Comprobante", f.comprobante], ["Pago", f.pago]];
    const H = 300 + cliente.length * 40 + 50 + carrito.length * FILA + 300;
    const cv = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const x = cv.getContext("2d");
    const texto = (t, px, py, fuente, color = "#0d0d0d", alin = "left") => {
      x.font = fuente; x.fillStyle = color; x.textAlign = alin; x.fillText(t, px, py);
    };
    const caja = (px, py, w, h, color) => { x.fillStyle = color; x.fillRect(px, py, w, h); };

    caja(0, 0, W, H, "#fff");
    // Cabecera
    caja(0, 0, W, 220, "#0d0d0d");
    texto("GALMOR", P, 120, "96px Anton", "#fff");
    texto("TEXTILES", P + 4, 165, "700 22px Inter", "#ff4d00");
    texto("PEDIDO", W - P, 92, "700 22px Inter", "#999", "right");
    texto(numero, W - P, 140, "44px Anton", "#fff", "right");
    texto(new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }), W - P, 178, "20px Inter", "#bbb", "right");
    caja(0, 220, W, 12, "#ff4d00");
    // Datos del cliente
    let y = 290;
    for (const [k, v] of cliente) {
      texto(k.toUpperCase(), P, y, "700 18px Inter", "#888");
      texto(String(v).slice(0, 60), 270, y, "22px Inter");
      y += 40;
    }
    y += 10;
    caja(P, y, W - 2 * P, 4, "#0d0d0d");
    y += 40;
    // Prendas
    carrito.forEach((i, k) => {
      const p = producto(i.id), foto = fotos[k];
      caja(P, y, 120, 160, "#f1f1f1");
      if (foto) {
        const esc = Math.max(120 / foto.width, 160 / foto.height);
        const sw = 120 / esc, sh = 160 / esc;
        x.drawImage(foto, (foto.width - sw) / 2, 0, sw, sh, P, y, 120, 160);
      }
      texto(p.nombre.toUpperCase(), P + 150, y + 40, "30px Anton");
      texto(`${C.marcas[p.marca]} · Color ${i.color} · Talla ${i.talla}`, P + 150, y + 82, "22px Inter", "#555");
      texto(`${i.cant} × ${soles(p.precio)}`, P + 150, y + 122, "22px Inter", "#555");
      texto(soles(p.precio * i.cant), W - P, y + 122, "700 26px Inter", "#0d0d0d", "right");
      y += FILA;
      caja(P, y - 15, W - 2 * P, 2, "#e2e2e2");
    });
    // Totales
    y += 20;
    for (const [k, v] of desglose(total())) {
      texto(k, W - 330, y, "22px Inter", "#666");
      texto(v, W - P, y, "22px Inter", "#666", "right");
      y += 38;
    }
    caja(W - 440, y - 6, 440 - P, 70, "#0d0d0d");
    texto("TOTAL", W - 420, y + 42, "34px Anton", "#ff4d00");
    texto(soles(total()), W - P - 20, y + 42, "34px Anton", "#fff", "right");
    texto(`${piezas()} prenda(s) · precios con IGV`, P, y + 42, "20px Inter", "#666");
    // Pie
    caja(0, H - 100, W, 100, "#ff4d00");
    texto("ENVÍA ESTA IMAGEN Y LA CAPTURA DE TU PAGO AL 983 573 288", W / 2, H - 40, "30px Anton", "#0d0d0d", "center");
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }

  let archivoPedido = null;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const boton = form.querySelector("[type=submit]");
    boton.disabled = true;
    boton.textContent = "Generando…";
    const f = Object.fromEntries(new FormData(form));
    const d = new Date(), dd = (n) => String(n).padStart(2, "0");
    const numero = `G-${String(d.getFullYear()).slice(2)}${dd(d.getMonth() + 1)}${dd(d.getDate())}-${dd(d.getHours())}${dd(d.getMinutes())}`;
    try {
      const blob = await imagenPedido(f, numero);
      archivoPedido = new File([blob], `pedido-${numero}.png`, { type: "image/png" });
      $("#pedido-imagen").src = URL.createObjectURL(blob);
      $("#abrir-chat").href = wsp(`Hola Galmor, te envío mi pedido ${numero}.`);
      paso(3);
    } finally {
      boton.disabled = false;
      boton.textContent = "Generar mi pedido";
    }
  });

  // En celular la imagen se comparte directo a WhatsApp; en computadora se descarga y se abre el chat para adjuntarla.
  $("#enviar-imagen").onclick = async () => {
    if (navigator.canShare && navigator.canShare({ files: [archivoPedido] })) {
      try { return await navigator.share({ files: [archivoPedido] }); } catch { /* cancelado: se descarga */ }
    }
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(archivoPedido), download: archivoPedido.name }).click();
    window.open($("#abrir-chat").href, "_blank");
  };
  $("#nuevo-pedido").onclick = () => {
    carrito = [];
    guardar();
    pintarCarrito();
    form.reset();
    cerrarCarrito();
  };

  // ---------- Inicio ----------
  const cinta = ["Envío a todo el Perú", "Lima: pide hoy, llega mañana", "Precios con IGV", "Yape · Plin · Transferencia", "Boleta o ticket", "Zoroz 77 Urban Jeans"];
  $("#cinta").innerHTML = [...cinta, ...cinta].map((t) => `<span>${t} ★</span>`).join("");
  $("#wsp-flotante").href = wsp("Hola Galmor, quiero información de sus productos.");
  $("#redes").innerHTML = [["Facebook", C.redes.facebook], ["Instagram", C.redes.instagram], ["TikTok", C.redes.tiktok], ["WhatsApp", wsp()]]
    .map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join("");
  $("#anio").textContent = new Date().getFullYear();
  pintarFiltros();
  pintarCatalogo();
  pintarCarrito();
})();
