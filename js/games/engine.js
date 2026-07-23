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

  /* ---------- progresso (mapa de fases + estrelas) ---------- */
  const PKEY = "sinapse_progress";
  function loadProgress() { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } }
  function saveProgress(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  function gameStars(id) { return loadProgress()[id] || {}; } // { phaseIndex: stars }
  function bestStars(id, idx) { return gameStars(id)[idx] || 0; }
  function recordStars(id, idx, stars) {
    const p = loadProgress();
    p[id] = p[id] || {};
    if (stars > (p[id][idx] || 0)) { p[id][idx] = stars; saveProgress(p); }
  }
  function phaseUnlocked(id, idx) { return idx === 0 || bestStars(id, idx - 1) >= 1; }
  SINAPSE.progress = { load: loadProgress, best: bestStars };

  function starsFromPct(pct) { return pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : pct >= 0.3 ? 1 : 0; }
  function starRow(n, cls) {
    return H.el("div", { class: "phase-stars" + (cls ? " " + cls : "") },
      [0, 1, 2].map((i) => H.el("span", { class: "st" + (i < n ? " on" : " off"), text: "★" })));
  }

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
          H.el("div", { class: "player-actions", style: { display: "flex", alignItems: "center", gap: "16px" } }, [
            statsBox,
            H.el("button", { class: "btn btn-ghost btn-sm player-exit", text: "✕ Sair", onclick: () => SINAPSE.close() }),
          ]),
        ]),
      ]),
      stage,
    ]);
    root.innerHTML = "";
    root.appendChild(back);
    document.body.style.overflow = "hidden";

    const hasPhases = Array.isArray(def.phases) && def.phases.length > 0;

    const api = {
      age,
      color: def.color || "#1f74e0",
      sfx,
      h: H,
      // fase atual (default retrocompatível pros jogos sem `phases`)
      phaseIndex: 0,
      phase: hasPhases ? def.phases[0] : { nome: "", params: {} },
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
      // navegação de fases
      startPhase(idx) {
        if (!hasPhases) return def.start(stage, api);
        api.phaseIndex = idx;
        api.phase = def.phases[idx];
        api.clearStats();
        stage.innerHTML = "";
        def.start(stage, api);
      },
      repeatPhase() { api.startPhase(api.phaseIndex); },
      showMap() { renderMap(); },

      finish(res) {
        // res: { score, max, note, scoreText, stars? }
        const pct = res.max ? res.score / res.max : 0;

        if (!hasPhases) {
          // ---- modo clássico (jogos ainda sem fases) ----
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
          return;
        }

        // ---- modo mapa de fases ----
        const idx = api.phaseIndex;
        const stars = Math.max(0, Math.min(3, res.stars != null ? res.stars : starsFromPct(pct)));
        const prevBest = bestStars(def.id, idx);
        const nextExists = !!def.phases[idx + 1];
        const willUnlockNext = stars >= 1 && nextExists && prevBest < 1;
        if (stars >= 1) recordStars(def.id, idx, stars);

        let title = "Quase lá!";
        if (stars >= 3) title = "Perfeito! 🏆";
        else if (stars === 2) title = "Muito bem! 🌟";
        else if (stars === 1) title = "Você passou! 🎉";
        if (stars >= 1) sfx.win(); else sfx.bad();

        const buttons = [];
        if (stars >= 1 && nextExists) {
          buttons.push(H.el("button", { class: "btn btn-primary", text: "Próxima fase ▶", onclick: () => api.startPhase(idx + 1) }));
          buttons.push(H.el("button", { class: "btn btn-ghost", text: "↻ Repetir fase", onclick: () => api.repeatPhase() }));
        } else {
          buttons.push(H.el("button", { class: "btn btn-primary", text: "↻ Repetir fase", onclick: () => api.repeatPhase() }));
        }
        buttons.push(H.el("button", { class: "btn btn-ghost", text: "🗺️ Mapa de fases", onclick: () => renderMap() }));

        stage.innerHTML = "";
        stage.appendChild(
          H.el("div", { class: "g-panel g-result" }, [
            H.el("div", { class: "result-phase", text: `${def.emoji} ${def.title} · ${api.phase.nome || "Fase " + (idx + 1)}` }),
            starRow(stars, "phase-stars-big"),
            H.el("h2", { text: title }),
            H.el("div", { class: "score", text: res.scoreText || `${res.score}${res.max ? " / " + res.max : ""} pontos` }),
            res.note ? H.el("p", { text: res.note }) : null,
            willUnlockNext ? H.el("div", { class: "unlock-banner", text: `🔓 Nova fase liberada: ${def.phases[idx + 1].nome}!` }) : null,
            H.el("div", { class: "g-toolbar" }, buttons),
          ])
        );
      },
    };

    /* ---------- mapa de fases + como jogar ---------- */
    function renderMap() {
      api.clearStats();
      stage.innerHTML = "";
      const help = def.help;

      const helpCard = H.el("div", { class: "phase-help hidden" }, [
        H.el("div", { class: "phase-help-title", text: "❓ Como jogar" }),
        H.el("ol", {}, (help && help.como ? help.como : ["Toque numa fase pra começar."]).map((step, i) =>
          H.el("li", {}, [H.el("span", { class: "s", text: String(i + 1) }), H.el("span", { text: step })]))),
        help && help.dica ? H.el("div", { class: "dica", html: `💡 <b>Dica:</b> ${escapeText(help.dica)}` }) : null,
      ]);

      const helpBtn = H.el("button", {
        class: "btn btn-ghost btn-sm", "aria-expanded": "false",
        text: "❓ Como jogar",
        onclick: () => {
          const open = helpCard.classList.toggle("hidden") === false;
          helpBtn.setAttribute("aria-expanded", open ? "true" : "false");
          sfx.click();
        },
      });

      const trail = H.el("div", { class: "phase-trail" });
      def.phases.forEach((ph, i) => {
        const unlocked = phaseUnlocked(def.id, i);
        const stars = bestStars(def.id, i);
        const dot = H.el("button", {
          class: "phase-dot", disabled: unlocked ? null : "disabled",
          "aria-label": unlocked ? `Fase ${i + 1}: ${ph.nome}` : `Fase ${i + 1} bloqueada — conclua a anterior`,
          title: unlocked ? "" : "Conclua a fase anterior para liberar",
          html: unlocked ? String(i + 1) : "🔒",
          onclick: unlocked ? () => { sfx.click(); api.startPhase(i); } : null,
        });
        const step = H.el("div", { class: "phase-step" + (unlocked ? "" : " locked") + (stars ? " done" : "") }, [
          dot,
          H.el("div", { class: "phase-name", text: ph.nome || `Fase ${i + 1}` }),
          starRow(stars),
        ]);
        trail.appendChild(step);
      });

      stage.appendChild(H.el("div", { class: "g-panel phase-map" }, [
        H.el("div", { class: "phase-map-head" }, [
          H.el("h2", { text: "Mapa de fases" }),
          helpBtn,
        ]),
        helpCard,
        H.el("div", { class: "phase-map-sub", text: "Passe de uma fase para liberar a próxima. Ganhe até ★★★!" }),
        trail,
      ]));
    }
    function escapeText(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

    current = { api, def };
    if (hasPhases && !SINAPSE.autostart) {
      renderMap();
    } else if (hasPhases && SINAPSE.autostart) {
      api.startPhase(0);
    } else {
      def.start(stage, api);
    }
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
