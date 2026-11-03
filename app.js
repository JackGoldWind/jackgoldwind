/* app.js — sitio público generado por "Panel de Producción".
   Lee data.json (que publica la extensión) y pinta: perfil/contacto,
   calendario de eventos (con "añadir a mi calendario"), lista de juegos
   jugados y el formulario de sugerencias.
   NO contiene ninguna clave privada: todo lo que ves aquí es público. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const enc = encodeURIComponent;
  const PAGE = 40;
  let data = null;
  const state = { search: "", platform: "", estado: "", shown: PAGE, sort: "az", view: "list", recentSort: "date", recentLayout: "cards", mostPeriod: "", mostLayout: "list" };
  // ⭐ v1.54: calificación del 1 al 10 al estilo IGN (la misma escala que el panel)
  const WORDS = ["", "Insufrible", "Doloroso", "Horrible", "Malo", "Mediocre", "Correcto", "Bueno", "Genial", "Increíble", "Obra maestra"];
  // v1.55: con los textos que eligió el dueño (p. ej. 10 = "Joder es cine")
  const verdict = (v) => {
    const i = Math.max(1, Math.min(10, Math.floor(v)));
    const own = ((data && data.options) || {}).scoreWords;
    return own && own[i] ? own[i] : WORDS[i];
  };
  const scoreTxt = (v) => (Number(v) % 1 ? Number(v).toFixed(1) : String(Number(v)));
  const scoreBadge = (v, note) => `<span class="score" title="Mi calificación: ${esc(scoreTxt(v))}/10"><span class="score-ring">${esc(scoreTxt(v))}</span><span class="score-txt"><span class="score-word">${esc(verdict(Number(v)))}</span>${note ? `<span class="score-note">“${esc(note)}”</span>` : ""}</span></span>`;
  const hoursTxt = (h) => (h >= 1 ? `${h % 1 ? h.toFixed(1) : h} h` : `${Math.max(1, Math.round(h * 60))} min`);
  const agoTxt = (t) => {
    const d = Math.floor((Date.now() - t) / 86400000);
    return d <= 0 ? "hoy" : d === 1 ? "ayer" : d < 30 ? `hace ${d} días` : new Date(t).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  };

  /* ---------- 🏆 v1.72: logros (Steam / RetroAchievements) ----------
     En la lista: barra de avance, "10/50" y el botón 🏆 Ver logros. El detalle se abre encima de la página (no cambia
     de página ni mueve lo que estabas viendo) y se carga de achievements.json solo la primera vez. */
  const achPct = (a) => (a && a.t ? Math.round((a.g / a.t) * 100) : 0);
  const achRow = (g) =>
    !g.ach || !g.ach.t
      ? ""
      : `<div class="ach-row"><div class="ach-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${g.ach.t}" aria-valuenow="${g.ach.g}" title="${achPct(g.ach)}% de los logros"><span style="width:${achPct(g.ach)}%"></span></div><span class="ach-n">🏆 <b>${g.ach.g}</b>/${g.ach.t}</span><button type="button" class="btn ach-btn" data-ach="${esc(g.ach.id)}">Ver logros</button></div>`;
  let achData = null;
  const ach = { id: "", filter: "all", q: "", grp: "", world: true, back: null };
  async function achDetail() {
    if (data.achDetail) return data.achDetail; // vista previa del panel
    if (!achData) achData = await (await fetch("achievements.json?" + enc(data.generatedAt || ""))).json();
    return achData;
  }
  const achDate = (t) => (t > 1 ? new Date(t).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "");
  const achX = `<button type="button" class="ach-x" aria-label="Cerrar">✕</button>`;
  async function openAch(id) {
    const g = (data.games || []).find((x) => x.ach && x.ach.id === id);
    if (!g) return;
    let m = $("#ach-modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "ach-modal";
      m.className = "ach-modal";
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      document.body.appendChild(m);
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest(".ach-x")) closeAch();
      });
    }
    Object.assign(ach, { id, filter: "all", q: "", grp: "", back: document.activeElement });
    m.hidden = false;
    m.style.setProperty("--ach-bg", "none");
    document.documentElement.classList.add("ach-open");
    m.innerHTML = `<div class="ach-box">${achX}<p class="muted ach-wait">Cargando logros…</p></div>`;
    let d = null;
    try {
      d = (await achDetail())[id];
    } catch (e) {
      d = null;
    }
    if (ach.id !== id || m.hidden) return;
    const box = m.querySelector(".ach-box");
    if (!d) {
      box.innerHTML = `${achX}<p class="muted ach-wait">No se pudieron cargar los logros.</p>`;
      return;
    }
    const pct = achPct(g.ach);
    const grps = [...new Set(d.l.map((x) => x.g).filter(Boolean))];
    const pts = d.l.reduce((a, x) => a + (x.pts || 0), 0);
    const ptsGot = d.l.reduce((a, x) => a + (x.u ? x.pts || 0 : 0), 0);
    const src = d.s === "ra" ? "RetroAchievements" + (d.c ? " · " + esc(d.c) : "") : "Steam";
    // fondo difuminado del juego (Steam: su imagen grande de la biblioteca; RetroAchievements: una captura)
    const bg = d.bg || g.image || "";
    m.style.setProperty("--ach-bg", bg ? `url("${String(bg).replace(/["\\\n]/g, "")}")` : "none");
    const cover = d.cv || g.image;
    box.innerHTML = `${achX}
      <div class="ach-head">
        ${cover ? `<img alt="" ${d.cv ? `class="cv" ` : ""}src="${esc(cover)}" />` : `<div class="noimg">🎮</div>`}
        <div class="ach-head-txt">
          <h2>${esc(g.name)}</h2>
          <p class="muted">${src} · Logros: ${g.ach.g} de ${g.ach.t}${g.hours ? " · Tiempo de juego: " + esc(hoursTxt(g.hours)) : ""}${pts ? ` · ${ptsGot}/${pts} puntos` : ""}</p>
          <div class="ach-prog"><div><b>${g.ach.g} de ${g.ach.t} logros desbloqueados</b> <span class="muted">(${pct}%)</span></div><div class="ach-bar big"><span style="width:${pct}%"></span></div></div>
        </div>
      </div>
      <div class="ach-tools">
        <label class="ach-sw"><input type="checkbox" id="ach-world" ${ach.world ? "checked" : ""}/> Mostrar % de jugadores</label>
        <span class="ach-grow"></span>
        ${grps.length > 1 ? `<select id="ach-grp"><option value="">Todos los juegos (${grps.length})</option>${grps.map((n) => `<option>${esc(n)}</option>`).join("")}</select>` : ""}
        <select id="ach-filter"><option value="all">Todos los logros</option><option value="got">Desbloqueados</option><option value="lock">Bloqueados</option></select>
        <input type="search" id="ach-q" placeholder="Buscar…" />
      </div>
      <div id="ach-list" class="ach-list"></div>`;
    const draw = () => {
      const q = ach.q.toLowerCase();
      const hit = (x) => (!ach.grp || x.g === ach.grp) && (!q || ((x.h ? "" : x.n) + " " + (x.d || "")).toLowerCase().includes(q));
      const got = d.l.filter((x) => x.u && hit(x)).sort((a, b) => (b.u || 0) - (a.u || 0));
      const lock = d.l.filter((x) => !x.u && hit(x));
      const meta = (x) =>
        (x.u ? `<span>✔ ${esc(achDate(x.u))}</span>` : "") +
        (x.hc ? `<span class="ach-hc" title="Desbloqueado en modo hardcore">Hardcore</span>` : "") +
        (x.pts ? `<span>${x.pts} pts</span>` : "") +
        (ach.world && x.p ? `<span class="ach-world" title="Jugadores que lo tienen"><i style="width:${Math.min(100, x.p)}%"></i><em>${x.p}%</em></span>` : "");
      const item = (x) => `<div class="ach-item ${x.u ? "got" : "lock"}">
          ${x.i ? `<img loading="lazy" alt="" src="${esc(x.i)}" />` : `<div class="ach-noimg">🏆</div>`}
          <div class="ach-txt"><b>${x.h ? "Logro oculto" : esc(x.n)}</b><span>${x.h ? "Sigue jugando para descubrirlo." : esc(x.d || "")}</span>${x.g && grps.length > 1 ? `<small class="ach-grp">🎮 ${esc(x.g)}</small>` : ""}</div>
          <div class="ach-meta">${meta(x)}</div>
        </div>`;
      const block = (title, arr) => `<h3 class="ach-sec">${title} (${arr.length})</h3>${arr.map(item).join("")}`;
      $("#ach-list").innerHTML = (ach.filter !== "lock" ? block("Logros desbloqueados", got) : "") + (ach.filter !== "got" ? block("Logros bloqueados", lock) : "");
    };
    $("#ach-world").onchange = (e) => {
      ach.world = e.target.checked;
      draw();
    };
    // v1.73.2: una colección (varios juegos de Steam): filtro por juego
    if ($("#ach-grp")) $("#ach-grp").onchange = (e) => {
      ach.grp = e.target.value;
      draw();
    };
    $("#ach-filter").onchange = (e) => {
      ach.filter = e.target.value;
      draw();
    };
    $("#ach-q").oninput = (e) => {
      ach.q = e.target.value;
      draw();
    };
    draw();
    box.querySelector(".ach-x").focus({ preventScroll: true });
  }
  function closeAch() {
    const m = $("#ach-modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    ach.id = "";
    document.documentElement.classList.remove("ach-open");
    if (ach.back && ach.back.focus) ach.back.focus({ preventScroll: true }); // sigues donde te quedaste
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-ach]");
    if (b) openAch(b.dataset.ach);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAch();
  });

  /* ---------- Helpers de eventos / calendario ---------- */

  function ytId(url) {
    const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  // Miniatura: la elegida por el usuario; si no, la de YouTube (resolución de miniatura de YouTube).
  function eventThumb(ev) {
    if (ev.image) return { src: ev.image, fallback: null };
    const id = ytId(ev.url);
    if (id) return { src: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, fallback: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    // solo Twitch y en vivo: la vista previa del directo
    const tw = twitchChannel(ev.twitchUrl || ev.url);
    if (tw && ev.live) return { src: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${tw.toLowerCase()}-640x360.jpg`, fallback: null };
    return null;
  }
  function twitchChannel(u) {
    const m = String(u || "").match(/twitch\.tv\/([A-Za-z0-9_]+)/);
    return m ? m[1] : "";
  }
  // Botones "Ver en YouTube" / "Ver en Twitch" (con su logo), o "Ver" para otros sitios
  function watchButtons(ev) {
    const out = [];
    const add = (url) => {
      if (!url) return;
      const net = window.SITE_BRANDS ? window.SITE_BRANDS.detectNetwork(url) : "link";
      const b = (window.SITE_BRANDS && window.SITE_BRANDS.BRANDS[net]) || null;
      const label = net === "youtube" ? "YouTube" : net === "twitch" ? "Twitch" : net === "kick" ? "Kick" : "";
      out.push(label
        ? `<a class="btn btn-watch" style="--brand:${esc(b.color)}" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="icons/${net}.svg" alt="" /> ${ev.live ? "Ver en vivo en" : "Ver en"} ${label}</a>`
        : `<a class="btn btn-accent" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ver</a>`);
    };
    add(ev.url);
    if (ev.twitchUrl && ev.twitchUrl !== ev.url) add(ev.twitchUrl);
    return out.join("");
  }
  const pad = (n) => String(n).padStart(2, "0");
  function fmtUTC(d) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }
  function range(ev) {
    const start = new Date(ev.startISO);
    const end = new Date(start.getTime() + (ev.durationMin || 60) * 60000);
    return { start, end };
  }
  function calendarLinks(ev) {
    const { start, end } = range(ev);
    const details = [ev.description, ev.url].filter(Boolean).join("\n");
    return [
      { label: "Google Calendar", href: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(ev.title)}&dates=${fmtUTC(start)}/${fmtUTC(end)}&details=${enc(details)}&location=${enc(ev.url || "")}` },
      { label: "Outlook.com", href: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${enc(ev.title)}&startdt=${enc(start.toISOString())}&enddt=${enc(end.toISOString())}&body=${enc(details)}&location=${enc(ev.url || "")}` },
      { label: "Microsoft 365", href: `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${enc(ev.title)}&startdt=${enc(start.toISOString())}&enddt=${enc(end.toISOString())}&body=${enc(details)}&location=${enc(ev.url || "")}` },
      { label: "Yahoo Calendar", href: `https://calendar.yahoo.com/?v=60&title=${enc(ev.title)}&st=${fmtUTC(start)}&et=${fmtUTC(end)}&desc=${enc(details)}&in_loc=${enc(ev.url || "")}` },
    ];
  }
  function icsText(ev) {
    const { start, end } = range(ev);
    const t = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Panel de Produccion//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${ev.id}@panel-produccion`, `DTSTAMP:${fmtUTC(new Date())}`, `DTSTART:${fmtUTC(start)}`, `DTEND:${fmtUTC(end)}`,
      `SUMMARY:${t(ev.title)}`, `DESCRIPTION:${t([ev.description, ev.url].filter(Boolean).join("\n"))}`, ev.url ? `URL:${ev.url}` : "", "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
  }
  function downloadIcs(ev) {
    const url = URL.createObjectURL(new Blob([icsText(ev)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(ev.title || "evento").replace(/[^\w-]+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ---------- Render ---------- */

  const DEFAULT_THEME = { bg: "#15202B", panel: "#1C2733", text: "#E7E9EA", accent: "#1D9BF0" };
  // Solo se tocan las variables que el usuario cambió: sin cambios, el sitio se ve exactamente como el diseño original.
  function applyTheme(t) {
    t = t || {};
    const r = document.documentElement.style;
    if (t.bg && t.bg.toLowerCase() !== DEFAULT_THEME.bg.toLowerCase()) r.setProperty("--bg", t.bg);
    if (t.panel && t.panel.toLowerCase() !== DEFAULT_THEME.panel.toLowerCase()) {
      r.setProperty("--panel", t.panel);
      r.setProperty("--panel2", "color-mix(in srgb, " + t.panel + " 88%, white 12%)");
      r.setProperty("--line", "color-mix(in srgb, " + t.panel + " 70%, white 30%)");
    }
    if (t.text && t.text.toLowerCase() !== DEFAULT_THEME.text.toLowerCase()) {
      r.setProperty("--text", t.text);
      r.setProperty("--dim", "color-mix(in srgb, " + t.text + " 60%, transparent)");
    }
    if (t.accent && t.accent.toLowerCase() !== DEFAULT_THEME.accent.toLowerCase()) r.setProperty("--accent", t.accent);
    if (t.font) r.setProperty("--font", t.font);
    // Temas inspirados en juegos (Ajustes → Sitio web → Tema): letra de títulos, segundo acento,
    // textura de fondo, forma de las esquinas y versión renovada del diseño.
    if (t.accent2) r.setProperty("--accent2", t.accent2);
    const fams = [t.fontHead, t.fontBody].filter(Boolean);
    if (fams.length) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?" + [...new Set(fams)].map((f) => "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;600;700;800").join("&") + "&display=swap";
      link.onerror = () => {};
      document.head.appendChild(link);
      if (t.fontHead) r.setProperty("--font-head", `"${t.fontHead}", ${t.font || "system-ui, sans-serif"}`);
      if (t.fontBody && !t.font) r.setProperty("--font", `"${t.fontBody}", system-ui, sans-serif`);
    }
    const cl = document.body.classList;
    if (t.motif && t.motif !== "none") cl.add("motif-" + t.motif);
    if (t.shape) cl.add("shape-" + t.shape);
    if (t.nova) {
      cl.add("nova");
      setupReveal();
    }
    if (t.light) cl.add("is-light");
    if (t.bgImage) {
      const bg = $("#bg-layer");
      bg.style.backgroundImage = "url('" + String(t.bgImage).replace(/'/g, "%27") + "')";
      bg.style.opacity = String((t.bgOpacity == null ? 35 : t.bgOpacity) / 100);
    }
  }

  // Versión renovada: las tarjetas aparecen suavemente al llegar a ellas (nada si pides menos movimiento)
  let revealOn = false;
  function setupReveal() {
    if (revealOn) return;
    revealOn = true;
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    const scan = () => document.querySelectorAll(".event:not(.rv), .game:not(.rv), .pcard:not(.rv), section h2:not(.rv)").forEach((el, i) => { el.classList.add("rv"); el.style.setProperty("--rv-i", i % 6); io.observe(el); });
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    scan();
  }

  function linkHtml(l) {
    const B = window.SITE_BRANDS || { BRANDS: {}, detectNetwork: () => "link" };
    const net = l.network || B.detectNetwork(l.url);
    const brand = B.BRANDS[net] || { color: "#4C8C86" };
    const icon = l.iconUrl || `icons/${net}.svg`;
    const color = l.color || brand.color;
    return `<a class="lnk${l.customIcon ? " lnk-custom" : ""}" style="--brand:${esc(color)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="${esc(l.label)}"><img src="${esc(icon)}" alt="" /><span>${esc(l.label)}</span></a>`;
  }

  // Banners de patrocinadores (columna derecha; abajo en el celular)
  // Marco del título "Patrocinadores": el elegido, o el que va con el tema del sitio
  const KIT_FRAME = { yakuza: "brush", rpg: "jrpg", win: "jrpg", quest: "ornate", lol: "ornate", card: "ornate", hud: "hud", terminal: "hud", pixel: "pixel", nmh: "pixel", itemget: "pixel", fighter: "plate", race: "plate", sport: "plate", action: "plate", comic: "comic", cozy: "comic", poster: "ribbon", horror: "paper", cam: "hud", achieve: "pill" };
  function sponsorFrame() {
    const f = data.sponsorsFrame || "auto";
    if (f !== "auto") return f;
    const t = data.theme || {};
    return KIT_FRAME[t.kit] || (t.preset ? "line" : "none");
  }
  function renderSponsors() {
    const box = $("#sponsors");
    if (!box) return;
    const list = (data.sponsors || []).filter((x) => x.image);
    box.hidden = !list.length;
    document.body.classList.toggle("has-sponsors", !!list.length);
    const fr = sponsorFrame();
    const need = { pixel: "Press+Start+2P", paper: "Special+Elite" }[fr];
    if (need && list.length && !document.querySelector(`link[data-frame-font="${fr}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.dataset.frameFont = fr;
      l.href = `https://fonts.googleapis.com/css2?family=${need}&display=swap`;
      document.head.appendChild(l);
    }
    box.innerHTML = list.length
      ? `<div class="sponsors-title frame-${esc(sponsorFrame())}"><span>${esc(data.sponsorsTitle || "Patrocinadores")}</span></div>` +
        list.map((x) => {
          const img = `<img src="${esc(x.image)}" alt="${esc(x.name || "Patrocinador")}" loading="lazy" />`;
          return x.url ? `<a class="sponsor" href="${esc(x.url)}" target="_blank" rel="sponsored noopener noreferrer" title="${esc(x.name || "")}">${img}</a>` : `<div class="sponsor">${img}</div>`;
        }).join("")
      : "";
  }

  function renderProfile() {
    const p = data.profile || {};
    applyTheme(data.theme);
    document.title = p.name || "Mi canal";
    if (p.icon) $("#favicon").href = p.icon;
    $("#name").textContent = p.name || "";
    $("#bio").textContent = p.bio || "";
    if (p.avatar) {
      const a = $("#avatar");
      a.src = p.avatar;
      a.hidden = false;
    }
    const nav = $("#links");
    nav.className = "links style-" + (p.contactStyle || "pills");
    nav.innerHTML = (data.links || []).map(linkHtml).join("");
    const c = p.contact;
    $("#contact").innerHTML = c && c.email
      ? `<a class="btn btn-accent" href="mailto:${esc(c.email)}?subject=${enc(c.subject || "")}"><img src="icons/mail.svg" alt="" />${esc(c.label || "Contactar")}</a>`
      : "";
    $("#updated").textContent = data.generatedAt ? `Actualizado: ${new Date(data.generatedAt).toLocaleDateString()}` : "";
  }

  function eventCard(ev) {
    const th = eventThumb(ev);
    const when = new Date(ev.startISO).toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const el = document.createElement("div");
    el.className = "event" + (ev.live ? " event-live" : "");
    el.innerHTML = `
      ${th ? `<img alt="" loading="lazy" src="${esc(th.src)}" />` : `<div class="ph">📺</div>`}
      <div class="body">
        <h3>${esc(ev.title)}</h3>
        <div class="when">${esc(when)}</div>
        <div class="countdown ${ev.live ? "is-live" : ""}" data-start="${esc(ev.startISO)}" data-live="${ev.live ? 1 : ""}">${countdownText(ev)}</div>
        ${ev.description ? `<div class="desc">${esc(ev.description)}</div>` : ""}
        <div class="actions">
          ${watchButtons(ev)}
          <button class="btn" data-addcal>📅 Añadir a mi calendario</button>
        </div>
      </div>`;
    const img = el.querySelector("img");
    if (img && th && th.fallback) img.addEventListener("error", () => { img.src = th.fallback; }, { once: true });
    if (img) img.addEventListener("error", () => { if (!th.fallback || img.src === th.fallback) img.replaceWith(Object.assign(document.createElement("div"), { className: "ph", textContent: "📺" })); });
    el.querySelector("[data-addcal]").addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".cal-menu").forEach((m) => m.remove());
      const menu = document.createElement("div");
      menu.className = "cal-menu";
      menu.innerHTML = calendarLinks(ev).map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join("") + `<button data-ics>Apple / otros (.ics)</button>`;
      menu.querySelector("[data-ics]").addEventListener("click", () => { downloadIcs(ev); menu.remove(); });
      el.querySelector(".actions").appendChild(menu);
    });
    return el;
  }

  /* Cuenta regresiva: "Comienza en 2 d 3 h" … "Comienza en 04:59" → "¡Comienza ahora!".
     Si el panel detecta con OBS que ya estás transmitiendo, el evento llega con live:true → "🔴 EN VIVO". */
  function countdownText(ev) {
    if (ev.live) return `<span class="live-dot"></span> EN VIVO`;
    let ms = new Date(ev.startISO).getTime() - Date.now();
    if (ms <= 0) return "¡Comienza ahora!";
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (d > 0) return `Comienza en ${d} d ${h} h ${pad(m)} min ${pad(sec)} s`;
    if (h > 0) return `Comienza en ${h} h ${pad(m)} min ${pad(sec)} s`;
    return `Comienza en ${pad(m)}:${pad(sec)}`;
  }
  setInterval(() => {
    document.querySelectorAll(".countdown[data-start]").forEach((el) => {
      if (el.dataset.live) return;
      el.innerHTML = countdownText({ startISO: el.dataset.start });
    });
  }, 1000);

  // Solo se muestran los eventos que no han terminado: cuando pasan, desaparecen solos del sitio.
  // Los que están EN VIVO se quedan hasta que el panel avisa que terminó la transmisión.
  function renderEvents() {
    const box = $("#events");
    const now = Date.now();
    const upcoming = (data.events || [])
      .filter((e) => e.startISO && (e.live || new Date(e.startISO).getTime() + (e.durationMin || 60) * 60000 >= now))
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
    box.innerHTML = "";
    if (!upcoming.length) box.innerHTML = `<p class="muted">No hay eventos próximos por ahora.</p>`;
    upcoming.forEach((e) => box.appendChild(eventCard(e)));
    document.addEventListener("click", () => document.querySelectorAll(".cal-menu").forEach((m) => m.remove()));
  }

  const optColor = (list, name) => ((list || []).find((o) => o.name === name) || {}).color || "#78909C";
  const optFg = (list, name) => ((list || []).find((o) => o.name === name) || {}).fg || "";
  const textOn = (hex, fg) => {
    if (fg) return fg;
    const h = (hex || "#888").replace("#", "");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1a1a1a" : "#fff";
  };
  const chip = (name, color, fg) => `<span class="chip" style="background:${esc(color)};color:${esc(textOn(color, fg))}">${esc(name)}</span>`;

  function filteredGames() {
    const q = state.search.trim().toLowerCase();
    return (data.games || [])
      .filter((g) => (!q || g.name.toLowerCase().includes(q)) && (!state.platform || g.platform === state.platform) && (!state.estado || (g.estados || []).includes(state.estado)))
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, "es", { sensitivity: "base", numeric: true });
        if (state.sort === "newest") return (b.addedAt || 0) - (a.addedAt || 0) || byName;
        if (state.sort === "oldest") return (a.addedAt || 0) - (b.addedAt || 0) || byName;
        return byName;
      });
  }

  // Carrusel horizontal con los juegos etiquetados "Jugando" (o la etiqueta elegida en el panel)
  function renderPlaying() {
    const label = data.playingLabel || "Jugando";
    const opts = data.options || {};
    // del que empezaste a jugar más recientemente al más viejo
    const list = (data.games || []).filter((g) => (g.estados || []).includes(label)).sort((a, b) => (b.playingSince || 0) - (a.playingSince || 0));
    const sec = $("#playing");
    if (!sec) return;
    sec.hidden = !list.length;
    $("#playing-track").innerHTML = list.map((g) => `
      <div class="pcard">
        ${g.image ? `<img loading="lazy" alt="" src="${esc(g.image)}" />` : `<div class="noimg">🎮</div>`}
        <div class="pcard-body"><b>${esc(g.name)}</b>
          ${g.platform || g.hours ? `<div class="chips">${g.platform ? chip(g.platform, optColor(opts.platforms, g.platform), optFg(opts.platforms, g.platform)) : ""}${g.hours ? `<span class="chip chip-hours" title="Horas jugadas">⏱ ${esc(hoursTxt(g.hours))}</span>` : ""}</div>` : ""}${achRow(g)}</div>
      </div>`).join("");
    sec.querySelectorAll(".car-btn").forEach((b) => (b.onclick = () => {
      const t = $("#playing-track");
      t.scrollBy({ left: Number(b.dataset.dir) * Math.max(240, t.clientWidth * 0.8), behavior: "smooth" });
    }));
  }

  // 🕒 v1.54: los últimos juegos que jugué (Steam y RetroArch), aparte de la lista
  const noImg = `onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'noimg',textContent:'🎮'}))"`;
  // v1.57: recientes y más jugados en lista o en tarjetas, y ordenados como quieras
  const card = (g, sub) => `
      <div class="rcard">
        ${g.image ? `<img loading="lazy" alt="" src="${esc(g.image)}" ${noImg} />` : `<div class="noimg">🎮</div>`}
        <div class="rcard-body"><b title="${esc(g.name)}">${esc(g.name)}</b>${sub}</div>
      </div>`;
  const row = (g, i, max, sub, right) => `
      <div class="most">
        <span class="most-n">${i + 1}</span>
        ${g.image ? `<img loading="lazy" alt="" src="${esc(g.image)}" ${noImg} />` : `<div class="noimg">🎮</div>`}
        <div class="most-body"><b>${esc(g.name)}</b><small>${sub}</small>
          ${max ? `<div class="most-bar"><span style="width:${Math.max(4, Math.round(((g.hours || 0) / max) * 100))}%"></span></div>` : ""}</div>
        <span class="most-h">${right}</span>
      </div>`;
  const opts = (name, cur, list) => `<div class="view-opts" role="group">${list.map(([k, l]) => `<button class="btn vo-btn ${cur === k ? "active" : ""}" data-${name}="${k}">${l}</button>`).join("")}</div>`;
  const LAYOUT = [["list", "☰ Lista"], ["cards", "▦ Tarjetas"]];
  function renderRecent() {
    const box = $("#recent-view");
    const list = (data.recent || []).slice().sort((a, b) => (state.recentSort === "hours" ? (b.hours || 0) - (a.hours || 0) : (b.last || 0) - (a.last || 0)));
    const sub = (g) => `${esc(g.platform || "")}${g.last ? " · " + esc(agoTxt(g.last)) : ""}`;
    box.innerHTML = `<div class="view-bar"><p class="muted">Los últimos juegos que jugué (aparte de mi lista).</p><div class="view-tools">${opts("rs", state.recentSort, [["date", "🕒 Más reciente"], ["hours", "⏱ Más horas"]])}${opts("rl", state.recentLayout, LAYOUT)}</div></div>
      ${state.recentLayout === "list" ? `<div class="most-list">${list.map((g, i) => row(g, i, 0, sub(g), g.hours ? esc(hoursTxt(g.hours)) : "")).join("")}</div>` : `<div class="recent-track">${list.map((g) => card(g, `<small>${sub(g)}</small>${g.hours ? `<small>⏱ ${esc(hoursTxt(g.hours))} en total</small>` : ""}`)).join("")}</div>`}`;
    box.querySelectorAll("[data-rs]").forEach((b) => b.addEventListener("click", () => ((state.recentSort = b.dataset.rs), renderRecent())));
    box.querySelectorAll("[data-rl]").forEach((b) => b.addEventListener("click", () => ((state.recentLayout = b.dataset.rl), renderRecent())));
  }
  const PERIODS = [["week", "🗓 Esta semana", "mostWeek"], ["month", "📅 Este mes", "mostMonth"], ["all", "♾ Siempre", "mostPlayed"]];
  const periodData = (k) => {
    const p = PERIODS.find((x) => x[0] === k);
    const d = p && data[p[2]];
    return Array.isArray(d) ? { list: d } : d || null;
  };
  // 🏆 mis más jugados (ranking aparte: no se mezcla con la lista)
  function renderMost() {
    const box = $("#most-list");
    const avail = PERIODS.filter(([k]) => periodData(k) && periodData(k).list.length);
    if (!avail.some(([k]) => k === state.mostPeriod)) state.mostPeriod = avail.some(([k]) => k === data.mostDefault) ? data.mostDefault : (avail[0] || ["all"])[0];
    const pd = periodData(state.mostPeriod) || { list: [] };
    const most = pd.list;
    const max = Math.max(...most.map((g) => g.hours || 0), 1);
    const inPeriod = state.mostPeriod !== "all";
    const since = pd.since ? `desde el ${new Date(pd.since).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : "";
    const sub = (g) => `${esc(g.platform || "")}${inPeriod && g.total ? ` · ${esc(hoursTxt(g.total))} en total` : g.last ? " · última vez " + esc(agoTxt(g.last)) : ""}`;
    box.innerHTML = `<div class="view-bar"><div class="view-tools">${avail.length > 1 ? opts("mp", state.mostPeriod, avail.map(([k, l]) => [k, l])) : ""}${opts("ml", state.mostLayout, LAYOUT)}</div>${inPeriod && since ? `<p class="muted">Horas jugadas ${esc(since)}.</p>` : ""}</div>
      ${state.mostLayout === "cards" ? `<div class="recent-track">${most.map((g, i) => card(g, `<small>#${i + 1} · ⏱ ${esc(hoursTxt(g.hours || 0))}${inPeriod ? "" : ""}</small><small>${sub(g)}</small>`)).join("")}</div>` : most.map((g, i) => row(g, i, max, sub(g), esc(hoursTxt(g.hours || 0)))).join("")}`;
    box.querySelectorAll("[data-mp]").forEach((b) => b.addEventListener("click", () => ((state.mostPeriod = b.dataset.mp), renderMost())));
    box.querySelectorAll("[data-ml]").forEach((b) => b.addEventListener("click", () => ((state.mostLayout = b.dataset.ml), renderMost())));
  }
  // v1.55: la lista, 🕒 recientes, 🏆 más jugados y 🕸 mis gustos se ven con botones (uno a la vez)
  const VIEWS = { list: "🎮 Lista de juegos", recent: "🕒 Jugado recientemente", most: "🏆 Mis juegos más jugados", tastes: "🕸 Mis tipos de juego", media: "🎬 Anime, manga, series y películas" };
  function renderViews() {
    const sw = $("#gl-mode");
    if (!sw) return;
    const has = { list: true, recent: !!(data.recent || []).length, most: !!((data.mostPlayed || []).length || (data.mostWeek && data.mostWeek.list.length) || (data.mostMonth && data.mostMonth.list.length)), tastes: !!(data.tastes && (data.tastes.modes || []).length), media: !!(data.media || []).length };
    if (!has[state.view]) state.view = "list";
    sw.hidden = !(has.recent || has.most || has.tastes || has.media);
    document.querySelectorAll(".gl-btn").forEach((b) => {
      b.hidden = !has[b.dataset.gl];
      b.classList.toggle("active", b.dataset.gl === state.view);
      b.setAttribute("aria-selected", b.dataset.gl === state.view);
    });
    $("#games-title").textContent = VIEWS[state.view];
    $("#list-wrap").hidden = state.view !== "list";
    $("#most-list").hidden = state.view !== "most";
    $("#recent-view").hidden = state.view !== "recent";
    $("#tastes-view").hidden = state.view !== "tastes";
    if ($("#media-view")) $("#media-view").hidden = state.view !== "media";
    // el botón de sugerir juegos no aplica en entretenimiento
    if ($("#suggest-btn")) $("#suggest-btn").hidden = state.view === "media";
    if (state.view === "media") renderMedia();
    if (state.view === "most") renderMost();
    if (state.view === "recent") renderRecent();
    if (state.view === "tastes") renderTastes();
  }
  function renderGames() {
    renderViews();
    const opts = data.options || {};
    const all = (data.games || []).filter((g) => (!state.search || g.name.toLowerCase().includes(state.search.toLowerCase())) && (!state.platform || g.platform === state.platform));
    const counts = {};
    all.forEach((g) => (g.estados || []).forEach((e) => (counts[e] = (counts[e] || 0) + 1)));
    $("#counters").innerHTML =
      `<button class="counter ${!state.estado ? "active" : ""}" data-e=""><b>${all.length}</b> Todos</button>` +
      (opts.estados || []).map((e) => `<button class="counter ${state.estado === e.name ? "active" : ""}" data-e="${esc(e.name)}" style="--c:${esc(e.color)};--cf:${esc(e.fg || "")}"><b>${counts[e.name] || 0}</b> ${esc(e.name)}</button>`).join("");
    document.querySelectorAll(".counter").forEach((b) => b.addEventListener("click", () => { state.estado = state.estado === b.dataset.e ? "" : b.dataset.e; state.shown = PAGE; renderGames(); }));

    const list = filteredGames();
    const box = $("#game-list");
    box.innerHTML = list.slice(0, state.shown).map((g) => `
      <div class="game">
        ${g.image ? `<img loading="lazy" alt="" src="${esc(g.image)}" />` : `<div class="noimg">🎮</div>`}
        <div>
          <h3>${esc(g.name)}</h3>
          <div class="chips">
            ${g.platform ? chip(g.platform, optColor(opts.platforms, g.platform), optFg(opts.platforms, g.platform)) : ""}
            ${(g.estados || []).map((e) => chip(e, optColor(opts.estados, e), optFg(opts.estados, e))).join("")}
            ${g.rating ? chip(g.rating, optColor(opts.ratings, g.rating), optFg(opts.ratings, g.rating)) : ""}
            ${g.hours ? `<span class="chip chip-hours" title="Horas jugadas">⏱ ${esc(hoursTxt(g.hours))}</span>` : ""}
          </div>
          ${achRow(g)}
          ${g.score != null ? scoreBadge(g.score, g.scoreNote) : ""}
          ${g.notes ? `<div class="note">${esc(g.notes)}</div>` : ""}
          ${g.by && g.by.u ? `<div class="sugby" title="Sugerido por ${esc(g.by.u)}">💡 Sugerido por ${["twitch", "youtube", "kick", "tiktok"].includes(g.by.p) ? `<img src="icons/${esc(g.by.p)}.svg" alt="${esc(g.by.p)}" />` : ""}<b>${esc(g.by.u)}</b>${(g.by.also || []).length ? ` <span class="sugby-also" title="${esc(g.by.also.map((a) => a.u).join(", "))}">y ${g.by.also.length} ${g.by.also.length === 1 ? "persona" : "personas"} más (${esc(g.by.also.slice(0, 4).map((a) => a.u).join(", "))}${g.by.also.length > 4 ? "…" : ""})</span>` : ""}</div>` : ""}
        </div>
      </div>`).join("") || `<p class="muted">Ningún juego coincide.</p>`;
    $("#more-games").hidden = list.length <= state.shown;
  }

  /* ---------- Sugerencias (se envían como Issue de GitHub: requiere login ahí) ---------- */

  const dayKey = () => `sug-${new Date().toISOString().slice(0, 10)}`;
  const todayCount = () => { try { return parseInt(localStorage.getItem(dayKey()) || "0", 10); } catch (e) { return 0; } };
  let picked = null;

  function setupSuggest() {
    const modal = $("#suggest-modal");
    const input = $("#sg-name");
    $("#suggest-btn").addEventListener("click", () => { modal.hidden = false; input.focus(); });
    // v1.51: también se puede sugerir desde el chat del directo
    const cmd = (data.suggest || {}).command;
    if (cmd && $("#sg-cmd")) { $("#sg-cmd").hidden = false; $("#sg-cmd").textContent = `También puedes escribir ${cmd} nombre del juego en el chat cuando esté en directo.`; }
    $("#suggest-close").addEventListener("click", () => (modal.hidden = true));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

    let timer = null;
    let autocompleteOk = true;
    input.addEventListener("input", () => {
      picked = null;
      clearTimeout(timer);
      const term = input.value.trim();
      if (term.length < 2 || !autocompleteOk) { $("#sg-results").innerHTML = ""; return; }
      timer = setTimeout(async () => {
        try {
          // Buscador público de Steam (no necesita clave). Si el navegador lo bloquea (CORS), se desactiva solo y queda un campo de texto normal.
          const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${enc(term)}&cc=mx&l=latam`);
          const json = await res.json();
          $("#sg-results").innerHTML = (json.items || []).slice(0, 6).map((it) => `<button type="button" data-id="${it.id}" data-name="${esc(it.name)}"><img alt="" src="${esc(it.tiny_image || "")}" />${esc(it.name)}</button>`).join("");
          $("#sg-results").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
            picked = { id: b.dataset.id, name: b.dataset.name };
            input.value = picked.name;
            $("#sg-results").innerHTML = "";
          }));
        } catch (e) {
          autocompleteOk = false;
          $("#sg-results").innerHTML = "";
        }
      }, 300);
    });

    $("#sg-send").addEventListener("click", () => {
      const msg = $("#sg-msg");
      const name = input.value.trim();
      if (!name) { msg.textContent = "Escribe el nombre del juego."; return; }
      if (todayCount() >= 5) { msg.textContent = "Ya enviaste 5 sugerencias hoy. ¡Vuelve mañana!"; return; }
      const repo = (data.suggest || {}).repo;
      if (!repo) { msg.textContent = "Las sugerencias no están configuradas todavía."; return; }
      const note = $("#sg-note").value.trim();
      const who = $("#sg-user") ? $("#sg-user").value.trim().replace(/^@/, "").slice(0, 40) : "";
      const plat = $("#sg-plat") ? $("#sg-plat").value : "";
      const body = `**Juego:** ${name}\n${picked ? `**Steam:** https://store.steampowered.com/app/${picked.id}\n` : ""}${who ? `**Usuario:** ${who} (${plat})\n` : ""}${note ? `\n**Nota:** ${note}\n` : ""}\n<!-- panel-produccion-sugerencia appid=${picked ? picked.id : ""} user=${who ? enc(who) : ""} plat=${who ? plat : ""} -->`;
      const label = (data.suggest || {}).label || "sugerencia";
      try { localStorage.setItem(dayKey(), String(todayCount() + 1)); } catch (e) { /* sin localStorage: el límite es solo orientativo */ }
      window.open(`https://github.com/${repo}/issues/new?labels=${enc(label)}&title=${enc("Sugerencia: " + name)}&body=${enc(body)}`, "_blank", "noopener");
      msg.textContent = "Se abrió GitHub: pulsa “Submit new issue” ahí para terminar.";
    });
  }

  /* ---------- Arranque ---------- */

  // Vista previa dentro del panel: los datos llegan por postMessage (sin publicar nada)
  const PREVIEW = /[?&]preview\b/.test(location.search);
  let started = false;
  // 🧩 Código propio: CSS extra y bloques de HTML (sin scripts)
  function applyCode() {
    const c = (data && data.code) || {};
    let st = document.getElementById("custom-code-css");
    if (!st) {
      st = document.createElement("style");
      st.id = "custom-code-css";
      document.head.appendChild(st);
    }
    st.textContent = c.css || "";
    const base = document.querySelector('link[href="style.css"]');
    let own = document.getElementById("custom-own-style");
    if (c.previewStyle) {
      if (!own) {
        own = document.createElement("style");
        own.id = "custom-own-style";
        document.head.insertBefore(own, st);
      }
      own.textContent = c.previewStyle;
      if (base) base.disabled = true;
    } else {
      if (own) own.remove();
      if (base) base.disabled = false;
    }
    const block = (id, html, place) => {
      let el = document.getElementById(id);
      if (!html) return el && el.remove();
      if (!el) {
        el = document.createElement("section");
        el.id = id;
        el.className = "custom-block";
        place(el);
      }
      el.innerHTML = html;
      el.querySelectorAll("script").forEach((s) => s.remove());
    };
    block("custom-top", c.top, (el) => { const h = document.querySelector("header.hero"); h ? h.after(el) : document.body.prepend(el); });
    block("custom-bottom", c.bottom, (el) => { const f = document.querySelector("footer"); f ? f.before(el) : document.body.appendChild(el); });
  }
  /* ---------- 🕸 v1.49: tipos de juego que me gustan / que más juego (si el dueño lo activa) ---------- */
  let tasteMode = "";
  function loadRadar() {
    if (window.VGRadar) return Promise.resolve();
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = "radar.js";
      s.onload = res;
      s.onerror = res;
      document.head.appendChild(s);
    });
  }
  /* ---------- 🎬 v1.61: anime, manga, series y películas ---------- */
  const MT = { anime: "📺 Anime", manga: "📖 Manga", serie: "🎞 Serie", pelicula: "🎬 Película" };
  const MS = { viendo: "▶ Viendo", pendiente: "🕒 Pendiente", terminado: "✅ Visto", pausa: "⏸ En pausa", abandonado: "✕ Abandonado", sugerido: "💡 Sugerido" };
  const mState = { type: "", status: "" };
  function renderMedia() {
    const sec = $("#media-view");
    if (!sec) return;
    const all = data.media || [];
    const count = (k, v) => all.filter((x) => x[k] === v).length;
    const order = { viendo: 0, pendiente: 1, sugerido: 2, pausa: 3, terminado: 4, abandonado: 5 };
    const list = all.filter((x) => (!mState.type || x.type === mState.type) && (!mState.status || x.status === mState.status)).sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || (b.at || 0) - (a.at || 0));
    const st = (x) => (x.status === "viendo" && x.type === "manga" ? "▶ Leyendo" : x.status === "terminado" && x.type === "manga" ? "✅ Leído" : MS[x.status] || x.status);
    sec.innerHTML = `<div class="media-filters">
        <button class="counter ${!mState.type ? "active" : ""}" data-mt=""><b>${all.length}</b> Todo</button>
        ${Object.entries(MT).filter(([k]) => count("type", k)).map(([k, l]) => `<button class="counter ${mState.type === k ? "active" : ""}" data-mt="${k}"><b>${count("type", k)}</b> ${l}</button>`).join("")}
        <select id="media-st"><option value="">Cualquier estado</option>${Object.entries(MS).filter(([k]) => count("status", k)).map(([k, l]) => `<option value="${k}" ${mState.status === k ? "selected" : ""}>${l} (${count("status", k)})</option>`).join("")}</select>
      </div>
      <div class="media-grid">${list.map((x) => {
        const pct = x.total ? Math.min(100, Math.round((x.progress / x.total) * 100)) : 0;
        return `<article class="media-card">
          ${x.image ? `<img loading="lazy" alt="" src="${esc(x.image)}" />` : `<div class="noimg">${esc((MT[x.type] || "🎬").split(" ")[0])}</div>`}
          <div class="media-body"><b>${esc(x.title)}</b>${x.alt ? `<small>${esc(x.alt)}</small>` : ""}
            <div class="chips"><span class="chip media-t-${esc(x.type)}">${esc(MT[x.type] || x.type)}</span><span class="chip">${esc(st(x))}</span>${x.score ? `<span class="chip">⭐ ${esc(x.score)}/10</span>` : ""}</div>
            ${x.type !== "pelicula" && (x.progress || x.total) ? `<div class="media-prog"><span>${x.type === "manga" ? "Capítulo" : "Episodio"} ${esc(x.progress)}${x.total ? " de " + esc(x.total) : ""}</span><i style="--p:${pct}%"></i></div>` : ""}
            ${x.note ? `<p class="media-note">💬 ${esc(x.note)}</p>` : ""}
            ${x.by ? `<small class="media-by">💡 Sugerido por ${esc(x.by)}</small>` : ""}
          </div></article>`;
      }).join("") || `<p class="hint">Nada con ese filtro.</p>`}</div>`;
    sec.querySelectorAll("[data-mt]").forEach((b) => b.addEventListener("click", () => ((mState.type = b.dataset.mt), renderMedia())));
    const ms = sec.querySelector("#media-st");
    if (ms) ms.addEventListener("change", (e) => ((mState.status = e.target.value), renderMedia()));
  }

  async function renderTastes() {
    const t = data.tastes;
    const sec = $("#tastes-view");
    if (!sec || !t || !(t.modes || []).length) return;
    await loadRadar();
    if (!window.VGRadar) return;
    if (!t.modes.includes(tasteMode)) tasteMode = t.modes.includes(t.def) ? t.def : t.modes[0];
    const NAMES = { played: ["🕹️ Lo que más juego", "juegos que he jugado", "Cuántos de mis juegos son de cada tipo (un juego puede ser de varios)."], liked: ["❤️ Lo que me gusta", "juegos que elegí", "De los juegos que elegí jugar, qué parte es de cada tipo."] };
    const d = t[tasteMode];
    const det = d.details || [];
    sec.innerHTML = `${t.modes.length > 1 ? `<div class="taste-tabs" role="tablist">${t.modes.map((m) => `<button class="btn taste-btn ${m === tasteMode ? "active" : ""}" role="tab" aria-selected="${m === tasteMode}" data-m="${m}">${NAMES[m][0]}</button>`).join("")}</div>` : ""}
      <div class="taste-card">
        <div class="taste-svg">${window.VGRadar.svg(d.axes.map((a) => ({ label: a })), [{ values: d.values, labels: d.labels, color: "var(--accent)" }], { title: NAMES[tasteMode][0], size: 300 })}</div>
        <div class="taste-how">
          <h3>¿Cómo se lee?</h3>
          <p class="muted">Cada punta es un tipo de juego. Mientras más se estira la figura hacia una punta, más me gusta ese tipo. ${esc(NAMES[tasteMode][2])} Según ${d.n} ${NAMES[tasteMode][1]}.</p>
          <p class="muted">Abajo está cada tipo: qué es y qué juegos cuentan ahí.</p>
        </div>
      </div>
      ${det.length ? `<div class="taste-parts">${det.map((x, i) => `
        <div class="taste-part">
          <div class="taste-head"><b>${esc(x.label)}</b><span class="taste-val">${esc(x.value)}</span></div>
          ${x.desc ? `<p class="muted">${esc(x.desc)}</p>` : ""}
          ${(x.games || []).length ? `<div class="taste-games">${x.games.map((g) => `<span class="taste-game" title="${esc(g.name)}">${g.image ? `<img loading="lazy" alt="" src="${esc(g.image)}" ${noImg} />` : `<span class="noimg">🎮</span>`}<span>${esc(g.name)}${g.hours ? ` <small>⏱ ${esc(hoursTxt(g.hours))}</small>` : ""}</span></span>`).join("")}</div>` : ""}
          ${x.more ? `<p class="muted taste-more">y ${x.more} más</p>` : ""}
        </div>`).join("")}</div>` : ""}`;
    sec.querySelectorAll(".taste-btn").forEach((b) => b.addEventListener("click", () => ((tasteMode = b.dataset.m), renderTastes())));
  }


  function rerender() {
    document.documentElement.removeAttribute("style");
    document.body.className = "";
    const bg = $("#bg-layer");
    if (bg) bg.removeAttribute("style");
    renderProfile();
    renderEvents();
    renderPlaying();
    renderSponsors();
    renderGames();
    applyCode();
  }
  async function main() {
    if (PREVIEW) {
      window.addEventListener("message", (m) => {
        const d = m.data || {};
        if (d.site !== "data" || !d.data) return;
        data = d.data;
        if (!started) start();
        else rerender();
      });
      parent.postMessage({ site: "ready" }, "*");
      return;
    }
    try {
      const res = await fetch("data.json?" + Date.now());
      data = await res.json();
    } catch (e) {
      document.body.innerHTML = "<p style='padding:40px;text-align:center'>No se pudo cargar el sitio.</p>";
      return;
    }
    start();
  }
  function start() {
    started = true;
    applyCode();
    renderProfile();
    renderEvents();
    renderPlaying();
    renderSponsors();
    const plats = [...new Set((data.games || []).map((g) => g.platform).filter(Boolean))].sort();
    $("#game-platform").innerHTML += plats.map((p) => `<option>${esc(p)}</option>`).join("");
    $("#game-search").addEventListener("input", (e) => { state.search = e.target.value; state.shown = PAGE; renderGames(); });
    $("#game-platform").addEventListener("change", (e) => { state.platform = e.target.value; state.shown = PAGE; renderGames(); });
    document.querySelectorAll(".sort-btn").forEach((b) => b.addEventListener("click", () => {
      state.sort = b.dataset.sort;
      state.shown = PAGE;
      document.querySelectorAll(".sort-btn").forEach((x) => x.classList.toggle("active", x === b));
      renderGames();
    }));
    $("#more-games").addEventListener("click", () => { state.shown += PAGE; renderGames(); });
    document.querySelectorAll(".gl-btn").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.gl; renderGames(); }));
    renderGames();
    setupSuggest();
    // El sitio se refresca solo cada minuto (EN VIVO, eventos terminados, etiquetas de la lista)
    if (!PREVIEW) setInterval(refreshData, 60000);
  }

  async function refreshData() {
    try {
      const res = await fetch("data.json?" + Date.now(), { cache: "no-store" });
      const fresh = await res.json();
      if (fresh.generatedAt === data.generatedAt) return;
      data = fresh;
      renderEvents();
      renderPlaying();
          renderSponsors();
      renderGames();
    } catch (e) {
      /* sin red: se intenta en el siguiente minuto */
    }
  }

  window.__site = { ytId, icsText, calendarLinks, eventThumb }; // para pruebas
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
