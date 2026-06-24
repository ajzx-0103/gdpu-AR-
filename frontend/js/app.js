import { PhotoViewer } from './viewer.js';
import { SceneManager } from './scenes.js';
import { UIManager } from './ui.js';

class CampusApp {
  constructor() {
    this.viewer = null;
    this.sceneManager = null;
    this.ui = null;
    this.scenes = [];

    this.init();
  }

  async init() {
    this.viewer = new PhotoViewer(document.getElementById('container'));
    this.sceneManager = new SceneManager(this.viewer, (scene) => this.onSceneChange(scene));
    this.ui = new UIManager();

    this.setupCallbacks();

    this.scenes = await this.sceneManager.loadScenes();

    if (this.scenes.length === 0) {
      this.scenes = this.getDefaultScenes();
    }

    this.ui.populateSceneList(this.scenes, null, (id) => this.switchToScene(id));

    await this.switchToScene(this.scenes[0]?.id);

    this.ui.hideLoading();
    setTimeout(() => this.ui.hideHint(), 5000);
  }

  getDefaultScenes() {
    return [
      { id: 'door', name: '校门', description: '学校正门', mapPosition: { x: 1, y: 18 } },
      { id: 'door-in', name: '校门内侧', description: '进入校门后的视角', mapPosition: { x: 10, y: 15 } },
      { id: 'right-in', name: '校门右侧', description: '校门右侧区域', mapPosition: { x: 10, y: 23 } },
      { id: 'main-way', name: '主大道', description: '校园主干道', mapPosition: { x: 40, y: 19 } },

      { id: 'third-canteen', name: '第三食堂', description: '学生第三食堂', mapPosition: { x: 60, y: 19 } },

      { id: 'playground', name: '操场', description: '学校操场与运动区', mapPosition: { x: 30, y: 32 } },
      { id: 'gymnasium', name: '体育馆', description: '学校体育馆', mapPosition: { x: 30, y: 22 } },
      { id: 'south-door', name: '南门', description: '学校南门', mapPosition: { x: 33, y: 98 } },

      { id: 'teaching-building', name: '教学楼', description: '学校教学楼', mapPosition: { x: 34, y: 70 } },
      { id: 'way-to-library-lab-building', name: '通往图书馆实验楼路', description: '通往图书馆与实验楼的道路', mapPosition: { x: 50, y: 66 } },
      { id: 'first-second-careen', name: '一二食堂', description: '第一、第二食堂', mapPosition: { x: 30, y: 42 } },
      { id: 'basketball-ground', name: '篮球场', description: '学校篮球场', mapPosition: { x: 24, y: 45 } },
      { id: 'artificial-lake', name: '人工湖', description: '校园人工湖', mapPosition: { x: 60, y: 50 } },
      { id: 'library', name: '图书馆', description: '学校图书馆', mapPosition: { x: 78, y: 58 } },
      { id: 'near-library', name: '图书馆附近', description: '图书馆周边区域', mapPosition: { x: 66, y: 75 } },
      { id: 'expressstation-and-infirmary', name: '快递站与医务室', description: '学校快递站与医务室', mapPosition: { x: 76, y: 25 } },
      { id: 'car-way', name: '车行道', description: '校园车行道', mapPosition: { x: 50, y: 89 } }
    ];
  }

  setupCallbacks() {
    this.sceneManager.onHotspotClicked((hotspot) => {
      if (hotspot.type === 'scene') {
        this.switchToScene(hotspot.targetScene);
      } else if (hotspot.type === 'info') {
        this.ui.showInfo(hotspot.title, hotspot.content);
        this.ui.showNotification(hotspot.title);
      }
    });

    this.ui.onSandboxClick((sceneId) => this.switchToScene(sceneId));

    this.ui.onEditMode(() => this.toggleEditMode());
  }

  async toggleEditMode() {
    if (this.viewer.getEditMode()) {
      this.viewer.toggleEditMode();
      this.ui.updateEditButtonLabel(false);
      this.ui.showNotification('编辑模式已退出');
    } else {
      const scene = await this.sceneManager.loadSceneDetail(this.sceneManager.currentSceneId);
      if (scene && scene.hotspots) {
        const spots = JSON.parse(JSON.stringify(scene.hotspots));
        this.viewer.toggleEditMode();
        this.viewer.setEditHotspotData(spots);
        this.ui.updateEditButtonLabel(true);
        this.ui.showNotification('编辑模式：拖动热点到正确位置，点击照片添加新热点');
      } else {
        this.viewer.toggleEditMode();
        this.viewer.setEditHotspotData([]);
        this.ui.updateEditButtonLabel(true);
        this.ui.showNotification('编辑模式：点击照片添加新热点');
      }
    }
  }

  async switchToScene(sceneId) {
    this.ui.closeInfoPanel();
    this.ui.closeSandbox();
    await this.sceneManager.switchToScene(sceneId);
    this.ui.hideHint();
  }

  onSceneChange(sceneData) {
    this.ui.updateSceneTitle(sceneData.name);
    this.ui.populateSceneList(this.scenes, sceneData.id, (id) => this.switchToScene(id));
    this.ui.drawSandbox(this.scenes, sceneData.id, false);
    this.ui.setAudio(sceneData.audio || null);
  }
}

new CampusApp();
