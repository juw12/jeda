// Eating in first person: the dishes you ordered on the table in front of you, close up.
// Each tap = one bite or sip: chopsticks / spoon / your hand picks a portion, brings it to your mouth,
// and the matching sound plays (slurp, crunch, chew, sip). Drawn as an overlay scene on top of the
// world (like the sacred objects in handheld.js), so the table always looks the same on every device.

import * as THREE from '../../vendor/three.module.min.js';
import { buildDish } from './dishes.js';
import { asmr } from '../audio.js';

const SKIN = '#e9c7a6';

function surfaceTexture(style) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const c = canvas.getContext('2d');
  if (style === 'marble') {
    c.fillStyle = '#f1efea';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 18; i++) {
      c.strokeStyle = `rgba(120,120,125,${0.08 + Math.random() * 0.18})`;
      c.lineWidth = 0.6 + Math.random() * 2;
      c.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      c.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 40;
        y += 20 + Math.random() * 30;
        c.lineTo(x, y);
      }
      c.stroke();
    }
  } else if (style === 'formica') {
    c.fillStyle = '#e8dcc0';
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      c.fillStyle = `rgba(150,120,80,${Math.random() * 0.12})`;
      c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
  } else if (style === 'bamboo') {
    c.fillStyle = '#d2b07a';
    c.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 32) {
      c.fillStyle = 'rgba(90,60,25,0.35)';
      c.fillRect(x, 0, 2, 512);
      for (let y = 40 + (x % 3) * 30; y < 512; y += 140) {
        c.fillRect(x, y, 32, 3);
      }
    }
  } else {
    // Warm wood with grain.
    c.fillStyle = style === 'darkwood' ? '#5a3a24' : '#8a5f3c';
    c.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 2) {
      const shade = Math.sin(y * 0.09 + Math.sin(y * 0.013) * 4) * 0.5 + 0.5;
      c.fillStyle = `rgba(40,22,10,${0.03 + shade * 0.07})`;
      c.fillRect(0, y, 512, 2);
    }
    for (let i = 0; i < 6; i++) {
      c.fillStyle = 'rgba(30,15,5,0.25)';
      c.beginPath();
      c.ellipse(Math.random() * 512, Math.random() * 512, 18, 6, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function softTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const c = canvas.getContext('2d');
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function material(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...extra });
}

// ---------- Utensils ----------
function chopsticks() {
  const group = new THREE.Group();
  const make = (offset) => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0042, 0.23, 8), material('#b98a4e', { roughness: 0.55, clearcoat: 0.4 }));
    // Tip at the group origin, the stick pointing back toward the eater.
    stick.rotation.x = Math.PI / 2;
    stick.position.set(offset, 0, 0.115);
    return stick;
  };
  const a = make(-0.004);
  const b = make(0.004);
  group.add(a, b);
  group.userData.sticks = [a, b];
  return group;
}

function spoon(color = '#c9cdd2', metal = 0.85) {
  const group = new THREE.Group();
  const bowlShape = new THREE.Mesh(new THREE.SphereGeometry(0.018, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), material(color, { metalness: metal, roughness: 0.22, side: THREE.DoubleSide }));
  bowlShape.scale.set(1, 0.45, 1.35);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.12), material(color, { metalness: metal, roughness: 0.25 }));
  handle.position.set(0, 0.004, 0.08);
  handle.rotation.x = -0.12;
  group.add(bowlShape, handle);
  const broth = new THREE.Mesh(new THREE.CircleGeometry(0.015, 18), material('#d9a24a', { roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }));
  broth.rotation.x = -Math.PI / 2;
  broth.scale.set(1, 1.3, 1);
  broth.position.y = -0.0025;
  broth.visible = false;
  group.add(broth);
  group.userData.broth = broth;
  return group;
}

function fork(color = '#c9cdd2') {
  const group = new THREE.Group();
  const metal = material(color, { metalness: 0.85, roughness: 0.25 });
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.02), metal);
  neck.position.z = 0.012;
  group.add(neck);
  [-0.0075, -0.0025, 0.0025, 0.0075].forEach((x) => {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.0028, 0.0025, 0.03), metal);
    tine.position.set(x, 0, -0.012);
    group.add(tine);
  });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.12), metal);
  handle.position.set(0, 0.004, 0.08);
  handle.rotation.x = -0.12;
  group.add(handle);
  return group;
}

function hand() {
  const group = new THREE.Group();
  const skin = material(SKIN, { roughness: 0.6, sheen: 0.3 });
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.022, 0.08), skin);
  palm.position.set(0, 0.012, 0.055);
  group.add(palm);
  const fingers = [];
  [-0.026, -0.009, 0.009, 0.026].forEach((x, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.012, 0.016);
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, 0.04 - Math.abs(i - 1.5) * 0.006, 4, 8), skin);
    finger.rotation.x = Math.PI / 2;
    finger.position.z = -0.022;
    pivot.add(finger);
    group.add(pivot);
    fingers.push(pivot);
  });
  const thumbPivot = new THREE.Group();
  thumbPivot.position.set(-0.038, 0.01, 0.05);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.03, 4, 8), skin);
  thumb.rotation.set(Math.PI / 2, 0, 0.7);
  thumb.position.set(-0.008, 0, -0.016);
  thumbPivot.add(thumb);
  group.add(thumbPivot);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.12, 14), material('#c9b79c', { roughness: 0.9 }));
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.set(0, 0.014, 0.15);
  group.add(sleeve);
  group.userData.curl = (amount) => {
    fingers.forEach((pivot) => {
      pivot.rotation.x = amount * 1.2;
    });
    thumbPivot.rotation.y = -amount * 0.6;
  };
  return group;
}

const ease = (x) => x * x * (3 - 2 * x);
const lerp = THREE.MathUtils.lerp;

// A small warm "room" the food reflects: cream walls, a bright window and a lamp. Without an
// environment, glass, glaze, broth and clearcoat have nothing to mirror and read as flat or murky.
const roomEnvironments = new WeakMap();
function roomEnvironment(renderer) {
  if (roomEnvironments.has(renderer)) {
    return roomEnvironments.get(renderer);
  }
  const room = new THREE.Scene();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshBasicMaterial({ color: '#6b5a48', side: THREE.BackSide }));
  walls.position.y = 1.4;
  room.add(walls);
  const panel = (color, width, height, x, y, z, rotationY = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    room.add(mesh);
  };
  panel('#fff6e6', 2.2, 1.4, -2.9, 1.6, -0.6, Math.PI / 2);   // window
  panel('#ffe2b8', 0.9, 0.9, 0.6, 3.3, -0.4, 0);              // lamp above
  panel('#c9b39a', 6, 1.2, 0, 0.2, -2.9, 0);                  // far wall band
  const generator = new THREE.PMREMGenerator(renderer);
  const texture = generator.fromScene(room, 0.04).texture;
  generator.dispose();
  roomEnvironments.set(renderer, texture);
  return texture;
}

// The room behind the table, out of focus: a warm gradient with soft bokeh lamps, tinted to match the
// table style. The lower band equals the fog colour so the far table edge melts into it (no hard
// horizon, and the world scene behind the overlay never shows through).
const BACKDROPS = {
  wood: { top: '#3b2a1e', mid: '#7a5638', fog: '#a37b56', lamps: ['#ffd9a0', '#ffc27a', '#fff0d0'] },
  darkwood: { top: '#2a1512', mid: '#5e2a20', fog: '#7d4632', lamps: ['#ff9a6a', '#ffcf7a', '#ff6f5a'] },
  marble: { top: '#4a4640', mid: '#8f877b', fog: '#b9b0a2', lamps: ['#fff4e0', '#ffe2b0', '#e8f0ff'] },
  formica: { top: '#3e3a2c', mid: '#8a7c58', fog: '#b9a77e', lamps: ['#fff6d8', '#d8f0ff', '#ffe0a0'] },
  bamboo: { top: '#2b3020', mid: '#5f6a3e', fog: '#9c935f', lamps: ['#fff0b8', '#ffd890', '#e0ffd0'] },
};

function backdropTexture(style) {
  const palette = BACKDROPS[style] || BACKDROPS.wood;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  const gradient = c.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, palette.top);
  gradient.addColorStop(0.42, palette.mid);
  gradient.addColorStop(0.68, palette.fog);
  gradient.addColorStop(1, palette.fog);
  c.fillStyle = gradient;
  c.fillRect(0, 0, size, size);
  // Seeded positions so every visit to the same kind of kedai looks the same.
  let seed = style.length * 97 + 13;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) {
    const x = random() * size;
    const y = size * (0.06 + random() * 0.42);
    const radius = 10 + random() * 26;
    const color = palette.lamps[i % palette.lamps.length];
    const glow = c.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.55, color + '66');
    glow.addColorStop(1, color + '00');
    c.globalAlpha = 0.18 + random() * 0.3;
    c.fillStyle = glow;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  // Vignette keeps attention on the plate.
  const vignette = c.createRadialGradient(size / 2, size * 0.7, size * 0.2, size / 2, size * 0.6, size * 0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  c.fillStyle = vignette;
  c.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, fog: palette.fog };
}

export function createMeal(items, { table = 'wood', note = '', title = '' } = {}) {
  const scene = new THREE.Scene();
  const backdrop = backdropTexture(table);
  scene.background = backdrop.texture;
  scene.fog = new THREE.Fog(backdrop.fog, 0.98, 1.6);
  let ambientFactor = 1;
  const hemi = new THREE.HemisphereLight('#fff1dd', '#4d3a2a', 0.9);
  const key = new THREE.DirectionalLight('#fff0dc', 2.3);
  key.position.set(-0.5, 1.2, -0.2);
  const fill = new THREE.DirectionalLight('#d9e6ff', 0.55);
  fill.position.set(0.8, 0.6, 0.9);
  const rim = new THREE.DirectionalLight('#ffd9a8', 0.9);
  rim.position.set(0.2, 0.4, -1.2);
  scene.add(hemi, key, fill, rim);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
  camera.position.set(0, 0.36, 0.3);
  camera.lookAt(0, 0, -0.07);

  const holder = new THREE.Group();
  scene.add(holder);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshPhysicalMaterial({
    map: surfaceTexture(table), roughness: table === 'marble' ? 0.25 : 0.6, clearcoat: table === 'marble' || table === 'formica' ? 0.6 : 0.15,
  }));
  top.rotation.x = -Math.PI / 2;
  top.position.z = -0.5;
  holder.add(top);
  const shadowTexture = softTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');

  // ---------- Lay the table ----------
  const layout = [[0, -0.05], [0.2, -0.13], [-0.2, -0.13], [0.33, 0.0]];
  // How far the laid table spreads sideways (used to fit narrow screens without over-shrinking a
  // single plate).
  let reach = 0.12;
  const dishes = items.map((item, index) => {
    const built = buildDish(item.spec);
    const [x, z] = layout[index] || [(index - 1) * 0.2, -0.2];
    built.group.position.set(x, 0, z);
    holder.add(built.group);
    // Contact shadow sized to the dish's own footprint (a glass must not sit in a plate-sized pool).
    const footprint = new THREE.Box3().setFromObject(built.group).getSize(new THREE.Vector3());
    const shadowSize = THREE.MathUtils.clamp(Math.max(footprint.x, footprint.z) * 1.45, 0.07, 0.36);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(shadowSize, shadowSize), new THREE.MeshBasicMaterial({
      map: shadowTexture, transparent: true, depthWrite: false, opacity: built.drink ? 0.6 : 1,
    }));
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(x + shadowSize * 0.03, 0.0005, z + shadowSize * 0.03);
    holder.add(contact);
    reach = Math.max(reach, Math.abs(x) + footprint.x / 2);
    return {
      item,
      built,
      index,
      left: built.portions.slice(),
      eaten: 0,
      bitesInPortion: 0,
      level: built.liquid ? 1 : null,
    };
  });

  // Utensils for this meal (the first dish decides chopsticks vs spoon & fork vs hand).
  const style = items.find((item) => item.utensil)?.utensil || 'spoon';
  const tools = {};
  if (style === 'chopsticks') {
    tools.sticks = chopsticks();
    tools.sticks.position.set(0.145, 0.006, 0.02);
    tools.sticks.rotation.y = 0.1;
    holder.add(tools.sticks);
    tools.spoon = spoon('#f4f0e6', 0);
    tools.spoon.position.set(0.11, 0.008, 0.07);
    holder.add(tools.spoon);
  } else {
    tools.spoon = spoon();
    tools.spoon.position.set(0.15, 0.006, 0.02);
    tools.spoon.rotation.y = 0.08;
    holder.add(tools.spoon);
    if (style !== 'hand') {
      const leftFork = fork();
      leftFork.position.set(-0.15, 0.006, 0.02);
      holder.add(leftFork);
    }
  }
  tools.hand = hand();
  tools.hand.visible = false;
  holder.add(tools.hand);
  Object.values(tools).forEach((tool) => {
    tool.userData.rest = { position: tool.position.clone(), rotation: tool.rotation.clone() };
  });

  // ---------- Steam & crumbs ----------
  const steamTexture = softTexture();
  const steamCount = 46;
  const steamGeometry = new THREE.BufferGeometry();
  const steamPositions = new Float32Array(steamCount * 3);
  const steamLife = new Float32Array(steamCount).map(() => Math.random());
  steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
  const steam = new THREE.Points(steamGeometry, new THREE.PointsMaterial({ map: steamTexture, size: 0.05, transparent: true, opacity: 0.16, depthWrite: false, color: '#ffffff' }));
  steam.frustumCulled = false;
  holder.add(steam);
  const hotSources = dishes.filter((d) => d.built.hot && d.built.steam).map((d) => d.built.group.position.clone().add(d.built.steam));

  const crumbs = [];
  function spawnCrumbs(at, color = '#c8954a') {
    for (let i = 0; i < 10; i++) {
      const crumb = new THREE.Mesh(new THREE.SphereGeometry(0.0016 + Math.random() * 0.0016, 5, 4), material(color, { roughness: 0.8 }));
      crumb.position.copy(at);
      holder.add(crumb);
      crumbs.push({ mesh: crumb, velocity: new THREE.Vector3((Math.random() - 0.5) * 0.12, -0.05 - Math.random() * 0.1, (Math.random() - 0.5) * 0.1), life: 1.2 });
    }
  }

  // ---------- Bites ----------
  const mouth = new THREE.Vector3(0, 0.28, 0.2);
  let action = null;
  let chewing = 0;
  let inspectYaw = 0;

  function toolFor(dish, portion) {
    if (portion.pick === 'cup') {
      return 'cup';
    }
    if (portion.pick === 'hand' || portion.pick === 'skewer') {
      return 'hand';
    }
    if (portion.pick === 'broth' || portion.pick === 'scoop') {
      if (style === 'hand' && portion.pick === 'scoop' && !dish.built.liquid) {
        return 'hand';
      }
      return 'spoon';
    }
    return tools.sticks ? 'sticks' : 'spoon';
  }

  function worldToHolder(object) {
    const point = new THREE.Vector3();
    object.getWorldPosition(point);
    return holder.worldToLocal(point);
  }

  function step(index = 0) {
    if (action) {
      return null;
    }
    const dish = dishes[index] && dishes[index].left.length ? dishes[index] : dishes.find((d) => d.left.length);
    if (!dish || !dish.left.length) {
      return null;
    }
    const portion = dish.left[0];
    const toolName = toolFor(dish, portion);
    const tool = toolName === 'cup' ? dish.built.group : tools[toolName];
    // Where the bite comes from.
    let target = dish.built.group.position.clone().add(new THREE.Vector3(0, 0.03, 0));
    if (portion.objects.length) {
      target = worldToHolder(portion.objects[0]);
    }
    if (portion.pick === 'skewer' && portion.skewer) {
      target = worldToHolder(portion.skewer).add(new THREE.Vector3(0.09, 0, 0));
    }
    if (portion.pick === 'broth' && dish.built.liquid) {
      target = dish.built.group.position.clone().add(new THREE.Vector3(0.02, dish.built.liquid.mesh.position.y, 0.01));
    }
    action = {
      dish, portion, toolName, tool, target,
      t: 0,
      duration: toolName === 'cup' ? 2.3 : 1.9,
      start: tool.position.clone(),
      startRotation: tool.rotation.clone(),
      attached: false,
      bitten: false,
      carried: [],
      returning: [],
      origin: portion.objects.map((object) => ({ object, parent: object.parent, position: object.position.clone(), quaternion: object.quaternion.clone() })),
      skewerOrigin: portion.skewer ? { position: portion.skewer.position.clone(), quaternion: portion.skewer.quaternion.clone() } : null,
    };
    if (toolName === 'hand') {
      tools.hand.visible = true;
      tools.hand.position.set(0.12, 0.08, 0.22);
      tools.hand.rotation.set(0, 0, 0);
      action.start = tools.hand.position.clone();
      action.startRotation = tools.hand.rotation.clone();
    }
    if (navigator.vibrate) {
      navigator.vibrate(6);
    }
    return portion.sound;
  }

  function finishBite(a) {
    const { dish, portion } = a;
    const bites = portion.bites || 1;
    a.dish.bitesInPortion += 1;
    const lastBite = a.dish.bitesInPortion >= bites;
    // Sound at the moment it reaches the mouth.
    asmr(portion.sound === 'sip' ? 'sip' : portion.sound);
    if (portion.sound === 'crunch' || portion.sound === 'crisp') {
      spawnCrumbs(mouth.clone().add(new THREE.Vector3(0, -0.06, -0.06)));
    }
    chewing = portion.sound === 'sip' ? 1.2 : 2.6;
    if (portion.pick === 'cup' || portion.pick === 'broth') {
      const liquid = dish.built.liquid;
      dish.level = Math.max(0, dish.level - 1 / dish.built.portions.filter((p) => p.pick === portion.pick).length);
      if (liquid && liquid.mesh) {
        const y = lerp(liquid.bottom, liquid.top, dish.level);
        liquid.mesh.position.y = y;
        liquid.mesh.scale.setScalar(liquid.radiusAt ? liquid.radiusAt(y) * (liquid.circle ? 1 / liquid.radiusAt(liquid.top) : 1) : 1);
        liquid.mesh.visible = dish.level > 0.02;
      } else if (liquid && liquid.body) {
        const height = Math.max(0.001, (liquid.fill - liquid.bottom) * dish.level);
        liquid.body.scale.y = height;
        liquid.body.position.y = liquid.bottom + height / 2;
        liquid.body.visible = dish.level > 0.02;
        if (liquid.foam) {
          liquid.foam.position.y = liquid.bottom + height + 0.004;
          liquid.foam.visible = dish.level > 0.05;
        }
        if (liquid.ember) {
          liquid.ember.position.y = Math.max(liquid.bottom + 0.008, liquid.bottom + height - 0.012);
        }
      }
      tools.spoon.userData.broth.visible = false;
    }
    if (!lastBite) {
      a.carried.forEach((object) => object.scale.multiplyScalar(0.64));
      return;
    }
    a.carried.forEach((object) => {
      object.visible = false;
      if (object.parent) {
        object.parent.remove(object);
      }
    });
    a.carried = [];
    if (portion.pick === 'skewer' && portion.last && portion.skewer) {
      portion.skewer.userData.done = true;
    }
    if (portion.shrink) {
      portion.shrink.object.scale.multiplyScalar(1 - portion.shrink.step);
    }
    dish.left.shift();
    dish.bitesInPortion = 0;
    dish.eaten += 1;
    if (dish.built.riceBase) {
      const base = dish.built.riceBase;
      base.userData.baseY = base.userData.baseY ?? base.scale.y;
      const remaining = dish.left.filter((p) => p.objects.some((o) => o.isInstancedMesh)).length;
      const fraction = Math.max(0.05, remaining / dish.built.riceTotal);
      base.scale.set(Math.max(0.25, Math.sqrt(fraction)), base.userData.baseY * fraction, Math.max(0.25, Math.sqrt(fraction)));
      base.visible = remaining > 0;
    }
  }

  function updateAction(delta) {
    if (!action) {
      return;
    }
    const a = action;
    a.t += delta / a.duration;
    const t = Math.min(1, a.t);
    const tool = a.tool;
    const above = a.target.clone().add(new THREE.Vector3(0, 0.05, 0.02));
    const mouthPoint = mouth.clone();
    if (a.toolName === 'cup') {
      // Lift the whole cup/glass to the lips and tip it.
      const home = a.start;
      if (t < 0.4) {
        const k = ease(t / 0.4);
        tool.position.lerpVectors(home, new THREE.Vector3(0.02, 0.2, 0.16), k);
        tool.rotation.x = -0.25 * k;
      } else if (t < 0.65) {
        const k = ease((t - 0.4) / 0.25);
        tool.position.lerpVectors(new THREE.Vector3(0.02, 0.2, 0.16), new THREE.Vector3(0.01, 0.235, 0.215), k);
        tool.rotation.x = lerp(-0.25, -1.0, k);
        if (!a.bitten && t > 0.55) {
          a.bitten = true;
          finishBite(a);
        }
      } else {
        const k = ease((t - 0.65) / 0.35);
        tool.position.lerpVectors(new THREE.Vector3(0.01, 0.235, 0.215), home, k);
        tool.rotation.x = lerp(-1.0, 0, k);
      }
    } else {
      const rest = a.start;
      if (t < 0.3) {
        const k = ease(t / 0.3);
        tool.position.lerpVectors(rest, above, k);
        tool.rotation.x = lerp(a.startRotation.x, -0.35, k);
        if (a.toolName === 'hand') {
          tool.userData.curl(0.1 * k);
        }
      } else if (t < 0.42) {
        const k = ease((t - 0.3) / 0.12);
        tool.position.lerpVectors(above, a.target.clone().add(new THREE.Vector3(0, 0.004, 0.01)), k);
        if (a.toolName === 'hand') {
          tool.userData.curl(0.1 + k * 0.7);
        }
        if (a.toolName === 'sticks') {
          const [s1, s2] = tool.userData.sticks;
          s1.position.x = lerp(-0.008, -0.002, k);
          s2.position.x = lerp(0.008, 0.002, k);
        }
      } else if (t < 0.7) {
        if (!a.attached) {
          a.attached = true;
          a.portion.objects.forEach((object) => {
            object.visible = true;
            tool.attach(object);
            a.carried.push(object);
          });
          if (a.portion.pick === 'broth') {
            tools.spoon.userData.broth.visible = true;
            tools.spoon.userData.broth.material.color.copy(a.dish.built.liquid.mesh.material.color);
          }
          if (a.portion.pick === 'skewer' && a.portion.skewer) {
            tool.attach(a.portion.skewer);
            a.carriedSkewer = a.portion.skewer;
          }
          if (a.portion.sound !== 'sip') {
            asmr('clink', { volume: 0.35 });
          }
        }
        const k = ease((t - 0.42) / 0.28);
        tool.position.lerpVectors(a.target.clone().add(new THREE.Vector3(0, 0.004, 0.01)), mouthPoint, k);
        tool.rotation.x = lerp(-0.35, 0.35, k);
        if (a.portion.pick === 'strands' && a.carried.length) {
          // Noodles hang from the chopsticks as they are lifted.
          a.carried.forEach((object) => {
            object.scale.set(lerp(1, 0.55, k), lerp(1, 1.6, k), lerp(1, 0.55, k));
          });
        }
        if (!a.bitten && t > 0.64) {
          a.bitten = true;
          finishBite(a);
        }
      } else {
        const k = ease((t - 0.7) / 0.3);
        if (a.carried.length && a.carriedHome !== true) {
          // Not finished (a bite out of toast / fritter / bakpao): carry it back down onto the plate,
          // smaller by the bite, instead of leaving it hanging where the mouth was.
          a.carriedHome = true;
          a.origin.forEach(({ object, parent, position, quaternion }) => {
            if (object.visible && parent) {
              parent.attach(object);
              a.returning.push({ object, fromPosition: object.position.clone(), fromQuaternion: object.quaternion.clone(), toPosition: position, toQuaternion: quaternion });
            }
          });
          a.carried = [];
        }
        if (a.carriedSkewer) {
          const skewer = a.carriedSkewer;
          a.carriedSkewer = null;
          a.dish.built.group.attach(skewer);
          // A finished stick is laid on the plate rim; a half-eaten one goes back where it lay.
          const toPosition = skewer.userData.done ? new THREE.Vector3(0.1, 0.012, 0.06 + Math.random() * 0.02) : a.skewerOrigin.position;
          const toQuaternion = skewer.userData.done ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.2, 0)) : a.skewerOrigin.quaternion;
          a.returning.push({ object: skewer, fromPosition: skewer.position.clone(), fromQuaternion: skewer.quaternion.clone(), toPosition, toQuaternion });
        }
        a.returning.forEach((item) => {
          item.object.position.lerpVectors(item.fromPosition, item.toPosition, k);
          item.object.quaternion.slerpQuaternions(item.fromQuaternion, item.toQuaternion, k);
        });
        tool.position.lerpVectors(mouthPoint, a.toolName === 'hand' ? new THREE.Vector3(0.14, 0.06, 0.3) : tool.userData.rest.position, k);
        tool.rotation.x = lerp(0.35, tool.userData.rest.rotation.x, k);
        if (a.toolName === 'hand') {
          tool.userData.curl(0.8 * (1 - k));
        }
        if (a.toolName === 'sticks') {
          const [s1, s2] = tool.userData.sticks;
          s1.position.x = lerp(-0.002, -0.004, k);
          s2.position.x = lerp(0.002, 0.004, k);
        }
      }
    }
    if (t >= 1) {
      a.returning.forEach((item) => {
        item.object.position.copy(item.toPosition);
        item.object.quaternion.copy(item.toQuaternion);
      });
      if (a.toolName === 'hand') {
        tools.hand.visible = false;
      }
      if (a.toolName !== 'cup') {
        tool.position.copy(tool.userData.rest.position);
        tool.rotation.copy(tool.userData.rest.rotation);
      } else {
        tool.position.copy(a.start);
        tool.rotation.set(0, 0, 0);
      }
      action = null;
    }
  }

  function describe() {
    const list = dishes.map((d) => ({
      name: d.item.name,
      verb: d.item.verb || (d.built.drink ? 'Seruput' : 'Suap'),
      left: d.left.reduce((sum, p) => sum + (p.bites || 1), 0) - d.bitesInPortion,
      total: d.built.total,
      drink: Boolean(d.built.drink),
    }));
    return {
      meal: true,
      kind: 'meal',
      name: title || items.map((item) => item.name).join(' & '),
      icon: '🍽',
      items: list,
      busy: Boolean(action),
      done: list.every((d) => d.left <= 0),
      note,
      observe: false,
    };
  }

  return {
    scene,
    camera,
    def: { id: 'meal', meal: true, name: title, icon: '🍽' },
    step,
    state: describe,
    // Give the scene its reflection environment (needs the renderer, so the engine calls this once).
    prepare(renderer) {
      if (!renderer || scene.environment) {
        return;
      }
      try {
        scene.environment = roomEnvironment(renderer);
        ambientFactor = 0.55;
        hemi.intensity *= ambientFactor;
      } catch (error) {
        // Very old GPUs: keep plain lights.
      }
    },
    inspect(dx) {
      inspectYaw = THREE.MathUtils.clamp(inspectYaw + dx * 0.004, -0.5, 0.5);
    },
    setLighting({ hemiIntensity = 1.3, keyIntensity = 1.6, warm = false } = {}) {
      hemi.intensity = hemiIntensity * 0.75 * ambientFactor;
      key.intensity = keyIntensity * 1.35;
      key.color.set(warm ? '#ffd2a0' : '#fff0dc');
    },
    lift: () => (chewing > 0 ? Math.sin(chewing * 7) * 0.015 : 0),
    resize(aspect, fov) {
      camera.aspect = aspect;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      // Narrow portrait screens: shrink the spread so the main dish and the drink stay in view.
      const halfWidth = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect * 0.5;
      const spread = THREE.MathUtils.clamp((halfWidth * 0.82) / reach, 0.45, 1);
      holder.scale.setScalar(spread);
      // Portrait: the controls sit along the bottom, so tilt the view down a little to lift the
      // plate into the open upper part of the screen.
      const portrait = THREE.MathUtils.clamp((0.9 - aspect) / 0.45, 0, 1);
      camera.position.set(0, 0.36, 0.3);
      camera.lookAt(0, 0, -0.07 + portrait * 0.1);
      // Fog ends just before the (scaled) far table edge so it dissolves into the backdrop.
      const farEdge = Math.hypot(camera.position.y, camera.position.z + 1.3 * spread);
      scene.fog.far = farEdge * 0.97;
      scene.fog.near = Math.max(0.62, farEdge * 0.6);
      // Cover-fit the square backdrop to the screen instead of stretching it.
      const texture = scene.background;
      if (aspect < 1) {
        texture.repeat.set(aspect, 1);
        texture.offset.set((1 - aspect) / 2, 0);
      } else {
        texture.repeat.set(1, 1 / aspect);
        texture.offset.set(0, 0);
      }
    },
    update(delta, elapsed) {
      holder.rotation.y += (inspectYaw - holder.rotation.y) * Math.min(1, delta * 6);
      chewing = Math.max(0, chewing - delta);
      updateAction(delta);
      // Steam rises from hot food and slowly fades as the meal cools.
      for (let i = 0; i < steamCount; i++) {
        steamLife[i] += delta * 0.35;
        const source = hotSources[i % Math.max(1, hotSources.length)];
        if (!source) {
          steamPositions[i * 3 + 1] = -10;
          continue;
        }
        if (steamLife[i] > 1) {
          steamLife[i] = 0;
        }
        const life = steamLife[i];
        steamPositions[i * 3] = source.x + Math.sin(elapsed * 0.8 + i) * 0.02 * life + ((i * 37) % 10 - 5) * 0.003;
        steamPositions[i * 3 + 1] = source.y + life * 0.16;
        steamPositions[i * 3 + 2] = source.z + Math.cos(elapsed * 0.6 + i) * 0.015 * life;
      }
      steamGeometry.attributes.position.needsUpdate = true;
      steam.material.opacity = 0.14 * Math.max(0.3, 1 - elapsed / 600);
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const crumb = crumbs[i];
        crumb.life -= delta;
        crumb.velocity.y -= delta * 0.4;
        crumb.mesh.position.addScaledVector(crumb.velocity, delta);
        if (crumb.mesh.position.y < 0.002) {
          crumb.mesh.position.y = 0.002;
          crumb.velocity.set(0, 0, 0);
        }
        if (crumb.life < -6) {
          holder.remove(crumb.mesh);
          crumbs.splice(i, 1);
        }
      }
    },
    debug: () => ({
      dishes: dishes.map((d) => ({ name: d.item.name, left: d.left.length, eaten: d.eaten, level: d.level })),
      busy: Boolean(action),
      tool: action ? action.toolName : null,
    }),
    dispose() {
      backdrop.texture.dispose();
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
      });
    },
  };
}
