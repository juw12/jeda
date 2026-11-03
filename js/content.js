// Loads content JSON and applies the review-status visibility rule.

import { CONFIG } from './config.js';

let cache = null;

async function getJson(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Gagal memuat ${path} (${response.status})`);
  }
  return response.json();
}

export function isVisible(item) {
  return item.status === 'approved' || CONFIG.showDrafts;
}

export async function loadContent() {
  if (cache) {
    return cache;
  }
  const [meta, places, calendar, ceremonies, scriptures, ciamsi] = await Promise.all([
    getJson('content/faiths.json'),
    getJson('content/places.json'),
    getJson('content/calendar.json'),
    getJson('content/ceremonies.json'),
    getJson('content/scriptures.json'),
    getJson('content/ciamsi.json'),
  ]);

  const entryFiles = [...meta.faiths.filter((faith) => faith.pustaka).map((faith) => faith.id), 'lintas'];
  const entryLists = await Promise.all(
    entryFiles.map((id) => getJson(`content/entries/${id}.json`).catch(() => [])),
  );
  const allEntries = entryLists.flat();

  cache = {
    sections: meta.sections,
    faiths: meta.faiths,
    entries: allEntries.filter(isVisible),
    rawEntries: allEntries,
    allEntriesCount: allEntries.length,
    places: places.filter((place) => place.status !== 'removed'),
    calendarOverrides: calendar.overrides,
    ceremonies: ceremonies.filter(isVisible),
    scriptures,
    ciamsi,
  };
  return cache;
}

export function faithById(content, id) {
  return content.faiths.find((faith) => faith.id === id);
}

export function entryById(content, id) {
  return content.entries.find((entry) => entry.id === id);
}

export function entriesFor(content, faithId, sectionId) {
  return content.entries.filter((entry) => {
    const faithMatch = entry.faith === faithId;
    const sectionMatch = !sectionId || entry.section === sectionId;
    return faithMatch && sectionMatch;
  });
}

// True when the entry applies to the user's chosen streams (or to all streams).
export function appliesToStreams(entry, streams) {
  if (!entry.streams || entry.streams.length === 0 || !streams || streams.length === 0) {
    return true;
  }
  return entry.streams.some((stream) => streams.includes(stream));
}
