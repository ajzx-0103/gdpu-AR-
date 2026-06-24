export class SceneManager {
  constructor(viewer, onSceneChange) {
    this.viewer = viewer;
    this.onSceneChange = onSceneChange;
    this.onHotspotClick = null;
    this.scenesData = [];
    this.currentSceneId = null;
    this.hotspotElements = [];
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
    try {
      const res = await fetch(`/api/scenes/${sceneId}`);
      const data = await res.json();
      return data.scene;
    } catch {
      return null;
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
