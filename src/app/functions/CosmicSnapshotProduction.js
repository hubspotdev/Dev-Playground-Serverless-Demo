exports.main = async (context) => {
  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    return {
      error: "NASA_API_KEY secret is not configured.",
      message: "Run: hs secret add NASA_API_KEY"
    };
  }

  // Accept date from parameters (app page) or from CRM record properties (card)
  // Prefer last contacted date, fall back to create date
  let date = context.parameters?.date;
  if (!date) {
    const raw = context.propertiesToSend?.notes_last_contacted
      || context.propertiesToSend?.createdate;
    if (raw) {
      // HubSpot stores dates as Unix millisecond timestamps (e.g. "1776179820000").
      // new Date("1776179820000") fails — must convert to a number first.
      const isTimestamp = /^\d{10,13}$/.test(String(raw));
      const d = isTimestamp ? new Date(Number(raw)) : new Date(raw);
      date = d.toISOString().split('T')[0];
    }
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      error: `Invalid date format: ${date}`,
      message: "Date must be YYYY-MM-DD."
    };
  }

  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`
    + (date ? `&date=${date}` : '');

  const timedFetch = async (attempt) => {
    const start = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const elapsed = Date.now() - start;
      console.log(`[CosmicSnapshot] attempt=${attempt} status=${r.status} elapsed=${elapsed}ms date=${date || 'today'}`);
      return r;
    } catch (err) {
      const elapsed = Date.now() - start;
      console.log(`[CosmicSnapshot] attempt=${attempt} FAILED err=${err.name} elapsed=${elapsed}ms date=${date || 'today'}`);
      throw err;
    }
  };

  let res;
  try {
    res = await timedFetch(1);
  } catch (firstErr) {
    try {
      res = await timedFetch(2);
    } catch (retryErr) {
      const isTimeout = retryErr.name === 'TimeoutError' || retryErr.name === 'AbortError';
      return {
        error: isTimeout
          ? 'NASA API did not respond after 2 attempts (8s each)'
          : `Network error: ${retryErr.message}`,
        debug: { type: 'fetch_exception', name: retryErr.name, message: retryErr.message, attempts: 2, url }
      };
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      error: `NASA API ${res.status} ${res.statusText}`,
      debug: { type: 'http_error', status: res.status, body: body.slice(0, 500), url }
    };
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    return {
      error: `Failed to parse response: ${err.message}`,
      debug: { type: 'json_parse_error', url }
    };
  }

  if (!data.url) {
    return {
      error: "APOD response missing image URL.",
      debug: { type: 'missing_field', keys: Object.keys(data), url }
    };
  }

  return {
    title: data.title || "Untitled",
    image_url: data.url,
    hd_image_url: data.hdurl || data.url,
    explanation: data.explanation || "",
    date: data.date || date || "today",
    media_type: data.media_type || "image"
  };
};
