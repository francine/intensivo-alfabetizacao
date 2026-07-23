/* Liga os Pontos — Trail Making (flexibilidade / atenção dividida / velocidade) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  register({
    id: "trilha",
    title: "Liga os Pontos",
    emoji: "🔗",
    tagline: "Ligue a sequência na ordem certa, o mais rápido que puder.",
    color: "#f2a31c",
    ages: ["11-17", "18+"],
    pillars: ["atencao", "executiva"],
    start(stage, api) {
      const alt = api.age === "18+"; // Trilha B: 1-A-2-B...
      const pairs = alt ? 7 : 0;
      const seq = alt
        ? Array.from({ length: pairs }, (_, i) => [String(i + 1), "ABCDEFG"[i]]).flat()
        : Array.from({ length: 12 }, (_, i) => String(i + 1));

      api.intro("🔗", "Liga os Pontos",
        alt
          ? "Toque alternando NÚMERO e LETRA em ordem: 1 → A → 2 → B → 3 → C… Sem errar, o mais rápido possível!"
          : "Toque nos números em ordem, do 1 até o 12, o mais rápido que conseguir. Cada erro conta!",
        run);

      function run() {
        let idx = 0, errors = 0, t0 = Date.now(), tick;
        const area = h.el("div", { style: { position: "relative", height: "420px", background: "#f7faff", border: "1px dashed #c7d2e6", borderRadius: "16px", overflow: "hidden" } });
        const timeStat = () => api.setStats({ Tempo: ((Date.now() - t0) / 1000).toFixed(1) + "s", Erros: errors });
        timeStat(); tick = setInterval(timeStat, 100);

        // posições em grade jitterada
        const cols = 4, rows = Math.ceil(seq.length / cols);
        const cells = h.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, seq.length);
        const dots = seq.map((label, i) => {
          const cell = cells[i];
          const cx = (cell % cols + 0.5) / cols, cy = (Math.floor(cell / cols) + 0.5) / rows;
          const jx = (Math.random() - 0.5) * 0.10, jy = (Math.random() - 0.5) * 0.14;
          const isLetter = /[A-Z]/.test(label);
          const b = h.el("button", {
            style: {
              position: "absolute", left: `calc(${(cx + jx) * 100}% - 26px)`, top: `calc(${(cy + jy) * 100}% - 26px)`,
              width: "52px", height: "52px", borderRadius: "50%", border: "3px solid",
              borderColor: isLetter ? "#f2a31c" : "#2b6fe0", background: "#fff",
              color: isLetter ? "#b8790a" : "#175fc0", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem",
              cursor: "pointer", boxShadow: "0 4px 10px rgba(15,61,128,.14)", transition: "transform .1s",
            },
            text: label,
            onclick: () => hit(i, label, b),
          });
          return b;
        });
        dots.forEach((d) => area.appendChild(d));

        stage.innerHTML = "";
        stage.appendChild(h.el("div", { class: "g-panel" }, [
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)", textAlign: "center", marginBottom: "10px" }, id: "trilha-next", text: `Toque no: ${seq[0]}` }),
          area,
        ]));

        function hit(i, label, b) {
          if (label !== seq[idx]) { errors++; sfx.bad(); b.style.borderColor = "#e33b3b"; b.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 200 }); return; }
          sfx.good(); b.style.background = "#2fb56b"; b.style.color = "#fff"; b.style.borderColor = "#2fb56b"; b.disabled = true; b.style.transform = "scale(.9)";
          idx++;
          const nx = document.getElementById("trilha-next");
          if (idx < seq.length) { if (nx) nx.textContent = `Toque no: ${seq[idx]}`; }
          else {
            clearInterval(tick);
            const secs = (Date.now() - t0) / 1000;
            const par = alt ? 26 : 18;
            const score = Math.round(Math.max(15, 100 - Math.max(0, secs - par) * 3 - errors * 8));
            if (nx) nx.textContent = "Completo! ✅";
            setTimeout(() => api.finish({ score, max: 100, scoreText: `${secs.toFixed(1)}s · ${errors} erro(s)`, note: score >= 80 ? "Velocidade e flexibilidade de ponta!" : "Alternar e buscar rápido é puro treino executivo." }), 500);
          }
        }
      }
    },
  });
})();
