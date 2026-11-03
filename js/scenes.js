// Layered SVG scenes for each space. Abstract architecture only, no figurative depiction of the divine.

const SKIES = {
  dawn: ['#2b2340', '#c27a5a', '#f2c48d'],
  day: ['#5d8fc4', '#9cc3e4', '#e9f1f5'],
  dusk: ['#2a2145', '#9c4f5b', '#f0a35e'],
  night: ['#05070f', '#111a33', '#233056'],
};

function stars(count = 40) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (i * 97) % 400;
    const y = (i * 53) % 120;
    const r = (i % 3) * 0.3 + 0.4;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.4 + (i % 5) * 0.12}" class="twinkle" style="animation-delay:${(i % 7) * 0.6}s"/>`;
  }
  return out;
}

function sunOrMoon(time) {
  if (time === 'night') {
    return '<circle cx="330" cy="50" r="16" fill="#f4efd8" opacity="0.95"/><circle cx="337" cy="45" r="14" fill="#111a33"/>';
  }
  if (time === 'day') {
    return '<circle cx="320" cy="48" r="20" fill="#fff6d6" opacity="0.9"/>';
  }
  return '<circle cx="80" cy="150" r="26" fill="#ffd08a" opacity="0.85"/>';
}

const LIGHT = '#ffcf7a';

const BUILDINGS = {
  klenteng: (dark) => `
    <g>
      <rect x="118" y="140" width="164" height="62" fill="${dark}"/>
      <path d="M96 142 Q200 122 304 142 L318 132 Q306 136 298 132 Q200 108 102 132 Q94 136 82 132 Z" fill="${dark}"/>
      <rect x="150" y="112" width="100" height="22" fill="${dark}"/>
      <path d="M136 114 Q200 98 264 114 L276 106 Q266 108 258 104 Q200 88 142 104 Q134 108 124 106 Z" fill="${dark}"/>
      <circle cx="200" cy="96" r="5" fill="#d4a63a"/>
      <path d="M182 202 L182 166 Q200 152 218 166 L218 202 Z" fill="${LIGHT}" opacity="0.85"/>
      <rect x="138" y="168" width="22" height="18" fill="${LIGHT}" opacity="0.55"/>
      <rect x="240" y="168" width="22" height="18" fill="${LIGHT}" opacity="0.55"/>
      <g class="sway">
        <line x1="128" y1="142" x2="128" y2="154" stroke="#3a1a10"/>
        <ellipse cx="128" cy="160" rx="7" ry="8" fill="#d72b2b"/>
        <line x1="272" y1="142" x2="272" y2="154" stroke="#3a1a10"/>
        <ellipse cx="272" cy="160" rx="7" ry="8" fill="#d72b2b"/>
      </g>
      <rect x="60" y="176" width="22" height="26" fill="${dark}"/>
      <path d="M54 178 L71 166 L88 178 Z" fill="${dark}"/>
      <circle cx="71" cy="186" r="4" fill="#ff8a3d" class="flicker"/>
    </g>`,
  vihara: (dark) => `
    <g>
      <rect x="130" y="176" width="140" height="26" fill="${dark}"/>
      <rect x="150" y="162" width="100" height="16" fill="${dark}"/>
      <path d="M160 164 Q160 112 200 108 Q240 112 240 164 Z" fill="${dark}"/>
      <rect x="190" y="96" width="20" height="14" fill="${dark}"/>
      <path d="M194 98 L200 52 L206 98 Z" fill="${dark}"/>
      <circle cx="200" cy="50" r="3" fill="#e9b949"/>
      <path d="M186 202 L186 182 Q200 172 214 182 L214 202 Z" fill="${LIGHT}" opacity="0.8"/>
      <rect x="60" y="150" width="30" height="52" fill="${dark}"/>
      <path d="M52 152 L75 136 L98 152 Z M56 140 L75 126 L94 140 Z" fill="${dark}"/>
      <rect x="310" y="150" width="30" height="52" fill="${dark}"/>
      <path d="M302 152 L325 136 L348 152 Z M306 140 L325 126 L344 140 Z" fill="${dark}"/>
    </g>`,
  pura: (dark) => `
    <g>
      <path d="M120 202 L120 120 L130 120 L130 104 L140 104 L140 90 L150 90 L150 76 L172 76 L172 202 Z" fill="${dark}"/>
      <path d="M280 202 L280 120 L270 120 L270 104 L260 104 L260 90 L250 90 L250 76 L228 76 L228 202 Z" fill="${dark}"/>
      <rect x="172" y="196" width="56" height="6" fill="${dark}"/>
      <g opacity="0.85">
        <rect x="318" y="150" width="14" height="52" fill="${dark}"/>
        <path d="M300 152 L350 152 L340 142 L310 142 Z M304 140 L346 140 L337 131 L313 131 Z M308 129 L342 129 L334 121 L316 121 Z M312 119 L338 119 L331 112 L319 112 Z" fill="${dark}"/>
      </g>
      <path d="M60 202 Q58 120 90 90" stroke="${dark}" stroke-width="3" fill="none"/>
      <path d="M90 90 Q96 100 92 112" stroke="#e8c15a" stroke-width="2" fill="none" class="sway"/>
      <circle cx="200" cy="188" r="3" fill="#ff8a3d" class="flicker"/>
    </g>`,
  masjid: (dark) => `
    <g>
      <rect x="130" y="150" width="140" height="52" fill="${dark}"/>
      <path d="M150 152 Q150 96 200 92 Q250 96 250 152 Z" fill="${dark}"/>
      <rect x="198" y="74" width="4" height="20" fill="${dark}"/>
      <path d="M205 66 A8 8 0 1 0 205 80 A6 6 0 1 1 205 66 Z" fill="#e2c46a"/>
      <rect x="290" y="80" width="14" height="122" fill="${dark}"/>
      <path d="M287 82 Q297 58 307 82 Z" fill="${dark}"/>
      <rect x="286" y="110" width="22" height="4" fill="${dark}"/>
      <rect x="96" y="100" width="14" height="102" fill="${dark}"/>
      <path d="M93 102 Q103 80 113 102 Z" fill="${dark}"/>
      <g fill="${LIGHT}" opacity="0.75">
        <path d="M156 202 L156 174 Q164 164 172 174 L172 202 Z"/>
        <path d="M190 202 L190 170 Q200 158 210 170 L210 202 Z"/>
        <path d="M228 202 L228 174 Q236 164 244 174 L244 202 Z"/>
      </g>
    </g>`,
  gereja: (dark) => `
    <g>
      <rect x="150" y="140" width="120" height="62" fill="${dark}"/>
      <path d="M144 142 L210 104 L276 142 Z" fill="${dark}"/>
      <rect x="110" y="110" width="40" height="92" fill="${dark}"/>
      <path d="M106 112 L130 64 L154 112 Z" fill="${dark}"/>
      <rect x="128" y="40" width="4" height="26" fill="${dark}"/>
      <rect x="121" y="48" width="18" height="4" fill="${dark}"/>
      <path d="M196 202 L196 172 Q210 160 224 172 L224 202 Z" fill="${LIGHT}" opacity="0.85"/>
      <rect x="122" y="130" width="16" height="22" rx="8" fill="${LIGHT}" opacity="0.6"/>
      <rect x="240" y="160" width="14" height="20" rx="7" fill="${LIGHT}" opacity="0.5"/>
    </g>`,
  katedral: (dark) => `
    <g>
      <rect x="140" y="130" width="120" height="72" fill="${dark}"/>
      <rect x="112" y="96" width="34" height="106" fill="${dark}"/>
      <path d="M108 98 L129 44 L150 98 Z" fill="${dark}"/>
      <rect x="254" y="96" width="34" height="106" fill="${dark}"/>
      <path d="M250 98 L271 44 L292 98 Z" fill="${dark}"/>
      <path d="M140 132 L200 100 L260 132 Z" fill="${dark}"/>
      <circle cx="200" cy="140" r="12" fill="${LIGHT}" opacity="0.7"/>
      <path d="M190 202 L190 170 Q200 158 210 170 L210 202 Z" fill="${LIGHT}" opacity="0.85"/>
      <path d="M318 202 Q318 160 342 156 Q366 160 366 202 Z" fill="${dark}"/>
      <path d="M330 202 Q330 176 342 172 Q354 176 354 202 Z" fill="#000" opacity="0.5"/>
      <circle cx="336" cy="196" r="2" fill="#ffb347" class="flicker"/>
      <circle cx="342" cy="194" r="2" fill="#ffb347" class="flicker" style="animation-delay:.4s"/>
      <circle cx="348" cy="196" r="2" fill="#ffb347" class="flicker" style="animation-delay:.8s"/>
    </g>`,
  alam: (dark) => `
    <g>
      <path d="M0 170 Q80 120 160 160 T400 150 L400 202 L0 202 Z" fill="${dark}" opacity="0.7"/>
      <path d="M0 186 Q120 150 230 182 T400 176 L400 202 L0 202 Z" fill="${dark}"/>
      <g fill="${dark}">
        <path d="M70 186 L82 150 L94 186 Z"/>
        <path d="M86 186 L100 140 L114 186 Z"/>
        <path d="M300 182 L314 138 L328 182 Z"/>
        <path d="M320 182 L332 152 L344 182 Z"/>
      </g>
    </g>`,
};

export function sceneSvg(sceneId, time = 'night', label = '') {
  const [top, middle, bottom] = SKIES[time] || SKIES.night;
  const dark = time === 'day' ? '#2d2a33' : '#0d0b10';
  const building = (BUILDINGS[sceneId] || BUILDINGS.alam)(dark);
  return `
  <svg class="scene" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="sky-${sceneId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${top}"/>
        <stop offset="0.6" stop-color="${middle}"/>
        <stop offset="1" stop-color="${bottom}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="240" fill="url(#sky-${sceneId})"/>
    ${time === 'night' ? stars() : ''}
    ${sunOrMoon(time)}
    ${building}
    <rect y="200" width="400" height="40" fill="${dark}"/>
    <g class="mist"><ellipse cx="200" cy="206" rx="240" ry="10" fill="#fff" opacity="0.05"/></g>
  </svg>`;
}
