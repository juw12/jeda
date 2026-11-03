// Live presence in a 3D space, peer-to-peer (WebRTC) with signalling over public Nostr relays.
// No Jeda server, no account. Shared data: guest name, avatar colour, position, activities, emotes.
// Note: like any peer-to-peer call, other visitors' browsers can see your IP address. Presence is opt-in.

const APP_ID = 'jeda-ruang-hening-v1';

export async function joinPresence(roomName, profile, handlers) {
  const { joinRoom, selfId } = await import('../../vendor/trystero-nostr.js');
  const room = joinRoom({ appId: APP_ID }, roomName);

  // Trystero changed its action API (array [send, receive] -> object with send()/onMessage).
  // Normalise both shapes to send(data, peerId?) and on(handler(data, peerId)).
  function action(name) {
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
  function onRoom(eventName, handler) {
    if (typeof room[eventName] === 'function' && room[eventName].length > 0) {
      room[eventName](handler);
    } else {
      room[eventName] = handler;
    }
  }
  const helloAction = action('hello');
  const stateAction = action('state');
  const actAction = action('act');
  const emoteAction = action('emote');
  const sendHello = helloAction.send;
  const sendState = stateAction.send;
  const sendAct = actAction.send;
  const sendEmote = emoteAction.send;
  const onHello = helloAction.on;
  const onState = stateAction.on;
  const onAct = actAction.on;
  const onEmote = emoteAction.on;
  const known = new Set();
  let lastState = null;

  const safeName = (value) => String(value || 'Tamu').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 24) || 'Tamu';
  const safeColor = (value) => (/^#[0-9a-f]{6}$/i.test(value) ? value : '#9aa3ad');

  onRoom('onPeerJoin', (peerId) => {
    sendHello({ name: profile.name, color: profile.color, mode: profile.mode }, peerId);
    if (lastState) {
      sendState(lastState, peerId);
    }
  });
  onRoom('onPeerLeave', (peerId) => {
    known.delete(peerId);
    handlers.leave(peerId);
  });
  onHello((data, peerId) => {
    const info = { name: safeName(data && data.name), color: safeColor(data && data.color), mode: data && data.mode === 'visit' ? 'visit' : 'home' };
    if (!known.has(peerId)) {
      known.add(peerId);
      handlers.join(peerId, info);
    }
  });
  onState((data, peerId) => {
    if (!known.has(peerId) || !data) {
      return;
    }
    const clamp = (n) => Math.max(-30, Math.min(30, Number(n) || 0));
    handlers.state(peerId, { x: clamp(data.x), z: clamp(data.z), f: Number(data.f) || 0, s: data.s ? 1 : 0 });
  });
  onAct((data, peerId) => {
    if (known.has(peerId) && data && typeof data.spot === 'string' && data.spot.length < 40) {
      handlers.act(peerId, data.spot);
    }
  });
  onEmote((data, peerId) => {
    const allowed = ['🙏', '🕊️', '🤍', '🙂'];
    if (known.has(peerId) && data && allowed.includes(data.e)) {
      handlers.emote(peerId, data.e);
    }
  });

  return {
    selfId,
    sendState(state) {
      const changed = !lastState || lastState.x !== state.x || lastState.z !== state.z || lastState.s !== state.s;
      lastState = state;
      if (changed) {
        sendState(state);
      }
    },
    sendAct(spotId) {
      sendAct({ spot: spotId });
    },
    sendEmote(emoji) {
      sendEmote({ e: emoji });
    },
    peerCount: () => known.size,
    leave() {
      room.leave();
    },
  };
}
