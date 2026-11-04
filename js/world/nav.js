// Walkable area for the 3D spaces.
// - Solid things (walls, shrines, furnaces, benches, tree trunks, ponds) block walking. They are derived
//   from the place geometry itself, so new buildings get collisions automatically.
// - Sacred zones (place.restricted) are roped off with a gentle explanation (e.g. the Padmasana).
// - A low wall marks the edge of the space.
// - Taps are routed with grid A* so the avatar walks around obstacles instead of through them.

import * as THREE from '../../vendor/three.module.min.js';
import { mat } from './places.js';

const CELL = 0.4;
const EXTENT = 22;
export const BOUNDARY = 20;
const AVATAR_RADIUS = 0.3;
const OVERHEAD = 1.7;   // things entirely above this height (roofs, lanterns) don't block
const LOW = 0.35;       // things lower than this (steps, rugs, cushions) can be walked over

const FREE = 0;
const SOLID = 1;
const ZONE = 2;

function flagged(object, root, flag) {
  for (let node = object; node && node !== root; node = node.parent) {
    if (node.userData && node.userData[flag]) {
      return true;
    }
  }
  return false;
}

function inZone(zone, x, z) {
  if (zone.shape === 'circle') {
    return Math.hypot(x - zone.x, z - zone.z) <= zone.r;
  }
  return x >= Math.min(zone.x1, zone.x2) && x <= Math.max(zone.x1, zone.x2)
    && z >= Math.min(zone.z1, zone.z2) && z <= Math.max(zone.z1, zone.z2);
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  push(node, priority) {
    const items = this.items;
    items.push([priority, node]);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent][0] <= items[i][0]) {
        break;
      }
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && items[left][0] < items[smallest][0]) {
          smallest = left;
        }
        if (right < items.length && items[right][0] < items[smallest][0]) {
          smallest = right;
        }
        if (smallest === i) {
          break;
        }
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top[1];
  }

  get size() {
    return this.items.length;
  }
}

export function buildNav(place) {
  const size = Math.ceil((EXTENT * 2) / CELL);
  const grid = new Uint8Array(size * size);
  const zoneOf = new Int16Array(size * size).fill(-1);
  const zones = place.restricted || [];
  const cellOf = (value) => Math.max(0, Math.min(size - 1, Math.floor((value + EXTENT) / CELL)));
  const centerOf = (index) => -EXTENT + (index + 0.5) * CELL;
  const indexOf = (cx, cz) => cz * size + cx;

  // ---- Obstacles from the geometry ----
  const obstacles = [];
  place.group.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  place.group.traverse((object) => {
    if (!object.isMesh || flagged(object, place.group, 'noCollide')) {
      return;
    }
    bounds.setFromObject(object);
    if (bounds.min.y > OVERHEAD || bounds.max.y - Math.max(0, bounds.min.y) < LOW) {
      return;
    }
    obstacles.push({ type: 'box', minX: bounds.min.x, maxX: bounds.max.x, minZ: bounds.min.z, maxZ: bounds.max.z });
  });
  const worldPosition = new THREE.Vector3();
  place.group.traverse((object) => {
    if (object.userData && object.userData.collider) {
      object.getWorldPosition(worldPosition);
      obstacles.push({ type: 'circle', x: worldPosition.x, z: worldPosition.z, r: object.userData.collider.r });
    }
  });

  for (let cz = 0; cz < size; cz++) {
    for (let cx = 0; cx < size; cx++) {
      const x = centerOf(cx);
      const z = centerOf(cz);
      const index = indexOf(cx, cz);
      if (Math.hypot(x, z) > BOUNDARY - AVATAR_RADIUS) {
        grid[index] = SOLID;
        continue;
      }
      const solid = obstacles.some((o) => (o.type === 'circle'
        ? Math.hypot(x - o.x, z - o.z) < o.r + AVATAR_RADIUS
        : x > o.minX - AVATAR_RADIUS && x < o.maxX + AVATAR_RADIUS && z > o.minZ - AVATAR_RADIUS && z < o.maxZ + AVATAR_RADIUS));
      if (solid) {
        grid[index] = SOLID;
        continue;
      }
      const zoneIndex = zones.findIndex((zone) => inZone(zone, x, z));
      if (zoneIndex >= 0) {
        grid[index] = ZONE;
        zoneOf[index] = zoneIndex;
      }
    }
  }

  // Activity spots and the entrance must always be standable, even when tucked against furniture.
  const keepClear = [place.spawn, ...place.spots.map((spot) => spot.stand)];
  keepClear.forEach((point) => {
    const reach = Math.ceil(0.45 / CELL);
    const pcx = cellOf(point.x);
    const pcz = cellOf(point.z);
    for (let dz = -reach; dz <= reach; dz++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (cx < 0 || cz < 0 || cx >= size || cz >= size) {
          continue;
        }
        if (Math.hypot(centerOf(cx) - point.x, centerOf(cz) - point.z) <= 0.45) {
          grid[indexOf(cx, cz)] = FREE;
        }
      }
    }
  });

  const freeCell = (cx, cz) => cx >= 0 && cz >= 0 && cx < size && cz < size && grid[indexOf(cx, cz)] === FREE;
  const walkable = (x, z) => freeCell(cellOf(x), cellOf(z));

  function zoneAt(x, z) {
    const zoneIndex = zoneOf[indexOf(cellOf(x), cellOf(z))];
    if (zoneIndex >= 0) {
      return zones[zoneIndex];
    }
    // Taps on the rope area itself or just inside a shrine also count.
    return zones.find((zone) => inZone(zone, x, z)) || null;
  }

  function nearestFreeCell(cx, cz, maxRing = 30) {
    if (freeCell(cx, cz)) {
      return [cx, cz];
    }
    let best = null;
    let bestDistance = Infinity;
    for (let ring = 1; ring <= maxRing; ring++) {
      for (let dz = -ring; dz <= ring; dz++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) {
            continue;
          }
          if (freeCell(cx + dx, cz + dz)) {
            const distance = dx * dx + dz * dz;
            if (distance < bestDistance) {
              bestDistance = distance;
              best = [cx + dx, cz + dz];
            }
          }
        }
      }
      if (best) {
        return best;
      }
    }
    return null;
  }

  function lineFree(ax, az, bx, bz) {
    const distance = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(distance / (CELL * 0.4)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      if (!walkable(ax + (bx - ax) * t, az + (bz - az) * t)) {
        return false;
      }
    }
    return true;
  }

  // Returns { path: Vector3[], zone, reached } — path excludes the current position.
  function findPath(from, to) {
    const zone = zoneAt(to.x, to.z);
    let goal = [cellOf(to.x), cellOf(to.z)];
    const exactGoal = freeCell(goal[0], goal[1]);
    if (!exactGoal) {
      goal = nearestFreeCell(goal[0], goal[1]);
    }
    let start = [cellOf(from.x), cellOf(from.z)];
    const startFree = freeCell(start[0], start[1]);
    if (!startFree) {
      start = nearestFreeCell(start[0], start[1]);
    }
    if (!goal || !start) {
      return { path: [], zone, reached: false };
    }
    const startIndex = indexOf(start[0], start[1]);
    const goalIndex = indexOf(goal[0], goal[1]);
    const cameFrom = new Int32Array(size * size).fill(-1);
    const cost = new Float32Array(size * size).fill(Infinity);
    const closed = new Uint8Array(size * size);
    const heap = new MinHeap();
    cost[startIndex] = 0;
    heap.push(startIndex, 0);
    const heuristic = (index) => Math.hypot((index % size) - goal[0], Math.floor(index / size) - goal[1]);
    let found = startIndex === goalIndex;
    while (heap.size && !found) {
      const current = heap.pop();
      if (closed[current]) {
        continue;
      }
      closed[current] = 1;
      if (current === goalIndex) {
        found = true;
        break;
      }
      const cx = current % size;
      const cz = Math.floor(current / size);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) {
            continue;
          }
          const nx = cx + dx;
          const nz = cz + dz;
          if (!freeCell(nx, nz)) {
            continue;
          }
          if (dx && dz && (!freeCell(cx + dx, cz) || !freeCell(cx, cz + dz))) {
            continue;
          }
          const next = indexOf(nx, nz);
          const nextCost = cost[current] + (dx && dz ? Math.SQRT2 : 1);
          if (nextCost < cost[next]) {
            cost[next] = nextCost;
            cameFrom[next] = current;
            heap.push(next, nextCost + heuristic(next));
          }
        }
      }
    }
    if (!found) {
      return { path: [], zone, reached: false };
    }
    const cells = [];
    for (let index = goalIndex; index !== -1 && index !== startIndex; index = cameFrom[index]) {
      cells.push(index);
    }
    cells.reverse();
    const points = cells.map((index) => new THREE.Vector3(centerOf(index % size), 0, centerOf(Math.floor(index / size))));
    if (exactGoal) {
      if (points.length) {
        points[points.length - 1].set(to.x, 0, to.z);
      } else {
        points.push(new THREE.Vector3(to.x, 0, to.z));
      }
    }
    if (!startFree) {
      points.unshift(new THREE.Vector3(centerOf(start[0]), 0, centerOf(start[1])));
    }
    // String-pull: drop waypoints that are visible from an earlier one.
    const smoothed = [];
    let anchor = startFree ? new THREE.Vector3(from.x, 0, from.z) : points[0];
    let i = startFree ? 0 : 1;
    if (!startFree) {
      smoothed.push(points[0]);
    }
    while (i < points.length) {
      let furthest = i;
      for (let j = points.length - 1; j > i; j--) {
        if (lineFree(anchor.x, anchor.z, points[j].x, points[j].z)) {
          furthest = j;
          break;
        }
      }
      smoothed.push(points[furthest]);
      anchor = points[furthest];
      i = furthest + 1;
    }
    return { path: smoothed, zone, reached: exactGoal };
  }

  // Diagnostics for tests: unreachable activity spots would mean a broken space.
  function report() {
    const startCell = nearestFreeCell(cellOf(place.spawn.x), cellOf(place.spawn.z));
    const seen = new Uint8Array(size * size);
    const queue = [indexOf(startCell[0], startCell[1])];
    seen[queue[0]] = 1;
    while (queue.length) {
      const current = queue.pop();
      const cx = current % size;
      const cz = Math.floor(current / size);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
        if (freeCell(cx + dx, cz + dz) && !seen[indexOf(cx + dx, cz + dz)]) {
          seen[indexOf(cx + dx, cz + dz)] = 1;
          queue.push(indexOf(cx + dx, cz + dz));
        }
      });
    }
    let freeCount = 0;
    grid.forEach((value) => {
      if (value === FREE) {
        freeCount += 1;
      }
    });
    return {
      obstacles: obstacles.length,
      zones: zones.length,
      freeArea: Math.round(freeCount * CELL * CELL),
      unreachableSpots: place.spots.filter((spot) => !seen[indexOf(cellOf(spot.stand.x), cellOf(spot.stand.z))]).map((spot) => spot.id),
    };
  }

  return { walkable, zoneAt, findPath, report, zones };
}

// Visible limits: rope barriers around sacred zones and a low wall at the edge.
export function createBarriers(place) {
  const group = new THREE.Group();
  const postMaterialColor = '#b8913f';
  const ropeColor = '#9b2a2a';
  const addPost = (x, z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.9, 8), mat(postMaterialColor, { metalness: 0.5, roughness: 0.4 }));
    post.position.set(x, 0.45, z);
    post.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(postMaterialColor, { metalness: 0.5, roughness: 0.4 }));
    knob.position.set(x, 0.93, z);
    group.add(post, knob);
  };
  const addSegment = (start, end) => {
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, start.distanceTo(end), 5), mat(ropeColor, { roughness: 0.9 }));
    segment.position.copy(start).add(end).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    group.add(segment);
  };
  // Rope between two posts with a slight sag in the middle.
  const addRope = ([ax, az], [bx, bz]) => {
    const start = new THREE.Vector3(ax, 0.8, az);
    const middle = new THREE.Vector3((ax + bx) / 2, 0.68, (az + bz) / 2);
    const end = new THREE.Vector3(bx, 0.8, bz);
    addSegment(start, middle);
    addSegment(middle, end);
  };
  (place.restricted || []).forEach((zone) => {
    if (zone.rope === false) {
      return;
    }
    let points = [];
    if (zone.shape === 'circle') {
      const count = Math.max(6, Math.round((Math.PI * 2 * zone.r) / 1.3));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        points.push([zone.x + Math.cos(angle) * zone.r, zone.z + Math.sin(angle) * zone.r]);
      }
    } else {
      const corners = [[zone.x1, zone.z1], [zone.x2, zone.z1], [zone.x2, zone.z2], [zone.x1, zone.z2]];
      corners.forEach((corner, index) => {
        const next = corners[(index + 1) % 4];
        const pieces = Math.max(1, Math.round(Math.hypot(next[0] - corner[0], next[1] - corner[1]) / 1.4));
        for (let i = 0; i < pieces; i++) {
          points.push([corner[0] + ((next[0] - corner[0]) * i) / pieces, corner[1] + ((next[1] - corner[1]) * i) / pieces]);
        }
      });
    }
    // Only rope the sides that face the open courtyard (skip posts buried inside walls).
    if (zone.ropeSides) {
      points = points.filter(([x, z]) => zone.ropeSides(x, z));
    }
    points.forEach(([x, z]) => addPost(x, z));
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      if (Math.hypot(next[0] - point[0], next[1] - point[1]) < 2.2) {
        addRope(point, next);
      }
    });
  });

  // Low boundary wall
  const wallColor = place.wall || '#a89d88';
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(BOUNDARY + 0.35, BOUNDARY + 0.35, 0.6, 120, 1, true), mat(wallColor, { roughness: 1, side: THREE.DoubleSide }));
  wall.position.y = 0.3;
  wall.receiveShadow = true;
  const cap = new THREE.Mesh(new THREE.RingGeometry(BOUNDARY + 0.1, BOUNDARY + 0.6, 120), mat(wallColor, { roughness: 1, side: THREE.DoubleSide }));
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = 0.6;
  group.add(wall, cap);
  return group;
}
