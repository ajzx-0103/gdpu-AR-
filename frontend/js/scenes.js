export class SceneManager {
  constructor(viewer, onSceneChange) {
    this.viewer = viewer;
    this.onSceneChange = onSceneChange;
    this.onHotspotClick = null;
    this.scenesData = [];
    this.currentSceneId = null;
    this.hotspotElements = [];
    this.sceneCache = {};
    this.preloadedImages = {};
  }

  onHotspotClicked(callback) {
    this.onHotspotClick = callback;
  }

  async loadScenes() {
    try {
      const res = await fetch('/api/scenes');
      const data = await res.json();
      this.scenesData = data.scenes;
      return data.scenes;
    } catch {
      return [];
    }
  }

  async loadSceneDetail(sceneId) {
    if (this.sceneCache[sceneId]) {
      return this.sceneCache[sceneId];
    }
    try {
      const res = await fetch(`/api/scenes/${sceneId}`);
      const data = await res.json();
      this.sceneCache[sceneId] = data.scene;
      return data.scene;
    } catch {
      return null;
    }
  }

  preloadImage(url) {
    if (this.preloadedImages[url]) return;
    this.preloadedImages[url] = true;
    const img = new Image();
    img.src = url;
  }

  async preloadAdjacentScenes(scene) {
    if (!scene.hotspots) return;
    const targetIds = new Set();
    for (const hs of scene.hotspots) {
      if (hs.type === 'scene' && hs.targetScene) {
        targetIds.add(hs.targetScene);
      }
    }
    for (const id of targetIds) {
      this.loadSceneDetail(id).then(s => {
        if (s) this.preloadImage(s.panorama);
      });
    }
  }

  async switchToScene(sceneId) {
    if (sceneId === this.currentSceneId) return;
    const scene = await this.loadSceneDetail(sceneId);
    if (!scene) return;

    this.currentSceneId = sceneId;
    await this.viewer.loadPhoto(scene.panorama);
    this.clearHotspots();

    const elements = [];
    if (scene.hotspots) {
      for (const hs of scene.hotspots) {
        const el = this.viewer.createHotspot(hs, (hotspot) => {
          if (this.onHotspotClick) {
            this.onHotspotClick(hotspot);
          } else {
            this.handleHotspotClick(hotspot);
          }
        });
        elements.push(el);
      }
    }
    this.hotspotElements = elements;

    if (this.onSceneChange) {
      this.onSceneChange(scene);
    }

    this.preloadAdjacentScenes(scene);
  }

  clearHotspots() {
    this.viewer.clearHotspots();
    this.hotspotElements = [];
  }

  handleHotspotClick(hotspot) {
    if (hotspot.type === 'scene' && hotspot.targetScene) {
      this.switchToScene(hotspot.targetScene);
    }
  }
}
