/* Quebra-Cabeça Deslizante — monta a figura em ordem (percepção / orientação espacial / planejamento) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  // dificuldade por faixa etária
  const LEVELS = {
    "5-10":  { n: 3, nome: "Fácil" },
    "11-17": { n: 4, nome: "Médio" },
    "18+":   { n: 5, nome: "Difícil" },
  };

  register({
    id: "quebra",
    title: "Quebra-Cabeça",
    emoji: "🧩",
    tagline: "Deslize as peças e monte a ordem certa. Fácil, médio ou difícil por idade.",
    color: "#f0563f",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["percepcao", "executiva"],
    start(stage, api) {
      const lvl = LEVELS[api.age] || LEVELS["11-17"];
      const N = lvl.n, TOTAL = N * N;
      let board, blank, moves, t0, tick;

      api.intro("🧩", `Quebra-Cabeça · ${lvl.nome} (${N}×${N})`,
        `Toque numa peça vizinha do espaço vazio para deslizá-la. Coloque os números em ordem (1, 2, 3…) com o espaço vazio no canto. Nível ${lvl.nome.toLowerCase()} para a sua faixa!`,
        run);

      function solvedBoard() { return Array.from({ length: TOTAL }, (_, i) => (i + 1) % TOTAL); } // [1..N²-1, 0]

      function run() {
        board = solvedBoard();
        blank = TOTAL - 1;
        // embaralha por movimentos válidos (garante solúvel)
        let prev = -1;
        for (let k = 0; k < TOTAL * 40; k++) {
          const nb = neighbors(blank).filter((x) => x !== prev);
          const pick = nb[Math.floor(Math.random() * nb.length)];
          prev = blank;
          swap(pick, blank); blank = pick;
        }
        moves = 0; t0 = Date.now();
        clearInterval(tick);
        tick = setInterval(() => api.setStats({ Jogadas: moves, Tempo: ((Date.now() - t0) / 1000).toFixed(0) + "s" }), 250);
        draw();
      }

      function neighbors(i) {
        const r = Math.floor(i / N), c = i % N, out = [];
        if (r > 0) out.push(i - N);
        if (r < N - 1) out.push(i + N);
        if (c > 0) out.push(i - 1);
        if (c < N - 1) out.push(i + 1);
        return out;
      }
      function swap(a, b) { const t = board[a]; board[a] = board[b]; board[b] = t; }
      function isSolved() { return board.every((v, i) => v === (i + 1) % TOTAL); }

      function draw() {
        api.setStats({ Jogadas: moves, Tempo: ((Date.now() - t0) / 1000).toFixed(0) + "s" });
        const size = Math.min(420, 88 * N);
        const grid = h.el("div", {
          style: { display: "grid", gridTemplateColumns: `repeat(${N},1fr)`, gap: "8px", width: size + "px", maxWidth: "100%", margin: "6px auto 0", aspectRatio: "1/1" },
        });
        board.forEach((val, i) => {
          if (val === 0) { grid.appendChild(h.el("div", { style: { borderRadius: "12px", background: "transparent" } })); return; }
          const canMove = neighbors(blank).includes(i);
          // matiz pela posição-alvo → quando resolvido vira um gradiente suave (auto-dica)
          const hue = Math.round((val / TOTAL) * 210) + 195;
          const tile = h.el("button", {
            style: {
              borderRadius: "12px", border: "0", cursor: canMove ? "pointer" : "default",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: N >= 5 ? "1.2rem" : "1.7rem", color: "#fff",
              background: `linear-gradient(150deg, hsl(${hue} 78% 62%), hsl(${hue} 72% 46%))`,
              boxShadow: "0 4px 10px rgba(15,61,128,.18), inset 0 0 0 1px rgba(255,255,255,.25)",
              transition: "transform .12s, filter .12s",
              filter: canMove ? "none" : "saturate(.9)",
            },
            text: String(val),
            onclick: () => move(i),
          });
          grid.appendChild(tile);
        });

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)", textAlign: "center", marginBottom: "4px" }, text: `Nível ${lvl.nome} · ordene 1 → ${TOTAL - 1}` }),
          grid,
          h.el("div", { class: "g-toolbar" }, [h.el("button", { class: "btn btn-ghost btn-sm", text: "🔀 Embaralhar", onclick: run })]),
        ]));
      }

      function move(i) {
        if (!neighbors(blank).includes(i)) return;
        swap(i, blank); blank = i; moves++;
        sfx.click; beep(480 + (board[i] || 0) * 6);
        if (isSolved()) {
          clearInterval(tick);
          sfx.good();
          const secs = (Date.now() - t0) / 1000;
          const par = TOTAL * 8; // jogadas de referência
          const score = Math.round(Math.max(20, 100 - Math.max(0, moves - par) * (40 / par) - Math.max(0, secs - TOTAL * 6) * 0.5));
          return setTimeout(() => api.finish({ score, max: 100, scoreText: `${moves} jogadas · ${secs.toFixed(0)}s`, note: `Você montou o quebra-cabeça ${lvl.nome.toLowerCase()} (${N}×${N})! 🧩` }), 350);
        }
        draw();
      }
    },
  });

  let ac;
  function beep(f) { if (window.SINAPSE.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.07; o.connect(g); g.connect(ac.destination); const t = ac.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11); o.stop(t + 0.11); } catch (e) {} }
})();
