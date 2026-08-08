const express = require('express');
const cors = require('cors');
const ytsr = require('ytsr');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

// Función para limpiar nombres
const limpiarTitulo = (titulo) => {
  return titulo
    .replace(/[\(\[\{](official|lyric|video|audio|visualizer|oficial|letra|4k|hd|music video|full song).*?[\)\]\}]/gi, '')
    .replace(/official video|lyric video|video oficial|audio oficial|letra/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// 1. Buscar canciones con portada HD cuadrada
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Falta la búsqueda' });

    const searchResults = await ytsr(query, { limit: 15 });
    const items = searchResults.items.filter(item => item.type === 'video');

    const canciones = items.map(item => {
      // Convertir miniatura de YouTube a portada HD de alta calidad
      let artworkUrl = item.bestThumbnail?.url || '';
      if (artworkUrl.includes('hqdefault') || artworkUrl.includes('mqdefault')) {
        artworkUrl = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
      }

      return {
        id: item.id,
        title: limpiarTitulo(item.title),
        artist: item.author?.name || 'Artista',
        duration: item.duration,
        artwork: artworkUrl,
      };
    });

    res.json(canciones);
  } catch (err) {
    console.error('Error en búsqueda:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Transmisión de Audio corregida
app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Obtener información y filtrar por mejor formato de audio solo
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (format && format.url) {
      return res.json({ audioUrl: format.url });
    } else {
      return res.status(404).json({ error: 'No se encontró audio disponible' });
    }
  } catch (err) {
    console.error('Error obteniendo stream:', err);
    res.status(500).json({ error: 'Error del servidor al procesar audio' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));