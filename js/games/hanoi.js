/* Torre Mágica — Torre de Hanói (planejamento / resolução de problemas) */
(function () {
  const { register, h, sfx } = window.SINAPSE;
  const DCOL = ["#e33b3b","#e8a80b","#2fb56b","#2b6fe0","#7c5ce0"];

  register({
    id: "hanoi",
    title: "Torre Mágica",
    emoji: "🗼",
    tagline: "Mova a torre inteira sem pôr um disco grande sobre um menor.",
    color: "#7c5ce0",
    ages: ["11-17", "18+"],
    pillars: ["executiva", "matematica"],
    start(stage, api) {
      const N = api.age === "18+" ? 4 : 3;
      const minMoves = Math.pow(2, N) - 1;
      let pegs, moves, sel;

      api.intro("🗼", "Torre Mágica",
        `Mova todos os ${N} discos da primeira para a última haste. Só um disco por vez, e nunca um maior sobre um menor. Tente no mínimo de jogadas (o ideal é ${minMoves})!`,
        run);

      function run() {
        pegs = [Array.from({ length: N }, (_, i) => N - i), [], []];
        moves = 0; sel = null;
        draw();
      }

      function draw() {
        api.setStats({ Jogadas: moves, Ideal: minMoves });
        const board = h.el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", alignItems: "end", height: "230px", marginTop: "6px" } });
        pegs.forEach((peg, pi) => {
          const rod = h.el("div", {
            style: {
              position: "relative", height: "100%", display: "flex", flexDirection: "column-reverse", alignItems: "center",
              cursor: "pointer", borderRadius: "12px",
              background: sel === pi ? "#eef3fb" : "transparent", transition: "background .15s",
            },
            onclick: () => clickPeg(pi),
          });
          // haste
          rod.appendChild(h.el("div", { style: { position: "absolute", bottom: "8px", width: "8px", height: "78%", background: "#c7d2e6", borderRadius: "4px" } }));
          rod.appendChild(h.el("div", { style: { position: "absolute", bottom: "0", width: "92%", height: "10px", background: "#9fb2d2", borderRadius: "6px" } }));
          peg.forEach((size) => {
            const w = 30 + (size / N) * 66;
            rod.appendChild(h.el("div", {
              style: {
                position: "relative", zIndex: 2, width: w + "%", height: "26px", margin: "3px 0",
                background: `linear-gradient(180deg, ${DCOL[size-1]}, ${shade(DCOL[size-1])})`,
                borderRadius: "8px", boxShadow: "0 3px 8px rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.4)",
              },
            }));
          });
          board.appendChild(rod);
        });
        const fb = h.el("div", { class: "g-feedback", id: "hanoi-fb" });
        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)", textAlign: "center", marginBottom: "4px" }, text: sel === null ? "Toque na haste de origem" : "Toque na haste de destino" }),
          board, fb,
          h.el("div", { class: "g-toolbar" }, [h.el("button", { class: "btn btn-ghost btn-sm", text: "↻ Reiniciar", onclick: run })]),
        ]));
      }

      function clickPeg(pi) {
        if (sel === null) {
          if (!pegs[pi].length) return;
          sel = pi; sfx.click(); beep(500); draw(); return;
        }
        if (sel === pi) { sel = null; draw(); return; }
        const from = pegs[sel], to = pegs[pi];
        const disk = from[from.length - 1];
        if (to.length && to[to.length - 1] < disk) {
          sfx.bad(); sel = null; draw();
          const fb = document.getElementById("hanoi-fb"); if (fb) { fb.textContent = "Não pode! disco maior sobre menor 🚫"; fb.className = "g-feedback no"; }
          return;
        }
        to.push(from.pop()); moves++; sel = null; sfx.good(); beep(680); draw();
        if (pegs[2].length === N) {
          const score = Math.round(Math.max(20, 100 - (moves - minMoves) * (60 / minMoves)));
          setTimeout(() => api.finish({ score, max: 100, scoreText: `${moves} jogadas (ideal ${minMoves})`, note: moves === minMoves ? "Perfeito! Solução ótima. 🏆" : "Você resolveu! Planeje os passos para chegar ao ideal." }), 400);
        }
      }
    },
  });

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 30), g = Math.max(0, ((n >> 8) & 255) - 30), b = Math.max(0, (n & 255) - 30);
    return `rgb(${r},${g},${b})`;
  }
  let ac;
  function beep(f) { if (window.SINAPSE.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.1; o.connect(g); g.connect(ac.destination); const t = ac.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.stop(t + 0.15); } catch (e) {} }
})();
