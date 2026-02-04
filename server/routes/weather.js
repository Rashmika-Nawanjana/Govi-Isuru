const express = require('express');
const axios = require('axios');

const router = express.Router();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

function requireApiKey(res) {
  if (!WEATHER_API_KEY) {
    res.status(500).json({ error: 'WEATHER_API_KEY not set in environment' });
    return true;
  }
  return false;
}

router.get('/geocode', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (requireApiKey(res)) return;

  try {
    const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: query,
        limit: 1,
        appid: WEATHER_API_KEY,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch geocode data' });
  }
});

router.get('/current', async (req, res) => {
  const { lat, lon, units = 'metric' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  if (requireApiKey(res)) return;

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        units,
        appid: WEATHER_API_KEY,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch current weather' });
  }
});

router.get('/forecast', async (req, res) => {
  const { lat, lon, units = 'metric' } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  if (requireApiKey(res)) return;

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        units,
        appid: WEATHER_API_KEY,
      },
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({ error: 'Failed to fetch forecast data' });
  }
});

module.exports = router;
