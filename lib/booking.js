import fs from 'node:fs/promises';
import path from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDate(value) {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

export function iso(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function nightsBetween(checkIn, checkOut) {
  return Math.round((toDate(checkOut).getTime() - toDate(checkIn).getTime()) / DAY_MS);
}

export function datesInRange(start, endExclusive) {
  const out = [];
  for (let d = toDate(start); d < toDate(endExclusive); d = addDays(d, 1)) out.push(iso(d));
  return out;
}

async function loadLocalConfig() {
  const file = path.join(process.cwd(), 'data', 'bookings.json');
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function loadS3Config() {
  const bucket = process.env.BOOKING_CONFIG_S3_BUCKET;
  if (!bucket) return null;

  const key = process.env.BOOKING_CONFIG_S3_KEY || 'calendar/bookings.json';
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2' });
  const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const text = await result.Body.transformToString();
  return JSON.parse(text);
}

export async function loadConfig() {
  return (await loadS3Config()) || await loadLocalConfig();
}

function parseIcsDate(raw) {
  if (!raw) return null;
  const v = raw.trim();
  if (/^\d{8}$/.test(v)) return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

export async function fetchIcalBlocks() {
  const url = process.env.AIRBNB_ICAL_URL;
  if (!url) return [];
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`iCal fetch failed: ${res.status}`);
  const text = await res.text();
  const blocks = [];
  for (const event of text.split('BEGIN:VEVENT').slice(1)) {
    const start = parseIcsDate(event.match(/DTSTART(?:;VALUE=DATE)?:([^\r\n]+)/)?.[1]);
    const end = parseIcsDate(event.match(/DTEND(?:;VALUE=DATE)?:([^\r\n]+)/)?.[1]);
    const summary = event.match(/SUMMARY:([^\r\n]+)/)?.[1] || 'Calendar block';
    if (start && end) blocks.push({ start, end, source: 'airbnb-ical', note: summary });
  }
  return blocks;
}

export async function getBlocks() {
  const config = await loadConfig();
  let icalBlocks = [];
  try { icalBlocks = await fetchIcalBlocks(); } catch (e) { console.error(e); }
  return { config, blocks: [...(config.blockedDates || []), ...icalBlocks] };
}

export function getAvailabilityForRange(start, endExclusive, blocks, config) {
  return datesInRange(start, endExclusive).map(date => {
    const block = blocks.find(b => date >= b.start && date < b.end);
    return {
      date,
      available: !block,
      source: block?.source || 'available',
      note: block?.note || '',
      nightlyCents: config.baseNightlyCents
    };
  });
}

export async function getAvailabilityPayload({ start, end }) {
  const effectiveStart = start || iso(new Date());
  const effectiveEnd = end || iso(addDays(toDate(effectiveStart), 90));
  const { config, blocks } = await getBlocks();
  return {
    start: effectiveStart,
    end: effectiveEnd,
    minimumNights: config.minimumNights,
    maxGuests: config.maxGuests,
    baseNightlyCents: config.baseNightlyCents,
    cleaningFeeCents: config.cleaningFeeCents,
    depositPercent: config.depositPercent,
    days: getAvailabilityForRange(effectiveStart, effectiveEnd, blocks, config)
  };
}

export async function validateStay({ checkIn, checkOut, guests }) {
  const { config, blocks } = await getBlocks();
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < config.minimumNights) throw new Error(`Minimum stay is ${config.minimumNights} nights.`);
  if (Number(guests) > config.maxGuests) throw new Error(`Maximum guests is ${config.maxGuests}.`);
  const days = getAvailabilityForRange(checkIn, checkOut, blocks, config);
  const blocked = days.filter(d => !d.available);
  if (blocked.length) throw new Error(`Those dates are not available: ${blocked.map(d => d.date).join(', ')}`);
  const subtotalCents = nights * config.baseNightlyCents + config.cleaningFeeCents;
  const depositCents = Math.round(subtotalCents * config.depositPercent);
  return { config, nights, subtotalCents, depositCents };
}
