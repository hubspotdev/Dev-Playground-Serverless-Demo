exports.main = async (context) => {
  const apiKey = process.env.NASA_API_KEY;
  const date = context.parameters?.date;

  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`
    + (date ? `&date=${date}` : '');

  const res = await fetch(url);
  const data = await res.json();

  return {
    title: data.title,
    image_url: data.url,
    hd_image_url: data.hdurl || data.url,
    explanation: data.explanation,
    date: data.date,
    media_type: data.media_type
  };
};
