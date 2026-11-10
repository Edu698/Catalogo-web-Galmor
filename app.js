(async () => {
  const C = window.CATALOGO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const soles = (n) => "S/ " + n.toFixed(2);
  const producto = (id) => C.productos.find((p) => p.id === id);
  const wsp = (texto) => `https://wa.me/${C.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Fotos: fotos/<id>/<color>.webp y fotos/<id>/modelo-N.webp ----------
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");
  const V = C.versionFotos ? `?v=${C.versionFotos}` : "";
  const fotoColor = (p, color) => (p.sinFoto ? "marca/sin-foto.webp" : `fotos/${p.id}/${slug(color)}.webp${V}`);
  const modelos = (p) => Array.from({ length: p.modelos || 0 }, (_, i) => `fotos/${p.id}/modelo-${i + 1}.webp${V}`);
  const nombresColor = (p) => Object.keys(p.colores);
  const marcaDe = (p) => C.marcas[p.marca];

  // ---------- 1. Bienvenida: una vez por visita; pantalla negra 3 s y sube como telón ----------
  const splash = $("#splash");
  if (sessionStorage.getItem("galmor_visto")) splash.remove();
  else {
    sessionStorage.setItem("galmor_visto", "1");
    setTimeout(() => splash.classList.add("fuera"), quieto ? 900 : 3000);
    setTimeout(() => splash.remove(), quieto ? 1000 : 3900);
  }

  // ---------- Catálogo: nombres, tallas y precios vienen del servidor (panel); fotos y colores de productos.js ----------
  const SIN_COLOR = "Color a coordinar";
  try {
    const { productos } = await (await fetch("/api/catalogo")).json();
    C.productos = productos.map((x) => {
      const d = (C.detalles || []).find((y) => y.id === x.codigo);
      return { ...x, id: x.codigo, precio: x.precios[0], modelos: d?.modelos || 0, descripcion: d?.descripcion || "",
        colores: d?.colores || { [SIN_COLOR]: "#cfc6bc" }, sinFoto: !d,
        ficha: { ...(x.tela ? { Tela: x.tela } : {}), ...(d?.ficha || {}), ...(x.publico === "Niño" ? { Público: "Niño" } : {}) } };
    });
  } catch {
    C.productos = [];
    $("#rejilla").innerHTML = `<p class="vacio">No se pudo cargar el catálogo. Revisa tu internet y recarga la página.</p>`;
  }

  // Precio por talla y cantidad. Cant. 1, 3, 6 y 12 son de talla chica (28-34, niño 2-8);
  // la talla media (36, niño 10-16) y la extra (38-40) suman su recargo. La cantidad cuenta todas las prendas del carrito.
  const NIVELES = [1, 3, 6, 12];
  const grupoTalla = (p, t) => (p.publico === "Niño" ? (+t >= 10 ? "media" : "chica") : +t >= 38 ? "extra" : +t === 36 ? "media" : "chica");
  const recargo = (p, t) => ({ chica: 0, media: p.recargoMedia, extra: p.recargoExtra })[grupoTalla(p, t)] || 0;
  const nivel = (n) => NIVELES.findLastIndex((k) => n >= k);
  const precioUnit = (p, t, n = 1) => p.precios[nivel(n)] + (t ? recargo(p, t) : 0);

  // ---------- 2. Cabecera, filtros y catálogo ----------
  const PESTANAS = { todos: "Todos", galmor: "Galmor", zoroz: "Zoroz 77" };
  const rango = (n) => (n < 60 ? "Hasta S/ 60" : n <= 75 ? "S/ 60 a S/ 75" : "Más de S/ 75");
  // Cada grupo del panel "Filtrar por": qué valores tiene cada producto.
  const GRUPOS = [
    { k: "marca", n: "Marca", abierto: true, de: (p) => [marcaDe(p)], fijos: Object.keys(PESTANAS).slice(1).map((m) => C.marcas[m]) },
    { k: "tipo", n: "Tipo de pantalón", abierto: true, de: (p) => [p.tipo] },
    { k: "color", n: "Color", de: (p) => (p.sinFoto ? [] : nombresColor(p)) },
    { k: "talla", n: "Talla", de: (p) => p.tallas },
    { k: "corte", n: "Corte", de: (p) => (p.ficha.Calce ? [p.ficha.Calce] : []) },
    { k: "material", n: "Material", de: (p) => (p.ficha.Tela ? [p.ficha.Tela] : []) },
    { k: "precio", n: "Precio", de: (p) => [rango(p.precio)], fijos: ["Hasta S/ 60", "S/ 60 a S/ 75", "Más de S/ 75"] },
  ];
  const elegidos = Object.fromEntries(GRUPOS.map((g) => [g.k, new Set()]));
  const tono = (c) => C.productos.find((p) => p.colores[c])?.colores[c];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function pintarFiltros() {
    $("#grupos").innerHTML = GRUPOS.map((g) => {
      const valores = [...new Set([...(g.fijos || []), ...C.productos.flatMap(g.de)])];
      const opciones = valores.map((v) => {
        const n = C.productos.filter((p) => g.de(p).includes(v)).length;
        const punto = g.k === "color" ? `<i style="background:${tono(v)}"></i>` : "";
        return `<label><input type="checkbox" data-grupo="${g.k}" value="${esc(v)}" ${elegidos[g.k].has(v) ? "checked" : ""}>${punto}${esc(v)} <small>(${n})</small></label>`;
      }).join("");
      return `<details ${g.abierto ? "open" : ""}><summary>${g.n}</summary><div class="opciones opciones-${g.k}">${opciones}</div></details>`;
    }).join("") + `<button class="btn-texto" id="limpiar-filtros">Limpiar filtros</button>`;
  }
  function pintarPestanas() {
    const m = elegidos.marca;
    const activa = m.size === 1 ? Object.keys(C.marcas).find((k) => m.has(C.marcas[k])) : m.size ? "" : "todos";
    $("#pestanas").innerHTML = Object.entries(PESTANAS)
      .map(([id, n]) => `<button data-marca="${id}" class="${id === activa ? "activa" : ""}" aria-pressed="${id === activa}">${n}</button>`)
      .join("") + `<a href="#descubre">Descubre</a>`;
  }

  const leerLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  let favoritos = leerLS("galmor_favoritos", []);
  const ICONO_BOLSA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>`;
  function tarjeta(p) {
    const colores = nombresColor(p);
    // Si se filtró por color, la tarjeta abre en ese color.
    const c0 = colores.find((c) => elegidos.color.has(c)) || colores[0];
    const fav = favoritos.includes(p.id);
    const puntos = p.sinFoto ? "" : colores.slice(0, 5).map((c) => `<button data-punto="${c}" class="${c === c0 ? "activo" : ""}" style="background:${p.colores[c]}" title="${c}" aria-label="Color ${c}"></button>`).join("");
    return `<article class="tarjeta" data-id="${p.id}" data-color="${c0}">
      <button class="tarjeta-foto" data-ver aria-label="Ver ${p.nombre}"><img src="${fotoColor(p, c0)}" alt="${p.nombre}, color ${c0}" loading="lazy"></button>
      <button class="corazon ${fav ? "activo" : ""}" data-fav aria-pressed="${fav}" aria-label="Guardar en favoritos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9-9.2C2 7.6 4 5 6.8 5c2 0 3.4 1.2 5.2 3.2C13.8 6.2 15.2 5 17.2 5 20 5 22 7.6 21 10.8 19.5 15.4 12 20 12 20z"/></svg></button>
      <div class="tarjeta-info">
        <button class="tarjeta-nombre" data-ver>${p.nombre}</button>
        <span class="tarjeta-marca">${marcaDe(p)}</span>
        <span class="precio">${soles(p.precio)}</span>
        <div class="puntos">${puntos}${colores.length > 5 ? `<button class="mas" data-ver aria-label="Ver los ${colores.length} colores">+${colores.length - 5}</button>` : ""}</div>
        <div class="tallas-mini">${p.tallas.map((t) => `<button data-talla="${t}">${t}</button>`).join("")}</div>
        <p class="aviso-talla" role="alert"></p>
        <button class="btn-agregar" data-agregar>${ICONO_BOLSA}Agregar al carrito</button>
      </div></article>`;
  }
  const tilePronto = () => `<div class="pronto"><small>Próximamente</small><b>Galmor</b>
      <p>Classic Men · Mejor imposible. Sé el primero en saberlo.</p>
      <a class="btn" href="${wsp("Hola Galmor, avísenme cuando llegue la colección Galmor.")}" target="_blank" rel="noopener">Avísame por WhatsApp</a></div>`;
  const ORDEN = { menor: (a, b) => a.precio - b.precio, mayor: (a, b) => b.precio - a.precio, nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es") };
  function pintarCatalogo() {
    const m = elegidos.marca;
    $("#titulo-catalogo").textContent = m.size === 1 ? [...m][0] : "Nuestra colección";
    const norma = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const texto = $("#buscar").value.trim(), busca = norma(texto);
    const lista = C.productos
      .filter((p) => GRUPOS.every((g) => !elegidos[g.k].size || g.de(p).some((v) => elegidos[g.k].has(v))))
      .filter((p) => !busca || busca.split(/\s+/).every((t) => norma(`${p.nombre} ${p.tipo} ${nombresColor(p).join(" ")}`).includes(t)));
    if (ORDEN[$("#orden").value]) lista.sort(ORDEN[$("#orden").value]);
    // Galmor aún no tiene productos: se muestra el aviso "Próximamente" si no hay otros filtros que lo descarten.
    const otros = GRUPOS.some((g) => g.k !== "marca" && elegidos[g.k].size) || texto;
    const pronto = !otros && (!m.size || m.has(C.marcas.galmor));
    $("#rejilla").innerHTML = lista.map(tarjeta).join("") + (pronto ? tilePronto() : "")
      || `<p class="vacio">No encontramos productos${texto ? ` para «${esc(texto)}»` : " con esos filtros"}. <button class="btn-texto" data-limpiar>Ver todos</button></p>`;
  }
  function limpiarFiltros() {
    Object.values(elegidos).forEach((s) => s.clear());
    $("#buscar").value = "";
    pintarFiltros();
    pintarPestanas();
    pintarCatalogo();
  }

  $("#pestanas").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    elegidos.marca.clear();
    if (b.dataset.marca !== "todos") elegidos.marca.add(C.marcas[b.dataset.marca]);
    pintarFiltros();
    pintarPestanas();
    pintarCatalogo();
    $("#catalogo").scrollIntoView({ behavior: quieto ? "auto" : "smooth" });
  });
  $("#grupos").addEventListener("change", (e) => {
    const c = e.target;
    elegidos[c.dataset.grupo][c.checked ? "add" : "delete"](c.value);
    if (c.dataset.grupo === "marca") pintarPestanas();
    pintarCatalogo();
  });
  $("#grupos").addEventListener("click", (e) => { if (e.target.id === "limpiar-filtros") limpiarFiltros(); });
  $("#orden").addEventListener("change", pintarCatalogo);
  $("#btn-filtrar").onclick = () => {
    const abierto = $("#filtros").classList.toggle("abierto");
    $("#btn-filtrar").setAttribute("aria-expanded", abierto);
  };
  $("#buscar").addEventListener("input", pintarCatalogo);
  $("#abrir-buscar").onclick = () => {
    const caja = $("#buscador");
    caja.hidden = !caja.hidden;
    $("#abrir-buscar").setAttribute("aria-expanded", !caja.hidden);
    if (!caja.hidden) { $("#catalogo").scrollIntoView({ behavior: quieto ? "auto" : "smooth" }); $("#buscar").focus({ preventScroll: true }); }
  };

  $("#rejilla").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.limpiar !== undefined) return limpiarFiltros();
    const t = e.target.closest(".tarjeta");
    if (!b || !t) return;
    const p = producto(t.dataset.id);
    if (b.dataset.ver !== undefined) return abrirProducto(p.id, slug(t.dataset.color));
    if (b.dataset.punto) {
      t.dataset.color = b.dataset.punto;
      $(".tarjeta-foto img", t).src = fotoColor(p, b.dataset.punto);
      $$(".puntos [data-punto]", t).forEach((x) => x.classList.toggle("activo", x === b));
    } else if (b.dataset.fav !== undefined) {
      favoritos = favoritos.includes(p.id) ? favoritos.filter((x) => x !== p.id) : [...favoritos, p.id];
      localStorage.setItem("galmor_favoritos", JSON.stringify(favoritos));
      b.classList.toggle("activo");
      b.setAttribute("aria-pressed", b.classList.contains("activo"));
    } else if (b.dataset.talla) {
      $$(".tallas-mini button", t).forEach((x) => x.classList.toggle("activa", x === b));
      $(".precio", t).textContent = soles(precioUnit(p, b.dataset.talla));
      $(".aviso-talla", t).textContent = "";
    } else if (b.dataset.agregar !== undefined) {
      const talla = $(".tallas-mini .activa", t)?.dataset.talla;
      if (!talla) {
        const fila = $(".tallas-mini", t);
        $(".aviso-talla", t).textContent = "Elige tu talla";
        fila.classList.remove("sacude"); void fila.offsetWidth; fila.classList.add("sacude");
        return;
      }
      agregar(p, t.dataset.color, talla, 1);
    }
  });

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
          ${p.descripcion ? `<p class="desc">${p.descripcion}</p>` : ""}
          <p class="rotulo"><span>Color: <b class="nombre-color"></b></span></p>
          <div class="muestras" ${p.sinFoto ? "hidden" : ""}>${colores.map((c) => `<button class="muestra" data-color="${c}" title="${c}" aria-label="${c}" style="background:${p.colores[c]}"></button>`).join("")}</div>
          <div class="tallas-bloque">
            <p class="rotulo"><span>Talla</span></p>
            <div class="tallas">${p.tallas.map((t) => `<button data-talla="${t}">${t}</button>`).join("")}</div>
            <p class="aviso-talla" role="alert"></p>
          </div>
          <p class="rotulo"><span>Cantidad</span></p>
          <div class="cantidad"><button data-d="-1" aria-label="Menos">−</button><span class="cant">1</span><button data-d="1" aria-label="Más">+</button></div>
          <button class="btn btn-denim agregar">Agregar al carrito · ${soles(p.precio)}</button>
          <div class="envio-nota"><b>Lima: pide hoy, llega mañana</b>Pedidos antes de las 5 p.m. Provincias: 2 a 4 días por Shalom u Olva.</div>
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
        const pu = soles(precioUnit(p, sel.talla));
        $(".info .precio", dlg).textContent = pu;
        $$(".agregar", dlg).forEach((b) => (b.textContent = `Agregar al carrito · ${pu}`));
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
  let carrito = leerLS("galmor_carrito", []).filter((i) => producto(i.id));
  const guardar = () => localStorage.setItem("galmor_carrito", JSON.stringify(carrito));
  const piezas = (items = carrito) => items.reduce((s, i) => s + i.cant, 0);
  // Precio de cada prenda según su talla y la cantidad total del carrito (se mezclan modelos, colores y tallas).
  const unitario = (i, items = carrito) => precioUnit(producto(i.id), i.talla, piezas(items));
  const subtotal = (items = carrito) => items.reduce((s, i) => s + precioUnit(producto(i.id), i.talla) * i.cant, 0);
  const total = (items = carrito) => Math.round(items.reduce((s, i) => s + unitario(i, items) * i.cant, 0) * 100) / 100;
  const descuento = (items = carrito) => Math.round((subtotal(items) - total(items)) * 100) / 100;
  const pack = (items = carrito) => NIVELES[nivel(piezas(items))];
  function siguientePack(items = carrito) {
    const k = NIVELES.find((x) => piezas(items) < x);
    return k ? `Lleva ${k - piezas(items)} prenda(s) más y paga menos por cada una.` : "";
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
        <span class="precio">${soles(unitario(i) * i.cant)}</span></div>`;
    }).join("");
    const t = total(), b = base(t), dto = descuento();
    $("#carrito-resumen").innerHTML = `<div class="resumen">
        ${dto ? `<div><span>Subtotal</span><span>${soles(subtotal())}</span></div>
        <div class="descuento"><span>Precio por ${pack()}+ prendas</span><span>−${soles(dto)}</span></div>` : ""}
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
  // Reason (dueño, 2026-11-08): DNI, celular y dirección son datos sensibles. Cada pedido empieza en blanco,
  // aunque otra persona haya comprado antes en el mismo equipo. Se borra lo guardado por versiones anteriores.
  localStorage.removeItem("galmor_cliente");
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
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    if (!validar(f)) return;
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
      // El pedido se guarda en el servidor y la imagen queda en un link que el WhatsApp lleva para ver o descargar.
      const link = await registrar(f, numero, ahora, items, salida, blob);
      const texto = mensajePedido(f, numero, ahora) + (link ? `\n\nVer y descargar mi pedido: ${link}` : "");
      const local = URL.createObjectURL(blob);
      $("#pedido-img").src = local;
      $("#enviar-pedido").href = wsp(texto);
      Object.assign($("#descargar-pedido"), { href: link ? `${link}?descargar=1` : local, download: `pedido-${numero}.png` });
      $("#sin-link").hidden = !!link;
      carrito = [];
      guardar();
      pintarCarrito();
      form.reset();
      mostrarEnvio();
      paso(3);
    } finally {
      boton.disabled = false;
      boton.textContent = "Generar mi pedido";
    }
  });

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

  // Guarda el pedido en el servidor (panel) y sube su imagen. Devuelve el link de la imagen, o "" si falló.
  async function registrar(f, numero, fecha, items, salida, imagen) {
    if (!C.registro) return "";
    const datos = { n: numero, d: fecha.toISOString(), s: salida.iso, x: descuento(items), t: total(items), c: f,
      i: items.map((i) => [i.id, i.color, i.talla, i.cant, unitario(i, items)]) };
    try {
      const r = await fetch(C.registro, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "nuevo", pedido: datos }) });
      if (!r.ok) return "";
      const img = await fetch(`${C.registro}/imagen?n=${encodeURIComponent(numero)}`, { method: "POST", headers: { "Content-Type": "image/png" }, body: imagen });
      return img.ok ? new URL((await img.json()).url, location.href).href : "";
    } catch { return ""; }
  }

  const cargarImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  async function imagenPedido(f, numero, fecha, items, salida) {
    const F = '"Jost"';
    await Promise.all([`400 20px ${F}`, `500 20px ${F}`, `600 20px ${F}`, `700 20px ${F}`].map((x) => document.fonts.load(x)));
    const [fotos, logos] = await Promise.all([
      Promise.all(items.map((i) => cargarImg(fotoColor(producto(i.id), i.color)))),
      Promise.all(["marca/logo-galmor.webp", "marca/logo-zoroz77.webp"].map(cargarImg)),
    ]);
    const W = 1080, P = 56, FILA = 196;
    const NEGRO = "#111111", CREMA = "#FAF6F1", ARENA = "#EFE6DC", GRIS = "#6B6B6B";
    const cv = document.createElement("canvas");
    const x = cv.getContext("2d");

    const envio = f.envio === "lima"
      ? [["Envío", "Lima · Motorizado (llega mañana)"], ["Dirección", `${f.direccion}, ${f.distrito}`]]
      : [["Envío", `Provincia · ${f.agencia} (2 a 4 días)`], ["Destino", `${f.ciudad}, ${f.departamento}`], ["Sede", f.sede]];
    const datos = [["Cliente", f.nombre], ["DNI", f.dni], ["Celular", f.celular], ...(f.correo ? [["Correo", f.correo]] : []),
      ["Comprobante", `${f.comprobante} · ${f.pago}`], ...envio, ["Despacho", salida.texto]];

    // Medidas: se ajusta el alto a la cantidad de datos y prendas.
    x.font = `400 24px ${F}`;
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
    const H = 300 + altoDatos + 40 + items.length * FILA + 330 + 140 + (dto ? 80 : 0);
    cv.width = W;
    cv.height = H;

    const texto = (t, px, py, fuente, color, alin = "left", espacio = "0px") => {
      x.font = fuente; x.fillStyle = color; x.textAlign = alin; x.letterSpacing = espacio; x.fillText(t, px, py);
    };
    const caja = (px, py, w, h, color) => { x.fillStyle = color; x.fillRect(px, py, w, h); };

    caja(0, 0, W, H, CREMA);
    // Marca de agua: logos de Galmor y Zoroz 77 en diagonal, muy suaves.
    x.save();
    x.globalAlpha = 0.05;
    x.filter = "grayscale(1)";
    x.translate(W / 2, H / 2);
    x.rotate(-Math.PI / 7);
    for (let fila = -6; fila <= 6; fila++) {
      for (let col = -2; col <= 2; col++) {
        const logo = logos[(fila + col + 100) % 2];
        if (!logo) continue;
        const ancho = 300, alto = ancho * logo.height / logo.width;
        x.drawImage(logo, col * 520 + (fila % 2) * 260 - ancho / 2, fila * 260 - alto / 2, ancho, alto);
      }
    }
    x.restore();

    // Cabecera negra con el logo de la tienda
    caja(0, 0, W, 250, NEGRO);
    texto("GALMOR", P, 100, `500 64px ${F}`, "#FFFFFF", "left", "22px");
    caja(P, 128, 46, 1.5, "#BDBDBD");
    texto("TEXTILES", P + 62, 136, `400 20px ${F}`, "#FFFFFF", "left", "12px");
    texto("ZOROZ 77 · GALMOR", W - P, 100, `500 20px ${F}`, "#BDBDBD", "right", "4px");
    texto(`PEDIDO N.° ${numero}`, P, 214, `600 36px ${F}`, "#FFFFFF", "left", "1px");
    const fechaTxt = `${fecha.toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" })} · ${fecha.toLocaleTimeString("es-PE", { timeZone: "America/Lima", hour: "numeric", minute: "2-digit", hour12: true })}`;
    texto(fechaTxt, W - P, 214, `400 22px ${F}`, "#FFFFFF", "right");

    // Datos del cliente
    let y = 306;
    for (const [k, lineas] of datosLineas) {
      texto(k.toUpperCase(), P, y, `500 17px ${F}`, GRIS, "left", "3px");
      lineas.forEach((l, j) => texto(l, 300, y + j * 34, `400 24px ${F}`, NEGRO));
      y += lineas.length * 34 + 12;
    }
    y += 8;
    caja(P, y, W - 2 * P, 2, NEGRO);
    y += 28;

    // Prendas
    items.forEach((i, k) => {
      const p = producto(i.id), foto = fotos[k];
      caja(P, y, 128, 160, ARENA);
      if (foto) {
        const esc = Math.max(128 / foto.width, 160 / foto.height);
        const sw = 128 / esc, sh = 160 / esc;
        x.drawImage(foto, (foto.width - sw) / 2, 0, sw, sh, P, y, 128, 160);
      }
      x.font = `600 28px ${F}`;
      const nombre = partir(p.nombre.toUpperCase(), 560);
      nombre.slice(0, 2).forEach((l, j) => texto(l, P + 156, y + 34 + j * 32, `600 28px ${F}`, NEGRO));
      const yDet = y + 34 + Math.min(nombre.length, 2) * 32 + 8;
      texto(`${marcaDe(p)} · ${i.color} · Talla ${i.talla} · x${i.cant}`, P + 156, yDet, `400 22px ${F}`, "#333333");
      texto(soles(unitario(i, items) * i.cant), W - P, y + 40, `600 32px ${F}`, NEGRO, "right");
      y += FILA;
      caja(P, y - 18, W - 2 * P, 1, "#E2D8CD");
    });

    // Totales
    const t = total(items), b = base(t);
    y += 22;
    const lineasTotal = dto ? [["Subtotal", soles(subtotal(items))], [`Precio por ${pack(items)}+ prendas`, `−${soles(dto)}`]] : [];
    for (const [k, v] of [...lineasTotal, ["Op. gravada", soles(b)], ["IGV (18 %)", soles(t - b)]]) {
      texto(k, W - 380, y, `400 24px ${F}`, "#333333");
      texto(v, W - P, y, `500 24px ${F}`, "#333333", "right");
      y += 40;
    }
    caja(P, y, W - 2 * P, 130, ARENA);
    texto("TOTAL", P + 28, y + 84, `600 44px ${F}`, NEGRO, "left", "4px");
    texto(soles(t), W - P - 28, y + 90, `700 78px ${F}`, NEGRO, "right");
    texto(`${piezas(items)} prenda(s) · precios con IGV`, P + 28, y + 116, `400 18px ${F}`, GRIS);

    // Pie
    caja(0, H - 140, W, 140, NEGRO);
    texto("ENVÍA TU CAPTURA DE PAGO AL 983 573 288", W / 2, H - 78, `600 32px ${F}`, "#FFFFFF", "center", "2px");
    texto("Gracias por tu compra · Galmor Textiles", W / 2, H - 40, `400 19px ${F}`, "#BDBDBD", "center");
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }

  // ---------- Packs, "Ver todo", destacado y preguntas ----------
  // "Arma tu pack": cuánto baja cada prenda al llevar 3, 6 o 12 (lo más común entre los productos).
  const ETIQUETAS = ["", "Más popular", "Mejor precio"];
  const rebaja = (k) => {
    const cuenta = {};
    for (const p of C.productos) { const d = Math.round((p.precios[0] - p.precios[k]) * 100) / 100; if (d > 0) cuenta[d] = (cuenta[d] || 0) + 1; }
    return +Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  };
  $("#packs-lista").innerHTML = NIVELES.slice(1).map((n, j) => `<div class="pack ${j === 1 ? "estrella" : ""}">
      ${ETIQUETAS[j] ? `<span class="pack-tag">${ETIQUETAS[j]}</span>` : ""}
      <img class="pack-foto" src="marca/pack-${j + 2}.webp" alt="" loading="lazy">
      <b>${n}${j === 2 ? "+" : ""} prendas</b><span class="pct">−S/ ${rebaja(j + 1)}</span>
      <small>menos por cada prenda</small>
      <a class="btn btn-cafe" href="#catalogo">Elegir prendas <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></div>`).join("");
  $$("[data-abrir]").forEach((b) => (b.onclick = () => abrirProducto(b.dataset.abrir)));
  $("#faq-wsp").href = wsp("Hola Galmor, tengo una consulta.");
  // ---------- Opiniones: las aprobadas en el panel (servidor) + las escritas en productos.js ----------
  function pintarOpiniones(lista) {
    $("#opiniones").innerHTML = lista.length
      ? lista.slice(0, 9).map((o) => `<div class="opinion"><span class="estrellas">${"★".repeat(o.estrellas || 5)}</span><p>${esc(o.texto)}</p><b>— ${esc(o.nombre)}</b></div>`).join("")
      : `<p class="opiniones-vacio" style="grid-column:1/-1;text-align:center">¿Ya compraste? Cuéntanos qué te pareció tu pantalón y publicamos tu opinión aquí.</p>`;
  }
  pintarOpiniones(C.opiniones || []);
  fetch("/api/opiniones").then((r) => r.json()).then((d) => pintarOpiniones([...d.opiniones, ...(C.opiniones || [])])).catch(() => {});

  // Ventanas de "Deja tu opinión" y "Mi pedido".
  $$(".ventana").forEach((v) => v.addEventListener("click", (e) => { if (e.target === v || e.target.dataset.cerrar !== undefined) v.close(); }));
  async function enviarJSON(url, datos) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
    return { ok: r.ok, ...(await r.json().catch(() => ({}))) };
  }
  $("#opinar").onclick = () => {
    $("#form-opinion").reset();
    $("#form-opinion").hidden = false;
    $("#gracias-opinion").hidden = true;
    $("#error-opinion").textContent = "";
    $("#ventana-opinion").showModal();
  };
  $("#form-opinion").onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const boton = $("button[type=submit]", e.target);
    boton.disabled = true;
    try {
      const r = await enviarJSON("/api/opiniones", f);
      if (!r.ok) throw new Error(r.error || "No se pudo enviar. Intenta otra vez.");
      e.target.hidden = true;
      $("#gracias-opinion").hidden = false;
    } catch (err) {
      $("#error-opinion").textContent = err.message.startsWith("Failed") ? "Sin conexión. Intenta otra vez." : err.message[0].toUpperCase() + err.message.slice(1) + ".";
    } finally { boton.disabled = false; }
  };

  const PASOS_PEDIDO = [["nuevo", "Recibido", "Esperamos la captura de tu pago."], ["pagado", "Pagado", "Estamos preparando tu pedido."], ["despachado", "Despachado", "Tu pedido ya salió."]];
  $("#abrir-seguimiento").onclick = () => {
    $("#resultado-seguimiento").innerHTML = "";
    $("#error-seguimiento").textContent = "";
    $("#ventana-seguimiento").showModal();
  };
  $("#form-seguimiento").onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    $("#error-seguimiento").textContent = "";
    $("#resultado-seguimiento").innerHTML = "";
    try {
      const r = await fetch(`/api/seguimiento?n=${encodeURIComponent(f.n.trim().toUpperCase())}&dni=${encodeURIComponent(f.dni.trim())}`);
      if (!r.ok) throw new Error(r.status === 404 ? "No encontramos ese pedido. Revisa el número y el DNI." : "Sin conexión. Intenta otra vez.");
      const d = await r.json();
      const actual = PASOS_PEDIDO.findIndex(([k]) => k === d.estado);
      const dia = new Date(d.despacho + "T12:00:00Z").toLocaleDateString("es-PE", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
      $("#resultado-seguimiento").innerHTML = `<ol class="seguimiento">${PASOS_PEDIDO.map(([, n, t], i) =>
        `<li class="${i <= actual ? "hecho" : ""}"><b>${n}</b>${i === actual ? `<small>${t}</small>` : ""}</li>`).join("")}</ol>
        ${actual < 2 ? `<p class="ventana-sub">Despacho previsto: <b>${dia}</b>${d.envio === "lima" ? " (Lima, motorizado)" : " (agencia a provincia)"}.</p>` : ""}
        <a class="btn btn-borde" href="${wsp(`Hola Galmor, consulto por mi pedido ${f.n.trim().toUpperCase()}.`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>`;
    } catch (err) { $("#error-seguimiento").textContent = err.message.startsWith("Failed") ? "Sin conexión. Intenta otra vez." : err.message; }
  };

  // ---------- Inicio ----------
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

  pintarFiltros();
  pintarPestanas();
  pintarCatalogo();
  pintarCarrito();
  // Enlace directo a un producto y color: ?producto=jogger-cargo&color=negro
  const q = new URLSearchParams(location.search);
  if (q.get("producto")) abrirProducto(q.get("producto"), q.get("color"));
})();
