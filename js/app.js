// JuanPeco.es - Prompt Library (client-side)
// Loads prompts from /js/prompts_1500.json and renders with search + filters + pagination.

(function () {
  const PAGE_SIZE = 30;

  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function uniq(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function normalize(s) {
    return (s || "").toString().trim().toLowerCase();
  }

  function buildOptions(selectEl, values, keepFirst = true) {
    const first = keepFirst ? selectEl.querySelector("option") : null;
    selectEl.innerHTML = "";
    if (first) selectEl.appendChild(first);
    values.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  function promptMatches(p, term) {
    if (!term) return true;
    const t = normalize(term);
    const hay = normalize([p.title, p.category, p.subcategory, p.sector, p.ai, p.text].join(" "));
    return hay.includes(t);
  }

  function renderCard(p) {
    const badges = [
      p.category ? `<span class="badge">${escapeHtml(p.category)}</span>` : "",
      p.subcategory ? `<span class="badge">${escapeHtml(p.subcategory)}</span>` : "",
      p.ai ? `<span class="badge">${escapeHtml(p.ai)}</span>` : ""
    ].filter(Boolean).join(" ");

    const textSafe = escapeHtml(p.text || "");

    return `
      <article class="prompt-card">
        <div class="prompt-head">
          <div class="prompt-title">
            <h3>${escapeHtml(p.title || "Prompt")}</h3>
            <div class="prompt-badges">${badges}</div>
          </div>
          <div class="prompt-actions">
            <button class="btn small" data-action="toggle">Ver</button>
            <button class="btn small" data-action="copy">Copiar</button>
          </div>
        </div>
        <div class="prompt-body" hidden>
          <pre class="prompt-text">${textSafe}</pre>
        </div>
      </article>
    `;
  }

  async function loadPrompts() {
    const res = await fetch("js/prompts_1500.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar js/prompts_1500.json");
    return await res.json();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const listEl = $("#promptList");
    const infoEl = $("#promptInfo");
    const searchEl = $("#promptSearch");
    const catEl = $("#promptCategory");
    const aiEl = $("#promptAI");

    if (!listEl || !infoEl || !searchEl || !catEl || !aiEl) return;

    let prompts = [];
    try {
      prompts = await loadPrompts();
    } catch (e) {
      listEl.innerHTML = `<div class="smallnote">Error cargando la biblioteca: ${escapeHtml(e.message)}</div>`;
      return;
    }

    // Populate dynamic filters from data (keeps "Todas..." first option).
    const categories = uniq(prompts.map(p => p.category)).sort((a,b)=>a.localeCompare(b,'es'));
    const ais = uniq(prompts.map(p => p.ai)).sort((a,b)=>a.localeCompare(b,'es'));
    buildOptions(catEl, categories, true);
    buildOptions(aiEl, ais, true);

    let state = {
      term: "",
      category: "Todas",
      ai: "Todas",
      page: 1
    };

    // Create pager UI (below list)
    const pager = document.createElement("div");
    pager.className = "prompt-pager";
    pager.innerHTML = `
      <button class="btn" id="promptMore" type="button">Cargar más</button>
      <button class="btn" id="promptTop" type="button">Volver arriba</button>
    `;
    listEl.insertAdjacentElement("afterend", pager);

    const moreBtn = $("#promptMore");
    const topBtn = $("#promptTop");

    function getFiltered() {
      return prompts.filter(p => {
        if (state.category !== "Todas" && p.category !== state.category) return false;
        if (state.ai !== "Todas" && p.ai !== state.ai) return false;
        if (!promptMatches(p, state.term)) return false;
        return true;
      });
    }

    function render(reset = false) {
      const filtered = getFiltered();
      const total = filtered.length;
      const showing = Math.min(state.page * PAGE_SIZE, total);

      infoEl.textContent = `Mostrando ${showing} de ${total} prompts`;

      if (reset) listEl.innerHTML = "";

      const slice = filtered.slice(0, showing);
      listEl.innerHTML = slice.map(renderCard).join("");

      // Enable/disable "Cargar más"
      if (showing >= total) {
        moreBtn.disabled = true;
        moreBtn.textContent = "No hay más";
      } else {
        moreBtn.disabled = false;
        moreBtn.textContent = "Cargar más";
      }
    }

    function resetAndRender() {
      state.page = 1;
      render(true);
    }

    // Events
    searchEl.addEventListener("input", () => {
      state.term = searchEl.value || "";
      resetAndRender();
    });

    catEl.addEventListener("change", () => {
      state.category = catEl.value;
      resetAndRender();
    });

    aiEl.addEventListener("change", () => {
      state.ai = aiEl.value;
      resetAndRender();
    });

    moreBtn.addEventListener("click", () => {
      state.page += 1;
      render(true);
    });

    topBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Delegate card actions
    listEl.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("button[data-action]");
      if (!btn) return;
      const card = ev.target.closest(".prompt-card");
      if (!card) return;

      const action = btn.getAttribute("data-action");
      const body = card.querySelector(".prompt-body");
      const pre = card.querySelector(".prompt-text");
      const text = pre ? pre.textContent : "";

      if (action === "toggle") {
        const isHidden = body.hasAttribute("hidden");
        if (isHidden) body.removeAttribute("hidden");
        else body.setAttribute("hidden", "");
        btn.textContent = isHidden ? "Ocultar" : "Ver";
      }

      if (action === "copy") {
        try {
          await navigator.clipboard.writeText(text);
          const old = btn.textContent;
          btn.textContent = "Copiado";
          setTimeout(() => (btn.textContent = old), 900);
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          const old = btn.textContent;
          btn.textContent = "Copiado";
          setTimeout(() => (btn.textContent = old), 900);
        }
      }
    });

    // First render
    render(true);
  });
})();
