// Jeda 3D world: a calm, walkable place per faith with activities and other visitors.
// Controls: tap/click the ground to walk, tap a glowing spot to go there, drag to look around,
// pinch or scroll to zoom, WASD/arrow keys on desktop.

import * as THREE from '../../vendor/three.module.min.js';
import { buildPlace, mat, box, cyl, sphere, cone } from './places.js';
import { bell, gong, chime, woodblock, crackle } from '../audio.js';
import { greetingById } from './greetings.js';

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (
      canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    ));
  } catch {
    return false;
  }
}

// Pick a starting quality from the device; the loop then adapts to the real frame rate.
// low: no shadows, 1x pixels, fewer particles and lights (older/budget phones)
// medium: soft shadows, up to 1.5x pixels (most phones)  ·  high: laptops/desktops with a good GPU
export function detectQuality() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
  if (memory <= 3 || cores <= 4 && mobile) {
    return 'low';
  }
  if (mobile) {
    return 'medium';
  }
  return 'high';
}

const QUALITY = {
  low: { pixelRatio: 1, shadows: false, shadowMap: 512, lights: 2, particles: 0.5, motes: 25, antialias: false },
  medium: { pixelRatio: 1.5, shadows: true, shadowMap: 1024, lights: 3, particles: 0.8, motes: 45, antialias: true },
  high: { pixelRatio: 2, shadows: true, shadowMap: 1024, lights: 4, particles: 1, motes: 60, antialias: true },
};

const MAX_RENDERED_PEERS = 40;

const SKIES = {
  dawn: { top: '#f0a987', bottom: '#fde5c8', fog: '#f4d8be', sun: '#ffd2a1', sunIntensity: 1.6, hemi: 1.0, sunPos: [-20, 12, 10] },
  day: { top: '#8fc3ea', bottom: '#e9f3f6', fog: '#dceaf0', sun: '#fff4df', sunIntensity: 2.2, hemi: 1.2, sunPos: [12, 30, 14] },
  dusk: { top: '#5b5d9c', bottom: '#f3b07c', fog: '#d9a283', sun: '#ffb27a', sunIntensity: 1.4, hemi: 0.9, sunPos: [24, 10, -6] },
  night: { top: '#0b1230', bottom: '#2c3762', fog: '#1d2546', sun: '#9fb4ff', sunIntensity: 0.55, hemi: 0.55, sunPos: [-10, 26, 8] },
};

function gradientTexture(top, bottom) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let softDot = null;
function softDotTexture() {
  if (softDot) {
    return softDot;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  softDot = new THREE.CanvasTexture(canvas);
  return softDot;
}

function textSprite(text, { color = '#ffffff', background = 'rgba(20,18,16,0.55)', size = 44 } = {}) {
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

// Arm angles per gesture: [rightX, rightZ, leftX, leftZ] (x = raise forward, z = swing in/out), body lean.
const POSES = {
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

function createAvatar(name, color, { visitor = false, host = false } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 12), mat(color, { roughness: 0.7 }));
  robe.position.y = 0.72;
  robe.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat('#f1d9bf', { roughness: 0.6 }));
  head.position.y = 1.52;
  head.castShadow = true;
  // Arms hang from shoulder pivots so gestures (soja, anjali, salam…) read clearly from a distance.
  const arms = [0.36, -0.36].map((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 1.22, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 3, 8), mat(color, { roughness: 0.7 }));
    sleeve.position.y = -0.28;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat('#f1d9bf', { roughness: 0.6 }));
    hand.position.y = -0.56;
    pivot.add(sleeve, hand);
    body.add(pivot);
    return pivot;
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  const labelText = host ? `${name} · pemandu` : visitor ? `${name} · tamu` : name;
  const label = textSprite(labelText, host ? { background: 'rgba(120,80,10,0.8)' } : undefined);
  label.position.y = 2.05;
  body.add(robe, head);
  group.add(body, shadow, label);
  if (host) {
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 32), new THREE.MeshBasicMaterial({ color: '#f3c84b', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.03;
    group.add(halo);
  }
  return {
    group, body, arms, label, target: new THREE.Vector3(), sitting: false, facing: 0,
    pose: 'rest', poseUntil: 0, poseStart: 0, bubble: null, bubbleUntil: 0,
  };
}

export function createWorld(container, options) {
  const {
    sceneId,
    time = 'day',
    me,
    mode = 'home',
    onNearSpot = () => {},
    onAction = () => {},
    onSit = () => {},
    onMove = () => {},
    onSpecial = () => {},
    onQuality = () => {},
    quality: requestedQuality = 'auto',
  } = options;
  const sky = SKIES[time] || SKIES.day;
  let qualityName = requestedQuality === 'auto' ? detectQuality() : requestedQuality;
  const quality = { ...(QUALITY[qualityName] || QUALITY.medium) };

  // Try the nicest renderer first, then progressively simpler ones, so almost every phone gets 3D.
  let renderer = null;
  const attempts = [
    { antialias: quality.antialias, powerPreference: 'high-performance' },
    { antialias: false, powerPreference: 'default' },
    { antialias: false, powerPreference: 'low-power', precision: 'mediump', failIfMajorPerformanceCaveat: false },
  ];
  for (const attempt of attempts) {
    try {
      renderer = new THREE.WebGLRenderer({ ...attempt, preserveDrawingBuffer: false });
      break;
    } catch (error) {
      renderer = null;
    }
  }
  if (!renderer) {
    throw new Error('webgl-unavailable');
  }
  let pixelRatio = Math.min(window.devicePixelRatio || 1, quality.pixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.setAttribute('aria-label', 'Ruang 3D. Ketuk tanah untuk berjalan, ketuk titik bercahaya untuk beraktivitas.');
  renderer.domElement.tabIndex = 0;

  const scene = new THREE.Scene();
  scene.background = gradientTexture(sky.top, sky.bottom);
  scene.fog = new THREE.Fog(sky.fog, 28, 75);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(sky.top, '#8a7b66', sky.hemi));
  const sun = new THREE.DirectionalLight(sky.sun, sky.sunIntensity);
  sun.position.set(...sky.sunPos);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const place = buildPlace(sceneId);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(45, 64), mat(place.ground, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const walkway = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), mat(place.path, { roughness: 1 }));
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.set(0, 0.01, 1.5);
  walkway.receiveShadow = true;
  scene.add(walkway);
  scene.add(place.group);

  if (time === 'night') {
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42;
      starPositions.push(Math.sin(phi) * Math.cos(theta) * 120, Math.cos(phi) * 120, Math.sin(phi) * Math.sin(theta) * 120);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#ffffff', size: 0.9, sizeAttenuation: true, fog: false })));
  }

  // Ambient floating motes (petals by day, fireflies at night)
  const motes = createParticles(quality.motes, time === 'night' ? '#fff3a8' : '#ffffff', time === 'night' ? 0.22 : 0.12);
  motes.points.material.opacity = time === 'night' ? 0.9 : 0.5;
  for (let i = 0; i < motes.count; i++) {
    motes.reset(i, new THREE.Vector3((Math.random() - 0.5) * 30, Math.random() * 6, (Math.random() - 0.5) * 30), new THREE.Vector3(0, 0.05, 0), 1e9);
  }
  scene.add(motes.points);

  // ---------- Spots ----------
  const pickables = [];
  const spotMarkers = [];
  place.spots.forEach((spot) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.75, 32),
      new THREE.MeshBasicMaterial({ color: '#ffe7a8', transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(spot.stand.x, 0.05, spot.stand.z);
    scene.add(ring);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: '#ffe7a8' }));
    beacon.position.copy(spot.position).add(new THREE.Vector3(0, 0.9, 0));
    scene.add(beacon);
    const pick = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.set(spot.stand.x, 1.2, spot.stand.z);
    pick.userData.spot = spot;
    scene.add(pick);
    pickables.push(pick);
    spot.state = { count: 0 };
    spotMarkers.push({ ring, beacon, spot });
  });

  // ---------- Avatars ----------
  const self = createAvatar(me.name, me.color, { visitor: mode === 'visit' });
  self.group.position.set(place.spawn.x, 0, place.spawn.z);
  self.target.copy(self.group.position);
  self.facing = Math.PI;
  scene.add(self.group);
  const peers = new Map();

  // ---------- Camera rig ----------
  const rig = { yaw: 0, pitch: 0.42, distance: 10.5, targetDistance: 10.5 };

  function updateCamera(delta) {
    rig.distance += (rig.targetDistance - rig.distance) * Math.min(1, delta * 6);
    // Look a little ahead of the avatar so it sits in the lower third and the sacred building stays in view.
    const ahead = new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)).multiplyScalar(2.6);
    const focus = self.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)).add(ahead);
    const offset = new THREE.Vector3(
      Math.sin(rig.yaw) * Math.cos(rig.pitch),
      Math.sin(rig.pitch),
      Math.cos(rig.yaw) * Math.cos(rig.pitch),
    ).multiplyScalar(rig.distance);
    camera.position.lerp(focus.clone().add(offset), Math.min(1, delta * 5));
    camera.lookAt(focus);
  }

  // ---------- Effects ----------
  const effects = [];
  const emitters = [];
  // Fixed pool of flame lights: the light count never changes, so three.js never recompiles shaders mid-ritual.
  const LIGHT_POOL_SIZE = quality.lights;
  const dynamicLights = [];
  for (let i = 0; i < LIGHT_POOL_SIZE; i++) {
    const pooled = new THREE.PointLight('#ffb35c', 0, 4, 2);
    pooled.userData.busy = false;
    pooled.userData.since = 0;
    scene.add(pooled);
    dynamicLights.push(pooled);
  }
  function releaseLight(light) {
    if (light) {
      light.intensity = 0;
      light.userData.busy = false;
    }
  }

  function createParticles(count, color, size) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size,
      map: softDotTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const velocities = Array.from({ length: count }, () => new THREE.Vector3());
    const ages = new Float32Array(count).fill(1e9);
    const lifetimes = new Float32Array(count).fill(1);
    return {
      points,
      count,
      reset(i, origin, velocity, life) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;
        velocities[i].copy(velocity);
        ages[i] = 0;
        lifetimes[i] = life;
      },
      step(delta, respawn) {
        for (let i = 0; i < count; i++) {
          ages[i] += delta;
          if (ages[i] > lifetimes[i]) {
            if (!respawn || !respawn(i)) {
              positions[i * 3 + 1] = -999;
              continue;
            }
          }
          positions[i * 3] += velocities[i].x * delta;
          positions[i * 3 + 1] += velocities[i].y * delta;
          positions[i * 3 + 2] += velocities[i].z * delta;
        }
        geometry.attributes.position.needsUpdate = true;
      },
    };
  }

  // A smoke/fire/water emitter at a point for `duration` seconds.
  function addEmitter(origin, { color = '#e9e4dc', size = 0.35, rate = 14, life = 3.2, rise = 0.55, spread = 0.12, duration = 120, count = 60 } = {}) {
    const particles = createParticles(count, color, size);
    scene.add(particles.points);
    const emitter = { particles, origin: origin.clone(), elapsed: 0, duration, accumulator: 0, next: 0 };
    const scaledRate = rate * quality.particles;
    emitter.update = (delta) => {
      emitter.elapsed += delta;
      emitter.accumulator += delta * scaledRate;
      const spawning = emitter.elapsed < duration;
      while (spawning && emitter.accumulator >= 1) {
        emitter.accumulator -= 1;
        const i = emitter.next;
        emitter.next = (emitter.next + 1) % count;
        particles.reset(
          i,
          emitter.origin,
          new THREE.Vector3((Math.random() - 0.5) * spread, rise * (0.7 + Math.random() * 0.6), (Math.random() - 0.5) * spread),
          life,
        );
      }
      particles.step(delta);
      return emitter.elapsed < duration + life;
    };
    emitter.dispose = () => {
      scene.remove(particles.points);
      particles.points.geometry.dispose();
      particles.points.material.dispose();
    };
    emitters.push(emitter);
    return emitter;
  }

  function addTimedObject(object, seconds, onTick, onEnd) {
    scene.add(object);
    effects.push({ object, remaining: seconds, onTick, onEnd });
  }

  function addFlameLight(position, color = '#ffb35c', intensity = 2.2, distance = 4) {
    // Reuse a free pooled light, otherwise take over the oldest one.
    let light = dynamicLights.find((l) => !l.userData.busy);
    if (!light) {
      light = dynamicLights.reduce((oldest, l) => (l.userData.since < oldest.userData.since ? l : oldest));
    }
    light.color.set(color);
    light.intensity = intensity;
    light.distance = distance;
    light.position.copy(position);
    light.userData.busy = true;
    light.userData.since = performance.now();
    light.userData.token = Symbol('owner');
    return light;
  }

  function slotOffset(spot, spacing = 0.22) {
    const slots = spot.slots || 8;
    const index = spot.state.count % slots;
    spot.state.count += 1;
    const row = Math.floor(index / 6);
    const column = index % 6;
    return new THREE.Vector3((column - 2.5) * spacing, 0, row * spacing * 0.9 - 0.1);
  }

  const performers = {
    incense(spot) {
      const base = spot.position.clone().add(slotOffset(spot, 0.16));
      const group = new THREE.Group();
      for (let i = -1; i <= 1; i++) {
        const stick = cyl(0.012, 0.012, 0.7, '#7b3f22', 5);
        stick.position.set(i * 0.05, 0.35, 0);
        stick.rotation.z = i * 0.06;
        const tip = sphere(0.025, '#ff7a2a', 6, { emissive: '#ff6a1a', emissiveIntensity: 2 });
        tip.position.set(i * 0.072, 0.71, 0);
        group.add(stick, tip);
      }
      group.position.copy(base);
      const smoke = addEmitter(base.clone().add(new THREE.Vector3(0, 0.75, 0)), { duration: 150, rate: 9, size: 0.32, life: 3.6, rise: 0.5 });
      addTimedObject(group, 155, (delta, remaining) => {
        group.scale.y = Math.max(0.25, remaining / 155);
        smoke.origin.y = base.y + 0.75 * group.scale.y;
      });
      woodblock();
    },
    candle(spot) {
      const base = spot.position.clone().add(slotOffset(spot));
      const group = new THREE.Group();
      group.add(at(cyl(0.05, 0.055, 0.32, '#f7f1e3', 10), 0, 0.16, 0));
      const flame = cone(0.03, 0.1, '#ffd27a', 8, { emissive: '#ffb347', emissiveIntensity: 3 });
      flame.position.y = 0.38;
      group.add(flame);
      group.position.copy(base);
      const light = addFlameLight(base.clone().add(new THREE.Vector3(0, 0.5, 0)));
      const token = light.userData.token;
      const ownsLight = () => light.userData.token === token;
      addTimedObject(group, 300, (delta, remaining, elapsed) => {
        flame.scale.setScalar(0.85 + Math.sin(elapsed * 17) * 0.08 + Math.random() * 0.05);
        if (ownsLight()) {
          light.intensity = 1.8 + Math.sin(elapsed * 13) * 0.3;
        }
      }, () => {
        if (ownsLight()) {
          releaseLight(light);
        }
      });
      chime();
    },
    lantern(spot) {
      const object = new THREE.Group();
      const body = sphere(0.3, '#d8352a', 12, { emissive: '#e8452f', emissiveIntensity: 0.9 });
      body.scale.y = 1.25;
      const cord = cyl(0.01, 0.01, 0.8, '#3a2a20', 4);
      cord.position.y = 0.75;
      object.add(body, cord);
      object.position.set(spot.position.x + (Math.random() - 0.5) * 10, spot.position.y - 0.2 + Math.random() * 0.4, spot.position.z + 0.4);
      addTimedObject(object, 1e6, (delta, remaining, elapsed) => {
        object.rotation.z = Math.sin(elapsed * 1.3 + object.position.x) * 0.08;
      });
      addFlameLight(object.position, '#ff6a4a', 1.4, 5);
      bell();
    },
    lotus(spot) {
      const lotus = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const petal = cone(0.07, 0.22, i % 2 ? '#f6b8c9' : '#f9d4de', 5);
        const angle = (i / 8) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.1, 0.08, Math.sin(angle) * 0.1);
        petal.rotation.set(Math.sin(angle) * 0.6, 0, -Math.cos(angle) * 0.6);
        lotus.add(petal);
      }
      lotus.add(at(sphere(0.06, '#f3d16b', 8, { emissive: '#f3c84b', emissiveIntensity: 0.6 }), 0, 0.12, 0));
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), mat('#5e8f4f'));
      leaf.rotation.x = -Math.PI / 2;
      lotus.add(leaf);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.8;
      lotus.position.set(spot.position.x + Math.cos(angle) * radius, 0.06, spot.position.z + Math.sin(angle) * radius);
      addTimedObject(lotus, 1e6, (delta, remaining, elapsed) => {
        lotus.rotation.y += delta * 0.08;
        lotus.position.y = 0.06 + Math.sin(elapsed * 1.2) * 0.01;
      });
      chime();
    },
    canang(spot) {
      const base = spot.position.clone().add(slotOffset(spot, 0.34));
      const tray = new THREE.Group();
      tray.add(box(0.28, 0.05, 0.28, '#79a35a'));
      // Flower colours follow the Nawa Sanga directions: east white, south red, west yellow, north dark blue.
      [['#ffffff', 0, -0.07], ['#d9342b', 0.07, 0], ['#f2c533', 0, 0.07], ['#2d3f8f', -0.07, 0]].forEach(([color, x, z]) => {
        tray.add(at(sphere(0.045, color, 8), x, 0.05, z));
      });
      tray.add(at(sphere(0.035, '#f39a2b', 8), 0, 0.06, 0));
      tray.position.copy(base);
      addTimedObject(tray, 1e6);
      addEmitter(base.clone().add(new THREE.Vector3(0.1, 0.3, 0)), { duration: 90, rate: 6, size: 0.28 });
      chime();
    },
    kimcua(spot) {
      addEmitter(spot.position.clone(), { color: '#ff8a3a', size: 0.3, rate: 30, life: 0.9, rise: 1.1, spread: 0.35, duration: 8 });
      addEmitter(spot.position.clone().add(new THREE.Vector3(0, 0.6, 0)), { color: '#8a8580', size: 0.5, rate: 10, life: 3, rise: 0.7, duration: 10 });
      const light = addFlameLight(spot.position.clone().add(new THREE.Vector3(0, 0.4, 0.4)), '#ff7a3a', 3, 5);
      const token = light.userData.token;
      setTimeout(() => {
        if (light.userData.token === token) {
          releaseLight(light);
        }
      }, 9000);
      crackle(5);
    },
    water(spot) {
      addEmitter(spot.position.clone(), { color: '#bfe3f2', size: 0.12, rate: 40, life: 0.9, rise: -0.6, spread: 0.9, duration: 4 });
      chime();
    },
    flowers(spot) {
      const bouquet = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        bouquet.add(at(sphere(0.07, ['#f7f2ea', '#f2b8c6', '#f3d16b'][i % 3], 8), (Math.random() - 0.5) * 0.3, 0.1 + Math.random() * 0.15, (Math.random() - 0.5) * 0.2));
      }
      bouquet.position.copy(spot.position).add(slotOffset(spot, 0.3));
      addTimedObject(bouquet, 1e6);
      chime();
    },
    ripple(spot) {
      const angle = Math.random() * Math.PI * 2;
      const center = new THREE.Vector3(spot.position.x + Math.cos(angle) * 1.5, 0.08, spot.position.z + Math.sin(angle) * 1.5);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.14, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(center);
        let delay = i * 0.5;
        addTimedObject(ring, 3.5 + i * 0.5, (delta) => {
          if (delay > 0) {
            delay -= delta;
            ring.visible = false;
            return;
          }
          ring.visible = true;
          ring.scale.multiplyScalar(1 + delta * 1.6);
          ring.material.opacity = Math.max(0, ring.material.opacity - delta * 0.28);
        });
      }
      woodblock();
    },
    bell(spot) {
      const wave = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffe7a8', transparent: true, opacity: 0.8 }));
      wave.position.copy(spot.position);
      wave.rotation.x = Math.PI / 2;
      addTimedObject(wave, 3, (delta) => {
        wave.scale.multiplyScalar(1 + delta * 1.4);
        wave.material.opacity = Math.max(0, wave.material.opacity - delta * 0.3);
      });
      if (sceneId === 'pura' || sceneId === 'klenteng') {
        gong();
      } else {
        bell();
      }
    },
  };

  function at(object, x, y, z) {
    object.position.set(x, y, z);
    return object;
  }

  // Run an activity locally (and tell the UI to broadcast it unless it came from another visitor).
  function perform(spotId, { remote = false, by = null } = {}) {
    const spot = place.spots.find((s) => s.id === spotId);
    if (!spot) {
      return false;
    }
    if (spot.kind === 'sit') {
      if (!remote) {
        sitAt(spot);
      }
      return true;
    }
    if (spot.kind === 'ciamsi' || spot.kind === 'read') {
      if (!remote) {
        if (spot.kind === 'ciamsi') {
          woodblock();
        }
        onSpecial(spot);
      }
      return true;
    }
    const run = performers[spot.kind];
    if (!run) {
      return false;
    }
    run(spot);
    if (!remote) {
      onAction(spot);
    } else if (by) {
      flashLabel(by, spot);
    }
    return true;
  }

  function flashLabel(peer, spot) {
    const sprite = textSprite(spot.label.toLowerCase(), { background: 'rgba(255,240,200,0.85)', color: '#3a2a10', size: 34 });
    sprite.position.set(0, 2.55, 0);
    peer.group.add(sprite);
    setTimeout(() => peer.group.remove(sprite), 2500);
  }

  function sitAt(spot) {
    self.target.copy(spot.stand);
    self.pendingSit = spot;
  }

  function standUp() {
    if (self.sitting) {
      self.sitting = false;
      onSit(null);
    }
  }

  // A greeting = the faith's own words in a speech bubble + the matching body gesture.
  function greet(avatar, greetingId) {
    const greeting = greetingById(greetingId);
    if (!greeting) {
      return false;
    }
    if (avatar.bubble) {
      avatar.group.remove(avatar.bubble);
    }
    avatar.bubble = textSprite(greeting.say, { background: 'rgba(255,248,232,0.94)', color: '#2a2016', size: 40 });
    avatar.bubble.position.y = 2.6;
    avatar.group.add(avatar.bubble);
    const now = performance.now();
    avatar.bubbleUntil = now + 3600;
    avatar.pose = greeting.pose;
    avatar.poseStart = now;
    avatar.poseUntil = now + (greeting.pose === 'cross' ? 3200 : 2600);
    if (avatar === self && !self.sitting) {
      // Turn toward the camera so you can see your own gesture, then turn back.
      if (!self.faceCameraUntil || now > self.faceCameraUntil) {
        self.facingBeforeGreet = self.facing;
      }
      self.faceCameraUntil = avatar.poseUntil;
    }
    return true;
  }

  function animatePose(avatar, delta, now) {
    if (avatar.pose !== 'rest' && now > avatar.poseUntil) {
      avatar.pose = 'rest';
    }
    const pose = POSES[avatar.pose] || POSES.rest;
    const t = (now - avatar.poseStart) / 1000;
    let [rightX, rightZ, leftX, leftZ] = pose.arms;
    if (pose.wave) {
      rightZ += Math.sin(t * 9) * 0.35;
    }
    if (pose.cross) {
      // forehead → chest → left shoulder → right shoulder
      const step = Math.min(3, Math.floor(t / 0.6));
      [rightX, rightZ] = [[-2.3, -0.45], [-1.0, -0.55], [-1.5, -1.05], [-1.5, -0.2]][step];
    }
    const k = Math.min(1, delta * 9);
    const [right, left] = avatar.arms;
    right.rotation.x += (rightX - right.rotation.x) * k;
    right.rotation.z += (rightZ - right.rotation.z) * k;
    left.rotation.x += (leftX - left.rotation.x) * k;
    left.rotation.z += (leftZ - left.rotation.z) * k;
    avatar.body.rotation.x += (pose.lean - avatar.body.rotation.x) * k;
    if (avatar.bubble && now > avatar.bubbleUntil) {
      avatar.group.remove(avatar.bubble);
      avatar.bubble = null;
    }
  }

  // ---------- Input ----------
  const raycaster = new THREE.Raycaster();
  const pointers = new Map();
  let drag = null;
  let pinchStart = 0;
  const keys = new Set();

  function toNdc(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  }

  function handleTap(event) {
    raycaster.setFromCamera(toNdc(event), camera);
    const spotHit = raycaster.intersectObjects(pickables, false)[0];
    if (spotHit) {
      standUp();
      self.target.copy(spotHit.object.userData.spot.stand);
      self.walkingToSpot = spotHit.object.userData.spot;
      return;
    }
    const groundHit = raycaster.intersectObject(ground, false)[0];
    if (groundHit) {
      standUp();
      const point = groundHit.point;
      const radius = Math.hypot(point.x, point.z);
      if (radius > 24) {
        point.multiplyScalar(24 / radius);
      }
      self.target.set(point.x, 0, point.z);
      self.walkingToSpot = null;
      tapMarker.position.set(point.x, 0.06, point.z);
      tapMarker.material.opacity = 0.9;
    }
  }

  const tapMarker = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  tapMarker.rotation.x = -Math.PI / 2;
  scene.add(tapMarker);

  const canvas = renderer.domElement;
  const onPointerDown = (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, time: performance.now() };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      drag = null;
    }
  };
  const onPointerMove = (event) => {
    if (!pointers.has(event.pointerId)) {
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart) {
        rig.targetDistance = THREE.MathUtils.clamp(rig.targetDistance * (pinchStart / distance), 4, 18);
      }
      pinchStart = distance;
      return;
    }
    if (drag) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      rig.yaw -= dx * 0.006;
      rig.pitch = THREE.MathUtils.clamp(rig.pitch + dy * 0.004, 0.12, 1.2);
    }
  };
  const onPointerUp = (event) => {
    pointers.delete(event.pointerId);
    if (drag && pointers.size === 0) {
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (moved < 8 && performance.now() - drag.time < 450) {
        handleTap(event);
      }
    }
    if (pointers.size < 2) {
      pinchStart = 0;
    }
    drag = null;
  };
  const onWheel = (event) => {
    event.preventDefault();
    rig.targetDistance = THREE.MathUtils.clamp(rig.targetDistance + event.deltaY * 0.01, 4, 18);
  };
  const onKeyDown = (event) => {
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
      keys.add(event.key.toLowerCase());
      event.preventDefault();
    }
  };
  const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
  // Phones may drop the GPU context (backgrounding, memory pressure); keep the page alive and let it restore.
  const onContextLost = (event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(frame);
    container.classList.add('context-lost');
  };
  const onContextRestored = () => {
    container.classList.remove('context-lost');
    running = true;
    clock.getDelta();
    tick();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  let elapsed = 0;
  let nearSpot = null;
  let lastMoveSent = 0;
  let frame = 0;
  let running = true;

  function moveAvatar(avatar, delta, speed = 3.2) {
    const position = avatar.group.position;
    const toTarget = avatar.target.clone().sub(position);
    toTarget.y = 0;
    const distance = toTarget.length();
    if (distance > 0.05) {
      const step = Math.min(distance, speed * delta);
      position.add(toTarget.normalize().multiplyScalar(step));
      avatar.facing = Math.atan2(toTarget.x, toTarget.z);
      avatar.body.position.y = Math.abs(Math.sin(elapsed * 9)) * 0.06;
      return true;
    }
    avatar.body.position.y *= 0.8;
    return false;
  }

  function turnTowards(avatar, delta) {
    let difference = avatar.facing - avatar.group.rotation.y;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    avatar.group.rotation.y += difference * Math.min(1, delta * 8);
  }

  function applySitPose(avatar) {
    avatar.body.scale.y += ((avatar.sitting ? 0.62 : 1) - avatar.body.scale.y) * 0.2;
  }

  // Adaptive quality: if the device can't hold ~28 fps, lower resolution, then drop shadows.
  let frameCount = 0;
  let windowStart = performance.now();
  let slowWindows = 0;
  function adaptQuality(now) {
    frameCount += 1;
    if (now - windowStart < 2000) {
      return;
    }
    const fps = (frameCount * 1000) / (now - windowStart);
    frameCount = 0;
    windowStart = now;
    if (document.hidden || fps >= 28) {
      slowWindows = 0;
      return;
    }
    slowWindows += 1;
    if (slowWindows < 2) {
      return;
    }
    slowWindows = 0;
    if (pixelRatio > 0.75) {
      pixelRatio = Math.max(0.75, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
    } else if (renderer.shadowMap.enabled) {
      renderer.shadowMap.enabled = false;
      sun.castShadow = false;
      scene.traverse((object) => {
        if (object.material) {
          object.material.needsUpdate = true;
        }
      });
      qualityName = 'low';
    }
    onQuality({ quality: qualityName, pixelRatio, shadows: renderer.shadowMap.enabled, fps: Math.round(fps) });
  }

  function tick() {
    if (!running) {
      return;
    }
    frame = requestAnimationFrame(tick);
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;

    if (keys.size) {
      standUp();
      const forward = new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw));
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      const move = new THREE.Vector3();
      if (keys.has('w') || keys.has('arrowup')) move.add(forward);
      if (keys.has('s') || keys.has('arrowdown')) move.sub(forward);
      if (keys.has('d') || keys.has('arrowright')) move.add(right);
      if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
      if (move.lengthSq() > 0) {
        self.target.copy(self.group.position).add(move.normalize().multiplyScalar(0.6));
        self.walkingToSpot = null;
      }
    }

    const moving = moveAvatar(self, delta);
    if (!moving && self.pendingSit) {
      const spot = self.pendingSit;
      self.pendingSit = null;
      self.sitting = true;
      self.facing = Math.atan2(spot.position.x - spot.stand.x, spot.position.z - spot.stand.z) || self.facing;
      onSit(spot);
    }
    turnTowards(self, delta);
    applySitPose(self);

    // Nearest spot within reach
    let closest = null;
    let closestDistance = Infinity;
    place.spots.forEach((spot) => {
      const distance = spot.stand.distanceTo(new THREE.Vector3(self.group.position.x, 0, self.group.position.z));
      if (distance < spot.radius && distance < closestDistance) {
        closest = spot;
        closestDistance = distance;
      }
    });
    if (closest !== nearSpot) {
      nearSpot = closest;
      onNearSpot(nearSpot);
      if (nearSpot && !moving) {
        self.facing = Math.atan2(nearSpot.position.x - self.group.position.x, nearSpot.position.z - self.group.position.z);
      }
    }

    const now = performance.now();
    if (now - lastMoveSent > 180) {
      lastMoveSent = now;
      onMove(getState());
    }

    peers.forEach((peer) => {
      moveAvatar(peer, delta, 3.6);
      turnTowards(peer, delta);
      applySitPose(peer);
      animatePose(peer, delta, now);
    });
    if (self.faceCameraUntil) {
      if (now < self.faceCameraUntil && !moving) {
        self.facing = rig.yaw;
      } else {
        self.facing = moving ? self.facing : self.facingBeforeGreet;
        self.faceCameraUntil = 0;
      }
    }
    animatePose(self, delta, now);
    adaptQuality(now);

    spotMarkers.forEach(({ ring, beacon }, index) => {
      const pulse = 0.5 + Math.sin(elapsed * 2 + index) * 0.25;
      ring.material.opacity = pulse;
      beacon.position.y += Math.sin(elapsed * 2 + index) * 0.003;
      beacon.rotation.y += delta;
    });
    tapMarker.material.opacity = Math.max(0, tapMarker.material.opacity - delta * 1.2);

    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      effect.remaining -= delta;
      effect.elapsed = (effect.elapsed || 0) + delta;
      if (effect.onTick) {
        effect.onTick(delta, effect.remaining, effect.elapsed);
      }
      if (effect.remaining <= 0) {
        if (effect.onEnd) {
          effect.onEnd();
        }
        scene.remove(effect.object);
        effects.splice(i, 1);
      }
    }
    for (let i = emitters.length - 1; i >= 0; i--) {
      if (!emitters[i].update(delta)) {
        emitters[i].dispose();
        emitters.splice(i, 1);
      }
    }
    motes.step(delta, (i) => {
      motes.reset(i, new THREE.Vector3((Math.random() - 0.5) * 30, 0.3, (Math.random() - 0.5) * 30), new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.15 + Math.random() * 0.2, (Math.random() - 0.5) * 0.2), 12 + Math.random() * 8);
      return true;
    });

    updateCamera(delta);
    renderer.render(scene, camera);
  }

  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Portrait phones get a wider lens so the building is not cropped.
    camera.fov = camera.aspect < 0.8 ? 60 : 50;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  // Start behind the avatar looking at the main building.
  rig.yaw = Math.atan2(place.spawn.x - place.focus.x, place.spawn.z - place.focus.z);
  self.facing = rig.yaw + Math.PI;
  self.group.rotation.y = self.facing;
  updateCamera(1);
  tick();

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(frame);
    } else if (!running) {
      running = true;
      clock.getDelta();
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  function getState() {
    return {
      x: Math.round(self.target.x * 100) / 100,
      z: Math.round(self.target.z * 100) / 100,
      f: Math.round(self.facing * 100) / 100,
      s: self.sitting ? 1 : 0,
    };
  }

  return {
    spots: place.spots,
    perform,
    standUp,
    greet: (greetingId) => greet(self, greetingId),
    quality: () => ({ quality: qualityName, pixelRatio, shadows: renderer.shadowMap.enabled }),
    getState,
    walkTo(spotId, options = {}) {
      const spot = place.spots.find((s) => s.id === spotId);
      if (spot) {
        standUp();
        self.target.copy(spot.stand);
        if (options.instant) {
          self.group.position.set(spot.stand.x, 0, spot.stand.z);
        }
      }
    },
    addPeer(id, info) {
      if (peers.has(id)) {
        return;
      }
      if (peers.size >= MAX_RENDERED_PEERS && !info.host) {
        return;
      }
      const peer = createAvatar(info.name || 'Tamu', info.color || '#9aa3ad', { visitor: info.mode === 'visit', host: Boolean(info.host) });
      peer.group.position.set(info.x ?? place.spawn.x, 0, info.z ?? place.spawn.z);
      peer.target.copy(peer.group.position);
      scene.add(peer.group);
      peers.set(id, peer);
    },
    updatePeer(id, state) {
      const peer = peers.get(id);
      if (!peer) {
        return;
      }
      if (typeof state.x === 'number') {
        peer.target.set(state.x, 0, state.z);
      }
      if (typeof state.f === 'number' && peer.group.position.distanceTo(peer.target) < 0.1) {
        peer.facing = state.f;
      }
      peer.sitting = Boolean(state.s);
    },
    peerGreet(id, greetingId) {
      const peer = peers.get(id);
      if (peer) {
        greet(peer, greetingId);
      }
    },
    peerPerform(id, spotId) {
      perform(spotId, { remote: true, by: peers.get(id) });
    },
    removePeer(id) {
      const peer = peers.get(id);
      if (peer) {
        scene.remove(peer.group);
        peers.delete(id);
      }
    },
    peerCount: () => peers.size,
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/jpeg', 0.85);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      emitters.forEach((emitter) => emitter.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
