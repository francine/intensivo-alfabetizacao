/* Pega ou Segura — Go/No-Go (controle inibitório / atenção sustentada) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  register({
    id: "semaforo",
    title: "Pega ou Segura",
    emoji: "🚦",
    tagline: "Toque nos verdes, segure nos vermelhos. Treine o autocontrole.",
    color: "#2fb56b",
    ages: ["5-10", "11-17"],
    pillars: ["executiva", "atencao"],
    start(stage, api) {
      const trials = api.age === "5-10" ? 16 : 22;
      const showMs = api.age === "5-10" ? 1100 : 850;
      let t = 0, correct = 0, waiting = false, isGo = false, answered = false, timer = null;

      api.intro("🚦", "Pega ou Segura",
        "Vão aparecer bichinhos. Se o fundo ficar VERDE, toque rápido! Se ficar VERMELHO, NÃO toque — segure a mão. Erre o menos possível.",
        run);

      const zone = h.el("button", {
        style: {
          width: "100%", maxWidth: "460px", margin: "0 auto", display: "grid", placeItems: "center",
          aspectRatio: "3/2", borderRadius: "24px", border: "0", cursor: "pointer",
          fontSize: "4.5rem", background: "#eef3fb", transition: "background .12s", boxShadow: "inset 0 0 0 3px #e2e9f4",
        },
        onclick: tap,
      }, ["👀"]);
      const fb = h.el("div", { class: "g-feedback" });

      function run() {
        t = 0; correct = 0;
        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { marginBottom: "14px", fontSize: "1.05rem" }, text: "Verde = toque · Vermelho = segure" }),
          zone, fb,
        ]));
        api.setStats({ Acertos: 0, Rodada: `0/${trials}` });
        setTimeout(nextTrial, 700);
      }

      const GO = ["🐶","🐰","🐥","🐸","🦋","🐢"], NOGO = ["🦂","🐍","🕷️","🦟"];
      function nextTrial() {
        if (t >= trials) return end();
        t++; answered = false; waiting = true;
        isGo = Math.random() < 0.68;
        zone.style.background = isGo ? "linear-gradient(135deg,#7ee0a3,#2fb56b)" : "linear-gradient(135deg,#ff9a8b,#e8567f)";
        zone.textContent = isGo ? h.pick(GO) : h.pick(NOGO);
        fb.textContent = ""; fb.className = "g-feedback";
        api.setStats({ Acertos: correct, Rodada: `${t}/${trials}` });
        clearTimeout(timer);
        timer = setTimeout(() => {
          waiting = false;
          zone.style.background = "#eef3fb"; zone.textContent = "👀";
          if (!answered) {
            if (!isGo) { correct++; sfx.tick(); flash(true, "Segurou! 👍"); } // correct withhold
            else { sfx.bad(); flash(false, "Ops, passou o verde! Toque mais rápido 💚"); } // miss
          }
          api.setStats({ Acertos: correct, Rodada: `${t}/${trials}` });
          setTimeout(nextTrial, 500);
        }, showMs);
      }

      function tap() {
        if (!waiting || answered) return;
        answered = true; waiting = false;
        clearTimeout(timer);
        if (isGo) { correct++; sfx.good(); flash(true, "Pegou! ⚡"); }
        else { sfx.bad(); flash(false, "Ops! era pra segurar"); }
        zone.style.background = "#eef3fb"; zone.textContent = "👀";
        api.setStats({ Acertos: correct, Rodada: `${t}/${trials}` });
        setTimeout(nextTrial, 500);
      }

      function flash(ok, msg) { fb.textContent = msg; fb.className = "g-feedback " + (ok ? "ok" : "no"); }

      function end() {
        const score = Math.round((correct / trials) * 100);
        api.finish({ score, max: 100, scoreText: `${correct}/${trials} certos · ${score}%`, note: score >= 80 ? "Autocontrole excelente!" : "Segurar o impulso é treino — cada rodada ajuda." });
      }
    },
  });
})();
