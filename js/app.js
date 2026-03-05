(async function () {
  const elList = document.getElementById("promptList");
  const elInfo = document.getElementById("promptInfo");
  const elSearch = document.getElementById("promptSearch");
  const elCat = document.getElementById("promptCategory");
  const elAI = document.getElementById("promptAI");

  if (!elList || !elInfo || !elSearch || !elCat || !elAI) return;

  const escapeHtml = (s) =>
    (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  let data = [];
  let filtered = [];

  function normalize(s) {
    return (s ?? "").toString().toLowerCase().trim();
  }

  function buildOptionsFromData() {
    // Rellenar categorías/IAs reales sin romper tus opciones iniciales
    const cats = [...new Set(data.map(d => d.category).filter(Boolean))].sort();
    const ais = [...new Set(data.map(d => d.ai).filter(Boolean))].sort();

    // Si tu HTML ya trae opciones base, añadimos las que falten.
    const catValues = new Set([...elCat.options].map(o => o.value));
    cats.forEach(c => {
      if (!catValues.has(c)) {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        elCat.appendChild(opt);
      }
    });

    const aiValues = new Set([...elAI.options].map(o => o.value));
    ais.forEach(a => {
      if (!aiValues.has(a)) {
        const opt = document.createElement("option");
        opt.value = a;
        opt.textContent = a;
        elAI.appendChild(opt);
      }
    });
  }

  function applyFilters() {
    const q = normalize(elSearch.value);
    const cat = elCat.value;
    const ai = elAI.value;

    filtered = data.filter(p => {
      const okCat = (cat === "Todas") || (p.category === cat);
      const okAI = (ai === "Todas") || (p.ai === ai);

      if (!okCat || !okAI) return false;

      if (!q) return true;

      const hay = [
        p.title, p.prompt, p.category, p.ai, p.sector, p.subcat, p.level
      ].map(normalize).join(" | ");

      return hay.includes(q);
    });

    render();
  }

  function render() {
    elInfo.textContent = `Mostrando ${filtered.length} de ${data.length} prompts`;
    elList.innerHTML = filtered.slice(0, 200).map(p => {
      const meta = `
        <span class="badge">${escapeHtml(p.category || "General")}</span>
        <span class="badge">${escapeHtml(p.ai || "chatgpt")}</span>
        ${p.level ? `<span class="badge">${escapeHtml(p.level)}</span>` : ``}
      `;

      return `
        <div class="prompt-card">
          <div class="prompt-head">
            <p class="prompt-title">${escapeHtml(p.title || "Prompt")}</p>
            <div class="prompt-meta">${meta}</div>
            <button class="btn copybtn" data-copy="${escapeHtml(p.prompt)}">Copiar</button>
          </div>
          <div class="prompt-body">${escapeHtml(p.prompt)}</div>
        </div>
      `;
    }).join("");

    // aviso si hay más de 200 para no petar el DOM
    if (filtered.length > 200) {
      elList.insertAdjacentHTML("beforeend",
        `<div class="smallnote">Mostrando 200 por rendimiento. Usa el buscador/filtros para acotar.</div>`
      );
    }

    // listeners copiar
    [...elList.querySelectorAll("button[data-copy]")].forEach(btn => {
      btn.addEventListener("click", async () => {
        const txt = btn.getAttribute("data-copy") || "";
        try {
          await navigator.clipboard.writeText(txt);
          const old = btn.textContent;
          btn.textContent = "Copiado ✅";
          setTimeout(() => (btn.textContent = old), 900);
        } catch {
          alert("No se pudo copiar. Prueba manualmente.");
        }
      });
    });
  }

  try {
    const res = await fetch("js/prompts_1500.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();

    // normaliza estructura mínima por si cambian campos
    data = (Array.isArray(data) ? data : []).map((p, i) => ({
      id: p.id ?? (i + 1),
      title: p.title ?? "Prompt",
      category: p.category ?? "General",
      ai: p.ai ?? "chatgpt",
      level: p.level ?? "",
      sector: p.sector ?? "",
      subcat: p.subcat ?? "",
      prompt: p.prompt ?? ""
    })).filter(p => p.prompt);

    buildOptionsFromData();
    filtered = data;
    applyFilters();

    elSearch.addEventListener("input", applyFilters);
    elCat.addEventListener("change", applyFilters);
    elAI.addEventListener("change", applyFilters);

    console.log("Biblioteca cargada. Usa el buscador y los filtros para encontrar prompts rápidamente.");
  } catch (e) {
    elInfo.textContent = "Mostrando 0 de 0 prompts";
    elList.innerHTML = `
      <div class="prompt-card">
        <p class="prompt-title">Error cargando la biblioteca</p>
        <div class="prompt-body">
          No se pudo cargar <strong>js/prompts_1500.json</strong>.
          <br><br>
          Solución: sube el archivo al repo en la ruta exacta:
          <br><strong>/js/prompts_1500.json</strong>
        </div>
      </div>
    `;
    console.error(e);
  }
})();
