// Ruang Live: a shareable room for a host (e.g. during a TikTok/Instagram Live) and their audience.
//
// Code format: 1 faith letter + 6 characters, e.g. "K7QX2MA" (easy to read aloud, no 0/O/1/I/L).
// The 6 characters are derived from SHA-256 of a secret only the host's device knows, so viewers can
// check that the "pemandu" (host) in the room is really the person who created the code.

import { CONFIG } from '../config.js';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const FAITH_LETTERS = { K: 'khonghucu', B: 'buddha', H: 'hindu', M: 'islam', P: 'protestan', C: 'katolik', A: 'alam' };
const LETTER_OF = Object.fromEntries(Object.entries(FAITH_LETTERS).map(([letter, faith]) => [faith, letter]));

export const SHARDS = 6; // ~6 × 15 viewers in full mesh; the host joins every shard
const HOST_KEY = 'jeda:v1:live-host';

function randomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function codeBody(secret) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`jeda-live:${secret}`)));
  return Array.from(digest.slice(0, 6), (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

export function parseCode(raw) {
  const code = normalizeCode(raw);
  if (code.length !== 7 || !FAITH_LETTERS[code[0]] || ![...code.slice(1)].every((c) => ALPHABET.includes(c))) {
    return null;
  }
  return { code, faith: FAITH_LETTERS[code[0]] };
}

export async function createLive(faithId) {
  const secret = randomSecret();
  const code = (LETTER_OF[faithId] || 'A') + (await codeBody(secret));
  const record = { code, secret, faith: faithId, startedAt: Date.now() };
  localStorage.setItem(HOST_KEY, JSON.stringify(record));
  return record;
}

export function hostingRecord(code) {
  try {
    const record = JSON.parse(localStorage.getItem(HOST_KEY) || 'null');
    return record && record.code === code ? record : null;
  } catch {
    return null;
  }
}

export function endHosting() {
  localStorage.removeItem(HOST_KEY);
}

export async function verifyHost(code, proof) {
  if (typeof proof !== 'string' || proof.length < 16 || proof.length > 64) {
    return false;
  }
  return code.slice(1) === (await codeBody(proof));
}

export function shardRooms(code) {
  return Array.from({ length: SHARDS }, (_, i) => `live-${code}-${i}`);
}

export function viewerShard(code) {
  const key = `jeda:live-shard:${code}`;
  let shard = Number(sessionStorage.getItem(key));
  if (!Number.isInteger(shard) || shard < 0 || shard >= SHARDS || sessionStorage.getItem(key) === null) {
    shard = Math.floor(Math.random() * SHARDS);
    sessionStorage.setItem(key, String(shard));
  }
  return `live-${code}-${shard}`;
}

export function liveUrl(code) {
  const base = location.origin && location.origin !== 'null' && !location.hostname.match(/^(127\.|localhost)/)
    ? `${location.origin}${location.pathname}`
    : CONFIG.publicUrl;
  return `${base.replace(/index\.html$/, '')}#/live/${code}`;
}

export function shortJoinHint() {
  return CONFIG.publicUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export async function qrSvg(text) {
  const { default: qrcode } = await import('../../vendor/qrcode-generator.js');
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
