(() => {
  const els = {
    list: document.getElementById("promptList"),
    search: document.getElementById("promptSearch"),
    cat: document.getElementById("promptCategory"),
    ai: document.getElementById("promptAI"),
    info: document.getElementById("promptInfo"),
  };

  let all = [];

  function norm(s){ return (s ?? "").toString().toLowerCase().trim(); }

  function render(items){
    els.list.innerHTML = items.map(p => {
      const title = p.titulo || p.title || "Prompt";
      const cat = p.categoria || p.category || "General";
      const ai  = (p.ia || p.ai || "chatgpt").toString();
      const txt = p.prompt || p.text || "";

      return `
        <article class="prompt-card">
          <h4>${escapeHtml(title)}</h4>
          <div class="meta">
            <span class="tag">${escapeHtml(cat)}</span>
            <span class="tag ai">${escapeHtml(ai)}</span>
          </div>
          <pre>${escapeHtml(txt)}</pre>
        </article>
      `;
    }).join("");

    els.info.textContent = `Mostrando ${items.length} de ${all.length} prompts`;
  }

  function filter(){
    const q = norm(els.search.value);
    const c = els.cat.value;
    const a = els.ai.value;

    const out = all.filter(p => {
      const title = norm(p.titulo || p.title);
      const cat = (p.categoria || p.category || "General");
      const ai  = (p.ia || p.ai || "chatgpt").toString();
      const txt = norm(p.prompt || p.text);

      const matchQ = !q || title.includes(q) || txt.includes(q);
      const matchC = (c === "Todas") || (cat === c);
      const matchA = (a === "Todas") || (ai.toLowerCase() === a.toLowerCase());

      return matchQ && matchC && matchA;
    });

    render(out);
  }

  function escapeHtml(str){
    return (str ?? "").toString()
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function load(){
    try{
      // IMPORTANTE: el archivo debe estar en /js/prompts_1500.json
      const res = await fetch("js/prompts_1500.json", { cache: "no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

      const data = await res.json();
      all = Array.isArray(data) ? data : (data.prompts || []);

      if(!Array.isArray(all)) all = [];

      // primera pintada
      render(all.slice(0, 50)); // pinta 50 de entrada para que cargue rápido
      // si quieres que pinte todos de golpe, cambia a render(all)
      els.info.textContent = `Biblioteca cargada. Usa el buscador y los filtros para encontrar prompts rápidamente.`;
    }catch(err){
      els.info.textContent = `Error cargando la biblioteca: ${err.message}`;
      console.error(err);
    }
  }

  // eventos
  ["input","change"].forEach(ev => {
    els.search?.addEventListener(ev, filter);
    els.cat?.addEventListener(ev, filter);
    els.ai?.addEventListener(ev, filter);
  });

  load();
})();
