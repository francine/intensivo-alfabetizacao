/* Sequência Mágica — Simon (memória de trabalho / atenção sustentada) */
(function () {
  const { register, h } = window.SINAPSE;
  const PADS = [
    { c: "#f2a31c", f: 392.0 }, // amarelo
    { c: "#2fb56b", f: 523.25 }, // verde
    { c: "#1f74e0", f: 659.25 }, // azul
    { c: "#e8567f", f: 784.0 }, // rosa
  ];

  register({
    id: "simon",
    title: "Sequência Mágica",
    emoji: "🔴",
    tagline: "Repita a sequência de luzes e sons. Cada acerto aumenta o desafio.",
    color: "#7c5ce0",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["memoria", "atencao"],
    start(stage, api) {
      const speed = api.age === "5-10" ? 720 : api.age === "11-17" ? 520 : 380;
      let seq = [], input = [], round = 0, playing = false;

      api.intro("🔴", "Sequência Mágica",
        "Observe a ordem em que as cores acendem — depois repita tocando na mesma ordem. A sequência cresce a cada rodada!",
        run);

      const pads = [];
      function board() {
        const wrap = h.el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "340px", margin: "10px auto" } });
        PADS.forEach((p, i) => {
          const pad = h.el("button", {
            "aria-label": "pad", style: padStyle(p.c, false),
            onclick: () => press(i),
          });
          pads[i] = pad; wrap.appendChild(pad);
        });
        return wrap;
      }
      const status = h.el("div", { class: "g-feedback", text: "" });

      function run() {
        seq = []; input = []; round = 0;
        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { fontSize: "1.1rem", marginBottom: "6px" }, text: "Preste atenção…" }),
          board(), status,
        ]));
        api.setStats({ Rodada: 0 });
        setTimeout(nextRound, 700);
      }

      function nextRound() {
        round++; input = [];
        seq.push(Math.floor(Math.random() * 4));
        api.setStats({ Rodada: round });
        status.textContent = "Observe…"; status.className = "g-feedback";
        playSeq();
      }

      function playSeq() {
        playing = true;
        seq.forEach((idx, k) => {
          setTimeout(() => {
            light(idx);
            if (k === seq.length - 1) setTimeout(() => { playing = false; status.textContent = "Sua vez!"; }, speed);
          }, (k + 1) * speed);
        });
      }

      function light(i) {
        const p = PADS[i];
        Object.assign(pads[i].style, padStyle(p.c, true));
        beep(p.f);
        setTimeout(() => Object.assign(pads[i].style, padStyle(p.c, false)), speed * 0.6);
      }

      function press(i) {
        if (playing) return;
        light(i);
        input.push(i);
        const idx = input.length - 1;
        if (input[idx] !== seq[idx]) {
          status.textContent = "Ops! Sequência errada."; status.className = "g-feedback no";
          window.SINAPSE.sfx.bad();
          const score = Math.max(0, round - 1);
          setTimeout(() => api.finish({ score, max: 12, scoreText: `${score} sequência(s) certa(s)`, note: score >= 5 ? "Memória de trabalho afiada!" : "Cada rodada treina sua memória — tente de novo!" }), 900);
          return;
        }
        if (input.length === seq.length) {
          status.textContent = "Certo! 🎉"; status.className = "g-feedback ok";
          window.SINAPSE.sfx.good();
          setTimeout(nextRound, 900);
        }
      }
    },
  });

  function padStyle(c, on) {
    return {
      aspectRatio: "1/1", borderRadius: "18px", border: "0", cursor: "pointer",
      background: on ? c : c + "55",
      boxShadow: on ? `0 0 26px 6px ${c}aa, inset 0 0 0 3px #fff6` : "inset 0 -4px 10px rgba(0,0,0,.12)",
      transform: on ? "scale(1.04)" : "scale(1)", transition: "all .12s",
    };
  }

  // beep independente para as cores
  let ac;
  function beep(freq) {
    if (window.SINAPSE.muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = freq; g.gain.value = 0.18;
      o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime; o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.stop(t + 0.3);
    } catch (e) {}
  }
})();
