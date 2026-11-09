// The food place and the home for each faith, plus the "annex" added to every sacred place
// (signposts to the food place / home, a guide board, the guide and other visitors).
// Same contract as places.js: { group, spots, spawn, focus, ground, path, restricted } plus
// stalls (hawkers & their stoves), npcs (people), update() (flames, woks) and emitters (steam, smoke).

import * as THREE from '../../vendor/three.module.min.js';
import { mat, box, cyl, sphere, cone, at, lathe, hipRoof, gableRoof, lantern, tree, frangipani, spot, mesh } from './places.js';
import { KEDAI, HOME, TEMPLE_PEOPLE, FAITH_SCENE, dishById, priceLabel } from './cuisine.js';
import { buildParcel } from './dishes.js';
import { karma } from '../karma.js';

// ---------- Shared bits ----------
function signBoard(text, sub = '', { width = 3.2, height = 0.7, background = '#7a1f1a', color = '#f6e7b8', border = '#e0b443' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (height / width));
  const c = canvas.getContext('2d');
  c.fillStyle = background;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = border;
  c.lineWidth = 14;
  c.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const main = Math.round(canvas.height * (sub ? 0.38 : 0.5));
  c.font = `700 ${main}px system-ui, "Noto Sans SC", "Segoe UI", sans-serif`;
  let size = main;
  while (c.measureText(text).width > canvas.width - 60 && size > 20) {
    size -= 4;
    c.font = `700 ${size}px system-ui, "Noto Sans SC", "Segoe UI", sans-serif`;
  }
  c.fillText(text, canvas.width / 2, canvas.height * (sub ? 0.4 : 0.52));
  if (sub) {
    c.font = `600 ${Math.round(canvas.height * 0.2)}px system-ui, "Segoe UI", sans-serif`;
    c.fillText(sub, canvas.width / 2, canvas.height * 0.78);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, side: THREE.DoubleSide }));
  board.userData.noCollide = true;
  return board;
}

function noCollide(object) {
  object.userData.noCollide = true;
  return object;
}

function signpost(label, color = '#6b4a33') {
  const g = new THREE.Group();
  g.add(at(cyl(0.06, 0.07, 2.2, color, 8), 0, 1.1, 0));
  const board = signBoard(label, '', { width: 1.6, height: 0.42, background: '#f3ead9', color: '#3a2a1a', border: color });
  board.position.set(0, 1.95, 0.08);
  g.add(board);
  return g;
}

// Seat: x/z of the stool, facing = direction the sitter looks.
function seatSpot(id, label, table, side, height = 0.46) {
  const sx = table.x + side * 0.85;
  return spot(id, 'sit', label, [table.x, 0.8, table.z], [table.x + side * 1.45, table.z], {
    sitMode: 'meal', table: { x: table.x, z: table.z, top: table.top || 0.76 }, short: label,
    seat: { x: sx, z: table.z, height, facing: side < 0 ? Math.PI / 2 : -Math.PI / 2 },
  });
}

function diningTable(style, colors) {
  const g = new THREE.Group();
  if (style === 'round') {
    g.add(at(cyl(0.58, 0.58, 0.05, colors.top, 28, { roughness: 0.3 }), 0, 0.76, 0));
    g.add(at(cyl(0.06, 0.08, 0.72, colors.leg, 10), 0, 0.37, 0));
    g.add(at(cyl(0.28, 0.32, 0.04, colors.leg, 16), 0, 0.02, 0));
  } else {
    g.add(at(box(1.3, 0.06, 0.8, colors.top, { roughness: 0.4 }), 0, 0.76, 0));
    [[-0.58, -0.34], [0.58, -0.34], [-0.58, 0.34], [0.58, 0.34]].forEach(([x, z]) => g.add(at(box(0.07, 0.74, 0.07, colors.leg), x, 0.37, z)));
  }
  [-1, 1].forEach((side) => {
    const stool = new THREE.Group();
    stool.add(at(cyl(0.2, 0.2, 0.06, colors.stool, 16), 0, 0.45, 0));
    stool.add(at(cyl(0.05, 0.07, 0.42, colors.leg, 8), 0, 0.21, 0));
    g.add(at(stool, side * 0.85, 0, 0));
  });
  return g;
}

// ---------- Cooking stations (one per method) ----------
function station(method, colors) {
  const g = new THREE.Group();
  const rig = {};
  const burner = (ring = 0.36) => {
    const b = new THREE.Group();
    b.add(at(cyl(0.3, 0.32, 0.12, '#3a3a3e', 18, { metalness: 0.6, roughness: 0.5 }), 0, 0.06, 0));
    const flame = cone(0.2, 0.22, '#ff8a2a', 12, { emissive: '#ff6a10', emissiveIntensity: 2.2, transparent: true, opacity: 0.85 });
    flame.position.y = 0.2;
    flame.castShadow = false;
    b.add(flame);
    rig.flame = flame;
    // Flame tongues that lick up around the pan's sides at full heat (the burner itself is hidden
    // under the wok/pot, so without these the fire is invisible from the customer side).
    const tongues = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const tongue = cone(0.05, 0.2, i % 2 ? '#ffb347' : '#ff7a1a', 6, { emissive: i % 2 ? '#ffa030' : '#ff5a10', emissiveIntensity: 2.4, transparent: true, opacity: 0.85 });
      tongue.position.set(Math.cos(angle) * ring, 0.24, Math.sin(angle) * ring);
      tongue.rotation.set(Math.sin(angle) * 0.35, 0, -Math.cos(angle) * 0.35);
      tongue.castShadow = false;
      tongue.userData.phase = i * 1.7;
      tongues.add(tongue);
    }
    tongues.visible = false;
    b.add(tongues);
    rig.tongues = tongues;
    return b;
  };
  switch (method) {
    case 'wok':
    case 'fry':
    case 'griddle': {
      g.add(burner());
      if (method === 'griddle') {
        const plate = cyl(0.42, 0.42, 0.03, '#2a2a2c', 28, { metalness: 0.7, roughness: 0.4 });
        plate.position.y = 0.2;
        g.add(plate);
        rig.wok = plate;
        const dough = cyl(0.26, 0.26, 0.012, '#e8cf9a', 24);
        dough.position.y = 0.222;
        g.add(dough);
        rig.food = dough;
      } else {
        const wok = lathe([[0, 0], [0.18, 0.01], [0.34, 0.1], [0.4, 0.2], [0.38, 0.2], [0.32, 0.11], [0.17, 0.02], [0, 0.015]], '#5b5e64', 28, { metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide });
        wok.position.y = 0.18;
        g.add(wok);
        rig.wok = wok;
        const handle = cyl(0.025, 0.025, 0.3, '#5a3b26', 6);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-0.5, 0.36, 0);
        wok.add(at(handle, -0.5, 0.18, 0));
        const food = sphere(0.2, method === 'fry' ? '#d9a63a' : '#a8723a', 14);
        food.scale.y = 0.25;
        food.position.y = 0.26;
        g.add(food);
        rig.food = food;
        // Pieces that fly up out of the wok with every toss (noodles, greens, chilli, egg).
        const bits = new THREE.Group();
        const bitColors = method === 'fry' ? ['#e0b04a', '#c98a2a', '#f2d16b'] : ['#d9a64a', '#4f8a3a', '#c0392b', '#f2d16b', '#b5763a'];
        for (let i = 0; i < 9; i++) {
          const bit = box(0.07, 0.025, 0.035, bitColors[i % bitColors.length], { roughness: 0.6 });
          bit.castShadow = false;
          bit.userData.phase = i / 9;
          bit.userData.angle = i * 2.4;
          bits.add(bit);
        }
        bits.visible = false;
        g.add(bits);
        rig.bits = bits;
      }
      break;
    }
    case 'stir': {
      const stove = cyl(0.36, 0.4, 0.2, '#6b4a33', 16);
      stove.position.y = 0.1;
      g.add(stove);
      g.add(burner(0.46));
      rig.flame.scale.setScalar(0.7);
      const pot = lathe([[0, 0], [0.32, 0.02], [0.42, 0.2], [0.44, 0.36], [0.42, 0.36], [0.4, 0.21], [0.31, 0.04], [0, 0.03]], '#62656b', 28, { metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
      pot.position.y = 0.2;
      g.add(pot);
      const stew = cyl(0.39, 0.39, 0.02, colors.stew || '#6a3518', 24, { roughness: 0.2 });
      stew.position.y = 0.52;
      g.add(stew);
      rig.food = stew;
      const bubbles = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const bubble = sphere(0.035, colors.stew || '#6a3518', 8, { roughness: 0.15 });
        bubble.position.set(Math.cos(i * 2.2) * 0.22 * ((i % 3) / 2 + 0.3), 0.535, Math.sin(i * 2.2) * 0.22 * ((i % 3) / 2 + 0.3));
        bubble.castShadow = false;
        bubble.userData.phase = i * 0.37;
        bubbles.add(bubble);
      }
      g.add(bubbles);
      rig.bubbles = bubbles;
      break;
    }
    case 'grill':
    case 'smoke':
    case 'toast': {
      const grill = box(1.0, 0.22, 0.38, '#3a3a3e', { metalness: 0.5, roughness: 0.6 });
      grill.position.y = 0.11;
      g.add(grill);
      const coals = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const coal = box(0.09, 0.05, 0.09, '#ff5a1a', { emissive: '#ff3a00', emissiveIntensity: 1.2 });
        coal.position.set(-0.42 + (i % 7) * 0.14, 0.24, i < 7 ? -0.08 : 0.08);
        coal.rotation.y = i;
        coal.castShadow = false;
        coals.add(coal);
      }
      g.add(coals);
      rig.coals = coals;
      if (method === 'toast') {
        for (let i = 0; i < 3; i++) {
          g.add(at(box(0.16, 0.025, 0.16, '#d9a35a'), -0.25 + i * 0.25, 0.3, 0));
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const skewer = new THREE.Group();
          skewer.add(at(box(0.5, 0.012, 0.012, '#d9c39a'), 0, 0, 0));
          for (let p = 0; p < 4; p++) {
            skewer.add(at(sphere(0.03, method === 'smoke' ? '#9a3a2a' : '#8a4a22', 6), -0.12 + p * 0.06, 0, 0));
          }
          skewer.position.set(0.05, 0.3, -0.15 + i * 0.043);
          skewer.rotation.y = Math.PI / 2;
          skewer.scale.set(0.6, 1, 1);
          g.add(skewer);
        }
      }
      break;
    }
    case 'steam': {
      g.add(burner(0.34));
      rig.flame.scale.setScalar(0.6);
      g.add(at(cyl(0.32, 0.3, 0.22, '#9aa0a6', 20, { metalness: 0.6 }), 0, 0.25, 0));
      for (let i = 0; i < 3; i++) {
        g.add(at(cyl(0.3, 0.3, 0.13, '#d4b07a', 20), 0, 0.42 + i * 0.13, 0));
      }
      const lid = lathe([[0, 0.12], [0.18, 0.1], [0.3, 0.02], [0.31, 0]], '#c9a46a', 20);
      lid.position.y = 0.77;
      g.add(lid);
      rig.lid = lid;
      break;
    }
    case 'pour': {
      const stove = box(0.5, 0.18, 0.4, '#5a4a3a');
      stove.position.y = 0.09;
      g.add(stove);
      const kettle = sphere(0.2, '#c8ccd0', 16, { metalness: 0.75, roughness: 0.3 });
      kettle.scale.y = 1.1;
      kettle.position.y = 0.38;
      g.add(kettle);
      const spout = cone(0.04, 0.3, '#c8ccd0', 8, { metalness: 0.75 });
      spout.rotation.z = -1.2;
      spout.position.set(0.24, 0.45, 0);
      g.add(spout);
      // Cloth coffee "sock" hanging on a frame.
      g.add(at(cyl(0.012, 0.012, 0.6, '#6b4a33', 5), 0.45, 0.3, 0));
      g.add(at(cone(0.08, 0.22, '#d9c7a0', 10), 0.45, 0.48, 0));
      for (let i = 0; i < 4; i++) {
        g.add(at(cyl(0.045, 0.04, 0.1, '#f4f1ea', 10), -0.35 + (i % 2) * 0.1, 0.05, -0.12 + Math.floor(i / 2) * 0.12));
      }
      rig.kettle = kettle;
      break;
    }
    case 'chop':
    default: {
      g.add(at(cyl(0.3, 0.3, 0.12, '#a87a4a', 22), 0, 0.06, 0));
      const meat = sphere(0.12, colors.chop || '#f2e2c6', 10);
      meat.scale.set(1.2, 0.5, 0.8);
      meat.position.y = 0.16;
      g.add(meat);
      rig.food = meat;
      break;
    }
  }
  g.traverse((o) => {
    o.userData.noCollide = true;
  });
  return { group: g, rig };
}

// ---------- Food place ----------
const KEDAI_STYLE = {
  pecinan: { ground: '#bdb4a6', floor: '#d6cbbb', roof: '#8a2a22', column: '#b8322b', counter: '#8a2a22', counterTop: '#efe9df', back: '#e9dfcf', sign: ['#7a1f1a', '#f6e7b8', '#e0b443'], table: { top: '#f1efea', leg: '#3a3a3e', stool: '#b8322b' }, tableShape: 'round' },
  kopitiam: { ground: '#c4bba9', floor: '#e5dfd0', roof: '#3f6a5a', column: '#ece6d6', counter: '#4f7a68', counterTop: '#f1efea', back: '#f3ead9', sign: ['#2f5a4a', '#f3ead9', '#d8b14a'], table: { top: '#f4f2ee', leg: '#2f2f33', stool: '#6b4a33' }, tableShape: 'round' },
  padang: { ground: '#c9bfa8', floor: '#ddd2bc', roof: '#3a2f2a', column: '#7a2b22', counter: '#f2efe6', counterTop: '#d9d2c4', back: '#f0e7d6', sign: ['#1f6a3a', '#ffffff', '#e0b443'], table: { top: '#e8dcc0', leg: '#6b4a33', stool: '#7a5236' }, tableShape: 'rect' },
  bali: { ground: '#a9b48c', floor: '#cbb894', roof: '#8a7448', column: '#6b4a33', counter: '#8a6a4e', counterTop: '#b99a72', back: '#e7dcc4', sign: ['#2f4a2a', '#f3ead9', '#c99a3a'], table: { top: '#c9a46a', leg: '#6b4a33', stool: '#8a6a4e' }, tableShape: 'rect' },
  lapo: { ground: '#b5aa96', floor: '#c9bea8', roof: '#4a1f18', column: '#2b2320', counter: '#3a2a22', counterTop: '#6b4a33', back: '#e9dfcf', sign: ['#1f1a18', '#ffffff', '#b8322b'], table: { top: '#5a3a24', leg: '#2b2320', stool: '#3a2a22' }, tableShape: 'rect' },
  flores: { ground: '#b3a688', floor: '#c8b490', roof: '#7a6a48', column: '#5a3a24', counter: '#6b4a33', counterTop: '#8a6a4e', back: '#e9dcc4', sign: ['#4a2a5a', '#f3ead9', '#d8b14a'], table: { top: '#8a5f3c', leg: '#5a3a24', stool: '#6b4a33' }, tableShape: 'rect' },
  angkringan: { ground: '#a39a84', floor: '#b8ad95', roof: '#c9572f', column: '#6b4a33', counter: '#8a5a32', counterTop: '#a8743e', back: '#d9cdb4', sign: ['#2a2a2a', '#f6e7b8', '#c9572f'], table: { top: '#8a5f3c', leg: '#5a3a24', stool: '#6b4a33' }, tableShape: 'rect' },
};

function kedaiDecor(g, style, s) {
  if (style === 'pecinan' || style === 'kopitiam') {
    for (let i = -3; i <= 3; i++) {
      const l = lantern(style === 'pecinan' ? '#d8352a' : '#e0a33a');
      l.position.set(i * 2.8, 3.1, -4);
      noCollide(l);
      g.add(l);
    }
  }
  if (style === 'kopitiam') {
    [-4, 4].forEach((x) => {
      const fan = new THREE.Group();
      fan.add(at(cyl(0.05, 0.05, 0.4, '#3a3a3e', 6), 0, 0.2, 0));
      for (let b = 0; b < 3; b++) {
        const blade = box(0.9, 0.02, 0.14, '#5a4a3a');
        blade.rotation.y = (b / 3) * Math.PI * 2;
        blade.position.y = 0;
        fan.add(blade);
      }
      fan.position.set(x, 3.25, -1);
      noCollide(fan);
      fan.userData.spin = true;
      g.add(fan);
    });
  }
  if (style === 'padang') {
    // Gonjong: the upswept horn ridges of a Minangkabau roof over the front.
    [-6, 0, 6].forEach((x) => {
      [-1, 1].forEach((side) => {
        const horn = cone(0.18, 1.6, '#3a2f2a', 6);
        horn.rotation.z = side * 0.9;
        horn.position.set(x + side * 1.4, 4.6, -8.8);
        noCollide(horn);
        g.add(horn);
      });
    });
  }
  if (style === 'bali') {
    [-9.5, 9.5].forEach((x) => {
      const penjor = new THREE.Group();
      const pole = cyl(0.05, 0.08, 6, '#c9b06a', 6);
      pole.position.y = 3;
      pole.rotation.z = x > 0 ? -0.25 : 0.25;
      penjor.add(pole);
      const tip = sphere(0.25, '#e9d48a', 8);
      tip.position.set(x > 0 ? -1.4 : 1.4, 5.8, 0);
      penjor.add(tip);
      penjor.position.set(x, 0, 6);
      noCollide(penjor);
      g.add(penjor);
    });
    g.add(at(frangipani(1), -11, 0, 3), at(frangipani(0.9), 11, 0, 2));
  }
  if (style === 'lapo') {
    // Gorga-style painted band in red, black and white along the eaves.
    for (let i = 0; i < 20; i++) {
      const tile = box(1.0, 0.3, 0.05, ['#b8322b', '#1f1a18', '#f3ead9'][i % 3]);
      tile.position.set(-9.5 + i * 1.0, 3.55, 1.6);
      noCollide(tile);
      g.add(tile);
    }
  }
  if (style === 'flores') {
    // Ikat cloth banners.
    [-7.5, 7.5].forEach((x) => {
      const ikat = box(1.2, 1.8, 0.04, '#7a3a2a');
      ikat.position.set(x, 2.4, -10.2);
      noCollide(ikat);
      g.add(ikat);
      for (let i = 0; i < 6; i++) {
        const stripe = box(1.2, 0.08, 0.05, i % 2 ? '#d8b14a' : '#2a2a4a');
        stripe.position.set(x, 1.7 + i * 0.25, -10.17);
        noCollide(stripe);
        g.add(stripe);
      }
    });
  }
  if (style === 'angkringan') {
    // String lights.
    for (let i = 0; i < 16; i++) {
      const bulb = sphere(0.07, '#ffe7a8', 6, { emissive: '#ffd27a', emissiveIntensity: 1.6 });
      bulb.position.set(-9 + i * 1.2, 3.2 + Math.sin(i * 0.8) * 0.12, 1.4);
      bulb.castShadow = false;
      noCollide(bulb);
      g.add(bulb);
    }
    g.add(at(tree(1.2, '#4f8a4f'), -11, 0, 4), at(tree(1, '#5f8f55'), 11.5, 0, 0));
  }
}

// ---------- Food court surroundings: floor, walls, menus, lamps, the street outside ----------
// Deterministic pseudo-random numbers so every visit builds the same street.
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shade(color, factor) {
  return `#${new THREE.Color(color).multiplyScalar(factor).getHexString()}`;
}

// Ribbed roof sheeting (zinc / clay tile rows) seen from above: each rib is a lit crest fading into a
// shaded trough, tinted from the venue's roof colour but lifted so even near-black roofs show form.
function roofSheetTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const c = canvas.getContext('2d');
  const base = new THREE.Color(color);
  const lift = Math.max(1.15, 0.42 / Math.max(0.05, base.getHSL({}).l));
  const crest = shade(color, Math.min(lift * 1.3, 3.6));
  const mid = shade(color, Math.min(lift, 2.8));
  const trough = shade(color, Math.min(lift * 0.62, 1.8));
  const ribs = 8;
  const pitch = canvas.height / ribs;
  for (let i = 0; i < ribs; i++) {
    const y = i * pitch;
    const gradient = c.createLinearGradient(0, y, 0, y + pitch);
    gradient.addColorStop(0, trough);
    gradient.addColorStop(0.35, crest);
    gradient.addColorStop(0.6, mid);
    gradient.addColorStop(1, trough);
    c.fillStyle = gradient;
    c.fillRect(0, y, canvas.width, pitch);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 3.2);
  return texture;
}

const FLOOR_PATTERN = {
  pecinan: { kind: 'checker', a: '#eadfc8', b: '#b5523b', n: 4 },
  kopitiam: { kind: 'checker', a: '#f1ece0', b: '#3d3d42', n: 8 },
  padang: { kind: 'grid', a: '#ebe2d1', b: '#bfb39c', n: 4 },
  bali: { kind: 'stone', a: '#c1b394', b: '#8d8068', n: 5 },
  lapo: { kind: 'planks', a: '#7a5638', b: '#4a3322', n: 8 },
  flores: { kind: 'planks', a: '#8f6d4a', b: '#5a4026', n: 8 },
  angkringan: { kind: 'brick', a: '#a8644a', b: '#d1c3a8', n: 8 },
};

function patternTexture(pattern, repeatX, repeatY) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const c = canvas.getContext('2d');
  const random = seeded(7);
  c.fillStyle = pattern.a;
  c.fillRect(0, 0, 256, 256);
  const cell = 256 / pattern.n;
  if (pattern.kind === 'checker') {
    c.fillStyle = pattern.b;
    for (let i = 0; i < pattern.n; i++) {
      for (let j = 0; j < pattern.n; j++) {
        if ((i + j) % 2) {
          c.fillRect(i * cell, j * cell, cell, cell);
        }
      }
    }
  } else if (pattern.kind === 'grid') {
    c.fillStyle = pattern.b;
    for (let i = 0; i <= pattern.n; i++) {
      c.fillRect(i * cell - 2, 0, 4, 256);
      c.fillRect(0, i * cell - 2, 256, 4);
    }
  } else if (pattern.kind === 'planks') {
    for (let row = 0; row < pattern.n; row++) {
      c.fillStyle = shade(pattern.a, 0.88 + random() * 0.24);
      c.fillRect(0, row * cell, 256, cell);
      c.fillStyle = pattern.b;
      c.fillRect(0, row * cell, 256, 2);
      const joint = (row % 2) * 128 + random() * 40;
      c.fillRect(joint % 256, row * cell, 3, cell);
    }
  } else if (pattern.kind === 'brick') {
    c.fillStyle = pattern.b;
    c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < pattern.n; row++) {
      for (let col = -1; col < 4; col++) {
        c.fillStyle = shade(pattern.a, 0.85 + random() * 0.3);
        c.fillRect(col * 64 + (row % 2) * 32 + 2, row * cell + 2, 60, cell - 4);
      }
    }
  } else if (pattern.kind === 'stone') {
    c.fillStyle = pattern.b;
    c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < pattern.n; row++) {
      let x = -random() * 30;
      while (x < 256) {
        const w = 30 + random() * 40;
        c.fillStyle = shade(pattern.a, 0.85 + random() * 0.3);
        c.fillRect(x + 2, row * cell + 2, w - 4, cell - 4);
        x += w;
      }
    }
  }
  // Light speckle so large surfaces don't look like flat plastic.
  for (let i = 0; i < 900; i++) {
    c.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    c.fillRect(random() * 256, random() * 256, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

function floorSlab(style, s) {
  const pattern = FLOOR_PATTERN[style] || FLOOR_PATTERN.angkringan;
  const material = new THREE.MeshStandardMaterial({ map: patternTexture(pattern, 10.5, 7), roughness: pattern.kind === 'checker' || pattern.kind === 'grid' ? 0.45 : 0.8 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(21, 0.05, 14), [mat(s.floor), mat(s.floor), material, mat(s.floor), mat(s.floor), mat(s.floor)]);
  slab.receiveShadow = true;
  slab.position.set(0, 0.025, -3.5);
  return slab;
}

// The glass case on each counter: plates of today's food (Padang: the famous stacked-plate window).
const CASE_FOOD = ['#6b3418', '#e3a23a', '#3f7a33', '#c8341f', '#f2d16b', '#b5763a'];
function displayCase(g, style, cx, cz, index) {
  const padang = style === 'padang';
  const height = padang ? 0.85 : 0.5;
  const glass = box(1.3, height, 0.55, '#e6f3f6', { transparent: true, opacity: 0.22, roughness: 0.05 });
  glass.position.set(cx, 1.06 + height / 2, cz);
  glass.castShadow = false;
  g.add(noCollide(glass));
  g.add(noCollide(at(box(1.34, 0.03, 0.58, '#d9d4c8', { metalness: 0.3 }), cx, 1.06 + height, cz)));
  const plate = (x, y, z, color) => {
    g.add(noCollide(at(cyl(0.12, 0.09, 0.025, '#f7f5ef', 16, { roughness: 0.3 }), x, y, z)));
    const mound = sphere(0.085, color, 10, { roughness: 0.55 });
    mound.scale.y = 0.5;
    mound.position.set(x, y + 0.03, z);
    g.add(noCollide(mound));
  };
  if (padang) {
    // Rows of plates stacked into a pyramid behind the glass.
    [4, 3, 2].forEach((count, tier) => {
      for (let i = 0; i < count; i++) {
        const x = cx + (i - (count - 1) / 2) * 0.28;
        plate(x, 1.1 + tier * 0.22, cz + 0.05 - tier * 0.06, CASE_FOOD[(i + tier * 2 + index) % CASE_FOOD.length]);
      }
    });
  } else {
    for (let i = 0; i < 5; i++) {
      plate(cx - 0.42 + (i % 3) * 0.42, 1.1 + Math.floor(i / 3) * 0.22, cz + (i < 3 ? 0.08 : -0.08), CASE_FOOD[(i + index) % CASE_FOOD.length]);
    }
  }
}

function canvasBoard(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round(512 * (height / width));
  draw(canvas.getContext('2d'), canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }));
  board.userData.noCollide = true;
  return board;
}

// Menu board on the wall behind the cook: dish names and prices.
function menuBoard(stallDef, sign) {
  const dishes = (stallDef.dishes || []).map((id) => dishById(id)).filter(Boolean);
  return canvasBoard(2.5, 0.95, (c, w, h) => {
    c.fillStyle = '#26302b';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = sign[2];
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#f3ead9';
    c.font = '700 30px system-ui, "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('MENU', w / 2, 40);
    c.font = '600 24px system-ui, "Segoe UI", sans-serif';
    dishes.slice(0, 4).forEach((dish, i) => {
      const y = 78 + i * 34;
      c.textAlign = 'left';
      c.fillText(dish.name.slice(0, 24), 24, y);
      c.textAlign = 'right';
      c.fillText(dish.price ? priceLabel(dish.price) : '-', w - 24, y);
    });
  });
}

const STREET_NAMES = {
  pecinan: ['TOKO OBAT 德生堂', 'TOKO EMAS 金城', 'KUE BULAN 福興', 'TOKO KAIN 和成', 'TEH 香茗', 'BAKPIA 信'],
  kopitiam: ['TOKO BUKU', 'APOTEK', 'KELONTONG', 'TOKO SEPATU', 'PENJAHIT', 'FOTO STUDIO'],
  padang: ['TOKO KAIN', 'KONVEKSI', 'TOKO EMAS', 'FOTOKOPI', 'BENGKEL', 'KELONTONG'],
  lapo: ['TOKO ULOS', 'KEDAI KOPI', 'BENGKEL', 'APOTEK', 'TOKO BUKU', 'KELONTONG'],
};
const STREET_COLORS = ['#e8dcc4', '#d9c39a', '#c9d6cf', '#e6c9b5', '#f0e6d2', '#cfd8e0', '#e3d2a8'];

// Shophouse (ruko) front: shop sign and shutter below, two floors of windows above.
function facadeTexture(name, body, accent, random) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const c = canvas.getContext('2d');
  c.fillStyle = body;
  c.fillRect(0, 0, 256, 384);
  c.fillStyle = shade(body, 0.8);
  c.fillRect(0, 0, 256, 14);
  // Upper floors.
  for (let floor = 0; floor < 2; floor++) {
    for (let col = 0; col < 3; col++) {
      const x = 22 + col * 78;
      const y = 34 + floor * 92;
      c.fillStyle = shade(body, 0.7);
      c.fillRect(x - 4, y - 4, 60, 70);
      c.fillStyle = random() > 0.3 ? '#3b4650' : '#f2d99a';
      c.fillRect(x, y, 52, 62);
      c.fillStyle = shade(body, 0.95);
      c.fillRect(x + 24, y, 4, 62);
    }
  }
  // Shop sign band.
  c.fillStyle = accent;
  c.fillRect(8, 222, 240, 44);
  c.fillStyle = '#ffffff';
  c.font = '700 22px system-ui, "Noto Sans SC", "Segoe UI", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(name, 128, 245);
  // Shopfront: half-open rolling shutter over a lit interior.
  c.fillStyle = '#e9cf98';
  c.fillRect(16, 276, 224, 108);
  c.fillStyle = '#9aa0a6';
  c.fillRect(16, 276, 224, 46 + random() * 30);
  c.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 278; y < 320; y += 6) {
    c.fillRect(16, y, 224, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function streetRing(g, style) {
  const random = seeded(style.length * 97 + 13);
  const names = STREET_NAMES[style];
  const accents = style === 'pecinan' ? ['#b8322b', '#8a2a22', '#c9572f'] : ['#1f6a3a', '#2f4a6a', '#b8322b', '#6b4a33'];
  const textures = names.map((name, i) => facadeTexture(name, STREET_COLORS[(i * 3) % STREET_COLORS.length], accents[i % accents.length], random));
  const radius = 25;
  let angle = 0;
  let i = 0;
  while (angle < Math.PI * 2 - 0.15) {
    const width = 5.5 + random() * 2;
    const height = 6 + random() * 3;
    const step = width / radius;
    const a = angle + step / 2;
    const body = STREET_COLORS[i % STREET_COLORS.length];
    const front = new THREE.MeshStandardMaterial({ map: textures[i % textures.length], roughness: 0.85 });
    const plain = mat(shade(body, 0.85));
    const building = new THREE.Mesh(new THREE.BoxGeometry(width - 0.15, height, 4), [plain, plain, mat(shade(body, 0.6)), plain, plain, front]);
    building.position.set(Math.sin(a) * radius, height / 2, Math.cos(a) * radius);
    building.rotation.y = a;
    building.userData.noCollide = true;
    g.add(building);
    if (style === 'pecinan' && i % 2 === 0) {
      const l = lantern('#d8352a');
      l.position.set(Math.sin(a) * (radius - 2.3), 2.6, Math.cos(a) * (radius - 2.3));
      noCollide(l);
      g.add(l);
    }
    angle += step;
    i++;
  }
}

function villageRing(g, style) {
  const random = seeded(style.length * 31 + 5);
  const greens = ['#4f8a4f', '#5f8f55', '#3f7a45', '#6a9a5a'];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + random() * 0.1;
    const r = 23 + random() * 6;
    const t = style === 'bali' && i % 4 === 0 ? frangipani(1.1 + random() * 0.4) : tree(1.1 + random() * 0.8, greens[i % greens.length]);
    t.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
    noCollide(t);
    g.add(t);
  }
  // A few village houses between the trees.
  const roofColor = style === 'bali' ? '#3a332c' : style === 'flores' ? '#7a6a48' : '#a5512f';
  [-0.6, -0.25, 0.25, 0.6, Math.PI - 0.5, Math.PI + 0.5].forEach((offset, i) => {
    const a = Math.PI + offset;
    const house = new THREE.Group();
    house.add(at(box(4.2, 2.6, 3.4, i % 2 ? '#e7dcc4' : '#d9c7a0'), 0, 1.3, 0));
    house.add(at(box(0.9, 1.7, 0.05, '#6b4a33'), 0, 0.85, 1.72));
    house.add(at(hipRoof(4.8, 4, 1.4, roofColor, null), 0, 2.6, 0));
    house.position.set(Math.sin(a) * 26, 0, Math.cos(a) * 26);
    house.rotation.y = a + Math.PI;
    noCollide(house);
    g.add(house);
  });
}

function kedaiSurroundings(g, def, s, emitters) {
  const style = def.style;
  const urban = ['pecinan', 'kopitiam', 'padang', 'lapo'].includes(style);
  // Side walls (full height in town, waist-high in the open-air styles) with a darker dado band.
  const dado = shade(s.back, 0.78);
  [-1, 1].forEach((side) => {
    const height = urban ? 3.6 : 1.0;
    g.add(at(box(0.25, height, 7.8, s.back), side * 10.55, height / 2, -6.5));
    g.add(noCollide(at(box(0.03, Math.min(1.0, height), 7.8, dado), side * 10.41, Math.min(1.0, height) / 2, -6.5)));
  });
  g.add(noCollide(at(box(21, 1.0, 0.03, dado), 0, 0.5, -10.26)));
  // Menus and a shelf of jars behind each cook.
  const xs = [-6.2, 0, 6.2];
  def.stalls.forEach((stallDef, index) => {
    const x = xs[index];
    const menu = menuBoard(stallDef, s.sign);
    menu.position.set(x + 0.45, 2.3, -10.25);
    g.add(menu);
    g.add(noCollide(at(box(1.3, 0.04, 0.26, '#6b4a33'), x - 1.05, 1.62, -10.14)));
    for (let j = 0; j < 4; j++) {
      const jar = cyl(0.07, 0.07, 0.2 + (j % 2) * 0.06, ['#c8341f', '#e3a23a', '#f3ead9', '#3f7a33'][(j + index) % 4], 10, { roughness: 0.4 });
      jar.position.set(x - 1.5 + j * 0.3, 1.74 + (j % 2) * 0.03, -10.14);
      g.add(noCollide(jar));
    }
    if (style === 'padang' || style === 'angkringan') {
      // Blek kerupuk: the square crackers tin on the counter.
      const tin = new THREE.Group();
      tin.add(at(box(0.26, 0.36, 0.26, '#d9d4c8', { metalness: 0.3, roughness: 0.4 }), 0, 0.18, 0));
      tin.add(at(box(0.2, 0.2, 0.012, '#f3e6b0', { transparent: true, opacity: 0.85 }), 0, 0.2, 0.135));
      tin.add(at(box(0.27, 0.03, 0.27, '#c8341f'), 0, 0.37, 0));
      tin.position.set(x - 1.6, 1.06, -7.15);
      g.add(noCollide(tin));
    }
    if (style === 'bali') {
      // Canang sari on the counter corner.
      const canang = new THREE.Group();
      canang.add(at(box(0.18, 0.03, 0.18, '#7fae4a'), 0, 0.015, 0));
      ['#f2d16b', '#c8341f', '#f7f4ec', '#8a3aa8'].forEach((color, k) => canang.add(at(sphere(0.03, color, 6), (k % 2 - 0.5) * 0.08, 0.05, (Math.floor(k / 2) - 0.5) * 0.08)));
      canang.position.set(x - 1.6, 1.07, -7.05);
      g.add(noCollide(canang));
    }
  });
  // Warm pendant lamps over the tables, and one warm light over the stalls.
  if (style !== 'angkringan') {
    [[-3.6, -2.8], [3.6, -2.8], [-3.6, 1.0], [3.6, 1.0], [-7.8, -1.0], [7.8, -1.0]].forEach(([x, z]) => {
      const lamp = new THREE.Group();
      lamp.add(at(cyl(0.008, 0.008, 0.9, '#2a2a2a', 4), 0, 3.15, 0));
      lamp.add(at(cone(0.22, 0.2, style === 'pecinan' ? '#b8322b' : '#3f5a4a', 16, { side: THREE.DoubleSide }), 0, 2.62, 0));
      const bulb = sphere(0.07, '#fff1c9', 8, { emissive: '#ffd98a', emissiveIntensity: 2.2 });
      bulb.position.y = 2.5;
      bulb.castShadow = false;
      lamp.add(bulb);
      lamp.position.set(x, 0, z);
      noCollide(lamp);
      g.add(lamp);
    });
  }
  const warm = new THREE.PointLight('#ffcf8a', 14, 16, 1.4);
  warm.position.set(0, 3.2, -6.0);
  g.add(warm);

  // Style anchors.
  if (style === 'pecinan') {
    // Small altar to Tian and the ancestors between two stalls: tablet, censer, incense, candles, oranges.
    const altar = new THREE.Group();
    altar.add(at(box(0.95, 0.85, 0.45, '#8a1f1a'), 0, 0.425, 0));
    altar.add(at(box(1.0, 0.04, 0.5, '#d8a63a'), 0, 0.87, 0));
    const tablet = signBoard('天', '', { width: 0.3, height: 0.5, background: '#b8322b', color: '#f3d36b', border: '#f3d36b' });
    tablet.position.set(0, 1.18, -0.14);
    altar.add(tablet);
    altar.add(at(cyl(0.1, 0.08, 0.12, '#b8913f', 14, { metalness: 0.5, roughness: 0.4 }), 0, 0.95, 0.08));
    [-0.03, 0, 0.03].forEach((dx) => {
      altar.add(at(cyl(0.005, 0.005, 0.26, '#b8322b', 4), dx, 1.13, 0.08));
      const tip = sphere(0.009, '#ff7a2a', 4, { emissive: '#ff5a10', emissiveIntensity: 2 });
      tip.position.set(dx, 1.26, 0.08);
      altar.add(tip);
    });
    [-0.34, 0.34].forEach((dx) => {
      altar.add(at(cyl(0.035, 0.035, 0.22, '#c8341f', 8), dx, 1.0, 0.05));
      const flame = cone(0.02, 0.05, '#ffb347', 6, { emissive: '#ff9a2a', emissiveIntensity: 2 });
      flame.position.set(dx, 1.14, 0.05);
      altar.add(flame);
    });
    for (let k = 0; k < 5; k++) {
      altar.add(at(sphere(0.045, '#f08a1a', 8), 0.2 + (k % 3) * 0.06 - 0.06, 0.93 + Math.floor(k / 3) * 0.06, 0.12));
    }
    altar.position.set(-3.1, 0, -10.0);
    noCollide(altar);
    g.add(altar);
    emitters.push({ at: new THREE.Vector3(-3.1, 1.3, -9.92), opts: { color: '#d9d4cc', size: 0.12, rate: 2, life: 3, rise: 0.25, spread: 0.05, duration: 1e9, count: 10 } });
    const fu = signBoard('福', '', { width: 0.6, height: 0.6, background: '#c8241f', color: '#f3d36b', border: '#f3d36b' });
    fu.position.set(3.1, 2.3, -10.25);
    fu.rotation.z = Math.PI / 4;
    g.add(fu);
  } else if (style === 'kopitiam') {
    const clock = new THREE.Group();
    clock.add(at(cyl(0.3, 0.3, 0.05, '#5a3b26', 24), 0, 0, 0));
    clock.add(at(cyl(0.26, 0.26, 0.055, '#f6f1e4', 24), 0, 0, 0));
    clock.add(at(box(0.02, 0.18, 0.06, '#1f1f22'), 0, 0.07, 0));
    clock.rotation.x = Math.PI / 2;
    clock.position.set(-3.1, 2.6, -10.22);
    noCollide(clock);
    g.add(clock);
    [[2.75, 2.3, '#c9a46a'], [3.45, 2.1, '#8aa0a8']].forEach(([fx, fy, color]) => {
      g.add(noCollide(at(box(0.55, 0.7, 0.04, '#3a2a1a'), fx, fy, -10.24)));
      g.add(noCollide(at(box(0.45, 0.6, 0.045, color), fx, fy, -10.23)));
    });
  } else if (style === 'bali') {
    // Pelinggih (small shrine) in the corner of the yard.
    const shrine = new THREE.Group();
    shrine.add(at(box(0.9, 0.5, 0.9, '#8d8068'), 0, 0.25, 0));
    shrine.add(at(box(0.35, 1.2, 0.35, '#b5a585'), 0, 1.1, 0));
    shrine.add(at(box(0.7, 0.5, 0.7, '#9a7a4a'), 0, 1.95, 0));
    shrine.add(at(hipRoof(0.95, 0.95, 0.6, '#2a2622', null), 0, 2.2, 0));
    shrine.add(at(box(0.5, 0.3, 0.02, '#f7f4ec'), 0, 1.0, 0.18));
    shrine.add(at(box(0.5, 0.3, 0.021, '#1f1f22'), 0, 0.85, 0.181));
    shrine.position.set(-9.6, 0, -9.4);
    g.add(shrine);
  } else if (style === 'lapo') {
    [-3.1, 3.1].forEach((x) => {
      g.add(noCollide(at(box(0.7, 1.6, 0.03, '#7a1f1a'), x, 2.0, -10.24)));
      for (let k = 0; k < 7; k++) {
        g.add(noCollide(at(box(0.7, 0.05, 0.035, k % 2 ? '#f3ead9' : '#1f1a18'), x, 1.35 + k * 0.2, -10.23)));
      }
    });
  } else if (style === 'flores') {
    [-3.1, 3.1].forEach((x) => {
      const sack = new THREE.Group();
      sack.add(at(cyl(0.25, 0.3, 0.7, '#c9b48a', 10), 0, 0.35, 0));
      sack.add(at(cyl(0.2, 0.25, 0.6, '#b9a47a', 10), 0.45, 0.3, 0.1));
      sack.position.set(x, 0, -9.9);
      g.add(sack);
    });
  } else if (style === 'angkringan') {
    // The gerobak: a wooden cart with a tarp, kettles on the charcoal brazier, rice packets.
    const cart = new THREE.Group();
    cart.add(at(box(1.8, 0.8, 0.8, '#8a5a32'), 0, 0.7, 0));
    cart.add(at(box(1.9, 0.05, 0.9, '#a8743e'), 0, 1.12, 0));
    [-0.7, 0.7].forEach((dx) => {
      const wheel = cyl(0.3, 0.3, 0.06, '#3a2a1a', 14);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(dx, 0.3, 0.45);
      cart.add(wheel);
      cart.add(at(cyl(0.025, 0.025, 1.3, '#6b4a33', 5), dx, 1.75, -0.35));
      cart.add(at(cyl(0.025, 0.025, 1.3, '#6b4a33', 5), dx, 1.75, 0.35));
    });
    cart.add(at(box(2.0, 0.04, 1.0, '#c9572f'), 0, 2.42, 0));
    [-0.5, -0.1, 0.3].forEach((dx) => cart.add(at(sphere(0.12, '#c8ccd0', 10, { metalness: 0.4 }), dx, 1.27, -0.2)));
    for (let k = 0; k < 6; k++) {
      cart.add(at(box(0.12, 0.05, 0.09, '#e9dcc0'), 0.35 + (k % 3) * 0.15, 1.17, 0.15 + Math.floor(k / 3) * 0.12));
    }
    cart.position.set(-8.4, 0, 4.4);
    cart.rotation.y = 0.3;
    g.add(cart);
  }
  if (urban) {
    streetRing(g, style);
  } else {
    villageRing(g, style);
  }
}

export function buildKedai(faithId) {
  const def = KEDAI[faithId] || KEDAI.alam;
  const s = KEDAI_STYLE[def.style] || KEDAI_STYLE.angkringan;
  const g = new THREE.Group();
  // Floor slab and a roof on columns (roofs are above head height, so they never block walking).
  g.add(floorSlab(def.style, s));
  // Flat roof: plain sides, ribbed sheet on top. From the third-person camera the top fills a wide
  // band of the view, so it needs visible form (a flat dark top read as a black hole at night).
  const roofSide = mat(s.roof);
  const roofTop = new THREE.MeshStandardMaterial({ map: roofSheetTexture(s.roof), roughness: 0.75, flatShading: true });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(21.5, 0.18, 13), [roofSide, roofSide, roofTop, roofSide, roofSide, roofSide]);
  roof.castShadow = true;
  roof.receiveShadow = true;
  roof.position.set(0, 3.7, -4);
  g.add(roof);
  // String of warm bulbs along the front eave (lampu hias): marks the roof edge and glows at night.
  for (let i = 0; i < 18; i++) {
    const bulb = sphere(0.06, '#fff1c9', 6, { emissive: '#ffcf7a', emissiveIntensity: 1.8 });
    bulb.castShadow = false;
    bulb.position.set(-10.2 + i * 1.2, 3.5 - (i % 2) * 0.06, 2.55);
    g.add(noCollide(bulb));
  }
  // Light ceiling under the roof (plywood, or woven bamboo in the village styles), so the
  // overhead reads as a lit room at night instead of a black slab across the view.
  const bamboo = ['bali', 'flores', 'angkringan'].includes(def.style);
  g.add(noCollide(at(box(21.3, 0.03, 12.8, bamboo ? '#cdb68c' : '#efe5d2'), 0, 3.585, -4)));
  [-10, 10].forEach((x) => [-10, -4.5, 1.8].forEach((z) => g.add(at(cyl(0.16, 0.18, 3.6, s.column, 10), x, 1.8, z))));
  if (def.style === 'bali' || def.style === 'flores') {
    // Thatched hip roof.
    g.add(noCollide(at(hipRoof(22, 14, 1.4, s.roof, null), 0, 3.79, -4)));
  } else if (def.style === 'lapo') {
    const gable = gableRoof(13.5, 22, 1.8, s.roof);
    gable.rotation.y = Math.PI / 2;
    g.add(noCollide(at(gable, 0, 3.79, -4)));
  }
  // Back wall behind the stalls.
  g.add(at(box(21, 3.6, 0.25, s.back), 0, 1.8, -10.4));
  kedaiDecor(g, def.style, s);

  const stalls = [];
  const spots = [];
  const emitters = [];
  kedaiSurroundings(g, def, s, emitters);
  const xs = [-6.2, 0, 6.2];
  def.stalls.forEach((stallDef, index) => {
    const x = xs[index];
    // Booth: counter at the front, side panels, sign above. The hawker works inside.
    g.add(at(box(3.6, 1.0, 0.75, s.counter), x, 0.5, -7.2));
    g.add(at(box(3.7, 0.06, 0.85, s.counterTop, { roughness: 0.35 }), x, 1.03, -7.2));
    [-1.85, 1.85].forEach((dx) => g.add(at(box(0.12, 2.6, 2.9, s.counter), x + dx, 1.3, -8.85)));
    const [bg, fg, border] = s.sign;
    const board = signBoard(stallDef.sign || stallDef.name, stallDef.name, { width: 3.6, height: 0.8, background: bg, color: fg, border });
    board.position.set(x, 2.9, -7.0);
    g.add(board);
    // Glass display case with today's food on the right of the counter.
    displayCase(g, def.style, x + 0.95, -7.3, index);
    const { group: stove, rig } = station(stallDef.method, { stew: index === 1 ? '#5a3519' : '#6a3518' });
    stove.position.set(x - 0.95, 1.06, -7.45);
    g.add(stove);
    const stoveTop = new THREE.Vector3(x - 0.95, 1.5, -7.45);
    const stall = {
      id: stallDef.id,
      def: stallDef,
      index,
      spotId: `kios-${stallDef.id}`,
      vendorAt: { x: x - 0.95, z: -8.35, facing: 0 },
      counter: new THREE.Vector3(x + 0.35, 1.07, -6.95),
      stove: stoveTop,
      rig,
      cooking: 0,
      fx: null,
    };
    stalls.push(stall);
    spots.push(spot(stall.spotId, 'stall', stallDef.name, [x, 1.2, -7.2], [x, -5.6], { stallId: stallDef.id, short: stallDef.name.split(' ')[0], radius: 2.0 }));
    // Always a little steam or smoke from a working kitchen.
    if (['stir', 'steam', 'pour'].includes(stallDef.method)) {
      emitters.push({ at: stoveTop.clone().add(new THREE.Vector3(0, 0.1, 0)), opts: { color: '#f2efe8', size: 0.3, rate: 4, life: 3, rise: 0.35, spread: 0.2, duration: 1e9, count: 24 } });
    } else if (['grill', 'smoke', 'toast'].includes(stallDef.method)) {
      emitters.push({ at: stoveTop.clone().add(new THREE.Vector3(0, -0.05, 0)), opts: { color: '#cfc8bd', size: 0.45, rate: 6, life: 3.5, rise: 0.55, spread: 0.3, duration: 1e9, count: 30 } });
    }
  });

  // Tables: four near the walkway for you (and someone across), two more for other diners.
  const tables = [{ x: -3.6, z: -2.8 }, { x: 3.6, z: -2.8 }, { x: -3.6, z: 1.0 }, { x: 3.6, z: 1.0 }, { x: -7.8, z: -1.0 }, { x: 7.8, z: -1.0 }];
  tables.forEach((t) => g.add(at(diningTable(s.tableShape, s.table), t.x, 0, t.z)));
  tables.slice(0, 4).forEach((t, i) => {
    const side = t.x < 0 ? 1 : -1; // sit on the walkway side, facing outward across the table
    spots.push(seatSpot(`meja-${i + 1}`, `Meja ${i + 1}`, t, side));
  });
  // Hand-washing tap (kobokan / wastafel).
  const sink = new THREE.Group();
  sink.add(at(box(0.7, 0.85, 0.5, '#e9e4da'), 0, 0.425, 0));
  sink.add(at(cyl(0.03, 0.03, 0.3, '#9aa0a6', 6, { metalness: 0.7 }), 0, 1.0, -0.15));
  g.add(at(sink, 9.2, 0, -6.5));
  spots.push(spot('cuci-tangan', 'wash', 'Cuci tangan', [9.2, 0.95, -6.3], [9.2, -5.4], { short: 'Cuci tangan' }));

  // Way back to the sacred place and home.
  g.add(at(signpost('⛩ Tempat ibadah'), -4.5, 0, 11.3), at(signpost('🏠 Rumah'), 4.5, 0, 11.3));
  spots.push(spot('ke-ibadah', 'travel', 'Ke tempat ibadah', [-4.5, 1.6, 11.3], [-4.5, 10.2], { to: 'ibadah', radius: 1.6 }));
  spots.push(spot('ke-rumah', 'travel', 'Pulang ke rumah', [4.5, 1.6, 11.3], [4.5, 10.2], { to: 'rumah', radius: 1.6 }));

  // People: the hawkers, diners at the tables (some chatting in pairs), and passers-by.
  const npcs = [];
  stalls.forEach((stall) => npcs.push({ id: `penjual-${stall.id}`, role: 'vendor', persona: { ...stall.def.vendor, job: `penjual di ${stall.def.name}` }, stallId: stall.id, x: stall.vendorAt.x, z: stall.vendorAt.z, facing: 0, culture: def.culture }));
  npcs.push(beggarNpc(1, -2.5, 10.1, Math.PI / 2, def.culture));
  const dinerSeats = [
    { table: tables[0], side: -1 }, { table: tables[4], side: -1 }, { table: tables[4], side: 1 }, { table: tables[5], side: 1 }, { table: tables[3], side: 1 },
  ];
  def.patrons.forEach((persona, i) => {
    const seat = dinerSeats[i];
    if (!seat) {
      return;
    }
    const facing = seat.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    npcs.push({
      id: `pengunjung-${i}`, role: 'diner', persona, culture: def.culture,
      x: seat.table.x + seat.side * 0.85, z: seat.table.z, facing,
      seat: { x: seat.table.x + seat.side * 0.85, z: seat.table.z, height: 0.46, facing },
      clip: def.table === 'marble' && def.style !== 'padang' ? 'eatsticks' : 'eat',
      table: seat.table,
    });
  });
  // The two diners at table 5 face each other: they chat.
  const pair = npcs.filter((n) => n.table === tables[4]);
  if (pair.length === 2) {
    pair[0].pair = pair[1].id;
    pair[1].pair = pair[0].id;
  }
  (def.walkers || []).forEach((persona, i) => npcs.push({ id: `pejalan-${i}`, role: 'walker', persona, culture: def.culture, x: 6 - i * 3, z: 6 }));

  return {
    group: g,
    ground: s.ground,
    path: s.floor,
    spawn: { x: 0, z: 8.6 },
    focus: new THREE.Vector3(0, 1.6, -7.5),
    // Open at eye level under the eaves (camera about 3.3 m, below the 3.6 m ceiling) so the first view
    // looks into the lit warung instead of across the top of its roof.
    view: { pitch: 0.17 },
    spots,
    stalls,
    npcs,
    emitters,
    talk: def.talk,
    culture: def.culture,
    tableStyle: def.table,
    ambient: 'crowd',
    restricted: stalls.map((stall) => {
      const x = xs[stall.index];
      return { shape: 'rect', x1: x - 1.8, z1: -10.2, x2: x + 1.8, z2: -7.62, rope: false, message: 'Dapur kios: pesan dari depan etalase, ya.' };
    }),
    update(delta, elapsed) {
      stalls.forEach((stall) => {
        const heat = 0.35 + stall.cooking * 0.9;
        if (stall.rig.flame) {
          // At full heat the flame is wider than the burner and licks up around the wok rim.
          const spread = heat * (1 + stall.cooking * 0.35);
          const lift = 0.35 + stall.cooking * 1.5;
          stall.rig.flame.scale.set(spread * (0.9 + Math.random() * 0.2), lift * (0.8 + Math.random() * 0.5), spread * (0.9 + Math.random() * 0.2));
        }
        if (stall.rig.tongues) {
          stall.rig.tongues.visible = stall.cooking > 0.3;
          if (stall.rig.tongues.visible) {
            stall.rig.tongues.children.forEach((tongue) => {
              const flicker = 0.7 + Math.sin(elapsed * 14 + tongue.userData.phase) * 0.25 + Math.random() * 0.2;
              tongue.scale.set(1, flicker * (0.6 + stall.cooking * 0.8), 1);
            });
          }
        }
        if (stall.rig.wok && stall.def.method === 'wok') {
          stall.rig.wok.rotation.z = stall.cooking ? Math.sin(elapsed * 9) * 0.12 : 0;
          stall.rig.wok.position.y = 0.18 + (stall.cooking ? Math.max(0, Math.sin(elapsed * 9)) * 0.05 : 0);
          if (stall.rig.food) {
            stall.rig.food.position.y = 0.26 + (stall.cooking ? Math.abs(Math.sin(elapsed * 9 + 0.6)) * 0.12 : 0);
          }
        }
        if (stall.rig.bits) {
          stall.rig.bits.visible = stall.cooking > 0.3;
          if (stall.rig.bits.visible) {
            stall.rig.bits.children.forEach((bit) => {
              const t = (elapsed * 1.5 + bit.userData.phase) % 1;
              const r = 0.08 + t * 0.12;
              bit.position.set(Math.cos(bit.userData.angle) * r, 0.3 + 4 * t * (1 - t) * 0.42, Math.sin(bit.userData.angle) * r);
              bit.rotation.set(t * 9 + bit.userData.angle, t * 5, 0);
            });
          }
        }
        if (stall.rig.bubbles) {
          stall.rig.bubbles.children.forEach((bubble) => {
            const t = (elapsed * (0.6 + stall.cooking * 1.2) + bubble.userData.phase) % 1;
            bubble.scale.setScalar(0.3 + t * (0.6 + stall.cooking * 0.8));
            bubble.visible = t < 0.85;
          });
        }
        if (stall.rig.coals) {
          stall.rig.coals.children.forEach((coal, i) => {
            coal.material.emissiveIntensity = 0.8 + Math.sin(elapsed * 3 + i) * 0.3 + stall.cooking * 0.8;
          });
        }
        if (stall.rig.lid) {
          stall.rig.lid.position.y = 0.77 + stall.cooking * 0.25;
        }
      });
      g.children.forEach((child) => {
        if (child.userData.spin) {
          child.rotation.y += delta * 2.2;
        }
      });
    },
  };
}

// ---------- Home ----------
const ENTRY = {
  khonghucu: { pray: 'khc-ibadah-leluhur', read: 'khc-kitab-xiaojing' },
  buddha: { pray: 'bud-ibadah-pujabakti', read: 'bud-kitab-dhammapada', sit: 'bud-ibadah-meditasi' },
  islam: { wudu: 'isl-ibadah-wudu', sit: 'isl-ibadah-dzikir', read: 'isl-kitab-adab-membaca' },
  hindu: { pray: 'hin-ibadah-canang', sit: 'hin-ibadah-trisandhya', read: 'hin-kitab-bhagavad-gita' },
  protestan: { read: 'pro-kitab-cara-membaca', sit: 'pro-ibadah-keluarga' },
  katolik: { pray: 'kat-ibadah-rosario', read: 'kat-kitab-alkitab', sit: 'kat-ibadah-rosario' },
  alam: {},
};

function kaligrafi() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext('2d');
  c.fillStyle = '#1f4a3a';
  c.fillRect(0, 0, 512, 256);
  c.strokeStyle = '#d8b14a';
  c.lineWidth = 10;
  c.strokeRect(8, 8, 496, 240);
  c.fillStyle = '#e9cf7a';
  c.font = '700 96px "Amiri", "Traditional Arabic", serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('بِسْمِ اللّٰهِ', 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshStandardMaterial({ map: texture }));
}

function homeAltar(faithId, g, spots, entry) {
  switch (faithId) {
    case 'khonghucu': {
      // Meja abu: ancestor table with name tablets, photo, hiolo, candles, fruit and tea.
      g.add(at(box(2.6, 0.95, 0.8, '#5a1f18'), 0, 0.55, -9.7));
      g.add(at(box(2.0, 0.6, 0.3, '#3a1410'), 0, 1.3, -9.95));
      for (let i = -2; i <= 2; i++) {
        g.add(at(box(0.16, 0.42, 0.06, '#e0b443', { metalness: 0.3 }), i * 0.35, 1.25, -9.75));
      }
      g.add(at(box(0.45, 0.55, 0.04, '#f3ead9'), 0, 1.95, -10.2));
      g.add(at(lathe([[0, 0], [0.18, 0], [0.22, 0.12], [0.2, 0.2], [0, 0.2]], '#7c5b2a', 16, { metalness: 0.5 }), 0, 1.03, -9.55));
      [-0.9, 0.9].forEach((x) => g.add(at(cyl(0.05, 0.05, 0.4, '#d8352a', 8, { emissive: '#ff6a3a', emissiveIntensity: 0.5 }), x, 1.23, -9.5)));
      [-0.55, 0.55].forEach((x) => g.add(at(sphere(0.1, '#f39a2b', 8), x, 1.12, -9.45)));
      // Red couplets either side.
      [-1.7, 1.7].forEach((x) => g.add(at(box(0.3, 1.6, 0.03, '#c0281f'), x, 1.8, -10.25)));
      const l1 = lantern();
      l1.position.set(-2.6, 2.4, -2);
      const l2 = lantern();
      l2.position.set(2.6, 2.4, -2);
      g.add(noCollide(l1), noCollide(l2));
      // Altar to Tian at the front of the house, facing out.
      g.add(at(box(0.6, 1.05, 0.45, '#b8322b'), -2.2, 0.53, -0.9));
      g.add(at(lathe([[0, 0], [0.13, 0], [0.16, 0.1], [0, 0.1]], '#7c5b2a', 12, { metalness: 0.5 }), -2.2, 1.06, -0.9));
      spots.push(spot('thian', 'incense', 'Hio untuk Tian di depan rumah', [-2.2, 1.12, -0.9], [-2.2, 0.4], { devotional: true, entry: 'khc-ibadah-hio', slots: 6 }));
      spots.push(spot('leluhur', 'incense', 'Sembahyang leluhur di meja abu', [0, 1.12, -9.55], [0, -8.3], { devotional: true, entry: entry.pray, slots: 9 }));
      spots.push(spot('teh-leluhur', 'candle', 'Nyalakan lilin meja abu', [0.6, 1.05, -9.5], [1.0, -8.3], { devotional: true, entry: entry.pray, slots: 4 }));
      return;
    }
    case 'buddha': {
      // Cetiya: a tiered altar with the Buddha rupang at the top.
      g.add(at(box(2.2, 0.8, 0.8, '#6b3a20'), 0, 0.48, -9.8));
      g.add(at(box(1.6, 0.35, 0.6, '#7a4524'), 0, 1.05, -9.95));
      const buddha = new THREE.Group();
      buddha.add(at(lathe([[0, 0], [0.35, 0], [0.38, 0.06], [0.28, 0.11], [0, 0.11]], '#e3b85a', 14, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0));
      buddha.add(at(lathe([[0, 0], [0.3, 0], [0.26, 0.16], [0.18, 0.38], [0.11, 0.48], [0, 0.5]], '#d9aa48', 14, { metalness: 0.6, roughness: 0.35 }), 0, 0.11, 0));
      buddha.add(at(sphere(0.12, '#dcae4c', 12, { metalness: 0.6, roughness: 0.35 }), 0, 0.7, 0));
      buddha.add(at(sphere(0.045, '#c99a3d', 8, { metalness: 0.6 }), 0, 0.83, 0));
      g.add(at(buddha, 0, 1.23, -10.0));
      [-0.6, 0.6].forEach((x) => g.add(at(cyl(0.04, 0.04, 0.28, '#f7f1e3', 8), x, 1.0, -9.6)));
      [-0.3, 0, 0.3].forEach((x) => g.add(at(cyl(0.05, 0.04, 0.07, '#e9f2f5', 10, { transparent: true, opacity: 0.6 }), x, 0.92, -9.5)));
      [-0.95, 0.95].forEach((x) => g.add(at(sphere(0.12, '#f2b8c6', 8), x, 1.0, -9.55)));
      g.add(at(cyl(0.38, 0.42, 0.16, '#b65a2a', 16), 0, 0.23, -7.6));
      spots.push(spot('lilin-cetiya', 'candle', 'Nyalakan lilin di cetiya', [0.6, 0.9, -9.5], [0.7, -8.4], { devotional: true, entry: entry.pray, slots: 6 }));
      spots.push(spot('dupa-cetiya', 'incense', 'Persembahkan dupa', [0, 0.9, -9.5], [-0.7, -8.4], { devotional: true, entry: entry.pray, slots: 6 }));
      spots.push(spot('bunga-cetiya', 'flowers', 'Persembahkan bunga', [-0.6, 0.9, -9.5], [-1.4, -8.6], { devotional: true, entry: entry.pray, slots: 6 }));
      spots.push(spot('bantal-rumah', 'sit', 'Meditasi di depan cetiya', [0, 0.3, -7.6], [0, -6.8], { sitMode: 'meditate', entry: entry.sit, seat: { x: 0, z: -7.6, height: 0.16, cross: true, facing: Math.PI } }));
      return;
    }
    case 'islam': {
      // Musala corner: prayer mat, rehal with the Qur'an, calligraphy; tap outside for wudu.
      const mat1 = box(0.75, 0.02, 1.25, '#7a1f2a');
      mat1.position.set(-1.8, 0.17, -8.3);
      g.add(noCollide(mat1));
      const border = box(0.65, 0.021, 0.2, '#d8b14a');
      border.position.set(-1.8, 0.172, -8.85);
      g.add(noCollide(border));
      const calli = kaligrafi();
      calli.position.set(0, 2.0, -10.25);
      g.add(calli);
      const rehal = new THREE.Group();
      rehal.add(at(box(0.32, 0.03, 0.22, '#5a3a24'), 0, 0.3, 0));
      rehal.add(at(box(0.3, 0.025, 0.2, '#1f4a3a'), 0, 0.33, 0));
      rehal.add(at(box(0.05, 0.3, 0.05, '#5a3a24'), 0, 0.15, 0));
      g.add(at(rehal, 1.6, 0.15, -8.6));
      g.add(at(box(0.55, 0.12, 0.4, '#6b4a33'), 1.6, 0.21, -8.0));
      const tap = new THREE.Group();
      tap.add(at(box(0.1, 1.1, 0.1, '#9aa0a6', { metalness: 0.6 }), 0, 0.55, 0));
      tap.add(at(cyl(0.02, 0.02, 0.18, '#9aa0a6', 6, { metalness: 0.7 }), 0, 1.0, 0.08));
      g.add(at(tap, -6.0, 0, 0.6));
      spots.push(spot('wudu-rumah', 'water', 'Berwudu di keran', [-6.0, 0.9, 0.7], [-6.0, 1.6], { devotional: true, entry: entry.wudu }));
      spots.push(spot('sajadah-rumah', 'sit', 'Sholat & zikir di sajadah', [-1.8, 0.2, -8.3], [-1.8, -7.3], { sitMode: 'dzikir', entry: entry.sit, seat: { x: -1.8, z: -8.0, height: 0.2, cross: true, facing: Math.PI } }));
      spots.push(spot('quran-rumah', 'read', 'Membaca Al-Qur’an', [1.6, 0.5, -8.6], [1.6, -7.4], { devotional: true, entry: entry.read }));
      return;
    }
    case 'hindu': {
      // Sanggah / merajan in the corner of the yard: walled platform with small shrines.
      const merajan = new THREE.Group();
      merajan.add(at(box(4, 0.3, 3, '#b9b1a3'), 0, 0.15, 0));
      [[-1.2, 1.4], [0, 1.9], [1.2, 1.4]].forEach(([x, h]) => {
        merajan.add(at(box(0.8, h, 0.8, '#a8573a'), x, 0.3 + h / 2, -0.6));
        merajan.add(at(hipRoof(1.2, 1.2, 0.6, '#3a2f2a', null), x, 0.3 + h, -0.6));
      });
      merajan.add(at(box(0.9, 1.8, 0.7, '#cfc6b4'), 0, 1.2, -0.65));
      [[-2.05, 0, 0.1, 3.1], [2.05, 0, 0.1, 3.1]].forEach(([x, , w, d]) => merajan.add(at(box(w, 0.9, d, '#a8573a'), x, 0.75, 0)));
      g.add(at(merajan, -6.6, 0, 4.2));
      const frangi = frangipani(0.9);
      g.add(at(frangi, -9.6, 0, 2));
      spots.push(spot('merajan', 'canang', 'Haturkan canang di merajan', [-6.6, 0.5, 4.2], [-6.6, 6.4], { devotional: true, entry: entry.pray, slots: 6 }));
      spots.push(spot('saiban', 'canang', 'Mesaiban (persembahan dari dapur)', [5.2, 0.95, -9.4], [3.6, -8.0], { devotional: true, entry: entry.pray, slots: 4 }));
      spots.push(spot('bale-rumah', 'sit', 'Tri Sandhya di bale', [-2, 0.5, -8.4], [-2, -7.2], { sitMode: 'pray', entry: entry.sit }));
      g.add(at(box(2.2, 0.45, 1.6, '#8a6a4e'), -2, 0.38, -8.9));
      return;
    }
    case 'protestan': {
      // A cross on the wall, the family Bible on the table.
      g.add(at(box(0.12, 1.1, 0.06, '#5a3a24'), 0, 2.1, -10.25));
      g.add(at(box(0.6, 0.12, 0.06, '#5a3a24'), 0, 2.3, -10.25));
      g.add(at(box(1.2, 0.45, 0.7, '#6b4a33'), 0, 0.38, -8.4));
      g.add(at(box(0.36, 0.05, 0.26, '#2a2a4a'), 0, 0.63, -8.4));
      spots.push(spot('alkitab-rumah', 'read', 'Membaca Alkitab keluarga', [0, 0.65, -8.4], [0, -7.3], { devotional: true, entry: entry.read }));
      return;
    }
    case 'katolik': {
      // Home altar: crucifix, Our Lady, candles, flowers, rosary.
      g.add(at(box(1.8, 0.9, 0.55, '#5a3a24'), 0, 0.6, -9.9));
      g.add(at(box(0.08, 0.7, 0.04, '#3a2a1a'), 0, 1.95, -10.25));
      g.add(at(box(0.4, 0.07, 0.04, '#3a2a1a'), 0, 2.1, -10.25));
      const mary = new THREE.Group();
      mary.add(at(cone(0.16, 0.6, '#f4f1ea', 12), 0, 0.3, 0));
      mary.add(at(cone(0.17, 0.5, '#6c8fd0', 12), 0, 0.27, -0.02));
      mary.add(at(sphere(0.07, '#f1d9bf', 10), 0, 0.66, 0));
      g.add(at(mary, 0, 1.05, -9.95));
      [-0.55, 0.55].forEach((x) => g.add(at(cyl(0.04, 0.04, 0.3, '#f7f1e3', 8), x, 1.2, -9.8)));
      spots.push(spot('lilin-rumah', 'candle', 'Nyalakan lilin di altar keluarga', [0.5, 1.1, -9.7], [0.7, -8.6], { devotional: true, entry: entry.pray, slots: 6 }));
      spots.push(spot('bunga-rumah', 'flowers', 'Persembahkan bunga', [-0.5, 1.1, -9.7], [-0.7, -8.6], { devotional: true, entry: entry.pray, slots: 6 }));
      return;
    }
    default: {
      // Pondok: plants to water.
      for (let i = 0; i < 6; i++) {
        g.add(at(cyl(0.22, 0.18, 0.35, '#a85a3a', 10), -6 + i * 0.7, 0.18, 3.8));
        g.add(at(sphere(0.3, '#4f8a4f', 8), -6 + i * 0.7, 0.55, 3.8));
      }
      spots.push(spot('siram', 'water', 'Siram tanaman', [-4.3, 0.4, 3.8], [-4.3, 5.0], {}));
    }
  }
}

const HOME_STYLE = {
  tionghoa: { wall: '#efe4cf', floor: '#c9a27a', roof: '#3a3a3a', trim: '#b8322b', ground: '#b9b1a3' },
  cetiya: { wall: '#f3ead9', floor: '#c9a27a', roof: '#a85a2a', trim: '#8b4a20', ground: '#b9b8a3' },
  musala: { wall: '#f1ede2', floor: '#d6cbb5', roof: '#3f6a5a', trim: '#2f6b4a', ground: '#b4b49a' },
  bali: { wall: '#d9c9a8', floor: '#cbb894', roof: '#8a7448', trim: '#a8573a', ground: '#a9b48c' },
  kristen: { wall: '#eef0f2', floor: '#bfa889', roof: '#7a3a2a', trim: '#4a5a7a', ground: '#b0b89a' },
  katolik: { wall: '#f1ece6', floor: '#bfa889', roof: '#6a3a2a', trim: '#6a5a8a', ground: '#b0b89a' },
  pondok: { wall: '#b98d5a', floor: '#a8835a', roof: '#6a5a3a', trim: '#5a3a24', ground: '#a9bf8d' },
};

const HOME_FLOOR = {
  tionghoa: { kind: 'checker', a: '#e3d4b8', b: '#b98a5e', n: 6 },
  cetiya: { kind: 'planks', a: '#b58a5e', b: '#7a5636', n: 8 },
  musala: { kind: 'grid', a: '#e6dcc8', b: '#c4b69c', n: 5 },
  bali: { kind: 'stone', a: '#c9b996', b: '#91846b', n: 5 },
  kristen: { kind: 'planks', a: '#a98258', b: '#6e4f33', n: 8 },
  katolik: { kind: 'planks', a: '#a37c55', b: '#6a4b30', n: 8 },
  pondok: { kind: 'planks', a: '#9c7650', b: '#5f4229', n: 7 },
};

// Lived-in touches for the family house: patterned floor, windows with daylight, family photos,
// a rug in the sitting area, a pendant lamp over the dining table, plants and a warm room light.
function homeDecor(g, style, s, tableAt) {
  const pattern = HOME_FLOOR[style] || HOME_FLOOR.pondok;
  const floorMaterial = new THREE.MeshStandardMaterial({ map: patternTexture(pattern, 7, 4.6), roughness: 0.6 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(13.7, 0.02, 9.0), floorMaterial);
  floor.position.set(0, 0.15, -6);
  floor.receiveShadow = true;
  g.add(noCollide(floor));
  // Skirting / dado line along the walls.
  g.add(noCollide(at(box(13.7, 0.12, 0.03, s.trim), 0, 0.95, -10.38)));
  [-6.83, 6.83].forEach((x) => g.add(noCollide(at(box(0.03, 0.12, 9.0, s.trim), x, 0.95, -6))));
  // Windows on both side walls: frame + bright pane so the room reads as indoors with daylight.
  const addWindow = (x, z) => {
    const w = new THREE.Group();
    w.add(at(box(0.05, 1.15, 1.35, s.trim), 0, 0, 0));
    w.add(at(box(0.06, 0.98, 1.18, '#dcebf2', { emissive: '#cfe6f0', emissiveIntensity: 0.55, roughness: 0.2 }), 0, 0, 0));
    w.add(at(box(0.07, 0.98, 0.04, s.trim), 0, 0, 0));
    w.add(at(box(0.07, 0.04, 1.18, s.trim), 0, 0, 0));
    w.add(at(box(0.18, 0.05, 1.45, s.trim), x < 0 ? 0.08 : -0.08, -0.6, 0));
    g.add(noCollide(at(w, x, 1.75, z)));
  };
  addWindow(-6.83, -8.6);
  addWindow(-6.83, -3.4);
  addWindow(6.83, -6.4);
  // Family photos on the back wall (left of the altar).
  [[-5.4, 2.05, 0.55, 0.42], [-4.6, 1.85, 0.42, 0.55], [-3.75, 2.1, 0.5, 0.38]].forEach(([x, y, w, h], i) => {
    g.add(noCollide(at(box(w + 0.08, h + 0.08, 0.04, '#5a3a24'), x, y, -10.37)));
    g.add(noCollide(at(box(w, h, 0.045, ['#d8c3a0', '#b7c4cf', '#cdb8a6'][i]), x, y, -10.36)));
  });
  // Wall clock.
  g.add(noCollide(at(cyl(0.22, 0.22, 0.04, '#f6f2ea', 20), 2.4, 2.35, -10.37).rotateX(Math.PI / 2)));
  // Rug in the sitting area.
  g.add(noCollide(at(box(3.4, 0.015, 2.0, s.trim, { roughness: 1 }), -3.6, 0.17, -2.9)));
  g.add(noCollide(at(box(3.0, 0.017, 1.6, '#e9dcc0', { roughness: 1 }), -3.6, 0.172, -2.9)));
  // Pendant lamp over the dining table.
  // Flush ceiling lamp over the dining table (kept high so it never blocks the view across the table).
  g.add(noCollide(at(cyl(0.3, 0.34, 0.06, '#f4ead6', 20, { emissive: '#ffd49a', emissiveIntensity: 0.6 }), tableAt.x, 2.85, tableAt.z)));
  const lamp = new THREE.PointLight('#ffd49a', 6, 7, 1.6);
  lamp.position.set(tableAt.x, 2.35, tableAt.z);
  g.add(lamp);
  const room = new THREE.PointLight('#ffe2b8', 8, 13, 1.5);
  room.position.set(-1.5, 2.6, -6.5);
  g.add(room);
  // Potted plants by the open front.
  [[-6.2, -2.3], [6.2, -2.3]].forEach(([x, z]) => {
    g.add(at(cyl(0.2, 0.15, 0.36, '#a85a3a', 12), x, 0.32, z));
    g.add(at(sphere(0.34, '#4f8a4f', 8), x, 0.78, z));
    g.add(at(sphere(0.24, '#5f9a5a', 8), x + 0.12, 1.02, z - 0.06));
  });
}

export function buildRumah(faithId) {
  const def = HOME[faithId] || HOME.alam;
  const s = HOME_STYLE[def.style] || HOME_STYLE.pondok;
  const entry = ENTRY[faithId] || {};
  const g = new THREE.Group();
  // House: platform, back & side walls, open front (so you can see in), roof above.
  g.add(at(box(14, 0.14, 9.2, s.floor, { roughness: 0.6 }), 0, 0.07, -6));
  g.add(at(box(14, 2.9, 0.2, s.wall), 0, 1.45, -10.5));
  [-6.95, 6.95].forEach((x) => g.add(at(box(0.2, 2.9, 9.2, s.wall), x, 1.45, -6)));
  [-6.8, 6.8, -2.6, 2.6].forEach((x) => g.add(at(box(0.25, 2.9, 0.25, s.trim), x, 1.45, -1.5)));
  g.add(at(box(14.6, 0.2, 9.8, s.trim), 0, 2.98, -6));
  // Light ceiling just under the eave beam (woven bamboo for the village styles), so the
  // eye-level opening view looks up at a warm ceiling rather than a dark underside.
  const bambooCeiling = def.style === 'bali' || def.style === 'pondok';
  g.add(noCollide(at(box(13.7, 0.03, 9.0, bambooCeiling ? '#cdb68c' : '#efe5d2'), 0, 2.865, -6)));
  if (def.style === 'bali' || def.style === 'pondok') {
    g.add(noCollide(at(hipRoof(15, 10, 1.6, s.roof, null), 0, 3.08, -6)));
  } else {
    const roof = gableRoof(10, 15, 1.8, s.roof);
    roof.rotation.y = Math.PI / 2;
    g.add(noCollide(at(roof, 0, 3.08, -6)));
  }
  const spots = [];
  homeAltar(faithId, g, spots, entry);

  // Dining table (right front) where takeaway and home cooking are eaten.
  const tableAt = { x: 3.8, z: -4.6 };
  const tableGroup = new THREE.Group();
  tableGroup.add(at(box(1.6, 0.06, 0.9, '#7a5236', { roughness: 0.45 }), 0, 0.78, 0));
  [[-0.72, -0.38], [0.72, -0.38], [-0.72, 0.38], [0.72, 0.38]].forEach(([x, z]) => tableGroup.add(at(box(0.07, 0.76, 0.07, '#5a3a24'), x, 0.38, z)));
  [[0, 0.75], [0, -0.75]].forEach(([x, z]) => {
    const chair = new THREE.Group();
    chair.add(at(box(0.45, 0.05, 0.45, '#6b4a33'), 0, 0.48, 0));
    chair.add(at(box(0.45, 0.6, 0.05, '#6b4a33'), 0, 0.78, z > 0 ? 0.21 : -0.21));
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([cx, cz]) => chair.add(at(box(0.04, 0.46, 0.04, '#5a3a24'), cx, 0.23, cz)));
    tableGroup.add(at(chair, x, 0, z));
  });
  g.add(at(tableGroup, tableAt.x, 0.14, tableAt.z));
  homeDecor(g, def.style, s, tableAt);
  spots.push(spot('meja-makan', 'sit', 'Meja makan', [tableAt.x, 0.9, tableAt.z], [tableAt.x, -2.9], {
    sitMode: 'meal', short: 'Meja makan', table: { x: tableAt.x, z: tableAt.z, top: 0.92 },
    seat: { x: tableAt.x, z: tableAt.z + 0.75, height: 0.6, facing: Math.PI },
  }));

  // Kitchen at the back right with the family cook.
  g.add(at(box(3.2, 0.95, 0.65, '#d9cfbf'), 4.9, 0.6, -9.95));
  const { group: stove, rig } = station('stir', { stew: '#e9dcc0' });
  stove.position.set(4.3, 1.08, -9.95);
  stove.scale.setScalar(0.75);
  g.add(stove);
  const kitchen = {
    id: def.kitchen.id,
    def: { ...def.kitchen, name: def.kitchen.name, sign: def.kitchen.name },
    index: 0,
    spotId: 'dapur',
    vendorAt: { x: 4.3, z: -9.15, facing: Math.PI },
    counter: new THREE.Vector3(5.6, 1.1, -9.75),
    stove: new THREE.Vector3(4.3, 1.4, -9.95),
    rig,
    cooking: 0,
    home: true,
  };
  spots.push(spot('dapur', 'stall', def.kitchen.name, [4.6, 1.1, -9.8], [4.6, -7.9], { stallId: def.kitchen.id, short: 'Dapur', radius: 1.8 }));

  // Shelf with the family album, journal, memorial dates and cards (in-world guides).
  const shelf = new THREE.Group();
  shelf.add(at(box(0.45, 2.0, 1.6, '#6b4a33'), 0, 1.0, 0));
  for (let i = 0; i < 8; i++) {
    shelf.add(at(box(0.3, 0.32, 0.08, ['#b8322b', '#2f6b4a', '#d8b14a', '#3f5a7a'][i % 4]), 0.1, 0.5 + Math.floor(i / 4) * 0.6, -0.6 + (i % 4) * 0.35));
  }
  g.add(at(shelf, -6.5, 0.14, -5.8));
  spots.push(spot('rak-keluarga', 'guide', 'Rak keluarga: arsip, jurnal, peringatan', [-6.4, 1.2, -5.8], [-5.3, -5.8], { guides: ['peringatan', 'arsip', 'syukur', 'kartu'], short: 'Rak keluarga' }));

  // Living room bench with the grandparent.
  g.add(at(box(2.2, 0.45, 0.7, '#8a6a4e'), -3.6, 0.36, -3.3));
  g.add(at(box(2.2, 0.6, 0.12, '#8a6a4e'), -3.6, 0.75, -3.7));

  // Mailbox at the gate for greeting cards; signposts to the sacred place and the food place.
  const mailbox = new THREE.Group();
  mailbox.add(at(box(0.08, 1.1, 0.08, '#3a3a3e'), 0, 0.55, 0));
  mailbox.add(at(box(0.45, 0.32, 0.3, '#c0281f'), 0, 1.2, 0));
  g.add(at(mailbox, 2.2, 0, 8.8));
  spots.push(spot('kotak-surat', 'guide', 'Kotak surat: kartu ucapan', [2.2, 1.2, 8.8], [2.2, 7.8], { guides: ['kartu'], short: 'Kotak surat' }));
  g.add(at(signpost('⛩ Tempat ibadah'), -4.5, 0, 11.3), at(signpost('🍜 Kedai'), 4.5, 0, 11.3));
  spots.push(spot('ke-ibadah', 'travel', 'Ke tempat ibadah', [-4.5, 1.6, 11.3], [-4.5, 10.2], { to: 'ibadah', radius: 1.6 }));
  spots.push(spot('ke-kedai', 'travel', 'Ke kedai', [4.5, 1.6, 11.3], [4.5, 10.2], { to: 'kedai', radius: 1.6 }));
  // Fence along the front of the yard, with a gap for the gate.
  for (let x = -12; x <= 12; x += 1.5) {
    if (Math.abs(x) < 1.5) {
      continue;
    }
    g.add(at(box(1.4, 0.8, 0.08, s.trim), x, 0.4, 9.6));
  }
  g.add(at(tree(1.1, '#4f7d4a'), -10.5, 0, 0), at(tree(1.0, '#5f8f55'), 10.5, 0, -2));
  // Front garden lawns either side of the path, and neighbours' houses and trees beyond the fence.
  [-1, 1].forEach((side) => {
    g.add(noCollide(at(box(10.4, 0.02, 10.2, '#9db884', { roughness: 1 }), side * 6.6, 0.012, 4.3)));
  });
  villageRing(g, def.style === 'bali' ? 'bali' : 'rumah');
  // Wish tree (Pohon Harapan): every ribbon wish bought with kindness points hangs here.
  const wishTree = tree(1.15, '#5a8f52');
  const ribbons = (karma().wishes || []).filter((wish) => wish.id === 'pita').slice(0, 24);
  const ribbonColors = ['#e85d5d', '#f2c14e', '#5fa8d3', '#9b7fd1', '#f28fb1', '#ffffff'];
  ribbons.forEach((wish, i) => {
    const angle = i * 2.4;
    const r = 0.7 + (i % 3) * 0.25;
    const ribbon = box(0.07, 0.42, 0.015, ribbonColors[i % ribbonColors.length]);
    ribbon.position.set(Math.cos(angle) * r, 1.95 + (i % 4) * 0.12, Math.sin(angle) * r);
    ribbon.rotation.y = angle;
    ribbon.userData.noCollide = true;
    wishTree.add(ribbon);
  });
  g.add(at(wishTree, -8.4, 0, 5.2));
  spots.push(spot('pohon-harapan', 'read', 'Pohon Harapan', [-8.4, 1.6, 5.2], [-7.0, 5.6], { devotional: false, wishTree: true, short: 'Pohon Harapan' }));

  const npcs = [
    { id: 'juru-masak', role: 'vendor', persona: { ...def.kitchen.vendor, job: 'memasak untuk keluarga' }, stallId: def.kitchen.id, x: kitchen.vendorAt.x, z: kitchen.vendorAt.z, facing: Math.PI, culture: def.culture, family: true },
    ...def.family.map((persona, i) => ({
      id: `keluarga-${i}`, role: 'sitter', persona, culture: def.culture, family: true,
      x: -3.6 + i * 0.8, z: -3.2, facing: 0, seat: { x: -3.6 + i * 0.8, z: -3.25, height: 0.58, facing: 0 },
    })),
  ];

  return {
    group: g,
    ground: s.ground,
    path: '#c8bb98',
    spawn: { x: 0, z: 7.6 },
    focus: new THREE.Vector3(0, 1.4, -8),
    // Open at eye level under the eaves (camera about 2.65 m, below the 2.88 m beam), like the
    // kedai, not over the roof, which at night read as a black slab covering the top of the view.
    view: { pitch: 0.11 },
    spots,
    stalls: [kitchen],
    npcs,
    emitters: [{ at: kitchen.stove.clone(), opts: { color: '#f2efe8', size: 0.25, rate: 3, life: 3, rise: 0.3, spread: 0.15, duration: 1e9, count: 16 } }],
    culture: def.culture,
    tableStyle: def.table,
    heldScene: FAITH_SCENE[faithId] || 'alam',
    restricted: [{ shape: 'rect', x1: 3.2, z1: -10.4, x2: 6.6, z2: -9.3, rope: false, message: 'Dapur sedang dipakai memasak. Minta dari depan, ya.' }],
    update(delta, elapsed) {
      if (rig.flame) {
        const heat = 0.3 + kitchen.cooking * 0.7;
        rig.flame.scale.set(heat, heat * (0.8 + Math.random() * 0.4), heat);
      }
    },
  };
}


// A person asking for alms near the entrance. Tapping them opens the giving sheet (Bank Kebaikan).
const BEGGARS = [
  { name: 'Pak Darto', attire: { name: '', top: '#8a7d6b', bottom: '#5a5048', head: 'gray' }, from: 'Klaten', job: 'dulu buruh bangunan', family: 'cucu dua di kampung', hobby: 'mendengar radio', lines: { hello: 'Permisi, Nak… ada sedikit rezeki?' } },
  { name: 'Mbah Sumi', attire: { name: '', top: '#7a6a5a', bottom: '#4a4038', head: 'bun' }, from: 'Gunungkidul', job: 'dulu penjual sayur', family: 'tinggal sendiri', hobby: 'menyanyi tembang', lines: { hello: 'Nak, kalau ada lebih, Mbah terima kasih sekali…' } },
];

function beggarNpc(index, x, z, facing, culture) {
  const persona = BEGGARS[index % BEGGARS.length];
  return { id: 'pengemis', role: 'beggar', persona, culture, x, z, facing, seat: { x, z, height: 0.02, facing, cross: true } };
}

// ---------- Added to every sacred place ----------
export function addTempleAnnex(place, faithId) {
  const people = TEMPLE_PEOPLE[faithId] || TEMPLE_PEOPLE.alam;
  const g = place.group;
  g.add(at(signpost('🍜 Kedai'), -4.5, 0, 11.4), at(signpost('🏠 Rumah'), 4.5, 0, 11.4));
  place.spots.push(spot('ke-kedai', 'travel', 'Ke kedai makan', [-4.5, 1.6, 11.4], [-4.5, 10.3], { to: 'kedai', radius: 1.6 }));
  place.spots.push(spot('ke-rumah', 'travel', 'Pulang ke rumah', [4.5, 1.6, 11.4], [4.5, 10.3], { to: 'rumah', radius: 1.6 }));
  // Guide board: library, ask the guide, holy-day calendar, ceremony guides, glossary, real places.
  const board = new THREE.Group();
  [-0.9, 0.9].forEach((x) => board.add(at(box(0.12, 2.2, 0.12, '#6b4a33'), x, 1.1, 0)));
  const panel = signBoard('Papan Panduan', 'Pustaka · Kalender · Upacara · Kamus', { width: 2.0, height: 1.1, background: '#f3ead9', color: '#3a2a1a', border: '#6b4a33' });
  panel.position.set(0, 1.55, 0.08);
  board.add(panel);
  g.add(at(board, -7.2, 0, 7.8));
  g.add(at(signpost('🧭 Wisata iman'), 7.2, 0, 7.8));
  place.spots.push(spot('ke-wisata', 'travel', 'Wisata: 7 keajaiban iman', [7.2, 1.6, 7.8], [7.2, 6.6], { to: 'wisata', radius: 1.6, short: 'Wisata' }));
  place.spots.push(spot('papan-panduan', 'guide', 'Papan panduan', [-7.2, 1.5, 7.8], [-7.2, 6.6], { guides: ['pustaka', 'kalender', 'upacara', 'kamus', 'ibadah', 'kunjungi'], short: 'Papan panduan' }));
  place.npcs = [
    { id: 'pemandu', role: 'guide', persona: { ...people.guide, guide: true }, culture: people.culture, x: -5.6, z: 7.6, facing: Math.PI / 4 },
    beggarNpc(0, 2.5, 9.9, -Math.PI / 2, people.culture),
    ...people.visitors.map((persona, i) => ({ id: `umat-${i}`, role: 'worshipper', persona, culture: people.culture, x: 3 + i * 1.5, z: 5 - i })),
  ];
  place.culture = people.culture;
  return place;
}

export { buildParcel, mesh, signpost, signBoard, noCollide, villageRing };
