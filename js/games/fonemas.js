/* Caça ao Som — consciência fonológica (linguagem / alfabetização) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  const WORDS = [
    ["🐝","abelha"],["🍍","abacaxi"],["🐢","tartaruga"],["🌳","arvore"],
    ["🍌","banana"],["🎈","balao"],["🦋","borboleta"],["🐻","urso"],
    ["🐶","cachorro"],["🥕","cenoura"],["🌵","cacto"],["🐱","gato"],
    ["🐘","elefante"],["⭐","estrela"],["🐟","peixe"],["🔥","fogo"],
    ["🦒","girafa"],["🌻","girassol"],["🏠","casa"],["🌙","lua"],
    ["🦁","leao"],["🍋","limao"],["🍇","uva"],["🐍","cobra"],
    ["🌹","rosa"],["☀️","sol"],["🐸","sapo"],["🐧","pinguim"],
    ["🍐","pera"],["🐰","coelho"],["🦆","pato"],["🚗","carro"],
    ["🐮","vaca"],["🌈","arco"],["🦉","coruja"],["🍊","laranja"],
    ["🐔","galinha"],["🥚","ovo"],["🌼","flor"],["🍉","melancia"],
  ];

  function speak(txt) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = "pt-BR"; u.rate = 0.85;
      const v = window.speechSynthesis.getVoices().find((x) => /pt/i.test(x.lang));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  register({
    id: "fonemas",
    title: "Caça ao Som",
    emoji: "🔤",
    tagline: "Ache a figura que começa com o som certo. Alfabetização brincando.",
    color: "#17a5b0",
    ages: ["5-10"],
    pillars: ["linguagem", "percepcao"],
    start(stage, api) {
      const total = 8;
      let round = 0, correct = 0;

      api.intro("🔤", "Caça ao Som",
        "Vai aparecer uma LETRA. Toque na figura cujo nome COMEÇA com o som dela. Toque no 🔊 para ouvir a letra.",
        () => { round = 0; correct = 0; next(); });

      function next() {
        if (round >= total) {
          const score = Math.round((correct / total) * 100);
          return api.finish({ score, max: 100, scoreText: `${correct}/${total} certos`, note: score >= 75 ? "Ouvido afiado para os sons!" : "Ouvir o som das letras é o começo da leitura — continue!" });
        }
        round++;
        // escolhe letra alvo que tenha ao menos 1 palavra
        const letters = [...new Set(WORDS.map((w) => w[1][0]))];
        const letter = h.pick(letters);
        const rightPool = WORDS.filter((w) => w[1][0] === letter);
        const right = h.pick(rightPool);
        const wrongPool = h.shuffle(WORDS.filter((w) => w[1][0] !== letter)).slice(0, 3);
        const options = h.shuffle([right, ...wrongPool]);

        api.setStats({ Acertos: correct, Rodada: `${round}/${total}` });

        const big = h.el("div", {
          class: "fonemas-letter",
          style: { display: "inline-block", fontSize: "5rem", fontFamily: "var(--font-display)", fontWeight: 700, color: api.color, textTransform: "uppercase", lineHeight: 1 },
          text: letter,
        });
        const listen = h.el("button", { class: "btn btn-ghost btn-sm", text: "🔊 Ouvir a letra", onclick: () => speak(letter) });
        const fb = h.el("div", { class: "g-feedback" });
        const grid = h.el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "360px", margin: "18px auto 0" } });

        options.forEach(([emoji, word]) => {
          const b = h.el("button", {
            style: { fontSize: "3rem", padding: "18px", borderRadius: "18px", border: "2px solid #d3ddee", background: "#fff", cursor: "pointer", transition: ".15s" },
            onclick: () => {
              if (fb.dataset.done) return;
              if (word[0] === letter) {
                fb.dataset.done = "1"; correct++; sfx.good();
                b.style.borderColor = "#37c26f"; b.style.background = "#e8fff0";
                b.classList.add("g-boom");
                big.classList.remove("fonemas-letter"); void big.offsetWidth; big.classList.add("g-celebrate");
                fb.textContent = `Isso! ${word.toUpperCase()} começa com ${letter.toUpperCase()}`; fb.className = "g-feedback ok";
                speak(word);
                setTimeout(next, 1100);
              } else {
                sfx.bad(); b.style.borderColor = "#e8567f"; b.style.background = "#fff0f4";
                b.classList.remove("g-wrong"); void b.offsetWidth; b.classList.add("g-wrong");
                fb.textContent = "Esse não… escute de novo o som"; fb.className = "g-feedback no";
              }
            },
          }, [emoji]);
          grid.appendChild(b);
        });

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)", marginBottom: "6px" }, text: "Qual figura começa com esta letra?" }),
          big, h.el("div", { style: { marginTop: "10px" } }, [listen]), grid, fb,
        ]));
        setTimeout(() => speak(letter), 250);
      }
    },
  });
})();
