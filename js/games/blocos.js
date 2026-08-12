/* Desafio dos Blocos — compor o número sorteado com soma ou subtração */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  const LEVELS = {
    "5-10": [
      { rounds: 6, boardSize: 6, maxNumber: 9, operations: ["+"], seconds: 0 },
      { rounds: 7, boardSize: 8, maxNumber: 12, operations: ["+", "−"], seconds: 0 },
      { rounds: 8, boardSize: 9, maxNumber: 14, operations: ["+", "−"], seconds: 20 },
    ],
    "11-17": [
      { rounds: 7, boardSize: 8, maxNumber: 15, operations: ["+"], seconds: 0 },
      { rounds: 8, boardSize: 10, maxNumber: 20, operations: ["+", "−"], seconds: 18 },
      { rounds: 10, boardSize: 12, maxNumber: 25, operations: ["+", "−"], seconds: 12 },
    ],
    "18+": [
      { rounds: 8, boardSize: 9, maxNumber: 20, operations: ["+"], seconds: 0 },
      { rounds: 9, boardSize: 11, maxNumber: 28, operations: ["+", "−"], seconds: 14 },
      { rounds: 10, boardSize: 12, maxNumber: 40, operations: ["+", "−"], seconds: 9 },
    ],
  };

  register({
    id: "blocos",
    title: "Desafio dos Blocos",
    emoji: "🎲",
    tagline: "O dado escolhe o resultado. Você monta a conta com os blocos.",
    color: "#2fb56b",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["matematica", "executiva", "atencao"],

    help: {
      como: [
        "🎲 Role o dado para descobrir o número-alvo.",
        "🧱 Escolha dois blocos numerados do tabuleiro.",
        "➕ No Iniciante, some. No Avançado e no Expert, escolha soma ou subtração.",
        "✅ Confira a conta. Você pode tentar outra combinação quando precisar.",
      ],
      dica: "Se saiu 7, experimente 1 + 6, 5 + 2, 8 − 1 ou 9 − 2.",
    },

    phases: [
      { nome: "Iniciante", params: { level: 0 } },
      { nome: "Avançado", params: { level: 1 } },
      { nome: "Expert", params: { level: 2 } },
    ],

    start(stage, api) {
      const level = (api.phase && api.phase.params && api.phase.params.level) || 0;
      const cfg = LEVELS[api.age][level];
      let round = 0, correct = 0, points = 0, attempts = 0;
      let target = 0, solution = null, selected = [], operation = "+";
      let timer = null, timeLeft = 0, locked = false, checking = false;

      api.intro("🎲", "Desafio dos Blocos",
        level === 0
          ? "Role o dado e toque em dois blocos que, somados, formam o número sorteado. Eu confiro a conta para você!"
          : "Role o dado, escolha dois blocos e use soma ou subtração para formar o número sorteado.",
        showRoll);

      function alive() { return document.body.contains(stage); }
      function stopTimer() { if (timer) clearInterval(timer); timer = null; }

      function setStats() {
        const stats = { Acertos: correct, Rodada: `${Math.min(round + 1, cfg.rounds)}/${cfg.rounds}` };
        if (cfg.seconds && target) stats.Tempo = Math.max(0, Math.ceil(timeLeft)) + "s";
        api.setStats(stats);
      }

      function showRoll() {
        stopTimer();
        if (!alive()) return;
        target = 0; selected = []; attempts = 0; locked = false; checking = false;
        if (round >= cfg.rounds) return finish();
        setStats();

        const die = h.el("div", { class: "blocks-die", text: "?", "aria-label": "resultado do dado ainda escondido" });
        const roll = h.el("button", {
          class: "btn btn-primary blocks-roll", text: "🎲 Rolar o dado",
          onclick: () => {
            if (roll.disabled) return;
            roll.disabled = true; sfx.click();
            die.classList.add("rolling");
            let spins = 0;
            const animation = setInterval(() => { die.textContent = String(h.rand(2, 12)); spins++; }, 65);
            setTimeout(() => {
              clearInterval(animation);
              if (!alive()) return;
              prepareRound();
            }, 520);
          },
        });

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel blocks-panel" }, [
          steps(1),
          h.el("div", { class: "g-prompt", text: `${api.phase.nome} · descubra o número-alvo` }),
          die,
          h.el("p", { class: "blocks-lead", text: "Quando o número aparecer, monte uma conta usando dois blocos." }),
          roll,
          h.el("div", { class: "g-toolbar" }, [
            h.el("button", { class: "btn btn-ghost btn-sm", text: "🗺️ Mapa de fases", onclick: () => api.showMap() }),
          ]),
        ]));
      }

      function prepareRound() {
        const generated = makeChallenge();
        target = generated.target; solution = generated.solution;
        renderBoard(generated.tiles);
        if (cfg.seconds) startTimer();
      }

      function makeChallenge() {
        const maxTarget = Math.min(12, cfg.maxNumber - 1);
        const nextTarget = h.rand(2, maxTarget);
        const chosenOp = h.pick(cfg.operations);
        let a, b;
        if (chosenOp === "+") {
          a = h.rand(1, nextTarget - 1); b = nextTarget - a;
        } else {
          b = h.rand(1, Math.max(1, cfg.maxNumber - nextTarget)); a = nextTarget + b;
        }

        const values = [a, b];
        while (values.length < cfg.boardSize) {
          const value = h.rand(1, cfg.maxNumber);
          if (value !== nextTarget && !values.includes(value)) values.push(value);
        }
        const tiles = h.shuffle(values.map((value, index) => ({ id: `${round}-${index}-${value}`, value })));
        return { target: nextTarget, solution: `${a} ${chosenOp} ${b} = ${nextTarget}`, tiles };
      }

      function renderBoard(tiles) {
        operation = "+"; selected = []; attempts = 0; locked = false; checking = false;
        const die = h.el("div", { class: "blocks-die revealed", text: String(target), "aria-label": `número sorteado: ${target}` });
        const expression = h.el("div", { class: "blocks-expression", "aria-live": "polite" });
        const feedback = h.el("div", { class: "g-feedback", "aria-live": "polite" });
        const board = h.el("div", { class: "blocks-board", role: "group", "aria-label": "blocos numerados" });
        const tileButtons = [];

        tiles.forEach((tile) => {
          const button = h.el("button", {
            class: `blocks-tile color-${(tile.value - 1) % 6}`,
            text: String(tile.value),
            "aria-label": `bloco ${tile.value}`,
            "aria-pressed": "false",
            onclick: () => chooseTile(tile, button),
          });
          tileButtons.push({ tile, button }); board.appendChild(button);
        });

        const operations = h.el("div", { class: "blocks-operations", role: "group", "aria-label": "operação matemática" });
        cfg.operations.forEach((op) => {
          const button = h.el("button", {
            class: "blocks-op" + (op === operation ? " active" : ""), text: op,
            "aria-label": op === "+" ? "somar" : "subtrair", "aria-pressed": op === operation ? "true" : "false",
            onclick: () => {
              if (locked) return;
              operation = op; sfx.click();
              [...operations.children].forEach((node) => {
                const active = node.textContent === operation;
                node.classList.toggle("active", active); node.setAttribute("aria-pressed", active ? "true" : "false");
              });
              updateExpression();
            },
          });
          operations.appendChild(button);
        });

        const swap = h.el("button", {
          class: "btn btn-ghost btn-sm", text: "↔ Trocar ordem", disabled: true,
          onclick: () => {
            if (selected.length < 2 || locked) return;
            selected.reverse(); sfx.click(); updateExpression();
          },
        });
        const verify = h.el("button", {
          class: "btn btn-primary", text: "Conferir conta", disabled: true,
          onclick: check,
        });

        function chooseTile(tile, button) {
          if (locked || checking) return;
          const found = selected.findIndex((item) => item.id === tile.id);
          if (found >= 0) {
            selected.splice(found, 1); button.classList.remove("selected"); button.setAttribute("aria-pressed", "false");
          } else {
            if (selected.length === 2) {
              const removed = selected.shift();
              const old = tileButtons.find((item) => item.tile.id === removed.id);
              if (old) { old.button.classList.remove("selected"); old.button.setAttribute("aria-pressed", "false"); }
            }
            selected.push(tile); button.classList.add("selected"); button.setAttribute("aria-pressed", "true"); sfx.click();
          }
          verify.disabled = selected.length !== 2;
          swap.disabled = selected.length !== 2 || cfg.operations.length === 1;
          feedback.textContent = ""; feedback.className = "g-feedback";
          updateExpression();
          if (cfg.operations.length === 1 && selected.length === 2) {
            checking = true;
            setTimeout(check, 280);
          }
        }

        function updateExpression() {
          expression.innerHTML = "";
          expression.appendChild(slot(selected[0] ? selected[0].value : "?", !!selected[0]));
          expression.appendChild(h.el("span", { class: "blocks-symbol", text: operation }));
          expression.appendChild(slot(selected[1] ? selected[1].value : "?", !!selected[1]));
          expression.appendChild(h.el("span", { class: "blocks-symbol", text: "=" }));
          expression.appendChild(slot(target, true, "target"));
        }

        function check() {
          if (selected.length !== 2 || locked) return;
          attempts++;
          const result = operation === "+" ? selected[0].value + selected[1].value : selected[0].value - selected[1].value;
          if (result === target) {
            locked = true; stopTimer(); correct++; points += attempts === 1 ? 2 : 1; sfx.good();
            expression.textContent = `${selected[0].value} ${operation} ${selected[1].value} = ${target}`;
            feedback.textContent = attempts === 1 ? "Acertou de primeira! 🎉" : "Isso! Você encontrou um caminho. 🎉";
            feedback.className = "g-feedback ok";
            tileButtons.forEach((item) => { item.button.disabled = true; });
            [...operations.children].forEach((item) => { item.disabled = true; });
            verify.disabled = true; swap.disabled = true; setStats(); round++;
            setTimeout(showRoll, 1050);
          } else {
            sfx.bad(); feedback.textContent = `${selected[0].value} ${operation} ${selected[1].value} dá ${result}. Tente outros blocos.`;
            feedback.className = "g-feedback no";
            expression.classList.remove("g-wrong"); void expression.offsetWidth; expression.classList.add("g-wrong");
            if (cfg.operations.length === 1) {
              setTimeout(() => {
                if (!alive() || locked) return;
                selected = []; checking = false;
                tileButtons.forEach((item) => { item.button.classList.remove("selected"); item.button.setAttribute("aria-pressed", "false"); });
                feedback.textContent = "Escolha outros dois blocos."; feedback.className = "g-feedback";
                updateExpression();
              }, 900);
            } else checking = false;
          }
        }

        function slot(value, filled, extra) {
          return h.el("span", { class: `blocks-slot${filled ? " filled" : ""}${extra ? " " + extra : ""}`, text: String(value) });
        }

        updateExpression();
        const task = cfg.operations.length === 1
          ? `Toque em dois blocos que, somados, dão ${target}`
          : `Escolha dois blocos e a operação que dá ${target}`;
        const controls = cfg.operations.length === 1
          ? [h.el("div", { class: "blocks-auto-hint", text: "✨ Toque em dois blocos — a conta é conferida automaticamente." })]
          : [swap, verify];

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel blocks-panel" }, [
          steps(2),
          h.el("div", { class: "g-prompt blocks-task", text: task }), die,
          expression,
          h.el("div", { class: "blocks-board-label", text: "Escolha aqui:" }),
          board,
          cfg.operations.length > 1 ? h.el("div", { class: "blocks-equation" }, [h.el("div", { class: "blocks-board-label", text: "Escolha a operação:" }), operations]) : null,
          feedback,
          h.el("div", { class: "g-toolbar" }, controls),
        ]));
        setStats();
      }

      function steps(active) {
        return h.el("div", { class: "blocks-steps", "aria-label": "etapas do jogo" }, [
          h.el("span", { class: active === 1 ? "active" : "done", text: "1 · Role o dado" }),
          h.el("span", { class: active === 2 ? "active" : "", text: "2 · Escolha os blocos" }),
          h.el("span", { text: "3 · Veja a conta" }),
        ]);
      }

      function startTimer() {
        stopTimer(); timeLeft = cfg.seconds; setStats();
        timer = setInterval(() => {
          if (!alive()) return stopTimer();
          timeLeft -= 0.1; setStats();
          if (timeLeft <= 0) {
            stopTimer(); locked = true; sfx.bad();
            const feedback = stage.querySelector(".g-feedback");
            if (feedback) { feedback.textContent = `O tempo terminou. Uma solução era ${solution}.`; feedback.className = "g-feedback no"; }
            stage.querySelectorAll("button").forEach((button) => { button.disabled = true; });
            round++; setTimeout(showRoll, 1400);
          }
        }, 100);
      }

      function finish() {
        stopTimer();
        api.finish({
          score: points, max: cfg.rounds * 2,
          scoreText: `${correct}/${cfg.rounds} números construídos`,
          note: correct === cfg.rounds ? "Você encontrou caminhos diferentes para chegar aos números! 🧠" : "Cada tentativa fortalece o cálculo mental. Vamos construir mais números!",
        });
      }
    },
  });
})();
