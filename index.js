const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);
const app = express();
app.use(express.json());

app.post('/media', async (req, res) => {
  try {
    const { media_id, token } = req.body;

    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${media_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const metaData = await metaRes.json();

    const mediaRes = await fetch(metaData.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const buffer = await mediaRes.arrayBuffer();

    const tmpVideo = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
    const tmpFrame = path.join(os.tmpdir(), `frame_${Date.now()}.jpg`);
    fs.writeFileSync(tmpVideo, Buffer.from(buffer));

    await new Promise((resolve, reject) => {
      ffmpeg(tmpVideo)
        .screenshots({ count: 1, timemarks: ['00:00:01'], filename: path.basename(tmpFrame), folder: os.tmpdir() })
        .on('end', resolve)
        .on('error', reject);
    });

    const frameBuffer = fs.readFileSync(tmpFrame);
    const base64 = frameBuffer.toString('base64');

    fs.unlinkSync(tmpVideo);
    fs.unlinkSync(tmpFrame);

    res.json({ base64, mime_type: 'image/jpeg' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
