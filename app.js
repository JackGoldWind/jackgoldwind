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
  const state = { search: "", platform: "", estado: "", shown: PAGE, sort: "az" };

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
    return null;
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
    if (t.bgImage) {
      const bg = $("#bg-layer");
      bg.style.backgroundImage = "url('" + String(t.bgImage).replace(/'/g, "%27") + "')";
      bg.style.opacity = String((t.bgOpacity == null ? 35 : t.bgOpacity) / 100);
    }
  }

  function linkHtml(l) {
    const B = window.SITE_BRANDS || { BRANDS: {}, detectNetwork: () => "link" };
    const net = l.network || B.detectNetwork(l.url);
    const brand = B.BRANDS[net] || { color: "#4C8C86" };
    const icon = l.iconUrl || `icons/${net}.svg`;
    return `<a class="lnk" style="--brand:${esc(brand.color)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="${esc(l.label)}"><img src="${esc(icon)}" alt="" /><span>${esc(l.label)}</span></a>`;
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
    el.className = "event";
    el.innerHTML = `
      ${th ? `<img alt="" loading="lazy" src="${esc(th.src)}" />` : `<div class="ph">📺</div>`}
      <div class="body">
        <h3>${esc(ev.title)}</h3>
        <div class="when">${esc(when)}</div>
        ${ev.description ? `<div class="desc">${esc(ev.description)}</div>` : ""}
        <div class="actions">
          ${ev.url ? `<a class="btn btn-accent" href="${esc(ev.url)}" target="_blank" rel="noopener noreferrer">Ver</a>` : ""}
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

  // Solo se muestran los eventos que no han terminado: cuando pasan, desaparecen solos del sitio.
  function renderEvents() {
    const box = $("#events");
    const now = Date.now();
    const upcoming = (data.events || [])
      .filter((e) => e.startISO && new Date(e.startISO).getTime() + (e.durationMin || 60) * 60000 >= now)
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

  function renderGames() {
    const opts = data.options || {};
    const all = (data.games || []).filter((g) => (!state.search || g.name.toLowerCase().includes(state.search.toLowerCase())) && (!state.platform || g.platform === state.platform));
    const counts = {};
    all.forEach((g) => (g.estados || []).forEach((e) => (counts[e] = (counts[e] || 0) + 1)));
    $("#counters").innerHTML =
      `<button class="counter ${!state.estado ? "active" : ""}" data-e=""><b>${all.length}</b> Todos</button>` +
      (opts.estados || []).map((e) => `<button class="counter ${state.estado === e.name ? "active" : ""}" data-e="${esc(e.name)}" style="--c:${esc(e.color)}"><b>${counts[e.name] || 0}</b> ${esc(e.name)}</button>`).join("");
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
          </div>
          ${g.notes ? `<div class="note">${esc(g.notes)}</div>` : ""}
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
          const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${enc(term)}&cc=us&l=spanish`);
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
      const body = `**Juego:** ${name}\n${picked ? `**Steam:** https://store.steampowered.com/app/${picked.id}\n` : ""}${note ? `\n**Nota:** ${note}\n` : ""}\n<!-- panel-produccion-sugerencia appid=${picked ? picked.id : ""} -->`;
      const label = (data.suggest || {}).label || "sugerencia";
      try { localStorage.setItem(dayKey(), String(todayCount() + 1)); } catch (e) { /* sin localStorage: el límite es solo orientativo */ }
      window.open(`https://github.com/${repo}/issues/new?labels=${enc(label)}&title=${enc("Sugerencia: " + name)}&body=${enc(body)}`, "_blank", "noopener");
      msg.textContent = "Se abrió GitHub: pulsa “Submit new issue” ahí para terminar.";
    });
  }

  /* ---------- Arranque ---------- */

  async function main() {
    try {
      const res = await fetch("data.json?" + Date.now());
      data = await res.json();
    } catch (e) {
      document.body.innerHTML = "<p style='padding:40px;text-align:center'>No se pudo cargar el sitio.</p>";
      return;
    }
    renderProfile();
    renderEvents();
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
    renderGames();
    setupSuggest();
  }

  window.__site = { ytId, icsText, calendarLinks, eventThumb }; // para pruebas
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
