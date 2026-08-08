const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

// Buscar canciones de cualquier artista comercial
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Falta término de búsqueda' });

    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 20).map((v) => ({
      id: v.videoId,
      title: v.title,
      artist: v.author.name,
      duration: v.seconds,
      artwork: v.thumbnail,
    }));

    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener la canción completa en MP3
app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      return res.status(404).json({ error: 'No se encontró pista de audio' });
    }

    res.json({ audioUrl: audioFormats[0].url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de música listo en puerto ${PORT}`));