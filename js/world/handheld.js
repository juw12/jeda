// First-person devotional objects held in your own hands: mala, japamala, tasbih, rosario, Alkitab, hio.
// Each object lives in its own little scene drawn on top of the world, so walls never cut through it.
// Bead strands move under the thumb one item at a time; the book turns pages; the hio is raised in three bows.

import * as THREE from '../../vendor/three.module.min.js';

const SKIN = '#f1d9bf';

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    emissive: new THREE.Color(color).multiplyScalar(0.12),
    ...extra,
  });
}

// ---------- Definitions per sacred space (home mode) ----------
// Texts follow the app's existing (draft, to-be-reviewed) Pustaka content.

const ROSARY_MYSTERIES = {
  gembira: ['Maria menerima kabar gembira dari Malaikat Gabriel', 'Maria mengunjungi Elisabet', 'Yesus dilahirkan di Betlehem', 'Yesus dipersembahkan di Bait Allah', 'Yesus diketemukan dalam Bait Allah'],
  terang: ['Yesus dibaptis di Sungai Yordan', 'Yesus menyatakan diri-Nya dalam pesta perkawinan di Kana', 'Yesus memberitakan Kerajaan Allah dan menyerukan pertobatan', 'Yesus menampakkan kemuliaan-Nya', 'Yesus menetapkan Ekaristi'],
  sedih: ['Yesus berdoa kepada Bapa-Nya di Taman Getsemani', 'Yesus didera', 'Yesus dimahkotai duri', 'Yesus memanggul salib-Nya ke Gunung Kalvari', 'Yesus wafat di salib'],
  mulia: ['Yesus bangkit dari antara orang mati', 'Yesus naik ke surga', 'Roh Kudus turun atas para rasul', 'Maria diangkat ke surga', 'Maria dimahkotai di surga'],
};
const MYSTERY_NAMES = { gembira: 'Peristiwa Gembira', terang: 'Peristiwa Terang', sedih: 'Peristiwa Sedih', mulia: 'Peristiwa Mulia' };
// Sunday..Saturday
const ROSARY_BY_WEEKDAY = ['mulia', 'gembira', 'sedih', 'mulia', 'terang', 'sedih', 'gembira'];

function malaStrand(count, beadColor, guruColor) {
  const strand = [{ type: 'guru', color: guruColor }];
  for (let i = 0; i < count; i++) {
    strand.push({ type: 'small', color: beadColor });
  }
  return strand;
}

// Steps for a strand that is turned back at the guru/meru bead after every round.
function reversingSteps(count, label, rounds = 9) {
  const steps = [];
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < count; i++) {
      const bead = round % 2 === 0 ? 1 + i : count - i;
      steps.push({ item: bead, label, round, n: i + 1, total: count });
    }
  }
  return steps;
}

function tasbihDef() {
  const strand = [{ type: 'imam', color: '#2f5d50' }];
  for (let i = 0; i < 33; i++) {
    strand.push({ type: 'small', color: '#3f7a68' });
  }
  const phases = [
    { label: 'Subhanallah', script: 'سُبْحَانَ اللّٰهِ' },
    { label: 'Alhamdulillah', script: 'اَلْحَمْدُ لِلّٰهِ' },
    { label: 'Allahu Akbar', script: 'اَللّٰهُ أَكْبَرُ' },
  ];
  const steps = [];
  phases.forEach((phase, round) => {
    for (let i = 0; i < 33; i++) {
      steps.push({ item: 1 + i, lap: round, label: phase.label, script: phase.script, n: i + 1, total: 33 });
    }
  });
  steps.push({ item: 0, lap: 3, label: 'Tahlil', script: 'لَا إِلٰهَ إِلَّا اللّٰهُ', n: 100, total: 100, note: 'Disempurnakan menjadi seratus. Lanjutkan doa sesuai tuntunan yang kamu ikuti.' });
  return {
    id: 'tasbih', name: 'Tasbih', icon: '📿', kind: 'beads', strand, steps, closed: true,
    spacing: { small: 0.042, imam: 0.075 }, beadRadius: { small: 0.017, imam: 0.02 },
    sounds: { step: 'bead', lapEnd: 'chime', end: 'chime' },
    murmur: true, chant: null,
    intro: 'Ketuk atau usap ke bawah untuk menggeser satu butir. 33 × 3, lalu tahlil.',
    about: 'Tasbih dipakai umat Islam untuk menghitung zikir: Subhanallah, Alhamdulillah, Allahu Akbar masing-masing 33 kali.',
    entry: 'isl-ibadah-dzikir',
  };
}

function rosaryDef() {
  const key = ROSARY_BY_WEEKDAY[new Date().getDay()];
  const mysteries = ROSARY_MYSTERIES[key];
  const setName = MYSTERY_NAMES[key];
  const strand = [];
  const steps = [];
  const add = (type, step) => {
    strand.push({ type, color: type === 'crucifix' || type === 'medal' ? '#c9b27a' : '#7d3b4a' });
    if (step) {
      steps.push({ item: strand.length - 1, ...step });
    }
  };
  add('crucifix', { label: 'Tanda Salib & Aku Percaya' });
  add('large', { label: 'Bapa Kami' });
  ['iman', 'harapan', 'kasih'].forEach((virtue, index) => add('small', { label: `Salam Maria (${virtue})`, n: index + 1, total: 3 }));
  add('gap', { label: 'Kemuliaan' });
  mysteries.forEach((mystery, decade) => {
    const context = `${setName} ${decade + 1}: ${mystery}`;
    add('large', { label: 'Bapa Kami', context });
    if (decade === 0) {
      add('medal', null);
    }
    for (let i = 0; i < 10; i++) {
      add('small', { label: 'Salam Maria', context, n: i + 1, total: 10 });
    }
    add('gap', { label: 'Kemuliaan', context });
  });
  add('medal', { label: 'Salam, ya Ratu' });
  return {
    id: 'rosario', name: 'Rosario', icon: '📿', kind: 'beads', strand, steps, closed: false,
    spacing: { small: 0.034, large: 0.05, gap: 0.045, crucifix: 0.1, medal: 0.065 },
    beadRadius: { small: 0.0125, large: 0.017 },
    sounds: { step: 'bead', lapEnd: 'chime', end: 'bell' },
    murmur: true, chant: null,
    intro: `Hari ini ${setName}. Ketuk atau usap ke bawah untuk butir berikutnya.`,
    about: 'Rosario dipakai umat Katolik untuk merenungkan peristiwa hidup Yesus bersama Maria: Bapa Kami, sepuluh Salam Maria, dan Kemuliaan pada tiap peristiwa.',
    entry: 'kat-ibadah-rosario',
  };
}

export function heldItemFor(sceneId) {
  switch (sceneId) {
    case 'vihara':
      return {
        id: 'mala', name: 'Mala 108', icon: '📿', kind: 'beads',
        strand: malaStrand(108, '#8a5a3b', '#c58b4b'),
        steps: reversingSteps(108, 'Butir mala'),
        closed: true, turnBack: true,
        spacing: { small: 0.03, guru: 0.06 }, beadRadius: { small: 0.0125, guru: 0.019 },
        sounds: { step: 'woodblock', lapEnd: 'bell', end: 'bell' },
        murmur: true, chant: 'hum',
        intro: 'Ketuk atau usap ke bawah untuk menggeser satu butir sambil melafalkan paritta, mantra, atau perenungan pilihanmu.',
        turnNote: 'Satu putaran 108. Banyak tradisi tidak melangkahi butir induk; mala dibalik untuk putaran berikutnya.',
        about: 'Mala 108 butir dipakai umat Buddha untuk menghitung lafal atau perenungan.',
        entry: 'bud-ibadah-meditasi',
      };
    case 'pura':
      return {
        id: 'japamala', name: 'Japamala', icon: '📿', kind: 'beads',
        strand: malaStrand(108, '#6b3f2a', '#b5813f'),
        steps: reversingSteps(108, 'Japa'),
        closed: true, turnBack: true,
        spacing: { small: 0.03, guru: 0.065 }, beadRadius: { small: 0.0135, guru: 0.02 },
        rough: true,
        sounds: { step: 'bead', lapEnd: 'bell', end: 'bell' },
        murmur: true, chant: 'om',
        intro: 'Ketuk atau usap ke bawah untuk menggeser satu butir sambil mengucapkan mantra pilihanmu (mis. Om Namah Siwaya).',
        turnNote: 'Satu putaran 108. Meru (butir induk) tidak dilangkahi; japamala dibalik untuk putaran berikutnya.',
        about: 'Japamala (sering dari biji genitri) dipakai umat Hindu untuk japa, pengulangan nama suci dan mantra.',
        entry: 'hin-ibadah-trisandhya',
      };
    case 'masjid':
      return tasbihDef();
    case 'katedral':
      return rosaryDef();
    case 'gereja':
      return {
        id: 'alkitab', name: 'Alkitab', icon: '📖', kind: 'book',
        pages: [
          { title: 'Injil Markus', text: 'Injil yang paling pendek. Mulailah mengenal kehidupan dan ajaran Yesus.' },
          { title: 'Injil Yohanes', text: 'Renungkan siapa Yesus menurut kesaksian Yohanes.' },
          { title: 'Kisah Para Rasul', text: 'Kisah gereja mula-mula sesudah Pentakosta.' },
          { title: 'Mazmur', text: 'Bahasa doa untuk suka dan duka sehari-hari.' },
          { title: 'Amsal', text: 'Hikmat dan nasihat praktis untuk hidup.' },
        ],
        sounds: { step: 'page' },
        murmur: false, chant: null,
        intro: 'Usap atau ketuk untuk membalik halaman. Bacalah perlahan di Alkitabmu sendiri.',
        about: 'Alkitab adalah pusat ibadah dan hidup umat Protestan.',
        entry: 'pro-kitab-cara-membaca',
        link: { label: 'Buka Alkitab SABDA', url: 'https://alkitab.sabda.org/' },
      };
    case 'klenteng':
      return {
        id: 'hio', name: 'Hio', icon: '🙏', kind: 'incense', bows: 3,
        sounds: { step: 'none', end: 'bell' },
        murmur: false, chant: null,
        intro: 'Pegang hio dengan kedua tangan. Hening, sampaikan doa dalam hati, lalu ketuk untuk soja/pai (membungkuk) tiga kali.',
        about: 'Hio adalah sarana penghormatan dan pengantar doa di klenteng. Jumlah dan urutan hiolo berbeda di tiap klenteng; ikuti petunjuk pengurus.',
        entry: 'khc-ibadah-hio',
        finishSpot: 'hiolo',
      };
    default:
      return null;
  }
}

// ---------- Hands ----------
function makeHand(side = 1) {
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.05, 4, 10), material(SKIN, { roughness: 0.7 }));
  palm.rotation.z = Math.PI / 2;
  palm.scale.set(1, 1, 0.75);
  hand.add(palm);
  const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.06, 4, 8), material(SKIN, { roughness: 0.7 }));
  fingers.rotation.z = Math.PI / 2;
  fingers.position.set(0, -0.03, -0.012);
  hand.add(fingers);
  const thumbPivot = new THREE.Group();
  thumbPivot.position.set(-0.035 * side, 0.02, 0.01);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.04, 4, 8), material(SKIN, { roughness: 0.7 }));
  thumb.position.set(0.012 * side, 0.026, 0);
  thumb.rotation.z = -0.5 * side;
  thumbPivot.add(thumb);
  hand.add(thumbPivot);
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.12, 10), material(SKIN, { roughness: 0.7 }));
  wrist.position.set(0.02 * side, -0.02, 0.07);
  wrist.rotation.x = Math.PI / 2.4;
  hand.add(wrist);
  return { group: hand, thumb: thumbPivot };
}

// ---------- Bead strands ----------
function beadMesh(item, def) {
  const radius = (def.beadRadius && def.beadRadius[item.type]) || 0.013;
  switch (item.type) {
    case 'guru': {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material(item.color, { roughness: 0.35 })));
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.045, 10), material('#b23a2a', { roughness: 0.9 }));
      tassel.position.set(0, -radius - 0.026, 0);
      group.add(tassel);
      group.userData.outward = tassel;
      return group;
    }
    case 'imam': {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 10), material(item.color, { roughness: 0.35 }));
      body.position.y = -0.008;
      group.add(body);
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.04, 8), material('#d7b35a', { roughness: 0.9 }));
      tassel.position.set(0, -0.04, 0);
      group.add(tassel);
      return group;
    }
    case 'crucifix': {
      const group = new THREE.Group();
      const metal = material(item.color, { metalness: 0.6, roughness: 0.3 });
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.06, 0.006), metal);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.009, 0.006), metal);
      arm.position.y = 0.012;
      group.add(upright, arm);
      return group;
    }
    case 'medal': {
      const medal = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 16), material(item.color, { metalness: 0.6, roughness: 0.3 }));
      medal.rotation.x = Math.PI / 2;
      return medal;
    }
    case 'gap': {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 6, 12), material('#c9b27a', { metalness: 0.6, roughness: 0.3 }));
      return link;
    }
    default: {
      const geometry = def.rough
        ? new THREE.IcosahedronGeometry(radius, 1)
        : new THREE.SphereGeometry(radius, 12, 10);
      return new THREE.Mesh(geometry, material(item.color, { roughness: def.rough ? 0.85 : 0.4 }));
    }
  }
}

function createStrand(def) {
  const group = new THREE.Group();
  const loop = new THREE.Group();
  group.add(loop);
  // Arc position of every item along the cord.
  const arcs = [];
  let length = 0;
  def.strand.forEach((item, index) => {
    const spacing = def.spacing[item.type] || def.spacing.small;
    if (index > 0) {
      length += spacing / 2;
    }
    arcs.push(length);
    length += spacing / 2;
  });
  length += (def.spacing[def.strand[0].type] || def.spacing.small) / 2;

  // The strand hangs from the thumb as a long, narrow loop (like a mala held up in one hand):
  // beads still to come descend on the right, counted beads fall away on the left.
  const halfWidth = 0.062;
  const perimeter = (a, b) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  let low = halfWidth;
  let high = length;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (perimeter(halfWidth, mid) < length) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const halfHeight = low;
  const SAMPLES = 900;
  const table = [];
  let travelled = 0;
  let previous = { x: 0, y: 0 };
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    const point = { x: Math.sin(t) * halfWidth, y: Math.cos(t) * halfHeight - halfHeight };
    if (i > 0) {
      travelled += Math.hypot(point.x - previous.x, point.y - previous.y);
    }
    table.push({ s: travelled, x: point.x, y: point.y });
    previous = point;
  }
  const scale = length / travelled;
  table.forEach((entry) => {
    entry.s *= scale;
  });
  const pointAt = (along) => {
    const s = ((along % length) + length) % length;
    let lowIndex = 0;
    let highIndex = table.length - 1;
    while (highIndex - lowIndex > 1) {
      const mid = (lowIndex + highIndex) >> 1;
      if (table[mid].s < s) {
        lowIndex = mid;
      } else {
        highIndex = mid;
      }
    }
    const a = table[lowIndex];
    const b = table[highIndex];
    const k = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x) };
  };
  // Lean the loop back a little so its lower part drops toward the lap.
  loop.rotation.x = 0.35;
  const meshes = def.strand.map((item) => {
    const mesh = beadMesh(item, def);
    loop.add(mesh);
    return mesh;
  });
  const cordPoints = table.filter((entry, index) => index % 6 === 0).map((entry) => new THREE.Vector3(entry.x, entry.y, 0));
  const cord = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPoints, true), 220, 0.0018, 5, true),
    material(def.id === 'tasbih' ? '#d7b35a' : '#5a2a1e', { roughness: 0.9 }),
  );
  loop.add(cord);

  // Right hand pinching the strand at the top: thumb over the current bead.
  const right = makeHand(1);
  right.group.scale.setScalar(0.62);
  right.group.position.set(0.03, -0.004, 0.018);
  right.group.rotation.set(0.15, -0.5, -0.9);
  group.add(right.group);

  let offset = arcs[def.steps[0].item];
  let goal = offset;
  let thumbKick = 0;
  let highlighted = -1;
  const place = () => {
    meshes.forEach((mesh, index) => {
      let along = arcs[index] - offset;
      if (def.closed) {
        along = ((along % length) + length * 1.5) % length - length / 2;
      }
      const point = pointAt(along);
      mesh.position.set(point.x, point.y, 0);
      // Chain links follow the cord; tassels, crucifix and medal hang upright under gravity.
      mesh.rotation.z = def.strand[index].type === 'gap' ? point.angle : 0;
      mesh.visible = def.closed || Math.abs(along) < length * 0.42;
    });
  };
  place();

  function setHighlight(index) {
    if (highlighted === index) {
      return;
    }
    const glow = (mesh, on) => mesh.traverse((child) => {
      if (child.material && child.material.emissive) {
        child.material.emissive.copy(new THREE.Color(child.material.color).multiplyScalar(on ? 0.6 : 0.12));
      }
    });
    if (highlighted >= 0) {
      glow(meshes[highlighted], false);
    }
    highlighted = index;
    if (index >= 0) {
      glow(meshes[index], true);
    }
  }

  return {
    group,
    // Move so that strand item `index` sits under the thumb (laps = whole turns already completed).
    moveTo(index, laps = 0) {
      goal = arcs[index] + laps * length;
      thumbKick = 1;
      setHighlight(index);
    },
    update(delta) {
      offset += (goal - offset) * Math.min(1, delta * 14);
      if (Math.abs(goal - offset) < 0.0002) {
        offset = goal;
      }
      thumbKick = Math.max(0, thumbKick - delta * 5);
      right.thumb.rotation.x = -Math.sin(thumbKick * Math.PI) * 0.5;
      place();
    },
    // Forget completed laps so a restart moves forward a little instead of spinning backwards.
    rebase() {
      if (def.closed) {
        const laps = Math.floor(offset / length);
        offset -= laps * length;
        goal -= laps * length;
      }
    },
    debug: () => ({ offset, goal, highlighted }),
  };
}

// ---------- Alkitab ----------
function pageTexture(title, text, side) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f7f0df';
  context.fillRect(0, 0, 256, 340);
  context.fillStyle = '#8a1f1f';
  context.font = 'bold 22px Georgia, serif';
  context.textAlign = 'center';
  if (side === 'left') {
    context.fillText(title, 128, 48);
    context.fillStyle = 'rgba(60,50,40,0.25)';
    for (let line = 0; line < 12; line++) {
      const width = line % 4 === 3 ? 120 : 190;
      context.fillRect(33, 80 + line * 20, width, 5);
    }
  } else {
    context.fillStyle = '#3a2e24';
    context.font = '17px Georgia, serif';
    const words = text.split(' ');
    let row = '';
    let y = 70;
    words.forEach((word) => {
      const test = row ? `${row} ${word}` : word;
      if (context.measureText(test).width > 200) {
        context.fillText(row, 128, y);
        row = word;
        y += 26;
      } else {
        row = test;
      }
    });
    if (row) {
      context.fillText(row, 128, y);
    }
    context.fillStyle = 'rgba(60,50,40,0.25)';
    for (let line = 0; line < 6; line++) {
      context.fillRect(33, y + 40 + line * 20, 190, 5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBook(def) {
  const group = new THREE.Group();
  const book = new THREE.Group();
  book.rotation.x = -0.62;
  group.add(book);
  const width = 0.13;
  const height = 0.17;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(width * 2 + 0.012, height + 0.012, 0.008), material('#3b1f1a', { roughness: 0.8 }));
  cover.position.z = -0.008;
  book.add(cover);
  const pageMaterial = (texture) => new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, side: THREE.DoubleSide, emissive: new THREE.Color('#2a2418'), emissiveIntensity: 0.4 });
  const leftPage = new THREE.Mesh(new THREE.PlaneGeometry(width, height), pageMaterial(null));
  leftPage.position.set(-width / 2, 0, 0.001);
  leftPage.rotation.y = 0.08;
  const rightPage = new THREE.Mesh(new THREE.PlaneGeometry(width, height), pageMaterial(null));
  rightPage.position.set(width / 2, 0, 0.001);
  rightPage.rotation.y = -0.08;
  book.add(leftPage, rightPage);
  // The turning leaf rotates around the spine.
  const spine = new THREE.Group();
  spine.position.z = 0.003;
  book.add(spine);
  const leafGeometry = new THREE.PlaneGeometry(width, height);
  leafGeometry.translate(width / 2, 0, 0);
  const leaf = new THREE.Mesh(leafGeometry, pageMaterial(null));
  leaf.visible = false;
  spine.add(leaf);
  const left = makeHand(-1);
  left.group.position.set(-0.15, -0.07, 0.03);
  left.group.rotation.set(0.6, 0.4, 1.2);
  const right = makeHand(1);
  right.group.position.set(0.15, -0.07, 0.03);
  right.group.rotation.set(0.6, -0.4, -1.2);
  group.add(left.group, right.group);

  const textures = def.pages.map((page) => ({ left: pageTexture(page.title, page.text, 'left'), right: pageTexture(page.title, page.text, 'right') }));
  let pageIndex = 0;
  let turning = 0;
  const show = (index) => {
    leftPage.material.map = textures[index].left;
    rightPage.material.map = textures[index].right;
    leftPage.material.needsUpdate = true;
    rightPage.material.needsUpdate = true;
  };
  show(0);
  return {
    group,
    turn() {
      const next = (pageIndex + 1) % def.pages.length;
      leaf.material.map = textures[pageIndex].right;
      leaf.material.needsUpdate = true;
      rightPage.material.map = textures[next].right;
      rightPage.material.needsUpdate = true;
      leaf.visible = true;
      turning = 1;
      pageIndex = next;
      return next;
    },
    update(delta) {
      if (turning > 0) {
        turning = Math.max(0, turning - delta * 2.2);
        spine.rotation.y = -(1 - turning) * Math.PI;
        if (turning < 0.5 && leaf.material.map !== textures[pageIndex].left) {
          leaf.material.map = textures[pageIndex].left;
          leaf.material.needsUpdate = true;
        }
        if (turning === 0) {
          leaf.visible = false;
          spine.rotation.y = 0;
          show(pageIndex);
        }
      }
    },
    page: () => pageIndex,
    dispose() {
      textures.forEach((pair) => {
        pair.left.dispose();
        pair.right.dispose();
      });
    },
  };
}

// ---------- Hio ----------
function createIncense() {
  const group = new THREE.Group();
  const hands = new THREE.Group();
  group.add(hands);
  const left = makeHand(-1);
  left.group.position.set(-0.022, -0.02, 0);
  left.group.rotation.set(0.1, 0.9, 1.5);
  const right = makeHand(1);
  right.group.position.set(0.022, -0.02, 0);
  right.group.rotation.set(0.1, -0.9, -1.5);
  hands.add(left.group, right.group);
  const tips = [];
  [-0.018, 0, 0.018].forEach((x, index) => {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.24, 6), material('#b0322a', { roughness: 0.8 }));
    stick.position.set(x, 0.1, -0.004 * index);
    stick.rotation.z = -x * 2.2;
    hands.add(stick);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff7a2e' }));
    tip.position.set(x - Math.sin(x * 2.2) * 0.12, 0.22, -0.004 * index);
    hands.add(tip);
    tips.push(tip);
  });
  // A few soft smoke puffs rising from the tips.
  const puffMaterial = new THREE.MeshBasicMaterial({ color: '#e8e2d8', transparent: true, opacity: 0.25, depthWrite: false });
  const puffs = [];
  for (let i = 0; i < 18; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), puffMaterial.clone());
    puff.userData = { life: Math.random(), tip: i % 3 };
    hands.add(puff);
    puffs.push(puff);
  }
  let bow = 0;
  return {
    group,
    bow() {
      bow = 1;
    },
    bowing: () => bow > 0,
    update(delta, elapsed) {
      if (bow > 0) {
        bow = Math.max(0, bow - delta / 1.6);
      }
      // Raise to the forehead, then lower while bowing.
      const phase = 1 - bow;
      const lift = bow > 0 ? Math.sin(phase * Math.PI) : 0;
      hands.position.y = lift * 0.06;
      hands.rotation.x = -lift * 0.25;
      tips.forEach((tip, index) => {
        tip.material.color.setHSL(0.06, 1, 0.55 + Math.sin(elapsed * 6 + index) * 0.08);
      });
      puffs.forEach((puff) => {
        puff.userData.life += delta * 0.35;
        if (puff.userData.life > 1) {
          puff.userData.life -= 1;
        }
        const tip = tips[puff.userData.tip];
        const life = puff.userData.life;
        puff.position.set(tip.position.x + Math.sin(life * 9 + puff.userData.tip) * 0.01 * life, tip.position.y + life * 0.12, tip.position.z);
        puff.scale.setScalar(1 + life * 3);
        puff.material.opacity = 0.28 * (1 - life);
      });
    },
    lift: () => (bow > 0 ? Math.sin((1 - bow) * Math.PI) : 0),
  };
}

// ---------- Public: create the held object and its little scene ----------
export function createHeld(def, { observe = false } = {}) {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight('#fff4e0', '#5a4a3a', 1.3);
  const key = new THREE.DirectionalLight('#fff1dc', 1.6);
  key.position.set(0.4, 1, 0.6);
  scene.add(hemi, key);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
  const holder = new THREE.Group();
  holder.position.set(0.01, -0.02, -0.42);
  scene.add(holder);

  let strand = null;
  let book = null;
  let incense = null;
  if (def.kind === 'beads') {
    strand = createStrand(def);
    holder.add(strand.group);
    strand.moveTo(def.steps[0].item);
  } else if (def.kind === 'book') {
    book = createBook(def);
    holder.add(book.group);
    holder.position.set(0, -0.11, -0.42);
  } else if (def.kind === 'incense') {
    incense = createIncense();
    holder.add(incense.group);
    holder.position.set(0, -0.16, -0.4);
  }

  let stepIndex = -1;
  let bows = 0;
  let done = false;
  let inspectYaw = 0;

  function describe() {
    const base = {
      name: def.name, icon: def.icon, kind: def.kind, observe, intro: def.intro, about: def.about,
      entry: def.entry, link: def.link || null, hasVoice: Boolean(def.murmur || def.chant),
    };
    if (observe) {
      return { ...base, label: def.name, count: null, note: def.about };
    }
    if (strand) {
      const step = def.steps[Math.max(0, stepIndex)];
      const round = step.round || 0;
      return {
        ...base,
        label: stepIndex < 0 ? 'Siap' : step.label,
        script: stepIndex < 0 ? '' : step.script || '',
        context: stepIndex < 0 ? '' : step.context || '',
        count: stepIndex < 0 ? 0 : step.n || stepIndex + 1,
        total: step.total || def.steps.length,
        round: def.turnBack ? round + 1 : null,
        progress: stepIndex + 1,
        note: step.note || (def.turnNote && stepIndex >= 0 && (step.n === step.total || (step.n === 1 && round > 0)) ? def.turnNote : ''),
        done,
      };
    }
    if (book) {
      const page = def.pages[book.page()];
      return { ...base, label: page.title, context: page.text, count: book.page() + 1, total: def.pages.length, note: '' };
    }
    return {
      ...base,
      label: bows === 0 ? 'Hening sejenak' : bows < def.bows ? `Soja/pai ${bows}` : 'Selesai bersoja',
      count: bows,
      total: def.bows,
      note: bows >= def.bows ? 'Tancapkan hio di hiolo dengan kedua tangan.' : '',
      done: bows >= def.bows,
      finishSpot: def.finishSpot,
    };
  }

  // Advance one bead / page / bow. Returns the sound to play.
  function step() {
    if (observe) {
      return null;
    }
    if (strand) {
      if (done) {
        stepIndex = -1;
        done = false;
        strand.rebase();
      }
      stepIndex += 1;
      if (stepIndex >= def.steps.length) {
        stepIndex = def.steps.length - 1;
        done = true;
        return def.sounds.end;
      }
      const step = def.steps[stepIndex];
      strand.moveTo(step.item, step.lap || 0);
      const isLast = stepIndex === def.steps.length - 1;
      const next = def.steps[stepIndex + 1];
      if (isLast && !def.turnBack) {
        done = true;
        return def.sounds.end || def.sounds.step;
      }
      if (next && (next.round !== step.round || next.lap !== step.lap || next.label !== step.label)
        && (def.turnBack || def.id === 'tasbih')) {
        return def.sounds.lapEnd || def.sounds.step;
      }
      return def.sounds.step;
    }
    if (book) {
      book.turn();
      return 'page';
    }
    if (incense) {
      if (incense.bowing()) {
        return null;
      }
      if (bows >= def.bows) {
        return null;
      }
      bows += 1;
      incense.bow();
      return bows >= def.bows ? def.sounds.end : 'none';
    }
    return null;
  }

  return {
    scene,
    camera,
    def,
    step,
    state: describe,
    // Guests may turn the object to look at it closely.
    inspect(dx) {
      inspectYaw = THREE.MathUtils.clamp(inspectYaw + dx * 0.01, -1.2, 1.2);
    },
    setLighting({ hemiIntensity = 1.3, keyIntensity = 1.6, warm = false } = {}) {
      hemi.intensity = hemiIntensity;
      key.intensity = keyIntensity;
      key.color.set(warm ? '#ffcf96' : '#fff1dc');
    },
    lift: () => (incense ? incense.lift() : 0),
    resize(aspect, fov) {
      camera.aspect = aspect;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      // Keep the object inside a narrow portrait screen.
      const halfWidth = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect * 0.45;
      holder.scale.setScalar(Math.min(1, halfWidth / 0.17));
    },
    update(delta, elapsed) {
      holder.rotation.y += (inspectYaw - holder.rotation.y) * Math.min(1, delta * 8);
      holder.position.y += Math.sin(elapsed * 1.3) * 0.00004;
      if (strand) {
        strand.update(delta);
      }
      if (book) {
        book.update(delta);
      }
      if (incense) {
        incense.update(delta, elapsed);
      }
    },
    debug: () => ({
      kind: def.kind,
      stepIndex,
      bows,
      page: book ? book.page() : null,
      strand: strand ? strand.debug() : null,
    }),
    dispose() {
      if (book) {
        book.dispose();
      }
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          object.material.dispose();
        }
      });
    },
  };
}
