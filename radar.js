/* radar.js — 🕸 diagrama de araña en SVG, sin librerías (v1.49).
   Lo usan el panel (Estadísticas, ¿Qué jugar?, Lista de juegos) y tu sitio web.
   VGRadar.svg(axes, series, opts)
     axes:   [{ label, hint? }]                       (3 a 12 ejes)
     series: [{ values:[0..max], color, label, fill? }] (1 o 2; la primera va encima)
     opts:   { max:100, size:320, rings:4, showValues:true, title:"" }
   Los colores salen de CSS si pasas "var(--algo)". */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function wrap(label, max = 14) {
    const words = String(label).split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > max && cur) {
        lines.push(cur);
        cur = w;
      } else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }
  function svg(axes, series, opts = {}) {
    const n = axes.length;
    const max = opts.max || 100;
    const size = opts.size || 320;
    const pad = opts.pad != null ? opts.pad : 70;
    const W = size + pad * 2;
    const c = W / 2;
    const r = size / 2;
    const rings = opts.rings || 4;
    if (n < 3) return `<p class="vg-radar-empty">${esc(opts.empty || "Aún no hay datos suficientes.")}</p>`;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => {
      const k = Math.max(0, Math.min(1, (Number(v) || 0) / max));
      return [c + Math.cos(ang(i)) * r * k, c + Math.sin(ang(i)) * r * k];
    };
    const f = (x) => x.toFixed(1);
    let out = `<svg class="vg-radar" viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(opts.title || "Diagrama de araña")}" xmlns="http://www.w3.org/2000/svg">`;
    if (opts.title) out += `<title>${esc(opts.title)}</title>`;
    // red de fondo
    for (let k = 1; k <= rings; k++) {
      const pts = axes.map((_, i) => pt(i, (max * k) / rings).map(f).join(",")).join(" ");
      out += `<polygon class="vg-radar-ring" points="${pts}" fill="none" stroke="currentColor" stroke-opacity="${k === rings ? 0.35 : 0.15}" />`;
    }
    axes.forEach((_, i) => {
      const [x, y] = pt(i, max);
      out += `<line x1="${c}" y1="${c}" x2="${f(x)}" y2="${f(y)}" stroke="currentColor" stroke-opacity=".15" />`;
    });
    // series (la primera al final para que quede arriba)
    series
      .slice()
      .reverse()
      .forEach((s) => {
        const pts = s.values.map((v, i) => pt(i, v).map(f).join(",")).join(" ");
        out += `<polygon class="vg-radar-area" points="${pts}" fill="${esc(s.color)}" fill-opacity="${s.fill != null ? s.fill : 0.22}" stroke="${esc(s.color)}" stroke-width="2" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""} />`;
        s.values.forEach((v, i) => {
          const [x, y] = pt(i, v);
          out += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="${esc(s.color)}"><title>${esc(axes[i].label)}: ${esc(s.labels ? s.labels[i] : Math.round(v))}${s.label ? " · " + esc(s.label) : ""}</title></circle>`;
        });
      });
    // etiquetas
    axes.forEach((a, i) => {
      const [x, y] = pt(i, max * 1.16);
      const cos = Math.cos(ang(i));
      const anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
      const lines = wrap(a.label);
      const v0 = series[0] && series[0].values[i];
      const shown = opts.showValues !== false && v0 != null ? (series[0].labels ? series[0].labels[i] : Math.round(v0)) : null;
      const dy = Math.sin(ang(i)) < -0.5 ? -(lines.length - 1) * 13 - (shown != null ? 19 : 4) : Math.sin(ang(i)) > 0.5 ? 6 : -((lines.length - 1) * 13) / 2;
      out += `<text class="vg-radar-label" x="${f(x)}" y="${f(y + dy)}" text-anchor="${anchor}" font-size="12.5" fill="currentColor">`;
      lines.forEach((l, j) => (out += `<tspan x="${f(x)}" dy="${j ? 13 : 0}">${esc(l)}</tspan>`));
      if (shown != null) out += `<tspan x="${f(x)}" dy="14" class="vg-radar-val" font-weight="700" fill="${esc(series[0].color)}">${esc(shown)}</tspan>`;
      out += `</text>`;
      if (a.hint) out = out.replace(/<\/text>$/, `<title>${esc(a.hint)}</title></text>`);
    });
    return out + `</svg>`;
  }
  const api = { svg };
  if (typeof window !== "undefined") window.VGRadar = api;
  if (typeof module !== "undefined") module.exports = api;
})();
