const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

const scenesData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'scenes.json'), 'utf-8')
);

app.get('/api/scenes', (req, res) => {
  const summaries = scenesData.scenes.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    thumbnail: s.thumbnail,
    mapPosition: s.mapPosition
  }));
  res.json({ scenes: summaries });
});

app.get('/api/scenes/:id', (req, res) => {
  const scene = scenesData.scenes.find(s => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ error: '场景未找到' });
  }
  res.json({ scene });
});

app.get('/api/scenes/:id/hotspots', (req, res) => {
  const scene = scenesData.scenes.find(s => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ error: '场景未找到' });
  }
  res.json({ hotspots: scene.hotspots });
});

app.post('/api/visit/record', (req, res) => {
  const { sceneId, duration } = req.body;
  console.log(`[访问记录] 场景: ${sceneId}, 停留: ${duration}秒`);
  res.json({ success: true });
});

module.exports = app;
