/* Cofre da Memória — digit span (memória de trabalho verbal) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  register({
    id: "digitos",
    title: "Cofre da Memória",
    emoji: "🔟",
    tagline: "Memorize a senha que pisca e digite de volta. A senha cresce!",
    color: "#7c5ce0",
    ages: ["11-17", "18+"],
    pillars: ["memoria", "atencao"],
    start(stage, api) {
      const reverse = api.age === "18+";
      const flashMs = api.age === "18+" ? 620 : 780;
      let span = 3, best = 0, seq = [];

      api.intro("🔟", "Cofre da Memória",
        (reverse
          ? "Uma senha vai piscar dígito por dígito. Digite-a na ORDEM INVERSA (de trás para frente). "
          : "Uma senha vai piscar dígito por dígito. Memorize e digite na MESMA ordem. ")
          + "A cada acerto ela ganha mais um número!",
        () => { span = 3; best = 0; round(); });

      function round() {
        seq = Array.from({ length: span }, () => h.rand(0, 9));
        api.setStats({ Tamanho: span, Recorde: best });
        stage.innerHTML = "";
        const display = h.el("div", { style: { fontSize: "4rem", fontFamily: "var(--font-display)", fontWeight: 700, height: "90px", display: "grid", placeItems: "center", color: api.color }, text: "•" });
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)" }, text: reverse ? "Memorize (vai digitar ao contrário)" : "Memorize a senha…" }),
          display,
        ]));
        let i = 0;
        const iv = setInterval(() => {
          display.textContent = seq[i]; sfx.tick();
          beep(440 + seq[i] * 40);
          setTimeout(() => (display.textContent = ""), flashMs * 0.6);
          i++;
          if (i >= seq.length) { clearInterval(iv); setTimeout(input, flashMs); }
        }, flashMs);
      }

      function input() {
        const target = reverse ? [...seq].reverse() : seq;
        let typed = [];
        const shown = h.el("div", { style: { fontSize: "2.4rem", letterSpacing: ".2em", fontFamily: "var(--font-display)", fontWeight: 700, height: "50px", color: "#0b2246" }, text: "" });
        const fb = h.el("div", { class: "g-feedback" });
        const pad = h.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", maxWidth: "260px", margin: "16px auto 0" } });
        const keys = ["1","2","3","4","5","6","7","8","9","⌫","0","OK"];
        keys.forEach((k) => {
          pad.appendChild(h.el("button", {
            class: "btn", style: { background: k === "OK" ? "linear-gradient(135deg,#2b86f0,#175fc0)" : "#fff", color: k === "OK" ? "#fff" : "#0b2246", border: k === "OK" ? "0" : "2px solid #d3ddee", fontSize: "1.3rem", padding: "14px" },
            text: k,
            onclick: () => {
              if (k === "⌫") { typed.pop(); }
              else if (k === "OK") { return check(); }
              else if (typed.length < target.length) { typed.push(Number(k)); beep(500); }
              shown.textContent = typed.join(" ");
              if (typed.length === target.length) check();
            },
          }));
        });

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)" }, text: reverse ? "Digite AO CONTRÁRIO:" : "Digite a senha:" }),
          shown, pad, fb,
        ]));

        function check() {
          if (pad.dataset.done || typed.length < target.length) return;
          pad.dataset.done = "1";
          const ok = target.every((d, i) => d === typed[i]);
          if (ok) {
            best = Math.max(best, span); span++; sfx.good();
            fb.textContent = "Certo! Senha maior… 🔓"; fb.className = "g-feedback ok";
            api.setStats({ Tamanho: span, Recorde: best });
            setTimeout(round, 950);
          } else {
            sfx.bad();
            fb.textContent = "Senha errada! Era " + seq.join(" "); fb.className = "g-feedback no";
            const score = Math.min(100, best * 12);
            setTimeout(() => api.finish({ score, max: 100, scoreText: `Recorde: ${best} dígitos`, note: best >= 7 ? "Memória de trabalho excepcional!" : "A média adulta é 7 dígitos — continue treinando!" }), 1100);
          }
        }
      }
    },
  });

  let ac;
  function beep(f) {
    if (window.SINAPSE.muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f; g.gain.value = 0.12; o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.stop(t + 0.18);
    } catch (e) {}
  }
})();
