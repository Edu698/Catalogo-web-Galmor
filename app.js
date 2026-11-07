(() => {
  const C = window.CATALOGO;
  const $ = (s, el = document) => el.querySelector(s);
  const soles = (n) => "S/ " + n.toFixed(2);
  const producto = (id) => C.productos.find((p) => p.id === id);
  const wsp = (texto) => `https://wa.me/${C.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  // ---------- Bienvenida: se muestra una vez por visita ----------
  const splash = $("#splash");
  if (sessionStorage.getItem("galmor_visto")) splash.remove();
  else {
    sessionStorage.setItem("galmor_visto", "1");
    setTimeout(() => splash.classList.add("fuera"), 2300);
    setTimeout(() => splash.remove(), 3300);
  }

  // ---------- Fotos: fotos/<id>/<color>.jpg y fotos/<id>/modelo-N.jpg ----------
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
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
    $("#catalogo").innerHTML = C.productos
      .filter((p) => filtro === "todos" || p.marca === filtro)
      .map((p) => {
        const b = fotoColor(p, nombresColor(p)[0]);
        const a = modelos(p)[0] || b;
        return `<article class="tarjeta" data-id="${p.id}">
          <div class="foto"><img src="${a}" alt="${p.nombre}" loading="lazy"><img src="${b || a}" alt="" loading="lazy">${marcaAgua(p)}</div>
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
  $("#catalogo").addEventListener("click", (e) => {
    const t = e.target.closest(".tarjeta");
    if (t) abrirDetalle(t.dataset.id);
  });

  // ---------- Detalle: colores, tallas, giro y zoom ----------
  const dlg = $("#detalle");
  function abrirDetalle(id) {
    const p = producto(id);
    const sel = { color: nombresColor(p)[0], talla: null, cant: 1, vista: 0 };

    dlg.innerHTML = `<button class="cerrar" aria-label="Cerrar">×</button>
      <div class="detalle-cuerpo">
        <div class="galeria">
          <div class="visor"><img alt="${p.nombre}">${marcaAgua(p)}</div>
          <p class="ayuda-visor">Arrastra para girar · toca para hacer zoom</p>
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
          <button class="btn btn-bloque agregar">Agregar al carrito</button>
          <details class="ficha" open><summary>Ficha técnica</summary>
            <table>${Object.entries(p.ficha).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
              <tr><td>Tallas</td><td>${p.tallas.join(" · ")}</td></tr></table>
          </details>
          <p class="envio-nota">Lima: compra hoy y recíbelo mañana en motorizado. Provincias: despachamos mañana por Shalom, Olva u otra agencia.</p>
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

    // Giro: arrastrar a los lados cambia de vista. Zoom: tocar sin arrastrar; mover el dedo/ratón recorre la foto.
    let x0 = null, arrastro = false, zoom = false;
    visor.addEventListener("pointerdown", (e) => { x0 = e.clientX; arrastro = false; });
    visor.addEventListener("pointermove", (e) => {
      if (zoom) {
        const r = visor.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        return;
      }
      if (x0 === null || Math.abs(e.clientX - x0) < 40) return;
      arrastro = true;
      mostrar(sel.vista + (e.clientX < x0 ? 1 : -1));
      x0 = e.clientX;
    });
    visor.addEventListener("pointerup", (e) => {
      if (!arrastro) {
        zoom = !zoom;
        visor.classList.toggle("zoom", zoom);
        const r = visor.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
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
        abrirCarrito();
      }
    };
    dlg.showModal();
  }

  // ---------- Carrito (se guarda en el navegador) ----------
  let carrito = JSON.parse(localStorage.getItem("galmor_carrito") || "[]").filter((i) => producto(i.id));
  const guardar = () => localStorage.setItem("galmor_carrito", JSON.stringify(carrito));
  const total = () => carrito.reduce((s, i) => s + producto(i.id).precio * i.cant, 0);

  function agregar(id, color, talla, cant) {
    const ya = carrito.find((i) => i.id === id && i.color === color && i.talla === talla);
    if (ya) ya.cant += cant;
    else carrito.push({ id, color, talla, cant });
    guardar();
    pintarCarrito();
  }
  function pintarCarrito() {
    $("#contador").textContent = carrito.reduce((s, i) => s + i.cant, 0);
    $("#form-pedido").hidden = !carrito.length;
    if (!carrito.length) {
      $("#carrito-items").innerHTML = `<p class="vacio">Tu carrito está vacío.</p>`;
      $("#carrito-totales").innerHTML = "";
      return;
    }
    $("#carrito-items").innerHTML = carrito
      .map((i, k) => {
        const p = producto(i.id);
        return `<div class="item"><img src="${vistas(p, i.color)[0]}" alt="">
          <div><b>${p.nombre}</b><small>${i.color} · Talla ${i.talla}</small>
            <div class="cantidad"><button data-k="${k}" data-d="-1">−</button><span>${i.cant}</span><button data-k="${k}" data-d="1">+</button></div>
            <button class="quitar" data-quitar="${k}">Quitar</button></div>
          <b>${soles(p.precio * i.cant)}</b></div>`;
      })
      .join("");
    const t = total();
    const base = t / 1.18;
    $("#carrito-totales").innerHTML = `<div><span>Op. gravada</span><span>${soles(base)}</span></div>
      <div><span>IGV (18 %)</span><span>${soles(t - base)}</span></div>
      <div class="total"><span>Total</span><span>${soles(t)}</span></div>
      <div><span>Envío</span><span>se coordina por WhatsApp</span></div>`;
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

  const panel = $("#carrito"), velo = $("#velo");
  function abrirCarrito() { panel.classList.add("abierto"); velo.classList.add("visible"); panel.setAttribute("aria-hidden", "false"); }
  function cerrarCarrito() { panel.classList.remove("abierto"); velo.classList.remove("visible"); panel.setAttribute("aria-hidden", "true"); }
  $("#abrir-carrito").onclick = abrirCarrito;
  $("#cerrar-carrito").onclick = cerrarCarrito;
  velo.onclick = cerrarCarrito;

  // ---------- Pedido por WhatsApp ----------
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
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    const lineas = carrito.map((i, k) => {
      const p = producto(i.id);
      return `${k + 1}. ${p.nombre} · ${i.color} · Talla ${i.talla} × ${i.cant} = ${soles(p.precio * i.cant)}`;
    });
    const envio = f.envio.startsWith("Lima")
      ? `${f.envio} — ${f.direccion || "dirección por coordinar"}`
      : `${f.envio} — ${f.destino || "destino por coordinar"} — ${f.agencia}`;
    const texto = [
      "*Nuevo pedido — Galmor Textiles*", "", ...lineas, "",
      `*Total (IGV incluido): ${soles(total())}*`, "",
      `Nombre: ${f.nombre}`, `DNI: ${f.dni}`, `Celular: ${f.celular}`, f.correo ? `Correo: ${f.correo}` : null,
      `Envío: ${envio}`, `Comprobante: ${f.comprobante}`, `Pago: ${f.pago}`, "",
      "Adjunto la captura de mi pago.",
    ].filter((l) => l !== null).join("\n");
    window.open(wsp(texto), "_blank");
  });

  // ---------- Inicio ----------
  $("#wsp-flotante").href = wsp("Hola Galmor, quiero información de sus productos.");
  $("#redes").innerHTML = [["Facebook", C.redes.facebook], ["Instagram", C.redes.instagram], ["TikTok", C.redes.tiktok], ["WhatsApp", wsp()]]
    .map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join("");
  $("#anio").textContent = new Date().getFullYear();
  pintarFiltros();
  pintarCatalogo();
  pintarCarrito();
  pintarPago();
})();
