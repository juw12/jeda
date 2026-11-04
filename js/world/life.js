// Ambient life that reacts to visitors: birds that scatter when you come close (and land again),
// koi circling in ponds that dart away when you tap the water, butterflies by day, and trees that
// rustle and drop leaves when tapped.

import * as THREE from '../../vendor/three.module.min.js';
import { mat, box, sphere, cone } from './places.js';

const DOVE_PLACES = new Set(['masjid', 'gereja', 'katedral']);

function makeBird(white) {
  const group = new THREE.Group();
  const bodyColor = white ? '#f4f2ee' : '#9aa0a6';
  const wingColor = white ? '#e6e2da' : '#6f757c';
  const body = sphere(0.09, bodyColor, 8);
  body.scale.set(0.9, 0.8, 1.5);
  body.position.y = 0.12;
  const head = sphere(0.055, white ? '#f7f5f1' : '#7d838a', 8);
  head.position.set(0, 0.2, 0.12);
  const beak = cone(0.018, 0.05, '#e39b3a', 5);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.2, 0.18);
  const tail = box(0.08, 0.015, 0.1, wingColor);
  tail.position.set(0, 0.13, -0.14);
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.06, 0.15, 0);
    const wing = box(0.16, 0.012, 0.1, wingColor);
    wing.position.x = side * 0.08;
    pivot.add(wing);
    group.add(pivot);
    return { pivot, side };
  });
  group.add(body, head, beak, tail);
  return { group, head, wings };
}

function makeFish(color, spots) {
  const group = new THREE.Group();
  const body = sphere(0.06, color, 8);
  body.scale.set(0.55, 0.4, 1.5);
  group.add(body);
  if (spots) {
    const patch = sphere(0.035, spots, 6);
    patch.scale.set(0.8, 0.5, 1.2);
    patch.position.set(0, 0.012, 0.02);
    group.add(patch);
  }
  const tail = cone(0.04, 0.08, color, 5);
  tail.rotation.x = -Math.PI / 2;
  tail.position.z = -0.12;
  group.add(tail);
  return { group, tail };
}

function makeButterfly(color) {
  const group = new THREE.Group();
  const wingMaterial = mat(color, { side: THREE.DoubleSide, roughness: 0.6 });
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), wingMaterial);
    wing.rotation.x = -Math.PI / 2;
    wing.position.x = side * 0.055;
    pivot.add(wing);
    group.add(pivot);
    return { pivot, side };
  });
  group.add(box(0.012, 0.012, 0.08, '#3a2e26'));
  return { group, wings };
}

export function createLife({ scene, place, nav, sceneId, time, quality, addEmitter }) {
  const root = new THREE.Group();
  scene.add(root);
  const birds = [];
  const fish = [];
  const butterflies = [];
  const ripples = [];
  const trees = [];
  const ponds = [];
  const lowQuality = quality.particles < 0.8;

  place.group.updateMatrixWorld(true);
  place.group.children.forEach((child) => {
    if (child.userData.kind === 'tree') {
      trees.push({ group: child, shake: 0, baseRotation: child.rotation.z });
    }
    if (child.userData.kind === 'pond') {
      const center = child.getWorldPosition(new THREE.Vector3());
      const water = child.children.find((c) => c.userData.water);
      ponds.push({ center, radius: child.userData.radius, water, excited: 0 });
    }
  });

  // ---- Birds (not at night) ----
  const plaza = new THREE.Vector3((place.spawn.x + place.focus.x) / 2, 0, (place.spawn.z + place.focus.z) / 2);
  function randomGround(near = plaza, minRadius = 1.5, maxRadius = 7) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const x = near.x + Math.cos(angle) * radius;
      const z = near.z + Math.sin(angle) * radius;
      if (nav.walkable(x, z) && !nav.zoneAt(x, z)) {
        return new THREE.Vector3(x, 0, z);
      }
    }
    return new THREE.Vector3(place.spawn.x + 2, 0, place.spawn.z - 2);
  }
  if (time !== 'night') {
    const white = DOVE_PLACES.has(sceneId);
    const count = lowQuality ? 4 : 7;
    for (let i = 0; i < count; i++) {
      const bird = makeBird(white);
      bird.group.position.copy(randomGround());
      bird.group.rotation.y = Math.random() * Math.PI * 2;
      root.add(bird.group);
      birds.push({ ...bird, state: 'ground', timer: Math.random() * 2, velocity: new THREE.Vector3(), landing: null, peck: 0 });
    }
  }

  function scare(bird, from) {
    if (bird.state !== 'ground') {
      return;
    }
    const away = bird.group.position.clone().sub(from);
    away.y = 0;
    if (away.lengthSq() < 0.001) {
      away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    }
    away.normalize().multiplyScalar(2.6 + Math.random());
    bird.velocity.set(away.x, 2.4 + Math.random() * 0.8, away.z);
    bird.state = 'fly';
    bird.timer = 2.2 + Math.random() * 1.6;
    bird.landing = null;
  }

  // ---- Koi ----
  const koiColors = [['#f08a3c', '#f4efe6'], ['#f4efe6', '#e2513a'], ['#e9a23b', null], ['#f4efe6', '#2b2b2b']];
  ponds.forEach((pond) => {
    const count = lowQuality ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const [color, spots] = koiColors[i % koiColors.length];
      const koi = makeFish(color, spots);
      root.add(koi.group);
      fish.push({
        ...koi, pond,
        angle: Math.random() * Math.PI * 2,
        orbit: pond.radius * (0.35 + Math.random() * 0.4),
        speed: (0.25 + Math.random() * 0.2) * (i % 2 ? 1 : -1),
        phase: Math.random() * 10,
      });
    }
  });

  // ---- Butterflies (day/dawn) near trees ----
  if ((time === 'day' || time === 'dawn') && trees.length) {
    const colors = ['#f3d16b', '#f7f2ea', '#f39a2b'];
    const count = lowQuality ? 1 : 3;
    for (let i = 0; i < count; i++) {
      const home = trees[i % trees.length].group.position.clone();
      const butterfly = makeButterfly(colors[i % colors.length]);
      root.add(butterfly.group);
      butterflies.push({ ...butterfly, home, phase: Math.random() * 10 });
    }
  }

  function addRipple(point) {
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.12, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(point.x, 0.07, point.z);
      ring.visible = false;
      root.add(ring);
      ripples.push({ ring, delay: i * 0.35, life: 2.4 });
    }
  }

  // Returns true when the tap was used by something alive (so the avatar doesn't walk there).
  function pick(raycaster, actorPosition) {
    const ray = raycaster.ray;
    for (const bird of birds) {
      if (bird.state === 'ground' && ray.distanceToPoint(bird.group.position.clone().add(new THREE.Vector3(0, 0.15, 0))) < 0.35) {
        birds.forEach((other) => {
          if (other.group.position.distanceTo(bird.group.position) < 3) {
            scare(other, actorPosition);
          }
        });
        return { kind: 'bird' };
      }
    }
    const waterMeshes = ponds.map((pond) => pond.water).filter(Boolean);
    const waterHit = raycaster.intersectObjects(waterMeshes, false)[0];
    if (waterHit) {
      const pond = ponds.find((p) => p.water === waterHit.object);
      pond.excited = 2.5;
      addRipple(waterHit.point);
      return { kind: 'pond' };
    }
    const treeHit = raycaster.intersectObjects(trees.map((tree) => tree.group), true)[0];
    if (treeHit) {
      let node = treeHit.object;
      while (node && node.userData.kind !== 'tree') {
        node = node.parent;
      }
      const tree = trees.find((t) => t.group === node);
      if (tree) {
        tree.shake = 1;
        const crown = tree.group.position.clone().add(new THREE.Vector3(0, 2.6 * (tree.group.userData.scale || 1), 0));
        addEmitter(crown, { color: tree.group.userData.leaf || '#6f9a5c', size: 0.18, rate: 26, life: 2.6, rise: -0.45, spread: 1.1, duration: 1.2, count: 40 });
        birds.forEach((bird) => {
          if (bird.group.position.distanceTo(tree.group.position) < 4) {
            scare(bird, tree.group.position);
          }
        });
        return { kind: 'tree' };
      }
    }
    return null;
  }

  function update(delta, elapsed, avatars) {
    birds.forEach((bird) => {
      const position = bird.group.position;
      if (bird.state === 'ground') {
        const threat = avatars.find((avatar) => avatar.group.position.distanceTo(position) < 2.0 && (avatar.moving || avatar.clip));
        if (threat) {
          scare(bird, threat.group.position);
          return;
        }
        bird.timer -= delta;
        if (bird.timer <= 0) {
          bird.timer = 0.8 + Math.random() * 2.2;
          bird.peck = 0.35;
          if (Math.random() < 0.35) {
            bird.group.rotation.y += (Math.random() - 0.5) * 2;
          }
          if (Math.random() < 0.3) {
            const forward = new THREE.Vector3(Math.sin(bird.group.rotation.y), 0, Math.cos(bird.group.rotation.y)).multiplyScalar(0.15);
            const next = position.clone().add(forward);
            if (nav.walkable(next.x, next.z)) {
              position.copy(next);
            }
          }
        }
        bird.peck = Math.max(0, bird.peck - delta);
        bird.group.rotation.x = bird.peck > 0 ? Math.sin((bird.peck / 0.35) * Math.PI) * 0.55 : 0;
        bird.wings.forEach(({ pivot }) => {
          pivot.rotation.z = 0;
        });
        position.y = 0;
        return;
      }
      // Flying: flap, climb away, then circle back to a new landing spot.
      bird.timer -= delta;
      bird.group.rotation.x = 0;
      bird.wings.forEach(({ pivot, side }) => {
        pivot.rotation.z = side * Math.sin(elapsed * 30 + side) * 0.9;
      });
      if (bird.timer <= 0 && !bird.landing) {
        bird.landing = randomGround();
      }
      if (bird.landing) {
        const toLanding = bird.landing.clone().sub(position);
        const distance = toLanding.length();
        const desired = toLanding.normalize().multiplyScalar(Math.min(3, distance * 1.5 + 0.4));
        bird.velocity.lerp(desired, Math.min(1, delta * 1.8));
        if (distance < 0.25) {
          position.copy(bird.landing);
          bird.state = 'ground';
          bird.timer = 1 + Math.random() * 2;
          bird.velocity.set(0, 0, 0);
          return;
        }
      } else {
        bird.velocity.y = Math.max(0, bird.velocity.y - delta * 0.8);
      }
      position.addScaledVector(bird.velocity, delta);
      position.y = Math.min(5.5, Math.max(0, position.y));
      if (bird.velocity.lengthSq() > 0.01) {
        bird.group.rotation.y = Math.atan2(bird.velocity.x, bird.velocity.z);
      }
    });

    fish.forEach((koi) => {
      const pond = koi.pond;
      const boost = pond.excited > 0 ? 3 : 1;
      koi.angle += koi.speed * boost * delta;
      const wobble = Math.sin(elapsed * 0.7 + koi.phase) * 0.12 * pond.radius;
      const radius = Math.min(pond.radius - 0.25, koi.orbit + wobble);
      koi.group.position.set(pond.center.x + Math.cos(koi.angle) * radius, 0.035, pond.center.z + Math.sin(koi.angle) * radius);
      // Swim along the circle's tangent (forward = local +z).
      const direction = Math.sign(koi.speed);
      koi.group.rotation.y = Math.atan2(-Math.sin(koi.angle) * direction, Math.cos(koi.angle) * direction);
      koi.tail.rotation.y = Math.sin(elapsed * 8 * boost + koi.phase) * 0.5;
    });
    ponds.forEach((pond) => {
      pond.excited = Math.max(0, pond.excited - delta);
    });

    butterflies.forEach((butterfly) => {
      const t = elapsed * 0.6 + butterfly.phase;
      butterfly.group.position.set(
        butterfly.home.x + Math.sin(t) * 2.2 + Math.sin(t * 2.3) * 0.5,
        1.2 + Math.sin(t * 1.7) * 0.4,
        butterfly.home.z + Math.cos(t * 0.8) * 2.2,
      );
      butterfly.group.rotation.y = t;
      butterfly.wings.forEach(({ pivot, side }) => {
        pivot.rotation.z = side * (0.2 + Math.abs(Math.sin(elapsed * 14 + butterfly.phase)) * 1.1);
      });
    });

    trees.forEach((tree) => {
      if (tree.shake > 0) {
        tree.shake = Math.max(0, tree.shake - delta * 0.7);
        tree.group.rotation.z = tree.baseRotation + Math.sin(elapsed * 16) * 0.06 * tree.shake;
      } else {
        tree.group.rotation.z = tree.baseRotation + Math.sin(elapsed * 0.6 + tree.group.position.x) * 0.006;
      }
    });

    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      if (ripple.delay > 0) {
        ripple.delay -= delta;
        continue;
      }
      ripple.ring.visible = true;
      ripple.life -= delta;
      ripple.ring.scale.multiplyScalar(1 + delta * 1.5);
      ripple.ring.material.opacity = Math.max(0, ripple.life / 2.4) * 0.85;
      if (ripple.life <= 0) {
        root.remove(ripple.ring);
        ripple.ring.geometry.dispose();
        ripple.ring.material.dispose();
        ripples.splice(i, 1);
      }
    }
  }

  return {
    pick,
    update,
    counts: () => ({ birds: birds.length, fish: fish.length, butterflies: butterflies.length, trees: trees.length, ponds: ponds.length }),
    birdsFlying: () => birds.filter((bird) => bird.state === 'fly').length,
  };
}
