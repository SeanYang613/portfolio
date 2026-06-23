// ─── Procedural warm walnut desk texture ─────────────────────
function createDeskTexture(size = 1024) {
  const c   = document.createElement('canvas');
  c.width   = c.height = size;
  const ctx = c.getContext('2d');

  // ── Base: flat dark walnut — colour variation from grain only ─
  ctx.fillStyle = '#3A1C0B';
  ctx.fillRect(0, 0, size, size);

  // ── Dark grain bands (annual rings) ──────────────────────
  ctx.lineCap = 'round';
  for (let i = 0; i < 160; i++) {
    // Distribute with natural clustering (rings aren't perfectly even)
    const yBase = (i / 160) * size + (Math.random() - 0.5) * (size / 80);
    const isDense = Math.random() < 0.35;
    const opa     = isDense
      ? Math.random() * 0.55 + 0.25
      : Math.random() * 0.32 + 0.08;

    ctx.beginPath();
    ctx.moveTo(-10, yBase);
    let y = yBase;
    for (let x = -10; x <= size + 10; x += 4) {
      // Gentle long-wave + fine turbulence
      y += Math.sin(x / 180 + i * 0.7) * 0.4 + (Math.random() - 0.5) * 1.2;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isDense
      ? `rgba(28,12,3,${opa})`
      : `rgba(42,20,6,${opa})`;
    ctx.lineWidth = isDense
      ? Math.random() * 2.2 + 0.8
      : Math.random() * 1.2 + 0.2;
    ctx.stroke();
  }

  // ── Light reflective grain (polished surface highlight) ──
  for (let i = 0; i < 50; i++) {
    const yBase = Math.random() * size;
    const opa   = Math.random() * 0.1 + 0.02;
    ctx.beginPath();
    ctx.moveTo(-10, yBase);
    let y = yBase;
    for (let x = -10; x <= size + 10; x += 5) {
      y += Math.sin(x / 220 + i) * 0.3 + (Math.random() - 0.5) * 0.8;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(200,148,80,${opa})`;
    ctx.lineWidth   = Math.random() * 0.8 + 0.2;
    ctx.stroke();
  }

  // ── Wood knots (1–2 per tile) ────────────────────────────
  const knotCount = Math.floor(Math.random() * 2) + 1;
  for (let k = 0; k < knotCount; k++) {
    const kx = size * (0.15 + Math.random() * 0.7);
    const ky = size * (0.2  + Math.random() * 0.6);
    const kr = Math.random() * 28 + 16;

    // Concentric ellipses warping existing grain around the knot
    for (let r = kr; r > 2; r -= 2.5) {
      const t   = 1 - r / kr;
      const opa = t * 0.28 + 0.04;
      ctx.beginPath();
      ctx.ellipse(kx, ky, r * 1.4, r * 0.75,
        Math.PI * 0.08, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(22,9,2,${opa})`;
      ctx.lineWidth   = 1.4;
      ctx.stroke();
    }

    // Dark knot centre
    const cg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 0.55);
    cg.addColorStop(0, 'rgba(15,5,1,0.72)');
    cg.addColorStop(1, 'rgba(15,5,1,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr * 0.55, kr * 0.32, Math.PI * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Fine cross-grain fibre ───────────────────────────────
  for (let i = 0; i < 35; i++) {
    const x   = Math.random() * size;
    const opa = Math.random() * 0.035 + 0.008;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    let xc = x;
    for (let y = -10; y <= size + 10; y += 8) {
      xc += (Math.random() - 0.5) * 1.2;
      ctx.lineTo(xc, y);
    }
    ctx.strokeStyle = `rgba(35,16,4,${opa})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  // ── Subtle depth vignette (desk edges are slightly darker) ─
  const vg = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.2,
    size / 2, size / 2, size * 0.85
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, size, size);

  return c;
}

// ─── Renderer ────────────────────────────────────────────────
const bgCanvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace    = THREE.SRGBColorSpace;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

// ─── Scene ───────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera (orthographic, straight down) ────────────────────
const FRUSTUM = 10;
let aspect    = window.innerWidth / window.innerHeight;

const camera = new THREE.OrthographicCamera(
  -FRUSTUM * aspect / 2,
   FRUSTUM * aspect / 2,
   FRUSTUM / 2,
  -FRUSTUM / 2,
  0.1, 100
);
camera.position.set(0, 10, 0);
camera.up.set(0, 0, -1);
camera.lookAt(0, 0, 0);

// ─── Desk surface ────────────────────────────────────────────
const tex  = new THREE.CanvasTexture(createDeskTexture(1024));
tex.wrapS  = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(1.5, 1.5);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0 })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// ─── Lighting ────────────────────────────────────────────────
// Soft ambient fill
scene.add(new THREE.AmbientLight(0xFFF8EC, 0.4));

// Main desk lamp — warmer orange for walnut
const lamp = new THREE.PointLight(0xFFE8C0, 7, 24);
lamp.position.set(0.5, 7, -1);
scene.add(lamp);

// Secondary fill — from the side
const fill = new THREE.PointLight(0xF5EEE0, 2, 20);
fill.position.set(-4, 5, 3);
scene.add(fill);

// ─── Render loop ─────────────────────────────────────────────
let t = 0;
(function tick() {
  requestAnimationFrame(tick);
  t += 0.008;
  // Imperceptible lamp sway adds life without distraction
  lamp.position.x = 0.5 + Math.sin(t * 0.4) * 0.4;
  lamp.position.z = -1  + Math.cos(t * 0.3) * 0.25;
  renderer.render(scene, camera);
}());

// ─── Resize ──────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  aspect           = w / h;
  camera.left      = -FRUSTUM * aspect / 2;
  camera.right     =  FRUSTUM * aspect / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
