/* =====================================================
   ZOHO — Tweaks panel
   Hidden by default; toggled by host ("Tweaks" button)
   ===================================================== */
(function () {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "bottleTint": "#d4a574",
    "bgColor": "#0a0806",
    "camIntensity": 1.0,
    "fontMode": "serif",
    "sceneIndex": 0,
    "fogDensity": 0.035
  }/*EDITMODE-END*/;

  const state = { ...TWEAK_DEFAULTS };
  const panel = document.getElementById("tweaks");

  // Listen for host toggle BEFORE announcing
  window.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "__activate_edit_mode") panel.classList.add("on");
    if (d.type === "__deactivate_edit_mode") panel.classList.remove("on");
  });
  // Announce availability
  window.parent.postMessage({ type: "__edit_mode_available" }, "*");

  function persist(patch) {
    Object.assign(state, patch);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
  }

  function apply() {
    const S = window.__scene;
    if (!S) return;
    S.setBottleTint(state.bottleTint);
    S.setBgColor(state.bgColor);
    S.setCamIntensity(state.camIntensity);
    S.setFogDensity(state.fogDensity);
    // font mode
    const root = document.documentElement;
    if (state.fontMode === "mono") {
      root.style.setProperty("--serif", "'JetBrains Mono', monospace");
    } else if (state.fontMode === "sans") {
      root.style.setProperty("--serif", "'Inter', 'Helvetica Neue', Arial, sans-serif");
    } else {
      root.style.setProperty("--serif", "'Cormorant Garamond', 'EB Garamond', Georgia, serif");
    }
    // scene
    S.jumpToBottle(state.sceneIndex);
  }

  // Build UI
  const tints = ["#d4a574", "#8b6f47", "#3b5c4a", "#6b2828", "#2a2f3d", "#b09060"];
  const bgs = ["#0a0806", "#121013", "#0c1512", "#1a1008", "#0a0a0a", "#f4ecd8"];

  panel.innerHTML = `
    <div class="t-head"><span>Tweaks</span><em style="font-style:normal;color:var(--ink-mute)">ZOHO v1</em></div>
    <div class="t-row">
      <label>Bottle tint</label>
      <div class="swatches" id="tw-tint">
        ${tints.map(c => `<div class="sw" data-c="${c}" style="background:${c}"></div>`).join("")}
      </div>
    </div>
    <div class="t-row">
      <label>Background</label>
      <div class="swatches" id="tw-bg">
        ${bgs.map(c => `<div class="sw" data-c="${c}" style="background:${c}"></div>`).join("")}
      </div>
    </div>
    <div class="t-row">
      <label>Camera intensity <span class="value" id="tw-cam-v"></span></label>
      <input type="range" id="tw-cam" min="0" max="2.5" step="0.05">
    </div>
    <div class="t-row">
      <label>Fog / haze <span class="value" id="tw-fog-v"></span></label>
      <input type="range" id="tw-fog" min="0" max="0.12" step="0.002">
    </div>
    <div class="t-row">
      <label>Typography</label>
      <div class="seg" id="tw-font">
        <button data-v="serif">Serif</button>
        <button data-v="sans">Sans</button>
        <button data-v="mono">Mono</button>
      </div>
    </div>
    <div class="t-row">
      <label>Scene swap</label>
      <select id="tw-scene">
        <option value="0">01 — Hero portrait</option>
        <option value="1">02 — Side drift</option>
        <option value="2">03 — Feature spin</option>
        <option value="3">03 — Ingredient ambient</option>
        <option value="4">05 — Story composition</option>
        <option value="5">06 — Anatomy rotation</option>
      </select>
    </div>
  `;

  // bind
  panel.querySelectorAll("#tw-tint .sw").forEach(el => {
    el.addEventListener("click", () => {
      const c = el.dataset.c;
      persist({ bottleTint: c });
      apply();
      panel.querySelectorAll("#tw-tint .sw").forEach(s => s.classList.toggle("active", s.dataset.c === c));
    });
  });
  panel.querySelectorAll("#tw-bg .sw").forEach(el => {
    el.addEventListener("click", () => {
      const c = el.dataset.c;
      persist({ bgColor: c });
      apply();
      panel.querySelectorAll("#tw-bg .sw").forEach(s => s.classList.toggle("active", s.dataset.c === c));
    });
  });
  const camR = panel.querySelector("#tw-cam");
  const camV = panel.querySelector("#tw-cam-v");
  camR.value = state.camIntensity;
  camV.textContent = state.camIntensity.toFixed(2);
  camR.addEventListener("input", () => {
    const v = parseFloat(camR.value);
    camV.textContent = v.toFixed(2);
    persist({ camIntensity: v });
    apply();
  });
  const fogR = panel.querySelector("#tw-fog");
  const fogV = panel.querySelector("#tw-fog-v");
  fogR.value = state.fogDensity;
  fogV.textContent = state.fogDensity.toFixed(3);
  fogR.addEventListener("input", () => {
    const v = parseFloat(fogR.value);
    fogV.textContent = v.toFixed(3);
    persist({ fogDensity: v });
    apply();
  });
  panel.querySelectorAll("#tw-font button").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.v;
      persist({ fontMode: v });
      apply();
      panel.querySelectorAll("#tw-font button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
    });
    if (btn.dataset.v === state.fontMode) btn.classList.add("on");
  });
  const sceneSel = panel.querySelector("#tw-scene");
  sceneSel.value = String(state.sceneIndex);
  sceneSel.addEventListener("change", () => {
    const v = parseInt(sceneSel.value, 10);
    persist({ sceneIndex: v });
    apply();
  });

  // Mark default active swatches
  panel.querySelectorAll("#tw-tint .sw").forEach(s => s.classList.toggle("active", s.dataset.c === state.bottleTint));
  panel.querySelectorAll("#tw-bg .sw").forEach(s => s.classList.toggle("active", s.dataset.c === state.bgColor));

  // Initial apply
  if (window.__scene) apply();
  else window.addEventListener("scene-ready", apply);
})();
