/* Memória dos Bichos — jogo da memória (pares) */
(function () {
  const { register, h, sfx } = window.SINAPSE;
  const ICONS = ["🐶","🐱","🦁","🐸","🐵","🦊","🐼","🐷","🐨","🐮","🐔","🐧","🦉","🦋","🐢","🦄"];

  function cardStyle(up) {
    return {
      aspectRatio: "1/1", width: "100%", minWidth: "58px", borderRadius: "14px",
      display: "grid", placeItems: "center", fontSize: "2rem",
      background: up ? "#fff" : "linear-gradient(135deg,#2b86f0,#0f3d80)",
      color: up ? "#0b2246" : "#cfe2ff",
      border: up ? "2px solid #d3ddee" : "2px solid transparent",
      boxShadow: "0 4px 12px rgba(15,61,128,.12)", transition: "transform .15s",
    };
  }

  register({
    id: "memoria",
    title: "Memória dos Bichos",
    emoji: "🧩",
    tagline: "Encontre os pares escondidos e treine a memória visual.",
    color: "#e8567f",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["memoria", "atencao"],
    start(stage, api) {
      const pairs = api.age === "5-10" ? 6 : api.age === "11-17" ? 8 : 10;
      const cols = pairs <= 6 ? 3 : 4;
      const deck = h.shuffle([...ICONS].slice(0, pairs).flatMap((x) => [x, x]));
      let flipped = [], matched = 0, moves = 0, lock = false;

      api.intro("🧩", "Memória dos Bichos",
        "Vire duas cartas por vez. Ache os pares iguais e limpe o tabuleiro com o menor número de jogadas!",
        run);

      function run() {
        api.setStats({ Pares: `0/${pairs}`, Jogadas: 0 });
        const grid = h.el("div", { style: { display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: "12px", maxWidth: "460px", margin: "0 auto" } });
        deck.forEach((icon, i) => {
          const face = h.el("div", { style: cardStyle(false), text: "❓" });
          const card = h.el("button", { style: { border: 0, background: "none", padding: 0, cursor: "pointer" }, onclick: () => flip(i, icon, face) }, [face]);
          grid.appendChild(card);
        });
        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [grid]));

        function flip(i, icon, face) {
          if (lock || flipped.find((f) => f.i === i) || face.dataset.done) return;
          sfx.click();
          face.textContent = icon; Object.assign(face.style, cardStyle(true));
          flipped.push({ i, icon, face });
          if (flipped.length < 2) return;
          moves++; lock = true;
          api.setStats({ Pares: `${matched}/${pairs}`, Jogadas: moves });
          const [a, b] = flipped;
          if (a.icon === b.icon) {
            setTimeout(() => {
              [a, b].forEach((c) => { c.face.dataset.done = "1"; c.face.style.background = "#e8fff0"; c.face.style.borderColor = "#37c26f"; });
              matched++; flipped = []; lock = false; sfx.good();
              api.setStats({ Pares: `${matched}/${pairs}`, Jogadas: moves });
              if (matched === pairs) {
                const extra = Math.max(0, moves - pairs);
                // curva gentil: completar todos os pares sempre garante reforço positivo (mín. 🥈)
                const score = Math.max(45, Math.round(100 - extra * (24 / pairs)));
                setTimeout(() => api.finish({ score, max: 100, scoreText: `${moves} jogadas · nota ${score}`, note: `Você achou todos os ${pairs} pares!` }), 480);
              }
            }, 360);
          } else {
            setTimeout(() => {
              [a, b].forEach((c) => { c.face.textContent = "❓"; Object.assign(c.face.style, cardStyle(false)); });
              flipped = []; lock = false; sfx.bad();
            }, 720);
          }
        }
      }
    },
  });
})();
