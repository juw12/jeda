// People who live in the offline world: hawkers who cook to order, diners who eat and chat with each other,
// passers-by, worshippers who light incense or candles, the guide, family at home.
// Their words float above their heads as speech bubbles; tap someone to start a small talk (see chat.js).

import * as THREE from '../../vendor/three.module.min.js';
import { createAvatar, animateAvatar, playClip, stopClip, setSitting, speechBubble } from './avatar.js';
import { METHODS } from './cuisine.js';

const ROLE_LABEL = { vendor: 'penjual', guide: 'pemandu', diner: '', walker: '', worshipper: '', sitter: '' };
const DEVOTIONAL_KINDS = new Set(['incense', 'candle', 'canang', 'flowers', 'lotus', 'water']);

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function createNpcs({ scene, place, nav, fx, quality = 'medium' }) {
  const defs = (place.npcs || []).slice(0, quality === 'low' ? 6 : 12);
  const npcs = [];
  const pickables = [];

  defs.forEach((def) => {
    const persona = def.persona || {};
    const roleLabel = def.family ? 'keluarga' : ROLE_LABEL[def.role] || '';
    const avatar = createAvatar(roleLabel ? `${persona.name} · ${roleLabel}` : persona.name, persona.attire?.top || '#9aa3ad', { attire: { name: '', ...persona.attire } });
    avatar.group.position.set(def.x, 0, def.z);
    avatar.target.copy(avatar.group.position);
    avatar.facing = def.facing || 0;
    avatar.group.rotation.y = avatar.facing;
    avatar.label.material.opacity = 0.85;
    scene.add(avatar.group);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 1.0;
    avatar.group.add(hit);
    const npc = {
      id: def.id, def, persona, role: def.role, culture: def.culture, avatar,
      path: [], timer: 2 + Math.random() * 6, talking: false, cooking: null, greetedAt: -1e9, lastPerform: -1e9,
      convo: null,
    };
    hit.userData.npc = npc;
    pickables.push(hit);
    if (def.seat) {
      avatar.group.position.set(def.seat.x, def.seat.height, def.seat.z);
      setSitting(avatar, true, { sitMode: def.role === 'diner' ? 'meal' : 'rest', seat: def.seat });
      avatar.facing = def.seat.facing;
      avatar.group.rotation.y = avatar.facing;
      if (def.clip) {
        playClip(avatar, def.clip);
        avatar.clip.time = Math.random() * 3;
      }
    }
    npcs.push(npc);
  });

  const byId = new Map(npcs.map((npc) => [npc.id, npc]));

  function say(npc, text, ms = 3800) {
    const avatar = npc.avatar || npc;
    if (avatar.bubble) {
      avatar.group.remove(avatar.bubble);
    }
    const bubble = speechBubble(text);
    bubble.position.y = avatar.sitting ? 1.85 : 2.3;
    avatar.group.add(bubble);
    avatar.bubble = bubble;
    avatar.bubbleUntil = performance.now() + ms;
  }

  function walkTo(npc, x, z) {
    const result = nav.findPath(npc.avatar.group.position, { x, z });
    npc.path = result.path;
    return result.path.length > 0;
  }

  function randomPoint() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 9;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r + 1;
      if (nav.walkable(x, z)) {
        return { x, z };
      }
    }
    return null;
  }

  function faceToward(npc, point) {
    const p = npc.avatar.group.position;
    npc.avatar.facing = Math.atan2(point.x - p.x, point.z - p.z);
  }

  // ---------- Conversations between NPCs (floating bubbles) ----------
  function startConversation(a, b) {
    const scripts = place.talk || [];
    if (!scripts.length) {
      return;
    }
    const script = pick(scripts);
    const convo = { a, b, lines: script, index: 0, timer: 0 };
    a.convo = convo;
    b.convo = convo;
  }

  function stepConversation(convo, delta) {
    convo.timer -= delta;
    if (convo.timer > 0) {
      return;
    }
    if (convo.a.talking || convo.b.talking || convo.index >= convo.lines.length) {
      [convo.a, convo.b].forEach((npc) => {
        npc.convo = null;
        npc.timer = 14 + Math.random() * 16;
        if (npc.def.clip && npc.avatar.sitting) {
          playClip(npc.avatar, npc.def.clip);
        }
      });
      return;
    }
    const [speaker, text] = convo.lines[convo.index];
    const npc = speaker === 0 ? convo.a : convo.b;
    const other = speaker === 0 ? convo.b : convo.a;
    say(npc, text, 3400);
    if (!npc.avatar.clip || npc.avatar.clip.def.loop) {
      playClip(npc.avatar, 'talk');
    }
    if (other.def.clip && other.avatar.sitting) {
      playClip(other.avatar, other.def.clip);
    }
    convo.index += 1;
    convo.timer = 3.6;
  }

  // ---------- Cooking to order ----------
  function vendorFor(stallId) {
    return npcs.find((npc) => npc.role === 'vendor' && npc.def.stallId === stallId) || null;
  }

  function cook(stallId, dish, { onStep = () => {}, onServe = () => {}, onDone = () => {}, takeaway = false } = {}) {
    const npc = vendorFor(stallId);
    const stall = (place.stalls || []).find((s) => s.id === stallId);
    if (!npc || !stall) {
      return false;
    }
    if (npc.cooking) {
      return false;
    }
    const method = METHODS[dish.method || stall.def.method] || METHODS.stir;
    npc.cooking = { stall, dish, steps: method.steps, index: -1, t: 0, onStep, onServe, onDone, takeaway, method };
    npc.path = [];
    const lines = npc.persona.lines || {};
    say(npc, (lines.order || 'Siap, {dish}.').replace('{dish}', dish.name.toLowerCase()));
    faceToward(npc, { x: npc.def.x, z: npc.def.z + (npc.def.facing === Math.PI ? -1 : 1) });
    return true;
  }

  function updateCooking(npc, delta) {
    const job = npc.cooking;
    job.t -= delta;
    if (job.t > 0) {
      return;
    }
    job.index += 1;
    const step = job.steps[job.index];
    const lines = npc.persona.lines || {};
    if (!step) {
      job.stall.cooking = 0;
      stopClip(npc.avatar);
      say(npc, job.takeaway ? lines.bag || 'Ini, dibungkus.' : lines.serve || 'Silakan.');
      npc.cooking = null;
      npc.timer = 6;
      job.onDone();
      return;
    }
    job.t = step.seconds;
    job.stall.cooking = ['flare', 'embers', 'sizzle', 'fry', 'heat'].includes(step.fx) ? 1 : step.fx === 'plate' ? 0 : 0.5;
    if (step.clip === 'serve') {
      playClip(npc.avatar, 'serve', { onRelease: () => job.onServe() });
    } else {
      playClip(npc.avatar, step.clip);
    }
    if (step.fx) {
      fx.stallFx(job.stall, step.fx, step.seconds);
    }
    if (job.index === 1 && lines.cook && lines.cook.length) {
      say(npc, pick(lines.cook), 4200);
    }
    job.onStep({ index: job.index, total: job.steps.length, label: step.label, seconds: step.seconds, method: job.method });
  }

  // ---------- Per-frame ----------
  function moveAlong(npc, delta, speed = 1.35) {
    const position = npc.avatar.group.position;
    while (npc.path.length && Math.hypot(npc.path[0].x - position.x, npc.path[0].z - position.z) < 0.08) {
      npc.path.shift();
    }
    if (!npc.path.length) {
      npc.avatar.moving = false;
      return false;
    }
    const next = npc.path[0];
    const dx = next.x - position.x;
    const dz = next.z - position.z;
    const distance = Math.hypot(dx, dz);
    const step = Math.min(distance, speed * delta);
    position.x += (dx / distance) * step;
    position.z += (dz / distance) * step;
    npc.avatar.facing = Math.atan2(dx, dz);
    npc.avatar.moving = true;
    return true;
  }

  function update(delta, now, elapsed, player) {
    const playerPosition = player.group.position;
    npcs.forEach((npc) => {
      const avatar = npc.avatar;
      const distanceToPlayer = Math.hypot(avatar.group.position.x - playerPosition.x, avatar.group.position.z - playerPosition.z);
      if (npc.cooking) {
        updateCooking(npc, delta);
      } else if (npc.talking) {
        avatar.moving = false;
        npc.path = [];
        if (!avatar.sitting || npc.role === 'sitter') {
          faceToward(npc, playerPosition);
        }
      } else if (npc.convo) {
        if (npc.convo.a === npc) {
          stepConversation(npc.convo, delta);
        }
      } else {
        npc.timer -= delta;
        const moving = moveAlong(npc, delta);
        if (npc.pendingSpot && !moving) {
          const spotDef = npc.pendingSpot;
          npc.pendingSpot = null;
          faceToward(npc, spotDef.position);
          if (elapsed - npc.lastPerform > 40) {
            npc.lastPerform = elapsed;
            fx.perform(spotDef.id, avatar);
          }
          npc.timer = 8 + Math.random() * 8;
        }
        if (npc.timer <= 0 && !moving) {
          npc.timer = 6 + Math.random() * 8;
          if (npc.role === 'walker' || npc.role === 'worshipper') {
            const devotional = npc.role === 'worshipper' ? place.spots.filter((s) => DEVOTIONAL_KINDS.has(s.kind)) : [];
            if (devotional.length && Math.random() < 0.55) {
              const target = pick(devotional);
              if (walkTo(npc, target.stand.x + (Math.random() - 0.5) * 0.6, target.stand.z + 0.3)) {
                npc.pendingSpot = target;
              }
            } else {
              const point = randomPoint();
              if (point) {
                walkTo(npc, point.x, point.z);
              }
            }
          } else if (npc.role === 'vendor') {
            // Between orders hawkers keep working: a slow stir, a wipe of the counter, or just watching.
            const stall = (place.stalls || []).find((s) => s.id === npc.def.stallId);
            const idle = stall ? (METHODS[stall.def.method]?.steps[0]?.clip || 'stir') : 'wipe';
            const choice = Math.random();
            if (choice < 0.45) {
              playClip(avatar, idle);
              setTimeout(() => {
                if (!npc.cooking && avatar.clip && avatar.clip.def.loop) {
                  stopClip(avatar);
                }
              }, 3500);
            } else if (choice < 0.7) {
              playClip(avatar, 'wipe');
              setTimeout(() => {
                if (!npc.cooking && avatar.clip && avatar.clip.def.prop === 'cloth') {
                  stopClip(avatar);
                }
              }, 2800);
            }
            avatar.facing = npc.def.facing || 0;
          } else if (npc.def.pair && !npc.convo) {
            const partner = byId.get(npc.def.pair);
            if (partner && !partner.convo && !partner.talking && npc.id < partner.id) {
              startConversation(npc, partner);
            }
          }
        }
        // Say hello when you come close (once in a while).
        if (distanceToPlayer < 3.2 && now - npc.greetedAt > 60000 && !npc.convo) {
          npc.greetedAt = now;
          const hello = npc.persona.lines?.hello || npc.persona.hello || (npc.role === 'guide'
            ? 'Selamat datang! Ketuk saya kalau mau bertanya.'
            : null);
          if (hello) {
            say(npc, hello, 4200);
          }
        }
      }
      // Turn smoothly, keep seated people on their seats.
      let difference = avatar.facing - avatar.group.rotation.y;
      difference = Math.atan2(Math.sin(difference), Math.cos(difference));
      avatar.group.rotation.y += difference * Math.min(1, delta * 6);
      if (avatar.sitting && avatar.seat) {
        avatar.group.position.set(avatar.seat.x, avatar.seat.height, avatar.seat.z);
      }
      animateAvatar(avatar, delta, now, elapsed);
    });
  }

  return {
    list: npcs,
    pickables,
    update,
    byId: (id) => byId.get(id) || null,
    pick(raycaster) {
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.npc : null;
    },
    say,
    cook,
    vendorFor,
    busy: (stallId) => Boolean(vendorFor(stallId)?.cooking),
    setTalking(npc, on) {
      npc.talking = on;
      if (on) {
        npc.path = [];
        if (npc.convo) {
          npc.convo.index = 99;
        }
        if (!npc.cooking && !npc.avatar.sitting) {
          stopClip(npc.avatar);
        }
        if (npc.avatar.sitting && npc.def.clip) {
          stopClip(npc.avatar);
        }
      } else if (npc.avatar.sitting && npc.def.clip && !npc.avatar.clip) {
        playClip(npc.avatar, npc.def.clip);
      }
    },
    gesture(npc) {
      // A little hand movement while speaking (seated diners keep their meal pose).
      if (npc.cooking || (npc.avatar.sitting && npc.def.clip)) {
        return;
      }
      playClip(npc.avatar, 'talk');
      setTimeout(() => {
        if (!npc.cooking && npc.avatar.clip && npc.avatar.clip.def.loop && !npc.avatar.sitting) {
          stopClip(npc.avatar);
        }
      }, 2600);
    },
    dispose() {
      npcs.forEach((npc) => scene.remove(npc.avatar.group));
    },
  };
}
