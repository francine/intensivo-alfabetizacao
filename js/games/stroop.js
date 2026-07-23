/* Cores Trocadas — Stroop (atenção seletiva / controle inibitório) */
(function () {
  const { register, h, sfx } = window.SINAPSE;
  const COLORS = [
    { name: "VERMELHO", hex: "#e33b3b" },
    { name: "AZUL", hex: "#2b6fe0" },
    { name: "VERDE", hex: "#2fb56b" },
    { name: "AMARELO", hex: "#e8a80b" },
    { name: "ROXO", hex: "#7c5ce0" },
  ];

  register({
    id: "stroop",
    title: "Cores Trocadas",
    emoji: "🎨",
    tagline: "Diga a COR da tinta, não a palavra escrita. Foco sob conflito.",
    color: "#f2a31c",
    ages: ["11-17", "18+"],
    pillars: ["atencao", "executiva"],
    start(stage, api) {
      const total = 18;
      let t = 0, correct = 0, curInk, tick, tLeft;

      api.intro("🎨", "Cores Trocadas",
        "Vai aparecer o nome de uma cor — mas pintado com OUTRA cor. Toque na cor da TINTA, ignorando o que está escrito. Cuidado com a pegadinha!",
        () => { t = 0; correct = 0; next(); });

      function next() {
        clearInterval(tick);
        if (t >= total) {
          const score = Math.round((correct / total) * 100);
          return api.finish({ score, max: 100, scoreText: `${correct}/${total} certos`, note: score >= 80 ? "Foco de aço sob conflito!" : "Ignorar a leitura automática é difícil — bom treino executivo." });
        }
        t++;
        const word = h.pick(COLORS);
        curInk = h.pick(COLORS.filter((c) => c.name !== word.name));
        api.setStats({ Certos: correct, Rodada: `${t}/${total}` });

        const bar = h.el("i");
        const fb = h.el("div", { class: "g-feedback" });
        const btns = h.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "20px" } });
        COLORS.forEach((c) => {
          btns.appendChild(h.el("button", {
            class: "btn", style: { background: c.hex, color: "#fff", minWidth: "96px", boxShadow: "0 6px 14px " + c.hex + "55" },
            text: c.name.charAt(0) + c.name.slice(1).toLowerCase(),
            onclick: () => answer(c.name === curInk.name, fb, btns),
          }));
        });

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)" }, text: "Qual a COR da tinta?" }),
          h.el("div", { style: { fontSize: "3.4rem", fontFamily: "var(--font-display)", fontWeight: 700, color: curInk.hex, margin: "16px 0", letterSpacing: ".02em" }, text: word.name }),
          h.el("div", { class: "progress" }, [bar]),
          btns, fb,
        ]));

        tLeft = api.age === "11-17" ? 5 : 3.5; const start = tLeft;
        tick = setInterval(() => {
          tLeft -= 0.1; bar.style.width = Math.max(0, (tLeft / start) * 100) + "%";
          bar.style.background = tLeft < start * 0.3 ? "#e8567f" : "linear-gradient(90deg,#2b86f0,#175fc0)";
          if (tLeft <= 0) { clearInterval(tick); answer(false, fb, btns, true); }
        }, 100);
      }

      function answer(ok, fb, btns, timeout) {
        if (btns.dataset.done) return;
        btns.dataset.done = "1"; clearInterval(tick);
        [...btns.children].forEach((b) => (b.disabled = true));
        if (ok) { correct++; sfx.good(); fb.textContent = "Certo! ✅"; fb.className = "g-feedback ok"; }
        else { sfx.bad(); fb.textContent = timeout ? "Tempo! ⏱️ era " + curInk.name : "Era " + curInk.name; fb.className = "g-feedback no"; }
        api.setStats({ Certos: correct, Rodada: `${t}/${total}` });
        setTimeout(next, 750);
      }
    },
  });
})();
