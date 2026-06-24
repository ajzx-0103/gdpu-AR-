export class UIManager {
  constructor() {
    this.elements = {
      loading: document.getElementById('loading-screen'),
      loadingText: document.getElementById('loading-text'),
      sceneTitle: document.getElementById('scene-title'),
      hintText: document.getElementById('hint-text'),
      sidebar: document.getElementById('sidebar'),
      sceneList: document.getElementById('scene-list'),
      infoPanel: document.getElementById('info-panel'),
      infoTitle: document.getElementById('info-title'),
      infoContent: document.getElementById('info-content'),
      sandboxPanel: document.getElementById('sandbox-panel'),
      sandboxCanvas: document.getElementById('sandbox-canvas'),
      notification: document.getElementById('notification'),
      arOverlay: document.getElementById('ar-overlay'),
      btnExitAr: document.getElementById('btn-exit-ar'),
      btnMenu: document.getElementById('btn-menu'),
      btnCloseSidebar: document.getElementById('btn-close-sidebar'),
      btnSandbox: document.getElementById('btn-sandbox'),
      btnAudio: document.getElementById('btn-audio'),
      btnInfo: document.getElementById('btn-info'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      btnCloseInfo: document.getElementById('btn-close-info'),
      btnCloseSandbox: document.getElementById('btn-close-sandbox'),
      btnAr: document.getElementById('btn-ar'),
      btnEdit: document.getElementById('btn-edit')
    };

    this.isAudioOn = false;
    this.currentAudio = null;
    this.hotspotClickCallback = null;
    this.sandboxClickCallback = null;
    this.arModeCallback = null;

    this.setupListeners();
  }

  setupListeners() {
    this.elements.btnMenu.addEventListener('click', () => this.toggleSidebar());
    this.elements.btnCloseSidebar.addEventListener('click', () => this.closeSidebar());
    this.elements.btnCloseInfo.addEventListener('click', () => this.closeInfoPanel());
    this.elements.btnCloseSandbox.addEventListener('click', () => this.closeSandbox());
    this.elements.btnInfo.addEventListener('click', () => {
      this.elements.infoPanel.classList.toggle('open');
    });
    this.elements.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    this.elements.btnSandbox.addEventListener('click', () => this.toggleSandbox());

    this.elements.btnAudio.addEventListener('click', () => {
      this.isAudioOn = !this.isAudioOn;
      this.elements.btnAudio.textContent = this.isAudioOn ? '🔊' : '🔇';
      if (this.isAudioOn && this.currentAudio) {
        this.currentAudio.play();
      } else if (this.currentAudio) {
        this.currentAudio.pause();
      }
    });

    this.elements.btnAr.addEventListener('click', () => {
      this.showNotification('AR模式开发中，敬请期待');
    });

    this.elements.btnEdit.addEventListener('click', () => {
      if (this.editModeCallback) this.editModeCallback();
    });
  }

  hideLoading() {
    this.elements.loading.classList.add('hidden');
  }

  updateSceneTitle(name) {
    this.elements.sceneTitle.textContent = name;
  }

  hideHint() {
    this.elements.hintText.style.opacity = '0';
  }

  toggleSidebar() {
    this.elements.sidebar.classList.toggle('open');
  }

  closeSidebar() {
    this.elements.sidebar.classList.remove('open');
  }

  populateSceneList(scenes, currentId, onClick) {
    this.elements.sceneList.innerHTML = '';
    for (const scene of scenes) {
      const item = document.createElement('div');
      item.className = 'scene-item' + (scene.id === currentId ? ' active' : '');
      item.innerHTML = `
        <div class="scene-item-thumb">📷</div>
        <div class="scene-item-info">
          <div class="scene-item-name">${scene.name}</div>
          <div class="scene-item-desc">${scene.description || ''}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        onClick(scene.id);
        this.closeSidebar();
      });
      this.elements.sceneList.appendChild(item);
    }
  }

  updateActiveSceneInList(sceneId) {
    const items = this.elements.sceneList.querySelectorAll('.scene-item');
    items.forEach(item => item.classList.remove('active'));
    const index = Array.from(items).findIndex(item => {
      const name = item.querySelector('.scene-item-name')?.textContent;
      return name === sceneId;
    });
    if (index >= 0) items[index]?.classList.add('active');
  }

  showInfo(title, content) {
    this.elements.infoTitle.textContent = title;
    this.elements.infoContent.textContent = content;
    this.elements.infoPanel.classList.add('open');
  }

  closeInfoPanel() {
    this.elements.infoPanel.classList.remove('open');
  }

  toggleSandbox() {
    this.elements.sandboxPanel.classList.toggle('open');
  }

  closeSandbox() {
    this.elements.sandboxPanel.classList.remove('open');
  }

  drawSandbox(scenes, currentSceneId) {
    const canvas = this.elements.sandboxCanvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const mapImg = new Image();
    mapImg.onload = () => {
      const imgW = mapImg.width;
      const imgH = mapImg.height;
      const scale = Math.min(w / imgW, h / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (w - drawW) / 2;
      const offsetY = (h - drawH) / 2;
      ctx.drawImage(mapImg, offsetX, offsetY, drawW, drawH);

      const mapLeft = offsetX;
      const mapTop = offsetY;

      for (const s of scenes) {
        if (!s.mapPosition) continue;
        const cx = mapLeft + (s.mapPosition.x / 100) * drawW;
        const cy = mapTop + (s.mapPosition.y / 100) * drawH;
        const isCurrent = s.id === currentSceneId;

        ctx.beginPath();
        ctx.arc(cx, cy, isCurrent ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? '#4fc3f7' : '#7c4dff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isCurrent ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(s.name, cx, cy + 20);
        ctx.shadowBlur = 0;
      }

      const getSceneAt = (mx, my) => {
        for (const s of scenes) {
          if (!s.mapPosition) continue;
          const cx2 = mapLeft + (s.mapPosition.x / 100) * drawW;
          const cy2 = mapTop + (s.mapPosition.y / 100) * drawH;
          if (Math.sqrt((mx - cx2)**2 + (my - cy2)**2) < 25) return s;
        }
        return null;
      };

      const onClick = (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX || e.changedTouches?.[0]?.clientX) - r.left;
        const my = (e.clientY || e.changedTouches?.[0]?.clientY) - r.top;
        const hit = getSceneAt(mx, my);
        if (hit && this.sandboxClickCallback) {
          this.sandboxClickCallback(hit.id);
          this.closeSandbox();
        }
      };

      canvas.onclick = onClick;
      canvas.ontouchend = onClick;
    };
    const tip = document.getElementById('sandbox-tip');
    tip.textContent = '点击标记切换场景';

    mapImg.src = '/assets/textures/campus-map.jpg';
    mapImg.onerror = () => {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4fc3f7';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('地图加载失败', w/2, h/2);
    };
  }

  setAudio(src) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (src) {
      this.currentAudio = new Audio(src);
      this.currentAudio.loop = false;
      if (this.isAudioOn) {
        this.currentAudio.play();
      }
    }
  }

  showNotification(text, duration = 2000) {
    this.elements.notification.textContent = text;
    this.elements.notification.classList.add('show');
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      this.elements.notification.classList.remove('show');
    }, duration);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  onHotspotClick(callback) {
    this.hotspotClickCallback = callback;
  }

  onSandboxClick(callback) {
    this.sandboxClickCallback = callback;
  }

  onArMode(callback) {
    this.arModeCallback = callback;
  }

  onEditMode(callback) {
    this.editModeCallback = callback;
  }

  updateEditButtonLabel(isEditing) {
    this.elements.btnEdit.textContent = isEditing ? '✅ 完成' : '✏️ 编辑';
  }
}
