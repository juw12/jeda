// Greeting card image generator: draws a holy-day greeting onto a canvas so a user can
// share it with friends of another faith (Web Share API) or download it as PNG.
// Everything is rendered on the device; nothing is uploaded.

import { sceneSvg, FESTIVE } from './scenes.js';

// Respectful, widely used greetings per holy day. Kept short and non-theological.
export const GREETINGS = {
  idulfitri: 'Selamat Idulfitri, mohon maaf lahir dan batin',
  iduladha: 'Selamat Iduladha',
  'tahun-baru-islam': 'Selamat Tahun Baru Islam',
  maulid: 'Selamat memperingati Maulid Nabi',
  natal: 'Selamat Natal, damai bagi kita semua',
  paskah: 'Selamat Paskah',
  imlek: 'Gong Xi Fa Cai — Selamat Tahun Baru Imlek',
  'cap-go-meh': 'Selamat Cap Go Meh',
  waisak: 'Selamat Hari Raya Waisak, semoga semua makhluk berbahagia',
  nyepi: 'Selamat Hari Raya Nyepi, Tahun Baru Saka',
  galungan: 'Rahajeng Galungan',
  kuningan: 'Rahajeng Kuningan',
  saraswati: 'Rahajeng Hari Saraswati',
  pagerwesi: 'Rahajeng Pagerwesi',
  'tiong-ciu': 'Selamat Festival Kue Bulan (Tiong Ciu)',
};

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const SCENE_HEIGHT = 700;
const FALLBACK_COLOR = '#d9a441';

export function faithForHoliday(content, holiday) {
  const id = holiday.faith === 'kristen' ? 'protestan' : holiday.faith;
  return content.faiths.find((faith) => faith.id === id) || null;
}

function loadSceneImage(svgMarkup) {
  const sized = svgMarkup.replace(
    '<svg ',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${SCENE_HEIGHT}" `,
  );
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  });
}

function wrapLines(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) {
    lines.push(line);
  }
  return lines;
}

// options: { holidayName, greeting, from, to, color, scene, decor, dateLabel }
export async function drawGreetingCard(canvas, options) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  const color = options.color || FALLBACK_COLOR;

  const background = context.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  background.addColorStop(0, '#0f1424');
  background.addColorStop(1, '#1b1410');
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const image = options.scene ? await loadSceneImage(sceneSvg(options.scene, 'dusk', '', options.decor)) : null;
  if (image) {
    try {
      context.drawImage(image, 0, 0, CARD_WIDTH, SCENE_HEIGHT);
    } catch {
      // Some browsers refuse SVG images on canvas; the card still works without the scene.
    }
  }
  const fade = context.createLinearGradient(0, SCENE_HEIGHT - 260, 0, SCENE_HEIGHT + 40);
  fade.addColorStop(0, 'rgba(20,18,22,0)');
  fade.addColorStop(1, 'rgba(20,18,22,1)');
  context.fillStyle = fade;
  context.fillRect(0, SCENE_HEIGHT - 260, CARD_WIDTH, 300);
  context.fillStyle = '#141216';
  context.fillRect(0, SCENE_HEIGHT + 40, CARD_WIDTH, CARD_HEIGHT - SCENE_HEIGHT - 40);

  context.fillStyle = color;
  context.fillRect(90, SCENE_HEIGHT - 10, 120, 8);

  context.textBaseline = 'top';
  context.fillStyle = color;
  context.font = '600 40px system-ui, "Segoe UI", sans-serif';
  context.fillText(options.holidayName || '', 90, SCENE_HEIGHT + 20);

  context.fillStyle = '#f4ecdf';
  context.font = '700 72px Georgia, "Times New Roman", serif';
  let y = SCENE_HEIGHT + 90;
  wrapLines(context, options.greeting || '', CARD_WIDTH - 180).slice(0, 4).forEach((line) => {
    context.fillText(line, 90, y);
    y += 88;
  });

  context.font = '400 38px system-ui, "Segoe UI", sans-serif';
  context.fillStyle = '#cfc4b4';
  y += 20;
  if (options.to) {
    context.fillText(`Untuk ${options.to}`, 90, y);
    y += 52;
  }
  if (options.from) {
    context.fillText(`Dari ${options.from}`, 90, y);
  }

  context.font = '600 30px system-ui, "Segoe UI", sans-serif';
  context.fillStyle = color;
  context.fillText('‖ Jeda', 90, CARD_HEIGHT - 80);
  context.fillStyle = '#8f8576';
  context.font = '400 26px system-ui, "Segoe UI", sans-serif';
  const footer = options.dateLabel || '';
  context.fillText(footer, CARD_WIDTH - 90 - context.measureText(footer).width, CARD_HEIGHT - 78);
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no-blob'))), 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

// Share via the OS share sheet when files can be shared; otherwise download the PNG.
export async function shareOrDownload(canvas, filename, text) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 2000);
  return 'downloaded';
}

export function decorForHoliday(holidayId) {
  return FESTIVE[holidayId] ? FESTIVE[holidayId].decor : null;
}
