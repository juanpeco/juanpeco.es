\
/*
  prompts.js — Renderiza prompts desde prompts_1500.json (sin build tools)
  Requisitos en el HTML:
    - input#promptSearch
    - select#categoryFilter
    - select#aiFilter
    - div#promptGrid
    - span#promptCount
    - span#promptTotal
*/

let ALL_PROMPTS = [];

const el = (id) => document.getElementById(id);

function uniq(arr) {
  return [...new Set(arr)].filter(Boolean).sort((a,b)=>a.localeCompare(b, 'es'));
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function normalize(str) {
  return String(str ?? "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buildFilters() {
  const categories = uniq(ALL_PROMPTS.map(p => p.categoria));
  const ais = uniq(ALL_PROMPTS.map(p => p.ai));

  const catSel = el("categoryFilter");
  const aiSel = el("aiFilter");

  // Limpia y rellena
  catSel.innerHTML = `<option value="">Todas las categorías</option>` +
    categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");

  aiSel.innerHTML = `<option value="">Todas las IAs</option>` +
    ais.map(a => `<option value="${escapeHTML(a)}">${escapeHTML(a)}</option>`).join("");

  el("promptTotal").textContent = String(ALL_PROMPTS.length);
}

function matches(p, q, cat, ai) {
  if (cat && p.categoria !== cat) return false;
  if (ai && p.ai !== ai) return false;
  if (!q) return true;

  const hay = normalize([p.categoria, p.subcategoria, p.sector, p.nivel, p.ai, p.prompt].join(" "));
  return hay.includes(q);
}

function cardHTML(p) {
  const badge = (txt) => txt ? `<span class="badge">${escapeHTML(txt)}</span>` : "";
  return `
    <article class="prompt-card">
      <header class="prompt-head">
        <h3 class="prompt-title">${escapeHTML(p.subcategoria || p.categoria || "Prompt")}</h3>
        <div class="prompt-badges">
          ${badge(p.categoria)}
          ${badge(p.ai)}
        </div>
      </header>

      <p class="prompt-text">${escapeHTML(p.prompt)}</p>

      <footer class="prompt-foot">
        <button class="btn-copy" data-copy="${escapeHTML(p.prompt)}" type="button">Copiar</button>
        <span class="prompt-meta">${escapeHTML(p.nivel)} ${p.sector ? "· " + escapeHTML(p.sector) : ""}</span>
      </footer>
    </article>
  `;
}

function render() {
  const q = normalize(el("promptSearch").value.trim());
  const cat = el("categoryFilter").value;
  const ai = el("aiFilter").value;

  const filtered = ALL_PROMPTS.filter(p => matches(p, q, cat, ai));
  el("promptCount").textContent = String(filtered.length);

  // Render
  const grid = el("promptGrid");
  grid.innerHTML = filtered.map(cardHTML).join("");

  // Copy handlers
  grid.querySelectorAll(".btn-copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = "Copiado ✓";
        setTimeout(() => btn.textContent = old, 900);
      } catch (e) {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        const old = btn.textContent;
        btn.textContent = "Copiado ✓";
        setTimeout(() => btn.textContent = old, 900);
      }
    });
  });
}

async function initPrompts() {
  // OJO: ajusta la ruta si no lo pones en la raíz.
  const res = await fetch("prompts_1500.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar prompts_1500.json");
  ALL_PROMPTS = await res.json();

  buildFilters();
  render();

  ["promptSearch", "categoryFilter", "aiFilter"].forEach(id => {
    el(id).addEventListener("input", render);
    el(id).addEventListener("change", render);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPrompts().catch(err => {
    console.error(err);
    const grid = el("promptGrid");
    if (grid) grid.innerHTML = `<p style="opacity:.8">Error cargando prompts. Revisa que <b>prompts_1500.json</b> esté en la misma carpeta que <b>index.html</b> y que el servidor permita fetch.</p>`;
  });
});
