// Jeda 3D world: a calm, walkable place per faith with activities and other visitors.
// Controls: tap/click the ground to walk, tap a glowing spot to go there, drag to look around,
// pinch or scroll to zoom, WASD/arrow keys on desktop.

import * as THREE from '../../vendor/three.module.min.js';
import { buildPlace, mat, box, cyl, sphere, cone } from './places.js';
import { bell, gong, chime, woodblock, crackle, bead, murmur, pageTurn, chant, asmr, loopSound, wakeAudio } from '../audio.js';
import { greetingById } from './greetings.js';
import { createAvatar, attireFor, animateAvatar, playClip, stopClip, setSitting, textSprite, setCarry, speechBubble } from './avatar.js';
import { buildNav, createBarriers } from './nav.js';
import { createLife } from './life.js';
import { createHeld, heldItemFor } from './handheld.js';
import { buildKedai, buildRumah, addTempleAnnex, buildParcel } from './venues.js';
import { createNpcs } from './npc.js';
import { createMeal } from './meal.js';
import { buildDish } from './dishes.js';

// Looping kitchen sound for each cooking method (volume follows your distance to the stall).
const STALL_SOUND = { wok: 'sizzle', griddle: 'sizzle', fry: 'fry', stir: 'simmer', steam: 'steam', grill: 'charcoal', smoke: 'charcoal', toast: 'charcoal' };

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
    onBlocked = () => {},
    onHold = () => {},
    onStall = () => {},
    onGuide = () => {},
    onTravel = () => {},
    onNpc = () => {},
    onCarry = () => {},
    faithId = null,
    carry: initialCarry = [],
    quality: requestedQuality = 'auto',
  } = options;
  let currentTime = SKIES[time] ? time : 'day';
  const sky = SKIES[currentTime];
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
  // Drawn manually: the world first, then (when holding a sacred object) the hands on top.
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.setAttribute('aria-label', 'Ruang 3D. Ketuk tanah untuk berjalan, ketuk titik bercahaya untuk beraktivitas.');
  renderer.domElement.tabIndex = 0;

  const scene = new THREE.Scene();
  scene.background = gradientTexture(sky.top, sky.bottom);
  scene.fog = new THREE.Fog(sky.fog, 28, 75);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

  const hemi = new THREE.HemisphereLight(sky.top, '#8a7b66', sky.hemi);
  scene.add(hemi);
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

  // Sacred place (with signposts, guide board and people added), the food place, or the home.
  let place;
  if (sceneId.startsWith('kedai-')) {
    place = buildKedai(sceneId.slice(6));
  } else if (sceneId.startsWith('rumah-')) {
    place = buildRumah(sceneId.slice(6));
  } else {
    place = buildPlace(sceneId);
    if (faithId) {
      addTempleAnnex(place, faithId);
    }
  }
  const ritualScene = place.heldScene || sceneId;
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
  const nav = buildNav(place);
  scene.add(createBarriers(place));

  // Stars always exist so the sky can change to night without rebuilding the scene.
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 500; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.42;
    starPositions.push(Math.sin(phi) * Math.cos(theta) * 120, Math.cos(phi) * 120, Math.sin(phi) * Math.sin(theta) * 120);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#ffffff', size: 0.9, sizeAttenuation: true, fog: false, transparent: true, opacity: currentTime === 'night' ? 1 : 0 }));
  stars.visible = currentTime === 'night';
  scene.add(stars);

  // Ambient floating motes (petals by day, fireflies at night)
  const motes = createParticles(quality.motes, currentTime === 'night' ? '#fff3a8' : '#ffffff', currentTime === 'night' ? 0.22 : 0.12);
  motes.points.material.opacity = currentTime === 'night' ? 0.9 : 0.5;
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
  const self = createAvatar(me.name, me.color, { visitor: mode === 'visit', attire: attireFor(sceneId, mode) });
  self.path = [];
  self.exitPoint = null;
  self.sitSpot = null;
  self.group.position.set(place.spawn.x, 0, place.spawn.z);
  self.target.copy(self.group.position);
  self.facing = Math.PI;
  scene.add(self.group);
  const peers = new Map();
  const life = createLife({ scene, place, nav, sceneId, time: currentTime, quality, addEmitter });
  const npcs = createNpcs({
    scene, place, nav, quality: qualityName,
    fx: {
      stallFx: (stall, kind, seconds) => stallFx(stall, kind, seconds),
      perform: (spotId, avatar) => perform(spotId, { remote: true, by: avatar }),
    },
  });
  const npcAvatars = npcs.list.map((npc) => npc.avatar);

  let watch = null;
  function endWatch() {
    if (watch) {
      rig.targetDistance = watch.savedDistance;
      watch = null;
    }
  }
  // ---------- Camera rig ----------
  const rig = { yaw: 0, pitch: 0.42, distance: 10.5, targetDistance: 10.5, savedYaw: null, savedView: null, actionYaw: 0, cancelled: false, ahead: 2.6, roof: 0 };
  // Solid scenery that may hide the avatar from the camera (see updateCamera).
  const cameraRay = new THREE.Raycaster();
  const occluders = [];
  place.group.traverse((object) => {
    if (object.isMesh && !object.userData.noCollide && !(object.parent && object.parent.userData.noCollide)) {
      occluders.push(object);
    }
  });

  // While our avatar performs an action, swing the camera to a side view so the gesture is visible,
  // then return to where the visitor was looking. Dragging cancels this.
  function updateActionCamera(delta) {
    if (self.clip && rig.savedYaw === null && !rig.cancelled) {
      rig.savedYaw = rig.yaw;
      rig.savedView = { distance: rig.targetDistance, pitch: rig.pitch };
      rig.actionYaw = self.facing - Math.PI + 1.45;
      // Come closer and lower so roofs and eaves don't block the view of the gesture.
      rig.targetDistance = Math.min(rig.targetDistance, 7);
    }
    if (self.clip && rig.savedYaw !== null) {
      rig.pitch += (0.3 - rig.pitch) * Math.min(1, delta * 2.5);
    } else if (!self.clip && rig.savedView) {
      rig.targetDistance = rig.savedView.distance;
      rig.pitch += (rig.savedView.pitch - rig.pitch) * Math.min(1, delta * 2.5);
      if (Math.abs(rig.savedView.pitch - rig.pitch) < 0.01) {
        rig.savedView = null;
      }
    }
    let goal = null;
    if (self.clip && rig.savedYaw !== null) {
      goal = rig.actionYaw;
    } else if (!self.clip && rig.savedYaw !== null) {
      goal = rig.savedYaw;
    }
    if (goal === null) {
      if (!self.clip) {
        rig.cancelled = false;
      }
      return;
    }
    let difference = Math.atan2(Math.sin(goal - rig.yaw), Math.cos(goal - rig.yaw));
    rig.yaw += difference * Math.min(1, delta * 2.5);
    if (!self.clip && Math.abs(difference) < 0.02) {
      rig.savedYaw = null;
    }
  }

  const UP = new THREE.Vector3(0, 1, 0);

  // ---------- First-person view ----------
  // 'first' = through the avatar's eyes (the avatar itself is hidden), 'third' = the usual follow camera.
  const view = { mode: 'third', pitch: 0.08, before: null };
  let held = null; // the sacred object currently in your hands (first person)
  let chantStop = null;
  let voiceOn = true;
  const eye = new THREE.Vector3();
  // Floating motes: world-sized in third person; in first person they would pass right by the eyes
  // and become huge screen-filling sprites, so they are drawn as small fixed-pixel dots instead.
  function styleMotes() {
    const night = currentTime === 'night';
    const material = motes.points.material;
    const first = view.mode === 'first';
    material.sizeAttenuation = !first;
    material.size = first ? (night ? 4 : 3) : (night ? 0.22 : 0.12);
    material.opacity = night ? 0.9 : 0.5;
    material.color.set(night ? '#fff3a8' : '#ffffff');
    material.needsUpdate = true;
  }

  function setView(mode) {
    view.mode = mode === 'first' ? 'first' : 'third';
    self.group.visible = view.mode !== 'first';
    styleMotes();
    if (view.mode === 'first') {
      rig.savedYaw = null;
      rig.savedView = null;
      // Look the way the avatar is facing.
      rig.yaw = self.facing + Math.PI;
      view.pitch = 0.08;
    }
    return view.mode;
  }

  function updateFirstPerson(delta) {
    self.head.getWorldPosition(eye);
    eye.y += 0.05;
    const turnToward = (goal, rate) => {
      const difference = Math.atan2(Math.sin(goal - rig.yaw), Math.cos(goal - rig.yaw));
      rig.yaw += difference * Math.min(1, delta * rate);
    };
    if (self.clip && self.clipSpot) {
      // Look at what you are doing (lighting the candle, planting the incense...).
      turnToward(self.facing + Math.PI, 4);
      const spotPosition = self.clipSpot.position;
      const flat = Math.hypot(spotPosition.x - eye.x, spotPosition.z - eye.z);
      const goalPitch = THREE.MathUtils.clamp(Math.atan2(eye.y - spotPosition.y, Math.max(0.5, flat)), -0.4, 0.9);
      view.pitch += (goalPitch - view.pitch) * Math.min(1, delta * 3);
    } else if (self.moving && !self.keyMoved && !self.sitting) {
      // Walking somewhere you tapped: the view turns with your steps.
      turnToward(self.facing + Math.PI, 4);
    } else if (!self.moving && !self.sitting) {
      // Standing still: your body faces where you look (other visitors see this).
      self.facing = rig.yaw + Math.PI;
    }
    const pitch = view.pitch + (held ? held.lift() * 0.45 : 0);
    const forward = new THREE.Vector3(
      -Math.sin(rig.yaw) * Math.cos(pitch),
      -Math.sin(pitch),
      -Math.cos(rig.yaw) * Math.cos(pitch),
    );
    eye.addScaledVector(new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)), 0.14);
    camera.position.copy(eye);
    camera.lookAt(eye.clone().add(forward));
  }

  function updateCamera(delta) {
    if (view.mode === 'first') {
      updateFirstPerson(delta);
      return;
    }
    updateActionCamera(delta);
    rig.distance += (rig.targetDistance - rig.distance) * Math.min(1, delta * 6);
    // Look a little ahead of the avatar so it sits in the lower third and the sacred building stays in view;
    // during an action, look at the avatar itself so the gesture is centred.
    rig.ahead += ((self.clip ? 0 : 2.6) - rig.ahead) * Math.min(1, delta * 3);
    const ahead = new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw)).multiplyScalar(rig.ahead);
    const focus = self.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)).add(ahead);
    if (watch) {
      // Watching the hawker cook your order: look at the stove, from the customer side.
      watch.blend = Math.min(1, watch.blend + delta * 1.5);
      focus.lerp(watch.target, 0.8 * watch.blend);
      rig.targetDistance += (Math.min(watch.savedDistance, 4.6) - rig.targetDistance) * Math.min(1, delta * 2);
      const goalYaw = Math.atan2(self.group.position.x - watch.target.x, self.group.position.z - watch.target.z) + 0.35;
      rig.yaw += Math.atan2(Math.sin(goalYaw - rig.yaw), Math.cos(goalYaw - rig.yaw)) * Math.min(1, delta * 1.5);
      rig.pitch += (0.32 - rig.pitch) * Math.min(1, delta * 1.5);
    }
    const head = self.group.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    // Under a hall roof, drop the camera lower and closer so the view isn't filled by the roof itself.
    // This is a temporary blend; the visitor's own zoom and tilt are restored once back in the open.
    cameraRay.set(head, UP);
    cameraRay.far = 7;
    const roofAbove = cameraRay.intersectObjects(occluders, false).length > 0;
    rig.roof += ((roofAbove ? 1 : 0) - rig.roof) * Math.min(1, delta * 3);
    const pitch = THREE.MathUtils.lerp(rig.pitch, Math.min(rig.pitch, 0.2), rig.roof);
    const direction = new THREE.Vector3(
      Math.sin(rig.yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(rig.yaw) * Math.cos(pitch),
    );
    // Keep walls, pillars and roofs from coming between the camera and the avatar.
    const distance = THREE.MathUtils.lerp(rig.distance, Math.min(rig.distance, 6.5), rig.roof);
    const wanted = focus.clone().addScaledVector(direction, distance);
    // Check both the avatar's head and the look-at point (e.g. standing under a hall roof).
    let target = wanted;
    let blocker = null;
    [head, focus].forEach((origin) => {
      const toCamera = target.clone().sub(origin);
      const reach = toCamera.length();
      cameraRay.set(origin, toCamera.normalize());
      cameraRay.far = reach;
      const hit = cameraRay.intersectObjects(occluders, false)[0];
      if (hit) {
        blocker = hit;
        target = origin.clone().addScaledVector(toCamera, Math.max(1.6, hit.distance - 0.35));
      }
    });
    camera.position.lerp(target, Math.min(1, delta * (blocker ? 9 : 5)));
    camera.lookAt(focus);
    self.label.material.opacity = self.clip ? 0.35 : 1;
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
    wash(spot) {
      addEmitter(spot.position.clone(), { color: '#bfe3f2', size: 0.1, rate: 40, life: 0.8, rise: -0.7, spread: 0.3, duration: 2.2 });
      asmr('pour', { volume: 0.6 });
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

  function faceSpot(avatar, spot) {
    const position = avatar.group.position;
    const dx = spot.position.x - position.x;
    const dz = spot.position.z - position.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.01) {
      avatar.facing = Math.atan2(dx, dz);
    }
  }

  // Run an activity: the avatar plays the matching animation (with a prop in hand) and the offering
  // appears at the moment it is placed. Remote = another visitor did it; their avatar animates too.
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
    if (spot.kind === 'stall' || spot.kind === 'guide' || spot.kind === 'travel') {
      if (!remote) {
        faceSpot(self, spot);
        if (spot.kind === 'stall') {
          onStall(spot);
        } else if (spot.kind === 'guide') {
          onGuide(spot);
        } else {
          onTravel(spot);
        }
      }
      return true;
    }
    if (!remote && self.clip) {
      return false;
    }
    const actor = remote ? by : self;
    if (!remote) {
      standUp();
      self.path = [];
      self.faceCameraUntil = 0;
    }
    if (spot.kind === 'ciamsi' || spot.kind === 'read') {
      if (spot.kind === 'ciamsi' && !remote) {
        woodblock();
      }
      if (actor) {
        faceSpot(actor, spot);
        actor.clipSpot = spot;
        playClip(actor, spot.kind, { onEnd: remote ? null : () => onSpecial(spot) });
      } else if (!remote) {
        onSpecial(spot);
      }
      return true;
    }
    const run = performers[spot.kind];
    if (!run) {
      return false;
    }
    if (actor) {
      faceSpot(actor, spot);
      actor.clipSpot = spot;
      playClip(actor, spot.kind, { onRelease: () => run(spot) });
    } else {
      run(spot);
    }
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

  // Gentle explanation when someone tries to walk into a sacred area (throttled).
  let lastBlockedAt = 0;
  function notifyZone(zone) {
    const now = performance.now();
    if (zone && now - lastBlockedAt > 2500) {
      lastBlockedAt = now;
      onBlocked(zone.message);
    }
  }

  function routeTo(x, z, { quietZone = false } = {}) {
    if (self.clip) {
      stopClip(self);
    }
    self.pendingSit = null;
    self.pendingPerform = null;
    const origin = self.exitPoint || self.group.position;
    const result = nav.findPath(origin, { x, z });
    self.path = self.exitPoint ? [self.exitPoint.clone(), ...result.path] : result.path;
    self.exitPoint = null;
    if (result.zone && !quietZone) {
      notifyZone(result.zone);
    }
    return result;
  }

  function sitAt(spot) {
    routeTo(spot.stand.x, spot.stand.z, { quietZone: true });
    self.pendingSit = spot;
  }

  function standUp() {
    if (!self.sitting) {
      return;
    }
    const spot = self.sitSpot;
    setSitting(self, false);
    self.sitSpot = null;
    onSit(null);
    if (spot && spot.seat) {
      // Step off the bench/bale back to where we came from.
      self.exitPoint = spot.stand.clone();
      self.path = [spot.stand.clone()];
    }
  }

  function nearestSitSpot(point) {
    let best = null;
    let bestDistance = 1.2;
    place.spots.filter((spot) => spot.kind === 'sit').forEach((spot) => {
      const distances = [Math.hypot(point.x - spot.stand.x, point.z - spot.stand.z)];
      if (spot.seat) {
        distances.push(Math.hypot(point.x - spot.seat.x, point.z - spot.seat.z));
      }
      const distance = Math.min(...distances);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = spot;
      }
    });
    return best;
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
    const npcHit = npcs.pick(raycaster);
    if (npcHit) {
      onNpc(npcHit.id, npcHit.persona, npcHit.role);
      return;
    }
    const spotHit = raycaster.intersectObjects(pickables, false)[0];
    if (spotHit) {
      standUp();
      const spot = spotHit.object.userData.spot;
      routeTo(spot.stand.x, spot.stand.z, { quietZone: true });
      return;
    }
    if (life.pick(raycaster, self.group.position)) {
      return;
    }
    const groundHit = raycaster.intersectObject(ground, false)[0];
    if (groundHit) {
      standUp();
      const point = groundHit.point;
      routeTo(point.x, point.z);
      const end = self.path.length ? self.path[self.path.length - 1] : point;
      tapMarker.position.set(end.x, 0.06, end.z);
      tapMarker.material.opacity = 0.9;
    }
  }

  const tapMarker = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  tapMarker.rotation.x = -Math.PI / 2;
  scene.add(tapMarker);

  const canvas = renderer.domElement;
  const onPointerDown = (event) => {
    wakeAudio();
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
      if (pinchStart && view.mode !== 'first') {
        rig.targetDistance = THREE.MathUtils.clamp(rig.targetDistance * (pinchStart / distance), 4, 18);
      }
      pinchStart = distance;
      return;
    }
    if (drag && held) {
      // Holding a sacred object: sideways drag looks around (or turns the object for guests);
      // a downward swipe moves the next bead (handled on release).
      const dx = event.clientX - drag.x;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (held.state().observe) {
        held.inspect(dx);
      } else {
        rig.yaw -= dx * 0.004;
      }
      return;
    }
    if (drag && view.mode === 'first') {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      rig.yaw -= dx * 0.005;
      view.pitch = THREE.MathUtils.clamp(view.pitch + dy * 0.004, -0.7, 1.0);
      return;
    }
    if (drag) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      rig.yaw -= dx * 0.006;
      if (Math.abs(dx) > 6) {
        endWatch();
      }
      if (Math.abs(dx) > 2) {
        rig.savedYaw = null;
        rig.savedView = null;
        rig.cancelled = Boolean(self.clip);
      }
      rig.pitch = THREE.MathUtils.clamp(rig.pitch + dy * 0.004, 0.12, 1.2);
    }
  };
  const onPointerUp = (event) => {
    pointers.delete(event.pointerId);
    if (drag && pointers.size === 0) {
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      const swipeDown = event.clientY - drag.startY;
      if (held) {
        if ((moved < 8 && performance.now() - drag.time < 450) || (swipeDown > 35 && Math.abs(swipeDown) > Math.abs(event.clientX - drag.startX))) {
          holdStep();
        }
      } else if (moved < 8 && performance.now() - drag.time < 450) {
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
    if (view.mode === 'first') {
      return;
    }
    rig.targetDistance = THREE.MathUtils.clamp(rig.targetDistance + event.deltaY * 0.01, 4, 18);
  };
  const onKeyDown = (event) => {
    if (held && [' ', 'enter'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      holdStep();
      return;
    }
    if (held) {
      return;
    }
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

  // ---------- Sky: switch dawn / day / dusk / night with a gentle fade ----------
  const skyNow = {
    top: new THREE.Color(sky.top),
    bottom: new THREE.Color(sky.bottom),
    fog: new THREE.Color(sky.fog),
    sun: new THREE.Color(sky.sun),
    sunIntensity: sky.sunIntensity,
    hemi: sky.hemi,
    sunPos: new THREE.Vector3(...sky.sunPos),
    stars: currentTime === 'night' ? 1 : 0,
  };
  let skyFade = null;
  let skyTextureTimer = 0;
  function setTime(name) {
    const target = SKIES[name];
    if (!target) {
      return currentTime;
    }
    currentTime = name;
    skyFade = {
      t: 0,
      from: {
        top: skyNow.top.clone(), bottom: skyNow.bottom.clone(), fog: skyNow.fog.clone(), sun: skyNow.sun.clone(),
        sunIntensity: skyNow.sunIntensity, hemi: skyNow.hemi, sunPos: skyNow.sunPos.clone(), stars: skyNow.stars,
      },
      to: {
        top: new THREE.Color(target.top), bottom: new THREE.Color(target.bottom), fog: new THREE.Color(target.fog), sun: new THREE.Color(target.sun),
        sunIntensity: target.sunIntensity, hemi: target.hemi, sunPos: new THREE.Vector3(...target.sunPos), stars: name === 'night' ? 1 : 0,
      },
    };
    styleMotes();
    applyHeldLighting();
    return currentTime;
  }

  function updateSky(delta) {
    if (!skyFade) {
      return;
    }
    skyFade.t = Math.min(1, skyFade.t + delta / 1.6);
    const k = skyFade.t * skyFade.t * (3 - 2 * skyFade.t);
    const { from, to } = skyFade;
    skyNow.top.copy(from.top).lerp(to.top, k);
    skyNow.bottom.copy(from.bottom).lerp(to.bottom, k);
    skyNow.fog.copy(from.fog).lerp(to.fog, k);
    skyNow.sun.copy(from.sun).lerp(to.sun, k);
    skyNow.sunIntensity = THREE.MathUtils.lerp(from.sunIntensity, to.sunIntensity, k);
    skyNow.hemi = THREE.MathUtils.lerp(from.hemi, to.hemi, k);
    skyNow.sunPos.copy(from.sunPos).lerp(to.sunPos, k);
    skyNow.stars = THREE.MathUtils.lerp(from.stars, to.stars, k);
    scene.fog.color.copy(skyNow.fog);
    hemi.color.copy(skyNow.top);
    hemi.intensity = skyNow.hemi;
    sun.color.copy(skyNow.sun);
    sun.intensity = skyNow.sunIntensity;
    sun.position.copy(skyNow.sunPos);
    stars.material.opacity = skyNow.stars;
    stars.visible = skyNow.stars > 0.02;
    skyTextureTimer -= delta;
    if (skyTextureTimer <= 0 || skyFade.t >= 1) {
      skyTextureTimer = 0.08;
      const previous = scene.background;
      scene.background = gradientTexture(`#${skyNow.top.getHexString()}`, `#${skyNow.bottom.getHexString()}`);
      if (previous && previous.dispose) {
        previous.dispose();
      }
    }
    if (skyFade.t >= 1) {
      skyFade = null;
    }
  }

  // ---------- Sacred object in your hands (first person) ----------
  function applyHeldLighting() {
    if (!held) {
      return;
    }
    const lighting = {
      dawn: { hemiIntensity: 1.2, keyIntensity: 1.4, warm: true },
      day: { hemiIntensity: 1.3, keyIntensity: 1.6, warm: false },
      dusk: { hemiIntensity: 1.0, keyIntensity: 1.2, warm: true },
      night: { hemiIntensity: 0.8, keyIntensity: 0.9, warm: true },
    };
    held.setLighting(lighting[currentTime] || lighting.day);
  }

  function hold({ observe = false } = {}) {
    const def = heldItemFor(ritualScene);
    if (!def) {
      return null;
    }
    release({ silent: true });
    if (self.clip) {
      stopClip(self);
    }
    self.path = [];
    self.pendingPerform = null;
    view.before = view.mode;
    setView('first');
    view.pitch = self.sitting ? 0.2 : 0.12;
    held = createHeld(def, { observe });
    held.resize(camera.aspect, camera.fov);
    applyHeldLighting();
    if (!observe && def.chant && voiceOn) {
      chantStop = chant(def.chant);
    }
    const state = { ...held.state(), voice: voiceOn };
    onHold(state);
    return state;
  }

  function release({ silent = false } = {}) {
    if (!held) {
      return;
    }
    if (chantStop) {
      chantStop();
      chantStop = null;
    }
    if (held.def.meal && held.mealItems) {
      const eaten = held.state().items;
      held.mealItems.forEach((item, i) => {
        if (eaten[i] && eaten[i].left <= 0) {
          finishTableItem(item);
        }
      });
    }
    held.dispose();
    held = null;
    setView(view.before || 'third');
    view.before = null;
    if (!silent) {
      onHold(null);
    }
  }

  function playHeldSound(sound, def) {
    if (sound === 'woodblock') {
      woodblock();
    } else if (sound === 'bead') {
      bead();
    } else if (sound === 'bell') {
      bell();
    } else if (sound === 'chime') {
      chime();
    } else if (sound === 'page') {
      pageTurn();
    }
    if (sound && def.murmur && voiceOn) {
      murmur(def.id === 'rosario' ? 1.6 : 1.0, def.id === 'tasbih' ? 0.04 : 0.05);
    }
  }

  function holdStep(index) {
    if (!held) {
      return null;
    }
    const sound = held.step(index);
    if (!held.def.meal) {
      playHeldSound(sound, held.def);
    }
    if (navigator.vibrate && sound) {
      navigator.vibrate(8);
    }
    const state = { ...held.state(), voice: voiceOn };
    onHold(state);
    return state;
  }

  function setVoice(on) {
    voiceOn = Boolean(on);
    if (chantStop && !voiceOn) {
      chantStop();
      chantStop = null;
    } else if (held && voiceOn && !chantStop && held.def.chant && !held.state().observe) {
      chantStop = chant(held.def.chant);
    }
    return voiceOn;
  }


  // ---------- Food: order at a stall, watch it cooked, carry it, eat at a table (or take it away) ----------
  let carrying = [];
  const tableItems = new Map();
  const timers = [];
  const later = (fn, ms) => {
    timers.push(setTimeout(fn, ms));
  };

  function setCarrying(list) {
    carrying = list;
    setCarry(self, !list.length ? null : list.every((item) => item.takeaway) ? 'bag' : 'tray');
    onCarry(carrying.map((item) => ({ dishId: item.dish.id, takeaway: item.takeaway })));
  }

  function nearVolume(point) {
    const distance = Math.hypot(self.group.position.x - point.x, self.group.position.z - point.z);
    return Math.max(0, 1 - distance / 14) ** 1.5;
  }

  // Visual + sound effects at a stove for one cooking step.
  function stallFx(stall, kind, seconds = 2) {
    const at = stall.stove.clone();
    const volume = 0.25 + nearVolume(at) * 0.9;
    const up = (y) => at.clone().add(new THREE.Vector3(0, y, 0));
    switch (kind) {
      case 'heat':
        addEmitter(up(0.1), { color: '#d9d4cc', size: 0.3, rate: 8, life: 1.8, rise: 0.6, spread: 0.2, duration: seconds, count: 20 });
        break;
      case 'sizzle':
        asmr('sizzle', { volume });
        addEmitter(up(0.15), { color: '#f4f1ea', size: 0.35, rate: 22, life: 1.4, rise: 0.8, spread: 0.35, duration: 1.2, count: 30 });
        break;
      case 'flare': {
        addEmitter(up(0.05), { color: '#ff8a2a', size: 0.32, rate: 42, life: 0.5, rise: 1.7, spread: 0.55, duration: seconds, count: 40 });
        addEmitter(up(0.3), { color: '#e9e4dc', size: 0.4, rate: 14, life: 2, rise: 0.8, spread: 0.3, duration: seconds, count: 30 });
        const light = addFlameLight(up(0.4), '#ff8a3a', 3.2, 5);
        const token = light.userData.token;
        for (let t = 0; t < seconds * 1000; t += 850) {
          later(() => asmr('wok', { volume: volume * 0.8 }), t);
        }
        later(() => {
          if (light.userData.token === token) {
            releaseLight(light);
          }
        }, seconds * 1000);
        break;
      }
      case 'simmer':
      case 'steam':
        addEmitter(up(0.15), { color: '#f2efe8', size: 0.38, rate: 14, life: 2.6, rise: 0.45, spread: 0.3, duration: seconds, count: 36 });
        break;
      case 'steamBurst':
        addEmitter(up(0.35), { color: '#ffffff', size: 0.55, rate: 46, life: 2.2, rise: 0.9, spread: 0.6, duration: 1.4, count: 60 });
        asmr('sizzle', { volume: volume * 0.4 });
        break;
      case 'smoke':
        addEmitter(up(0.05), { color: '#bdb6ab', size: 0.5, rate: 18, life: 3, rise: 0.7, spread: 0.45, duration: seconds, count: 50 });
        break;
      case 'embers':
        addEmitter(up(0.02), { color: '#ff7a2a', size: 0.12, rate: 30, life: 1.0, rise: 1.4, spread: 0.6, duration: seconds, count: 40 });
        addEmitter(up(0.1), { color: '#c9c2b6', size: 0.55, rate: 16, life: 3, rise: 0.8, spread: 0.5, duration: seconds, count: 45 });
        for (let t = 0; t < seconds * 1000; t += 360) {
          later(() => asmr('fan', { volume: volume * 0.7 }), t);
        }
        later(() => asmr('crackle', { volume }), 300);
        break;
      case 'pour':
        asmr('pour', { volume });
        addEmitter(up(0.55).add(new THREE.Vector3(0.25, 0, 0)), { color: '#8a5a2a', size: 0.06, rate: 50, life: 0.45, rise: -1.4, spread: 0.02, duration: Math.min(1.6, seconds), count: 30 });
        break;
      case 'chop':
        for (let t = 0; t < seconds * 1000; t += 250) {
          later(() => asmr('chop', { volume: volume * 0.8 }), t);
        }
        break;
      case 'fry':
        asmr('sizzle', { volume });
        addEmitter(up(0.2), { color: '#ffffff', size: 0.25, rate: 18, life: 1.2, rise: 0.6, spread: 0.3, duration: seconds, count: 30 });
        break;
      case 'plate':
        asmr('plate', { volume });
        break;
      default:
        break;
    }
  }

  function order(stallId, dish, { takeaway = false, onStep = () => {}, onReady = () => {} } = {}) {
    const stall = (place.stalls || []).find((s) => s.id === stallId);
    if (!stall || npcs.busy(stallId)) {
      return false;
    }
    const stallSpot = place.spots.find((s) => s.id === stall.spotId);
    if (stallSpot && self.group.position.distanceTo(stallSpot.stand) > 1.4 && !self.sitting) {
      routeTo(stallSpot.stand.x, stallSpot.stand.z, { quietZone: true });
    }
    let shown = null;
    const started = npcs.cook(stallId, dish, {
      takeaway,
      onStep,
      onServe: () => {
        shown = takeaway ? buildParcel(dish.parcel || 'paper') : buildDish(dish.spec).group;
        shown.position.copy(stall.counter);
        shown.scale.setScalar(1.3);
        scene.add(shown);
      },
      onDone: () => {
        later(() => {
          if (shown) {
            scene.remove(shown);
          }
          endWatch();
          if (takeaway) {
            asmr('bag');
          }
          setCarrying([...carrying, { dish, takeaway }]);
          onReady({ dish, takeaway });
        }, 900);
      },
    });
    if (!started) {
      return false;
    }
    if (view.mode !== 'first') {
      watch = { target: stall.stove.clone().add(new THREE.Vector3(0, -0.2, 0)), blend: 0, savedDistance: rig.targetDistance };
    }
    return true;
  }

  function serveToTable(spot) {
    if (!carrying.length || !spot.table) {
      return;
    }
    const list = tableItems.get(spot.id) || [];
    const seat = new THREE.Vector3(spot.seat.x, 0, spot.seat.z);
    const center = new THREE.Vector3(spot.table.x, 0, spot.table.z);
    const toward = center.clone().sub(seat);
    const reach = toward.length();
    toward.normalize();
    const sideways = new THREE.Vector3(-toward.z, 0, toward.x);
    carrying.forEach((item) => {
      const index = list.length;
      const built = buildDish(item.dish.spec);
      const position = seat.clone().addScaledVector(toward, Math.max(0.35, reach - 0.3)).addScaledVector(sideways, (index % 3 - 1) * 0.24 + (index ? 0.05 : 0));
      built.group.position.set(position.x, spot.table.top + 0.005, position.z);
      built.group.rotation.y = Math.atan2(-toward.x, -toward.z);
      scene.add(built.group);
      list.push({ dish: item.dish, group: built.group, finished: false });
    });
    tableItems.set(spot.id, list);
    if (carrying.some((item) => item.takeaway)) {
      asmr('bag');
    }
    later(() => asmr('plate'), 250);
    setCarrying([]);
  }

  function finishTableItem(item) {
    if (item.finished) {
      return;
    }
    item.finished = true;
    const position = item.group.position.clone();
    scene.remove(item.group);
    const empty = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 24), mat('#f4f1ea', { roughness: 0.3, flatShading: false }));
    empty.position.copy(position).add(new THREE.Vector3(0, 0.01, 0));
    scene.add(empty);
  }

  function eat({ note = '', title = '' } = {}) {
    const spotId = self.sitSpot ? self.sitSpot.id : null;
    const items = (tableItems.get(spotId) || []).filter((item) => !item.finished);
    if (!items.length) {
      return null;
    }
    release({ silent: true });
    if (self.clip) {
      stopClip(self);
    }
    self.path = [];
    view.before = view.mode;
    setView('first');
    view.pitch = 0.3;
    held = createMeal(items.map((item) => ({ name: item.dish.name, spec: item.dish.spec, utensil: item.dish.utensil, verb: item.dish.verb })), { table: place.tableStyle || 'wood', note, title });
    held.prepare?.(renderer);
    held.mealItems = items;
    held.resize(camera.aspect, camera.fov);
    applyHeldLighting();
    const state = { ...held.state(), voice: voiceOn };
    onHold(state);
    return state;
  }

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
      position.addScaledVector(toTarget.normalize(), step);
      avatar.facing = Math.atan2(toTarget.x, toTarget.z);
      avatar.moving = true;
      return true;
    }
    avatar.moving = false;
    return false;
  }

  function followPath(delta) {
    const position = self.group.position;
    while (self.path.length && Math.hypot(self.path[0].x - position.x, self.path[0].z - position.z) < 0.06) {
      self.path.shift();
    }
    if (!self.path.length) {
      self.moving = false;
      return false;
    }
    self.target.set(self.path[0].x, 0, self.path[0].z);
    return moveAvatar(self, delta);
  }

  function turnTowards(avatar, delta) {
    let difference = avatar.facing - avatar.group.rotation.y;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    avatar.group.rotation.y += difference * Math.min(1, delta * 8);
  }

  // Raise avatars onto benches/bale while seated, back to the ground when standing.
  function settleHeight(avatar, delta) {
    const targetY = avatar.sitting && avatar.seat ? avatar.seat.height : 0;
    avatar.group.position.y += (targetY - avatar.group.position.y) * Math.min(1, delta * 6);
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

    let keyMoved = false;
    if (keys.size) {
      const forward = new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw));
      const right = new THREE.Vector3(-forward.z, 0, forward.x);
      const move = new THREE.Vector3();
      const firstPerson = view.mode === 'first';
      if (keys.has('w') || keys.has('arrowup')) move.add(forward);
      if (keys.has('s') || keys.has('arrowdown')) move.sub(forward);
      if (firstPerson) {
        // First person: left/right turn the head instead of side-stepping.
        if (keys.has('d') || keys.has('arrowright')) rig.yaw -= delta * 1.8;
        if (keys.has('a') || keys.has('arrowleft')) rig.yaw += delta * 1.8;
      } else {
        if (keys.has('d') || keys.has('arrowright')) move.add(right);
        if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
      }
      if (move.lengthSq() > 0 && !held) {
        standUp();
        if (self.clip) {
          stopClip(self);
        }
        self.path = [];
        self.exitPoint = null;
        self.pendingSit = null;
        self.pendingPerform = null;
        move.normalize();
        const position = self.group.position;
        const step = 3.2 * delta;
        const escaping = !nav.walkable(position.x, position.z);
        const tryStep = (dx, dz) => {
          if (escaping || nav.walkable(position.x + dx, position.z + dz)) {
            position.x += dx;
            position.z += dz;
            return true;
          }
          return false;
        };
        if (!tryStep(move.x * step, move.z * step) && !tryStep(move.x * step, 0)) {
          tryStep(0, move.z * step);
        }
        if (!nav.walkable(position.x + move.x * 0.6, position.z + move.z * 0.6)) {
          notifyZone(nav.zoneAt(position.x + move.x * 0.8, position.z + move.z * 0.8));
        }
        self.facing = firstPerson ? rig.yaw + Math.PI : Math.atan2(move.x, move.z);
        self.target.set(position.x, 0, position.z);
        self.moving = true;
        keyMoved = true;
      }
    }

    self.keyMoved = keyMoved;
    let moving = keyMoved;
    if (!keyMoved) {
      if (self.sitting && self.seat) {
        self.target.set(self.seat.x, 0, self.seat.z);
        moving = moveAvatar(self, delta, 1.6);
        self.facing = self.seat.facing;
      } else {
        moving = followPath(delta);
      }
    }
    if (!moving && self.pendingSit && !self.path.length) {
      const spot = self.pendingSit;
      self.pendingSit = null;
      setSitting(self, true, { sitMode: spot.sitMode, seat: spot.seat || null });
      self.sitSpot = spot;
      if (spot.sitMode === 'meal' && carrying.length) {
        serveToTable(spot);
      }
      if (spot.seat) {
        self.facing = spot.seat.facing;
      } else {
        faceSpot(self, spot);
      }
      onSit(spot);
    }
    if (!moving && self.pendingPerform && !self.path.length) {
      const spotId = self.pendingPerform;
      self.pendingPerform = null;
      perform(spotId);
    }
    turnTowards(self, delta);
    settleHeight(self, delta);

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
      if (peer.sitting && peer.seat) {
        peer.target.set(peer.seat.x, 0, peer.seat.z);
      }
      moveAvatar(peer, delta, 3.6);
      if (peer.sitting && peer.seat) {
        peer.facing = peer.seat.facing;
      }
      turnTowards(peer, delta);
      settleHeight(peer, delta);
      animateAvatar(peer, delta, now, elapsed);
    });
    if (self.faceCameraUntil) {
      if (now < self.faceCameraUntil && !moving) {
        self.facing = rig.yaw;
      } else {
        self.facing = moving ? self.facing : self.facingBeforeGreet;
        self.faceCameraUntil = 0;
      }
    }
    animateAvatar(self, delta, now, elapsed);
    npcs.update(delta, now, elapsed, self);
    if (place.update) {
      place.update(delta, elapsed);
    }
    soundTimer -= delta;
    if (soundTimer <= 0) {
      soundTimer = 0.12;
      const muffle = held ? (held.def.meal ? 0.55 : 0.3) : 1;
      stallLoops.forEach(({ stall, loop }) => loop.setVolume((0.12 + stall.cooking * 0.9) * nearVolume(stall.stove) * muffle));
      if (crowdLoop) {
        crowdLoop.setVolume(0.32 * muffle);
      }
    }
    life.update(delta, elapsed, [self, ...peers.values(), ...npcAvatars]);
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

    updateSky(delta);
    if (held) {
      held.update(delta, elapsed);
    }
    updateCamera(delta);
    renderFrame();
  }

  function renderFrame() {
    renderer.clear();
    renderer.render(scene, camera);
    if (held) {
      renderer.clearDepth();
      renderer.render(held.scene, held.camera);
    }
  }

  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Portrait phones get a wider lens so the building is not cropped.
    camera.fov = camera.aspect < 0.8 ? 60 : 50;
    camera.updateProjectionMatrix();
    if (held) {
      held.resize(camera.aspect, camera.fov);
    }
  }
  // Kitchens are always a little alive: steam and smoke, sizzling, a murmuring crowd.
  (place.emitters || []).forEach(({ at: origin, opts }) => addEmitter(origin, opts));
  const stallLoops = (place.stalls || []).filter((stall) => STALL_SOUND[stall.def.method]).map((stall) => ({ stall, loop: loopSound(STALL_SOUND[stall.def.method]) }));
  const crowdLoop = place.ambient === 'crowd' ? loopSound('crowd') : null;
  let soundTimer = 0;
  if (initialCarry && initialCarry.length) {
    setCarrying(initialCarry.map((item) => ({ dish: item.dish, takeaway: true })));
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
      x: Math.round(self.group.position.x * 100) / 100,
      z: Math.round(self.group.position.z * 100) / 100,
      f: Math.round(self.facing * 100) / 100,
      s: self.sitting ? 1 : 0,
    };
  }

  return {
    spots: place.spots,
    perform,
    standUp,
    setView: (mode) => {
      if (held) {
        return view.mode;
      }
      return setView(mode);
    },
    view: () => view.mode,
    setTime,
    time: () => currentTime,
    heldItem: () => {
      const def = heldItemFor(ritualScene);
      return def ? { id: def.id, name: def.name, icon: def.icon } : null;
    },
    hold,
    release: () => release(),
    holdStep,
    holding: () => (held ? { ...held.state(), voice: voiceOn } : null),
    setVoice,
    greet: (greetingId) => greet(self, greetingId),
    // Food
    stalls: () => (place.stalls || []).map((stall) => ({ id: stall.id, spotId: stall.spotId, def: stall.def, home: Boolean(stall.home) })),
    order,
    vendorBusy: (stallId) => npcs.busy(stallId),
    carrying: () => carrying.map((item) => ({ dish: item.dish, takeaway: item.takeaway })),
    tableFood: () => ((self.sitSpot && tableItems.get(self.sitSpot.id)) || []).filter((item) => !item.finished).map((item) => item.dish),
    eat,
    sitSpot: () => (self.sitSpot ? self.sitSpot.id : null),
    placeInfo: () => ({ culture: place.culture || null, tableStyle: place.tableStyle || 'wood', hasStalls: Boolean(place.stalls && place.stalls.length) }),
    // People
    npcSay: (id, text) => {
      const npc = npcs.byId(id);
      if (npc) {
        npcs.say(npc, text, Math.max(3500, text.length * 70));
        npcs.gesture(npc);
      }
    },
    npcTalking: (id, on) => {
      const npc = npcs.byId(id);
      if (npc) {
        npcs.setTalking(npc, on);
        if (on && !self.sitting) {
          faceSpot(self, { position: npc.avatar.group.position });
        }
      }
    },
    npcInfo: (id) => {
      const npc = npcs.byId(id);
      return npc ? { id: npc.id, role: npc.role, persona: npc.persona, culture: npc.culture, stallId: npc.def.stallId || null } : null;
    },
    say: (text) => {
      npcs.say(self, text, Math.max(3000, text.length * 60));
    },
    quality: () => ({ quality: qualityName, pixelRatio, shadows: renderer.shadowMap.enabled }),
    getState,
    walkTo(spotId, options = {}) {
      const spot = place.spots.find((s) => s.id === spotId);
      if (spot) {
        standUp();
        if (options.instant) {
          if (self.clip) {
            stopClip(self);
          }
          self.exitPoint = null;
          self.path = [];
          self.group.position.set(spot.stand.x, 0, spot.stand.z);
          self.target.copy(self.group.position);
        } else {
          routeTo(spot.stand.x, spot.stand.z, { quietZone: true });
        }
        if (options.perform) {
          self.pendingPerform = spot.id;
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
      const peer = createAvatar(info.name || 'Tamu', info.color || '#9aa3ad', {
        visitor: info.mode === 'visit',
        host: Boolean(info.host),
        attire: attireFor(sceneId, info.mode === 'visit' ? 'visit' : 'home'),
      });
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
      const planarDistance = Math.hypot(peer.group.position.x - peer.target.x, peer.group.position.z - peer.target.z);
      if (typeof state.f === 'number' && planarDistance < 0.1) {
        peer.facing = state.f;
      }
      const sitting = Boolean(state.s);
      if (sitting !== peer.sitting) {
        if (sitting) {
          const spot = nearestSitSpot(peer.target);
          setSitting(peer, true, { sitMode: spot ? spot.sitMode : 'pray', seat: spot && spot.seat ? spot.seat : null });
        } else {
          setSitting(peer, false);
        }
      }
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
    attire: self.attire,
    // Diagnostics used by automated checks (no effect on normal use).
    debug: {
      nav: () => nav.report(),
      life: () => ({ ...life.counts(), flying: life.birdsFlying() }),
      self: () => ({
        x: self.group.position.x,
        y: self.group.position.y,
        z: self.group.position.z,
        sitting: self.sitting,
        sitMode: self.sitMode,
        acting: self.clip ? self.clip.def.prop || 'gesture' : null,
        rightArm: self.arms[0].rotation.x,
        lean: self.body.rotation.x,
        pathLength: self.path.length,
      }),
      routeTo: (x, z) => routeTo(x, z).zone?.message || null,
      walkable: (x, z) => nav.walkable(x, z),
      zoneCenters: () => nav.zones.map((zone) => (zone.shape === 'circle'
        ? { x: zone.x, z: zone.z }
        : { x: (zone.x1 + zone.x2) / 2, z: (zone.z1 + zone.z2) / 2 })),
      effects: () => effects.length + emitters.length,
      view: () => ({ mode: view.mode, yaw: rig.yaw, pitch: view.pitch, selfVisible: self.group.visible, camera: camera.position.toArray().map((v) => Math.round(v * 100) / 100) }),
      held: () => (held ? held.debug() : null),
      sky: () => ({ time: currentTime, fading: Boolean(skyFade), stars: stars.visible, sun: sun.intensity }),
      npcs: () => npcs.list.map((npc) => ({ id: npc.id, role: npc.role, x: Math.round(npc.avatar.group.position.x * 10) / 10, z: Math.round(npc.avatar.group.position.z * 10) / 10, cooking: Boolean(npc.cooking), talking: npc.talking, bubble: Boolean(npc.avatar.bubble) })),
      food: () => ({ carrying: carrying.length, table: self.sitSpot ? (tableItems.get(self.sitSpot.id) || []).length : 0, watch: Boolean(watch) }),
      place: () => ({ spots: place.spots.map((s) => s.id), stalls: (place.stalls || []).map((s) => s.id) }),
      tapNpc: (id) => {
        const npc = npcs.byId(id);
        if (npc) {
          onNpc(npc.id, npc.persona, npc.role);
        }
        return Boolean(npc);
      },
    },
    snapshot() {
      renderFrame();
      return renderer.domElement.toDataURL('image/jpeg', 0.85);
    },
    destroy() {
      release({ silent: true });
      timers.forEach(clearTimeout);
      stallLoops.forEach(({ loop }) => loop.stop());
      if (crowdLoop) {
        crowdLoop.stop();
      }
      npcs.dispose();
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
