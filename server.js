app.get('/api/stream/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

    if (audioFormats.length === 0) {
      return res.status(404).json({ error: 'No se encontró pista de audio' });
    }

    // Retornar la URL directa del mejor formato de audio
    const format = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' });
    return res.json({ audioUrl: format.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});