const express = require('express');
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
    const base64 = Buffer.from(buffer).toString('base64');

    res.json({
      base64: base64,
      mime_type: metaData.mime_type
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
