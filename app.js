(() => {
  const C = window.CATALOGO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const soles = (n) => "S/ " + n.toFixed(2);
  const producto = (id) => C.productos.find((p) => p.id === id);
  const wsp = (texto) => `https://wa.me/${C.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Fotos: fotos/<id>/<color>.webp y fotos/<id>/modelo-N.webp ----------
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
  const fotoColor = (p, color) => `fotos/${p.id}/${slug(color)}.webp`;
  const modelos = (p) => Array.from({ length: p.modelos || 0 }, (_, i) => `fotos/${p.id}/modelo-${i + 1}.webp`);
  const nombresColor = (p) => Object.keys(p.colores);
  const marcaDe = (p) => C.marcas[p.marca];

  // ---------- 1. Bienvenida: una vez por visita, se va sola a los 2 s ----------
  const splash = $("#splash");
  if (sessionStorage.getItem("galmor_visto")) splash.remove();
  else {
    sessionStorage.setItem("galmor_visto", "1");
    setTimeout(() => splash.classList.add("fuera"), quieto ? 600 : 2000);
    setTimeout(() => splash.remove(), quieto ? 700 : 2350);
  }

  // ---------- 2. Pestañas de marca y catálogo ----------
  const PESTANAS = { todos: "Todos", zoroz: "Zoroz 77", galmor: "Galmor" };
  let filtro = "todos";
  function pintarPestanas() {
    $("#pestanas").innerHTML = Object.entries(PESTANAS)
      .map(([id, n]) => `<button data-marca="${id}" class="${id === filtro ? "activa" : ""}" aria-pressed="${id === filtro}">${n}</button>`)
      .join("");
  }
  function tarjeta(p) {
    const colores = nombresColor(p);
    const a = modelos(p)[0] || fotoColor(p, colores[0]);
    const puntos = colores.slice(0, 5).map((c) => `<i style="background:${p.colores[c]}" title="${c}"></i>`).join("");
    return `<button class="tarjeta" data-id="${p.id}">
      <span class="tarjeta-foto"><img src="${a}" alt="${p.nombre}" loading="lazy"><img src="${fotoColor(p, colores[0])}" alt="" loading="lazy"></span>
      <span class="tarjeta-nombre">${p.nombre}</span>
      <span class="tarjeta-pie"><span class="precio">${soles(p.precio)}</span><span class="n-colores">${colores.length} colores</span></span>
      <span class="puntos">${puntos}${colores.length > 5 ? `<small>+${colores.length - 5}</small>` : ""}</span>
    </button>`;
  }
  const tilePronto = () => `<div class="pronto"><small>Próximamente</small><b>Galmor</b>
      <p>Classic Men · Mejor imposible. Sé el primero en saberlo.</p>
      <a class="btn" href="${wsp("Hola Galmor, avísenme cuando llegue la colección Galmor.")}" target="_blank" rel="noopener">Avísame por WhatsApp</a></div>`;
  function pintarCatalogo() {
    $("#titulo-catalogo").textContent = filtro === "todos" ? "Nueva colección" : PESTANAS[filtro];
    const lista = C.productos.filter((p) => filtro === "todos" || p.marca === filtro).map(tarjeta).join("");
    $("#rejilla").innerHTML = lista + (filtro !== "zoroz" ? tilePronto() : "");
  }
  function filtrar(marca) {
    filtro = marca;
    pintarPestanas();
    pintarCatalogo();
  }
  $("#pestanas").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) filtrar(b.dataset.marca); });
  $$("[data-filtro]").forEach((a) => a.addEventListener("click", () => filtrar(a.dataset.filtro)));
  $("#rejilla").addEventListener("click", (e) => { const t = e.target.closest(".tarjeta"); if (t) abrirProducto(t.dataset.id); });

  // ---------- 3. Producto ----------
  const dlg = $("#producto");
  function abrirProducto(id, colorSlug) {
    const p = producto(id);
    if (!p) return;
    const colores = nombresColor(p);
    const sel = { color: colores.find((c) => slug(c) === colorSlug) || colores[0], talla: null, cant: 1 };
    const ficha = Object.entries(p.ficha).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    dlg.innerHTML = `
      <div class="producto-cab"><button class="volver">← Volver</button><button class="cerrar-x" aria-label="Cerrar">×</button></div>
      <div class="producto-cuerpo">
        <div class="miniaturas" aria-label="Fotos"></div>
        <div class="galeria">
          <div class="galeria-pista" tabindex="0" aria-label="Fotos del producto, desliza para ver más"></div>
          <span class="galeria-cuenta"></span><span class="sello">GALMOR TEXTILES</span>
          <div class="galeria-puntos"></div>
        </div>
        <div class="info">
          <p class="ceja">${marcaDe(p)} · Urban jeans</p>
          <h2>${p.nombre}</h2>
          <p class="precio">${soles(p.precio)}</p>
          <p class="igv">Precio incluye IGV</p>
          <p class="desc">${p.descripcion}</p>
          <p class="rotulo"><span>Color: <b class="nombre-color"></b></span></p>
          <div class="muestras">${colores.map((c) => `<button class="muestra" data-color="${c}" title="${c}" aria-label="${c}" style="background:${p.colores[c]}"></button>`).join("")}</div>
          <div class="tallas-bloque">
            <p class="rotulo"><span>Talla</span></p>
            <div class="tallas">${p.tallas.map((t) => `<button data-talla="${t}">${t}</button>`).join("")}</div>
            <p class="aviso-talla" role="alert"></p>
          </div>
          <p class="rotulo"><span>Cantidad</span></p>
          <div class="cantidad"><button data-d="-1" aria-label="Menos">−</button><span class="cant">1</span><button data-d="1" aria-label="Más">+</button></div>
          <button class="btn btn-denim agregar">Agregar al carrito · ${soles(p.precio)}</button>
          <div class="envio-nota"><b>Lima: pide hoy, llega mañana</b>Pedidos hasta las 6 p.m. Provincias: 2 a 4 días por Shalom u Olva.</div>
          <div class="ficha"><h3>Ficha técnica</h3><dl>${ficha}<div><dt>Tallas</dt><dd>${p.tallas.join(" · ")}</dd></div></dl></div>
        </div>
      </div>
      <div class="barra-fija"><button class="btn btn-denim agregar">Agregar al carrito · ${soles(p.precio)}</button></div>`;

    const pista = $(".galeria-pista", dlg);
    let fotos = [];
    const indice = () => Math.round(pista.scrollLeft / pista.clientWidth) || 0;
    function marcar() {
      const i = indice();
      $(".galeria-cuenta", dlg).textContent = `${i + 1} / ${fotos.length}`;
      $$(".galeria-puntos i", dlg).forEach((d, j) => d.classList.toggle("activo", j === i));
      $$(".miniaturas button", dlg).forEach((b, j) => b.classList.toggle("activa", j === i));
    }
    const irA = (i, suave = true) => pista.scrollTo({ left: i * pista.clientWidth, behavior: suave && !quieto ? "smooth" : "auto" });
    function pintarGaleria() {
      // Al elegir un color, la galería muestra primero ese color y luego las fotos con modelo.
      fotos = [fotoColor(p, sel.color), ...modelos(p)];
      pista.innerHTML = fotos.map((f, i) => `<img src="${f}" alt="${p.nombre}, foto ${i + 1}" ${i ? 'loading="lazy"' : ""} data-i="${i}">`).join("");
      $(".galeria-puntos", dlg).innerHTML = fotos.map(() => "<i></i>").join("");
      $(".miniaturas", dlg).innerHTML = fotos.map((f, i) => `<button data-i="${i}" aria-label="Foto ${i + 1}"><img src="${f}" alt="" loading="lazy"></button>`).join("");
      irA(0, false);
      marcar();
    }
    function elegirColor(c) {
      sel.color = c;
      $(".nombre-color", dlg).textContent = c;
      $$(".muestra", dlg).forEach((m) => m.classList.toggle("activa", m.dataset.color === c));
      pintarGaleria();
      history.replaceState(null, "", `?producto=${p.id}&color=${slug(c)}`);
    }
    pista.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });

    dlg.onclick = (e) => {
      if (e.target.tagName === "IMG" && e.target.parentElement === pista) return abrirLupa(e.target.src);
      const t = e.target.closest("button") || e.target;
      if (t === dlg || t.classList.contains("cerrar-x") || t.classList.contains("volver")) return dlg.close();
      if (t.dataset.color) return elegirColor(t.dataset.color);
      if (t.dataset.i) return irA(+t.dataset.i);
      if (t.dataset.talla) {
        sel.talla = t.dataset.talla;
        $$(".tallas button", dlg).forEach((b) => b.classList.toggle("activa", b === t));
        $(".aviso-talla", dlg).textContent = "";
      }
      if (t.dataset.d) {
        sel.cant = Math.max(1, sel.cant + +t.dataset.d);
        $(".cant", dlg).textContent = sel.cant;
      }
      if (t.classList.contains("agregar")) {
        if (!sel.talla) {
          const bloque = $(".tallas-bloque", dlg);
          $(".aviso-talla", dlg).textContent = "Elige tu talla";
          bloque.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "center" });
          bloque.classList.remove("sacude"); void bloque.offsetWidth; bloque.classList.add("sacude");
          return;
        }
        agregar(p, sel.color, sel.talla, sel.cant);
        dlg.close();
      }
    };

    // Celular: barra fija de "Agregar" cuando el botón principal sale de la vista.
    const barra = $(".barra-fija", dlg);
    // Reason: el margen de -56 px descuenta la cabecera fija del producto, que tapa el botón al subir.
    new IntersectionObserver(([e]) => barra.classList.toggle("visible", e.intersectionRatio < 1 && e.boundingClientRect.top < 120),
      { root: dlg, rootMargin: "-56px 0px 0px 0px", threshold: [0, 1] }).observe($(".info .agregar", dlg));

    dlg.showModal();
    document.activeElement?.blur(); // sin recuadro de foco sobre "Volver" al abrir con el dedo
    dlg.scrollTop = 0;
    elegirColor(sel.color);
  }
  dlg.addEventListener("close", () => history.replaceState(null, "", location.pathname));

  // Foto ampliada: en celular se acerca con los dedos; en computadora, clic = zoom que sigue al mouse.
  const lupa = $("#lupa"), marco = $(".lupa-marco", lupa), lupaImg = $("#lupa-img");
  function abrirLupa(src) {
    lupaImg.src = src;
    marco.classList.remove("zoom");
    lupa.showModal();
  }
  lupaImg.addEventListener("click", (e) => {
    const r = lupaImg.getBoundingClientRect();
    lupaImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    marco.classList.toggle("zoom");
  });
  lupaImg.addEventListener("mousemove", (e) => {
    if (!marco.classList.contains("zoom")) return;
    const r = marco.getBoundingClientRect();
    lupaImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  $("#cerrar-lupa").onclick = () => lupa.close();

  // ---------- 4. Aviso "Agregado" (no abre el carrito) ----------
  let tAviso;
  function avisar(p, color, talla) {
    const t = $("#toast");
    t.innerHTML = `<img src="${fotoColor(p, color)}" alt=""><div><b>✓ Agregado</b><small>${p.nombre} · ${color} · ${talla}</small></div><button>Ver carrito</button>`;
    $("button", t).onclick = () => { t.classList.remove("visible"); abrirCarrito(); };
    t.classList.add("visible");
    clearTimeout(tAviso);
    tAviso = setTimeout(() => t.classList.remove("visible"), 3000);
  }

  // ---------- 5. Carrito ----------
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  let carrito = leer("galmor_carrito", []).filter((i) => producto(i.id));
  const guardar = () => localStorage.setItem("galmor_carrito", JSON.stringify(carrito));
  const subtotal = (items = carrito) => items.reduce((s, i) => s + producto(i.id).precio * i.cant, 0);
  const piezas = (items = carrito) => items.reduce((s, i) => s + i.cant, 0);
  // Pack: el mayor descuento cuyo mínimo de prendas se alcanza (se mezclan modelos, colores y tallas).
  const pack = (items = carrito) => [...(C.packs || [])].reverse().find((k) => piezas(items) >= k.prendas);
  const descuento = (items = carrito) => Math.round(subtotal(items) * (pack(items)?.descuento || 0)) / 100;
  const total = (items = carrito) => Math.round((subtotal(items) - descuento(items)) * 100) / 100;
  function siguientePack(items = carrito) {
    const k = (C.packs || []).find((x) => piezas(items) < x.prendas);
    return k ? `Agrega ${k.prendas - piezas(items)} prenda(s) más y ahorra ${k.descuento} %.` : "";
  }
  const base = (t) => Math.round((t / 1.18) * 100) / 100; // Op. gravada; IGV = total − op. gravada

  function agregar(p, color, talla, cant) {
    const ya = carrito.find((i) => i.id === p.id && i.color === color && i.talla === talla);
    if (ya) ya.cant += cant;
    else carrito.push({ id: p.id, color, talla, cant });
    guardar();
    pintarCarrito();
    const b = $("#abrir-carrito");
    b.classList.remove("pulso"); void b.offsetWidth; b.classList.add("pulso");
    avisar(p, color, talla);
  }

  function pintarCarrito() {
    $("#contador").textContent = piezas();
    if (pasoActual === 1) $("#carrito-titulo").textContent = `Tu carrito (${piezas()})`;
    if (!carrito.length) {
      $("#carrito-items").innerHTML = `<div class="vacio"><p>Tu carrito está vacío</p><button class="btn btn-denim" id="ver-productos">Ver productos</button></div>`;
      $("#carrito-resumen").innerHTML = "";
      $("#ver-productos").onclick = () => { cerrarCarrito(); $("#catalogo").scrollIntoView(); };
      return;
    }
    $("#carrito-items").innerHTML = carrito.map((i, k) => {
      const p = producto(i.id);
      return `<div class="item"><img src="${fotoColor(p, i.color)}" alt="">
        <div><b>${p.nombre}</b><small>${marcaDe(p)} · ${i.color} · Talla ${i.talla}</small>
          <div class="cantidad"><button data-k="${k}" data-d="-1" aria-label="Menos">−</button><span>${i.cant}</span><button data-k="${k}" data-d="1" aria-label="Más">+</button></div>
          <button class="quitar" data-quitar="${k}">Quitar</button></div>
        <span class="precio">${soles(p.precio * i.cant)}</span></div>`;
    }).join("");
    const t = total(), b = base(t), dto = descuento();
    $("#carrito-resumen").innerHTML = `<div class="resumen">
        ${dto ? `<div><span>Subtotal</span><span>${soles(subtotal())}</span></div>
        <div class="descuento"><span>Pack ${pack().prendas}+ prendas (−${pack().descuento} %)</span><span>−${soles(dto)}</span></div>` : ""}
        <div><span>Op. gravada</span><span>${soles(b)}</span></div>
        <div><span>IGV (18 %)</span><span>${soles(t - b)}</span></div>
        <div class="total"><span>Total</span><span>${soles(t)}</span></div>
        ${siguientePack() ? `<p class="pack-aviso">${siguientePack()}</p>` : ""}
        <p>El costo de envío se coordina por WhatsApp.</p></div>
      <button class="btn btn-denim btn-alto" id="ir-pagar">Ir a pagar</button>
      <button class="btn btn-borde" id="seguir">Seguir comprando</button>`;
    $("#ir-pagar").onclick = () => paso(2);
    $("#seguir").onclick = cerrarCarrito;
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
  let pasoActual = 1;
  function paso(n) {
    pasoActual = n;
    [1, 2, 3].forEach((i) => ($(`#paso-${i}`).hidden = i !== n));
    $$(".pasos-barra i").forEach((b, i) => { b.className = i + 1 < n ? "hecho" : i + 1 === n ? "actual" : ""; });
    $("#carrito-titulo").textContent = n === 1 ? `Tu carrito (${piezas()})` : n === 2 ? "Datos y pago" : "✓ Pedido listo";
    panel.scrollTop = 0;
    if (n === 2) pintarPago();
  }
  function abrirCarrito() {
    if (pasoActual !== 3) paso(1);
    panel.classList.add("abierto"); velo.classList.add("visible"); panel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function cerrarCarrito() {
    panel.classList.remove("abierto"); velo.classList.remove("visible"); panel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (pasoActual === 3) paso(1);
  }
  $("#abrir-carrito").onclick = abrirCarrito;
  $("#cerrar-carrito").onclick = cerrarCarrito;
  velo.onclick = cerrarCarrito;
  $("#volver-1").onclick = () => paso(1);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("abierto")) cerrarCarrito(); });

  // ---------- Paso 2: datos y pago ----------
  const DISTRITOS = ["Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Cercado de Lima", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas",
    "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lince", "Los Olivos", "Lurigancho-Chosica", "Lurín",
    "Magdalena del Mar", "Miraflores", "Pachacámac", "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac",
    "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres",
    "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador",
    "Villa María del Triunfo", "Callao", "Bellavista", "Carmen de la Legua-Reynoso", "La Perla", "La Punta", "Mi Perú", "Ventanilla"];
  const DEPARTAMENTOS = ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco",
    "Ica", "Junín", "La Libertad", "Lambayeque", "Lima (provincias)", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno",
    "San Martín", "Tacna", "Tumbes", "Ucayali"];
  const opciones = (lista, texto) => `<option value="">${texto}</option>` + lista.map((d) => `<option>${d}</option>`).join("");
  $("#distritos").innerHTML = opciones(DISTRITOS, "Elige tu distrito");
  $("#departamentos").innerHTML = opciones(DEPARTAMENTOS, "Elige");

  const form = $("#paso-2");
  // Recordar los datos del cliente para su próxima compra.
  const cliente = leer("galmor_cliente", {});
  for (const [k, v] of Object.entries(cliente)) {
    const campo = form.elements[k];
    if (!campo) continue;
    if (campo instanceof RadioNodeList) $$(`[name="${k}"]`, form).forEach((r) => (r.checked = r.value === v));
    else campo.value = v;
  }
  function mostrarEnvio() {
    const lima = form.envio.value === "lima";
    $("#envio-lima").hidden = !lima;
    $("#envio-provincia").hidden = lima;
  }
  function pintarPago() {
    const metodo = form.pago.value;
    const d = C.pago[metodo.toLowerCase()];
    const filas = metodo === "Transferencia"
      ? [["Banco", d.banco], ["Cuenta", d.cuenta], ["CCI", d.cci], ["Titular", d.titular]]
      : [[metodo, d.numero], ["A nombre de", d.titular]];
    $("#datos-pago").innerHTML = filas.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")
      + `<div><span>Monto exacto</span></div><div class="monto">${soles(total())}</div>`;
  }
  mostrarEnvio();
  form.addEventListener("change", (e) => {
    if (e.target.name === "envio") mostrarEnvio();
    if (e.target.name === "pago") pintarPago();
  });

  const REGLAS = {
    nombre: (v) => v.trim().split(/\s+/).length >= 2 || "Escribe tu nombre y apellido",
    dni: (v) => /^\d{8}$/.test(v) || "El DNI tiene 8 dígitos",
    celular: (v) => /^9\d{8}$/.test(v) || "9 dígitos, empieza con 9",
    correo: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Revisa tu correo",
    direccion: (v, f) => f.envio !== "lima" || v.trim().length > 4 || "Escribe tu dirección",
    distrito: (v, f) => f.envio !== "lima" || !!v || "Elige tu distrito",
    departamento: (v, f) => f.envio !== "provincia" || !!v || "Elige el departamento",
    ciudad: (v, f) => f.envio !== "provincia" || v.trim().length > 1 || "Escribe tu provincia o ciudad",
    sede: (v, f) => f.envio !== "provincia" || v.trim().length > 1 || "Escribe la sede de la agencia",
  };
  function validar(f) {
    let primero = null;
    for (const [k, regla] of Object.entries(REGLAS)) {
      const ok = regla(f[k] || "", f);
      const campo = form.elements[k].closest(".campo");
      campo.classList.toggle("mal", ok !== true);
      $(".error", campo).textContent = ok === true ? "" : ok;
      if (ok !== true && !primero) primero = form.elements[k];
    }
    if (primero) primero.focus();
    return !primero;
  }
  form.addEventListener("input", (e) => {
    const campo = e.target.closest(".campo");
    if (campo?.classList.contains("mal")) { campo.classList.remove("mal"); $(".error", campo).textContent = ""; }
  });

  // ---------- Paso 3: imagen del pedido ----------
  let pedido = null;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (!validar(f)) return;
    localStorage.setItem("galmor_cliente", JSON.stringify(f));
    const boton = $("[type=submit]", form);
    boton.disabled = true;
    boton.textContent = "Generando…";
    try {
      const ahora = new Date();
      const parte = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", ...o }).format(ahora);
      // GT-AAMMDD-XXXX: fecha del pedido + 4 letras al azar, para que dos pedidos del mismo día nunca se repitan.
      const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
      const azar = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => LETRAS[n % LETRAS.length]).join("");
      const numero = `GT-${parte({ year: "2-digit" })}${parte({ month: "2-digit" })}${parte({ day: "2-digit" })}-${azar}`;
      const items = carrito.map((i) => ({ ...i }));
      const salida = despacho(ahora);
      const blob = await imagenPedido(f, numero, ahora, items, salida);
      const texto = mensajePedido(f, numero, ahora);
      registrar(f, numero, ahora, items, salida);
      pedido = { numero, texto, archivo: new File([blob], `pedido-${numero}.png`, { type: "image/png" }) };
      $("#pedido-img").src = URL.createObjectURL(blob);
      $("#abrir-chat").href = wsp(texto);
      carrito = [];
      guardar();
      pintarCarrito();
      paso(3);
    } finally {
      boton.disabled = false;
      boton.textContent = "Generar mi pedido";
    }
  });

  // Celular: se comparte la imagen directo a WhatsApp. Computadora: se descarga y se abre el chat con el resumen.
  $("#enviar-imagen").onclick = async () => {
    const archivo = pedido.archivo;
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try { return await navigator.share({ files: [archivo], text: pedido.texto }); } catch (err) { if (err.name === "AbortError") return; }
    }
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(archivo), download: archivo.name }).click();
    window.open(wsp(pedido.texto), "_blank");
  };

  // Mensaje de WhatsApp: solo el saludo con los datos del cliente; el detalle va en la imagen.
  function mensajePedido(f, numero, fecha) {
    const hora = +new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "2-digit", hour12: false }).format(fecha);
    const saludo = hora < 12 ? "buenos días" : hora < 19 ? "buenas tardes" : "buenas noches";
    return `Hola, ${saludo}. Mi nombre es ${f.nombre}, DNI ${f.dni}, celular ${f.celular}. Este es el pedido que necesito: *${numero}*`;
  }

  // Despacho: pedidos hasta las 4:59 p.m. (hora de Lima) salen mañana; desde las 5 p.m., pasado mañana.
  function despacho(fecha) {
    const lima = (o) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", ...o }).format(fecha);
    const [a, m, d] = lima({ year: "numeric", month: "2-digit", day: "2-digit" }).split("-").map(Number);
    const hora = +lima({ hour: "2-digit", hour12: false });
    const dia = new Date(Date.UTC(a, m - 1, d + (hora >= C.horaCorte ? 2 : 1), 12));
    return { iso: dia.toISOString().slice(0, 10), texto: dia.toLocaleDateString("es-PE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }) };
  }

  // Registro en la hoja de Google del panel de pedidos (si está configurada en productos.js).
  function registrar(f, numero, fecha, items, salida) {
    if (!C.registro) return;
    const datos = { n: numero, d: fecha.toISOString(), s: salida.iso, x: descuento(items), t: total(items), c: f,
      i: items.map((i) => [i.id, i.color, i.talla, i.cant, producto(i.id).precio]) };
    // Reason: "no-cors" + text/plain evita el bloqueo del navegador; la respuesta no se lee.
    fetch(C.registro, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ accion: "nuevo", pedido: datos }) })
      .catch(() => {});
  }

  const cargarImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  async function imagenPedido(f, numero, fecha, items, salida) {
    const FT = '"Barlow Condensed"', FX = '"Inter"';
    await Promise.all([`800 40px ${FT}`, `800 40px ${FT}`, `500 20px ${FX}`, `600 20px ${FX}`, `400 20px ${FX}`].map((x) => document.fonts.load(x)));
    const fotos = await Promise.all(items.map((i) => cargarImg(fotoColor(producto(i.id), i.color))));
    const W = 1080, P = 56, FILA = 196;
    const cv = document.createElement("canvas");
    const x = cv.getContext("2d");

    const envio = f.envio === "lima"
      ? [["Envío", "Lima · Motorizado (llega mañana)"], ["Dirección", `${f.direccion}, ${f.distrito}`]]
      : [["Envío", `Provincia · ${f.agencia} (2 a 4 días)`], ["Destino", `${f.ciudad}, ${f.departamento}`], ["Sede", f.sede]];
    const datos = [["Cliente", f.nombre], ["DNI", f.dni], ["Celular", f.celular], ...(f.correo ? [["Correo", f.correo]] : []),
      ["Comprobante", `${f.comprobante} · ${f.pago}`], ...envio, ["Despacho", salida.texto]];

    // Medidas: se ajusta el alto a la cantidad de datos y prendas.
    x.font = `400 24px ${FX}`;
    const partir = (texto, ancho) => {
      const lineas = [""];
      for (const palabra of String(texto).split(" ")) {
        const prueba = (lineas.at(-1) + " " + palabra).trim();
        if (x.measureText(prueba).width > ancho && lineas.at(-1)) lineas.push(palabra);
        else lineas[lineas.length - 1] = prueba;
      }
      return lineas;
    };
    const datosLineas = datos.map(([k, v]) => [k, partir(v, W - P - 300)]);
    const altoDatos = datosLineas.reduce((s, [, l]) => s + l.length * 34 + 12, 0);
    const dto = descuento(items);
    const H = 300 + altoDatos + 40 + items.length * FILA + 330 + 120 + (dto ? 80 : 0);
    cv.width = W;
    cv.height = H;

    const texto = (t, px, py, fuente, color, alin = "left", espacio = "0px") => {
      x.font = fuente; x.fillStyle = color; x.textAlign = alin; x.letterSpacing = espacio; x.fillText(t, px, py);
    };
    const caja = (px, py, w, h, color) => { x.fillStyle = color; x.fillRect(px, py, w, h); };

    caja(0, 0, W, H, "#FFFFFF");
    // Cabecera
    caja(0, 0, W, 250, "#1E2A52");
    texto("GALMOR TEXTILES", P, 104, `800 76px ${FT}`, "#FFFFFF", "left", "2px");
    texto("DESDE 1988 · LIMA", P, 146, `500 20px ${FX}`, "#AEB6D0", "left", "6px");
    texto(`PEDIDO N.° ${numero}`, P, 212, `800 40px ${FT}`, "#FFFFFF", "left", "1px");
    const fechaTxt = `${fecha.toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" })} · ${fecha.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hour12: true })}`;
    texto(fechaTxt, W - P, 212, `500 22px ${FX}`, "#FFFFFF", "right");

    // Datos del cliente
    let y = 306;
    for (const [k, lineas] of datosLineas) {
      texto(k.toUpperCase(), P, y, `600 18px ${FX}`, "#6B6B6B", "left", "2px");
      lineas.forEach((l, j) => texto(l, 300, y + j * 34, `400 24px ${FX}`, "#1E2A52"));
      y += lineas.length * 34 + 12;
    }
    y += 8;
    caja(P, y, W - 2 * P, 3, "#1E2A52");
    y += 28;

    // Prendas
    items.forEach((i, k) => {
      const p = producto(i.id), foto = fotos[k];
      caja(P, y, 128, 160, "#F2F2F2");
      if (foto) {
        const esc = Math.max(128 / foto.width, 160 / foto.height);
        const sw = 128 / esc, sh = 160 / esc;
        x.drawImage(foto, (foto.width - sw) / 2, 0, sw, sh, P, y, 128, 160);
      }
      const nombre = partir(p.nombre.toUpperCase(), 560);
      x.font = `800 30px ${FT}`;
      nombre.slice(0, 2).forEach((l, j) => texto(l, P + 156, y + 34 + j * 32, `800 30px ${FT}`, "#1E2A52"));
      const yDet = y + 34 + Math.min(nombre.length, 2) * 32 + 8;
      texto(`${marcaDe(p)} · ${i.color} · Talla ${i.talla} · x${i.cant}`, P + 156, yDet, `400 22px ${FX}`, "#333333");
      texto(soles(p.precio * i.cant), W - P, y + 40, `800 34px ${FT}`, "#1E2A52", "right");
      y += FILA;
      caja(P, y - 18, W - 2 * P, 1, "#E5E5E5");
    });

    // Totales
    const t = total(items), b = base(t);
    y += 22;
    const lineasTotal = dto ? [["Subtotal", soles(subtotal(items))], [`Pack −${pack(items).descuento} %`, `−${soles(dto)}`]] : [];
    for (const [k, v] of [...lineasTotal, ["Op. gravada", soles(b)], ["IGV (18 %)", soles(t - b)]]) {
      texto(k, W - 380, y, `400 24px ${FX}`, "#333333");
      texto(v, W - P, y, `500 24px ${FX}`, "#333333", "right");
      y += 40;
    }
    caja(P, y, W - 2 * P, 130, "#F4F0E9");
    texto("TOTAL", P + 28, y + 86, `800 48px ${FT}`, "#1E2A52", "left", "1px");
    texto(soles(t), W - P - 28, y + 92, `800 84px ${FT}`, "#3F4A2A", "right");
    texto(`${piezas(items)} prenda(s) · precios con IGV`, P + 28, y + 116, `400 18px ${FX}`, "#6B6B6B");

    // Pie
    caja(0, H - 120, W, 120, "#3F4A2A");
    texto("ENVÍA ESTA IMAGEN Y LA CAPTURA DE TU PAGO AL 983 573 288", W / 2, H - 50, `800 34px ${FT}`, "#FFFFFF", "center", "1px");
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }

  // ---------- Packs, "Ver todo", destacado y preguntas ----------
  const fotosPack = C.productos.map((p) => modelos(p)[0] || fotoColor(p, nombresColor(p)[0]));
  $("#packs-lista").innerHTML = (C.packs || []).map((k, n) => `<div class="pack ${k.etiqueta === "Más popular" ? "estrella" : ""}">
      ${k.etiqueta ? `<span class="pack-tag">${k.etiqueta}</span>` : ""}
      <div class="pack-fotos">${fotosPack.slice(n, n + Math.min(k.prendas, 3)).map((f) => `<img src="${f}" alt="" loading="lazy">`).join("")}</div>
      <b>${k.prendas}${n === C.packs.length - 1 ? "+" : ""} prendas</b><span class="pct">−${k.descuento} %</span>
      <small>Mezcla modelos, colores y tallas</small>
      <a class="btn btn-denim" href="#catalogo">Elegir prendas</a></div>`).join("");
  $("#ver-todo").onclick = () => filtrar("todos");
  $$("[data-abrir]").forEach((b) => (b.onclick = () => abrirProducto(b.dataset.abrir)));
  $("#faq-wsp").href = wsp("Hola Galmor, tengo una consulta.");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const opiniones = C.opiniones || [];
  $("#opiniones").innerHTML = opiniones.length
    ? opiniones.map((o) => `<div class="opinion"><span class="estrellas">${"★".repeat(o.estrellas || 5)}</span><p>${esc(o.texto)}</p><b>— ${esc(o.nombre)}</b></div>`).join("")
    : `<p class="opiniones-vacio" style="grid-column:1/-1;text-align:center">¿Ya compraste? Cuéntanos qué te pareció tu pantalón y publicamos tu opinión aquí.</p>`;
  $("#opinar").href = wsp("Hola Galmor, quiero dejar mi opinión sobre mi compra: ");

  // ---------- Inicio ----------
  const cinta = "Envío a todo el Perú ★ Lima: pide hoy, llega mañana ★ Precios con IGV ★ Yape · Plin · Transferencia ★";
  $("#cinta").innerHTML = `<span>${cinta}</span>`.repeat(4);
  $("#wsp-flotante").href = wsp("Hola Galmor, quiero información de sus productos.");
  const ICONOS = {
    Facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
    Instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
    TikTok: '<path d="M14 3v11.5A3.5 3.5 0 1 1 10.5 11"/><path d="M14 3c.6 2.6 2.4 4.4 5 5"/>',
    WhatsApp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1.2 1.8.8"/>',
  };
  const enlaces = { Facebook: C.redes.facebook, Instagram: C.redes.instagram, TikTok: C.redes.tiktok, WhatsApp: wsp() };
  $("#redes").innerHTML = Object.entries(ICONOS).map(([n, svg]) =>
    `<a href="${enlaces[n]}" target="_blank" rel="noopener" aria-label="${n}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></a>`).join("");
  $("#pie-texto").innerHTML = `<a href="${wsp()}" target="_blank" rel="noopener">WhatsApp 983 573 288</a> · `
    + `<a href="${wsp("Hola, quiero información sobre cambios y devoluciones.")}" target="_blank" rel="noopener">Cambios y devoluciones</a> · `
    + `<a href="${wsp("Hola, necesito ayuda con mi talla.")}" target="_blank" rel="noopener">Guía de tallas</a> · © ${new Date().getFullYear()} Galmor Textiles`;

  pintarPestanas();
  pintarCatalogo();
  pintarCarrito();
  // Enlace directo a un producto y color: ?producto=jogger-cargo&color=negro
  const q = new URLSearchParams(location.search);
  if (q.get("producto")) abrirProducto(q.get("producto"), q.get("color"));
})();
