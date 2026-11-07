// Avatars for the 3D spaces: faith attire, greeting gestures, sitting poses, and keyframed action
// animations with hand-held props (incense, candle, canang, lotus...).
//
// Attire is decided by the PLACE and the visitor's mode, never by reading anyone's religion:
// members ("home" mode) wear the attire of that place's tradition; guests wear respectful guest dress
// for that place (e.g. kamen + selendang at a pura). Religion stays on the device (UU PDP).

import * as THREE from '../../vendor/three.module.min.js';
import { mat, box, cyl, sphere, cone } from './places.js';

const SKIN = '#f1d9bf';
const HAIR = '#2b211b';

export function textSprite(text, { color = '#ffffff', background = 'rgba(20,18,16,0.55)', size = 44 } = {}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
  const width = Math.ceil(context.measureText(text).width) + 40;
  canvas.width = width;
  canvas.height = size + 28;
  context.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
  context.fillStyle = background;
  const radius = canvas.height / 2;
  context.beginPath();
  context.roundRect(0, 0, width, canvas.height, radius);
  context.fill();
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.fillText(text, 20, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true }));
  const scale = 0.0042;
  sprite.scale.set(width * scale, canvas.height * scale, 1);
  return sprite;
}

// Multi-line floating speech bubble (NPC small talk, chat replies). Anchored at its bottom (the tail).
export function speechBubble(text, { background = 'rgba(255,252,244,0.96)', color = '#2a2016', size = 34, maxChars = 28, maxLines = 4 } = {}) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) {
    lines.push(line);
  }
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,!?…]*$/, '')}…`;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
  context.font = font;
  const lineHeight = Math.round(size * 1.25);
  const width = Math.ceil(Math.max(...lines.map((l) => context.measureText(l).width), 40)) + 40;
  const tail = 16;
  canvas.width = width;
  canvas.height = lines.length * lineHeight + 26 + tail;
  context.font = font;
  context.fillStyle = background;
  context.beginPath();
  context.roundRect(0, 0, width, canvas.height - tail, 22);
  context.fill();
  context.beginPath();
  context.moveTo(width / 2 - 12, canvas.height - tail - 1);
  context.lineTo(width / 2, canvas.height);
  context.lineTo(width / 2 + 12, canvas.height - tail - 1);
  context.fill();
  context.fillStyle = color;
  context.textBaseline = 'top';
  lines.forEach((l, i) => context.fillText(l, 20, 14 + i * lineHeight));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true }));
  const scale = 0.0042;
  sprite.scale.set(width * scale, canvas.height * scale, 1);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 5;
  return sprite;
}

// Arm angles per gesture: [rightX, rightZ, leftX, leftZ].
// x < 0 raises an arm forward/up; z < 0 (right arm) or z > 0 (left arm) brings it across the body.
export const POSES = {
  rest: { arms: [0, 0.12, 0, -0.12], lean: 0 },
  anjali: { arms: [-1.25, -0.62, -1.25, 0.62], lean: 0 },
  soja: { arms: [-1.45, -0.58, -1.45, 0.58], lean: 0.08 },
  fold: { arms: [-1.0, -0.66, -1.0, 0.66], lean: 0.05 },
  bow: { arms: [-1.2, -0.62, -1.2, 0.62], lean: 0.38 },
  chest: { arms: [-1.15, -0.75, 0, -0.12], lean: 0.1 },
  open: { arms: [-0.95, 0.35, -0.95, -0.35], lean: 0 },
  raise: { arms: [-0.25, 2.7, -0.25, -2.7], lean: -0.05 },
  wave: { arms: [-0.2, 2.5, 0, -0.12], lean: 0, wave: true },
  cross: { arms: [-1.6, -0.5, 0, -0.12], lean: 0.05, cross: true },
};

// ---------- Attire ----------
// 'accent' = the colour the visitor picked in onboarding, so everyone still looks like themselves.
const ATTIRE = {
  // Buddhist monk: saffron robe, right shoulder bare, upper robe over the left shoulder, shaved head.
  vihara: { name: 'Jubah bhikkhu', top: '#d9822b', bottom: '#d9822b', sleeveRight: 'skin', sleeveLeft: '#d9822b', sash: { style: 'diagonal', color: '#b8641f' }, head: 'shaved' },
  // Baju koko + sarung + peci.
  masjid: { name: 'Baju koko, sarung & peci', top: '#f4f1ea', bottom: 'accent', head: 'peci', headColor: '#1f1f22' },
  // Balinese temple dress: white shirt, kamen, selendang at the waist, udeng.
  pura: { name: 'Kamen, selendang & udeng', top: '#f7f4ec', bottom: 'accent', sash: { style: 'waist', color: '#e2b33c' }, head: 'udeng', headColor: '#f7f4ec' },
  // Confucian ritual robe (wide sleeves) with a scholar's cap.
  klenteng: { name: 'Jubah ru & topi', top: 'accent', bottom: 'accent', wideSleeves: true, sash: { style: 'waist', color: '#1f1d1b' }, head: 'rucap', headColor: '#1f1d1b' },
  // Sunday best.
  gereja: { name: 'Pakaian ibadah', top: 'accent', bottom: '#3b4252', head: 'hair', collar: '#ffffff' },
  katedral: { name: 'Pakaian Misa', top: 'accent', bottom: '#4a4652', head: 'hair', pendant: '#d8b14a' },
  // Ruang Alam: linen and a caping (woven farmer's hat).
  alam: { name: 'Caping & linen', top: 'accent', bottom: '#8a7a5c', head: 'caping', headColor: '#d9c38a' },
};

const GUEST_ATTIRE = {
  default: { name: 'Pakaian sopan tamu', top: 'accent', bottom: '#6f6a62', head: 'hair' },
  // Modest, long sleeves, a shawl over the shoulders.
  masjid: { name: 'Pakaian sopan & selendang', top: 'accent', bottom: '#5d5a55', head: 'hair', shawl: '#e9e2d3' },
  // Every visitor to a Balinese pura wears a kamen (sarong) and a selendang (sash).
  pura: { name: 'Kamen & selendang tamu', top: '#f7f4ec', bottom: 'accent', sash: { style: 'waist', color: '#e2b33c' }, head: 'hair' },
};

// Everyday clothes at the food court and at home (no ritual dress needed there).
const CASUAL = { name: 'Pakaian santai', top: 'accent', bottom: '#4b4f58', head: 'hair' };

export function attireFor(sceneId, mode) {
  if (/^(kedai|rumah)-/.test(sceneId)) {
    return CASUAL;
  }
  if (mode === 'visit') {
    return GUEST_ATTIRE[sceneId] || GUEST_ATTIRE.default;
  }
  return ATTIRE[sceneId] || GUEST_ATTIRE.default;
}

function buildHead(spec, headColor) {
  const parts = [];
  if (spec.head === 'hair' || spec.shawl) {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(HAIR, { roughness: 0.9 }));
    hair.position.y = 1.53;
    hair.rotation.x = -0.3;
    parts.push(hair);
  }
  if (spec.head === 'peci') {
    parts.push(atY(cyl(0.2, 0.212, 0.15, headColor, 18), 1.68));
  }
  if (spec.head === 'udeng') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.214, 0.05, 6, 20), mat(headColor));
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.63;
    const knot = cone(0.07, 0.16, headColor, 6);
    knot.position.set(0, 1.74, 0.17);
    knot.rotation.x = 0.35;
    parts.push(band, knot);
  }
  if (spec.head === 'rucap') {
    parts.push(atY(box(0.34, 0.2, 0.34, headColor), 1.75));
    const flap = box(0.3, 0.16, 0.04, headColor);
    flap.position.set(0, 1.68, -0.2);
    parts.push(flap);
  }
  if (spec.head === 'hijab') {
    // Covers hair, ears and neck; the face stays open.
    const cover = new THREE.Mesh(
      new THREE.SphereGeometry(0.245, 18, 12, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9),
      mat(headColor, { roughness: 0.85, side: THREE.DoubleSide }),
    );
    cover.position.set(0, 1.53, -0.01);
    const drape = cyl(0.21, 0.34, 0.32, headColor, 18);
    drape.position.y = 1.3;
    parts.push(cover, drape);
  }
  if (spec.head === 'bun') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(HAIR, { roughness: 0.9 }));
    hair.position.y = 1.53;
    hair.rotation.x = -0.3;
    const bun = sphere(0.09, HAIR, 10);
    bun.position.set(0, 1.62, -0.2);
    parts.push(hair, bun);
  }
  if (spec.head === 'cap') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(HAIR, { roughness: 0.9 }));
    hair.position.y = 1.53;
    hair.rotation.x = -0.3;
    const crown = cyl(0.2, 0.22, 0.12, headColor, 16);
    crown.position.y = 1.7;
    const brim = box(0.22, 0.02, 0.16, headColor);
    brim.position.set(0, 1.65, 0.22);
    parts.push(hair, crown, brim);
  }
  if (spec.head === 'gray') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat('#bdb6ad', { roughness: 0.9 }));
    hair.position.y = 1.53;
    hair.rotation.x = -0.3;
    parts.push(hair);
  }
  if (spec.head === 'caping') {
    parts.push(atY(cone(0.46, 0.26, headColor, 20), 1.8));
  }
  return parts;
}

function atY(object, y) {
  object.position.y = y;
  return object;
}

export function createAvatar(name, color, { visitor = false, host = false, attire = null } = {}) {
  const spec = attire || GUEST_ATTIRE.default;
  const resolve = (value, fallback) => {
    if (value === 'accent') {
      return color;
    }
    if (value === 'skin') {
      return SKIN;
    }
    return value || fallback;
  };
  const topColor = resolve(spec.top, color);
  const bottomColor = resolve(spec.bottom, topColor);
  const headColor = spec.headColor || '#1f1f22';

  const group = new THREE.Group();
  const body = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 12), mat(topColor, { roughness: 0.75 }));
  torso.position.y = 0.95;
  torso.castShadow = true;
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.37, 0.64, 14), mat(bottomColor, { roughness: 0.8 }));
  lower.position.y = 0.34;
  lower.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(SKIN, { roughness: 0.6 }));
  head.position.y = 1.52;
  head.castShadow = true;
  body.add(torso, lower, head, ...buildHead(spec, headColor));
  // Everyone is a little different: a stable height / build per name so a crowd isn't clones.
  let seed = 0;
  for (const ch of String(name || '')) {
    seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const stature = 0.95 + ((seed % 97) / 97) * 0.09;
  const build = 0.93 + (((seed >>> 7) % 89) / 89) * 0.16;
  body.scale.set(build, stature, build);

  if (spec.sash && spec.sash.style === 'diagonal') {
    // Upper robe draped from the left shoulder to the right hip.
    const pivot = new THREE.Group();
    pivot.position.y = 1.0;
    pivot.rotation.z = 0.72;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.075, 6, 24), mat(spec.sash.color, { roughness: 0.8 }));
    band.rotation.x = Math.PI / 2;
    band.scale.set(1.32, 1, 1);
    pivot.add(band);
    body.add(pivot);
  }
  if (spec.sash && spec.sash.style === 'waist') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.06, 6, 24), mat(spec.sash.color, { roughness: 0.7 }));
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.64;
    body.add(band);
  }
  if (spec.shawl) {
    const shawl = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.1, 8, 24), mat(spec.shawl, { roughness: 0.85 }));
    shawl.rotation.x = Math.PI / 2;
    shawl.position.y = 1.3;
    body.add(shawl);
  }
  if (spec.apron) {
    const apron = box(0.48, 0.78, 0.03, spec.apron);
    apron.position.set(0, 0.62, 0.33);
    apron.rotation.x = -0.05;
    body.add(apron);
  }
  if (spec.collar) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 6, 16), mat(spec.collar));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.36;
    body.add(collar);
  }
  if (spec.pendant) {
    const cross = new THREE.Group();
    cross.add(box(0.03, 0.13, 0.02, spec.pendant, { metalness: 0.6, roughness: 0.3 }));
    cross.add(atY(box(0.09, 0.03, 0.02, spec.pendant, { metalness: 0.6, roughness: 0.3 }), 0.025));
    cross.position.set(0, 1.12, 0.3);
    body.add(cross);
  }

  // Arms hang from shoulder pivots so gestures read clearly from a distance.
  const sleeveColors = [
    resolve(spec.sleeveRight, topColor),
    resolve(spec.sleeveLeft, topColor),
  ];
  const sleeveRadius = spec.wideSleeves ? 0.1 : 0.075;
  const hands = [];
  const arms = [0.36, -0.36].map((x, index) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.22, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(sleeveRadius, 0.42, 3, 8), mat(sleeveColors[index], { roughness: 0.7 }));
    sleeve.position.y = -0.28;
    pivot.add(sleeve);
    if (spec.wideSleeves) {
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.18, 10, 1, true), mat(sleeveColors[index], { roughness: 0.7, side: THREE.DoubleSide }));
      cuff.position.y = -0.46;
      pivot.add(cuff);
    }
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat(SKIN, { roughness: 0.6 }));
    hand.position.y = -0.56;
    pivot.add(hand);
    const anchor = new THREE.Group();
    anchor.position.y = -0.6;
    pivot.add(anchor);
    hands.push(anchor);
    body.add(pivot);
    return pivot;
  });

  // Legs only show while sitting (the robe covers them when standing).
  const crossLegs = new THREE.Group();
  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 3, 10), mat(bottomColor, { roughness: 0.8 }));
  shin.rotation.z = Math.PI / 2;
  shin.position.set(0, 0.13, 0.14);
  crossLegs.add(shin);
  [-0.22, 0.22].forEach((x) => crossLegs.add(atPos(sphere(0.07, SKIN, 8), x, 0.1, 0.27)));
  crossLegs.visible = false;

  const benchLegs = new THREE.Group();
  [-0.14, 0.14].forEach((x) => {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 3, 8), mat(bottomColor, { roughness: 0.8 }));
    thigh.rotation.x = Math.PI / 2;
    thigh.position.set(x, 0.06, 0.2);
    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.26, 3, 8), mat(bottomColor, { roughness: 0.8 }));
    calf.position.set(x, -0.2, 0.42);
    benchLegs.add(thigh, calf, atPos(sphere(0.07, '#3a2e26', 8), x, -0.42, 0.47));
  });
  benchLegs.visible = false;

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  const labelText = host ? `${name} · pemandu` : visitor ? `${name} · tamu` : name;
  const label = textSprite(labelText, host ? { background: 'rgba(120,80,10,0.8)' } : undefined);
  label.position.y = 2.05;
  group.add(body, crossLegs, benchLegs, shadow, label);
  if (host) {
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 32), new THREE.MeshBasicMaterial({ color: '#f3c84b', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.03;
    group.add(halo);
  }
  return {
    group, body, head, arms, hands, lower, crossLegs, benchLegs, shadow, label,
    attire: spec.name,
    target: new THREE.Vector3(), sitting: false, sitMode: null, seat: null, facing: 0,
    moving: false, walkPhase: 0, sitBlend: 0,
    pose: 'rest', poseUntil: 0, poseStart: 0, bubble: null, bubbleUntil: 0,
    clip: null, sitProp: null,
  };
}

function atPos(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

// ---------- Props held during actions ----------
function makeProp(kind) {
  const group = new THREE.Group();
  switch (kind) {
    case 'incense': {
      // Three sticks held upright between the palms (sticks stay vertical when hands are at the forehead).
      [-0.035, 0, 0.035].forEach((x) => {
        group.add(atPos(cyl(0.01, 0.01, 0.5, '#7b3f22', 5), x, 0.2, 0));
        group.add(atPos(sphere(0.02, '#ff7a2a', 6, { emissive: '#ff6a1a', emissiveIntensity: 2 }), x, 0.45, 0));
      });
      group.rotation.x = 2.3;
      group.position.x = -0.07;
      return { object: group, anchor: 'right' };
    }
    case 'taper': {
      group.add(atPos(cyl(0.025, 0.025, 0.24, '#f7f1e3', 8), 0, 0.08, 0));
      group.add(atPos(cone(0.022, 0.07, '#ffd27a', 6, { emissive: '#ffb347', emissiveIntensity: 3 }), 0, 0.24, 0));
      group.rotation.x = 1.5;
      return { object: group, anchor: 'right' };
    }
    case 'lantern': {
      const body = sphere(0.14, '#d8352a', 10, { emissive: '#e8452f', emissiveIntensity: 0.8 });
      body.scale.y = 1.25;
      group.add(atPos(body, 0, -0.12, 0));
      return { object: group, anchor: 'right' };
    }
    case 'tray': {
      group.add(box(0.26, 0.04, 0.26, '#79a35a'));
      [['#ffffff', 0, -0.07], ['#d9342b', 0.07, 0], ['#f2c533', 0, 0.07], ['#2d3f8f', -0.07, 0]].forEach(([c, x, z]) => group.add(atPos(sphere(0.04, c, 6), x, 0.04, z)));
      group.position.set(0, 0.86, 0.47);
      return { object: group, anchor: 'chest' };
    }
    case 'lotus': {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const petal = cone(0.05, 0.16, i % 2 ? '#f6b8c9' : '#f9d4de', 5);
        petal.position.set(Math.cos(angle) * 0.06, 0.05, Math.sin(angle) * 0.06);
        petal.rotation.set(Math.sin(angle) * 0.5, 0, -Math.cos(angle) * 0.5);
        group.add(petal);
      }
      group.add(atPos(sphere(0.04, '#f3d16b', 6), 0, 0.07, 0));
      group.position.set(0, 0.86, 0.47);
      return { object: group, anchor: 'chest' };
    }
    case 'bouquet': {
      for (let i = 0; i < 6; i++) {
        group.add(atPos(sphere(0.055, ['#f7f2ea', '#f2b8c6', '#f3d16b'][i % 3], 6), (i % 3 - 1) * 0.06, 0.08 + (i > 2 ? 0.05 : 0), (i > 2 ? 0.03 : -0.03)));
      }
      group.add(cyl(0.02, 0.03, 0.18, '#5e8f4f', 5));
      group.position.set(0, 0.9, 0.46);
      return { object: group, anchor: 'chest' };
    }
    case 'paper': {
      group.add(box(0.16, 0.03, 0.1, '#e3b84a', { metalness: 0.4 }));
      group.rotation.x = 1.4;
      return { object: group, anchor: 'right' };
    }
    case 'pebble': {
      group.add(sphere(0.05, '#8c887e', 6));
      return { object: group, anchor: 'right' };
    }
    case 'book': {
      const left = box(0.16, 0.02, 0.22, '#f2ead8');
      left.position.x = -0.08;
      left.rotation.z = 0.18;
      const right = box(0.16, 0.02, 0.22, '#f2ead8');
      right.position.x = 0.08;
      right.rotation.z = -0.18;
      group.add(left, right, atPos(box(0.34, 0.015, 0.24, '#6a3d2a'), 0, -0.02, 0));
      group.position.set(0, 1.0, 0.5);
      group.rotation.x = -0.55;
      return { object: group, anchor: 'chest' };
    }
    case 'ciamsi': {
      group.add(cyl(0.075, 0.07, 0.26, '#b07a3d', 10));
      for (let i = 0; i < 6; i++) {
        group.add(atPos(cyl(0.006, 0.006, 0.18, '#d9b26a', 4), Math.cos(i) * 0.04, 0.17, Math.sin(i) * 0.04));
      }
      group.position.set(0, 1.0, 0.5);
      group.rotation.x = -0.35;
      return { object: group, anchor: 'chest' };
    }
    // ---- Kitchen & table props (hawkers, family cooks, diners) ----
    case 'spatula': {
      // Long-handled wok spatula (sutil): big enough to read from the customer side.
      group.add(atPos(cyl(0.016, 0.016, 0.46, '#6b4426', 6), 0, -0.17, 0));
      group.add(atPos(box(0.13, 0.008, 0.12, '#d4d8dc', { metalness: 0.25, roughness: 0.3 }), 0, -0.43, 0.03));
      return { object: group, anchor: 'right' };
    }
    case 'ladle': {
      group.add(atPos(cyl(0.014, 0.014, 0.52, '#c4c8cc', 6, { metalness: 0.25, roughness: 0.3 }), 0, -0.22, 0));
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#d4d8dc', { metalness: 0.25, roughness: 0.3, side: THREE.DoubleSide }));
      bowl.position.y = -0.5;
      group.add(bowl);
      return { object: group, anchor: 'right' };
    }
    case 'fan': {
      group.add(atPos(cyl(0.008, 0.008, 0.14, '#7a5a32', 5), 0, -0.06, 0));
      group.add(atPos(box(0.2, 0.18, 0.008, '#c9a46a'), 0, -0.22, 0));
      return { object: group, anchor: 'right' };
    }
    case 'tongs': {
      [-0.012, 0.012].forEach((x) => group.add(atPos(box(0.008, 0.26, 0.012, '#8f949a', { metalness: 0.7 }), x, -0.12, 0)));
      return { object: group, anchor: 'left' };
    }
    case 'cleaver': {
      group.add(atPos(cyl(0.014, 0.014, 0.1, '#3a2a20', 6), 0, -0.04, 0));
      group.add(atPos(box(0.008, 0.16, 0.09, '#b9bec4', { metalness: 0.8, roughness: 0.25 }), 0, -0.17, 0.03));
      return { object: group, anchor: 'right' };
    }
    case 'kettle': {
      const pot = sphere(0.08, '#c8ccd0', 14, { metalness: 0.75, roughness: 0.3 });
      pot.scale.y = 1.15;
      group.add(atPos(pot, 0, -0.12, 0.04));
      const spout = cone(0.018, 0.14, '#c8ccd0', 8, { metalness: 0.75, roughness: 0.3 });
      spout.rotation.x = 1.9;
      group.add(atPos(spout, 0, -0.16, 0.14));
      return { object: group, anchor: 'right' };
    }
    case 'cup': {
      group.add(atPos(cyl(0.045, 0.038, 0.11, '#e9e2d4', 12), 0, -0.07, 0.03));
      return { object: group, anchor: 'left' };
    }
    case 'cloth': {
      group.add(atPos(box(0.12, 0.03, 0.1, '#f1efe8'), 0, -0.04, 0.02));
      return { object: group, anchor: 'right' };
    }
    case 'chopsticks': {
      [-0.01, 0.01].forEach((x) => group.add(atPos(cyl(0.004, 0.006, 0.24, '#c49a5a', 5), x, -0.1, 0.02)));
      return { object: group, anchor: 'right' };
    }
    case 'spoon': {
      group.add(atPos(cyl(0.006, 0.006, 0.16, '#c8ccd0', 5, { metalness: 0.7 }), 0, -0.08, 0.02));
      group.add(atPos(sphere(0.022, '#c8ccd0', 8, { metalness: 0.7 }), 0, -0.17, 0.02));
      return { object: group, anchor: 'right' };
    }
    case 'servetray': {
      group.add(box(0.38, 0.02, 0.28, '#7a5236'));
      const plate = cyl(0.12, 0.09, 0.025, '#f4f1ea', 18);
      plate.position.y = 0.022;
      const food = sphere(0.075, '#c98b4a', 10);
      food.scale.y = 0.45;
      food.position.y = 0.045;
      group.add(plate, food);
      group.position.set(0, 0.98, 0.46);
      return { object: group, anchor: 'chest' };
    }
    case 'bag': {
      const bag = box(0.2, 0.22, 0.13, '#f2f2ee', { transparent: true, opacity: 0.86 });
      bag.position.y = -0.17;
      group.add(bag);
      [-0.05, 0.05].forEach((x) => group.add(atPos(box(0.014, 0.08, 0.01, '#f2f2ee'), x, -0.04, 0)));
      group.add(atPos(box(0.14, 0.1, 0.08, '#6b8f4e'), 0, -0.19, 0));
      return { object: group, anchor: 'right' };
    }
    case 'tasbih':
    case 'rosary': {
      const beads = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 18), mat(kind === 'rosary' ? '#8a6a4e' : '#3d5a4c'));
      group.add(beads);
      if (kind === 'rosary') {
        group.add(atPos(box(0.015, 0.05, 0.01, '#d8b14a'), 0, -0.1, 0));
      }
      group.position.set(0, 0.74, 0.36);
      group.rotation.x = -1.2;
      return { object: group, anchor: 'chest' };
    }
    default:
      return null;
  }
}

function attachProp(avatar, kind) {
  if (Array.isArray(kind)) {
    return kind.map((one) => attachProp(avatar, one)).filter(Boolean);
  }
  const prop = makeProp(kind);
  if (!prop) {
    return null;
  }
  if (prop.anchor === 'right') {
    avatar.hands[0].add(prop.object);
  } else if (prop.anchor === 'left') {
    avatar.hands[1].add(prop.object);
  } else {
    avatar.body.add(prop.object);
  }
  return prop.object;
}

function detach(object) {
  if (Array.isArray(object)) {
    object.forEach(detach);
    return;
  }
  if (object && object.parent) {
    object.parent.remove(object);
  }
}

// Carry something while walking: a tray with your order, or a takeaway bag.
export function setCarry(avatar, kind) {
  detach(avatar.carryProp);
  avatar.carryProp = null;
  avatar.carryKind = kind || null;
  if (kind === 'tray') {
    avatar.carryProp = attachProp(avatar, 'servetray');
  } else if (kind === 'bag') {
    avatar.carryProp = attachProp(avatar, 'bag');
  }
}

// ---------- Action clips ----------
// Keyframes: [time s, rightX, rightZ, leftX, leftZ, lean, crouch]. `release` = when the offering is
// placed in the world (the effect appears then); `end` = clip length.
const REST = [0, 0.12, 0, -0.12];
const FOREHEAD = [-2.3, -0.55, -2.3, 0.55];
const CHEST = [-1.2, -0.62, -1.2, 0.62];
const LOW = [-0.9, -0.5, -0.9, 0.5];
const k = (t, arms, lean = 0, crouch = 0, extra = {}) => ({ t, arms, lean, crouch, ...extra });

export const CLIPS = {
  // Hold the incense to the forehead, bow three times, then plant it.
  incense: {
    prop: 'incense', release: 3.9, end: 4.6,
    frames: [k(0, REST), k(0.5, [-1.1, -0.65, -1.1, 0.65]), k(1.0, FOREHEAD), k(1.4, [-1.9, -0.55, -1.9, 0.55], 0.38),
      k(1.8, FOREHEAD), k(2.2, [-1.9, -0.55, -1.9, 0.55], 0.38), k(2.6, FOREHEAD), k(3.0, [-1.9, -0.55, -1.9, 0.55], 0.38),
      k(3.4, FOREHEAD), k(3.9, [-1.25, -0.3, -0.4, -0.1], 0.28, 0.1), k(4.6, REST)],
  },
  // Light the candle at arm's length, then fold the hands in prayer.
  candle: {
    prop: 'taper', release: 1.0, end: 3.4,
    frames: [k(0, REST), k(0.55, [-1.45, -0.1, 0, -0.12], 0.15, 0.05), k(1.1, [-1.45, -0.1, 0, -0.12], 0.15, 0.05), k(1.7, CHEST, 0.1), k(2.9, CHEST, 0.12), k(3.4, REST)],
  },
  // Reach up and hang the lantern.
  lantern: {
    prop: 'lantern', release: 1.05, end: 2.0,
    frames: [k(0, REST), k(0.6, [-2.8, -0.25, -2.8, 0.25], -0.06), k(1.3, [-2.8, -0.25, -2.8, 0.25], -0.06), k(2.0, REST)],
  },
  // Kneel by the pond and set the lotus on the water.
  lotus: {
    prop: 'lotus', release: 1.1, end: 2.7,
    frames: [k(0, REST), k(0.5, LOW, 0.45, 0.36), k(1.4, LOW, 0.45, 0.36), k(2.0, CHEST, 0.05), k(2.7, REST)],
  },
  // Place the canang sari, then sembah with the hands raised to the forehead (cakupang tangan).
  canang: {
    prop: 'tray', release: 1.1, end: 3.5,
    frames: [k(0, REST), k(0.5, LOW, 0.4, 0.38), k(1.3, LOW, 0.4, 0.38), k(1.7, CHEST), k(2.1, [-2.45, -0.6, -2.45, 0.6]), k(3.0, [-2.45, -0.6, -2.45, 0.6], 0.1), k(3.5, REST)],
  },
  // Feed the paper into the furnace, then bow.
  kimcua: {
    prop: 'paper', release: 0.9, end: 3.0,
    frames: [k(0, REST), k(0.45, [-1.4, -0.2, -1.2, 0.25], 0.12), k(0.9, [-1.75, -0.2, -1.2, 0.25], 0.18), k(1.5, CHEST), k(2.2, CHEST, 0.32), k(3.0, REST)],
  },
  // Wudu: scoop water, wash the face twice, then each forearm.
  water: {
    release: 0.35, end: 3.6,
    frames: [k(0, REST), k(0.4, LOW, 0.3, 0.2), k(0.9, [-2.3, -0.7, -2.3, 0.7], 0.12), k(1.3, LOW, 0.3, 0.2), k(1.8, [-2.3, -0.7, -2.3, 0.7], 0.12),
      k(2.3, [-1.3, -1.0, -1.2, 0.3], 0.15), k(2.9, [-1.2, -0.3, -1.3, 1.0], 0.15), k(3.6, REST)],
  },
  flowers: {
    prop: 'bouquet', release: 1.0, end: 2.9,
    frames: [k(0, REST), k(0.5, LOW, 0.3, 0.26), k(1.2, LOW, 0.3, 0.26), k(1.7, CHEST, 0.08), k(2.4, CHEST, 0.08), k(2.9, REST)],
  },
  // Wind up and toss a pebble.
  ripple: {
    prop: 'pebble', release: 0.62, end: 1.4,
    frames: [k(0, REST), k(0.35, [-3.3, 0.2, 0, -0.12], -0.1), k(0.62, [-1.2, -0.1, 0, -0.12], 0.18), k(1.4, REST)],
  },
  // Pull the bell rope / strike the gong twice.
  bell: {
    release: 0.6, end: 1.8,
    frames: [k(0, REST), k(0.3, [-2.7, -0.1, 0, -0.12]), k(0.6, [-1.2, -0.1, 0, -0.12], 0.12), k(0.9, [-2.7, -0.1, 0, -0.12]), k(1.2, [-1.2, -0.1, 0, -0.12], 0.12), k(1.8, REST)],
  },
  // Shake the ciam si cylinder until a stick falls out.
  ciamsi: {
    prop: 'ciamsi', end: 2.4,
    frames: [k(0, REST), k(0.4, CHEST, 0.2, 0, { shake: 1 }), k(2.0, CHEST, 0.2, 0, { shake: 1 }), k(2.4, REST)],
  },
  // ---- Cooking (looping while the hawker works) ----
  // Stir-fry: spatula scraping and tossing in the wok, left hand on the wok handle.
  wok: {
    prop: 'spatula', loop: true, end: 1.0,
    frames: [k(0, [-1.0, -0.35, -0.95, 0.15], 0.12), k(0.2, [-1.85, -0.1, -1.25, 0.28], 0.02), k(0.42, [-0.72, -0.5, -0.85, 0.1], 0.18),
      k(0.6, [-1.55, -0.15, -1.2, 0.26], 0.05), k(0.8, [-0.8, -0.3, -0.9, 0.12], 0.16), k(1.0, [-1.0, -0.35, -0.95, 0.15], 0.12)],
  },
  // Slow stirring of a big pot or kuali with a ladle.
  stir: {
    prop: 'ladle', loop: true, end: 1.6,
    frames: [k(0, [-0.85, -0.55, -0.55, 0.1], 0.2), k(0.4, [-0.7, 0.05, -0.55, 0.1], 0.22), k(0.8, [-1.35, 0.2, -0.55, 0.1], 0.12),
      k(1.2, [-1.6, -0.35, -0.55, 0.1], 0.08), k(1.6, [-0.85, -0.55, -0.55, 0.1], 0.2)],
  },
  // Fanning the charcoal with a bamboo fan, tongs in the other hand.
  fan: {
    prop: ['fan', 'tongs'], loop: true, end: 0.36,
    frames: [k(0, [-1.0, 0.3, -0.95, 0.25], 0.12), k(0.18, [-1.45, 0.05, -0.95, 0.25], 0.12), k(0.36, [-1.0, 0.3, -0.95, 0.25], 0.12)],
  },
  // Pour from a height ("tarik") to cool and froth the drink.
  pour: {
    prop: ['kettle', 'cup'], loop: true, end: 2.4,
    frames: [k(0, [-1.3, -0.3, -1.0, 0.3]), k(0.8, [-2.7, -0.2, -0.7, 0.25], -0.04), k(1.4, [-2.7, -0.2, -0.7, 0.25], -0.04),
      k(2.0, [-1.3, -0.3, -1.0, 0.3]), k(2.4, [-1.3, -0.3, -1.0, 0.3])],
  },
  // Cleaver on the chopping block.
  chop: {
    prop: 'cleaver', loop: true, end: 0.5,
    frames: [k(0, [-1.65, -0.2, -0.9, 0.3], 0.18), k(0.18, [-0.95, -0.2, -0.9, 0.3], 0.22), k(0.5, [-1.65, -0.2, -0.9, 0.3], 0.18)],
  },
  // Lift the steamer lid, check, put it back.
  steam: {
    loop: true, end: 2.2,
    frames: [k(0, [-1.0, -0.3, -1.0, 0.3], 0.1), k(0.6, [-1.7, -0.3, -1.7, 0.3], 0.02), k(1.4, [-1.7, -0.3, -1.7, 0.3], 0.02), k(2.2, [-1.0, -0.3, -1.0, 0.3], 0.1)],
  },
  // Lowering food into hot oil with tongs.
  fry: {
    prop: 'spatula', loop: true, end: 1.4,
    frames: [k(0, [-1.2, -0.2, -0.6, 0.15], 0.12), k(0.5, [-0.85, -0.2, -0.6, 0.15], 0.2), k(1.0, [-1.3, -0.25, -0.6, 0.15], 0.12), k(1.4, [-1.2, -0.2, -0.6, 0.15], 0.12)],
  },
  // Spread dough / batter on a flat griddle.
  griddle: {
    prop: 'spatula', loop: true, end: 1.2,
    frames: [k(0, [-0.95, -0.5, -0.9, 0.3], 0.2), k(0.4, [-0.95, 0.1, -0.9, 0.3], 0.2), k(0.8, [-1.1, -0.2, -0.9, 0.3], 0.22), k(1.2, [-0.95, -0.5, -0.9, 0.3], 0.2)],
  },
  // Hand the plate over the counter.
  serve: {
    prop: 'servetray', release: 0.75, end: 1.3,
    frames: [k(0, REST), k(0.45, [-1.2, -0.35, -1.2, 0.35], 0.12), k(0.75, [-1.0, -0.35, -1.0, 0.35], 0.2), k(1.3, REST)],
  },
  wipe: {
    prop: 'cloth', loop: true, end: 1.4,
    frames: [k(0, [-0.9, -0.3, 0, -0.12], 0.2), k(0.35, [-0.9, 0.15, 0, -0.12], 0.2), k(0.7, [-1.05, -0.1, 0, -0.12], 0.22), k(1.05, [-0.85, -0.45, 0, -0.12], 0.2), k(1.4, [-0.9, -0.3, 0, -0.12], 0.2)],
  },
  // ---- Diners ----
  eat: {
    prop: 'spoon', loop: true, end: 3.2,
    frames: [k(0, [-0.75, -0.3, -0.7, 0.3], 0.12), k(0.8, [-0.8, -0.3, -0.7, 0.3], 0.16), k(1.25, [-2.0, -0.6, -0.7, 0.3], 0.05),
      k(1.6, [-2.0, -0.6, -0.7, 0.3], 0.05), k(2.1, [-0.75, -0.3, -0.7, 0.3], 0.12), k(3.2, [-0.75, -0.3, -0.7, 0.3], 0.12)],
  },
  eatsticks: {
    prop: 'chopsticks', loop: true, end: 3.0,
    frames: [k(0, [-0.8, -0.3, -0.9, 0.35], 0.14), k(0.7, [-0.85, -0.3, -0.95, 0.35], 0.2), k(1.15, [-1.95, -0.55, -1.2, 0.4], 0.08),
      k(1.5, [-1.95, -0.55, -1.2, 0.4], 0.08), k(2.0, [-0.8, -0.3, -0.9, 0.35], 0.14), k(3.0, [-0.8, -0.3, -0.9, 0.35], 0.14)],
  },
  // Chatting: small open-hand gestures.
  talk: {
    loop: true, end: 2.6,
    frames: [k(0, [-0.35, 0.15, -0.3, -0.12]), k(0.6, [-0.75, 0.3, -0.3, -0.12], 0.03), k(1.2, [-0.45, 0.1, -0.6, -0.3]), k(1.9, [-0.7, 0.25, -0.55, -0.25], 0.02), k(2.6, [-0.35, 0.15, -0.3, -0.12])],
  },
  // Wash the hands (before eating with the hand, at the tap or kobokan).
  wash: {
    release: 0.3, end: 2.4,
    frames: [k(0, REST), k(0.4, [-0.95, -0.55, -0.95, 0.55], 0.25, 0.1), k(0.9, [-1.05, -0.45, -0.95, 0.65], 0.25, 0.1),
      k(1.4, [-0.95, -0.65, -1.05, 0.45], 0.25, 0.1), k(1.9, [-1.0, -0.5, -1.0, 0.55], 0.25, 0.1), k(2.4, REST)],
  },
  read: {
    prop: 'book', end: 2.4,
    frames: [k(0, REST), k(0.5, [-1.1, -0.45, -1.1, 0.45], 0.15), k(2.0, [-1.1, -0.45, -1.1, 0.45], 0.18), k(2.4, REST)],
  },
};

// Sitting poses per activity.
const SIT_POSES = {
  meditate: { arms: [-0.55, -0.48, -0.55, 0.48], lean: 0.02 },
  pray: { arms: [-1.25, -0.62, -1.25, 0.62], lean: 0.06 },
  dzikir: { arms: [-0.6, -0.35, -0.5, 0.25], lean: 0.08, prop: 'tasbih', fingers: true },
  rosary: { arms: [-0.85, -0.6, -0.85, 0.6], lean: 0.1, prop: 'rosary', fingers: true },
  breathe: { arms: [-0.45, -0.2, -0.45, 0.2], lean: 0, breathe: true },
  meal: { arms: [-0.75, -0.35, -0.75, 0.35], lean: 0.1 },
  rest: { arms: [-0.35, -0.2, -0.35, 0.2], lean: 0 },
};

export function playClip(avatar, kind, { onRelease, onEnd } = {}) {
  const def = CLIPS[kind];
  if (!def) {
    if (onRelease) {
      onRelease();
    }
    if (onEnd) {
      onEnd();
    }
    return false;
  }
  stopClip(avatar);
  avatar.pose = 'rest';
  avatar.clip = {
    def, time: 0, released: false, onRelease, onEnd,
    prop: def.prop ? attachProp(avatar, def.prop) : null,
  };
  return true;
}

// Interrupted (e.g. the visitor walks away): the offering still lands so nothing is lost, but
// follow-ups such as opening the ciam si / reading page are skipped.
export function stopClip(avatar) {
  const clip = avatar.clip;
  if (!clip) {
    return;
  }
  avatar.clip = null;
  detach(clip.prop);
  if (!clip.released && clip.onRelease) {
    clip.onRelease();
  }
}

function smooth(x) {
  return x * x * (3 - 2 * x);
}

function sampleClip(def, time) {
  const frames = def.frames;
  if (time <= frames[0].t) {
    return frames[0];
  }
  for (let i = 1; i < frames.length; i++) {
    const b = frames[i];
    if (time <= b.t) {
      const a = frames[i - 1];
      const u = smooth((time - a.t) / Math.max(0.0001, b.t - a.t));
      return {
        arms: a.arms.map((value, index) => value + (b.arms[index] - value) * u),
        lean: a.lean + (b.lean - a.lean) * u,
        crouch: a.crouch + (b.crouch - a.crouch) * u,
        shake: a.shake && b.shake,
      };
    }
  }
  return frames[frames.length - 1];
}

export function setSitting(avatar, sitting, { sitMode = null, seat = null } = {}) {
  avatar.sitting = sitting;
  avatar.sitMode = sitting ? sitMode : null;
  avatar.seat = sitting ? seat : null;
  detach(avatar.sitProp);
  avatar.sitProp = null;
  const pose = sitting ? SIT_POSES[sitMode] : null;
  if (pose && pose.prop) {
    avatar.sitProp = attachProp(avatar, pose.prop);
  }
}

// One animation step for an avatar: action clip > sitting > greeting gesture > walking > idle.
export function animateAvatar(avatar, delta, now, elapsed) {
  let arms;
  let lean = 0;
  let crouch = 0;
  let bob = 0;

  if (avatar.clip) {
    const clip = avatar.clip;
    clip.time += delta;
    const sample = sampleClip(clip.def, clip.time);
    arms = [...sample.arms];
    lean = sample.lean;
    crouch = sample.crouch;
    if (sample.shake) {
      const wobble = Math.sin(clip.time * 28) * 0.12;
      arms[0] += wobble;
      arms[2] += wobble;
    }
    if (!clip.released && clip.def.release !== undefined && clip.time >= clip.def.release) {
      clip.released = true;
      if (clip.def.prop && clip.def.prop !== 'ciamsi' && clip.def.prop !== 'book') {
        detach(clip.prop);
        clip.prop = null;
      }
      if (clip.onRelease) {
        clip.onRelease();
      }
    }
    if (clip.time >= clip.def.end) {
      if (clip.def.loop) {
        clip.time %= clip.def.end;
      } else {
        avatar.clip = null;
        detach(clip.prop);
        if (clip.onEnd) {
          clip.onEnd();
        }
      }
    }
  } else if (avatar.sitting) {
    const pose = SIT_POSES[avatar.sitMode] || SIT_POSES.pray;
    arms = [...pose.arms];
    lean = pose.lean;
    if (pose.fingers) {
      // Counting beads: a small, slow motion of the right hand.
      arms[0] += Math.sin(elapsed * 2.2) * 0.05;
    }
    if (pose.breathe) {
      avatar.body.scale.y = 1 + Math.sin(elapsed * 0.9) * 0.02;
    }
  } else {
    if (avatar.pose !== 'rest' && now > avatar.poseUntil) {
      avatar.pose = 'rest';
    }
    const pose = POSES[avatar.pose] || POSES.rest;
    arms = [...pose.arms];
    lean = pose.lean;
    const t = (now - avatar.poseStart) / 1000;
    if (pose.wave) {
      arms[1] += Math.sin(t * 9) * 0.35;
    }
    if (pose.cross) {
      // forehead → chest → left shoulder → right shoulder
      const step = Math.min(3, Math.floor(t / 0.6));
      [arms[0], arms[1]] = [[-2.3, -0.45], [-1.0, -0.55], [-1.5, -1.05], [-1.5, -0.2]][step];
    }
    if (avatar.moving && avatar.pose === 'rest') {
      avatar.walkPhase += delta * 9;
      const swing = Math.sin(avatar.walkPhase) * 0.45;
      arms[0] = swing;
      arms[2] = -swing;
      bob = Math.abs(Math.sin(avatar.walkPhase)) * 0.05;
    }
    if (avatar.carryKind === 'tray' && avatar.pose === 'rest') {
      arms = [-0.95, -0.42, -0.95, 0.42];
    } else if (avatar.carryKind === 'bag' && avatar.pose === 'rest') {
      arms[0] = -0.12 + Math.sin(avatar.walkPhase) * 0.08;
      arms[1] = 0.12;
    }
  }
  if (!avatar.sitting || !(SIT_POSES[avatar.sitMode] || {}).breathe) {
    avatar.body.scale.y += ((1 + Math.sin(elapsed * 1.7) * 0.006) - avatar.body.scale.y) * 0.2;
  }

  const blend = Math.min(1, delta * 10);
  const [right, left] = avatar.arms;
  right.rotation.x += (arms[0] - right.rotation.x) * blend;
  right.rotation.z += (arms[1] - right.rotation.z) * blend;
  left.rotation.x += (arms[2] - left.rotation.x) * blend;
  left.rotation.z += (arms[3] - left.rotation.z) * blend;
  avatar.body.rotation.x += (lean - avatar.body.rotation.x) * blend;

  // Sitting: lower the body and show legs (cross-legged on the floor/bale, or on a bench).
  const style = avatar.sitting ? (avatar.seat && !avatar.seat.cross ? 'bench' : 'cross') : null;
  avatar.sitBlend += ((avatar.sitting ? 1 : 0) - avatar.sitBlend) * Math.min(1, delta * 6);
  const sitDrop = style === 'bench' ? 0.45 : 0.46;
  avatar.body.position.y = -sitDrop * avatar.sitBlend - crouch + bob;
  avatar.crossLegs.visible = style === 'cross' && avatar.sitBlend > 0.5;
  avatar.benchLegs.visible = style === 'bench' && avatar.sitBlend > 0.5;
  avatar.lower.visible = style !== 'bench' || avatar.sitBlend < 0.5;
  avatar.label.position.y = 2.05 - 0.45 * avatar.sitBlend;

  if (avatar.bubble && now > avatar.bubbleUntil) {
    avatar.group.remove(avatar.bubble);
    avatar.bubble = null;
  }
}
