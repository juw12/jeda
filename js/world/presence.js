// Live presence in a 3D space, peer-to-peer (WebRTC) with signalling over public Nostr relays.
// No Jeda server, no account. Shared data: guest name, avatar colour, position, activities, greetings.
// Note: like any peer-to-peer call, other visitors' browsers can see your IP address. Presence is opt-in.
//
// Large audiences (e.g. a TikTok Live): a full mesh does not scale, so a live room is split into
// "shards". Each viewer joins one shard; the host joins all of them and is visible to everyone.

import { CONFIG } from '../config.js';
import { greetingById } from './greetings.js';

const APP_ID = 'jeda-ruang-hening-v1';

async function iceServers() {
  // Optional TURN for strict networks: CONFIG.turnCredentialsUrl must return [{urls, username, credential}, …]
  if (!CONFIG.turnCredentialsUrl) {
    return undefined;
  }
  try {
    const response = await fetch(CONFIG.turnCredentialsUrl);
    const servers = await response.json();
    return Array.isArray(servers) ? servers : servers.iceServers;
  } catch {
    return undefined;
  }
}

function wrapAction(room, name) {
  // Trystero changed its action API (array [send, receive] -> object with send()/onMessage).
  const made = room.makeAction(name);
  if (Array.isArray(made)) {
    const [send, receive] = made;
    return { send: (data, peerId) => send(data, peerId), on: (handler) => receive(handler) };
  }
  return {
    send: (data, peerId) => made.send(data, peerId ? { target: peerId } : {}).catch(() => {}),
    on: (handler) => {
      made.onMessage = (data, meta) => handler(data, meta && meta.peerId);
    },
  };
}

function onRoom(room, eventName, handler) {
  if (typeof room[eventName] === 'function' && room[eventName].length > 0) {
    room[eventName](handler);
  } else {
    room[eventName] = handler;
  }
}

const safeName = (value) => String(value || 'Tamu').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 24) || 'Tamu';
const safeColor = (value) => (/^#[0-9a-f]{6}$/i.test(value) ? value : '#9aa3ad');

/**
 * @param {string|string[]} roomNames one room, or several shards (the host of a live room joins all)
 * @param {{name, color, mode, host?, proof?}} profile
 * @param {{join, leave, state, act, greet, lead?}} handlers
 */
export async function joinPresence(roomNames, profile, handlers) {
  const { joinRoom, selfId } = await import('../../vendor/trystero-nostr.js');
  const turnConfig = await iceServers();
  const names = Array.isArray(roomNames) ? roomNames : [roomNames];
  const known = new Map(); // peerId -> { info, room }
  let lastState = null;

  const rooms = names.map((roomName) => {
    const room = joinRoom(turnConfig ? { appId: APP_ID, turnConfig } : { appId: APP_ID }, roomName);
    const actions = {
      hello: wrapAction(room, 'hello'),
      state: wrapAction(room, 'state'),
      act: wrapAction(room, 'act'),
      greet: wrapAction(room, 'greet'),
      lead: wrapAction(room, 'lead'),
    };
    const entry = { room, actions };

    onRoom(room, 'onPeerJoin', (peerId) => {
      actions.hello.send({ name: profile.name, color: profile.color, mode: profile.mode, host: Boolean(profile.host), proof: profile.proof || null }, peerId);
      if (lastState) {
        actions.state.send(lastState, peerId);
      }
    });
    onRoom(room, 'onPeerLeave', (peerId) => {
      if (known.has(peerId)) {
        known.delete(peerId);
        handlers.leave(peerId);
      }
    });
    actions.hello.on((data, peerId) => {
      if (known.has(peerId) || !data) {
        return;
      }
      const info = {
        name: safeName(data.name),
        color: safeColor(data.color),
        mode: data.mode === 'visit' ? 'visit' : 'home',
        host: Boolean(data.host),
        proof: typeof data.proof === 'string' && data.proof.length <= 64 ? data.proof : null,
      };
      known.set(peerId, { info, entry });
      handlers.join(peerId, info);
    });
    actions.state.on((data, peerId) => {
      if (!known.has(peerId) || !data) {
        return;
      }
      const clamp = (n) => Math.max(-30, Math.min(30, Number(n) || 0));
      handlers.state(peerId, { x: clamp(data.x), z: clamp(data.z), f: Number(data.f) || 0, s: data.s ? 1 : 0 });
    });
    actions.act.on((data, peerId) => {
      if (known.has(peerId) && data && typeof data.spot === 'string' && data.spot.length < 40) {
        handlers.act(peerId, data.spot);
      }
    });
    actions.greet.on((data, peerId) => {
      if (known.has(peerId) && data && typeof data.g === 'string' && greetingById(data.g)) {
        handlers.greet(peerId, data.g);
      }
    });
    actions.lead.on((data, peerId) => {
      if (known.has(peerId) && data && typeof data.type === 'string' && handlers.lead) {
        handlers.lead(peerId, data, known.get(peerId).info);
      }
    });
    return entry;
  });

  const broadcast = (action, data) => rooms.forEach((entry) => entry.actions[action].send(data));

  return {
    selfId,
    shards: rooms.length,
    sendState(state) {
      const changed = !lastState || lastState.x !== state.x || lastState.z !== state.z || lastState.s !== state.s;
      lastState = state;
      if (changed) {
        broadcast('state', state);
      }
    },
    sendAct(spotId) {
      broadcast('act', { spot: spotId });
    },
    sendGreet(greetingId) {
      broadcast('greet', { g: greetingId });
    },
    sendLead(data) {
      broadcast('lead', data);
    },
    peerCount: () => known.size,
    peerInfo: (peerId) => (known.has(peerId) ? known.get(peerId).info : null),
    leave() {
      rooms.forEach((entry) => entry.room.leave());
    },
  };
}
