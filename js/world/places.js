// Low-poly, stylised 3D places for each faith, built from primitives (no model files to download).
// Each builder returns { group, spots, spawn, focus, ground, path } where spots are interactive activity points.

import * as THREE from '../../vendor/three.module.min.js';

const materialCache = new Map();

export function mat(color, options = {}) {
  const key = `${color}|${JSON.stringify(options)}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...options }));
  }
  return materialCache.get(key);
}

export function mesh(geometry, color, options) {
  const m = new THREE.Mesh(geometry, mat(color, options));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function at(object, x, y, z, rotationY = 0) {
  object.position.set(x, y, z);
  object.rotation.y = rotationY;
  return object;
}

export const box = (w, h, d, color, options) => mesh(new THREE.BoxGeometry(w, h, d), color, options);
export const cyl = (rt, rb, h, color, seg = 16, options) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, options);
export const sphere = (r, color, seg = 16, options) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)), color, options);
export const cone = (r, h, color, seg = 16, options) => mesh(new THREE.ConeGeometry(r, h, seg), color, options);

export function lathe(points, color, seg = 20, options) {
  return mesh(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg), color, options);
}

// Hip roof with slightly upturned corner tips (Chinese / Javanese temple style).
export function hipRoof(width, depth, height, color, tipColor) {
  const group = new THREE.Group();
  const roof = cyl(0.05, 1, height, color, 4);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(width * 0.72, 1, depth * 0.72);
  roof.position.y = height / 2;
  group.add(roof);
  if (tipColor) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const tip = cone(0.12, 0.6, tipColor, 6);
      tip.position.set(sx * width * 0.5, 0.15, sz * depth * 0.5);
      tip.rotation.z = -sx * 0.9;
      tip.rotation.x = sz * 0.9;
      group.add(tip);
    });
  }
  return group;
}

export function gableRoof(width, depth, height, color) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(-width / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geometry.translate(0, 0, -depth / 2);
  return mesh(geometry, color);
}

export function lantern(color = '#d8352a') {
  const group = new THREE.Group();
  const body = sphere(0.32, color, 12, { emissive: color, emissiveIntensity: 0.55 });
  body.scale.y = 1.25;
  const cap = cyl(0.14, 0.14, 0.08, '#e5b443', 8);
  cap.position.y = 0.42;
  const tassel = cyl(0.03, 0.06, 0.3, '#e5b443', 6);
  tassel.position.y = -0.5;
  group.add(body, cap, tassel);
  return group;
}

export function tree(scale = 1, leaf = '#5f8f55') {
  const group = new THREE.Group();
  const trunk = cyl(0.18 * scale, 0.26 * scale, 2.2 * scale, '#6b4a33', 7);
  trunk.position.y = 1.1 * scale;
  group.add(trunk);
  [[0, 2.6, 0, 1.3], [0.6, 2.2, 0.3, 0.9], [-0.55, 2.3, -0.2, 0.95], [0.1, 3.3, 0.1, 0.8]].forEach(([x, y, z, r]) => {
    const crown = mesh(new THREE.IcosahedronGeometry(r * scale, 0), leaf);
    crown.position.set(x * scale, y * scale, z * scale);
    crown.userData.noCollide = true;
    group.add(crown);
  });
  group.userData = { kind: 'tree', scale, leaf };
  return group;
}

export function frangipani(scale = 1) {
  const group = tree(scale * 0.8, '#6f9a5c');
  for (let i = 0; i < 8; i++) {
    const flower = sphere(0.09 * scale, i % 2 ? '#fff6e6' : '#f6d6a8', 6);
    flower.position.set((Math.random() - 0.5) * 1.6 * scale, (2.2 + Math.random()) * scale, (Math.random() - 0.5) * 1.6 * scale);
    flower.userData.noCollide = true;
    group.add(flower);
  }
  return group;
}

export function pond(radius, color = '#5d8fa6') {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.88 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.04;
  water.receiveShadow = true;
  const rim = mesh(new THREE.TorusGeometry(radius, 0.18, 6, 40), '#8f8a80');
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.08;
  water.userData.water = true;
  const group = new THREE.Group();
  group.add(water, rim);
  group.userData = { kind: 'pond', radius, noCollide: true, collider: { r: radius + 0.15 } };
  return group;
}

export function stoneStep(width, depth, color = '#b9b1a3') {
  return box(width, 0.25, depth, color);
}

export function bell(color = '#b4893e') {
  const group = new THREE.Group();
  const body = lathe([[0, 0], [0.42, 0], [0.38, 0.12], [0.3, 0.55], [0.2, 0.75], [0, 0.8]], color, 18, { metalness: 0.5, roughness: 0.4 });
  group.add(body);
  return group;
}

export function spot(id, kind, label, position, stand, extra = {}) {
  return { id, kind, label, position: new THREE.Vector3(...position), stand: new THREE.Vector3(stand[0], 0, stand[1]), radius: 2.2, ...extra };
}

// ---------- Klenteng (Chinese temple) ----------
function klenteng() {
  const g = new THREE.Group();
  const red = '#b8322b';
  const roofGreen = '#2f6b5a';
  g.add(at(stoneStep(14, 9), 0, 0.12, -9));
  // Main hall: open at the front (doors swung open) so the altar can be seen and approached.
  const hallWall = '#efe4cf';
  g.add(at(box(11, 3.4, 0.3, hallWall), 0, 1.95, -12.6));
  [-5.35, 5.35].forEach((x) => g.add(at(box(0.3, 3.4, 6.5, hallWall), x, 1.95, -9.5)));
  [-3.75, 3.75].forEach((x) => g.add(at(box(3.5, 3.4, 0.3, hallWall), x, 1.95, -6.4)));
  [-2, -1, 1, 2].forEach((i) => {
    g.add(at(cyl(0.22, 0.22, 3.4, red, 10), i * 2.6, 1.95, -6.1));
  });
  const roof = hipRoof(13.5, 8.5, 1.6, roofGreen, '#e0b443');
  at(roof, 0, 3.65, -9.5);
  g.add(roof);
  const roof2 = hipRoof(8, 5, 1.2, roofGreen, '#e0b443');
  at(roof2, 0, 5.05, -9.5);
  g.add(roof2);
  const pearl = sphere(0.35, '#e8b84a', 12, { emissive: '#e8b84a', emissiveIntensity: 0.4 });
  g.add(at(pearl, 0, 6.5, -9.5));
  [-1, 1].forEach((side) => g.add(at(box(1.6, 2.4, 0.1, red), side * 1.95, 1.45, -7.05, Math.PI / 2)));
  // Altar table inside the doorway
  g.add(at(box(3, 0.9, 1, '#7a2b22'), 0, 0.7, -7.4));
  // Hiolo (incense burner) in the courtyard
  const hiolo = new THREE.Group();
  hiolo.add(at(lathe([[0, 0], [0.9, 0], [1.05, 0.5], [0.95, 0.9], [0, 0.9]], '#7c5b2a', 20, { metalness: 0.5, roughness: 0.45 }), 0, 0.5, 0));
  [0, 2.1, 4.2].forEach((angle) => hiolo.add(at(cyl(0.1, 0.12, 0.6, '#5e4220', 6), Math.cos(angle) * 0.7, 0.25, Math.sin(angle) * 0.7)));
  hiolo.add(at(cyl(0.95, 0.95, 0.06, '#c7b7a0', 20), 0, 1.4, 0));
  g.add(at(hiolo, 0, 0, -2.5));
  // Lanterns along the eaves
  for (let i = -2; i <= 2; i++) {
    g.add(at(lantern(), i * 2.6, 3.0, -5.6));
  }
  // Kim cua furnace (small pagoda)
  const furnace = new THREE.Group();
  furnace.add(at(box(1.2, 1.4, 1.2, '#a8392f'), 0, 0.7, 0));
  furnace.add(at(hipRoof(1.6, 1.6, 0.6, roofGreen, '#e0b443'), 0, 1.4, 0));
  furnace.add(at(box(0.5, 0.5, 0.05, '#2b1a14'), 0, 0.6, 0.61));
  g.add(at(furnace, 6, 0, -3));
  // Ciam si table
  g.add(at(box(1.6, 0.8, 0.8, '#7a2b22'), -5.5, 0.4, -3));
  g.add(at(cyl(0.2, 0.18, 0.5, '#9a6b3a', 10), -5.5, 1.05, -3));
  // Guardian lions (stylised)
  [-3.6, 3.6].forEach((x) => {
    const lion = new THREE.Group();
    lion.add(at(box(0.8, 0.5, 0.8, '#9c968b'), 0, 0.25, 0));
    lion.add(at(sphere(0.45, '#a7a196', 8), 0, 0.95, 0.05));
    g.add(at(lion, x, 0, -5));
  });
  g.add(at(tree(1.1, '#4f7d4a'), -9, 0, -2), at(tree(0.9, '#4f7d4a'), 9.5, 0, -6));
  return {
    group: g,
    ground: '#cdbfa7',
    path: '#b6a789',
    spawn: { x: 0, z: 7 },
    focus: new THREE.Vector3(0, 1.5, -6),
    spots: [
      spot('hiolo', 'incense', 'Tancapkan hio', [0, 1.45, -2.5], [0, 0], { devotional: true, entry: 'khc-ibadah-hio', slots: 12 }),
      spot('lantern', 'lantern', 'Gantung lampion doa', [0, 3, -5.6], [-3, -3.5], { devotional: false, entry: 'khc-hariraya-imlek' }),
      spot('ciamsi', 'ciamsi', 'Kocok ciam si', [-5.5, 1.3, -3], [-5.5, -1.2], { devotional: true, entry: 'khc-ibadah-ciamsi' }),
      spot('kimcua', 'kimcua', 'Bakar kim cua', [6, 0.9, -2.3], [6, -0.6], { devotional: true, entry: 'khc-ibadah-kertas' }),
      spot('duduk', 'sit', 'Duduk hening', [0, 0.5, 2], [3.5, 2.5], { sitMode: 'pray' }),
    ],
    restricted: [
      { shape: 'rect', x1: -1.9, z1: -12.3, x2: 1.9, z2: -6.85, message: 'Meja altar utama: bersembahyang dari depan altar, bukan di baliknya.', ropeSides: (x, z) => z > -12.1 },
      { shape: 'circle', x: 6, z: -3, r: 1.45, message: 'Tungku kim cua panas. Bakar kertas dari depan tungku saja.' },
    ],
  };
}

// ---------- Vihara ----------
function vihara() {
  const g = new THREE.Group();
  g.add(at(stoneStep(13, 9, '#d8cfbf'), 0, 0.12, -9));
  // Dhammasala: open at the front so the Buddha rupang and the altar are visible.
  const hallWall = '#f3ead9';
  g.add(at(box(10, 3.2, 0.3, hallWall), 0, 1.85, -12.35));
  [-4.85, 4.85].forEach((x) => g.add(at(box(0.3, 3.2, 6, hallWall), x, 1.85, -9.5)));
  [-3.6, 3.6].forEach((x) => g.add(at(box(2.8, 3.2, 0.3, hallWall), x, 1.85, -6.65)));
  [-2, -1, 1, 2].forEach((i) => {
    g.add(at(cyl(0.22, 0.22, 3.2, '#c8862f', 10), i * 2.4, 1.85, -6.4));
  });
  g.add(at(hipRoof(12.5, 8, 1.5, '#c06a24', '#e8b84a'), 0, 3.45, -9.5));
  g.add(at(hipRoof(7, 4.5, 1.1, '#c06a24', '#e8b84a'), 0, 4.75, -9.5));
  // Seated Buddha (stylised) on a lotus throne inside
  const buddha = new THREE.Group();
  buddha.add(at(lathe([[0, 0], [1.1, 0], [1.2, 0.2], [0.9, 0.35], [0, 0.35]], '#e3b85a', 16, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0));
  buddha.add(at(lathe([[0, 0], [0.95, 0], [0.8, 0.5], [0.55, 1.2], [0.35, 1.5], [0, 1.55]], '#d9aa48', 18, { metalness: 0.6, roughness: 0.35 }), 0, 0.35, 0));
  buddha.add(at(sphere(0.38, '#dcae4c', 14, { metalness: 0.6, roughness: 0.35 }), 0, 2.15, 0));
  buddha.add(at(sphere(0.14, '#c99a3d', 8, { metalness: 0.6, roughness: 0.35 }), 0, 2.55, 0));
  g.add(at(buddha, 0, 0.3, -9.2));
  // Altar with candle stand
  g.add(at(box(3.2, 0.9, 1, '#8b4a20'), 0, 0.7, -7.2));
  // Stupa
  const stupa = new THREE.Group();
  stupa.add(at(box(3, 0.6, 3, '#e8e2d6'), 0, 0.3, 0));
  stupa.add(at(lathe([[0, 0], [1.3, 0], [1.25, 0.5], [1.0, 1.4], [0.5, 1.9], [0, 2.0]], '#f4f0e8', 20), 0, 0.6, 0));
  stupa.add(at(cone(0.25, 1.6, '#e3b85a', 8, { metalness: 0.5 }), 0, 3.4, 0));
  g.add(at(stupa, 7.5, 0, -4));
  // Lotus pond
  g.add(at(pond(2.6), -6.5, 0, -2.5));
  // Meditation cushions
  [-1.5, 0, 1.5].forEach((x) => g.add(at(cyl(0.45, 0.5, 0.2, '#b65a2a', 14), x, 0.1, 1.2)));
  g.add(at(bell('#a47a33'), 4, 2.4, -1.5));
  g.add(at(box(0.15, 2.6, 0.15, '#6b4a33'), 3.3, 1.3, -1.5), at(box(0.15, 2.6, 0.15, '#6b4a33'), 4.7, 1.3, -1.5), at(box(1.6, 0.15, 0.2, '#6b4a33'), 4, 2.6, -1.5));
  g.add(at(tree(1.2), -9.5, 0, -8), at(tree(1), 10, 0, -9));
  return {
    group: g,
    ground: '#d6cbb5',
    path: '#c2b393',
    spawn: { x: 0, z: 7 },
    focus: new THREE.Vector3(0, 1.8, -8),
    spots: [
      spot('altar', 'candle', 'Nyalakan lilin', [0, 1.2, -7.2], [0, -5.2], { devotional: true, entry: 'bud-ibadah-pujabakti', slots: 10 }),
      spot('dupa', 'incense', 'Persembahkan dupa', [0.9, 1.2, -7.2], [1.5, -5.2], { devotional: true, entry: 'bud-ibadah-pujabakti', slots: 9 }),
      spot('kolam', 'lotus', 'Letakkan teratai di kolam', [-6.5, 0.1, -2.5], [-3.6, -1.5], { devotional: false, entry: 'bud-hariraya-waisak' }),
      spot('bantal', 'sit', 'Duduk bermeditasi', [0, 0.3, 1.2], [0, 1.2], { sitMode: 'meditate', entry: 'bud-ibadah-meditasi', seat: { x: 0, z: 1.2, height: 0.2, cross: true, facing: Math.PI } }),
      spot('lonceng', 'bell', 'Bunyikan lonceng', [4, 2.4, -1.5], [4, 0], { devotional: false }),
    ],
    restricted: [
      { shape: 'rect', x1: -2, z1: -12.1, x2: 2, z2: -6.75, message: 'Altar dan rupang Buddha: beranjali dan berpersembahan dari depan altar.', ropeSides: (x, z) => z > -11.9 },
    ],
  };
}

// ---------- Pura ----------
function pura() {
  const g = new THREE.Group();
  const brick = '#a8573a';
  const stone = '#8d8a7d';
  // Candi bentar (split gate)
  [-1, 1].forEach((side) => {
    const half = new THREE.Group();
    [[2.2, 1.2], [1.8, 1.1], [1.4, 1.0], [1.0, 0.9], [0.6, 0.8]].forEach(([w, h], i) => {
      const y = [0, 1.2, 2.3, 3.3, 4.2][i];
      half.add(at(box(w, h, 1.8, i % 2 ? stone : brick), side * (w / 2), y + h / 2, 0));
    });
    g.add(at(half, side * 1.1, 0, 2));
  });
  // Padmasana shrine
  const padma = new THREE.Group();
  [[3.2, 0.8], [2.6, 0.8], [2.1, 0.8], [1.6, 0.8], [1.1, 0.6]].forEach(([w, h], i) => {
    padma.add(at(box(w, h, w, i % 2 ? '#d9d2c3' : stone), 0, i * 0.8 + h / 2, 0));
  });
  padma.add(at(box(1.4, 0.15, 1.2, '#e8c34f'), 0, 4.1, 0));
  padma.add(at(box(1.4, 1.2, 0.15, '#e8c34f'), 0, 4.7, -0.55));
  g.add(at(padma, 0, 0, -9));
  // Meru (multi-tiered roofs)
  const meru = new THREE.Group();
  meru.add(at(box(2, 1.6, 2, brick), 0, 0.8, 0));
  for (let i = 0; i < 5; i++) {
    meru.add(at(cyl(0.05, 1.6 - i * 0.25, 0.5, '#2c2622', 4), 0, 1.9 + i * 0.75, 0));
    meru.children.at(-1).rotation.y = Math.PI / 4;
    meru.add(at(box(0.5, 0.25, 0.5, '#6b4a33'), 0, 1.6 + i * 0.75, 0));
  }
  g.add(at(meru, 7, 0, -7));
  // Bale (open pavilion)
  const bale = new THREE.Group();
  bale.add(at(box(4, 0.6, 3, stone), 0, 0.3, 0));
  [[-1.7, -1.2], [1.7, -1.2], [-1.7, 1.2], [1.7, 1.2]].forEach(([x, z]) => bale.add(at(cyl(0.14, 0.14, 2.2, '#6b4a33', 8), x, 1.7, z)));
  bale.add(at(hipRoof(4.8, 3.8, 1.4, '#3a302a'), 0, 2.8, 0));
  g.add(at(bale, -7, 0, -6));
  // Penjor (curved bamboo pole)
  [-3.5, 3.5].forEach((x) => {
    const penjor = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3, 0), new THREE.Vector3(0.4, 5.2, 0), new THREE.Vector3(1.6, 6.2, 0), new THREE.Vector3(2.6, 6.0, 0),
    ]);
    penjor.add(mesh(new THREE.TubeGeometry(curve, 24, 0.07, 6), '#c9a35a'));
    const tip = cone(0.25, 0.9, '#e7d38a', 8);
    tip.position.set(2.7, 5.5, 0);
    tip.rotation.z = Math.PI;
    penjor.add(tip);
    penjor.userData = { noCollide: true, collider: { r: 0.15 } };
    g.add(at(penjor, x, 0, 3.5, x > 0 ? Math.PI : 0));
  });
  g.add(at(frangipani(1.2), -9, 0, 0), at(frangipani(1), 9, 0, 1), at(frangipani(1.1), -3, 0, -12));
  return {
    group: g,
    ground: '#c9c0a8',
    path: '#9f9886',
    spawn: { x: 0, z: 8 },
    focus: new THREE.Vector3(0, 2.5, -9),
    spots: [
      spot('padmasana', 'canang', 'Haturkan canang sari', [0, 0.85, -7.3], [0, -5.6], { devotional: true, entry: 'hin-ibadah-canang', slots: 12 }),
      spot('dupa', 'incense', 'Nyalakan dupa', [1.2, 0.85, -7.3], [1.6, -5.6], { devotional: true, entry: 'hin-ibadah-canang', slots: 9 }),
      spot('bale', 'sit', 'Duduk & Tri Sandhya', [-7, 0.6, -6], [-7, -3.8], { sitMode: 'pray', entry: 'hin-ibadah-trisandhya', seat: { x: -7, z: -6, height: 0.6, cross: true, facing: Math.atan2(7, -3) } }),
      spot('kulkul', 'bell', 'Bunyikan genta', [7, 1.2, -5], [6, -3.8], { devotional: false }),
    ],
    restricted: [
      { shape: 'rect', x1: -2.4, z1: -11.6, x2: 2.4, z2: -6.7, message: 'Padmasana adalah sthana suci; hanya pemangku yang naik. Haturkan canang dari depan.' },
      { shape: 'rect', x1: 5.7, z1: -8.3, x2: 8.3, z2: -5.9, message: 'Meru adalah pelinggih suci. Cukup menghormat dari luar tali.' },
    ],
  };
}

// ---------- Masjid ----------
function masjid() {
  const g = new THREE.Group();
  const white = '#f2efe8';
  const green = '#3f8f69';
  g.add(at(stoneStep(14, 10, '#d9d4c8'), 0, 0.12, -10));
  g.add(at(box(10, 4, 8, white), 0, 2.25, -10.5));
  const dome = mesh(new THREE.SphereGeometry(3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), green);
  g.add(at(dome, 0, 4.25, -10.5));
  g.add(at(cyl(0.06, 0.06, 1, '#d8b14a', 6), 0, 7.7, -10.5));
  g.add(at(sphere(0.2, '#d8b14a', 10), 0, 8.2, -10.5));
  // Arched doorways (dark panels with round top)
  [-3, 0, 3].forEach((x) => {
    g.add(at(box(1.6, 2.2, 0.1, '#4a5a52'), x, 1.35, -6.45));
    // Half-disc lying in the wall plane, rounded side up, sitting on top of the door panel.
    const arch = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16, 1, false, Math.PI / 2, Math.PI), '#4a5a52');
    arch.position.set(x, 2.45, -6.45);
    arch.rotation.set(Math.PI / 2, 0, 0);
    g.add(arch);
  });
  // Minaret
  const minaret = new THREE.Group();
  minaret.add(at(cyl(0.6, 0.7, 9, white, 12), 0, 4.5, 0));
  minaret.add(at(cyl(0.9, 0.9, 0.3, green, 12), 0, 7.6, 0));
  minaret.add(at(cone(0.65, 1.6, green, 12), 0, 9.8, 0));
  g.add(at(minaret, 7.5, 0, -12));
  // Wudu fountain
  const wudu = new THREE.Group();
  wudu.add(at(cyl(1.4, 1.5, 0.6, '#cfc8ba', 16), 0, 0.3, 0));
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), new THREE.MeshStandardMaterial({ color: '#7fb3c7', roughness: 0.1, metalness: 0.2 }));
  water.rotation.x = -Math.PI / 2;
  wudu.add(at(water, 0, 0.62, 0));
  wudu.add(at(cyl(0.15, 0.2, 1.2, '#cfc8ba', 10), 0, 1.2, 0));
  g.add(at(wudu, -6, 0, -2.5));
  // Prayer rugs (sajadah) in rows facing the mihrab
  for (let row = 0; row < 2; row++) {
    for (let i = -2; i <= 2; i++) {
      g.add(at(box(0.9, 0.04, 1.6, i % 2 ? '#7b2e36' : '#2f5d50'), i * 1.15, 0.27, -8.6 + row * 1.9));
    }
  }
  g.add(at(tree(1.1, '#4f8a55'), -9.5, 0, -8), at(tree(0.9, '#4f8a55'), 10, 0, -3));
  return {
    group: g,
    ground: '#d4cfc2',
    path: '#c4bba8',
    spawn: { x: 0, z: 7 },
    focus: new THREE.Vector3(0, 2.5, -9),
    spots: [
      spot('wudu', 'water', 'Berwudu', [-6, 1.3, -2.5], [-4, -1.5], { devotional: true, entry: 'isl-ibadah-wudu' }),
      spot('sajadah', 'sit', 'Duduk berzikir', [0, 0.3, -6.7], [0, -6.4], { sitMode: 'dzikir', entry: 'isl-ibadah-dzikir' }),
      spot('serambi', 'sit', 'Membaca & merenung', [4, 0.3, -4], [4, -4], { sitMode: 'pray', entry: 'isl-kitab-adab-membaca' }),
    ],
  };
}

// ---------- Gereja (Protestan) ----------
function gereja() {
  const g = new THREE.Group();
  const wall = '#f1ece2';
  g.add(at(stoneStep(10, 12, '#d2cbbd'), 0, 0.12, -10));
  g.add(at(box(7, 4, 10, wall), 0, 2.25, -11));
  g.add(at(gableRoof(8, 10.6, 3, '#6a4e3c'), 0, 4.25, -11));
  // Steeple with cross
  g.add(at(box(2.2, 7, 2.2, wall), 0, 3.5, -5.6));
  g.add(at(cyl(0.05, 1.6, 3, '#6a4e3c', 4), 0, 8.5, -5.6));
  g.children.at(-1).rotation.y = Math.PI / 4;
  g.add(at(box(0.16, 1.4, 0.16, '#d8b14a'), 0, 10.6, -5.6), at(box(0.8, 0.16, 0.16, '#d8b14a'), 0, 10.8, -5.6));
  g.add(at(box(1.4, 2.4, 0.1, '#6a4e3c'), 0, 1.45, -4.45));
  // Windows
  [-2.2, 2.2].forEach((x) => [-9, -12, -15].forEach((z) => g.add(at(box(0.08, 1.6, 0.9, '#9ec3e6', { emissive: '#9ec3e6', emissiveIntensity: 0.25 }), x * 1.6, 2.5, z))));
  // Outdoor prayer corner: candle stand + lectern + benches
  g.add(at(box(2.4, 1, 0.6, '#6a4e3c'), -4.5, 0.5, -2));
  g.add(at(box(0.6, 1.1, 0.5, '#6a4e3c'), 4.5, 0.55, -2.5));
  g.add(at(box(0.8, 0.06, 0.6, '#e9e2d3'), 4.5, 1.15, -2.5));
  // Two benches with a walkable aisle between them.
  [0, 2.0].forEach((z) => g.add(at(box(3.2, 0.45, 0.6, '#8a6a4e'), 0, 0.23, z)));
  g.add(at(tree(1.2, '#5a8a55'), -8, 0, -9), at(tree(1, '#5a8a55'), 8, 0, -10), at(tree(0.8, '#5a8a55'), 7, 0, 2));
  return {
    group: g,
    ground: '#cfd3c3',
    path: '#c2bba9',
    spawn: { x: 0, z: 7 },
    focus: new THREE.Vector3(0, 2.5, -6),
    spots: [
      spot('lilin', 'candle', 'Nyalakan lilin doa', [-4.5, 1.05, -2], [-4.5, 0], { devotional: true, entry: 'pro-ibadah-doa', slots: 12 }),
      spot('bangku', 'sit', 'Duduk berdoa', [0, 0.45, 0], [0, 1.0], { sitMode: 'pray', entry: 'pro-ibadah-doa', seat: { x: 0, z: 0, height: 0.45, facing: Math.PI } }),
      spot('mimbar', 'read', 'Baca ayat hari ini', [4.5, 1.3, -2.5], [4.5, -0.8], { devotional: false, entry: 'pro-kitab-cara-membaca' }),
      spot('lonceng', 'bell', 'Bunyikan lonceng', [0, 6, -5.6], [1.8, -3.5], { devotional: false }),
    ],
  };
}

// ---------- Katolik: Gereja & Gua Maria ----------
function katedral() {
  const g = new THREE.Group();
  const wall = '#ece6dc';
  g.add(at(box(8, 5, 10, wall), 0, 2.5, -13));
  g.add(at(gableRoof(9, 10.6, 3.4, '#5b4a64'), 0, 5, -13));
  [-2.6, 2.6].forEach((x) => {
    g.add(at(box(2, 9, 2, wall), x, 4.5, -7.6));
    g.add(at(cyl(0.05, 1.4, 2.4, '#5b4a64', 4), x, 10.2, -7.6));
    g.children.at(-1).rotation.y = Math.PI / 4;
  });
  g.add(at(box(0.16, 1.2, 0.16, '#d8b14a'), 0, 8.4, -8), at(box(0.7, 0.16, 0.16, '#d8b14a'), 0, 8.6, -8));
  g.add(at(mesh(new THREE.CircleGeometry(0.9, 20), '#b48fd6', { emissive: '#b48fd6', emissiveIntensity: 0.35 }), 0, 6.2, -7.95));
  // Gua Maria (grotto)
  const grotto = new THREE.Group();
  const rockColors = ['#7d7a72', '#8a867c', '#6f6c65'];
  for (let i = 0; i < 26; i++) {
    const angle = Math.PI * (i / 25);
    const r = 2.6 + (i % 3) * 0.25;
    const rock = mesh(new THREE.DodecahedronGeometry(0.7 + (i % 4) * 0.15, 0), rockColors[i % 3]);
    rock.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 1.2, -0.3 - (i % 2) * 0.4);
    grotto.add(rock);
  }
  // Statue of Mary (stylised)
  const maria = new THREE.Group();
  maria.add(at(lathe([[0, 0], [0.5, 0], [0.45, 0.6], [0.32, 1.4], [0.22, 1.7], [0, 1.75]], '#f7f5f0', 18), 0, 0, 0));
  maria.add(at(sphere(0.2, '#f7f5f0', 12), 0, 1.92, 0));
  const sash = mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 20), '#5f8ed6');
  sash.rotation.x = Math.PI / 2;
  maria.add(at(sash, 0, 1.0, 0));
  maria.add(at(cyl(0.6, 0.7, 0.6, '#8a867c', 10), 0, -0.3, 0));
  grotto.add(at(maria, 0, 0.6, -0.4));
  grotto.add(at(box(3, 0.9, 0.7, '#5b4a3e'), 0, 0.45, 1.2));
  g.add(at(grotto, 7, 0, -3, -0.6));
  [0, 1.5].forEach((z) => g.add(at(box(2.8, 0.45, 0.6, '#7a5c48'), 5.6 + z * 0.3, 0.23, 1.5 + z)));
  g.add(at(tree(1.1, '#557f52'), -8, 0, -6), at(tree(0.9, '#557f52'), -6, 0, 2), at(frangipani(0.9), 10.5, 0, -6));
  return {
    group: g,
    ground: '#cdd0c0',
    path: '#bdb5a3',
    spawn: { x: 0, z: 7 },
    focus: new THREE.Vector3(3, 2, -5),
    spots: [
      spot('lilin-maria', 'candle', 'Nyalakan lilin di Gua Maria', [7.4, 0.95, -2.1], [6, 0], { devotional: true, entry: 'kat-ibadah-rosario', slots: 14 }),
      spot('bunga', 'flowers', 'Persembahkan bunga', [7, 0.4, -2.6], [7.4, -0.6], { devotional: true }),
      spot('bangku', 'sit', 'Doa rosario', [5.8, 0.45, 2], [5.8, 2.6], { sitMode: 'rosary', entry: 'kat-ibadah-rosario', seat: { x: 5.8, z: 1.5, height: 0.45, facing: Math.PI } }),
      spot('gereja', 'sit', 'Hening di depan gereja', [0, 0.3, -6], [0, -5.5], { sitMode: 'pray', entry: 'kat-ibadah-misa' }),
    ],
    restricted: [
      { shape: 'circle', x: 7.23, z: -3.33, r: 1.25, message: 'Gua Maria: nyalakan lilin dan berdoa dari depan, tanpa masuk ke gua.', rope: false },
    ],
  };
}

// ---------- Ruang Alam ----------
function alam() {
  const g = new THREE.Group();
  g.add(at(pond(4, '#5f97ab'), 0, 0, -6));
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    g.add(at(tree(0.8 + (i % 3) * 0.25, i % 2 ? '#5f8f55' : '#6e9c5e'), Math.cos(angle) * 13, 0, Math.sin(angle) * 13 - 4));
  }
  [[-3, -1], [3.5, -2], [5, -8]].forEach(([x, z], i) => g.add(at(mesh(new THREE.DodecahedronGeometry(0.6 + i * 0.2, 0), '#8c887e'), x, 0.3, z)));
  g.add(at(box(2.4, 0.4, 0.7, '#8a6a4e'), 0, 0.5, 0.5));
  [-1, 1].forEach((x) => g.add(at(box(0.15, 0.5, 0.6, '#6b4a33'), x, 0.25, 0.5)));
  g.add(at(tree(1.6, '#4f8a4f'), -6, 0, -9));
  return {
    group: g,
    ground: '#a9bf8d',
    path: '#c8bb98',
    spawn: { x: 0, z: 6 },
    focus: new THREE.Vector3(0, 1, -6),
    spots: [
      spot('bangku', 'sit', 'Duduk & bernapas', [0, 0.6, 0.5], [0, 1.4], { sitMode: 'breathe', seat: { x: 0, z: 0.5, height: 0.7, facing: Math.PI } }),
      spot('kolam', 'ripple', 'Lempar kerikil ke kolam', [0, 0.1, -6], [0, -1.6], { devotional: false }),
      spot('pohon', 'sit', 'Bersandar di pohon', [-6, 0.3, -9], [-5, -7.6], { sitMode: 'breathe' }),
    ],
  };
}

export const PLACES = { klenteng, vihara, pura, masjid, gereja, katedral, alam };

export function buildPlace(sceneId) {
  return (PLACES[sceneId] || alam)();
}
