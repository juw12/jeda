// Food places, stalls, dishes, home kitchens, pre-meal prayers and the people you meet (NPCs).
// The food place for each space reflects food commonly found around that community in Indonesia
// (not a rule about who eats what). Prices are only for atmosphere: everything is free in Jeda.

export const FAITH_SCENE = { islam: 'masjid', protestan: 'gereja', katolik: 'katedral', hindu: 'pura', buddha: 'vihara', khonghucu: 'klenteng', alam: 'alam' };

// How each traditional cooking method is performed, step by step (the hawker's live action).
// clip = hawker animation, fx = visual/sound effect at the stove.
export const METHODS = {
  wok: {
    label: 'Wajan besi di atas api tungku besar',
    about: 'Api besar dan lemparan cepat di wajan besi memberi aroma "wok hei" (napas wajan) yang khas.',
    steps: [
      { label: 'Memanaskan wajan sampai berasap', clip: 'wok', seconds: 1.8, fx: 'heat' },
      { label: 'Bawang putih & bahan masuk, mendesis', clip: 'wok', seconds: 2.0, fx: 'sizzle' },
      { label: 'Diaduk & dilempar di atas api besar', clip: 'wok', seconds: 4.2, fx: 'flare' },
      { label: 'Disajikan ke piring', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  stir: {
    label: 'Kuali besar diaduk perlahan',
    about: 'Kuah atau bumbu dimasak lama di kuali/periuk besar dan terus diaduk agar tidak gosong.',
    steps: [
      { label: 'Mengaduk isi kuali', clip: 'stir', seconds: 3.2, fx: 'simmer' },
      { label: 'Mengambil dengan sendok sayur', clip: 'stir', seconds: 2.2, fx: 'steam' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  grill: {
    label: 'Dibakar di atas arang sambil dikipas',
    about: 'Arang (sering dari batok kelapa) dikipas terus supaya bara merata dan asapnya meresap.',
    steps: [
      { label: 'Menata tusukan di atas bara', clip: 'fan', seconds: 2.0, fx: 'smoke' },
      { label: 'Mengipas bara, asap mengepul', clip: 'fan', seconds: 3.4, fx: 'embers' },
      { label: 'Dibalik & diolesi bumbu', clip: 'fan', seconds: 2.0, fx: 'sizzle' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  steam: {
    label: 'Dikukus dalam keranjang bambu bersusun',
    about: 'Keranjang bambu bersusun di atas air mendidih; uapnya membuat kulit lembut dan basah.',
    steps: [
      { label: 'Membuka tutup kukusan, uap keluar', clip: 'steam', seconds: 2.2, fx: 'steamBurst' },
      { label: 'Mengambil dari keranjang', clip: 'steam', seconds: 2.0, fx: 'steam' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  pour: {
    label: 'Dituang dari tinggi ("ditarik")',
    about: 'Minuman dituang bolak-balik dari ketinggian supaya dingin sedikit, tercampur, dan berbuih.',
    steps: [
      { label: 'Menyaring kopi/teh dengan saringan kain', clip: 'pour', seconds: 2.4, fx: 'pour' },
      { label: 'Menarik minuman dari ketinggian', clip: 'pour', seconds: 3.0, fx: 'pour' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  chop: {
    label: 'Dipotong di talenan kayu dengan golok',
    about: 'Potongan cepat dan rata di talenan kayu tebal; bunyinya ritmis.',
    steps: [
      { label: 'Memotong di talenan', clip: 'chop', seconds: 3.4, fx: 'chop' },
      { label: 'Menata di piring', clip: 'serve', seconds: 1.4, fx: 'plate' },
    ],
  },
  fry: {
    label: 'Digoreng dalam minyak panas di wajan dalam',
    about: 'Adonan dicelupkan ke minyak panas sampai kuning keemasan dan renyah, lalu ditiriskan.',
    steps: [
      { label: 'Mencelupkan adonan', clip: 'fry', seconds: 1.8, fx: 'sizzle' },
      { label: 'Menggoreng sampai keemasan', clip: 'fry', seconds: 3.6, fx: 'fry' },
      { label: 'Meniriskan minyak', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  griddle: {
    label: 'Di atas wajan datar (loyang besi) panas',
    about: 'Adonan tipis dilebarkan di wajan datar, diisi, dilipat, lalu dipotong.',
    steps: [
      { label: 'Melebarkan adonan tipis', clip: 'griddle', seconds: 2.2, fx: 'sizzle' },
      { label: 'Mengisi & melipat', clip: 'griddle', seconds: 2.4, fx: 'sizzle' },
      { label: 'Memotong kotak-kotak', clip: 'chop', seconds: 1.6, fx: 'chop' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.2, fx: 'plate' },
    ],
  },
  smoke: {
    label: 'Diasap di atas bara kayu',
    about: 'Daging diasap perlahan di atas bara kayu (di NTT: kayu kosambi) sampai harum dan merah.',
    steps: [
      { label: 'Mengangkat dari pengasapan', clip: 'fan', seconds: 2.4, fx: 'smoke' },
      { label: 'Mengiris tipis', clip: 'chop', seconds: 2.6, fx: 'chop' },
      { label: 'Disajikan', clip: 'serve', seconds: 1.3, fx: 'plate' },
    ],
  },
  toast: {
    label: 'Dipanggang di atas arang',
    about: 'Roti dipanggang di atas bara sampai garing, lalu diolesi selai.',
    steps: [
      { label: 'Memanggang roti di atas arang', clip: 'fan', seconds: 2.8, fx: 'smoke' },
      { label: 'Mengoles selai & mentega', clip: 'griddle', seconds: 2.0, fx: null },
      { label: 'Disajikan', clip: 'serve', seconds: 1.2, fx: 'plate' },
    ],
  },
};

// ---------- Dishes (spec = how dishes.js builds it) ----------
export const DISHES = {
  // Pecinan (Khonghucu / Tionghoa)
  'kwetiau-goreng': { name: 'Kwetiau goreng', price: 30000, desc: 'Kwetiau lebar, kecap, udang, tauge, telur, kucai.', utensil: 'chopsticks', method: 'wok', spec: { kind: 'noodles', noodle: '#7a4a22', flat: true, thick: 0.0032, toppings: ['shrimp', 'sprouts', 'chives', 'egg', 'fishcake'] } },
  'bakmi-ayam': { name: 'Bakmi ayam', price: 25000, desc: 'Mi kuning kenyal, ayam kecap, sawi hijau.', utensil: 'chopsticks', method: 'wok', spec: { kind: 'noodles', noodle: '#e9c25a', thick: 0.0022, toppings: ['chicken', 'greens', 'scallion'] } },
  'bak-kut-teh': { name: 'Bak kut teh', price: 45000, desc: 'Iga babi dalam kuah rempah herbal, bawang putih utuh.', utensil: 'chopsticks', method: 'stir', tags: ['babi'], spec: { kind: 'soup', vessel: 'claypot', broth: '#5a3519', opacity: 0.92, items: [['rib', 4], ['garlic', 4], ['tofu', 2]], garnish: ['scallion'] } },
  'nasi-hainam': { name: 'Nasi hainam', price: 32000, desc: 'Nasi gurih kaldu ayam, ayam rebus iris, mentimun, sambal.', utensil: 'chopsticks', method: 'chop', spec: { kind: 'rice', rice: '#f3e7c4', sides: ['chickenSlices', 'cucumber', 'chiliSauce'] } },
  siomay: { name: 'Siomay (dim sum)', price: 22000, desc: 'Siomay kukus dengan telur ikan di atasnya.', utensil: 'chopsticks', method: 'steam', spec: { kind: 'steamer', item: 'siomay' } },
  hakau: { name: 'Hakau', price: 24000, desc: 'Kulit bening tipis berisi udang.', utensil: 'chopsticks', method: 'steam', spec: { kind: 'steamer', item: 'hakau' } },
  'teh-tionghoa': { name: 'Teh oolong panas', price: 8000, desc: 'Teh oolong diseduh di teko.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#8a5a1e', sips: 5 } },

  // Kopitiam & vegetarian (Buddha)
  'kopi-susu': { name: 'Kopi susu kopitiam', price: 12000, desc: 'Kopi disaring kain, susu kental manis, dituang dari tinggi.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#3a2213', milk: true, sips: 6 } },
  'kopi-o': { name: 'Kopi O', price: 10000, desc: 'Kopi hitam manis tanpa susu.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#1f120a', sips: 6 } },
  'roti-kaya': { name: 'Roti bakar kaya', price: 15000, desc: 'Roti dipanggang arang, selai kaya pandan & mentega.', utensil: 'hand', method: 'toast', verb: 'Gigit', spec: { kind: 'toast' } },
  'telur-setengah': { name: 'Telur setengah matang', price: 9000, desc: 'Dua telur setengah matang, kecap asin, lada.', utensil: 'spoon', method: 'stir', spec: { kind: 'eggs' } },
  'mi-vegetarian': { name: 'Mi goreng vegetarian', price: 25000, desc: 'Tanpa daging & tanpa bawang: sayur, jamur, wortel.', utensil: 'chopsticks', method: 'wok', tags: ['vegetarian'], spec: { kind: 'noodles', noodle: '#b07a3a', thick: 0.0024, toppings: ['cabbage', 'carrot', 'mushroom', 'greens'] } },
  'bakpao-vegetarian': { name: 'Bakpao vegetarian', price: 15000, desc: 'Bakpao kukus isi sayur & jamur.', utensil: 'hand', method: 'steam', verb: 'Gigit', tags: ['vegetarian'], spec: { kind: 'steamer', item: 'bakpao' } },
  'nasi-campur-vegetarian': { name: 'Nasi campur vegetarian', price: 28000, desc: 'Nasi, sayur tumis, tahu, tempe, jamur.', utensil: 'spoon', method: 'stir', tags: ['vegetarian'], spec: { kind: 'rice', sides: ['vegMix', 'tempe', 'tofu'] } },

  // Rumah makan Padang & warung halal (Islam)
  'nasi-padang': { name: 'Nasi Padang rendang', price: 35000, desc: 'Nasi, rendang, kuah gulai, sambal ijo, daun singkong.', utensil: 'hand', method: 'stir', note: 'Biasa dimakan dengan tangan kanan. Cuci tangan dulu di kobokan.', spec: { kind: 'rice', plate: 'banana', sides: ['rendang', 'sambalIjo', 'daunSingkong', 'gulai'], hand: true }, parcel: 'paper' },
  'sate-ayam': { name: 'Sate ayam Madura', price: 30000, desc: 'Sate ayam bakar arang, bumbu kacang, lontong.', utensil: 'hand', method: 'grill', verb: 'Gigit', spec: { kind: 'skewers', count: 6, color: '#8a4a22', sauce: '#7a4418', sides: ['lontong'] }, parcel: 'paper' },
  'martabak-telur': { name: 'Martabak telur', price: 35000, desc: 'Kulit tipis renyah berisi telur, daging cincang, daun bawang; acar.', utensil: 'hand', method: 'griddle', verb: 'Gigit', spec: { kind: 'martabak' }, parcel: 'box' },
  'teh-tarik': { name: 'Teh tarik', price: 10000, desc: 'Teh susu yang ditarik sampai berbuih.', method: 'pour', spec: { kind: 'drink', vessel: 'mug', liquid: '#c58b52', foam: '#efe2c8', sips: 6 } },
  bakso: { name: 'Bakso urat', price: 25000, desc: 'Bakso sapi, bihun, tahu, kuah kaldu bening, bawang goreng.', utensil: 'spoon', method: 'stir', spec: { kind: 'soup', broth: '#c9a76a', opacity: 0.75, noodle: '#f3eee2', thick: 0.0012, items: [['meatball', 5], ['tofu', 2]], garnish: ['shallot', 'celery'] } },

  // Warung Bali (Hindu)
  'nasi-campur-bali': { name: 'Nasi campur Bali', price: 35000, desc: 'Nasi, sate lilit, lawar, sambal matah, kacang goreng.', utensil: 'hand', method: 'chop', spec: { kind: 'rice', plate: 'banana', sides: ['sateLilit', 'lawar', 'sambalMatah', 'peanuts'], hand: true }, parcel: 'leaf' },
  'sate-lilit': { name: 'Sate lilit', price: 30000, desc: 'Daging cincang berbumbu dililit di batang serai, dibakar di bara batok kelapa.', utensil: 'hand', method: 'grill', verb: 'Gigit', spec: { kind: 'skewers', piece: 'lilit', count: 5, color: '#b6803f', plate: 'banana', sides: ['sambalMatah'] }, parcel: 'leaf' },
  'kopi-bali': { name: 'Kopi Bali tubruk', price: 10000, desc: 'Bubuk kopi diseduh langsung, ampasnya mengendap.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#1c1009', specks: true, sips: 5 } },
  klepon: { name: 'Klepon', price: 10000, desc: 'Bola ketan pandan berisi gula merah cair, kelapa parut.', utensil: 'hand', method: 'steam', verb: 'Gigit', spec: { kind: 'balls', color: '#5aa046' } },

  // Lapo & kedai Batak/Manado (Protestan)
  arsik: { name: 'Arsik ikan mas', price: 45000, desc: 'Ikan mas dimasak bumbu kuning andaliman, kacang panjang.', utensil: 'spoon', method: 'stir', spec: { kind: 'fish', sauce: '#dfa236', extras: ['longbean'] } },
  'mie-gomak': { name: 'Mie gomak', price: 25000, desc: 'Mi lidi tebal dengan kuah/bumbu andaliman, telur rebus.', utensil: 'spoon', method: 'wok', spec: { kind: 'noodles', noodle: '#c99a4a', thick: 0.0036, toppings: ['egg', 'greens', 'shallot'] } },
  tinutuan: { name: 'Tinutuan (bubur Manado)', price: 20000, desc: 'Bubur labu, jagung, kangkung & bayam.', utensil: 'spoon', method: 'stir', spec: { kind: 'porridge', color: '#e6b04a', items: [['pumpkin', 4], ['corn', 8], ['greens', 3]] } },
  'kopi-sidikalang': { name: 'Kopi Sidikalang', price: 10000, desc: 'Kopi robusta Dairi yang pekat.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#1a0f08', sips: 6 } },

  // Kedai Flores / NTT (Katolik)
  sei: { name: "Se'i sapi", price: 45000, desc: 'Daging asap kayu kosambi, sambal lu’at.', utensil: 'spoon', method: 'smoke', spec: { kind: 'slices', color: '#b9423a', edge: '#4a1d14', count: 7, sides: ['sambalMatah'] } },
  'jagung-bose': { name: 'Jagung bose', price: 20000, desc: 'Jagung pipil & kacang merah dimasak santan.', utensil: 'spoon', method: 'stir', spec: { kind: 'porridge', color: '#efe0b8', items: [['corn', 12], ['beans', 8]] } },
  'kopi-bajawa': { name: 'Kopi Bajawa', price: 12000, desc: 'Kopi arabika dataran tinggi Flores.', method: 'pour', spec: { kind: 'drink', vessel: 'cup', liquid: '#2a170c', sips: 6 } },

  // Angkringan (Ruang Alam)
  'nasi-kucing': { name: 'Nasi kucing', price: 5000, desc: 'Sekepal nasi, sambal, ikan teri, dibungkus daun & kertas.', utensil: 'hand', method: 'chop', spec: { kind: 'rice', plate: 'banana', sides: ['teri', 'sambalMatah', 'tempe'], hand: true }, parcel: 'leaf' },
  'sate-puyuh': { name: 'Sate telur puyuh', price: 5000, desc: 'Telur puyuh bacem, dibakar sebentar di arang.', utensil: 'hand', method: 'grill', verb: 'Gigit', spec: { kind: 'skewers', piece: 'quail', count: 4 } },
  gorengan: { name: 'Gorengan', price: 6000, desc: 'Tempe mendoan, bakwan, tahu isi, cabai rawit.', utensil: 'hand', method: 'fry', verb: 'Gigit', spec: { kind: 'fritters', items: ['mendoan', 'bakwan', 'tahu'] }, parcel: 'paper' },
  'kopi-joss': { name: 'Kopi joss', price: 6000, desc: 'Kopi hitam dicemplungi arang membara: mendesis!', method: 'pour', spec: { kind: 'drink', vessel: 'glass', liquid: '#1d1009', charcoal: true, sips: 6 } },
  'wedang-jahe': { name: 'Wedang jahe', price: 6000, desc: 'Air jahe bakar dengan gula batu.', method: 'pour', spec: { kind: 'drink', vessel: 'glass', liquid: '#c9973a', ginger: true, sips: 6 } },

  // Home kitchens
  'teh-rumah': { name: 'Teh manis hangat', price: 0, desc: 'Teh tubruk dengan gula.', method: 'pour', spec: { kind: 'drink', vessel: 'glass', liquid: '#9a4f1a', sips: 6 } },
  'bubur-rumah': { name: 'Bubur nasi & sayur asin', price: 0, desc: 'Bubur hangat buatan rumah.', utensil: 'spoon', method: 'stir', spec: { kind: 'porridge', color: '#f2ede0', items: [['greens', 3], ['shallot', 6]] } },
  'sayur-rumah': { name: 'Nasi & sayur rumahan', price: 0, desc: 'Nasi hangat, sayur tumis, tempe, sambal.', utensil: 'spoon', method: 'stir', spec: { kind: 'rice', sides: ['vegMix', 'tempe', 'sambalMatah'] } },
};

export function dishById(id) {
  const dish = DISHES[id];
  return dish ? { id, ...dish } : null;
}

export function priceLabel(price) {
  return price ? `Rp ${price.toLocaleString('id-ID')}` : 'Dari dapur rumah';
}

// ---------- Before & after the meal (follows YOUR faith, not the place) ----------
export const MEAL_PRAYER = {
  islam: { title: 'Bismillah', text: 'Bismillāhirraḥmānirraḥīm. Allāhumma bārik lanā fīmā razaqtanā wa qinā ‘adzāban-nār.', after: 'Alḥamdulillāh.', tip: 'Makan dan minum dengan tangan kanan.' },
  protestan: { title: 'Doa makan', text: 'Bapa, terima kasih untuk makanan ini dan untuk tangan-tangan yang memasaknya. Berkatilah, dalam nama Yesus. Amin.', after: 'Puji Tuhan.', tip: '' },
  katolik: { title: 'Doa sebelum makan', text: 'Dalam nama Bapa, dan Putra, dan Roh Kudus. Berkatilah kami ya Tuhan, dan rezeki yang akan kami santap ini, demi Kristus Tuhan kami. Amin.', after: 'Terima kasih, Tuhan.', tip: '' },
  hindu: { title: 'Mantram sebelum makan', text: 'Om Anugraha Amertadi Sanjiwani Ya Namah Swaha.', after: 'Om Śānti Śānti Śānti Om.', tip: 'Sebagian umat menghaturkan saiban (sedikit nasi) lebih dulu.' },
  buddha: { title: 'Perenungan makanan', text: 'Dengan bijaksana aku makan: bukan untuk kesenangan atau memperindah diri, tetapi untuk menopang tubuh ini dan membantu hidup yang baik.', after: 'Sadhu.', tip: '' },
  khonghucu: { title: 'Bersyukur kepada Tian', text: 'Bersyukur kepada Tian atas rezeki hari ini, dan mengingat orang tua serta leluhur.', after: 'Shanzai.', tip: '' },
  alam: { title: 'Sejenak bersyukur', text: 'Tarik napas. Lihat warna, cium aromanya. Terima kasih untuk tanah, petani, dan juru masak.', after: 'Terima kasih.', tip: '' },
};

// ---------- People ----------
// attire: avatar spec (see avatar.js). culture: address words and slang used in small talk (chat.js).
const A = (top, bottom, head = 'hair', extra = {}) => ({ name: '', top, bottom, head, ...extra });

export const KEDAI = {
  khonghucu: {
    name: 'Pujasera Pecinan',
    style: 'pecinan',
    table: 'marble',
    culture: 'tionghoa',
    intro: 'Pujasera di kawasan Pecinan: kios-kios masakan Tionghoa peranakan yang dimasak langsung di depan pembeli.',
    notes: ['Banyak kios Pecinan memakai babi; kios yang halal biasanya memasang tanda.', 'Biasanya makan dengan sumpit dan sendok bebek.'],
    stalls: [
      { id: 'kwetiau', name: 'Kwetiau & Bakmi Ahong', sign: '炒粿條 · KWETIAU', method: 'wok', dishes: ['kwetiau-goreng', 'bakmi-ayam'],
        vendor: { name: 'Koh Ahong', attire: A('#f2f2ef', '#3b3f48', 'cap', { headColor: '#f2f2ef', apron: '#d9d4c8' }), lines: { hello: 'Mau makan apa? Kwetiau lagi enak, apinya besar!', order: 'Siap, satu {dish}!', cook: ['Apinya harus besar biar wangi wok hei.', 'Kecapnya sedikit-sedikit, jangan banjir.'], serve: 'Silakan, masih panas!', bag: 'Dibungkus ya, jangan ditumpuk biar nggak lembek.' } } },
      { id: 'bakkut', name: 'Bak Kut Teh & Nasi Hainam Ci Mei', sign: '肉骨茶 · BAK KUT TEH', method: 'stir', dishes: ['bak-kut-teh', 'nasi-hainam', 'teh-tionghoa'],
        vendor: { name: 'Ci Mei', attire: A('#b8322b', '#2f2f35', 'bun', { apron: '#efe8dc' }), lines: { hello: 'Kuahnya dari subuh, rempahnya meresap.', order: 'Oke, {dish} satu ya.', cook: ['Kuah ini direbus berjam-jam sama rempah obat.', 'Bawang putihnya utuh, nanti lembut.'], serve: 'Hati-hati, periuknya panas.', bag: 'Kuahnya dipisah ya.' } } },
      { id: 'dimsum', name: 'Dim Sum Engkong', sign: '點心 · DIM SUM', method: 'steam', dishes: ['siomay', 'hakau'],
        vendor: { name: 'Engkong Liong', attire: A('#f4efe2', '#4a4a52', 'gray', { apron: '#ffffff' }), lines: { hello: 'Dim sum baru keluar dari kukusan.', order: '{dish}, siap.', cook: ['Kukusan bambu ini umurnya lebih tua dari cucu saya.', 'Hakau kulitnya harus bening, tipis.'], serve: 'Makan pelan-pelan, isinya panas.', bag: 'Saya kasih kotak, ya.' } } },
    ],
    patrons: [
      { name: 'Ci Lina', attire: A('#d7a1b3', '#3f3a46', 'bun'), from: 'Semarang', job: 'pemilik toko kelontong', family: 'dua anak yang sudah kuliah', hobby: 'masak kue keranjang tiap Imlek' },
      { name: 'Koh Wilson', attire: A('#3f5a7a', '#2b2b30'), from: 'Medan', job: 'pedagang onderdil', family: 'satu cucu yang lucu', hobby: 'main catur Tionghoa' },
      { name: 'A Mei', attire: A('#f0c94a', '#5a5a64', 'bun'), from: 'Pontianak', job: 'mahasiswi', family: 'tinggal sama nenek', hobby: 'foto makanan' },
    ],
    walkers: [{ name: 'Om Hendra', attire: A('#6c8f6a', '#3a3a40'), from: 'Jakarta', job: 'pensiunan guru', family: 'istri yang jago masak', hobby: 'jalan pagi' }],
    talk: [
      [[0, 'Kwetiau Koh Ahong tetap paling wangi ya.'], [1, 'Iya, apinya itu lho, sampai menyambar.'], [0, 'Imlek nanti pada pulang kampung?'], [1, 'Pulang ke Medan, sembahyang di rumah abu.']],
      [[0, 'Cucumu sudah bisa sumpit?'], [1, 'Sudah, tapi masih lebih banyak jatuh ke meja.'], [0, 'Hahaha, nanti juga pintar.']],
    ],
  },
  buddha: {
    name: 'Kopitiam & Kedai Vegetarian',
    style: 'kopitiam',
    table: 'marble',
    culture: 'tionghoa',
    intro: 'Kedai kopi gaya lama (kopitiam) di dekat vihara, bersebelahan dengan kedai vegetarian yang ramai saat Ce It & Cap Go.',
    notes: ['Kedai vegetarian (素食) tidak memakai daging; banyak juga yang tanpa bawang putih & bawang merah.', 'Umat Buddha Mahayana banyak yang bervegetarian pada tanggal 1 & 15 Imlek.'],
    stalls: [
      { id: 'kopi', name: 'Kopitiam Sinar', sign: '咖啡店 · KOPITIAM', method: 'pour', dishes: ['kopi-susu', 'kopi-o', 'roti-kaya', 'telur-setengah'],
        vendor: { name: 'Pak Ahsan', attire: A('#ffffff', '#5a4a3a', 'gray', { apron: '#cbb79a' }), lines: { hello: 'Kopi? Saring kain, sudah dari tahun 1960-an.', order: 'Satu {dish}!', cook: ['Saringan kain ini makin tua makin wangi.', 'Tuangnya dari tinggi, biar berbuih.'], serve: 'Silakan, diaduk dulu susunya.', bag: 'Kopinya pakai plastik ikat ya, kayak dulu.' } } },
      { id: 'vegetarian', name: 'Kedai Vegetarian Teratai', sign: '素食 · VEGETARIAN', method: 'wok', dishes: ['mi-vegetarian', 'nasi-campur-vegetarian'],
        vendor: { name: 'Ci Hui', attire: A('#f3e6c9', '#4a4a55', 'bun', { apron: '#8fae7a' }), lines: { hello: 'Semua di sini tanpa daging, tanpa bawang.', order: '{dish}, siap.', cook: ['Kaldu kami dari jamur & sayur.', 'Wajannya khusus, tidak pernah kena daging.'], serve: 'Silakan, semoga semua makhluk berbahagia.', bag: 'Dibungkus kertas ya, tidak pakai styrofoam.' } } },
      { id: 'bakpao', name: 'Bakpao Vegetarian Lotus', sign: '包子 · BAKPAO', method: 'steam', dishes: ['bakpao-vegetarian'],
        vendor: { name: 'Bu Lan', attire: A('#c9d8e8', '#4a4a55', 'bun', { apron: '#ffffff' }), lines: { hello: 'Bakpao isi sayur & jamur, baru matang.', order: 'Satu {dish}.', cook: ['Adonannya diuleni pakai tangan.'], serve: 'Hangat-hangat, silakan.', bag: 'Saya bungkus kertas.' } } },
    ],
    patrons: [
      { name: 'Pak Budi', attire: A('#d9822b', '#5a4a3a'), from: 'Tangerang', job: 'pengurus vihara', family: 'tiga cucu', hobby: 'membaca paritta pagi' },
      { name: 'Mei Ling', attire: A('#a9c6a0', '#3f3f48', 'bun'), from: 'Jakarta', job: 'perawat', family: 'tinggal sama orang tua', hobby: 'yoga & meditasi' },
      { name: 'Om Yanto', attire: A('#7a8aa0', '#33333a'), from: 'Bogor', job: 'pemilik bengkel', family: 'istri dan anak kembar', hobby: 'memelihara ikan koi' },
    ],
    walkers: [{ name: 'Kak Wulan', attire: A('#e7b3a3', '#4a4a55', 'bun'), from: 'Bandung', job: 'desainer', family: 'kucing dua', hobby: 'cari kopi enak' }],
    talk: [
      [[0, 'Besok Ce It, sudah siap makan vegetarian?'], [1, 'Sudah, mi vegetarian Ci Hui paling enak.'], [0, 'Saya mau ke vihara pagi-pagi dulu.'], [1, 'Sadhu, titip doa ya.']],
      [[0, 'Kopi O di sini kental banget.'], [1, 'Itu kopinya disangrai pakai mentega dulu.'], [0, 'Pantas wanginya lain.']],
    ],
  },
  islam: {
    name: 'Rumah Makan Padang & Warung Halal',
    style: 'padang',
    table: 'formica',
    culture: 'minang',
    intro: 'Deretan warung halal dekat masjid: rumah makan Padang, sate bakar arang, dan martabak & teh tarik.',
    notes: ['Semua kios di sini halal.', 'Nasi Padang sering dimakan dengan tangan kanan; ada kobokan (mangkuk air cuci tangan).', 'Mulai dengan Bismillah, tutup dengan Alhamdulillah.'],
    stalls: [
      { id: 'padang', name: 'RM Padang Sabana', sign: 'NASI PADANG · HALAL', method: 'stir', dishes: ['nasi-padang'],
        vendor: { name: 'Uda Rizal', attire: A('#ffffff', '#2f3b2f', 'peci', { headColor: '#1f1f22', apron: '#ffffff' }), lines: { hello: 'Silakan, Bang/Kak! Rendangnya dimasak dari subuh.', order: 'Nasi rendang satu, kuah banyak?', cook: ['Rendang ini diaduk berjam-jam sampai santannya kering, namanya merandang.', 'Sambal ijo diulek kasar, tidak diblender.'], serve: 'Silakan, kobokannya di samping.', bag: 'Dibungkus kertas nasi, bumbunya dipisah ya.' } } },
      { id: 'sate', name: 'Sate Madura Cak Mat', sign: 'SATE AYAM · HALAL', method: 'grill', dishes: ['sate-ayam', 'bakso'],
        vendor: { name: 'Cak Mat', attire: A('#2f6b4a', '#2f2f35', 'peci', { headColor: '#1f1f22' }), lines: { hello: 'Sate ayam, bumbu kacang, arang batok!', order: 'Sate sepuluh tusuk, lontong?', cook: ['Kipasnya jangan berhenti, nanti baranya mati.', 'Bumbu kacangnya diulek sendiri.'], serve: 'Monggo, masih berasap.', bag: 'Bumbunya saya pisah di plastik.' } } },
      { id: 'martabak', name: 'Martabak & Teh Tarik Bang Ali', sign: 'MARTABAK · TEH TARIK', method: 'griddle', dishes: ['martabak-telur', 'teh-tarik'],
        vendor: { name: 'Bang Ali', attire: A('#e8e2d0', '#3a3a40', 'peci', { headColor: '#ffffff' }), lines: { hello: 'Martabak telur, adonan dibanting tipis!', order: 'Satu {dish}, siap!', cook: ['Adonannya dibanting sampai tipis sekali.', 'Teh tarik ditarik sampai berbuih.'], serve: 'Silakan, acarnya di samping.', bag: 'Saya masukkan kotak, ya.' } } },
    ],
    patrons: [
      { name: 'Bu Siti', attire: A('#3f8f6a', '#2f3b4a', 'hijab', { headColor: '#e9e2d3' }), from: 'Bukittinggi', job: 'guru mengaji', family: 'empat anak', hobby: 'masak gulai' },
      { name: 'Pak Hasan', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Surabaya', job: 'sopir travel', family: 'istri dan dua anak', hobby: 'nonton bola' },
      { name: 'Nisa', attire: A('#c98fb0', '#3f3a46', 'hijab', { headColor: '#7a5a8f' }), from: 'Bandung', job: 'mahasiswi farmasi', family: 'anak bungsu', hobby: 'bikin konten kuliner' },
    ],
    walkers: [{ name: 'Mas Farhan', attire: A('#5a7a9a', '#2f2f35', 'peci', { headColor: '#1f1f22' }), from: 'Yogyakarta', job: 'marbot masjid', family: 'baru menikah', hobby: 'azan & bersih-bersih masjid' }],
    talk: [
      [[0, 'Habis Zuhur langsung ke sini ya?'], [1, 'Iya, rendang Uda Rizal paling empuk.'], [0, 'Pakai tangan lebih nikmat.'], [1, 'Betul, jangan lupa cuci tangan di kobokan.']],
      [[0, 'Ramadan nanti buka puasa di masjid?'], [1, 'Insyaallah, sambil bawa takjil.'], [0, 'Saya bawa kolak, deh.']],
    ],
  },
  hindu: {
    name: 'Warung Bali',
    style: 'bali',
    table: 'bamboo',
    culture: 'bali',
    intro: 'Warung beratap alang-alang dekat pura: nasi campur Bali, sate lilit dibakar di bara batok kelapa, dan kopi Bali.',
    notes: ['Warung Bali umumnya tidak menyajikan daging sapi.', 'Setelah masak, pedagang menghaturkan saiban (persembahan kecil) sebelum berjualan.'],
    stalls: [
      { id: 'campur', name: 'Nasi Campur Men Sari', sign: 'NASI CAMPUR BALI', method: 'chop', dishes: ['nasi-campur-bali'],
        vendor: { name: 'Mbok Ketut', attire: A('#f7f4ec', '#c06a24', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), lines: { hello: 'Om Swastyastu! Nasi campurnya, Gus/Gek?', order: 'Nasi campur satu, pedas?', cook: ['Lawar dicincang halus pakai blakas, pisau besar ini.', 'Sambal matahnya mentah, diremas tangan.'], serve: 'Silakan, suksma.', bag: 'Dibungkus daun pisang, biar harum.' } } },
      { id: 'lilit', name: 'Sate Lilit Bli Wayan', sign: 'SATE LILIT', method: 'grill', dishes: ['sate-lilit'],
        vendor: { name: 'Bli Wayan', attire: A('#f7f4ec', '#2f4a6a', 'udeng', { headColor: '#f7f4ec' }), lines: { hello: 'Sate lilit, dibakar di batok kelapa!', order: 'Lima tusuk, siap.', cook: ['Dagingnya dililit di batang serai, jadi wangi.', 'Batok kelapa apinya stabil.'], serve: 'Silakan, Bli/Gek.', bag: 'Daun pisang ya.' } } },
      { id: 'kopi', name: 'Kopi & Jaje Bali', sign: 'KOPI BALI · JAJE', method: 'pour', dishes: ['kopi-bali', 'klepon'],
        vendor: { name: 'Made Ayu', attire: A('#e9c46a', '#7a3a2a', 'bun'), lines: { hello: 'Kopi tubruk? Klepon baru matang!', order: '{dish} satu.', cook: ['Kopinya tubruk, tunggu ampasnya turun dulu.', 'Klepon kalau digigit, gula merahnya meletup.'], serve: 'Silakan.', bag: 'Saya bungkus.' } } },
    ],
    patrons: [
      { name: 'Pak Nyoman', attire: A('#f7f4ec', '#3a4a3a', 'udeng', { headColor: '#f7f4ec' }), from: 'Gianyar', job: 'pemahat kayu', family: 'tiga anak, Wayan, Made, Nyoman', hobby: 'menabuh gamelan' },
      { name: 'Luh Putu', attire: A('#e7a5b5', '#c06a24', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), from: 'Tabanan', job: 'penari', family: 'adik kembar', hobby: 'membuat canang' },
      { name: 'Gede', attire: A('#4a6a9a', '#2f2f35'), from: 'Denpasar', job: 'pemandu wisata', family: 'istri dari Lombok', hobby: 'selancar' },
    ],
    walkers: [{ name: 'Mbok Sri', attire: A('#f2d16a', '#8a3a2a', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), from: 'Klungkung', job: 'pedagang canang', family: 'cucu lima', hobby: 'menganyam janur' }],
    talk: [
      [[0, 'Galungan nanti pasang penjor di rumah?'], [1, 'Sudah mulai buat, janurnya tinggi.'], [0, 'Anak-anak pasti senang.'], [1, 'Iya, nanti ada lawar juga.']],
      [[0, 'Sate lilit Bli Wayan memang paling harum.'], [1, 'Serainya itu, segar.'], [0, 'Habis ini mesaiban dulu di rumah.']],
    ],
  },
  protestan: {
    name: 'Lapo & Kedai Kopi',
    style: 'lapo',
    table: 'darkwood',
    culture: 'batak',
    intro: 'Lapo (kedai Batak) dan kedai kopi dekat gereja: arsik, mie gomak, bubur Manado, dan kopi Sidikalang. Ramai sepulang ibadah Minggu.',
    notes: ['Sebagian lapo juga menyajikan masakan babi; tanyakan kalau ragu.', 'Berdoa sebelum makan, lalu makan bersama-sama.'],
    stalls: [
      { id: 'arsik', name: 'Lapo Arsik Inang', sign: 'LAPO · ARSIK', method: 'stir', dishes: ['arsik'],
        vendor: { name: 'Inang Sinaga', attire: A('#8a2a2a', '#2f2f35', 'bun', { apron: '#e8dcc8' }), lines: { hello: 'Horas! Arsiknya baru matang, andalimannya mantap.', order: 'Arsik satu, ya Amang/Inang.', cook: ['Ikannya tidak diaduk, cuma disiram kuahnya pelan-pelan.', 'Andaliman ini yang bikin lidah bergetar.'], serve: 'Silakan, Horas!', bag: 'Kubungkus rapi ya.' } } },
      { id: 'gomak', name: 'Mie Gomak Lae Tigor', sign: 'MIE GOMAK', method: 'wok', dishes: ['mie-gomak'],
        vendor: { name: 'Lae Tigor', attire: A('#2f4a6a', '#2f2f35', 'hair', { apron: '#d9d0c0' }), lines: { hello: 'Mie gomak, Lae! Pedasnya andaliman.', order: 'Satu mie gomak!', cook: ['Namanya gomak karena dulu diambil pakai tangan, digenggam.', 'Bumbunya kari, tapi rasanya Toba.'], serve: 'Silakan, Lae.', bag: 'Kuahnya kupisah.' } } },
      { id: 'kopi', name: 'Kedai Kopi & Bubur Manado', sign: 'KOPI · TINUTUAN', method: 'pour', dishes: ['kopi-sidikalang', 'tinutuan'],
        vendor: { name: 'Om Jhon', attire: A('#e8e2d0', '#3a3a40', 'gray'), lines: { hello: 'Kopi Sidikalang? Atau bubur Manado hangat?', order: 'Siap, {dish}.', cook: ['Tinutuan ini isinya sayur kebun semua.', 'Kopinya robusta Dairi, pekat.'], serve: 'Silakan, Tuhan memberkati.', bag: 'Kututup rapat ya.' } } },
    ],
    patrons: [
      { name: 'Amang Simanjuntak', attire: A('#3a3a48', '#2f2f35', 'gray', { collar: '#ffffff' }), from: 'Tarutung', job: 'penatua gereja', family: 'enam anak, banyak cucu', hobby: 'bernyanyi di paduan suara' },
      { name: 'Ito Rosa', attire: A('#6c8fe0', '#3a3a48', 'bun'), from: 'Siantar', job: 'guru sekolah minggu', family: 'baru melahirkan', hobby: 'main gitar' },
      { name: 'Kak Mega', attire: A('#e0a36c', '#3a3a48', 'bun'), from: 'Manado', job: 'perawat', family: 'tinggal sama opa & oma', hobby: 'masak tinutuan' },
    ],
    walkers: [{ name: 'Lae Bonar', attire: A('#4a6a4a', '#2f2f35'), from: 'Balige', job: 'sopir angkot', family: 'dua anak', hobby: 'memancing di Danau Toba' }],
    talk: [
      [[0, 'Khotbah tadi bagus ya, soal kasih.'], [1, 'Betul, Amang. Habis ini latihan koor.'], [0, 'Arsik dulu biar suaranya kuat!'], [1, 'Hahaha, Horas!']],
      [[0, 'Natal nanti pulang ke Toba?'], [1, 'Pulang, mau kumpul keluarga besar.'], [0, 'Salam untuk inang di kampung.']],
    ],
  },
  katolik: {
    name: 'Kedai Flores',
    style: 'flores',
    table: 'wood',
    culture: 'flores',
    intro: "Kedai keluarga Flores dekat gereja & gua Maria: se'i diasap kayu kosambi, jagung bose, dan kopi Bajawa.",
    notes: ["Se'i aslinya diasap dengan kayu kosambi di atas bara.", 'Masa Prapaskah: Jumat berpantang daging; Rabu Abu & Jumat Agung juga berpuasa.'],
    stalls: [
      { id: 'sei', name: "Se'i Mama Maria", sign: "SE'I · ASAP KOSAMBI", method: 'smoke', dishes: ['sei'],
        vendor: { name: 'Mama Maria', attire: A('#9b7fd1', '#5a3a2a', 'bun', { apron: '#e8dcc8' }), lines: { hello: "Se'i baru turun dari asap, ade!", order: "Se'i satu, sambal lu'at?", cook: ['Kayu kosambi ini yang bikin harum dan merah.', 'Diasap pelan-pelan, tidak boleh buru-buru.'], serve: 'Silakan, Tuhan berkati.', bag: 'Bungkus daun, ya.' } } },
      { id: 'bose', name: 'Jagung Bose Om Yosef', sign: 'JAGUNG BOSE', method: 'stir', dishes: ['jagung-bose'],
        vendor: { name: 'Om Yosef', attire: A('#e8e2d0', '#3a3a40', 'hair', { pendant: '#d8b14a' }), lines: { hello: 'Jagung bose, makanan kampung kami.', order: 'Satu mangkok, siap.', cook: ['Jagungnya ditumbuk dulu, direbus lama sama kacang.', 'Santannya dimasukkan terakhir.'], serve: 'Silakan, ade.', bag: 'Kututup rapat.' } } },
      { id: 'kopi', name: 'Kopi Bajawa', sign: 'KOPI BAJAWA', method: 'pour', dishes: ['kopi-bajawa'],
        vendor: { name: 'Kakak Frans', attire: A('#4a6a8a', '#2f2f35'), lines: { hello: 'Kopi dari Bajawa, kebun keluarga.', order: 'Satu kopi Bajawa.', cook: ['Disangrai di kuali tanah, pakai kayu.'], serve: 'Silakan, kraeng.', bag: 'Kubungkus.' } } },
    ],
    patrons: [
      { name: 'Opa Anton', attire: A('#5a4a6a', '#2f2f35', 'gray', { pendant: '#d8b14a' }), from: 'Ende', job: 'pensiunan guru', family: 'tujuh cucu', hobby: 'berdoa rosario sore' },
      { name: 'Kakak Lusi', attire: A('#d9a1b8', '#3f3a46', 'bun'), from: 'Maumere', job: 'bidan', family: 'adik yang calon frater', hobby: 'menenun ikat' },
      { name: 'Ade Rian', attire: A('#3f8fb0', '#2f2f35'), from: 'Kupang', job: 'mahasiswa', family: 'jauh dari rumah', hobby: 'main sepak bola' },
    ],
    walkers: [{ name: 'Mama Theresia', attire: A('#e9e2d3', '#4a3a5a', 'bun', { pendant: '#d8b14a' }), from: 'Larantuka', job: 'pedagang ikan', family: 'anak tiga', hobby: 'Semana Santa di Larantuka' }],
    talk: [
      [[0, 'Misa pagi tadi ramai sekali.'], [1, 'Iya, koornya bagus.'], [0, "Habis ini se'i dulu, baru rosario."], [1, 'Hahaha, urutan yang baik, Opa.']],
      [[0, 'Paskah nanti ke Larantuka?'], [1, 'Mau ikut Semana Santa, prosesi laut.'], [0, 'Doakan kami juga ya.']],
    ],
  },
  alam: {
    name: 'Angkringan & Warung Malam',
    style: 'angkringan',
    table: 'wood',
    culture: 'jawa',
    intro: 'Angkringan gerobak dengan lampu teplok: nasi kucing, sate-satean dibakar di arang, gorengan, dan kopi joss.',
    notes: ['Di angkringan, ambil sendiri lalu sebutkan apa saja yang diambil saat bayar.', 'Kopi joss: arang membara dicemplungkan ke kopi.'],
    stalls: [
      { id: 'angkringan', name: 'Angkringan Lik Man', sign: 'ANGKRINGAN', method: 'grill', dishes: ['nasi-kucing', 'sate-puyuh', 'kopi-joss', 'wedang-jahe'],
        vendor: { name: 'Lik Man', attire: A('#6a5a4a', '#3a3a40', 'caping', { headColor: '#d9c38a' }), lines: { hello: 'Monggo, pinarak. Nasi kucingnya masih anget.', order: 'Nggih, {dish}.', cook: ['Satenya dibakar sebentar biar anget.', 'Arangnya dari kayu, cemplungin ke kopi, joss!'], serve: 'Monggo.', bag: 'Dibungkus kertas minyak, nggih.' } } },
      { id: 'gorengan', name: 'Gorengan Mbok Darmi', sign: 'GORENGAN', method: 'fry', dishes: ['gorengan'],
        vendor: { name: 'Mbok Darmi', attire: A('#a95a4a', '#3a3a40', 'bun', { apron: '#e8dcc8' }), lines: { hello: 'Mendoan baru diangkat, Mas/Mbak!', order: 'Gorengan campur, nggih.', cook: ['Minyaknya harus panas betul, biar kriuk.', 'Mendoan itu setengah matang, lemas.'], serve: 'Monggo, cabainya digigit sendiri.', bag: 'Kertasnya biar minyaknya nyerap.' } } },
      { id: 'bakso', name: 'Bakso Pak Ndut', sign: 'BAKSO', method: 'stir', dishes: ['bakso'],
        vendor: { name: 'Pak Ndut', attire: A('#3a6a8a', '#2f2f35', 'cap', { headColor: '#1f1f22' }), lines: { hello: 'Bakso urat, kuah panas!', order: 'Satu mangkok!', cook: ['Kuahnya dari tulang, direbus dari sore.'], serve: 'Monggo, sambalnya di situ.', bag: 'Kuahnya saya pisah.' } } },
    ],
    patrons: [
      { name: 'Mas Bayu', attire: A('#5a7a5a', '#2f2f35'), from: 'Yogyakarta', job: 'ojek daring', family: 'istri dan bayi', hobby: 'ngopi malam' },
      { name: 'Mbak Sri', attire: A('#d9b07a', '#4a3a3a', 'bun'), from: 'Solo', job: 'penjahit', family: 'dua anak SD', hobby: 'dengar keroncong' },
      { name: 'Pak Darto', attire: A('#7a6a5a', '#33333a', 'gray'), from: 'Klaten', job: 'petani', family: 'cucu empat', hobby: 'merawat burung perkutut' },
    ],
    walkers: [{ name: 'Dik Ayu', attire: A('#e7a5b5', '#3f3a46', 'bun'), from: 'Magelang', job: 'mahasiswi', family: 'anak kos', hobby: 'naik gunung' }],
    talk: [
      [[0, 'Malam ini adem ya.'], [1, 'Pas buat kopi joss.'], [0, 'Panen kemarin gimana, Pak?'], [1, 'Lumayan, syukur hujan cukup.']],
      [[0, 'Nasi kucing dua cukup?'], [1, 'Tambah sate puyuh, biar kuat sampai pagi.'], [0, 'Hahaha, kerja keras ya, Mas.']],
    ],
  },
};

// ---------- Homes ----------
export const HOME = {
  khonghucu: {
    name: 'Rumah Tionghoa', style: 'tionghoa', table: 'darkwood', culture: 'tionghoa',
    intro: 'Rumah keluarga Tionghoa: altar Tian (Thian) di depan pintu, meja abu leluhur di ruang tengah, dan dapur di belakang.',
    altar: 'Meja abu leluhur dengan papan nama (sinci), foto, hiolo, buah, dan teh.',
    kitchen: { id: 'dapur', name: 'Dapur Mama', vendor: { name: 'Mama Lian', attire: A('#c9a9c8', '#3a3a40', 'bun', { apron: '#efe8dc' }), lines: { hello: 'Lapar? Mama bikinkan bubur.', order: 'Tunggu ya, Mama siapkan {dish}.', cook: ['Sayur asinnya Mama bikin sendiri.'], serve: 'Makan dulu, nanti sembahyang leluhur.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['bubur-rumah', 'teh-tionghoa'] },
    family: [{ name: 'Akong', attire: A('#4a3a3a', '#2f2f35', 'gray'), from: 'Singkawang', job: 'pensiunan tukang emas', family: 'cucu kesayangan kamu', hobby: 'minum teh sore' }],
  },
  buddha: {
    name: 'Rumah dengan cetiya', style: 'cetiya', table: 'wood', culture: 'tionghoa',
    intro: 'Rumah keluarga Buddhis dengan cetiya (altar puja rumah): rupang Buddha, lilin, dupa, air, dan bunga.',
    altar: 'Cetiya: rupang Buddha di tempat tertinggi, lilin (terang), dupa (harum kebajikan), air & bunga (ketidakkekalan).',
    kitchen: { id: 'dapur', name: 'Dapur Ibu', vendor: { name: 'Ibu Mettā', attire: A('#e3c9a0', '#4a4a55', 'bun', { apron: '#8fae7a' }), lines: { hello: 'Ibu masak sayur, mau makan?', order: 'Sebentar, {dish}.', cook: ['Hari ini kita vegetarian, ya.'], serve: 'Makan dengan penuh kesadaran.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'teh-rumah'] },
    family: [{ name: 'Kakek Dharma', attire: A('#d9822b', '#5a4a3a', 'gray'), from: 'Tangerang', job: 'pensiunan', family: 'cucu kamu', hobby: 'meditasi pagi' }],
  },
  islam: {
    name: 'Rumah dengan musala', style: 'musala', table: 'wood', culture: 'minang',
    intro: 'Rumah keluarga Muslim: sudut musala dengan sajadah menghadap kiblat, Al-Qur’an di rehal, kaligrafi, dan keran wudu.',
    altar: 'Tidak ada altar: cukup tempat sholat yang bersih menghadap kiblat.',
    kitchen: { id: 'dapur', name: 'Dapur Ummi', vendor: { name: 'Ummi', attire: A('#3f8f6a', '#2f3b4a', 'hijab', { headColor: '#efe6d6' }), lines: { hello: 'Sudah makan? Ummi masak sayur.', order: 'Bismillah, Ummi siapkan {dish}.', cook: ['Masakan rumah, sederhana saja.'], serve: 'Makan, jangan lupa Bismillah.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'teh-rumah'] },
    family: [{ name: 'Abah', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Padang', job: 'pedagang kain', family: 'anak-anak & cucu', hobby: 'mengaji ba’da Subuh' }],
  },
  hindu: {
    name: 'Pekarangan Bali', style: 'bali', table: 'bamboo', culture: 'bali',
    intro: 'Rumah Bali dengan sanggah/merajan (pura keluarga) di sudut timur laut, bale, dan dapur paon.',
    altar: 'Sanggah/merajan: pelinggih untuk Hyang Widhi dan leluhur; canang dihaturkan setiap hari.',
    kitchen: { id: 'dapur', name: 'Paon (dapur) Meme', vendor: { name: 'Meme', attire: A('#f7f4ec', '#c06a24', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), lines: { hello: 'Sudah mesaiban? Meme masak nasi.', order: 'Nggih, {dish}.', cook: ['Masak dulu, saiban dulu, baru makan.'], serve: 'Rahajeng ngajeng.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'kopi-bali'] },
    family: [{ name: 'Kakiang', attire: A('#f7f4ec', '#3a4a3a', 'udeng', { headColor: '#f7f4ec' }), from: 'Gianyar', job: 'pemangku', family: 'cucu kamu', hobby: 'merawat merajan' }],
  },
  protestan: {
    name: 'Rumah keluarga Kristen', style: 'kristen', table: 'wood', culture: 'batak',
    intro: 'Rumah keluarga Kristen Protestan: salib di dinding, Alkitab di meja, sudut doa keluarga, dan meja makan untuk doa bersama.',
    altar: 'Tidak ada altar: Alkitab terbuka dan tempat untuk ibadah keluarga (mezbah keluarga).',
    kitchen: { id: 'dapur', name: 'Dapur Mama', vendor: { name: 'Mama', attire: A('#6c8fe0', '#3a3a48', 'bun', { apron: '#e8dcc8' }), lines: { hello: 'Sini makan, Mama masak.', order: '{dish}, sebentar ya.', cook: ['Nanti kita doa makan sama-sama.'], serve: 'Ayo, berdoa dulu.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'kopi-sidikalang'] },
    family: [{ name: 'Opung', attire: A('#3a3a48', '#2f2f35', 'gray', { collar: '#ffffff' }), from: 'Toba', job: 'pensiunan pendeta', family: 'cucu kamu', hobby: 'membaca Mazmur' }],
  },
  katolik: {
    name: 'Rumah keluarga Katolik', style: 'katolik', table: 'wood', culture: 'flores',
    intro: 'Rumah keluarga Katolik: altar keluarga dengan salib, patung Bunda Maria, lilin, dan rosario; air suci di dekat pintu.',
    altar: 'Altar keluarga: salib, patung Maria, lilin, bunga, rosario.',
    kitchen: { id: 'dapur', name: 'Dapur Mama', vendor: { name: 'Mama Agnes', attire: A('#9b7fd1', '#4a3a5a', 'bun', { apron: '#e8dcc8' }), lines: { hello: 'Ade, sudah makan?', order: 'Mama siapkan {dish}.', cook: ['Habis makan kita rosario ya.'], serve: 'Berdoa dulu, baru makan.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'kopi-bajawa'] },
    family: [{ name: 'Opa', attire: A('#5a4a6a', '#2f2f35', 'gray', { pendant: '#d8b14a' }), from: 'Ende', job: 'pensiunan', family: 'cucu kamu', hobby: 'rosario sore' }],
  },
  alam: {
    name: 'Pondok kebun', style: 'pondok', table: 'wood', culture: 'jawa',
    intro: 'Pondok kayu sederhana di kebun: teras, tanaman, dan teko teh hangat.',
    altar: '',
    kitchen: { id: 'dapur', name: 'Pawon', vendor: { name: 'Mbah Putri', attire: A('#a95a4a', '#3a3a40', 'gray'), lines: { hello: 'Ngeteh dulu, Le/Nduk.', order: 'Nggih, {dish}.', cook: ['Pakai tungku kayu, lebih sedap.'], serve: 'Monggo.', bag: 'Bawa ya.' } }, method: 'stir', dishes: ['sayur-rumah', 'wedang-jahe'] },
    family: [{ name: 'Mbah Kakung', attire: A('#7a6a5a', '#33333a', 'caping', { headColor: '#d9c38a' }), from: 'Klaten', job: 'petani', family: 'cucu kamu', hobby: 'menanam cabai' }],
  },
};

// The temple guide (pemandu) and a few visitors per sacred place, for small talk and questions.
export const TEMPLE_PEOPLE = {
  khonghucu: { guide: { name: 'Bio Kong Tjoe', attire: A('#b8322b', '#1f1d1b', 'rucap', { headColor: '#1f1d1b', wideSleeves: true }), from: 'Semarang', job: 'pengurus klenteng', family: 'umat sudah seperti keluarga', hobby: 'merawat hiolo' }, culture: 'tionghoa',
    visitors: [{ name: 'Ci Lani', attire: A('#d4423a', '#3a3a40', 'bun'), from: 'Jakarta', job: 'apoteker', family: 'ibu dua anak', hobby: 'ciam si tiap Imlek' }, { name: 'Koh Andi', attire: A('#3f5a7a', '#2b2b30'), from: 'Bandung', job: 'arsitek', family: 'baru menikah', hobby: 'fotografi klenteng' }] },
  buddha: { guide: { name: 'Romo Sudhamma', attire: A('#e0902c', '#5a4a3a', 'hair'), from: 'Jakarta', job: 'pandita vihara', family: 'sangha & umat', hobby: 'mengajar meditasi' }, culture: 'tionghoa',
    visitors: [{ name: 'Kak Citta', attire: A('#f3e6c9', '#4a4a55', 'bun'), from: 'Medan', job: 'guru', family: 'tinggal sama ibu', hobby: 'meditasi' }, { name: 'Om Teguh', attire: A('#7a8aa0', '#33333a'), from: 'Surabaya', job: 'pedagang', family: 'istri & anak', hobby: 'fangshen (melepas satwa) saat Waisak' }] },
  islam: { guide: { name: 'Ustaz Hamid', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Banten', job: 'pengurus masjid', family: 'istri & tiga anak', hobby: 'mengajar mengaji' }, culture: 'minang',
    visitors: [{ name: 'Bu Aisyah', attire: A('#3fa36b', '#2f3b4a', 'hijab', { headColor: '#e9e2d3' }), from: 'Makassar', job: 'dokter gigi', family: 'dua anak', hobby: 'tadarus' }, { name: 'Pak Yusuf', attire: A('#f4f1ea', '#3b4a3b', 'peci', { headColor: '#1f1f22' }), from: 'Medan', job: 'dosen', family: 'cucu satu', hobby: 'kaligrafi' }] },
  hindu: { guide: { name: 'Jero Mangku', attire: A('#ffffff', '#ffffff', 'udeng', { headColor: '#ffffff' }), from: 'Bangli', job: 'pemangku pura', family: 'umat banjar', hobby: 'menyiapkan banten' }, culture: 'bali',
    visitors: [{ name: 'Gek Ayu', attire: A('#f7f4ec', '#e3b341', 'bun', { sash: { style: 'waist', color: '#e2b33c' } }), from: 'Badung', job: 'mahasiswi', family: 'anak sulung', hobby: 'menari' }, { name: 'Bli Komang', attire: A('#f7f4ec', '#2f4a6a', 'udeng', { headColor: '#f7f4ec' }), from: 'Karangasem', job: 'nelayan', family: 'istri & bayi', hobby: 'melukis' }] },
  protestan: { guide: { name: 'Pdt. Sihombing', attire: A('#2b2b30', '#2b2b30', 'gray', { collar: '#ffffff' }), from: 'Tarutung', job: 'pendeta', family: 'jemaat', hobby: 'menulis khotbah' }, culture: 'batak',
    visitors: [{ name: 'Kak Debora', attire: A('#6c8fe0', '#3a3a48', 'bun'), from: 'Kupang', job: 'guru musik', family: 'adik tiga', hobby: 'main piano' }, { name: 'Bang Daniel', attire: A('#4a6a4a', '#2f2f35'), from: 'Ambon', job: 'pelaut', family: 'mama di Ambon', hobby: 'menyanyi' }] },
  katolik: { guide: { name: 'Frater Yohanes', attire: A('#f4f1ea', '#f4f1ea', 'hair', { pendant: '#d8b14a' }), from: 'Ruteng', job: 'frater', family: 'komunitas biara', hobby: 'merawat gua Maria' }, culture: 'flores',
    visitors: [{ name: 'Ibu Veronika', attire: A('#9b7fd1', '#4a3a5a', 'bun', { pendant: '#d8b14a' }), from: 'Yogyakarta', job: 'guru agama', family: 'empat anak', hobby: 'ziarah gua Maria' }, { name: 'Mas Ignatius', attire: A('#4a6a8a', '#2f2f35'), from: 'Semarang', job: 'insinyur', family: 'baru punya bayi', hobby: 'misdinar waktu kecil' }] },
  alam: { guide: { name: 'Pak Rimba', attire: A('#5f8f55', '#6a5a3a', 'caping', { headColor: '#d9c38a' }), from: 'Wonosobo', job: 'penjaga kebun', family: 'anak-anak di desa', hobby: 'mengamati burung' }, culture: 'jawa',
    visitors: [{ name: 'Mbak Laras', attire: A('#a9c6a0', '#3f3f48', 'bun'), from: 'Semarang', job: 'penulis', family: 'tinggal sendiri', hobby: 'jalan kaki pagi' }] },
};

// Small talk lines in culture flavour: address words, thanks, everyday expressions.
export const CULTURE = {
  tionghoa: { you: 'Koh/Ci', thanks: 'Kamsia', yes: 'Iya', wow: 'Aiya', bye: 'Hati-hati ya', food: 'makan dulu, makan dulu' },
  minang: { you: 'Uda/Uni', thanks: 'Terima kasih', yes: 'Iyo', wow: 'Masyaallah', bye: 'Assalamu’alaikum, hati-hati', food: 'makan dulu, Da/Ni' },
  bali: { you: 'Bli/Gek', thanks: 'Suksma', yes: 'Nggih', wow: 'Beh', bye: 'Om Shanti, hati-hati', food: 'rahajeng ngajeng' },
  batak: { you: 'Lae/Ito', thanks: 'Mauliate', yes: 'Olo', wow: 'Bah', bye: 'Horas, hati-hati', food: 'mangan ma jo' },
  flores: { you: 'Kaka/Ade', thanks: 'Terima kasih banyak', yes: 'Iyo', wow: 'Aduh mama', bye: 'Tuhan berkati, hati-hati', food: 'makan dulu, ade' },
  jawa: { you: 'Mas/Mbak', thanks: 'Matur nuwun', yes: 'Nggih', wow: 'Waduh', bye: 'Ngati-ati, nggih', food: 'monggo dahar' },
};
