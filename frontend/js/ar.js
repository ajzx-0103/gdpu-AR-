import * as THREE from 'three';

export class ARMode {
  constructor(viewer) {
    this.viewer = viewer;
    this.isActive = false;
    this.arScene = null;
    this.arCamera = null;
    this.arRenderer = null;
    this.arSession = null;
    this.refSpace = null;
    this.originalRendererSize = null;
  }

  async isSupported() {
    if (!navigator.xr) return false;
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      return supported;
    } catch {
      return false;
    }
  }

  async enter() {
    if (this.isActive) return;

    if (!await this.isSupported()) {
      throw new Error('您的设备不支持 WebXR AR 模式');
    }

    try {
      this.arSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local']
      });

      this.originalRendererSize = new THREE.Vector2();
      this.viewer.renderer.getSize(this.originalRendererSize);

      this.arScene = new THREE.Scene();
      this.arScene.add(this.viewer.scene);

      this.arCamera = new THREE.PerspectiveCamera();
      this.arCamera.matrixAutoUpdate = false;

      this.arRenderer = new THREE.WebGLRenderer({
        context: this.viewer.renderer.getContext(),
        antialias: true,
        alpha: true
      });

      this.arRenderer.setPixelRatio(window.devicePixelRatio);
      this.arRenderer.setSize(window.innerWidth, window.innerHeight);
      this.arRenderer.xr.enabled = true;

      this.arSession.updateRenderState({
        baseLayer: new XRWebGLLayer(this.arSession, this.arRenderer.getContext())
      });

      this.refSpace = await this.arSession.requestReferenceSpace('local');

      const viewerPose = await this.arSession.requestAnimationFrame((time, frame) => {
        this.renderAR(frame);
      });

      this.isActive = true;

      this.arSession.addEventListener('end', () => {
        this.exit();
      });

      return true;
    } catch (err) {
      throw new Error(`AR 启动失败: ${err.message}`);
    }
  }

  renderAR(frame) {
    if (!this.isActive) return;

    const session = this.arSession;
    const pose = frame.getViewerPose(this.refSpace);

    if (pose) {
      for (const view of pose.views) {
        const viewport = session.renderState.baseLayer.getViewport(view);
        this.arRenderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);

        this.arCamera.matrix.fromArray(view.transform.matrix);
        this.arCamera.projectionMatrix.fromArray(view.projectionMatrix);
        this.arCamera.updateMatrixWorld(true);

        this.arRenderer.render(this.arScene, this.arCamera);
      }
    }

    this.arSession.requestAnimationFrame((t, f) => this.renderAR(f));
  }

  exit() {
    this.isActive = false;
    if (this.arSession) {
      try { this.arSession.end(); } catch {}
      this.arSession = null;
    }

    this.viewer.renderer.xr.enabled = false;
    if (this.originalRendererSize) {
      this.viewer.renderer.setSize(this.originalRendererSize.x, this.originalRendererSize.y);
    }

    if (this.arScene) {
      this.arScene.remove(this.viewer.scene);
      this.arScene = null;
    }

    this.arCamera = null;
    this.arRenderer = null;
    this.refSpace = null;
  }

  dispose() {
    this.exit();
  }
}
