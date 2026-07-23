/* Foguete das Contas — cálculo mental (matemática / raciocínio lógico) */
(function () {
  const { register, h, sfx } = window.SINAPSE;

  register({
    id: "contas",
    title: "Foguete das Contas",
    emoji: "🔢",
    tagline: "Resolva contas na velocidade do foguete. Cálculo mental puro.",
    color: "#2fb56b",
    ages: ["5-10", "11-17", "18+"],
    pillars: ["matematica", "atencao"],
    start(stage, api) {
      const total = 10;
      let q = 0, correct = 0, tLeft, tick, rocketEl;

      // cena do foguete: sobe conforme os acertos
      function rocketScene() {
        const track = h.el("div", {
          style: {
            position: "relative", width: "72px", height: "132px", margin: "0 auto 6px", borderRadius: "16px",
            background: "linear-gradient(180deg,#0f3d80 0%,#2b6fe0 55%,#bfe0ff 100%)",
            overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.15)",
          },
        }, [
          h.el("div", { style: { position: "absolute", top: "12px", left: "14px", fontSize: ".7rem" }, text: "✨" }),
          h.el("div", { style: { position: "absolute", top: "30px", right: "12px", fontSize: ".55rem" }, text: "⭐" }),
          h.el("div", { style: { position: "absolute", top: "58px", left: "20px", fontSize: ".5rem" }, text: "✨" }),
        ]);
        const ground = h.el("div", { style: { position: "absolute", bottom: "0", left: "0", right: "0", height: "16px", background: "linear-gradient(180deg,#8fce9f,#4fae6e)" } });
        rocketEl = h.el("div", {
          class: "contas-rocket",
          style: {
            position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: "1.9rem", lineHeight: 1,
            bottom: rocketBottom() + "%", transition: "bottom .6s cubic-bezier(.2,.9,.3,1.3)",
          },
          text: "🚀",
        });
        track.appendChild(ground);
        track.appendChild(rocketEl);
        return track;
      }
      function rocketBottom() { return 8 + (correct / total) * 74; }

      api.intro("🔢", "Foguete das Contas",
        api.age === "5-10"
          ? "Resolva as continhas de mais e de menos escolhendo a resposta certa. Sem pressa — pense bem!"
          : "Resolva o máximo de contas certas. Você tem tempo limitado por questão — seja rápido e preciso!",
        () => { q = 0; correct = 0; next(); });

      function gen() {
        const A = api.age;
        let a, b, op, ans;
        if (A === "5-10") {
          op = h.pick(["+", "-"]);
          a = h.rand(1, 10); b = h.rand(1, op === "-" ? a : 10);
          if (op === "-" && b > a) [a, b] = [b, a];
          ans = op === "+" ? a + b : a - b;
        } else if (A === "11-17") {
          op = h.pick(["+", "-", "×"]);
          if (op === "×") { a = h.rand(2, 12); b = h.rand(2, 12); ans = a * b; }
          else { a = h.rand(10, 60); b = h.rand(5, 40); if (op === "-" && b > a) [a, b] = [b, a]; ans = op === "+" ? a + b : a - b; }
        } else {
          op = h.pick(["+", "-", "×", "÷"]);
          if (op === "×") { a = h.rand(6, 19); b = h.rand(4, 15); ans = a * b; }
          else if (op === "÷") { b = h.rand(3, 12); ans = h.rand(3, 15); a = b * ans; }
          else { a = h.rand(30, 140); b = h.rand(15, 90); if (op === "-" && b > a) [a, b] = [b, a]; ans = op === "+" ? a + b : a - b; }
        }
        const opts = new Set([ans]);
        while (opts.size < 4) { const d = ans + h.rand(-Math.max(3, Math.round(ans * .2)), Math.max(3, Math.round(ans * .2))); if (d >= 0) opts.add(d); }
        return { text: `${a} ${op} ${b}`, ans, opts: h.shuffle([...opts]) };
      }

      function next() {
        clearInterval(tick);
        if (q >= total) {
          const score = Math.round((correct / total) * 100);
          return api.finish({ score, max: 100, scoreText: `${correct}/${total} certas`, note: score >= 80 ? "Cálculo mental de foguete! 🚀" : "Praticar cálculo deixa a mente rápida — continue!" });
        }
        q++;
        const { text, ans, opts } = gen();
        api.setStats({ Certas: correct, Questão: `${q}/${total}` });

        const bar = h.el("i", { style: { width: "100%" } });
        const fb = h.el("div", { class: "g-feedback" });
        const grid = h.el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "340px", margin: "18px auto 0" } });

        opts.forEach((o) => {
          const b = h.el("button", {
            class: "btn", style: { background: "#fff", border: "2px solid #d3ddee", color: "#0b2246", fontSize: "1.4rem", padding: "16px" },
            text: String(o),
            onclick: () => answer(o === ans, b, ans, grid),
          });
          grid.appendChild(b);
        });

        stage.innerHTML = "";
        const nodes = [
          rocketScene(),
          h.el("div", { class: "g-prompt", style: { color: "var(--ink-soft)" }, text: "Quanto é?" }),
          h.el("div", { style: { fontSize: "3rem", fontFamily: "var(--font-display)", fontWeight: 700, margin: "6px 0" }, text: text + " = ?" }),
        ];
        if (api.age !== "5-10") nodes.push(h.el("div", { class: "progress" }, [bar]));
        nodes.push(grid, fb);
        stage.appendChild(h.el("div", { class: "g-panel", style: { textAlign: "center" } }, nodes));

        if (api.age !== "5-10") {
          tLeft = api.age === "11-17" ? 8 : 6;
          const start = tLeft;
          tick = setInterval(() => {
            tLeft -= 0.1;
            bar.style.width = Math.max(0, (tLeft / start) * 100) + "%";
            bar.style.background = tLeft < start * 0.3 ? "#e8567f" : "linear-gradient(90deg,#2b86f0,#175fc0)";
            if (tLeft <= 0) { clearInterval(tick); answer(false, null, ans, grid, true); }
          }, 100);
        }
      }

      function answer(ok, btn, ans, grid, timeout) {
        if (grid.dataset.done) return;
        grid.dataset.done = "1";
        clearInterval(tick);
        const fb = stage.querySelector(".g-feedback");
        [...grid.children].forEach((b) => { b.disabled = true; if (Number(b.textContent) === ans) { b.style.borderColor = "#37c26f"; b.style.background = "#e8fff0"; } });
        if (ok) {
          correct++; sfx.good(); fb.textContent = "Certo! 🚀"; fb.className = "g-feedback ok";
          if (rocketEl) { rocketEl.style.bottom = rocketBottom() + "%"; rocketEl.classList.remove("g-boom"); void rocketEl.offsetWidth; rocketEl.classList.add("g-boom"); }
        }
        else { sfx.bad(); if (btn) { btn.style.borderColor = "#e8567f"; btn.style.background = "#fff0f4"; } fb.textContent = timeout ? "Tempo! ⏱️ era " + ans : "A resposta era " + ans; fb.className = "g-feedback no"; }
        api.setStats({ Certas: correct, Questão: `${q}/${total}` });
        setTimeout(next, 950);
      }
    },
  });
})();
