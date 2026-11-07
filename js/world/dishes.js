// Procedural dishes at real size (metres): plates, bowls, rice grains, noodles, broth, skewers, drinks.
// No model files: everything is generated, so it works offline. Each dish is split into "portions"
// (what one bite / one sip takes away) so eating can remove food piece by piece.
//
// buildDish(spec) -> { group, portions: [{ objects, sound, pick }], liquid, hot, steam: Vector3, utensil }

import * as THREE from '../../vendor/three.module.min.js';

// ---------- Small helpers ----------
function seeded(seed = 7) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const materials = new Map();
function food(color, { rough = 0.55, coat = 0, sheen = 0, opacity = 1, emissive = null, map = null, bump = null, bumpScale = 0.002, metal = 0, side = THREE.FrontSide, transmission = 0 } = {}) {
  const key = [color, rough, coat, sheen, opacity, emissive, map && map.uuid, bump && bump.uuid, metal, side].join('|');
  if (!materials.has(key)) {
    const material = new THREE.MeshPhysicalMaterial({
      color, roughness: rough, metalness: metal, clearcoat: coat, clearcoatRoughness: 0.25,
      transparent: opacity < 1, opacity, side, transmission,
    });
    if (sheen) {
      material.sheen = sheen;
      material.sheenColor = new THREE.Color('#ffffff');
    }
    if (emissive) {
      material.emissive = new THREE.Color(emissive);
      material.emissiveIntensity = 1.2;
    }
    if (map) {
      material.map = map;
    }
    if (bump) {
      material.bumpMap = bump;
      material.bumpScale = bumpScale;
    }
    if (opacity < 1) {
      material.depthWrite = false;
    }
    materials.set(key, material);
  }
  return materials.get(key);
}

const textures = new Map();
// Canvas textures: grain (fine noise), char (grill marks / burnt spots), crumb (bread), weave (rattan), leaf (veins).
function texture(kind) {
  if (textures.has(kind)) {
    return textures.get(kind);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const c = canvas.getContext('2d');
  const rand = seeded(kind.length * 97);
  if (kind === 'grain' || kind === 'crumb') {
    c.fillStyle = '#808080';
    c.fillRect(0, 0, 128, 128);
    const n = kind === 'grain' ? 2600 : 1400;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(rand() * 255);
      c.fillStyle = `rgb(${v},${v},${v})`;
      const s = kind === 'grain' ? 1 + rand() * 1.5 : 1 + rand() * 4;
      c.fillRect(rand() * 128, rand() * 128, s, s);
    }
  } else if (kind === 'char') {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 70; i++) {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 6 + rand() * 12);
      const x = rand() * 128;
      const y = rand() * 128;
      c.save();
      c.translate(x, y);
      g.addColorStop(0, `rgba(40,20,8,${0.5 + rand() * 0.45})`);
      g.addColorStop(1, 'rgba(40,20,8,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, 18, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  } else if (kind === 'weave') {
    c.fillStyle = '#b98d55';
    c.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        c.fillStyle = (x + y) % 16 ? '#a87b45' : '#cfa368';
        c.fillRect(x + 1, y + 1, 6, 6);
      }
    }
  } else if (kind === 'leaf') {
    c.fillStyle = '#3f7d34';
    c.fillRect(0, 0, 128, 128);
    c.strokeStyle = 'rgba(190,230,150,0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 64);
    c.lineTo(128, 64);
    c.stroke();
    c.lineWidth = 1;
    for (let x = 0; x < 128; x += 9) {
      c.beginPath();
      c.moveTo(x, 64);
      c.lineTo(x + 18, 0);
      c.moveTo(x, 64);
      c.lineTo(x + 18, 128);
      c.stroke();
    }
  } else if (kind === 'bamboo') {
    c.fillStyle = '#d9b77a';
    c.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 6) {
      c.fillStyle = `rgba(120,80,30,${0.15 + rand() * 0.2})`;
      c.fillRect(x, 0, 1, 128);
    }
  } else if (kind === 'crema') {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, '#c8955d');
    g.addColorStop(0.55, '#a8703c');
    g.addColorStop(1, '#6e4323');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      c.fillStyle = `rgba(240,210,170,${rand() * 0.25})`;
      c.beginPath();
      c.arc(rand() * 128, rand() * 128, rand() * 2.2, 0, Math.PI * 2);
      c.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (kind !== 'grain' && kind !== 'crumb' && kind !== 'char') {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  textures.set(kind, tex);
  return tex;
}

function meshOf(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
}

// Organic shapes: displace a sphere along its normals with smooth position-based noise
// (same position -> same offset, so seams never crack).
function lump(radius, { color, jitter = 0.22, sx = 1, sy = 1, sz = 1, segments = 10, seed = 1, mat = null }) {
  const geometry = new THREE.SphereGeometry(radius, segments, Math.max(6, Math.round(segments * 0.7)));
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n = Math.sin(v.x * 211 + seed) * Math.sin(v.y * 173 + seed * 2) * Math.sin(v.z * 197 + seed * 3)
      + 0.5 * Math.sin(v.x * 431 + v.z * 389 + seed);
    v.multiplyScalar(1 + n * jitter);
    v.set(v.x * sx, v.y * sy, v.z * sz);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, mat || food(color));
}

// ---------- Vessels ----------
function plate(radius = 0.125, { color = '#f6f3ec', rim = null } = {}) {
  const points = [[0, 0.004], [radius * 0.62, 0.004], [radius * 0.78, 0.01], [radius * 0.98, 0.022], [radius, 0.024]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const group = new THREE.Group();
  group.add(meshOf(new THREE.LatheGeometry(points, 48), food(color, { rough: 0.18, coat: 1, side: THREE.DoubleSide })));
  group.add(meshOf(new THREE.CylinderGeometry(radius * 0.6, radius * 0.56, 0.006, 40), food(color, { rough: 0.3 }), 0, 0.001, 0));
  if (rim) {
    const ring = meshOf(new THREE.TorusGeometry(radius * 0.92, 0.004, 6, 48), food(rim, { rough: 0.25, coat: 0.6 }), 0, 0.019, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }
  return group;
}

function bowl(radius = 0.085, height = 0.06, { color = '#f4f0e8', rough = 0.18, pattern = null } = {}) {
  const points = [[0, 0], [radius * 0.5, 0], [radius * 0.56, 0.008], [radius * 0.9, height * 0.72], [radius, height],
    [radius * 0.96, height], [radius * 0.86, height * 0.74], [radius * 0.5, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const group = new THREE.Group();
  group.add(meshOf(new THREE.LatheGeometry(points, 48), food(color, { rough, coat: rough < 0.3 ? 1 : 0, side: THREE.DoubleSide })));
  if (pattern) {
    const band = meshOf(new THREE.TorusGeometry(radius * 0.93, 0.0025, 6, 48), food(pattern, { rough: 0.3 }), 0, height * 0.82, 0);
    band.rotation.x = Math.PI / 2;
    group.add(band);
  }
  group.userData.inner = (y) => THREE.MathUtils.lerp(radius * 0.5, radius * 0.86, Math.min(1, y / (height * 0.74)));
  return group;
}

function bananaLeafOnRattan(radius = 0.13) {
  const group = new THREE.Group();
  const rattan = meshOf(new THREE.CylinderGeometry(radius, radius * 0.92, 0.012, 40), food('#c79a5e', { rough: 0.9, map: texture('weave') }));
  group.add(rattan);
  const leaf = meshOf(new THREE.CircleGeometry(radius * 0.93, 40), food('#4f8f3f', { rough: 0.35, coat: 0.5, map: texture('leaf'), side: THREE.DoubleSide }), 0, 0.0075, 0);
  leaf.rotation.x = -Math.PI / 2;
  group.add(leaf);
  return group;
}

function steamerBasket(radius = 0.085) {
  const group = new THREE.Group();
  const wall = meshOf(new THREE.CylinderGeometry(radius, radius, 0.045, 36, 1, true), food('#d4b07a', { rough: 0.8, map: texture('bamboo'), side: THREE.DoubleSide }), 0, 0.0225, 0);
  const floor = meshOf(new THREE.CylinderGeometry(radius * 0.97, radius * 0.97, 0.004, 36), food('#cfa86f', { rough: 0.85, map: texture('bamboo') }), 0, 0.004, 0);
  const paper = meshOf(new THREE.CircleGeometry(radius * 0.9, 32), food('#f3ecd8', { rough: 0.9 }), 0, 0.0065, 0);
  paper.rotation.x = -Math.PI / 2;
  group.add(wall, floor, paper);
  return group;
}

function cupAndSaucer({ liquid = '#3a2213', crema = false, milk = false } = {}) {
  const group = new THREE.Group();
  group.add(plate(0.07, { color: '#f4f1ea' }));
  const cupPoints = [[0, 0.012], [0.026, 0.012], [0.03, 0.02], [0.04, 0.06], [0.042, 0.072], [0.039, 0.072], [0.037, 0.06], [0.027, 0.022], [0, 0.02]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  group.add(meshOf(new THREE.LatheGeometry(cupPoints, 36), food('#f4f1ea', { rough: 0.15, coat: 1, side: THREE.DoubleSide })));
  const handle = meshOf(new THREE.TorusGeometry(0.014, 0.004, 8, 18, Math.PI * 1.3), food('#f4f1ea', { rough: 0.15, coat: 1 }), 0.046, 0.048, 0);
  handle.rotation.z = -Math.PI * 0.65;
  group.add(handle);
  const surface = meshOf(new THREE.CircleGeometry(0.037, 32), crema || milk
    ? food('#ffffff', { rough: 0.25, coat: 0.6, map: texture('crema') })
    : food(liquid, { rough: 0.05, coat: 1 }), 0, 0.062, 0);
  surface.rotation.x = -Math.PI / 2;
  group.add(surface);
  return { group, surface, top: 0.062, bottom: 0.024, radiusAt: (y) => THREE.MathUtils.lerp(0.028, 0.037, (y - 0.024) / 0.038) };
}

function glass({ liquid = '#b97a43', height = 0.11, radius = 0.032, foam = null, handle = false } = {}) {
  const group = new THREE.Group();
  // Clear glass: a faint wall (so the drink keeps its colour), a bright rim and two vertical
  // specular streaks facing the light — that is what makes a glass read as glass at a glance.
  const wall = meshOf(new THREE.CylinderGeometry(radius, radius * 0.86, height, 32, 1, true),
    food('#ffffff', { rough: 0.02, coat: 1, opacity: 0.1, side: THREE.DoubleSide }), 0, height / 2, 0);
  const base = meshOf(new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, 0.008, 32), food('#ffffff', { rough: 0.05, opacity: 0.4 }), 0, 0.004, 0);
  const rimRing = meshOf(new THREE.TorusGeometry(radius, 0.0011, 6, 40), food('#ffffff', { rough: 0.02, opacity: 0.7, emissive: '#ffffff' }), 0, height, 0);
  rimRing.rotation.x = Math.PI / 2;
  const streak = food('#ffffff', { rough: 0.02, opacity: 0.38, emissive: '#ffffff', side: THREE.DoubleSide });
  const wide = meshOf(new THREE.CylinderGeometry(radius * 1.004, radius * 0.866, height * 0.84, 6, 1, true, -0.95, 0.24), streak, 0, height * 0.5, 0);
  const thin = meshOf(new THREE.CylinderGeometry(radius * 1.004, radius * 0.866, height * 0.7, 3, 1, true, 0.55, 0.07), streak, 0, height * 0.46, 0);
  wall.renderOrder = 2;
  wide.renderOrder = 3;
  thin.renderOrder = 3;
  rimRing.renderOrder = 3;
  group.add(wall, base, rimRing, wide, thin);
  if (handle) {
    const h = meshOf(new THREE.TorusGeometry(0.022, 0.005, 8, 18, Math.PI), food('#ffffff', { rough: 0.05, opacity: 0.35 }), radius + 0.002, height * 0.55, 0);
    h.rotation.z = -Math.PI / 2;
    group.add(h);
  }
  const fill = height * 0.82;
  const body = meshOf(new THREE.CylinderGeometry(radius * 0.96, radius * 0.83, 1, 32), food(liquid, { rough: 0.1, coat: 0.8, opacity: 0.93 }));
  body.scale.y = fill - 0.008;
  body.position.y = 0.008 + (fill - 0.008) / 2;
  group.add(body);
  let foamMesh = null;
  if (foam) {
    foamMesh = meshOf(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.012, 32), food(foam, { rough: 0.85, bump: texture('grain'), bumpScale: 0.003 }), 0, fill + 0.004, 0);
    group.add(foamMesh);
  }
  return { group, body, foam: foamMesh, fill, bottom: 0.008 };
}

// ---------- Food parts ----------
function riceSectors(radius, height, color, sectors = 6, seed = 3) {
  const rand = seeded(seed);
  const group = new THREE.Group();
  const baseMaterial = food(color, { rough: 0.55, bump: texture('grain'), bumpScale: 0.0012 });
  const base = meshOf(new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), baseMaterial);
  base.scale.y = height / radius;
  group.add(base);
  const grain = new THREE.CapsuleGeometry(0.0017, 0.0048, 2, 6);
  const grainMaterial = food(color, { rough: 0.38, coat: 0.25, sheen: 0.4 });
  const parts = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  for (let s = 0; s < sectors; s++) {
    const count = 150;
    const instanced = new THREE.InstancedMesh(grain, grainMaterial, count);
    for (let i = 0; i < count; i++) {
      const angle = ((s + rand()) / sectors) * Math.PI * 2;
      const r = Math.sqrt(rand()) * radius * 0.98;
      const domeY = height * Math.sqrt(Math.max(0, 1 - (r / radius) ** 2));
      euler.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      quaternion.setFromEuler(euler);
      matrix.compose(new THREE.Vector3(Math.cos(angle) * r, domeY + 0.0008, Math.sin(angle) * r), quaternion, new THREE.Vector3(1, 1, 1));
      instanced.setMatrixAt(i, matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
    parts.push(instanced);
  }
  return { group, base, parts };
}

function noodleStrands({ count = 36, radius = 0.075, color = '#e8c35a', thick = 0.0026, flat = false, height = 0.03, seed = 5, gloss = 0.6 }) {
  const rand = seeded(seed);
  const material = food(color, { rough: 0.32, coat: gloss, sheen: 0.3 });
  const strands = [];
  for (let i = 0; i < count; i++) {
    const points = [];
    let angle = rand() * Math.PI * 2;
    let r = rand() * radius * 0.8;
    const layer = rand();
    for (let p = 0; p < 9; p++) {
      angle += (rand() - 0.3) * 1.1;
      r = THREE.MathUtils.clamp(r + (rand() - 0.5) * radius * 0.5, radius * 0.05, radius);
      const dome = height * (1 - (r / radius) ** 2);
      points.push(new THREE.Vector3(Math.cos(angle) * r, 0.006 + dome * (0.35 + layer * 0.65) + rand() * 0.004, Math.sin(angle) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const strand = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, flat ? thick * 1.9 : thick, flat ? 4 : 6, false), material);
    if (flat) {
      strand.scale.y = 0.35;
      strand.position.y = 0.006;
    }
    strands.push(strand);
  }
  return strands;
}

const TOPPING = {
  shrimp(rand) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0055, 8, 16, Math.PI * 1.25), food('#f08a5d', { rough: 0.35, coat: 0.7 }));
    body.rotation.x = Math.PI / 2;
    g.add(body);
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.0057, 0.0012, 4, 10), food('#fbd2b8', { rough: 0.4 }));
      const a = (i / 4) * Math.PI * 1.2;
      stripe.position.set(Math.cos(a) * 0.011, 0, Math.sin(a) * 0.011);
      stripe.rotation.y = -a;
      g.add(stripe);
    }
    g.rotation.y = rand() * Math.PI * 2;
    return g;
  },
  egg(rand) {
    return lump(0.007, { color: '#f4c84a', jitter: 0.4, sy: 0.5, seed: rand() * 9, mat: food('#f2c548', { rough: 0.6 }) });
  },
  greens(rand) {
    const g = new THREE.Group();
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8, 0, Math.PI * 2, 0, 0.6), food('#2f7a33', { rough: 0.3, coat: 0.8, side: THREE.DoubleSide }));
    leaf.scale.set(1.4, 0.3, 0.7);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.04, 6), food('#9ccf6a', { rough: 0.35, coat: 0.6 }));
    stem.rotation.z = Math.PI / 2;
    stem.position.set(-0.022, 0, 0);
    g.add(leaf, stem);
    g.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI * 2, 0);
    return g;
  },
  sprouts(rand) {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.026, 5), food('#f6f2dc', { rough: 0.3, coat: 0.5 }));
      s.rotation.order = 'YXZ';
      s.rotation.set(Math.PI / 2 + (rand() - 0.5) * 0.3, rand() * 6, 0);
      s.position.set((rand() - 0.5) * 0.02, 0, (rand() - 0.5) * 0.02);
      g.add(s);
    }
    return g;
  },
  chives(rand) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.035, 5), food('#4d9a3a', { rough: 0.35, coat: 0.6 }));
      s.rotation.order = 'YXZ';
      s.rotation.set(Math.PI / 2, rand() * 6, 0);
      s.position.set((rand() - 0.5) * 0.015, 0, (rand() - 0.5) * 0.015);
      g.add(s);
    }
    return g;
  },
  chicken(rand) {
    return lump(0.0085, { color: '#9a5a2a', jitter: 0.25, sx: 1.2, sy: 0.8, seed: rand() * 9, mat: food('#8f5226', { rough: 0.35, coat: 0.8 }) });
  },
  pork(rand) {
    return lump(0.0095, { color: '#b5543e', jitter: 0.2, sx: 1.4, sy: 0.55, seed: rand() * 9, mat: food('#b04f37', { rough: 0.4, coat: 0.6, map: texture('char') }) });
  },
  meatball(rand) {
    return lump(0.013, { color: '#9b8670', jitter: 0.08, seed: rand() * 9, segments: 14, mat: food('#9a8873', { rough: 0.6, bump: texture('crumb'), bumpScale: 0.004 }) });
  },
  fishcake(rand) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16), food('#f7f1e6', { rough: 0.5 })));
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0016, 4, 16), food('#e6798b', { rough: 0.5 }));
    edge.rotation.x = Math.PI / 2;
    g.add(edge);
    g.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6);
    return g;
  },
  chili(rand) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0035, 0.0012, 5, 10), food('#d6261d', { rough: 0.25, coat: 0.9 }));
    ring.rotation.set(Math.PI / 2 + (rand() - 0.5), 0, 0);
    return ring;
  },
  scallion(rand) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0032, 0.001, 5, 10), food('#5aa847', { rough: 0.3, coat: 0.7 }));
    ring.rotation.set(Math.PI / 2 + (rand() - 0.5), 0, 0);
    return ring;
  },
  shallot(rand) {
    return lump(0.0035, { color: '#9a5b28', jitter: 0.5, sy: 0.3, seed: rand() * 9, segments: 6, mat: food('#94561f', { rough: 0.5, coat: 0.4 }) });
  },
  cabbage(rand) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 6, 0, Math.PI * 2, 0, 0.7), food('#cfe0a2', { rough: 0.35, coat: 0.6, side: THREE.DoubleSide }));
    leaf.scale.set(1.3, 0.3, 0.9);
    leaf.rotation.y = rand() * 6;
    return leaf;
  },
  carrot(rand) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.004), food('#ef8a2c', { rough: 0.35, coat: 0.6 }));
    m.rotation.y = rand() * 6;
    return m;
  },
  mushroom(rand) {
    const m = lump(0.008, { color: '#6b4a32', jitter: 0.2, sy: 0.45, seed: rand() * 9, mat: food('#5f4029', { rough: 0.3, coat: 0.8 }) });
    return m;
  },
  rib(rand) {
    const g = new THREE.Group();
    g.add(lump(0.012, { color: '#8a5a3c', jitter: 0.15, sx: 2.1, sy: 0.9, seed: rand() * 9, mat: food('#7d5236', { rough: 0.45, coat: 0.5 }) }));
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 8), food('#efe6d6', { rough: 0.6 }));
    bone.rotation.z = Math.PI / 2;
    bone.position.x = 0.028;
    g.add(bone);
    g.rotation.y = rand() * 6;
    return g;
  },
  garlic(rand) {
    return lump(0.006, { color: '#efe2c0', jitter: 0.1, sx: 0.8, seed: rand() * 9, mat: food('#eadfc2', { rough: 0.4, coat: 0.3 }) });
  },
  tofu(rand) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.018), food('#d4a04a', { rough: 0.7, bump: texture('crumb'), bumpScale: 0.003 }));
    m.rotation.set(rand(), rand(), rand());
    return m;
  },
  beans(rand) {
    return lump(0.004, { color: '#7a1f22', jitter: 0.08, sx: 1.5, seed: rand() * 9, mat: food('#6e1d20', { rough: 0.3, coat: 0.8 }) });
  },
  corn(rand) {
    return lump(0.0035, { color: '#f0c440', jitter: 0.12, seed: rand() * 9, segments: 6, mat: food('#f2c33c', { rough: 0.3, coat: 0.7 }) });
  },
  pumpkin(rand) {
    return lump(0.008, { color: '#ea9a2c', jitter: 0.25, sy: 0.7, seed: rand() * 9, mat: food('#e8952a', { rough: 0.45, coat: 0.4 }) });
  },
  longbean(rand) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.04, 6), food('#4d8d2f', { rough: 0.35, coat: 0.6 }));
    m.rotation.order = 'YXZ';
    m.rotation.set(Math.PI / 2, rand() * 6, 0);
    return m;
  },
  celery(rand) {
    return TOPPING.scallion(rand);
  },
  vermicelli(rand) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const pts = [];
      for (let p = 0; p < 5; p++) {
        pts.push(new THREE.Vector3((rand() - 0.5) * 0.04, rand() * 0.004, (rand() - 0.5) * 0.04));
      }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0009, 4), food('#f2efe6', { rough: 0.2, opacity: 0.85, coat: 0.6 })));
    }
    return g;
  },
};

function scatter(group, names, { count = 6, radius = 0.06, y = 0.03, seed = 11, dome = 0.02, into = null }) {
  const rand = seeded(seed);
  const placed = [];
  names.forEach((name, n) => {
    for (let i = 0; i < count; i++) {
      const make = TOPPING[name];
      if (!make) {
        continue;
      }
      const object = make(rand);
      const angle = ((i + rand() * 0.8) / count) * Math.PI * 2 + n;
      const r = Math.sqrt(rand()) * radius;
      object.position.set(Math.cos(angle) * r, y + dome * (1 - (r / radius) ** 2) + rand() * 0.003, Math.sin(angle) * r);
      (into || group).add(object);
      placed.push({ object, angle: Math.atan2(object.position.z, object.position.x) });
    }
  });
  return placed;
}

// Group things into bite-sized portions by angle around the plate centre.
function bySector(items, sectors) {
  const out = Array.from({ length: sectors }, () => []);
  items.forEach((item) => {
    const angle = (item.angle + Math.PI * 2) % (Math.PI * 2);
    out[Math.min(sectors - 1, Math.floor((angle / (Math.PI * 2)) * sectors))].push(item.object);
  });
  return out;
}

// ---------- Sides for rice plates ----------
function side(name, rand) {
  switch (name) {
    case 'rendang':
      return [0, 1, 2].map((i) => lump(0.016, { color: '#4a2412', jitter: 0.32, sx: 1.2, sy: 0.75, seed: i * 3 + rand(), segments: 12,
        mat: food('#4a2311', { rough: 0.5, coat: 0.45, bump: texture('crumb'), bumpScale: 0.006 }) }));
    case 'sambalIjo':
      return [lump(0.016, { color: '#4e7a2a', jitter: 0.45, sy: 0.45, seed: 4, segments: 12, mat: food('#4f7d27', { rough: 0.3, coat: 0.9, bump: texture('crumb'), bumpScale: 0.006 }) })];
    case 'daunSingkong':
      return [0, 1].map((i) => lump(0.018, { color: '#22411a', jitter: 0.4, sy: 0.35, seed: i + 8, segments: 12, mat: food('#244517', { rough: 0.35, coat: 0.6, bump: texture('crumb'), bumpScale: 0.008 }) }));
    case 'gulai':
      return [lump(0.03, { color: '#e3a83a', jitter: 0.05, sy: 0.08, seed: 2, segments: 18, mat: food('#e0a234', { rough: 0.1, coat: 1, opacity: 0.92 }) })];
    case 'egg': {
      const g = new THREE.Group();
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.016, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), food('#fbf8f0', { rough: 0.25, coat: 0.6 }));
      white.scale.set(1, 0.75, 1.25);
      const yolk = new THREE.Mesh(new THREE.CircleGeometry(0.0095, 20), food('#f0a51f', { rough: 0.3, coat: 0.7 }));
      yolk.rotation.x = -Math.PI / 2;
      yolk.position.y = 0.0121;
      g.add(white, yolk);
      return [g];
    }
    case 'eggBalado': {
      const g = new THREE.Group();
      g.add(lump(0.017, { color: '#c5321d', jitter: 0.1, sy: 0.8, sz: 1.2, seed: 5, mat: food('#c0311b', { rough: 0.2, coat: 1, bump: texture('crumb'), bumpScale: 0.004 }) }));
      return [g];
    }
    case 'chickenSlices':
      return [0, 1, 2, 3].map((i) => {
        const slice = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.009, 0.016), food('#f2e2c6', { rough: 0.35, coat: 0.6 }));
        const skin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.002, 0.016), food('#f3d79a', { rough: 0.2, coat: 1 }));
        skin.position.y = 0.0055;
        const g = new THREE.Group();
        g.add(slice, skin);
        g.rotation.y = 0.3;
        g.position.x = i * 0.012;
        return g;
      });
    case 'cucumber':
      return [0, 1, 2].map(() => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 18), food('#dff0c6', { rough: 0.3, coat: 0.5 })));
        const rind = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0013, 4, 18), food('#2f6a2b', { rough: 0.3 }));
        rind.rotation.x = Math.PI / 2;
        g.add(rind);
        g.rotation.x = 0.25;
        return g;
      });
    case 'chiliSauce': {
      const g = new THREE.Group();
      g.add(bowl(0.022, 0.012, { color: '#f4f0e8' }));
      const sauce = new THREE.Mesh(new THREE.CircleGeometry(0.018, 20), food('#d4381f', { rough: 0.1, coat: 1 }));
      sauce.rotation.x = -Math.PI / 2;
      sauce.position.y = 0.01;
      g.add(sauce);
      g.userData.keep = true;
      return [g];
    }
    case 'lawar':
      return [lump(0.022, { color: '#5d7b3a', jitter: 0.5, sy: 0.4, seed: 6, segments: 14, mat: food('#647d3c', { rough: 0.45, coat: 0.3, bump: texture('crumb'), bumpScale: 0.01 }) }),
        lump(0.016, { color: '#efe7d2', jitter: 0.5, sy: 0.35, seed: 3, segments: 10, mat: food('#eee4cc', { rough: 0.6, bump: texture('crumb'), bumpScale: 0.01 }) })];
    case 'sambalMatah':
      return [lump(0.015, { color: '#d8574a', jitter: 0.55, sy: 0.4, seed: 9, segments: 12, mat: food('#d9604c', { rough: 0.2, coat: 1, bump: texture('crumb'), bumpScale: 0.01 }) })];
    case 'peanuts':
      return [0, 1].map((i) => lump(0.012, { color: '#a8662e', jitter: 0.45, sy: 0.4, seed: i + 2, segments: 10, mat: food('#a6652c', { rough: 0.35, coat: 0.5, bump: texture('crumb'), bumpScale: 0.008 }) }));
    case 'teri':
      return [lump(0.014, { color: '#b0895a', jitter: 0.55, sy: 0.4, seed: 5, segments: 10, mat: food('#ad8455', { rough: 0.45, coat: 0.4, bump: texture('crumb'), bumpScale: 0.01 }) })];
    case 'tempe':
      return [0, 1].map(() => new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.018), food('#b07a3a', { rough: 0.6, bump: texture('crumb'), bumpScale: 0.006, coat: 0.3 })));
    case 'kerupuk':
      return [lump(0.03, { color: '#f4ead2', jitter: 0.25, sy: 0.12, seed: 4, segments: 14, mat: food('#f2e7cd', { rough: 0.7, bump: texture('crumb'), bumpScale: 0.008 }) })];
    case 'vegMix':
      return [lump(0.02, { color: '#7aa34a', jitter: 0.5, sy: 0.4, seed: 7, segments: 12, mat: food('#79a149', { rough: 0.3, coat: 0.7, bump: texture('crumb'), bumpScale: 0.01 }) }),
        lump(0.014, { color: '#c4874a', jitter: 0.4, sy: 0.5, seed: 2, segments: 10, mat: food('#b97f45', { rough: 0.35, coat: 0.6 }) })];
    case 'sateLilit':
      return [0, 1].map((i) => {
        const g = new THREE.Group();
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.11, 6), food('#bfc78e', { rough: 0.7 }));
        stick.rotation.z = Math.PI / 2;
        const meat = lump(0.011, { color: '#b98140', jitter: 0.12, sx: 3.2, seed: i, segments: 14, mat: food('#b6803f', { rough: 0.45, coat: 0.3, map: texture('char'), bump: texture('crumb'), bumpScale: 0.004 }) });
        meat.position.x = -0.015;
        g.add(stick, meat);
        g.rotation.y = 0.4 + i * 0.25;
        return g;
      });
    case 'acar':
      return side('cucumber', rand);
    default:
      return [];
  }
}

// ---------- Dish kinds ----------
function noodlesPlate(spec) {
  const group = new THREE.Group();
  group.add(plate(0.13, { rim: spec.rim || null, color: spec.plate || '#f6f3ec' }));
  const strands = noodleStrands({ color: spec.noodle, thick: spec.thick || 0.0026, flat: spec.flat, count: spec.count || 56, radius: 0.08, height: 0.042, seed: 4 });
  strands.forEach((s) => group.add(s));
  const items = strands.map((s) => {
    s.geometry.computeBoundingBox();
    const c = s.geometry.boundingBox.getCenter(new THREE.Vector3());
    return { object: s, angle: Math.atan2(c.z, c.x) };
  });
  const tops = scatter(group, spec.toppings || [], { count: spec.toppingCount || 6, radius: 0.07, y: 0.03, dome: 0.012, seed: 9 });
  const sectors = 7;
  const portions = bySector([...items, ...tops], sectors).map((objects) => ({ objects, sound: 'slurp', pick: 'strands' }));
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.05, 0) };
}

function soupBowl(spec) {
  const group = new THREE.Group();
  const vessel = spec.vessel === 'claypot'
    ? bowl(0.085, 0.06, { color: '#4a2c1f', rough: 0.85 })
    : bowl(0.085, 0.06, { color: spec.bowl || '#f4f0e8', pattern: spec.pattern || null });
  group.add(vessel);
  const level = 0.046;
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 40), food(spec.broth, { rough: 0.04, coat: 1, opacity: spec.opacity || 0.86 }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = level;
  const innerAt = vessel.userData.inner;
  surface.scale.setScalar(innerAt(level));
  group.add(surface);
  // Fat droplets on the broth.
  const rand = seeded(13);
  const surfaceScale = innerAt(level);
  for (let i = 0; i < (spec.oil === false ? 0 : 14); i++) {
    // Children of the scaled broth disc: sizes and offsets are in its local units.
    const drop = new THREE.Mesh(new THREE.CircleGeometry((0.002 + rand() * 0.004) / surfaceScale, 12), food('#f7d27a', { rough: 0.05, coat: 1, opacity: 0.5 }));
    const a = rand() * Math.PI * 2;
    const r = rand() * 0.055;
    drop.position.set((Math.cos(a) * r) / surfaceScale, (Math.sin(a) * r) / surfaceScale, 0.0006 / surfaceScale);
    surface.add(drop);
  }
  const floating = [];
  if (spec.noodle) {
    noodleStrands({ color: spec.noodle, thick: spec.thick || 0.0022, count: 22, radius: 0.06, height: 0.01, seed: 8 }).forEach((s) => {
      s.position.y = level - 0.016;
      group.add(s);
      s.geometry.computeBoundingBox();
      const c = s.geometry.boundingBox.getCenter(new THREE.Vector3());
      floating.push({ object: s, angle: Math.atan2(c.z, c.x) });
    });
  }
  (spec.items || []).forEach(([name, count], n) => {
    scatter(group, [name], { count, radius: 0.052, y: level - 0.004, dome: 0.004, seed: 20 + n }).forEach((item) => floating.push(item));
  });
  scatter(group, spec.garnish || [], { count: 7, radius: 0.06, y: level + 0.001, dome: 0, seed: 31 });
  const solids = bySector(floating, 6).filter((objects) => objects.length).map((objects) => ({ objects, sound: spec.noodle ? 'slurp' : 'softchew', pick: spec.noodle ? 'strands' : 'scoop' }));
  const sips = [0, 1, 2].map(() => ({ objects: [], sound: 'slurp', pick: 'broth' }));
  const portions = [];
  solids.forEach((p, i) => {
    portions.push(p);
    if (i % 2 === 1 && sips.length) {
      portions.push(sips.pop());
    }
  });
  portions.push(...sips);
  return {
    group,
    portions,
    hot: true,
    steam: new THREE.Vector3(0, 0.07, 0),
    liquid: {
      mesh: surface,
      top: level,
      bottom: 0.018,
      radiusAt: innerAt,
    },
  };
}

function ricePlate(spec) {
  const group = new THREE.Group();
  if (spec.plate === 'banana') {
    group.add(bananaLeafOnRattan(0.135));
  } else {
    group.add(plate(0.135, { rim: spec.rim || null, color: spec.plateColor || '#f6f3ec' }));
  }
  const rice = riceSectors(0.055, 0.04, spec.rice || '#f7f4ec', 6, 3);
  rice.group.position.set(-0.03, 0.006, 0.01);
  group.add(rice.group);
  const rand = seeded(17);
  const sideObjects = [];
  const sides = spec.sides || [];
  sides.forEach((name, i) => {
    const angle = -0.4 + (i / Math.max(1, sides.length)) * Math.PI * 1.25;
    side(name, rand).forEach((object, j) => {
      object.scale.multiplyScalar(1.35);
      const r = 0.075 + (j % 2) * 0.012;
      object.position.set(Math.cos(angle) * r + (j - 1) * 0.012, 0.012 + (name === 'gulai' ? -0.006 : 0), Math.sin(angle) * r * 0.9 - 0.01);
      group.add(object);
      if (!object.userData.keep) {
        sideObjects.push(object);
      }
    });
  });
  // Each bite: one sector of rice plus (when there is some left) a piece of a side dish.
  const portions = rice.parts.map((part, i) => ({ objects: [part, ...(sideObjects[i] ? [sideObjects[i]] : [])], sound: 'chew', pick: spec.hand ? 'hand' : 'scoop' }));
  sideObjects.slice(rice.parts.length).forEach((object) => portions.push({ objects: [object], sound: 'chew', pick: spec.hand ? 'hand' : 'scoop' }));
  return { group, portions, hot: true, steam: new THREE.Vector3(-0.03, 0.06, 0.01), riceBase: rice.base, riceTotal: rice.parts.length };
}

function skewerPlate(spec) {
  const group = new THREE.Group();
  if (spec.plate === 'banana') {
    group.add(bananaLeafOnRattan(0.14));
  } else {
    group.add(plate(0.14, { color: spec.plateColor || '#f6f3ec', rim: spec.rim || null }));
  }
  const rand = seeded(23);
  const portions = [];
  const count = spec.count || 5;
  const pieceColor = spec.color || '#9b5a2a';
  for (let s = 0; s < count; s++) {
    const skewer = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0022, 0.2, 6), food(spec.piece === 'lilit' ? '#c6cd93' : '#d9c39a', { rough: 0.8 }));
    stick.rotation.z = Math.PI / 2;
    stick.position.x = 0.02;
    skewer.add(stick);
    const pieces = [];
    const n = spec.piece === 'lilit' ? 1 : spec.piece === 'quail' ? 3 : 4;
    for (let i = 0; i < n; i++) {
      let piece;
      if (spec.piece === 'lilit') {
        piece = lump(0.011, { color: pieceColor, jitter: 0.12, sx: 4.2, seed: s + rand(), segments: 16, mat: food(pieceColor, { rough: 0.45, coat: 0.3, map: texture('char'), bump: texture('crumb'), bumpScale: 0.004 }) });
        piece.position.x = -0.035;
      } else if (spec.piece === 'quail') {
        piece = lump(0.0105, { color: '#7a4a24', jitter: 0.02, sx: 1.25, seed: s, segments: 14, mat: food('#7b4a22', { rough: 0.25, coat: 0.9 }) });
        piece.position.x = -0.06 + i * 0.024;
      } else {
        piece = lump(0.008, { color: pieceColor, jitter: 0.22, sx: 1.1, seed: s * 4 + i, segments: 10, mat: food(pieceColor, { rough: 0.4, coat: 0.7, map: texture('char') }) });
        piece.position.x = -0.065 + i * 0.019;
      }
      skewer.add(piece);
      pieces.push(piece);
    }
    skewer.position.set(-0.01 + (rand() - 0.5) * 0.01, 0.014 + s * 0.004, -0.05 + s * 0.022);
    skewer.rotation.y = 0.035 * (s - count / 2);
    group.add(skewer);
    // Bites come off the tip first.
    pieces.slice().reverse().forEach((piece, i) => portions.push({ objects: [piece], sound: spec.piece === 'quail' ? 'softchew' : 'chew', pick: 'skewer', skewer, last: i === pieces.length - 1 }));
  }
  if (spec.sauce) {
    const sauce = lump(0.04, { color: spec.sauce, jitter: 0.06, sy: 0.12, seed: 3, segments: 20, mat: food(spec.sauce, { rough: 0.15, coat: 1, bump: texture('crumb'), bumpScale: 0.004 }) });
    sauce.position.set(0.055, 0.008, 0.05);
    group.add(sauce);
  }
  const extras = [];
  (spec.sides || []).forEach((name) => {
    if (name === 'lontong') {
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.022), food('#eef0d8', { rough: 0.5, coat: 0.2 }));
        l.position.set(0.07 + (i % 2) * 0.006, 0.016, -0.04 + i * 0.026);
        l.rotation.y = i * 0.4;
        group.add(l);
        extras.push(l);
      }
    } else {
      side(name, rand).forEach((object, i) => {
        object.position.set(0.075, 0.012, -0.035 + i * 0.03);
        group.add(object);
      });
    }
  });
  extras.forEach((object, i) => portions.splice(Math.min(portions.length, 2 + i * 3), 0, { objects: [object], sound: 'softchew', pick: 'scoop' }));
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.05, 0) };
}

function slicesPlate(spec) {
  const group = new THREE.Group();
  group.add(plate(0.135, { color: spec.plateColor || '#f6f3ec' }));
  const portions = [];
  const count = spec.count || 7;
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const meat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.026), food(spec.color || '#b9423a', { rough: 0.35, coat: 0.6, map: texture('char') }));
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.0045, 0.004), food(spec.edge || '#4a1d14', { rough: 0.5 }));
    edge.position.z = 0.013;
    g.add(meat, edge);
    const a = -0.9 + i * 0.26;
    g.position.set(Math.cos(a) * 0.05 - 0.01, 0.008 + i * 0.0035, Math.sin(a) * 0.05);
    g.rotation.y = -a + Math.PI / 2;
    g.rotation.z = 0.12;
    group.add(g);
    portions.push({ objects: [g], sound: 'chew', pick: spec.utensil === 'chopsticks' ? 'pinch' : 'scoop' });
  }
  const rand = seeded(5);
  (spec.sides || []).forEach((name, n) => side(name, rand).forEach((object, i) => {
    object.position.set(0.06, 0.012, -0.04 + n * 0.04 + i * 0.012);
    group.add(object);
  }));
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.04, 0) };
}

function steamerDish(spec) {
  const group = new THREE.Group();
  group.add(steamerBasket(0.085));
  const portions = [];
  const count = spec.item === 'bakpao' ? 3 : 4;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.3;
    const r = count === 3 ? 0.038 : 0.04;
    let piece;
    if (spec.item === 'bakpao') {
      piece = lump(0.028, { color: '#fbf7ee', jitter: 0.03, sy: 0.72, seed: i, segments: 20, mat: food('#fbf7ef', { rough: 0.75, sheen: 0.6, bump: texture('crumb'), bumpScale: 0.002 }) });
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 10), food('#d4342c', { rough: 0.5 }));
      dot.rotation.x = -Math.PI / 2;
      dot.position.y = 0.0205;
      piece.add(dot);
      piece.position.set(Math.cos(a) * r, 0.025, Math.sin(a) * r);
    } else if (spec.item === 'hakau') {
      piece = lump(0.018, { color: '#f2eee4', jitter: 0.12, sy: 0.75, sz: 0.65, seed: i, segments: 16, mat: food('#efe9de', { rough: 0.2, coat: 0.8, opacity: 0.88, sheen: 0.5 }) });
      const shrimp = TOPPING.shrimp(seeded(i));
      shrimp.scale.setScalar(0.8);
      piece.add(shrimp);
      piece.position.set(Math.cos(a) * r, 0.018, Math.sin(a) * r);
    } else {
      piece = new THREE.Group();
      const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.026, 18, 1, true), food('#f2d16a', { rough: 0.4, coat: 0.5, side: THREE.DoubleSide }));
      const filling = lump(0.016, { color: '#e9b9a3', jitter: 0.15, sy: 0.9, seed: i, segments: 12, mat: food('#e5b39b', { rough: 0.45, coat: 0.5, bump: texture('crumb'), bumpScale: 0.004 }) });
      filling.position.y = 0.006;
      const roe = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), food('#f07a2a', { rough: 0.3, coat: 0.9 }));
      roe.position.y = 0.02;
      piece.add(wrap, filling, roe);
      piece.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r);
    }
    group.add(piece);
    portions.push({ objects: [piece], sound: 'softchew', pick: 'pinch', bites: spec.item === 'bakpao' ? 2 : 1 });
  }
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.06, 0) };
}

function toastSet() {
  const group = new THREE.Group();
  group.add(plate(0.1, { color: '#f4f1ea', rim: '#3a7d5d' }));
  const portions = [];
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.07, 0);
    shape.lineTo(0, 0.07);
    shape.lineTo(0, 0);
    const slice = (y) => {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2 });
      const m = new THREE.Mesh(geometry, food('#d9a35a', { rough: 0.8, map: texture('char'), bump: texture('crumb'), bumpScale: 0.004 }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = y;
      return m;
    };
    g.add(slice(0.002), slice(0.022));
    const kaya = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.004, 0.045), food('#8e7a2c', { rough: 0.3, coat: 0.7 }));
    kaya.position.set(0.02, 0.016, -0.02);
    const butter = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.02), food('#f6e7a6', { rough: 0.25, coat: 0.6 }));
    butter.position.set(0.018, 0.019, -0.018);
    g.add(kaya, butter);
    g.position.set(i ? 0.004 : -0.04, 0.006, i ? 0.03 : -0.01);
    g.rotation.y = i ? Math.PI : 0.2;
    group.add(g);
    portions.push({ objects: [g], sound: 'crunch', pick: 'hand', bites: 3 });
  }
  return { group, portions, hot: false };
}

function softEggs() {
  const group = new THREE.Group();
  group.add(plate(0.07, { color: '#f4f1ea' }));
  const dish = bowl(0.05, 0.03, { color: '#f4f1ea' });
  dish.position.y = 0.004;
  group.add(dish);
  const soy = new THREE.Mesh(new THREE.CircleGeometry(0.036, 28), food('#3a2310', { rough: 0.05, coat: 1, opacity: 0.85 }));
  soy.rotation.x = -Math.PI / 2;
  soy.position.y = 0.022;
  group.add(soy);
  const portions = [];
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    const white = lump(0.016, { color: '#f7f3e8', jitter: 0.12, sy: 0.35, seed: i + 1, segments: 16, mat: food('#f5f1e6', { rough: 0.15, coat: 0.9, opacity: 0.92 }) });
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 10), food('#f2a01b', { rough: 0.1, coat: 1 }));
    yolk.scale.y = 0.6;
    yolk.position.y = 0.004;
    g.add(white, yolk);
    g.position.set(i ? 0.012 : -0.012, 0.025, i ? 0.006 : -0.006);
    group.add(g);
    portions.push({ objects: [g], sound: 'slurp', pick: 'scoop' });
  }
  // Pepper.
  const rand = seeded(2);
  for (let i = 0; i < 20; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.0008, 4, 3), food('#2a2018'));
    p.position.set((rand() - 0.5) * 0.04, 0.032, (rand() - 0.5) * 0.04);
    group.add(p);
  }
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.04, 0) };
}

function drink(spec) {
  const group = new THREE.Group();
  let liquid = null;
  if (spec.vessel === 'cup') {
    const cup = cupAndSaucer({ liquid: spec.liquid, crema: spec.crema, milk: spec.milk });
    group.add(cup.group);
    liquid = { mesh: cup.surface, top: cup.top, bottom: cup.bottom, radiusAt: cup.radiusAt, circle: true };
  } else {
    const g = glass({ liquid: spec.liquid, height: spec.height || 0.11, foam: spec.foam || null, handle: spec.vessel === 'mug' });
    group.add(g.group);
    liquid = { body: g.body, foam: g.foam, fill: g.fill, bottom: g.bottom };
    if (spec.charcoal) {
      const ember = lump(0.011, { color: '#2a1e18', jitter: 0.35, seed: 3, segments: 10, mat: food('#ff5a1a', { rough: 0.8, emissive: '#ff4a10' }) });
      ember.position.set(0.004, g.fill - 0.012, 0);
      group.add(ember);
      liquid.ember = ember;
    }
    if (spec.ginger) {
      const rand = seeded(4);
      for (let i = 0; i < 4; i++) {
        const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.002, 12), food('#e9c97a', { rough: 0.5, opacity: 0.9 }));
        slice.position.set((rand() - 0.5) * 0.03, 0.02 + rand() * 0.05, (rand() - 0.5) * 0.03);
        slice.rotation.set(rand() * 3, 0, rand() * 3);
        group.add(slice);
      }
    }
  }
  if (spec.specks) {
    const rand = seeded(6);
    for (let i = 0; i < 26; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.0012, 4, 3), food('#2a1a10', { rough: 0.9 }));
      if (liquid.mesh) {
        liquid.mesh.add(p);
        p.position.set((rand() - 0.5) * 0.05, (rand() - 0.5) * 0.05, 0.001);
      }
    }
  }
  const sips = spec.sips || 6;
  const portions = Array.from({ length: sips }, () => ({ objects: [], sound: 'sip', pick: 'cup' }));
  return { group, portions, hot: spec.hot !== false, steam: new THREE.Vector3(0, 0.1, 0), liquid, drink: true };
}

function frittersPlate(spec) {
  const group = new THREE.Group();
  group.add(plate(0.13, { color: '#f4f1ea', rim: '#2f6b8f' }));
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.15), food('#efe6cf', { rough: 0.95, side: THREE.DoubleSide }));
  paper.rotation.x = -Math.PI / 2;
  paper.rotation.z = 0.4;
  paper.position.y = 0.007;
  group.add(paper);
  const portions = [];
  const kinds = spec.items || ['mendoan', 'bakwan', 'tahu'];
  kinds.forEach((kind, i) => {
    let piece;
    if (kind === 'mendoan') {
      piece = lump(0.03, { color: '#c9933f', jitter: 0.12, sy: 0.12, sz: 0.7, seed: i, segments: 18, mat: food('#c4903e', { rough: 0.45, coat: 0.6, bump: texture('crumb'), bumpScale: 0.006 }) });
      const leafBits = lump(0.012, { color: '#3d6a2a', jitter: 0.5, sy: 0.15, seed: 2, segments: 8, mat: food('#3f6b2a', { rough: 0.4, coat: 0.5 }) });
      leafBits.position.y = 0.003;
      piece.add(leafBits);
    } else if (kind === 'bakwan') {
      piece = lump(0.028, { color: '#d39a3c', jitter: 0.45, sy: 0.4, seed: i + 4, segments: 18, mat: food('#cf963a', { rough: 0.5, coat: 0.6, bump: texture('crumb'), bumpScale: 0.012 }) });
    } else {
      piece = lump(0.024, { color: '#d9a44e', jitter: 0.08, sx: 1.1, sy: 0.65, seed: i, segments: 8, mat: food('#d6a14c', { rough: 0.55, coat: 0.5, bump: texture('crumb'), bumpScale: 0.008 }) });
    }
    piece.position.set(-0.04 + i * 0.04, 0.016, (i % 2 ? 0.03 : -0.025));
    piece.rotation.y = i;
    group.add(piece);
    portions.push({ objects: [piece], sound: 'crunch', pick: 'hand', bites: 2 });
  });
  for (let i = 0; i < 3; i++) {
    const chili = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.03, 3, 6), food('#3f8f2a', { rough: 0.2, coat: 1 }));
    chili.rotation.set(Math.PI / 2, i * 0.5, 0);
    chili.position.set(0.07, 0.01, -0.03 + i * 0.012);
    group.add(chili);
  }
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.05, 0) };
}

function martabakPlate() {
  const group = new THREE.Group();
  group.add(plate(0.14, { color: '#f4f1ea' }));
  const portions = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const crust = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), food('#d29b48', { rough: 0.4, coat: 0.6, map: texture('char'), bump: texture('crumb'), bumpScale: 0.004 }));
    const filling = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.0405), food('#d8b06a', { rough: 0.6 }));
    const green = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 0.041), food('#5a8a3a', { rough: 0.5 }));
    green.position.y = 0.002;
    g.add(crust, filling, green);
    g.position.set(-0.042 + (i % 3) * 0.042, 0.016, -0.022 + Math.floor(i / 3) * 0.044);
    group.add(g);
    portions.push({ objects: [g], sound: 'crisp', pick: 'pinch', bites: 2 });
  }
  const rand = seeded(9);
  side('acar', rand).forEach((object, i) => {
    object.position.set(0.09, 0.012, -0.03 + i * 0.025);
    group.add(object);
  });
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.05, 0) };
}

function ballsPlate(spec) {
  const group = new THREE.Group();
  group.add(bananaLeafOnRattan(0.1));
  const rand = seeded(12);
  const portions = [];
  for (let i = 0; i < 5; i++) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.013, 16, 12), food(spec.color || '#5aa046', { rough: 0.45, coat: 0.3 }));
    for (let f = 0; f < 22; f++) {
      const flake = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0008, 0.0012), food('#fbf8f0', { rough: 0.7 }));
      const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).normalize();
      flake.position.copy(dir.multiplyScalar(0.0135));
      flake.lookAt(new THREE.Vector3());
      ball.add(flake);
    }
    const a = (i / 5) * Math.PI * 2;
    ball.position.set(Math.cos(a) * 0.035, 0.022, Math.sin(a) * 0.035);
    group.add(ball);
    portions.push({ objects: [ball], sound: 'softchew', pick: 'pinch' });
  }
  return { group, portions, hot: false };
}

function porridgeBowl(spec) {
  const result = soupBowl({ broth: spec.color, opacity: 1, items: spec.items || [], garnish: spec.garnish || [], oil: false });
  result.liquid.mesh.material = food(spec.color, { rough: 0.5, coat: 0.3, bump: texture('crumb'), bumpScale: 0.004 });
  result.portions = result.portions.map((p) => ({ ...p, sound: 'softchew', pick: p.pick === 'broth' ? 'broth' : 'scoop' }));
  return result;
}

function fishPlate(spec) {
  const group = new THREE.Group();
  group.add(plate(0.15, { color: '#f4f1ea' }));
  const sauce = lump(0.1, { color: spec.sauce || '#e0a338', jitter: 0.04, sy: 0.05, sz: 0.7, seed: 2, segments: 24, mat: food(spec.sauce || '#dd9f33', { rough: 0.1, coat: 1, bump: texture('crumb'), bumpScale: 0.004 }) });
  sauce.position.y = 0.008;
  group.add(sauce);
  const fish = new THREE.Group();
  const body = lump(0.05, { color: '#c98a3a', jitter: 0.03, sx: 1.6, sy: 0.32, sz: 0.55, seed: 5, segments: 20, mat: food('#c78636', { rough: 0.3, coat: 0.8, bump: texture('grain'), bumpScale: 0.003 }) });
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.04, 6), food('#b97a30', { rough: 0.4, coat: 0.6 }));
  tail.rotation.z = Math.PI / 2;
  tail.scale.z = 0.25;
  tail.position.x = 0.095;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), food('#efe8d8', { rough: 0.2, coat: 1 }));
  eye.position.set(-0.062, 0.008, 0.014);
  fish.add(body, tail, eye);
  fish.position.y = 0.018;
  group.add(fish);
  const portions = [];
  // Flakes of fish come off the body; the body shrinks as you eat.
  for (let i = 0; i < 6; i++) {
    const flake = lump(0.012, { color: '#f1e6d2', jitter: 0.3, sy: 0.5, seed: i, segments: 8, mat: food('#efe2c8', { rough: 0.4, coat: 0.5 }) });
    flake.position.set(-0.05 + i * 0.02, 0.03, 0);
    flake.visible = false;
    group.add(flake);
    portions.push({ objects: [flake], sound: 'softchew', pick: 'pinch', shrink: { object: body, step: 0.12 } });
  }
  scatter(group, spec.extras || ['longbean'], { count: 6, radius: 0.1, y: 0.016, dome: 0, seed: 7 });
  return { group, portions, hot: true, steam: new THREE.Vector3(0, 0.05, 0) };
}

const KINDS = {
  noodles: noodlesPlate,
  soup: soupBowl,
  rice: ricePlate,
  skewers: skewerPlate,
  slices: slicesPlate,
  steamer: steamerDish,
  toast: toastSet,
  eggs: softEggs,
  drink,
  fritters: frittersPlate,
  martabak: martabakPlate,
  balls: ballsPlate,
  porridge: porridgeBowl,
  fish: fishPlate,
};

export function buildDish(spec) {
  const make = KINDS[spec.kind] || noodlesPlate;
  const result = make(spec);
  result.group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });
  result.total = result.portions.reduce((sum, p) => sum + (p.bites || 1), 0);
  return result;
}

// A small takeaway parcel (nasi bungkus in paper / daun, or a box) for the counter and the dining table.
export function buildParcel(style = 'paper') {
  const group = new THREE.Group();
  if (style === 'leaf') {
    const parcel = lump(0.05, { color: '#4f8f3f', jitter: 0.06, sy: 0.45, sz: 0.8, seed: 3, segments: 16, mat: food('#4d8a3c', { rough: 0.4, coat: 0.5, map: texture('leaf') }) });
    parcel.position.y = 0.022;
    group.add(parcel);
  } else {
    const parcel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.08), food(style === 'box' ? '#f5f2ea' : '#d9c6a0', { rough: 0.9 }));
    parcel.position.y = 0.0225;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.046, 0.008), food('#d13b2f', { rough: 0.6 }));
    band.position.y = 0.0225;
    group.add(parcel, band);
  }
  return group;
}
