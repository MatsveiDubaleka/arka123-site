/* АРКА 123 — 3D-модель зала (three.js). Размеры: 13,6 × 9,0 м ≈ 123 м², потолок 4,5 м,
   два арочных окна 4 × 3,5 м на длинной стене, одно на торцевой, графитовые колонны, вход со стеклянной перегородкой. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const view = document.getElementById('roomView');
const fallback = document.getElementById('roomFallback');
const sayEl = document.getElementById('roomSay');

const L = 13.6, D = 9.0, H = 4.5;            // x — длина, z — глубина
const X0 = -L / 2, X1 = L / 2, Z0 = -D / 2, Z1 = D / 2;
const WIN_W = 4, WIN_H = 3.5, SILL = 0.75, R = WIN_W / 2, SPRING = SILL + WIN_H - R;

let started = false;
const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !started) { started = true; io.disconnect(); try { init(); } catch (err) { console.warn('3D недоступно', err); } } }, { rootMargin: '300px' });
io.observe(view);

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  if (!renderer.getContext()) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  view.prepend(renderer.domElement);
  fallback.remove();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0F1820');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxDistance = 30; controls.minDistance = 1;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 1.2, 0);
  camera.position.set(11, 10.5, 13);

  /* ── Свет ── */
  scene.add(new THREE.HemisphereLight('#F7EFE3', '#5C4A3A', 0.9));
  const sun = new THREE.DirectionalLight('#FFE6C2', 2.2);
  sun.position.set(4, 9, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.PointLight('#FFFFFF', 18, 18, 1.6); fill.position.set(0, 4.2, 0.5); scene.add(fill);

  /* ── Материалы ── */
  const M = {
    plaster: new THREE.MeshStandardMaterial({ color: '#EFE6D8', roughness: 0.95 }),
    graphite: new THREE.MeshStandardMaterial({ color: '#3B4148', roughness: 0.7 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#30353A', roughness: 0.9, side: THREE.DoubleSide }),
    frame: new THREE.MeshStandardMaterial({ color: '#1E2328', roughness: 0.5, metalness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#BCD3E4', transparent: true, opacity: 0.35, roughness: 0.05 }),
    frosted: new THREE.MeshStandardMaterial({ color: '#E6ECEF', transparent: true, opacity: 0.55, roughness: 0.4 }),
    white: new THREE.MeshStandardMaterial({ color: '#F4F2EE', roughness: 0.6 }),
    led: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    oak: new THREE.MeshStandardMaterial({ color: '#C79A68', roughness: 0.6 }),
    seat: new THREE.MeshStandardMaterial({ color: '#223443', roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: '#1C1F22', roughness: 0.4, metalness: 0.6 }),
    screen: new THREE.MeshBasicMaterial({ color: '#E9EEF2' }),
  };

  const SHADOW_ONLY = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

  /* ── Пол: ёлочка на canvas ── */
  const fc = document.createElement('canvas'); fc.width = fc.height = 1024;
  const g = fc.getContext('2d');
  g.fillStyle = '#C08F5E'; g.fillRect(0, 0, 1024, 1024);
  drawHerringbone(g);
  const floorTex = new THREE.CanvasTexture(fc);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(L / 2.4, D / 2.4);
  floorTex.colorSpace = THREE.SRGBColorSpace; floorTex.anisotropy = 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ── Вид из окна ── */
  const viewTex = new THREE.TextureLoader().load('img/view.webp');
  viewTex.colorSpace = THREE.SRGBColorSpace;
  const vMat = new THREE.MeshBasicMaterial({ map: viewTex, fog: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 24.2), vMat);
  back.position.set(0, 4.2, Z0 - 9); scene.add(back);
  const side = new THREE.Mesh(new THREE.PlaneGeometry(14, 21.2), vMat);
  side.position.set(X1 + 8, 3.5, -1.8); side.rotation.y = -Math.PI / 2; scene.add(side);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: '#16222D' }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -6; scene.add(ground);

  /* ── Стены с арочными проёмами ── */
  const walls = [];   // {group, normal, point} — стена скрывается, если камера снаружи (режим «кукольный домик»)
  const archPath = (cx, w = WIN_W) => {
    const p = new THREE.Path(); const r = w / 2;
    p.moveTo(cx - r, SILL); p.lineTo(cx + r, SILL); p.lineTo(cx + r, SILL + WIN_H - r);
    p.absarc(cx, SILL + WIN_H - r, r, 0, Math.PI, false); p.lineTo(cx - r, SILL); return p;
  };
  function wall(len, holes, mat, pos, rotY, normal) {
    const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, H); s.lineTo(-len / 2, H); s.lineTo(-len / 2, 0);
    holes.forEach(cx => s.holes.push(archPath(cx)));
    const grp = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 48), mat); m.receiveShadow = true; grp.add(m);
    // нижняя графитовая полоса-плинтус
    const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.02), M.graphite); base.position.set(0, 0.04, 0.01); grp.add(base);
    holes.forEach(cx => grp.add(windowFrame(cx)));
    grp.position.copy(pos); grp.rotation.y = rotY; scene.add(grp);
    // невидимый двойник стены всегда отбрасывает тень, даже когда стена скрыта в режиме «домика»
    const caster = new THREE.Mesh(m.geometry, SHADOW_ONLY); caster.castShadow = true; caster.position.copy(pos); caster.rotation.y = rotY; scene.add(caster);
    walls.push({ grp, normal, point: pos.clone() });
    return grp;
  }
  function windowFrame(cx) {
    const g = new THREE.Group();
    const t = 0.09, depth = 0.12;
    // рама по контуру арки
    const outer = new THREE.Shape(); const r = R;
    outer.moveTo(cx - r, SILL); outer.lineTo(cx + r, SILL); outer.lineTo(cx + r, SPRING); outer.absarc(cx, SPRING, r, 0, Math.PI, false); outer.lineTo(cx - r, SILL);
    const inner = new THREE.Path(); const ri = r - t;
    inner.moveTo(cx - ri, SILL + t); inner.lineTo(cx + ri, SILL + t); inner.lineTo(cx + ri, SPRING); inner.absarc(cx, SPRING, ri, 0, Math.PI, false); inner.lineTo(cx - ri, SILL + t);
    outer.holes.push(inner);
    const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 40 }), M.frame);
    fr.position.z = -depth / 2; g.add(fr);
    // импосты: горизонтальный на линии пяты арки и два вертикальных
    const hz = new THREE.Mesh(new THREE.BoxGeometry(WIN_W - 0.1, 0.07, depth), M.frame); hz.position.set(cx, SPRING, 0); g.add(hz);
    [-0.72, 0.72].forEach(dx => {
      const top = SPRING + Math.sqrt(R * R - dx * dx) - 0.05;
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.07, top - SILL, depth), M.frame); v.position.set(cx + dx, (top + SILL) / 2, 0); g.add(v);
    });
    const gl = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inner.getPoints(40)), 40), M.glass); gl.position.z = -0.02; g.add(gl);
    // подоконник и радиатор
    const sill = new THREE.Mesh(new THREE.BoxGeometry(WIN_W + 0.2, 0.05, 0.32), M.frame); sill.position.set(cx, SILL - 0.02, 0.14); g.add(sill);
    const rad = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), M.graphite); rad.position.set(cx, 0.4, 0.12); rad.castShadow = true; g.add(rad);
    return g;
  }
  // длинная стена с двумя окнами (смотрит на библиотеку)
  wall(L, [-2.6, 2.6], M.plaster, new THREE.Vector3(0, 0, Z0), 0, new THREE.Vector3(0, 0, 1));
  // торцевая стена с окном
  wall(D, [-1.8], M.plaster, new THREE.Vector3(X1, 0, 0), -Math.PI / 2, new THREE.Vector3(-1, 0, 0));
  // левая стена: часы и графитовые панели
  const lw = wall(D, [], M.plaster, new THREE.Vector3(X0, 0, 0), Math.PI / 2, new THREE.Vector3(1, 0, 0));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, H, 0.06), M.graphite); panel.position.set(3.3, H / 2, 0.03); lw.add(panel);
  const clock = new THREE.Group();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.02), M.metal); d.position.set(Math.sin(a) * 0.62, Math.cos(a) * 0.62, 0); d.rotation.z = -a; clock.add(d); }
  const hand1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.02), M.metal); hand1.position.set(0.1, 0.18, 0.01); hand1.rotation.z = -0.5; clock.add(hand1);
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.02), M.metal); hand2.position.set(-0.12, -0.05, 0.01); hand2.rotation.z = 2.1; clock.add(hand2);
  clock.position.set(-1.2, 2.6, 0.04); lw.add(clock);
  // стена у входа: белые шкафы, ресепшн и стеклянная перегородка с дверью
  const fw = new THREE.Group(); fw.position.set(0, 0, Z1); fw.rotation.y = Math.PI; scene.add(fw);
  walls.push({ grp: fw, normal: new THREE.Vector3(0, 0, -1), point: new THREE.Vector3(0, 0, Z1) });
  const solid = new THREE.Mesh(new THREE.PlaneGeometry(6.8, H), M.plaster); solid.position.set(-3.6, H / 2, 0); fw.add(solid);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.1, 0.6), M.white); cab.position.set(-4.3 + 1.2, 1.55, 0.3); cab.castShadow = true; fw.add(cab);
  for (let i = 0; i < 6; i++) { const ln = new THREE.Mesh(new THREE.BoxGeometry(0.01, 3.0, 0.01), M.graphite); ln.position.set(-5.6 + 1.2 + i * 0.78, 1.55, 0.61); fw.add(ln); }
  const fglass = new THREE.Mesh(new THREE.PlaneGeometry(7.2, H), M.frosted); fglass.position.set(3.2, H / 2, 0); fw.add(fglass);
  [-0.4, 1.4, 3.2, 5.0, 6.8].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.06), M.frame); p.position.set(x, H / 2, 0); fw.add(p); });
  const band = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.18, 0.02), M.white); band.position.set(3.2, 1.3, 0.01); fw.add(band);
  // ресепшн
  const rec = new THREE.Group();
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.6), M.graphite); r1.position.set(0, 0.55, 0); rec.add(r1);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 0.9), M.white); r2.position.set(-1.0, 0.375, 0.2); rec.add(r2);
  rec.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  rec.position.set(X0 + 2.6, 0, Z1 - 1.6); scene.add(rec);

  /* ── Колонны ── */
  [[-2.4, 1.6], [2.4, 1.6]].forEach(([x, z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.62, H, 0.62), M.graphite); c.position.set(x, H / 2, z); c.castShadow = true; c.receiveShadow = true; scene.add(c);
  });

  /* ── Потолок и 33 линейных светильника ── */
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(L, D), M.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.y = H; scene.add(ceil);
  const ceilCaster = new THREE.Mesh(new THREE.BoxGeometry(L + 1, 0.1, D + 1), SHADOW_ONLY); ceilCaster.position.y = H + 0.05; ceilCaster.castShadow = true; scene.add(ceilCaster);
  const leds = new THREE.Group(); scene.add(leds);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 33; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.06), M.led);
    const col = i % 11, row = Math.floor(i / 11);
    bar.position.set(X0 + 0.9 + col * 1.18 + (rnd() - .5) * .3, H - 0.25, Z0 + 1.6 + row * 2.9 + (rnd() - .5) * .6);
    bar.rotation.y = (rnd() - 0.5) * 1.6; leds.add(bar);
  }
  // проводка подвеса
  leds.children.forEach(b => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.25), M.metal); w.position.copy(b.position); w.position.y += 0.125; leds.add(w); });

  /* ── Мебель ── */
  const furn = new THREE.Group(); scene.add(furn);
  const chairGeo = {
    seat: new THREE.BoxGeometry(0.46, 0.06, 0.44), back: new THREE.BoxGeometry(0.46, 0.42, 0.05), leg: new THREE.CylinderGeometry(0.015, 0.015, 0.45)
  };
  function chair(x, z, rot) {
    const c = new THREE.Group();
    const s = new THREE.Mesh(chairGeo.seat, M.seat); s.position.y = 0.46; c.add(s);
    const b = new THREE.Mesh(chairGeo.back, M.seat); b.position.set(0, 0.7, -0.2); c.add(b);
    [[-.2, -.18], [.2, -.18], [-.2, .18], [.2, .18]].forEach(([lx, lz]) => { const l = new THREE.Mesh(chairGeo.leg, M.metal); l.position.set(lx, 0.225, lz); c.add(l); });
    c.position.set(x, 0, z); c.rotation.y = rot; c.userData.chair = 1; return c;
  }
  function table(x, z, w, d, rot = 0, round = false) {
    const t = new THREE.Group();
    const top = round ? new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.04, 40), M.oak) : new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), M.oak);
    top.position.y = 0.75; t.add(top);
    if (round) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.73), M.metal); l.position.y = 0.365; t.add(l); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24), M.metal); f.position.y = 0.01; t.add(f); }
    else [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.73, 0.05), M.metal); l.position.set(sx * (w / 2 - 0.08), 0.365, sz * (d / 2 - 0.08)); t.add(l); });
    t.position.set(x, 0, z); t.rotation.y = rot; return t;
  }
  function screenAndProjector(group) {
    const sc = new THREE.Group();
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.9), M.screen); s.position.set(0, 2.25, 0.05); sc.add(s);
    const f = new THREE.Mesh(new THREE.BoxGeometry(3.12, 2.02, 0.04), M.frame); f.position.set(0, 2.25, 0.02); sc.add(f);
    // «слайд» на экране
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.12), new THREE.MeshBasicMaterial({ color: '#223443' })); sl.position.set(-0.6, 2.75, 0.06); sc.add(sl);
    const sl2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ color: '#B07A47' })); sl2.position.set(0.6, 2.1, 0.06); sc.add(sl2);
    sc.position.set(X0 + 0.04, 0, -0.8); sc.rotation.y = Math.PI / 2; group.add(sc);
    const pj = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.35), M.white); pj.position.set(X0 + 6, H - 0.55, -0.8); group.add(pj);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), M.metal); rod.position.set(X0 + 6, H - 0.25, -0.8); group.add(rod);
  }
  function lectern(group, x, z) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.4), M.graphite); l.position.set(x, 0.55, z); group.add(l);
  }
  const near = (x, z) => [[-2.4, 1.6], [2.4, 1.6]].some(([cx, cz]) => Math.abs(cx - x) < 0.7 && Math.abs(cz - z) < 0.7);

  const LAYOUTS = {
    empty: { say: 'Это зал целиком: 123 м², колонны у входа и две арки на Библиотеку.', build() {} },
    lecture: {
      say: 'Лекция: {n} мест рядами, экран 3 м у стены и проектор под потолком. Вид в окна не перекрыт.',
      build(gp) {
        screenAndProjector(gp); lectern(gp, X0 + 1.1, 1.0);
        for (let r = 0; r < 7; r++) for (let s = 0; s < 9; s++) {
          const x = X0 + 2.7 + r * 1.05, z = -3.3 + s * 0.78 + (s > 4 ? 0.5 : 0);
          if (z > 3.4 || near(x, z)) continue; gp.add(chair(x, z, -Math.PI / 2));
        }
      }
    },
    table: {
      say: 'Большой стол на 22 человека прямо у окон, экран сбоку для презентаций.',
      build(gp) {
        screenAndProjector(gp);
        gp.add(table(0, -1.6, 8.4, 1.5));
        for (let i = 0; i < 10; i++) { const x = -3.6 + i * 0.8; gp.add(chair(x, -2.65, 0)); gp.add(chair(x, -0.55, Math.PI)); }
        gp.add(chair(-4.6, -1.6, Math.PI / 2)); gp.add(chair(4.6, -1.6, -Math.PI / 2));
      }
    },
    islands: {
      say: 'Мастер-класс: 6 столов-островков по 5 мест, у преподавателя свой стол и экран.',
      build(gp) {
        screenAndProjector(gp);
        gp.add(table(X0 + 1.7, -0.8, 1.8, 0.8, Math.PI / 2));
        const pts = [[-2.9, -2.6], [0.6, -2.6], [4.1, -2.6], [-2.9, 0.0], [0.6, -0.1], [4.6, 0.0]];
        pts.forEach(([x, z]) => {
          gp.add(table(x, z, 1.5, 1.5, 0, true));
          for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; gp.add(chair(x + Math.sin(a) * 1.08, z + Math.cos(a) * 1.08, a + Math.PI)); }
        });
      }
    }
  };

  let mode = 'empty', anim = [];
  function setMode(m) {
    mode = m;
    // старая мебель уезжает вниз
    const old = [...furn.children]; old.forEach(o => furn.remove(o));
    const gp = new THREE.Group(); LAYOUTS[m].build(gp);
    const items = [...gp.children];
    sayEl.textContent = LAYOUTS[m].say.replace('{n}', items.filter(o => o.userData.chair).length);
    items.forEach((o, i) => {
      o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
      furn.add(o); o.userData.y0 = o.position.y; o.position.y += 2.5; o.scale.setScalar(0.001);
      anim.push({ o, t: -i * 0.012 });
    });
  }
  // переход мебели
  function stepAnim(dt) {
    anim = anim.filter(a => {
      a.t += dt; const k = Math.min(1, Math.max(0, a.t / 0.45));
      const e = 1 - Math.pow(1 - k, 3);
      a.o.position.y = a.o.userData.y0 + (1 - e) * 2.5; a.o.scale.setScalar(Math.max(0.001, e));
      return k < 1;
    });
  }

  /* ── Камеры ── */
  const CAMS = {
    doll: { p: [10.5, 10, 12.5], t: [0, 1.0, 0] },
    door: { p: [3.8, 1.65, 4.1], t: [-0.5, 1.7, -4] },
    win: { p: [-5.6, 1.7, 3.6], t: [2.2, 2.0, -4.5] },
    top: { p: [0, 21, 0.01], t: [0, 0, 0] }
  };
  let camT = null;
  function goCam(k) {
    const c = CAMS[k];
    camT = { p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...c.p), t1: new THREE.Vector3(...c.t), k: 0 };
    document.querySelectorAll('#cams button').forEach(b => b.classList.toggle('on', b.dataset.cam === k));
  }
  document.getElementById('cams').addEventListener('click', e => { const b = e.target.closest('button'); if (b) goCam(b.dataset.cam); });
  controls.addEventListener('start', () => { camT = null; document.querySelectorAll('#cams button').forEach(b => b.classList.remove('on')); document.getElementById('roomHint').style.opacity = 0; });

  document.getElementById('modes').addEventListener('click', e => {
    const b = e.target.closest('.mode'); if (!b) return;
    document.querySelectorAll('.mode').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    setMode(b.dataset.mode);
  });

  /* ── Рендер ── */
  function resize() {
    const w = view.clientWidth, h = view.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < 1 ? 60 : 42; camera.updateProjectionMatrix();
    if (w / h < 1) { CAMS.doll.p = [13, 14, 17]; }
  }
  new ResizeObserver(resize).observe(view); resize();
  if (view.clientWidth / view.clientHeight < 1) camera.position.set(13, 14, 17);

  const tmp = new THREE.Vector3();
  let last = performance.now(), visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(view);
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (camT) {
      camT.k = Math.min(1, camT.k + dt / 1.1); const e = camT.k < .5 ? 4 * camT.k ** 3 : 1 - Math.pow(-2 * camT.k + 2, 3) / 2;
      camera.position.lerpVectors(camT.p0, camT.p1, e); controls.target.lerpVectors(camT.t0, camT.t1, e);
      if (camT.k >= 1) camT = null;
    }
    controls.update();
    // кукольный домик: прячем стены, которые оказываются между камерой и залом
    walls.forEach(w => { tmp.copy(camera.position).sub(w.point); w.grp.visible = tmp.dot(w.normal) > -0.05; });
    const inside = camera.position.y < H - 0.1 && Math.abs(camera.position.x) < L / 2 && Math.abs(camera.position.z) < D / 2;
    ceil.visible = inside; leds.visible = inside || camera.position.y < H + 0.5;
    // вид из окна показываем, когда смотрим изнутри на уровне глаз; в режиме «домика» стекло просто светится небом
    const eye = camera.position.y < H + 1 && Math.abs(camera.position.x) < L / 2 + 2 && Math.abs(camera.position.z) < D / 2 + 2;
    back.visible = side.visible = eye;
    stepAnim(dt);
    renderer.render(scene, camera);
  }
  setMode('empty');
  requestAnimationFrame(loop);
}

/* Ёлочка: планки 45°, классический рисунок паркета */
function drawHerringbone(g) {
  const S = 1024; g.fillStyle = '#B98A5A'; g.fillRect(0, 0, S, S);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const plank = (pts) => {
    const v = 0.85 + rnd() * 0.25;
    g.fillStyle = `rgb(${Math.round(206 * v)},${Math.round(163 * v)},${Math.round(112 * v)})`;
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(80,50,25,.35)'; g.lineWidth = 1.2; g.stroke();
    // волокна
    g.strokeStyle = 'rgba(255,240,215,.08)'; g.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const t = rnd(); g.beginPath(); g.moveTo(pts[0][0] + (pts[3][0] - pts[0][0]) * t, pts[0][1] + (pts[3][1] - pts[0][1]) * t); g.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * t, pts[1][1] + (pts[2][1] - pts[1][1]) * t); g.stroke(); }
  };
  const d = S / 32, e = S / 12;   // проекции планки на оси при 45°, подобраны под бесшовный повтор
  // столбцы «ёлочки» вдоль оси y; ширина столбца 2e, период по y = 2d
  for (let cx = -2 * e; cx < S + 2 * e; cx += 2 * e) {
    for (let y = -2 * e; y < S + 2 * e; y += 2 * d) {
      // левая планка: от оси вверх-влево
      plank([[cx, y], [cx - e, y - e], [cx - e, y - e + 2 * d], [cx, y + 2 * d]]);
      // правая планка: от оси вверх-вправо, сдвиг на d
      plank([[cx, y + d], [cx + e, y + d - e], [cx + e, y + d - e + 2 * d], [cx, y + 3 * d]]);
    }
  }
}
