// Shared utilities for the Cosmic Contacts app.
// Used by both the CRM card and the App Page via npm workspaces.

export const APOD_START_DATE = new Date('1995-06-16');

export function toApodDate(raw) {
  if (!raw) return null;
  // HubSpot stores dates as Unix millisecond timestamps (e.g. "1776179820000")
  const isTimestamp = /^\d{10,13}$/.test(String(raw));
  const d = isTimestamp ? new Date(Number(raw)) : new Date(raw);
  if (isNaN(d.getTime())) return null;
  if (d < APOD_START_DATE) return '1995-06-16';
  const today = new Date();
  if (d > today) return today.toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
}

export function contactDisplayName(properties) {
  const parts = [properties.firstname, properties.lastname].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (properties.email || 'Unknown contact');
}

export function formatActivityDate(raw) {
  if (!raw) return null;
  const isTimestamp = /^\d{10,13}$/.test(String(raw));
  const d = isTimestamp ? new Date(Number(raw)) : new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function buildOutreachMessage(properties, hasActivity, snapshot, todayCosmos) {
  const name = properties.firstname || contactDisplayName(properties);
  const activityDateFormatted = formatActivityDate(
    properties.notes_last_contacted || properties.createdate
  );
  const dateLabel = hasActivity
    ? `the last time we connected (${activityDateFormatted})`
    : `when you first joined us (${activityDateFormatted})`;

  const lines = [
    `Hey ${name}!`,
    '',
    `Did you know that on ${dateLabel}, NASA's Astronomy Picture of the Day was "${snapshot.title}"?`,
    '',
    snapshot.explanation.length > 200
      ? snapshot.explanation.slice(0, 200) + '...'
      : snapshot.explanation,
  ];

  if (todayCosmos && !todayCosmos.error) {
    lines.push(
      '',
      `And today the cosmos is showing us "${todayCosmos.title}". Time to catch up — the universe hasn't slowed down!`
    );
  }

  lines.push('', 'Here\'s to more stellar moments together!');
  return lines.join('\n');
}
