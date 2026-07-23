/* ============================================================
   SINAPSE — motor de jogos
   Cuida do chrome (barra, pontuação, som, resultado, replay).
   Cada jogo só implementa start(stage, api).
   ============================================================ */
(function () {
  const SINAPSE = (window.SINAPSE = window.SINAPSE || { games: {}, order: [] });

  /* ---------- helpers globais ---------- */
  const H = (SINAPSE.h = {
    el(tag, props = {}, kids = []) {
      const n = document.createElement(tag);
      for (const k in props) {
        if (k === "class") n.className = props[k];
        else if (k === "html") n.innerHTML = props[k];
        else if (k === "text") n.textContent = props[k];
        else if (k.startsWith("on") && typeof props[k] === "function")
          n.addEventListener(k.slice(2).toLowerCase(), props[k]);
        else if (k === "style" && typeof props[k] === "object") Object.assign(n.style, props[k]);
        else n.setAttribute(k, props[k]);
      }
      (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
        if (c == null) return;
        n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
      return n;
    },
    shuffle(a) {
      a = a.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pick(a) { return a[Math.floor(Math.random() * a.length)]; },
    sample(a, n) { return H.shuffle(a).slice(0, n); },
  });

  /* ---------- som (WebAudio, disparado por gesto) ---------- */
  let actx = null;
  function tone(freq, dur = 0.12, type = "sine", vol = 0.15) {
    if (SINAPSE.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime;
      o.start(t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur);
    } catch (e) {}
  }
  const sfx = (SINAPSE.sfx = {
    click() { tone(440, 0.06, "triangle", 0.1); },
    good() { tone(660, 0.09, "sine", 0.16); setTimeout(() => tone(880, 0.12, "sine", 0.16), 80); },
    bad() { tone(200, 0.18, "sawtooth", 0.12); },
    tick() { tone(520, 0.05, "square", 0.06); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, "sine", 0.18), i * 110)); },
  });

  /* ---------- registro ---------- */
  SINAPSE.register = function (def) {
    SINAPSE.games[def.id] = def;
    if (!SINAPSE.order.includes(def.id)) SINAPSE.order.push(def.id);
  };
  SINAPSE.list = function () { return SINAPSE.order.map((id) => SINAPSE.games[id]); };

  /* ---------- player overlay ---------- */
  let current = null;

  SINAPSE.open = function (id, age) {
    const def = SINAPSE.games[id];
    if (!def) return;
    const root = document.getElementById("player-root");
    const stage = H.el("div", { class: "game-stage" });
    const statsBox = H.el("div", { class: "player-stats" });

    const back = H.el("div", { class: "player-back" }, [
      H.el("div", { class: "player-top" }, [
        H.el("div", { class: "wrap nav-in" }, [
          H.el("div", { class: "player-title" }, [
            H.el("div", { class: "gg", style: { background: (def.color || "#1f74e0") + "22", color: def.color || "#1f74e0" }, text: def.emoji }),
            H.el("span", { text: def.title }),
          ]),
          H.el("div", { style: { display: "flex", alignItems: "center", gap: "16px" } }, [
            statsBox,
            H.el("button", { class: "btn btn-ghost btn-sm", text: "✕ Sair", onclick: () => SINAPSE.close() }),
          ]),
        ]),
      ]),
      stage,
    ]);
    root.innerHTML = "";
    root.appendChild(back);
    document.body.style.overflow = "hidden";

    const api = {
      age,
      color: def.color || "#1f74e0",
      sfx,
      h: H,
      setStats(obj) {
        statsBox.innerHTML = "";
        for (const label in obj) {
          statsBox.appendChild(
            H.el("div", { class: "stat" }, [
              H.el("div", { class: "v", text: String(obj[label]) }),
              H.el("div", { class: "l", text: label }),
            ])
          );
        }
      },
      clearStats() { statsBox.innerHTML = ""; },
      restart() { stage.innerHTML = ""; def.start(stage, api); },
      exit() { SINAPSE.close(); },
      // tela de instruções antes de começar
      intro(big, title, text, onStart) {
        stage.innerHTML = "";
        stage.appendChild(
          H.el("div", { class: "g-panel g-intro" }, [
            H.el("div", { class: "big", text: big }),
            H.el("h2", { text: title }),
            H.el("p", { text: text }),
            H.el("button", {
              class: "btn btn-primary", text: "Começar ▶",
              onclick: () => { sfx.click(); onStart(); },
            }),
          ])
        );
        if (SINAPSE.autostart) setTimeout(onStart, 60);
      },
      finish(res) {
        // res: { score, max, note }
        const pct = res.max ? res.score / res.max : 0;
        let medal = "🌟", title = "Muito bem!";
        if (pct >= 0.9) { medal = "🏆"; title = "Incrível!"; }
        else if (pct >= 0.7) { medal = "🥇"; title = "Excelente!"; }
        else if (pct >= 0.4) { medal = "🥈"; title = "Bom trabalho!"; }
        else { medal = "🌱"; title = "Continue treinando!"; }
        sfx.win();
        stage.innerHTML = "";
        stage.appendChild(
          H.el("div", { class: "g-panel g-result" }, [
            H.el("div", { class: "medal", text: medal }),
            H.el("h2", { text: title }),
            H.el("div", { class: "score", text: res.scoreText || `${res.score}${res.max ? " / " + res.max : ""} pontos` }),
            res.note ? H.el("p", { text: res.note }) : null,
            H.el("div", { class: "g-toolbar" }, [
              H.el("button", { class: "btn btn-primary", text: "↻ Jogar de novo", onclick: () => api.restart() }),
              H.el("button", { class: "btn btn-ghost", text: "Voltar aos jogos", onclick: () => SINAPSE.close() }),
            ]),
          ])
        );
      },
    };

    current = { api, def };
    def.start(stage, api);
    document.addEventListener("keydown", escHandler);
  };

  function escHandler(e) { if (e.key === "Escape") SINAPSE.close(); }

  SINAPSE.close = function () {
    const root = document.getElementById("player-root");
    root.innerHTML = "";
    document.body.style.overflow = "";
    document.removeEventListener("keydown", escHandler);
    current = null;
  };
})();
