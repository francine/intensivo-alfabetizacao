/* Quebra-Cabeça Deslizante — monta a ordem certa (percepção / orientação espacial / planejamento)
   Framework de fases: cada fase muda o tamanho da grade via params.grid. */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  register({
    id: "quebra",
    title: "Quebra-Cabeça",
    emoji: "🧩",
    tagline: "Deslize as peças e monte a ordem certa. Passe de fase e ganhe estrelas!",
    color: "#f0563f",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["percepcao", "executiva"],

    help: {
      como: [
        "👆 Toque numa peça vizinha do buraco pra ela deslizar pro lugar vazio.",
        "🔢 Vá colocando os números em ordem: 1, 2, 3, 4…",
        "🕳️ O espaço vazio precisa terminar no cantinho de baixo.",
        "🎉 Montou tudo em ordem? Você passa de fase e ganha estrelas!",
      ],
      dica: "Resolva primeiro a linha de cima inteira, depois desça linha por linha.",
    },

    phases: [
      { nome: "Fácil · 3×3", params: { grid: 3 } },
      { nome: "Médio · 4×4", params: { grid: 4 } },
      { nome: "Difícil · 5×5", params: { grid: 5 } },
    ],

    start(stage, api) {
      const N = (api.phase && api.phase.params && api.phase.params.grid) || 3;
      const TOTAL = N * N;
      const GAP = 2.6; // % do tabuleiro entre peças
      const CELL = (100 - GAP * (N - 1)) / N;
      const NOME = api.phase.nome || `${N}×${N}`;
      let board, blank, moves, t0, tick, boardEl, tileEls;

      run();

      function solvedBoard() { return Array.from({ length: TOTAL }, (_, i) => (i + 1) % TOTAL); } // [1..N²-1, 0]

      function run() {
        board = solvedBoard();
        blank = TOTAL - 1;
        let prev = -1;
        for (let k = 0; k < TOTAL * 40; k++) {
          const nb = neighbors(blank).filter((x) => x !== prev);
          const pick = nb[Math.floor(Math.random() * nb.length)];
          prev = blank;
          swap(pick, blank); blank = pick;
        }
        if (isSolved()) return run(); // garante que começa embaralhado
        moves = 0; t0 = Date.now();
        clearInterval(tick);
        tick = setInterval(() => api.setStats({ Jogadas: moves, Tempo: ((Date.now() - t0) / 1000).toFixed(0) + "s" }), 250);
        buildBoard();
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
      function posOf(i) { return { left: (i % N) * (CELL + GAP), top: Math.floor(i / N) * (CELL + GAP) }; }

      function buildBoard() {
        api.setStats({ Jogadas: moves, Tempo: "0s" });
        const size = Math.min(420, 92 * N);
        boardEl = h.el("div", {
          style: { position: "relative", width: size + "px", maxWidth: "100%", margin: "6px auto 0", aspectRatio: "1/1", background: "#eef3fb", borderRadius: "16px", padding: "0", boxShadow: "inset 0 0 0 1px var(--line)" },
        });
        tileEls = {};
        for (let val = 1; val < TOTAL; val++) {
          const hue = Math.round((val / TOTAL) * 210) + 195;
          const tile = h.el("button", {
            "aria-label": "peça " + val,
            style: {
              position: "absolute", width: CELL + "%", height: CELL + "%",
              borderRadius: "12px", border: "0", cursor: "pointer",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: N >= 5 ? "1.2rem" : "1.7rem", color: "#fff",
              background: `linear-gradient(150deg, hsl(${hue} 78% 62%), hsl(${hue} 72% 46%))`,
              boxShadow: "0 4px 10px rgba(15,61,128,.18), inset 0 0 0 1px rgba(255,255,255,.25)",
              transition: "left .18s cubic-bezier(.2,.8,.3,1), top .18s cubic-bezier(.2,.8,.3,1), transform .12s, filter .12s",
            },
            text: String(val),
            onclick: () => move(board.indexOf(val)),
          });
          tileEls[val] = tile;
          boardEl.appendChild(tile);
        }
        placeAll();
        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)", textAlign: "center", marginBottom: "4px" }, text: `${NOME} · ordene 1 → ${TOTAL - 1}` }),
          boardEl,
          h.el("div", { class: "g-toolbar" }, [
            h.el("button", { class: "btn btn-ghost btn-sm", text: "🔀 Embaralhar", onclick: run }),
            h.el("button", { class: "btn btn-ghost btn-sm", text: "🗺️ Mapa de fases", onclick: () => api.showMap() }),
          ]),
        ]));
      }

      function placeAll() {
        board.forEach((val, i) => {
          if (val === 0) return;
          const t = tileEls[val], p = posOf(i);
          t.style.left = p.left + "%"; t.style.top = p.top + "%";
          const canMove = neighbors(blank).includes(i);
          t.style.cursor = canMove ? "pointer" : "default";
          t.style.filter = canMove ? "none" : "saturate(.9)";
        });
      }

      function move(i) {
        if (!neighbors(blank).includes(i)) return;
        const val = board[i];
        swap(i, blank); blank = i; moves++;
        sfx.click(); beep(480 + (val || 0) * 6);
        placeAll();
        api.setStats({ Jogadas: moves, Tempo: ((Date.now() - t0) / 1000).toFixed(0) + "s" });
        if (isSolved()) {
          clearInterval(tick);
          sfx.good();
          // celebração: peças pulsam em cascata
          Object.keys(tileEls).forEach((v, k) => {
            const t = tileEls[v];
            setTimeout(() => { t.classList.remove("g-boom"); void t.offsetWidth; t.classList.add("g-boom"); }, k * 40);
          });
          const secs = (Date.now() - t0) / 1000;
          // ---- estrelas por eficiência (menos jogadas / menos tempo) ----
          const parMoves = TOTAL * 5;      // jogadas "ideais" de referência
          const parSecs = TOTAL * 4;       // tempo "ideal" de referência
          let stars = 1;                   // completar sempre garante ≥ 1 estrela
          if (moves <= parMoves * 1.2 && secs <= parSecs * 1.6) stars = 3;
          else if (moves <= parMoves * 2.2 && secs <= parSecs * 2.8) stars = 2;
          const score = Math.round(Math.max(20, 100 - Math.max(0, moves - parMoves) * (40 / parMoves) - Math.max(0, secs - parSecs) * 0.5));
          return setTimeout(() => api.finish({
            score, max: 100, stars,
            scoreText: `${moves} jogadas · ${secs.toFixed(0)}s`,
            note: `Você montou o quebra-cabeça ${NOME}! 🧩`,
          }), 700);
        }
      }
    },
  });

  let ac;
  function beep(f) { if (window.SINAPSE.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.07; o.connect(g); g.connect(ac.destination); const t = ac.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11); o.stop(t + 0.11); } catch (e) {} }
})();
