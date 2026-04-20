/* =====================================================
   ZOHO — Three.js scene
   A full-screen fixed canvas hosting 6 bottle groups
   arranged across scroll positions. GSAP drives camera.
   ===================================================== */
(function () {
  const THREE = window.THREE;
  if (!THREE) { console.error("THREE missing"); return; }

  const canvas = document.getElementById("webgl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0806, 0.035);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // --- Lights
  const ambient = new THREE.AmbientLight(0x3a2e20, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfce0b0, 2.2);
  keyLight.position.set(4, 6, 3);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd4a574, 1.8);
  rimLight.position.set(-5, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xffe3b8, 1.2, 12);
  fillLight.position.set(0, -2, 4);
  scene.add(fillLight);

  // amber accent light that can move
  const spot = new THREE.PointLight(0xe8b77f, 2.0, 10);
  spot.position.set(2, 3, 2);
  scene.add(spot);

  // --- Procedural environment for reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0a0806);
  // simple gradient-like env by adding colored planes
  [
    { c: 0xd4a574, p: [0, 3, 0], s: [10, 1, 10] },
    { c: 0x2a1e14, p: [0, -3, 0], s: [10, 1, 10] },
    { c: 0x55402a, p: [5, 0, 0], s: [1, 10, 10] },
    { c: 0x1a120a, p: [-5, 0, 0], s: [1, 10, 10] },
  ].forEach(({ c, p, s }) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...s),
      new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide })
    );
    m.position.set(...p);
    envScene.add(m);
  });
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;

  // --- Bottle factory (procedural)
  function buildBottleProfile() {
    // Lathe profile for a serum/apothecary bottle
    const pts = [];
    // bottom
    pts.push(new THREE.Vector2(0.0, 0));
    pts.push(new THREE.Vector2(0.62, 0.0));
    pts.push(new THREE.Vector2(0.7, 0.05));
    // body rise
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = 0.05 + t * 1.65;
      // slight inward bell shape
      const bell = 0.7 - Math.pow(t * 2 - 0.9, 2) * 0.04;
      pts.push(new THREE.Vector2(bell, y));
    }
    // shoulder
    pts.push(new THREE.Vector2(0.68, 1.75));
    pts.push(new THREE.Vector2(0.55, 1.9));
    pts.push(new THREE.Vector2(0.38, 2.05));
    // neck
    pts.push(new THREE.Vector2(0.3, 2.18));
    pts.push(new THREE.Vector2(0.3, 2.42));
    // lip
    pts.push(new THREE.Vector2(0.34, 2.48));
    pts.push(new THREE.Vector2(0.34, 2.5));
    return pts;
  }

  const bottleProfile = buildBottleProfile();

  function makeBottle(tint = 0xd4a574) {
    const g = new THREE.Group();

    // Glass
    const glassGeom = new THREE.LatheGeometry(bottleProfile, 64);
    glassGeom.computeVertexNormals();
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tint),
      roughness: 0.08,
      metalness: 0,
      transmission: 0.95,
      thickness: 0.8,
      ior: 1.48,
      attenuationColor: new THREE.Color(tint).multiplyScalar(0.7),
      attenuationDistance: 1.2,
      envMapIntensity: 1.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const glass = new THREE.Mesh(glassGeom, glassMat);
    g.add(glass);

    // Liquid (slightly smaller lathe, fills ~80%)
    const liquidPts = [];
    liquidPts.push(new THREE.Vector2(0.0, 0.06));
    liquidPts.push(new THREE.Vector2(0.58, 0.06));
    liquidPts.push(new THREE.Vector2(0.65, 0.1));
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const y = 0.1 + t * 1.4;
      liquidPts.push(new THREE.Vector2(0.65 - t * 0.02, y));
    }
    liquidPts.push(new THREE.Vector2(0.63, 1.5));
    liquidPts.push(new THREE.Vector2(0.0, 1.5)); // flat top
    const liquidGeom = new THREE.LatheGeometry(liquidPts, 48);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tint).multiplyScalar(0.9),
      roughness: 0.2,
      metalness: 0,
      transmission: 0.6,
      thickness: 1.2,
      ior: 1.36,
      attenuationColor: new THREE.Color(tint).multiplyScalar(0.4),
      attenuationDistance: 0.6,
    });
    const liquid = new THREE.Mesh(liquidGeom, liquidMat);
    g.add(liquid);

    // Cap (dropper style)
    const capGroup = new THREE.Group();
    const capMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a140e,
      roughness: 0.35,
      metalness: 0.9,
      clearcoat: 0.4,
    });
    const capBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 48), capMat);
    capBase.position.y = 2.62;
    capGroup.add(capBase);

    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 48), capMat);
    capTop.position.y = 2.82;
    capGroup.add(capTop);

    // ornamental ring
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8b77f, roughness: 0.25, metalness: 1.0, clearcoat: 1,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 16, 64), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.73;
    capGroup.add(ring);

    g.add(capGroup);

    // Label (subtle ring around the body)
    const labelGeom = new THREE.CylinderGeometry(0.71, 0.71, 0.5, 48, 1, true);
    const labelMat = new THREE.MeshStandardMaterial({
      color: 0xf4ecd8,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.04,
    });
    const label = new THREE.Mesh(labelGeom, labelMat);
    label.position.y = 1.0;
    g.add(label);

    // text on label (canvas texture)
    const lc = document.createElement("canvas");
    lc.width = 1024; lc.height = 256;
    const lctx = lc.getContext("2d");
    lctx.fillStyle = "rgba(0,0,0,0)";
    lctx.fillRect(0, 0, lc.width, lc.height);
    lctx.fillStyle = "#f4ecd8";
    lctx.font = "italic 300 64px 'Cormorant Garamond', serif";
    lctx.textAlign = "center";
    lctx.textBaseline = "middle";
    lctx.fillText("Zoho", lc.width / 2, 80);
    lctx.fillStyle = "#d4a574";
    lctx.font = "400 14px 'JetBrains Mono', monospace";
    lctx.fillText("N° 01  ·  SERUM  ·  30 ML", lc.width / 2, 150);
    lctx.strokeStyle = "#d4a574";
    lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(lc.width / 2 - 80, 180);
    lctx.lineTo(lc.width / 2 + 80, 180);
    lctx.stroke();
    lctx.fillStyle = "#b8ad97";
    lctx.font = "300 18px 'Cormorant Garamond', serif";
    lctx.fillText("elixir du temps", lc.width / 2, 210);
    const tex = new THREE.CanvasTexture(lc);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = 1;
    tex.offset.x = 0;
    const textLabelGeom = new THREE.CylinderGeometry(0.712, 0.712, 0.35, 48, 1, true);
    const textLabelMat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
    });
    const textLabel = new THREE.Mesh(textLabelGeom, textLabelMat);
    textLabel.position.y = 1.0;
    g.add(textLabel);

    // center the bottle (its pivot lives near the base). shift down so center is roughly at 0
    g.children.forEach(c => c.position.y -= 1.3);

    g.userData = { glass, liquid, label: textLabel, capGroup, cap: capBase, capTop, ring };
    return g;
  }

  // --- Create 6 bottles, arranged as scenes across scroll
  // Each bottle is at its own world position. Camera flies between.
  const tints = [0xd4a574, 0x8b6f47, 0x3b5c4a, 0x6b2828, 0x2a2f3d, 0xb09060];
  const bottles = [];
  const bottlePositions = [
    { x: 0, y: 0, z: 0 },      // hero
    { x: 10, y: 1, z: -2 },    // intro (seen from side, drifts by)
    { x: 22, y: 0, z: 0 },     // features (horizontal scrub area)
    { x: 34, y: -1, z: 2 },    // ingredient bg
    { x: 48, y: 0.5, z: 0 },   // story parallax
    { x: 62, y: 0, z: 0 },     // rotation / specs
  ];
  bottlePositions.forEach((p, i) => {
    const b = makeBottle(tints[i]);
    b.position.set(p.x, p.y, p.z);
    b.scale.setScalar(1.0);
    scene.add(b);
    bottles.push(b);
  });

  // Small accompanying "fragment" objects for parallax depth
  const fragments = [];
  for (let i = 0; i < 24; i++) {
    const g = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.08 + Math.random() * 0.14, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xd4a574,
        roughness: 0.2,
        metalness: 0.3,
        transmission: 0.8,
        thickness: 0.5,
        ior: 1.4,
        attenuationColor: 0x8b6f47,
        attenuationDistance: 0.5,
      })
    );
    g.position.set(
      -6 + Math.random() * 74,
      -4 + Math.random() * 8,
      -4 + Math.random() * 3
    );
    g.userData.seed = Math.random() * Math.PI * 2;
    g.userData.driftSpeed = 0.1 + Math.random() * 0.3;
    g.userData.baseY = g.position.y;
    scene.add(g);
    fragments.push(g);
  }

  // Dust / particles
  const dustCount = 400;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = -10 + Math.random() * 80;
    dustPos[i * 3 + 1] = -4 + Math.random() * 8;
    dustPos[i * 3 + 2] = -4 + Math.random() * 6;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd4a574, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // --- State shared with GSAP (on window.__scene)
  const state = {
    cameraTarget: new THREE.Vector3(0, 0, 0),
    cameraLook: new THREE.Vector3(0, 0, 0),
    camIntensity: 1.0,
    fogDensity: 0.035,
    dustOpacity: 0.5,
    mouse: { x: 0, y: 0 },
  };

  window.addEventListener("mousemove", (e) => {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Resize
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Animate
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3(0, 0, 6);
  const camLook = new THREE.Vector3(0, 0, 0);
  function tick() {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, clock.getDelta());

    // smooth camera follow toward target, scaled by intensity
    const lerpAmt = 0.06 * state.camIntensity;
    camPos.lerp(state.cameraTarget, Math.min(0.2, lerpAmt + 0.04));
    camLook.lerp(state.cameraLook, Math.min(0.2, lerpAmt + 0.04));
    // subtle mouse parallax
    const mx = state.mouse.x * 0.6 * state.camIntensity;
    const my = -state.mouse.y * 0.4 * state.camIntensity;
    camera.position.set(camPos.x + mx, camPos.y + my, camPos.z);
    camera.lookAt(camLook);

    // bottles: breathing rotation
    bottles.forEach((b, i) => {
      b.rotation.y += 0.0025 * (i % 2 === 0 ? 1 : -1);
      b.position.y += Math.sin(t * 0.6 + i) * 0.0008;
    });

    // fragments drift
    fragments.forEach((f) => {
      f.rotation.x += 0.003;
      f.rotation.y += 0.005;
      f.position.y = f.userData.baseY + Math.sin(t * f.userData.driftSpeed + f.userData.seed) * 0.3;
    });

    // dust drift
    const p = dust.geometry.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
      p[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0003;
    }
    dust.geometry.attributes.position.needsUpdate = true;

    // spot light drift
    spot.position.x = 2 + Math.sin(t * 0.4) * 2;
    spot.position.y = 3 + Math.cos(t * 0.3) * 1;

    // fog + dust params
    scene.fog.density = state.fogDensity;
    dustMat.opacity = state.dustOpacity;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Expose for scroll controller
  window.__scene = {
    scene, camera, renderer, bottles, fragments, dust, spot,
    state, bottlePositions,
    setBottleTint(hex) {
      const c = new THREE.Color(hex);
      bottles.forEach((b) => {
        b.userData.glass.material.color.copy(c);
        b.userData.glass.material.attenuationColor.copy(c).multiplyScalar(0.7);
        b.userData.liquid.material.color.copy(c).multiplyScalar(0.9);
        b.userData.liquid.material.attenuationColor.copy(c).multiplyScalar(0.4);
      });
      fragments.forEach((f) => {
        f.material.color.copy(c);
      });
    },
    setBgColor(hex) {
      document.documentElement.style.setProperty("--bg", hex);
      scene.fog.color = new THREE.Color(hex);
    },
    setCamIntensity(v) { state.camIntensity = v; },
    setFogDensity(v) { state.fogDensity = v; },
    setDustOpacity(v) { state.dustOpacity = v; },
    jumpToBottle(idx) {
      // helper for "Scene swap"
      const b = bottlePositions[idx];
      if (!b) return;
      state.cameraTarget.set(b.x, b.y + 0.2, b.z + 4.8);
      state.cameraLook.set(b.x, b.y, b.z);
    },
  };

  // announce ready
  window.dispatchEvent(new CustomEvent("scene-ready"));
})();
