/* Palavras Embaralhadas — anagrama (linguagem / leitura e escrita) */
(function () {
  const { register, h, sfx } = window.SINAPSE;
  const BANK = {
    "5-10": [["CASA","onde a gente mora"],["BOLA","brinquedo redondo"],["GATO","faz miau"],["PATO","faz quá-quá"],["FLOR","nasce no jardim"],["BOLO","doce de aniversário"],["SAPO","pula e vive no brejo"],["MALA","levamos em viagem"]],
    "11-17": [["ESCOLA","lugar de estudar"],["AMIGO","companheiro querido"],["PLANTA","cresce e dá folhas"],["JANELA","abre para ver a rua"],["CIDADE","tem ruas e prédios"],["MUSICA","feita de sons"],["FLORESTA","muitas árvores juntas"],["CADERNO","usado para escrever"]],
    "18+": [["HORIZONTE","onde céu e terra se encontram"],["LABIRINTO","cheio de caminhos e becos"],["SINFONIA","grande obra musical"],["ESTRATEGIA","plano para vencer"],["METAFORA","figura de linguagem"],["PARADOXO","contradição aparente"],["CONHECIMENTO","o que se sabe"]],
  };

  register({
    id: "palavras",
    title: "Palavras Embaralhadas",
    emoji: "🔡",
    tagline: "Remonte a palavra a partir das letras trocadas. Vocabulário em ação.",
    color: "#17a5b0",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["linguagem", "executiva"],
    start(stage, api) {
      const pool = h.shuffle((BANK[api.age] || BANK["11-17"]).filter((w) => w[1] !== "—"));
      const total = Math.min(6, pool.length);
      let round = 0, solved = 0;

      api.intro("🔡", "Palavras Embaralhadas",
        "As letras de uma palavra estão fora de ordem. Toque nas letras para remontá-la. Use a DICA se precisar!",
        () => { round = 0; solved = 0; next(); });

      function next() {
        if (round >= total) {
          const score = Math.round((solved / total) * 100);
          return api.finish({ score, max: 100, scoreText: `${solved}/${total} palavras`, note: score >= 80 ? "Vocabulário e leitura afiados!" : "Remontar palavras fortalece a leitura e a escrita." });
        }
        round++;
        const [word, hint] = pool[round - 1];
        api.setStats({ Acertos: solved, Palavra: `${round}/${total}` });

        let scrambled;
        do { scrambled = h.shuffle(word.split("")); } while (scrambled.join("") === word);

        const slots = h.el("div", { style: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", minHeight: "58px", margin: "6px 0 18px" } });
        const slotEls = word.split("").map(() => h.el("div", { style: slotStyle() }));
        slotEls.forEach((s) => slots.appendChild(s));

        const tiles = h.el("div", { style: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" } });
        const fb = h.el("div", { class: "g-feedback" });
        let filled = 0;
        const placed = [];

        scrambled.forEach((ch) => {
          const tile = h.el("button", { style: tileStyle(), text: ch, onclick: () => place(ch, tile) });
          tiles.appendChild(tile);
        });

        function place(ch, tile) {
          if (tile.disabled || filled >= word.length) return;
          tile.disabled = true; tile.style.opacity = ".25"; tile.style.transform = "scale(.9)";
          const slot = slotEls[filled];
          slot.textContent = ch; slot.style.borderStyle = "solid"; slot.style.borderColor = api.color; slot.style.color = "#0b2246";
          placed.push({ ch, tile, slot }); filled++;
          sfx.click; beep(520);
          if (filled === word.length) check();
        }
        function undo() {
          const last = placed.pop(); if (!last) return;
          last.tile.disabled = false; last.tile.style.opacity = "1"; last.tile.style.transform = "scale(1)";
          last.slot.textContent = ""; last.slot.style.borderStyle = "dashed"; last.slot.style.borderColor = "#c7d2e6";
          filled--;
        }
        function check() {
          const guess = placed.map((p) => p.ch).join("");
          if (guess === word) {
            solved++; sfx.good();
            slotEls.forEach((s) => { s.style.background = "#e8fff0"; s.style.borderColor = "#37c26f"; });
            fb.textContent = "Isso! 🎉"; fb.className = "g-feedback ok";
            api.setStats({ Acertos: solved, Palavra: `${round}/${total}` });
            setTimeout(next, 950);
          } else {
            sfx.bad();
            slots.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 250 });
            fb.textContent = "Ainda não… tente reorganizar"; fb.className = "g-feedback no";
            setTimeout(() => { while (placed.length) undo(); fb.textContent = ""; }, 700);
          }
        }

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)" }, text: "Remonte a palavra:" }),
          slots, tiles, fb,
          h.el("div", { class: "g-toolbar" }, [
            h.el("button", { class: "btn btn-ghost btn-sm", text: "💡 Dica", onclick: (e) => { fb.textContent = "Dica: " + hint; fb.className = "g-feedback"; } }),
            h.el("button", { class: "btn btn-ghost btn-sm", text: "⌫ Apagar", onclick: undo }),
          ]),
        ]));
      }
    },
  });

  function slotStyle() { return { width: "46px", height: "54px", borderRadius: "10px", border: "2px dashed #c7d2e6", display: "grid", placeItems: "center", fontSize: "1.6rem", fontFamily: "var(--font-display)", fontWeight: 700, color: "#c7d2e6" }; }
  function tileStyle() { return { width: "46px", height: "54px", borderRadius: "10px", border: "0", background: "linear-gradient(135deg,#2b86f0,#175fc0)", color: "#fff", fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(31,116,224,.3)", transition: ".12s" }; }
  let ac;
  function beep(f) { if (window.SINAPSE.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination); const t = ac.currentTime; o.start(t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.stop(t + 0.12); } catch (e) {} }
})();
