/* ============================================================
   SINAPSE — app: navegação, assinatura simulada e plataforma
   ============================================================ */
(function () {
  const { h, sfx } = window.SINAPSE;
  const KEY = "sinapse_user";

  const PILLARS = {
    atencao: { label: "Atenção", color: "#f2a31c", icon: "🎯" },
    memoria: { label: "Memória", color: "#e8567f", icon: "🧩" },
    executiva: { label: "Funções executivas", color: "#7c5ce0", icon: "🧭" },
    linguagem: { label: "Linguagem", color: "#17a5b0", icon: "🔤" },
    matematica: { label: "Matemática", color: "#2fb56b", icon: "🔢" },
    percepcao: { label: "Percepção", color: "#f0563f", icon: "👁️" },
  };
  const AGES = [
    { id: "5-10", label: "5–10 anos", emoji: "🧒" },
    { id: "11-17", label: "11–17 anos", emoji: "🧑" },
    { id: "18+", label: "18 anos +", emoji: "👩‍🦳" },
  ];

  function getUser() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function setUser(u) { localStorage.setItem(KEY, JSON.stringify(u)); }

  /* ---------------- Modais ---------------- */
  const mroot = () => document.getElementById("modal-root");
  function closeModal() { mroot().innerHTML = ""; document.body.style.overflow = ""; }
  function openModal(node) {
    const back = h.el("div", { class: "modal-back", onclick: (e) => { if (e.target === back) closeModal(); } }, [node]);
    mroot().innerHTML = ""; mroot().appendChild(back); document.body.style.overflow = "hidden";
  }

  const PLANS = {
    Essencial: 29, Família: 49, Consultório: 149,
  };

  function subscribeFlow(preselect) {
    let plan = preselect && PLANS[preselect] ? preselect : "Família";
    const modal = h.el("div", { class: "modal" });
    openModal(modal);
    step1();

    function shell(title, sub, body) {
      modal.innerHTML = "";
      modal.appendChild(h.el("button", { class: "modal-close", text: "✕", onclick: closeModal }));
      modal.appendChild(h.el("h3", { text: title }));
      modal.appendChild(h.el("div", { class: "sub", text: sub }));
      body.forEach((n) => modal.appendChild(n));
    }

    function step1() {
      const opts = h.el("div", { class: "pick-plan" });
      Object.keys(PLANS).forEach((name) => {
        const opt = h.el("div", {
          class: "opt" + (name === plan ? " sel" : ""),
          onclick: () => { plan = name; [...opts.children].forEach((c) => c.classList.remove("sel")); opt.classList.add("sel"); sfx.click(); },
        }, [
          h.el("div", {}, [
            h.el("b", { text: name }),
            h.el("div", { style: { fontSize: ".82rem", color: "var(--ink-soft)" }, text: whoText(name) }),
          ]),
          h.el("div", { class: "p", text: "R$" + PLANS[name] }),
        ]);
        opts.appendChild(opt);
      });
      shell("Escolha seu plano", "Cancele quando quiser. Todos os planos liberam os 10 jogos.", [
        opts,
        h.el("button", { class: "btn btn-primary btn-block", text: "Continuar →", onclick: step2 }),
      ]);
    }

    function step2() {
      const name = field("Seu nome", "text", "Como quer ser chamado(a)");
      const email = field("E-mail", "email", "voce@email.com");
      const card = field("Número do cartão", "text", "0000 0000 0000 0000");
      const exp = field("Validade", "text", "MM/AA");
      const cvv = field("CVV", "text", "123");
      card.input.addEventListener("input", () => { card.input.value = card.input.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });

      const err = h.el("div", { style: { color: "var(--p-percepcao)", fontSize: ".85rem", fontWeight: 700, minHeight: "18px" } });
      shell("Pagamento — " + plan, `R$${PLANS[plan]}/mês · demonstração (nenhuma cobrança real)`, [
        name.wrap, email.wrap, card.wrap,
        h.el("div", { class: "row2" }, [exp.wrap, cvv.wrap]),
        err,
        h.el("button", {
          class: "btn btn-primary btn-block", style: { marginTop: "6px" }, text: `Assinar por R$${PLANS[plan]}/mês`,
          onclick: () => {
            if (!name.input.value.trim()) return fail("Digite seu nome");
            if (!/.+@.+\..+/.test(email.input.value)) return fail("E-mail inválido");
            if (card.input.value.replace(/\s/g, "").length < 16) return fail("Número do cartão incompleto");
            processing(name.input.value.trim(), email.input.value.trim());
          },
        }),
        h.el("div", { class: "pay-badge" }, ["🔒 Pagamento simulado para apresentação"]),
      ]);
      function fail(m) { err.textContent = m; sfx.bad(); }
    }

    function processing(name, email) {
      shell("Processando…", "Confirmando sua assinatura", [
        h.el("div", { style: { textAlign: "center", padding: "24px 0" } }, [
          h.el("div", { class: "success-check", style: { background: "linear-gradient(135deg,#7fb4ff,#2b6fe0)", animation: "spin 1s linear infinite" }, html: "<span style='display:block'>◔</span>" }),
        ]),
      ]);
      // spinner css
      if (!document.getElementById("spin-kf")) {
        const s = document.createElement("style"); s.id = "spin-kf";
        s.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
        document.head.appendChild(s);
      }
      setTimeout(() => success(name, email), 1400);
    }

    function success(name, email) {
      setUser({ name, email, plan, subscribed: true, since: "2026-07-18" });
      sfx.win();
      shell("Assinatura ativa! 🎉", "", [
        h.el("div", { style: { textAlign: "center" } }, [
          h.el("div", { class: "success-check", text: "✓" }),
          h.el("p", { style: { color: "var(--ink-soft)", margin: "0 auto 20px", maxWidth: "30ch" }, html: `Bem-vindo(a), <b>${escapeHtml(name)}</b>! Seu plano <b>${plan}</b> está ativo. Bons jogos!` }),
          h.el("button", { class: "btn btn-primary btn-block", text: "Entrar na plataforma →", onclick: () => { closeModal(); mountApp(); } }),
        ]),
      ]);
    }
  }

  function whoText(name) {
    return { Essencial: "1 perfil · casa", Família: "até 4 perfis", Consultório: "pacientes ilimitados" }[name] || "";
  }
  function field(label, type, ph) {
    const input = h.el("input", { type, placeholder: ph });
    const wrap = h.el("div", { class: "field" }, [h.el("label", { text: label }), input]);
    return { wrap, input };
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function loginFlow() {
    const u = getUser();
    if (u && u.subscribed) return mountApp();
    const name = field("Seu nome", "text", "Como quer ser chamado(a)");
    const modal = h.el("div", { class: "modal" }, [
      h.el("button", { class: "modal-close", text: "✕", onclick: closeModal }),
      h.el("h3", { text: "Entrar" }),
      h.el("div", { class: "sub", text: "Ainda não tem assinatura? Comece agora." }),
      name.wrap,
      h.el("button", { class: "btn btn-primary btn-block", text: "Entrar", onclick: () => {
        if (!name.input.value.trim()) { name.input.focus(); return; }
        setUser({ name: name.input.value.trim(), plan: "Família", subscribed: true, since: "2026-07-18" });
        closeModal(); mountApp();
      } }),
      h.el("div", { style: { textAlign: "center", marginTop: "14px" } }, [
        h.el("a", { href: "#", style: { color: "var(--blue)", fontWeight: 700, textDecoration: "none" }, text: "Quero assinar →", onclick: (e) => { e.preventDefault(); subscribeFlow("Família"); } }),
      ]),
    ]);
    openModal(modal);
  }

  /* ---------------- Plataforma (área logada) ---------------- */
  let curAge = "5-10", curPillar = null;

  function mountApp() {
    const u = getUser() || { name: "Visitante" };
    document.getElementById("site").classList.add("hidden");
    const app = document.getElementById("app");
    app.classList.remove("hidden");
    window.scrollTo(0, 0);

    app.innerHTML = "";
    app.appendChild(h.el("nav", { class: "app-nav" }, [
      h.el("div", { class: "wrap nav-in" }, [
        h.el("a", { class: "brand", href: "#", onclick: (e) => e.preventDefault() }, [
          h.el("span", { class: "brand-mark", html: brandSvg() }),
          h.el("span", {}, [h.el("div", { class: "brand-name", html: "Intensivo da <b>Alfabetização</b>" }), h.el("div", { class: "brand-sub", text: "jogos · por Roberta Reis" })]),
        ]),
        h.el("div", { class: "chip-user" }, [
          h.el("button", { class: "btn btn-ghost btn-sm", text: "← Site", onclick: exitApp }),
          h.el("div", { class: "avatar", text: (u.name || "?").charAt(0).toUpperCase() }),
          h.el("div", {}, [
            h.el("div", { style: { fontWeight: 800, fontSize: ".9rem", lineHeight: 1 }, text: u.name }),
            h.el("div", { style: { fontSize: ".72rem", color: "var(--ink-soft)", fontWeight: 700 }, text: "Plano " + (u.plan || "—") }),
          ]),
        ]),
      ]),
    ]));

    const body = h.el("div", { class: "wrap" });
    app.appendChild(body);

    body.appendChild(h.el("div", { class: "app-hero" }, [
      h.el("h1", { html: `Olá, ${escapeHtml((u.name || "").split(" ")[0] || "")}! Vamos treinar? 🧠` }),
      h.el("p", { text: "Escolha a faixa etária e o que quer exercitar. Toque em um jogo para começar." }),
    ]));

    // Banner de instruções + acesso livre
    body.appendChild(h.el("div", { class: "app-guide" }, [
      h.el("div", { class: "g-title" }, ["📋 Como usar"]),
      h.el("div", { class: "steps-line" }, [
        h.el("span", {}, [h.el("span", { class: "num", text: "1" }), "Escolha a ", h.el("b", { text: "faixa etária" })]),
        h.el("span", {}, [h.el("span", { class: "num", text: "2" }), "Filtre por ", h.el("b", { text: "domínio" }), " (ou Todos)"]),
        h.el("span", {}, [h.el("span", { class: "num", text: "3" }), "Toque num ", h.el("b", { text: "jogo" })]),
        h.el("span", {}, [h.el("span", { class: "num", text: "4" }), "Cada jogo abre com ", h.el("b", { text: "instruções" })]),
      ]),
      h.el("div", { class: "demo-pill", text: "🔓 Acesso livre a todos os jogos" }),
    ]));

    // filtros
    const tabs = h.el("div", { class: "tabs" });
    AGES.forEach((a) => {
      tabs.appendChild(h.el("button", {
        class: "tab" + (a.id === curAge ? " active" : ""),
        html: `${a.emoji} ${a.label}`,
        onclick: () => { curAge = a.id; sfx.click(); render(); },
      }));
    });

    const chips = h.el("div", { class: "chips" });
    const allChip = h.el("button", { class: "pchip" + (curPillar === null ? " active" : ""), style: curPillar === null ? { background: "#0b2246", color: "#fff", borderColor: "transparent" } : {}, text: "Todos" , onclick: () => { curPillar = null; render(); } });
    chips.appendChild(allChip);
    Object.keys(PILLARS).forEach((k) => {
      const p = PILLARS[k];
      const active = curPillar === k;
      chips.appendChild(h.el("button", {
        class: "pchip" + (active ? " active" : ""),
        style: active ? { background: p.color, borderColor: "transparent" } : {},
        onclick: () => { curPillar = active ? null : k; sfx.click(); render(); },
      }, [h.el("span", { class: "dot", style: { background: p.color } }), p.icon + " " + p.label]));
    });

    body.appendChild(h.el("div", { class: "filters" }, [tabs, chips]));
    const grid = h.el("div", { class: "games-grid", id: "games-grid" });
    body.appendChild(grid);

    render();
    function render() {
      // re-sync tab/chip active states
      [...tabs.children].forEach((t, i) => t.classList.toggle("active", AGES[i].id === curAge));
      [...chips.children].forEach((c) => c.classList.remove("active"));
      renderChips();
      renderGrid(grid);
    }
    function renderChips() {
      allChip.classList.toggle("active", curPillar === null);
      allChip.style.background = curPillar === null ? "#0b2246" : "#fff";
      allChip.style.color = curPillar === null ? "#fff" : "var(--ink-soft)";
      allChip.style.borderColor = curPillar === null ? "transparent" : "";
      const keys = Object.keys(PILLARS);
      [...chips.children].slice(1).forEach((c, i) => {
        const k = keys[i], p = PILLARS[k], on = curPillar === k;
        c.classList.toggle("active", on);
        c.style.background = on ? p.color : "#fff";
        c.style.borderColor = on ? "transparent" : "";
        c.style.color = on ? "#fff" : "var(--ink-soft)";
      });
    }
  }

  function renderGrid(grid) {
    const games = window.SINAPSE.list().filter((g) => g.ages.includes(curAge) && (!curPillar || g.pillars.includes(curPillar)));
    grid.innerHTML = "";
    if (!games.length) {
      grid.appendChild(h.el("div", { style: { gridColumn: "1/-1", textAlign: "center", padding: "50px", color: "var(--ink-soft)" }, text: "Nenhum jogo com esse filtro nesta faixa. Tente outro domínio." }));
      return;
    }
    games.forEach((g) => {
      const cover = h.el("div", { class: "cover", style: { background: `linear-gradient(135deg, ${g.color}22, ${g.color}44)` } }, [
        h.el("span", { text: g.emoji }),
        h.el("span", { class: "age", text: AGES.find((a) => a.id === curAge).label }),
      ]);
      const tags = h.el("div", { class: "tags" });
      g.pillars.forEach((pk) => { const p = PILLARS[pk]; if (p) tags.appendChild(h.el("span", { class: "t", style: { background: p.color }, text: p.label })); });
      const card = h.el("div", { class: "game-card", onclick: () => { sfx.click(); window.SINAPSE.open(g.id, curAge); } }, [
        cover,
        h.el("div", { class: "body" }, [
          h.el("h3", { text: g.title }),
          h.el("div", { class: "tg", text: g.tagline }),
          tags,
          h.el("div", { class: "play", text: "Jogar ▶" }),
        ]),
      ]);
      grid.appendChild(card);
    });
  }

  function exitApp() {
    document.getElementById("app").classList.add("hidden");
    document.getElementById("site").classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function brandSvg() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="7" r="2.4" fill="#8fc0ff"/><circle cx="18" cy="6" r="2.1" fill="#e6c98a"/><circle cx="17" cy="17" r="2.4" fill="#fff"/><circle cx="7" cy="17" r="2" fill="#8fc0ff"/><path d="M6 7 L18 6 M18 6 L17 17 M17 17 L7 17 M7 17 L6 7 M6 7 L17 17" stroke="#cfe2ff" stroke-width="1.1" opacity=".7"/></svg>`;
  }

  // Entrar direto na plataforma, sem assinar (modo demonstração / acesso livre)
  function enterDemo() {
    if (!getUser()) setUser({ name: "Convidada", plan: "Demonstração", demo: true, subscribed: false, since: "2026-07-18" });
    mountApp();
  }

  /* ---------------- Wire up ---------------- */
  document.addEventListener("click", (e) => {
    const sub = e.target.closest("[data-open-sub]");
    if (sub) { e.preventDefault(); subscribeFlow(sub.getAttribute("data-plan")); return; }
    const enter = e.target.closest("[data-enter-app]");
    if (enter) { e.preventDefault(); enterDemo(); return; }
  });
  const burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", () => {
    document.querySelector("#planos").scrollIntoView({ behavior: "smooth" });
  });

  window.SINAPSE.mountApp = mountApp;
  window.SINAPSE.enterDemo = enterDemo;

  // Deep-link: #play=<id>&age=<faixa>&auto=1  (abre um jogo direto)
  function checkDeepLink() {
    if (!location.hash) return;
    const p = new URLSearchParams(location.hash.replace(/^#/, ""));
    const id = p.get("play");
    if (!id || !window.SINAPSE.games[id]) return;
    if (!getUser()) setUser({ name: "Convidada", plan: "Família", subscribed: true, since: "2026-07-18" });
    if (p.get("auto")) window.SINAPSE.autostart = true;
    mountApp();
    window.SINAPSE.open(id, p.get("age") || "11-17");
  }
  checkDeepLink();
  window.addEventListener("hashchange", checkDeepLink);
})();
