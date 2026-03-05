// Datos (prompts + artículos) y renderizado simple sin dependencias.
// Puedes sustituir contenidos cuando quieras.

const PROMPTS = [
  // Ejemplos (los tuyos). Puedes añadir muchos más; el filtro/paginación aguanta bien.
  {
    title: "Análisis de elasticidad precio-demanda",
    category: "Economía",
    ai: "chatgpt",
    excerpt: "Actúa como un economista experto. Analiza la elasticidad precio-demanda del siguiente producto: [PRODUCTO]...",
    prompt: "Actúa como un economista experto. Analiza la elasticidad precio-demanda del siguiente producto: [PRODUCTO]. Incluye: 1) Cálculo de la elasticidad con [DATOS], 2) Interpretación, 3) Implicaciones para la fijación de precios, 4) Recomendaciones."
  },
  {
    title: "Simulación de política monetaria",
    category: "Economía",
    ai: "claude",
    excerpt: "Eres el presidente del Banco Central de un país ficticio...",
    prompt: "Eres el presidente del Banco Central de un país ficticio. El PIB actual es [X]%, la inflación [Y]%, y el desempleo [Z]%. Diseña una política monetaria para los próximos 6 meses: objetivo, instrumentos, riesgos y métricas de seguimiento."
  },
  {
    title: "Generador de casos prácticos PIB",
    category: "Economía",
    ai: "gemini",
    excerpt: "Crea 5 ejercicios prácticos sobre el cálculo del PIB...",
    prompt: "Crea 5 ejercicios prácticos sobre el cálculo del PIB para estudiantes de Bachillerato. Cada ejercicio debe incluir: datos de una economía ficticia, preguntas guiadas, solución y explicación didáctica."
  },
  {
    title: "Análisis DAFO interactivo",
    category: "Empresa",
    ai: "perplexity",
    excerpt: "Realiza un análisis DAFO profundo para la empresa [NOMBRE]...",
    prompt: "Realiza un análisis DAFO profundo para la empresa [NOMBRE] del sector [SECTOR]. Para cada cuadrante, incluye 5 puntos con justificación y 3 acciones recomendadas."
  },
  {
    title: "Calculadora de punto de equilibrio",
    category: "Contabilidad",
    ai: "chatgpt",
    excerpt: "Calcula el punto de equilibrio para una empresa con costes fijos...",
    prompt: "Calcula el punto de equilibrio con: costes fijos [X], precio unitario [Y], coste variable unitario [Z]. Incluye: unidades, ventas, interpretación y cómo cambia si el precio baja un 5%."
  },
  {
    title: "Diseñador de paquetes turísticos",
    category: "Turismo",
    ai: "chatgpt",
    excerpt: "Diseña un paquete turístico completo para [DESTINO]...",
    prompt: "Diseña un paquete turístico para [DESTINO] dirigido a [PERFIL]. Incluye: itinerario día a día, alojamiento, transporte, presupuesto, propuesta de valor y plan de comercialización."
  },
];

// 30 artículos (listado realista + editable)
const ARTICULOS = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const cats = ["Economía", "Empresa", "Turismo", "Finanzas", "IA Educativa"];
  const category = cats[i % cats.length];
  return {
    id: `articulo-${String(n).padStart(2, "0")}`,
    title: `Artículo ${String(n).padStart(2, "0")}: ${category} aplicado al aula`,
    category,
    date: `2024-${String(((i % 12) + 1)).padStart(2, "0")}-${String(((i % 27) + 1)).padStart(2, "0")}`,
    excerpt:
      "Resumen breve del artículo. Sustituye este texto por el contenido real (introducción) y enlaza al HTML del artículo si lo publicas en /articulos/.",
    url: `articulos/${String(n).padStart(2, "0")}.html`
  };
});

function el(id){ return document.getElementById(id); }

function renderPrompts(){
  const list = el("promptList");
  if(!list) return;

  const q = (el("promptSearch")?.value || "").trim().toLowerCase();
  const cat = el("promptCategory")?.value || "Todas";
  const ai = el("promptAI")?.value || "Todas";

  const filtered = PROMPTS.filter(p => {
    const matchQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q);

    const matchCat = (cat === "Todas") || (p.category === cat);
    const matchAI = (ai === "Todas") || (p.ai === ai);
    return matchQ && matchCat && matchAI;
  });

  const total = filtered.length;
  const maxShow = 50;
  const shown = filtered.slice(0, maxShow);

  list.innerHTML = shown.map(p => `
    <div class="prompt">
      <h4>${escapeHtml(p.title)}</h4>
      <p>${escapeHtml(p.excerpt)}</p>
      <div class="meta">
        <span class="badge">${escapeHtml(p.category)}</span>
        <span class="badge ai">${escapeHtml(p.ai)}</span>
      </div>
      <code>${escapeHtml(p.prompt)}</code>
    </div>
  `).join("");

  const info = el("promptInfo");
  if(info){
    info.textContent = `Mostrando ${Math.min(maxShow, total)} de ${total} prompts`;
  }
}

function renderArticulos(){
  const list = el("articulosList");
  if(!list) return;

  const q = (el("artSearch")?.value || "").trim().toLowerCase();
  const cat = el("artCategory")?.value || "Todas";

  const filtered = ARTICULOS.filter(a => {
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
    const matchCat = (cat === "Todas") || (a.category === cat);
    return matchQ && matchCat;
  });

  list.innerHTML = filtered.map(a => `
    <a class="item" href="${a.url}">
      <div class="icon">📝</div>
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.excerpt)}</p>
      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <span class="badge">${escapeHtml(a.category)}</span>
        <span class="badge">${escapeHtml(a.date)}</span>
      </div>
    </a>
  `).join("");

  const info = el("artInfo");
  if(info){
    info.textContent = `Mostrando ${filtered.length} de ${ARTICULOS.length} artículos`;
  }
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

document.addEventListener("input", (e) => {
  if(["promptSearch","promptCategory","promptAI"].includes(e.target.id)) renderPrompts();
  if(["artSearch","artCategory"].includes(e.target.id)) renderArticulos();
});

document.addEventListener("DOMContentLoaded", () => {
  renderPrompts();
  renderArticulos();
});
