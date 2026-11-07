// 3D travel destinations: stylised, primitive-built versions of seven landmarks (data in ../wonders-data.js).
// Each builder returns the same place shape as places.js / venues.js, so the engine, navigation, NPCs and
// activities work unchanged. Proportions are simplified to fit the walkable area; facts live in the data file.

import * as THREE from '../../vendor/three.module.min.js';
import { mat, box, cyl, sphere, cone, at, lathe, hipRoof, gableRoof, lantern, tree, frangipani, pond, spot, mesh } from './places.js';
import { signpost, signBoard, noCollide } from './venues.js';
import { WONDERS, wonderById } from '../wonders-data.js';

const A = (top, bottom, head = 'hair', extra = {}) => ({ name: '', top, bottom, head, ...extra });

// Low-cost scenery: distant hills and a ring of trees, outside the walkable area.
function backdrop(g, { hill = '#7d9a6a', far = '#9fb39a', trees = '#5f8f55', count = 10 } = {}) {
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.15 + (i / 6) * 0.7);
    const r = 34 + (i % 3) * 4;
    const h = 7 + (i % 4) * 3;
    g.add(noCollide(at(cone(9 + (i % 3) * 3, h, i % 2 ? hill : far, 7), Math.cos(angle) * r, h / 2 - 0.5, -Math.sin(angle) * r)));
  }
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    // Keep the front arc (behind the visitor, where the follow camera sits) free of trees.
    if (Math.sin(angle) > 0.45) {
      continue;
    }
    g.add(at(tree(0.9 + (i % 3) * 0.25, trees), Math.cos(angle) * 16.5, 0, Math.sin(angle) * 16.5 - 2));
  }
}

// Instanced copies of one geometry (stupas, ratna finials, lanterns) = one draw call.
function instanced(geometry, color, transforms, options = {}) {
  const material = mat(color, options);
  const group = new THREE.InstancedMesh(geometry, material, transforms.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  transforms.forEach(([x, y, z, scale = 1, rotY = 0], i) => {
    q.setFromEuler(new THREE.Euler(0, rotY, 0));
    s.set(scale, scale, scale);
    p.set(x, y, z);
    m.compose(p, q, s);
    group.setMatrixAt(i, m);
  });
  group.castShadow = true;
  group.receiveShadow = true;
  group.userData.noCollide = true;
  return group;
}

function plaque(g, wonder, x, z, facing = 0) {
  const post = new THREE.Group();
  [-0.75, 0.75].forEach((px) => post.add(at(box(0.1, 1.5, 0.1, '#5a4634'), px, 0.75, 0)));
  const board = signBoard(wonder.name, wonder.region, { width: 1.8, height: 0.9, background: '#f3ead9', color: '#2f241a', border: '#5a4634' });
  board.position.set(0, 1.45, 0.06);
  post.add(board);
  g.add(at(post, x, 0, z, facing));
}

function stupaGeometry() {
  const points = [[0, 0], [0.5, 0], [0.52, 0.08], [0.5, 0.35], [0.42, 0.62], [0.26, 0.82], [0.12, 0.9], [0.12, 1.05], [0.05, 1.35], [0, 1.4]];
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), 14);
}

function people(guide, walkers, culture) {
  return [
    { id: 'pemandu', role: 'guide', persona: { ...guide, guide: true }, culture, x: -4.6, z: 5.6, facing: Math.PI / 5 },
    ...walkers.map((persona, i) => ({ id: `wisatawan-${i}`, role: 'walker', persona, culture, x: 3 - i * 2.4, z: 4 - i })),
  ];
}

function common(g, wonder, { spawn = { x: 0, z: 8.6 } } = {}) {
  plaque(g, wonder, -3.4, 6.2, 0.35);
  // Signposts stay solid for walking but let the camera ray pass (the home sign sits right behind spawn).
  const homeSign = at(signpost('🧭 Wisata lain'), 0, 0, 11.6);
  homeSign.userData.cameraPass = true;
  g.add(homeSign);
  const spots = [
    spot('papan-info', 'read', `Tentang ${wonder.name}`, [-3.4, 1.4, 6.2], [-3.0, 7.4], { devotional: false, wonderInfo: wonder.id, short: 'Tentang tempat ini' }),
    spot('ke-wisata', 'travel', 'Kembali ke daftar wisata', [0, 1.6, 11.6], [0, 10.4], { to: 'wisata', radius: 1.6 }),
  ];
  if (wonder.link) {
    const linkSign = at(signpost(`↔ ${wonderById(wonder.link.to).name}`), 6.2, 0, 9.6);
    linkSign.userData.cameraPass = true;
    g.add(linkSign);
    spots.push(spot('ke-tetangga', 'travel', wonder.link.label, [6.2, 1.6, 9.6], [6.2, 8.4], { to: `wisata:${wonder.link.to}`, radius: 1.6 }));
  }
  return { spots, spawn };
}

// ---------- Candi Borobudur ----------
function borobudur() {
  const wonder = wonderById('borobudur');
  const g = new THREE.Group();
  const stone = ['#8f897c', '#857f72'];
  const cz = -11;
  const squares = [13, 11.6, 10.2, 8.8, 7.4, 6.2];
  const step = 0.55;
  squares.forEach((w, i) => {
    g.add(at(box(w, step, w, stone[i % 2]), 0, step * i + step / 2, cz));
    // Balustrade rim with small niche stupas on every gallery edge.
    if (i > 0) {
      g.add(noCollide(at(box(w + 0.15, 0.18, w + 0.15, '#7c766a'), 0, step * i + 0.09, cz)));
    }
  });
  const top = step * squares.length;
  const rings = [{ r: 2.85, n: 16 }, { r: 2.25, n: 12 }, { r: 1.65, n: 8 }];
  const ringPlat = [3.3, 2.7, 2.1];
  ringPlat.forEach((r, i) => g.add(at(cyl(r, r, 0.42, stone[i % 2], 28), 0, top + 0.21 + i * 0.42, cz)));
  const stupaTransforms = [];
  rings.forEach((ring, i) => {
    for (let k = 0; k < ring.n; k++) {
      const a = (k / ring.n) * Math.PI * 2;
      stupaTransforms.push([Math.cos(a) * ring.r, top + 0.42 * (i + 1), cz + Math.sin(a) * ring.r, 0.55]);
    }
  });
  // Niche stupas along the square terrace edges (simplified count).
  for (let i = 1; i < squares.length; i++) {
    const half = squares[i] / 2 - 0.25;
    const y = step * i + 0.18;
    for (let k = -2; k <= 2; k++) {
      const t = (k / 2) * (half - 0.4);
      stupaTransforms.push([t, y, cz + half, 0.28], [t, y, cz - half, 0.28], [half, y, cz + t, 0.28], [-half, y, cz + t, 0.28]);
    }
  }
  g.add(instanced(stupaGeometry(), '#8a8477', stupaTransforms));
  const main = new THREE.Mesh(stupaGeometry(), mat('#8f897c'));
  main.scale.set(2.2, 2.0, 2.2);
  main.position.set(0, top + 0.42 * 3, cz);
  main.castShadow = true;
  main.userData.noCollide = true;
  g.add(main);
  // Front stairway rising through the middle of every terrace.
  for (let i = 0; i < squares.length; i++) {
    g.add(at(box(1.3, step * (i + 1), 0.7, '#9a9386'), 0, (step * (i + 1)) / 2, cz + squares[i] / 2 + 0.3));
  }
  // Lotus pond where pilgrims float flowers, and a meditation spot under a bodhi tree.
  g.add(at(pond(1.3, '#6f9fae'), 4.4, 0, 2.2));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(noCollide(at(cyl(0.22, 0.22, 0.03, '#5f8f55', 10), 4.4 + Math.cos(a) * 0.7, 0.06, 2.2 + Math.sin(a) * 0.7)));
  }
  g.add(at(tree(1.5, '#4f7d4a'), -5.6, 0, -1.4));
  backdrop(g, { hill: '#6f8a66', far: '#93a892' });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('teratai', 'lotus', 'Apungkan teratai', [4.4, 0.2, 2.2], [4.4, 4.0], { devotional: true, entry: 'bud-hariraya-waisak' }),
    spot('meditasi', 'sit', 'Meditasi di bawah pohon bodhi', [-5.0, 0.3, -0.4], [-4.6, 0.6], { sitMode: 'meditate', entry: 'bud-ibadah-meditasi' }),
  );
  return {
    group: g, ground: '#a7b98c', path: '#c9bca0', spawn, focus: new THREE.Vector3(0, 3.5, cz), spots,
    npcs: people(
      { name: 'Mas Bayu', attire: A('#3f5a7a', '#2f2f35', 'hair'), from: 'Magelang', job: 'pemandu wisata Borobudur', family: 'istri & satu anak', hobby: 'membaca relief Karmawibhangga' },
      [
        { name: 'Bhante Dhamma', attire: A('#c9772a', '#c9772a', 'gray'), from: 'Temanggung', job: 'bhikkhu', family: 'Sangha', hobby: 'berjalan meditasi' },
        { name: 'Kak Sinta', attire: A('#e7d3a8', '#3f3f48', 'bun'), from: 'Jakarta', job: 'mahasiswi arkeologi', family: 'anak bungsu', hobby: 'menggambar candi' },
      ],
      'jawa',
    ),
    culture: 'jawa',
    heldScene: 'vihara',
    restricted: [{ shape: 'rect', x1: -6.9, z1: -17.6, x2: 6.9, z2: -4.2, rope: true, message: 'Batu candi dilindungi: naik ke struktur memakai kuota & sandal upanat. Nikmati dari pelataran, ya.' }],
  };
}

// ---------- Candi Prambanan ----------
function candiTower(base, height, color) {
  const g = new THREE.Group();
  g.add(at(box(base, height * 0.12, base, color), 0, height * 0.06, 0));
  g.add(at(box(base * 0.72, height * 0.3, base * 0.72, color), 0, height * 0.12 + height * 0.15, 0));
  let y = height * 0.42;
  let w = base * 0.8;
  const ratna = [];
  for (let tier = 0; tier < 4; tier++) {
    const h = height * 0.1;
    g.add(at(box(w, h, w, tier % 2 ? '#8a8072' : color), 0, y + h / 2, 0));
    const r = w / 2;
    [[r, r], [-r, r], [r, -r], [-r, -r], [0, r], [0, -r], [r, 0], [-r, 0]].forEach(([x, z]) => ratna.push([x, y + h, z, 0.18 + 0.02 * (3 - tier)]));
    y += h;
    w *= 0.74;
  }
  g.add(instanced(new THREE.LatheGeometry([[0, 0], [0.5, 0], [0.45, 0.4], [0.2, 0.9], [0.08, 1.4], [0, 1.6]].map(([x, yy]) => new THREE.Vector2(x, yy)), 8), '#867c6e', ratna));
  const crown = lathe([[0, 0], [w * 0.55, 0], [w * 0.5, height * 0.06], [w * 0.2, height * 0.13], [0, height * 0.17]], color, 10);
  crown.position.y = y;
  crown.userData.noCollide = true;
  g.add(crown);
  return g;
}

function prambanan() {
  const wonder = wonderById('prambanan');
  const g = new THREE.Group();
  const stone = '#9a9082';
  g.add(at(box(19, 0.4, 9, '#8f8678'), 0, 0.2, -12));
  g.add(at(candiTower(4.4, 12, stone), 0, 0.4, -12.5));
  g.add(at(candiTower(3.0, 8.4, stone), -6.2, 0.4, -12));
  g.add(at(candiTower(3.0, 8.4, stone), 6.2, 0.4, -12));
  // Small perwara shrines in a row in front.
  [-7, -3.5, 3.5, 7].forEach((x) => g.add(at(candiTower(1.3, 3.2, '#8d8475'), x, 0, -5.6)));
  // Offering table for canang, with frangipani trees typical of Hindu temple grounds.
  g.add(at(box(1.6, 0.8, 0.8, '#6b4a33'), 3.2, 0.4, 1.6));
  g.add(at(frangipani(1.0), -6.5, 0, 1.5), at(frangipani(0.9), 7.4, 0, 2.6));
  backdrop(g, { hill: '#7a9367', far: '#9cb08f', trees: '#5e8a52' });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('canang', 'canang', 'Haturkan canang sari', [3.2, 0.85, 1.6], [3.2, 2.9], { devotional: true, entry: 'hin-ibadah-canang' }),
    spot('trisandhya', 'sit', 'Duduk bersembahyang (Trisandhya)', [-2.2, 0.3, -1.6], [-2.2, -1.0], { sitMode: 'pray', entry: 'hin-ibadah-trisandhya' }),
  );
  return {
    group: g, ground: '#b3bf96', path: '#cbbf9f', spawn, focus: new THREE.Vector3(0, 4, -12), spots,
    npcs: people(
      { name: 'Bli Wayan', attire: A('#ffffff', '#2f4a6a', 'udeng', { headColor: '#ffffff' }), from: 'Klaten', job: 'pemandu & penari Ramayana', family: 'istri & dua anak', hobby: 'sendratari Ramayana' },
      [
        { name: 'Mbok Sri', attire: A('#f7f4ec', '#e3b341', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), from: 'Sleman', job: 'pedagang bunga', family: 'cucu tiga', hobby: 'merangkai canang' },
        { name: 'Pak Hendra', attire: A('#6a7f96', '#2f2f35'), from: 'Bandung', job: 'fotografer', family: 'istri', hobby: 'memotret senja' },
      ],
      'bali',
    ),
    culture: 'bali',
    heldScene: 'pura',
    restricted: [{ shape: 'rect', x1: -9.5, z1: -16.6, x2: 9.5, z2: -7.4, rope: true, message: 'Candi utama dijaga: lihat relief dari pelataran dan jangan memanjat.' }],
  };
}

// ---------- Masjid Istiqlal ----------
function istiqlal() {
  const wonder = wonderById('istiqlal');
  const g = new THREE.Group();
  const white = '#eceae4';
  const dome = '#cfd5d8';
  g.add(at(box(17, 0.3, 12, '#d8d4ca'), 0, 0.15, -12.5));
  g.add(at(box(14, 5.2, 10, white), 0, 2.9, -13));
  // Grid of slender columns along the front (the open gallery).
  for (let i = -6; i <= 6; i += 1.5) {
    g.add(at(box(0.35, 4.6, 0.35, '#f4f2ec'), i, 2.6, -7.7));
  }
  g.add(noCollide(at(box(14.4, 0.4, 0.8, white), 0, 5.1, -7.7)));
  const big = mesh(new THREE.SphereGeometry(5.6, 30, 14, 0, Math.PI * 2, 0, Math.PI / 2), dome, { metalness: 0.35, roughness: 0.45 });
  big.userData.noCollide = true;
  g.add(at(big, 0, 5.5, -13));
  g.add(noCollide(at(cyl(5.75, 5.75, 0.35, white, 30), 0, 5.6, -13)));
  g.add(noCollide(at(cyl(0.06, 0.06, 1.4, '#c9a64a', 6), 0, 11.5, -13)));
  // Crescent and star finial, simplified.
  const crescent = mesh(new THREE.TorusGeometry(0.42, 0.08, 6, 16, Math.PI * 1.4), '#c9a64a', { metalness: 0.6, roughness: 0.3 });
  crescent.rotation.z = Math.PI * 0.8;
  crescent.userData.noCollide = true;
  g.add(at(crescent, 0, 12.5, -13));
  // Single tall minaret (scaled down) on the side.
  const minaret = new THREE.Group();
  minaret.add(at(cyl(0.55, 0.7, 13, white, 12), 0, 6.5, 0));
  minaret.add(at(cyl(0.9, 0.9, 0.35, dome, 12), 0, 10.2, 0));
  minaret.add(at(cone(0.55, 2.2, dome, 12), 0, 14.1, 0));
  g.add(at(minaret, 9.6, 0, -8.2));
  // Wudu taps and a smaller dome over the side hall.
  g.add(at(box(2.8, 0.9, 0.6, '#cfc8ba'), -6.2, 0.45, -2.6));
  [-7.2, -6.2, -5.2].forEach((x) => g.add(noCollide(at(cyl(0.03, 0.03, 0.3, '#9aa0a6', 6, { metalness: 0.7 }), x, 1.05, -2.8))));
  [-2, 0, 2].forEach((x, i) => g.add(at(box(0.9, 0.03, 1.6, i % 2 ? '#7b2e36' : '#2f5d50'), x, 0.32, -6.3)));
  g.add(at(tree(1.2, '#4f8a55'), -9.5, 0, 0), at(tree(1.0, '#4f8a55'), 10, 0, 1.5));
  backdrop(g, { hill: '#9aa6a0', far: '#b8c0bc', trees: '#4f8a55', count: 8 });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('wudu', 'water', 'Berwudu', [-6.2, 1.0, -2.6], [-6.2, -1.4], { devotional: true, entry: 'isl-ibadah-wudu' }),
    spot('serambi', 'sit', 'Duduk berzikir di serambi', [0, 0.35, -6.3], [0, -5.6], { sitMode: 'dzikir', entry: 'isl-ibadah-dzikir' }),
  );
  return {
    group: g, ground: '#cfcbbf', path: '#c4bba8', spawn, focus: new THREE.Vector3(0, 4.5, -12), spots,
    npcs: people(
      { name: 'Ustazah Nur', attire: A('#3f8f69', '#2f3b4a', 'hijab', { headColor: '#e9e2d3' }), from: 'Jakarta', job: 'pemandu tamu Istiqlal', family: 'suami & dua anak', hobby: 'menjelaskan arsitektur Silaban' },
      [
        { name: 'Pak Rahmat', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Bekasi', job: 'pegawai negeri', family: 'cucu dua', hobby: 'salat Jumat di Istiqlal' },
        { name: 'Mbak Grace', attire: A('#6c8fe0', '#3a3a48', 'bun'), from: 'Manado', job: 'wisatawan', family: 'tinggal di Jakarta', hobby: 'tur rumah ibadah' },
      ],
      'minang',
    ),
    culture: 'minang',
    heldScene: 'masjid',
    restricted: [{ shape: 'rect', x1: -7.2, z1: -18.2, x2: 7.2, z2: -7.4, rope: false, message: 'Ruang salat utama: tamu masuk didampingi pemandu, lepas alas kaki, dan tidak melintas di depan orang salat.' }],
  };
}

// ---------- Gereja Katedral Jakarta ----------
function spire(height, base, color, roof) {
  const g = new THREE.Group();
  g.add(at(box(base, height * 0.62, base, color), 0, height * 0.31, 0));
  // Open belfry storey and the sharp octagonal spire.
  g.add(at(box(base * 0.86, height * 0.1, base * 0.86, '#d9d3c8'), 0, height * 0.67, 0));
  const tip = cone(base * 0.62, height * 0.36, roof, 8);
  tip.userData.noCollide = true;
  g.add(at(tip, 0, height * 0.72 + height * 0.18, 0));
  return g;
}

function katedral() {
  const wonder = wonderById('katedral');
  const g = new THREE.Group();
  const wall = '#e8e4dc';
  const roof = '#4c4a52';
  g.add(at(box(9, 6.2, 15, wall), 0, 3.1, -15));
  const r = gableRoof(9.6, 15.4, 4.2, roof);
  r.userData.noCollide = true;
  g.add(at(r, 0, 6.2, -15));
  g.add(at(spire(15, 2.4, wall, roof), -3.4, 0, -7.6), at(spire(15, 2.4, wall, roof), 3.4, 0, -7.6));
  g.add(at(spire(11, 1.4, wall, roof), 0, 6.2, -16));
  // Facade: pointed portal, rose window glowing.
  g.add(at(box(2.0, 3.4, 0.12, '#5a4a3e'), 0, 1.7, -7.45));
  const portalArch = cone(1.0, 1.2, '#5a4a3e', 4);
  portalArch.rotation.y = Math.PI / 4;
  portalArch.scale.z = 0.08;
  g.add(noCollide(at(portalArch, 0, 4.0, -7.45)));
  g.add(noCollide(at(mesh(new THREE.CircleGeometry(1.0, 24), '#b48fd6', { emissive: '#b48fd6', emissiveIntensity: 0.4 }), 0, 5.3, -7.43)));
  [-3, -1, 1, 3].forEach((dz) => [-4.56, 4.56].forEach((x) => g.add(noCollide(at(box(0.06, 2.4, 0.8, '#9ec3e6', { emissive: '#9ec3e6', emissiveIntensity: 0.3 }), x, 3.4, -15 + dz * 2)))));
  // Candle stand near a small Marian statue; benches in the courtyard.
  g.add(at(box(2.2, 0.95, 0.6, '#6b4a33'), -5.4, 0.48, -2.2));
  const maria = new THREE.Group();
  maria.add(at(lathe([[0, 0], [0.42, 0], [0.38, 0.5], [0.27, 1.2], [0.18, 1.45], [0, 1.5]], '#f7f5f0', 16), 0, 0.6, 0));
  maria.add(at(sphere(0.17, '#f7f5f0', 12), 0, 2.25, 0));
  maria.add(at(cyl(0.5, 0.6, 0.6, '#8a867c', 10), 0, 0.3, 0));
  g.add(at(maria, -7.2, 0, -3.4));
  [0, 1.6].forEach((dz) => g.add(at(box(2.6, 0.45, 0.6, '#7a5c48'), 4.6, 0.23, 1.0 + dz)));
  g.add(at(tree(1.1, '#557f52'), -9.8, 0, -8), at(tree(1.0, '#557f52'), 9.8, 0, -6));
  backdrop(g, { hill: '#9aa6a0', far: '#b8c0bc', trees: '#557f52', count: 8 });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('lilin', 'candle', 'Nyalakan lilin doa', [-5.4, 1.0, -2.2], [-5.4, -0.9], { devotional: true, entry: 'kat-ibadah-rosario', slots: 12 }),
    spot('bangku', 'sit', 'Doa rosario di halaman', [4.6, 0.45, 1.0], [4.6, 0.3], { sitMode: 'rosary', entry: 'kat-ibadah-rosario', seat: { x: 4.6, z: 1.0, height: 0.45, facing: Math.PI } }),
  );
  return {
    group: g, ground: '#cfd0c3', path: '#bdb5a3', spawn, focus: new THREE.Vector3(0, 5, -9), spots,
    // The twin spires are tall and close to the forecourt: open wider and flatter.
    view: { distance: 14.5, pitch: 0.1 },
    npcs: people(
      { name: 'Romo Antonius', attire: A('#f4f1ea', '#f4f1ea', 'gray', { pendant: '#d8b14a' }), from: 'Jakarta', job: 'imam & pemandu museum Katedral', family: 'umat paroki', hobby: 'sejarah gereja' },
      [
        { name: 'Ibu Maria', attire: A('#9b7fd1', '#4a3a5a', 'bun', { pendant: '#d8b14a' }), from: 'Bogor', job: 'guru', family: 'tiga anak', hobby: 'paduan suara' },
        { name: 'Mas Fajar', attire: A('#4a6a4a', '#2f2f35', 'peci', { headColor: '#1f1f22' }), from: 'Jakarta', job: 'relawan parkir lintas iman', family: 'baru menikah', hobby: 'naik sepeda' },
      ],
      'flores',
    ),
    culture: 'flores',
    heldScene: 'katedral',
  };
}

// ---------- Gereja Blenduk ----------
function blenduk() {
  const wonder = wonderById('blenduk');
  const g = new THREE.Group();
  const wall = '#f0ebdf';
  const copper = '#a8693c';
  g.add(at(cyl(5, 5, 5.2, wall, 8), 0, 2.6, -12));
  const dome = mesh(new THREE.SphereGeometry(4.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), copper, { roughness: 0.6 });
  dome.userData.noCollide = true;
  g.add(at(dome, 0, 5.2, -12));
  g.add(noCollide(at(cyl(0.7, 0.8, 1.2, wall, 8), 0, 9.9, -12)));
  g.add(noCollide(at(cone(0.75, 1.0, copper, 8), 0, 11.0, -12)));
  g.add(noCollide(at(box(0.12, 1.0, 0.12, '#d8b14a'), 0, 12.0, -12)), noCollide(at(box(0.6, 0.12, 0.12, '#d8b14a'), 0, 12.2, -12)));
  // Twin front towers with small domes and the classical portico.
  [-3.4, 3.4].forEach((x) => {
    g.add(at(box(1.8, 7.2, 1.8, wall), x, 3.6, -7.2));
    g.add(noCollide(at(mesh(new THREE.SphereGeometry(0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), copper), x, 7.2, -7.2)));
  });
  [-1.8, -0.6, 0.6, 1.8].forEach((x) => g.add(at(cyl(0.22, 0.25, 4.2, '#f7f4ec', 10), x, 2.1, -6.4)));
  const pediment = gableRoof(4.8, 1.2, 1.2, wall);
  pediment.userData.noCollide = true;
  g.add(at(pediment, 0, 4.2, -6.5));
  g.add(at(box(1.4, 2.6, 0.1, '#6a4e3c'), 0, 1.3, -7.0));
  // Bell on a small frame and benches outside.
  const bellFrame = new THREE.Group();
  [-0.6, 0.6].forEach((x) => bellFrame.add(at(box(0.12, 2.4, 0.12, '#5a4634'), x, 1.2, 0)));
  bellFrame.add(at(box(1.4, 0.12, 0.14, '#5a4634'), 0, 2.4, 0));
  bellFrame.add(at(lathe([[0, 0], [0.32, 0], [0.28, 0.1], [0.22, 0.42], [0.14, 0.56], [0, 0.6]], '#b4893e', 14, { metalness: 0.5, roughness: 0.4 }), 0, 1.7, 0));
  g.add(at(bellFrame, 5.6, 0, -2.6));
  [0, 1.6].forEach((dz) => g.add(at(box(2.8, 0.45, 0.6, '#7a5c48'), -4.2, 0.23, 0.6 + dz)));
  // Old-town facades along the street.
  [-10, 10].forEach((x, i) => g.add(at(box(4, 5 + i, 6, i ? '#e6dccb' : '#d9cbb3'), x, 2.5 + i / 2, -10)));
  g.add(at(tree(1.0, '#5a8a55'), -9.6, 0, 1.8), at(tree(0.9, '#5a8a55'), 9.2, 0, 2.4));
  backdrop(g, { hill: '#a5ae9c', far: '#c0c6b8', count: 6 });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('lonceng', 'bell', 'Bunyikan lonceng', [5.6, 1.9, -2.6], [5.6, -1.2], { devotional: false }),
    spot('bangku', 'sit', 'Duduk berdoa', [-4.2, 0.45, 0.6], [-4.2, -0.1], { sitMode: 'pray', entry: 'pro-ibadah-doa', seat: { x: -4.2, z: 0.6, height: 0.45, facing: Math.PI } }),
  );
  return {
    group: g, ground: '#c8c6b6', path: '#b9ae98', spawn, focus: new THREE.Vector3(0, 4.5, -10), spots,
    npcs: people(
      { name: 'Pnt. Lukas', attire: A('#2b2b30', '#2b2b30', 'gray', { collar: '#ffffff' }), from: 'Semarang', job: 'penatua GPIB Immanuel', family: 'jemaat Kota Lama', hobby: 'merawat organ tua' },
      [
        { name: 'Kak Ruth', attire: A('#6c8fe0', '#3a3a48', 'bun'), from: 'Salatiga', job: 'pemandu Kota Lama', family: 'adik dua', hobby: 'fotografi arsitektur' },
        { name: 'Om Benny', attire: A('#7a5a3a', '#2f2f35'), from: 'Semarang', job: 'penjual lumpia', family: 'istri & tiga anak', hobby: 'keroncong' },
      ],
      'jawa',
    ),
    culture: 'jawa',
    heldScene: 'gereja',
  };
}

// ---------- Klenteng Sam Poo Kong ----------
function sampookong() {
  const wonder = wonderById('sampookong');
  const g = new THREE.Group();
  const red = '#b8322b';
  const roofC = '#7a2a22';
  const gold = '#e0b443';
  g.add(at(box(16, 0.3, 10, '#c9bfae'), 0, 0.15, -12));
  g.add(at(box(9, 3.6, 6, red), 0, 2.1, -13));
  g.add(noCollide(at(hipRoof(10.4, 7.2, 1.8, roofC, gold), 0, 3.9, -13)));
  g.add(noCollide(at(box(6, 1.4, 4, red), 0, 6.4, -13)));
  g.add(noCollide(at(hipRoof(7.4, 5.2, 1.5, roofC, gold), 0, 7.1, -13)));
  g.add(noCollide(at(hipRoof(4.4, 3.2, 1.2, roofC, gold), 0, 8.6, -13)));
  // Side halls.
  [-7, 7].forEach((x) => {
    g.add(at(box(4, 2.8, 4, red), x, 1.7, -11));
    g.add(noCollide(at(hipRoof(5, 5, 1.2, roofC, gold), x, 3.1, -11)));
  });
  // Paifang-style gate at the entrance.
  const gate = new THREE.Group();
  [-2.4, 2.4].forEach((x) => gate.add(at(cyl(0.22, 0.22, 4, red, 10), x, 2, 0)));
  gate.add(at(box(5.6, 0.5, 0.5, red), 0, 3.8, 0));
  gate.add(noCollide(at(hipRoof(6.4, 1.2, 0.7, roofC, gold), 0, 4.05, 0)));
  g.add(at(gate, 0, 0, 3.4));
  // Admiral Cheng Ho statue (stylised robe and cap) on a plinth.
  const statue = new THREE.Group();
  statue.add(at(box(1.6, 1.2, 1.6, '#8a867c'), 0, 0.6, 0));
  statue.add(at(lathe([[0, 0], [0.65, 0], [0.6, 0.8], [0.42, 1.8], [0.3, 2.2], [0, 2.25]], '#8a6a3a', 16, { metalness: 0.5, roughness: 0.5 }), 0, 1.2, 0));
  statue.add(at(sphere(0.26, '#8a6a3a', 12, { metalness: 0.5, roughness: 0.5 }), 0, 3.7, 0));
  statue.add(at(cyl(0.3, 0.3, 0.18, '#3a2a1a', 12), 0, 3.95, 0));
  g.add(at(statue, 6.2, 0, -4.2));
  // Incense urn (hiolo) and a row of red lanterns.
  g.add(at(cyl(0.6, 0.5, 0.9, '#7b5a2a', 12, { metalness: 0.4 }), -3.2, 0.45, -4.0));
  const lanterns = [];
  for (let i = -3; i <= 3; i++) {
    lanterns.push([i * 1.4, 3.4, -9.7, 0.7]);
  }
  g.add(instanced(new THREE.SphereGeometry(0.32, 10, 8), '#d8352a', lanterns, { emissive: '#d8352a', emissiveIntensity: 0.55 }));
  g.add(at(tree(1.0, '#4f7d4a'), -9.8, 0, -3), at(tree(1.1, '#4f7d4a'), 9.6, 0, 1.2));
  backdrop(g, { hill: '#7f9a72', far: '#a2b39a', count: 8 });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('hio', 'incense', 'Pasang hio', [-3.2, 1.0, -4.0], [-3.2, -2.6], { devotional: true, entry: 'khc-ibadah-hio' }),
    spot('hening', 'sit', 'Duduk hening di pelataran', [2.2, 0.3, -2.4], [2.2, -1.8], { sitMode: 'pray', entry: 'khc-aturan-etika-klenteng' }),
  );
  return {
    group: g, ground: '#c4c0ae', path: '#b9ae98', spawn, focus: new THREE.Vector3(0, 4, -11), spots,
    npcs: people(
      { name: 'Pak Tan Sin', attire: A('#b8322b', '#1f1d1b', 'rucap', { headColor: '#1f1d1b', wideSleeves: true }), from: 'Semarang', job: 'pengurus klenteng', family: 'umat Tridharma', hobby: 'kisah pelayaran Cheng Ho' },
      [
        { name: 'Ci Mei', attire: A('#d4423a', '#3a3a40', 'bun'), from: 'Semarang', job: 'pedagang hio', family: 'ibu dua anak', hobby: 'Cap Go Meh' },
        { name: 'Pak Haji Umar', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Demak', job: 'peziarah', family: 'cucu lima', hobby: 'ziarah makam & sejarah' },
      ],
      'tionghoa',
    ),
    culture: 'tionghoa',
    heldScene: 'klenteng',
    restricted: [{ shape: 'rect', x1: -4.6, z1: -16.2, x2: 4.6, z2: -9.8, rope: true, message: 'Ruang sembahyang utama diutamakan bagi yang bersembahyang. Lihat dari pelataran, ya.' }],
  };
}

// ---------- Kampung Adat Wae Rebo ----------
function mbaruNiang(scale = 1) {
  const g = new THREE.Group();
  g.add(at(cyl(1.7 * scale, 1.8 * scale, 1.0 * scale, '#5a4632', 10), 0, 0.5 * scale, 0));
  const roof = cone(2.2 * scale, 5.4 * scale, '#6b5a3c', 14, { roughness: 1 });
  roof.userData.noCollide = true;
  g.add(at(roof, 0, 1.0 * scale + 2.7 * scale, 0));
  g.add(noCollide(at(cyl(0.05, 0.05, 0.6 * scale, '#3a2a1a', 6), 0, 6.6 * scale, 0)));
  g.add(noCollide(at(box(0.7 * scale, 0.9 * scale, 0.08, '#3a2a1a'), 0, 0.7 * scale, 1.78 * scale)));
  return g;
}

function waerebo() {
  const wonder = wonderById('waerebo');
  const g = new THREE.Group();
  // Seven houses in a half ring around the stone compang (central altar), the biggest one is Mbaru Gendang.
  const cx = 0;
  const cz = -7.5;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.05 + (i / 6) * 0.9);
    const big = i === 3;
    g.add(at(mbaruNiang(big ? 1.25 : 1), cx + Math.cos(a) * 9.2, 0, cz - Math.sin(a) * 6.8, -(a - Math.PI / 2)));
  }
  const compang = new THREE.Group();
  compang.add(at(cyl(1.6, 1.8, 0.7, '#7d7a72', 12), 0, 0.35, 0));
  compang.add(at(mesh(new THREE.DodecahedronGeometry(0.45, 0), '#8c887e'), 0, 0.95, 0));
  g.add(at(compang, cx, 0, cz));
  // Mountain spring and coffee shrubs; misty forest all around.
  g.add(at(pond(1.2, '#6aa0b0'), 5.4, 0, 2.0));
  for (let i = 0; i < 6; i++) {
    g.add(at(mesh(new THREE.IcosahedronGeometry(0.45, 0), '#3f6b3a'), -6 + (i % 3) * 0.9, 0.45, 1.5 + Math.floor(i / 3) * 0.9));
  }
  g.add(at(box(2.4, 0.4, 0.7, '#7a5c3a'), -2.6, 0.5, 2.2));
  [-1.1, 1.1].forEach((x) => g.add(at(box(0.14, 0.5, 0.6, '#5a4632'), -2.6 + x, 0.25, 2.2)));
  backdrop(g, { hill: '#3f6b48', far: '#5d8466', trees: '#3f6b3a', count: 14 });
  const { spots, spawn } = common(g, wonder);
  spots.push(
    spot('bale', 'sit', 'Duduk & menghirup udara gunung', [-2.6, 0.6, 2.2], [-2.6, 3.0], { sitMode: 'breathe', seat: { x: -2.6, z: 2.2, height: 0.7, facing: Math.PI } }),
    spot('mata-air', 'ripple', 'Sentuh air mata air', [5.4, 0.1, 2.0], [5.4, 3.6], { devotional: false }),
  );
  return {
    group: g, ground: '#8fae7a', path: '#b9a983', spawn, focus: new THREE.Vector3(0, 3, -8), spots,
    npcs: people(
      { name: 'Bapa Yosef', attire: A('#2b2b30', '#7a2a2a', 'hair', { sash: { style: 'waist', color: '#c9a64a' } }), from: 'Wae Rebo', job: 'tetua adat & pemandu', family: 'keluarga besar di Mbaru Gendang', hobby: 'menyambut tamu dengan Waelu’u' },
      [
        { name: 'Mama Theresia', attire: A('#3a2a2a', '#7a2a2a', 'bun'), from: 'Wae Rebo', job: 'penenun songke', family: 'lima anak', hobby: 'menenun' },
        { name: 'Kak Dimas', attire: A('#5f8f55', '#3f3f48', 'cap'), from: 'Yogyakarta', job: 'pendaki', family: 'tinggal sendiri', hobby: 'naik gunung' },
      ],
      'flores',
    ),
    culture: 'flores',
    heldScene: 'alam',
    restricted: [{ shape: 'circle', x: cx, z: cz, r: 2.4, rope: false, message: 'Compang adalah altar batu adat. Hormati dengan tidak menaikinya.' }],
  };
}

const BUILDERS = { borobudur, prambanan, istiqlal, katedral, blenduk, sampookong, waerebo };

// Monuments are tall: open with a wider, flatter camera so the whole silhouette is in frame.
const WONDER_VIEW = { distance: 14.5, pitch: 0.24 };

export function buildWonder(id) {
  const place = (BUILDERS[id] || borobudur)();
  place.view = place.view || WONDER_VIEW;
  return place;
}

export { WONDERS };
