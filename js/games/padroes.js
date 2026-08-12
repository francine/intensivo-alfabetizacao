/* Padrões de Cores — percepção visual, atenção e memória */
(function () {
  const { register, h, sfx } = window.SINAPSE;
  const PALETTE_SIZE = 6;

  const LEVELS = {
    "5-10": [
      { rounds: 6, length: 3, options: 3, preview: 0, seconds: 0 },
      { rounds: 7, length: 4, options: 4, preview: 0, seconds: 0 },
      { rounds: 8, length: 5, options: 4, preview: 3500, seconds: 18 },
    ],
    "11-17": [
      { rounds: 7, length: 4, options: 4, preview: 0, seconds: 0 },
      { rounds: 8, length: 5, options: 5, preview: 3000, seconds: 15 },
      { rounds: 9, length: 6, options: 6, preview: 2200, seconds: 10 },
    ],
    "18+": [
      { rounds: 8, length: 5, options: 4, preview: 0, seconds: 0 },
      { rounds: 9, length: 6, options: 5, preview: 2500, seconds: 12 },
      { rounds: 10, length: 8, options: 6, preview: 1600, seconds: 8 },
    ],
  };

  register({
    id: "padroes",
    title: "Padrões de Cores",
    emoji: "🎨",
    tagline: "Observe a placa e encontre a sequência de cores igual.",
    color: "#f0563f",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["percepcao", "atencao", "memoria"],

    help: {
      como: [
        "👀 Observe a ordem das cores na placa-modelo.",
        "🎨 Compare com as placas que aparecem abaixo.",
        "👆 Toque na placa que repete exatamente o mesmo padrão.",
        "🧠 Nos desafios maiores, memorize antes que o modelo se esconda.",
      ],
      dica: "Leia as cores da esquerda para a direita e repare em qual posição cada uma aparece.",
    },

    phases: [
      { nome: "Iniciante", params: { level: 0 } },
      { nome: "Avançado", params: { level: 1 } },
      { nome: "Expert", params: { level: 2 } },
    ],

    start(stage, api) {
      const level = (api.phase && api.phase.params && api.phase.params.level) || 0;
      const cfg = LEVELS[api.age][level];
      let round = 0, correct = 0, points = 0, mistakes = 0;
      let timer = null, previewTimer = null, timeLeft = 0, locked = false;

      next();

      function alive() { return document.body.contains(stage); }
      function clearTimers() { clearInterval(timer); clearTimeout(previewTimer); timer = null; previewTimer = null; }
      function setStats() {
        const stats = { Acertos: correct, Rodada: `${Math.min(round + 1, cfg.rounds)}/${cfg.rounds}` };
        if (cfg.seconds && timeLeft > 0) stats.Tempo = Math.ceil(timeLeft) + "s";
        api.setStats(stats);
      }

      function makeTarget() {
        const out = [];
        while (out.length < cfg.length) {
          const color = h.rand(0, PALETTE_SIZE - 1);
          if (out.length === 0 || color !== out[out.length - 1]) out.push(color);
        }
        return out;
      }

      function mutate(target, strength) {
        const copy = target.slice();
        const positions = h.sample(Array.from({ length: copy.length }, (_, i) => i), strength);
        positions.forEach((position) => {
          let color = copy[position];
          while (color === copy[position]) color = h.rand(0, PALETTE_SIZE - 1);
          copy[position] = color;
        });
        return copy;
      }

      function makeOptions(target) {
        const keys = new Set([target.join("-")]);
        const choices = [{ colors: target.slice(), correct: true }];
        while (choices.length < cfg.options) {
          const strength = level === 0 ? 1 : h.rand(1, Math.min(2, cfg.length));
          const candidate = mutate(target, strength);
          const key = candidate.join("-");
          if (!keys.has(key)) { keys.add(key); choices.push({ colors: candidate, correct: false }); }
        }
        return h.shuffle(choices);
      }

      function sequence(colors, hidden) {
        const row = h.el("div", { class: "pattern-sequence" + (hidden ? " hidden-pattern" : ""), "aria-label": hidden ? "padrão escondido" : "sequência de cores" });
        colors.forEach((color) => row.appendChild(h.el("span", { class: `pattern-cell color-${color}`, text: hidden ? "?" : "", "aria-hidden": "true" })));
        return row;
      }

      function next() {
        clearTimers();
        if (!alive()) return;
        if (round >= cfg.rounds) return finish();
        locked = false; mistakes = 0; timeLeft = 0; setStats();
        const target = makeTarget();
        const choices = makeOptions(target);
        render(target, choices);
      }

      function render(target, choices) {
        const model = h.el("div", { class: "pattern-model" }, [
          h.el("div", { class: "pattern-label", text: cfg.preview ? "Memorize o padrão" : "Padrão-modelo" }),
          sequence(target, false),
        ]);
        const feedback = h.el("div", { class: "g-feedback", "aria-live": "polite" });
        const options = h.el("div", { class: "pattern-options hidden", role: "group", "aria-label": "placas para escolher" });

        choices.forEach((choice, index) => {
          const button = h.el("button", {
            class: "pattern-card", "aria-label": `placa ${index + 1}`,
            onclick: () => answer(choice.correct, button),
          }, [
            h.el("span", { class: "pattern-card-number", text: String(index + 1) }),
            sequence(choice.colors, false),
          ]);
          if (choice.correct) button.dataset.correct = "true";
          options.appendChild(button);
        });

        function showChoices() {
          if (!alive()) return;
          if (cfg.preview) {
            model.innerHTML = "";
            model.appendChild(h.el("div", { class: "pattern-label", text: "Qual placa era igual?" }));
            model.appendChild(sequence(target, true));
          }
          options.classList.remove("hidden");
          options.querySelector("button").focus();
          if (cfg.seconds) startTimer();
        }

        function answer(ok, button) {
          if (locked || button.disabled) return;
          if (ok) {
            locked = true; clearTimers(); correct++; points += mistakes === 0 ? 2 : 1; sfx.good();
            button.classList.add("correct");
            feedback.textContent = mistakes === 0 ? "Padrão perfeito! 🎉" : "Encontrou! Cada detalhe conta. 🎉";
            feedback.className = "g-feedback ok";
            [...options.children].forEach((node) => { node.disabled = true; });
            setStats(); round++; setTimeout(next, 1050);
          } else {
            mistakes++; sfx.bad(); button.disabled = true; button.classList.add("wrong");
            feedback.textContent = "Essa placa tem uma cor fora do lugar. Compare novamente.";
            feedback.className = "g-feedback no";
          }
        }

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel pattern-panel" }, [
          h.el("div", { class: "g-prompt", text: `${api.phase.nome} · encontre o padrão idêntico` }),
          model, options, feedback,
        ]));

        if (cfg.preview) previewTimer = setTimeout(showChoices, cfg.preview);
        else showChoices();
      }

      function startTimer() {
        timeLeft = cfg.seconds; setStats();
        timer = setInterval(() => {
          if (!alive()) return clearTimers();
          timeLeft -= 0.1; setStats();
          if (timeLeft <= 0) {
            clearTimers(); locked = true; sfx.bad();
            const right = stage.querySelector('[data-correct="true"]');
            if (right) right.classList.add("correct");
            stage.querySelectorAll(".pattern-card").forEach((node) => { node.disabled = true; });
            const feedback = stage.querySelector(".g-feedback");
            if (feedback) { feedback.textContent = "O tempo terminou. A placa certa ficou iluminada."; feedback.className = "g-feedback no"; }
            round++; setTimeout(next, 1400);
          }
        }, 100);
      }

      function finish() {
        clearTimers();
        api.finish({
          score: points, max: cfg.rounds * 2,
          scoreText: `${correct}/${cfg.rounds} padrões encontrados`,
          note: correct === cfg.rounds ? "Seus olhos encontraram cada detalhe do padrão! 👀" : "Observar posição por posição deixa a percepção cada vez mais afiada.",
        });
      }
    },
  });
})();
