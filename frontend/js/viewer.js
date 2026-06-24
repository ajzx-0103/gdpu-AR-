export class PhotoViewer {
  constructor(container) {
    this.container = container;
    this.editMode = false;
    this.currentHotspotData = [];

    this.photoEl = document.createElement('div');
    this.photoEl.className = 'photo-viewer';
    Object.assign(this.photoEl.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center', transition: 'opacity 0.6s ease'
    });
    this.container.appendChild(this.photoEl);

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'hotspot-overlay';
    Object.assign(this.overlayEl.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none'
    });
    this.container.appendChild(this.overlayEl);

    this.editOverlay = document.createElement('div');
    this.editOverlay.className = 'edit-overlay';
    Object.assign(this.editOverlay.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      pointerEvents: 'none', display: 'none'
    });
    this.container.appendChild(this.editOverlay);

    this.coordDisplay = document.createElement('div');
    Object.assign(this.coordDisplay.style, {
      position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)', color: '#4fc3f7', padding: '8px 16px',
      borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace',
      zIndex: '200', display: 'none', pointerEvents: 'none'
    });
    document.body.appendChild(this.coordDisplay);

    this.isTransitioning = false;
    this.currentSrc = null;
    this.clickListeners = [];
    this.editHotspotElements = [];
  }

  loadPhoto(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.photoEl.style.opacity = '0';
        setTimeout(() => {
          this.photoEl.style.backgroundImage = `url(${imageUrl})`;
          this.photoEl.style.opacity = '1';
          this.isTransitioning = false;
          this.currentSrc = imageUrl;
          resolve();
        }, 300);
      };
      img.onerror = () => {
        this.photoEl.style.backgroundImage = `url(${imageUrl})`;
        this.photoEl.style.backgroundColor = '#1a1a2e';
        this.currentSrc = imageUrl;
        resolve();
      };
      img.src = imageUrl;
    });
  }

  clearHotspots() {
    this.overlayEl.innerHTML = '';
  }

  createHotspot(hotspotData, onClick) {
    const { x, y } = hotspotData.position;
    const isScene = hotspotData.type === 'scene';
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: '48px', height: '48px',
      borderRadius: '50%',
      background: isScene
        ? 'radial-gradient(circle, rgba(79,195,247,0.9) 0%, rgba(79,195,247,0.3) 70%, transparent 100%)'
        : 'radial-gradient(circle, rgba(255,213,79,0.9) 0%, rgba(255,213,79,0.3) 70%, transparent 100%)',
      cursor: 'pointer',
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      color: '#fff',
      boxShadow: '0 0 20px rgba(79,195,247,0.4)',
      animation: 'hotspotPulse 2s ease-in-out infinite',
      zIndex: '10',
      border: '2px solid rgba(255,255,255,0.6)'
    });
    const iconMap = { arrow: '→', left: '←', up: '↑', down: '↓', nw: '↖', sw: '↙', ne: '↗', se: '↘', info: 'i' };
    el.textContent = hotspotData.icon ? (iconMap[hotspotData.icon] || '→') : (isScene ? '→' : 'i');

    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'absolute',
      top: '100%', left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '6px',
      padding: '3px 10px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none'
    });
    label.textContent = hotspotData.title;
    el.appendChild(label);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onClick) onClick(hotspotData);
    });

    this.overlayEl.appendChild(el);
    return el;
  }

  getEditMode() {
    return this.editMode;
  }

  toggleEditMode(onSave) {
    this.editMode = !this.editMode;
    this.editOverlay.style.display = this.editMode ? 'block' : 'none';
    this.coordDisplay.style.display = this.editMode ? 'block' : 'none';

    if (this.editMode) {
      this.enterEditMode(onSave);
    } else {
      this.exitEditMode();
    }
  }

  enterEditMode(onSave) {
    this.editOverlay.innerHTML = '';
    this.editOverlay.style.pointerEvents = 'auto';

    const tempCrosshair = document.createElement('div');
    Object.assign(tempCrosshair.style, {
      position: 'absolute', top: '0', left: '0',
      width: '20px', height: '20px', borderRadius: '50%',
      border: '2px solid #ff5252', background: 'rgba(255,82,82,0.3)',
      transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      display: 'none', zIndex: '20'
    });
    this.editOverlay.appendChild(tempCrosshair);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📋 导出坐标';
    Object.assign(exportBtn.style, {
      position: 'fixed', bottom: '150px', right: '16px',
      background: '#4fc3f7', color: '#000', border: 'none',
      padding: '10px 16px', borderRadius: '20px', fontSize: '14px',
      fontWeight: '600', cursor: 'pointer', zIndex: '200'
    });
    document.body.appendChild(exportBtn);

    this.editOverlay.addEventListener('mousemove', (e) => {
      const rect = this.photoEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      this.coordDisplay.textContent = `X: ${x}%  Y: ${y}%`;
      tempCrosshair.style.display = 'block';
      tempCrosshair.style.left = `${x}%`;
      tempCrosshair.style.top = `${y}%`;
    });

    this.editOverlay.addEventListener('mouseleave', () => {
      tempCrosshair.style.display = 'none';
      this.coordDisplay.textContent = '悬停在照片上查看坐标';
    });

    this.editOverlay.addEventListener('click', (e) => {
      const rect = this.photoEl.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const py = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      const id = prompt('热点ID（英文，如 hs_gate）:', `hs_spot_${Date.now()}`);
      if (!id) return;
      const title = prompt('热点名称（如 前往校门）:', '新热点');
      const type = confirm('点击确定=场景跳转，取消=信息展示') ? 'scene' : 'info';
      let targetScene = '';
      if (type === 'scene') {
        targetScene = prompt('目标场景ID（如 door, playground）:', '') || '';
      }
      const content = type === 'info' ? (prompt('信息内容:', '') || '') : '';

      const hsData = { id, type, position: { x: parseFloat(px), y: parseFloat(py) }, title };
      if (targetScene) hsData.targetScene = targetScene;
      if (content) hsData.content = content;

      this.addEditHotspotMarker(hsData);
      this.currentHotspotData.push(hsData);
      this.coordDisplay.textContent = `✅ 已添加: ${title} @ ${px}%, ${py}%`;
    });

    exportBtn.addEventListener('click', () => {
      if (this.currentHotspotData.length === 0) {
        alert('暂无热点数据');
        return;
      }
      const json = JSON.stringify(this.currentHotspotData, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        alert('热点坐标已复制到剪贴板！\n粘贴到 scenes.json 对应场景的 hotspots 中。');
      }).catch(() => {
        prompt('复制以下内容:', json);
      });
    });

    this._editExportBtn = exportBtn;
  }

  addEditHotspotMarker(hsData) {
    const { x, y } = hsData.position;
    const el = document.createElement('div');
    const isScene = hsData.type === 'scene';
    Object.assign(el.style, {
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      width: '40px', height: '40px',
      borderRadius: '50%',
      background: isScene ? 'rgba(79,195,247,0.8)' : 'rgba(255,213,79,0.8)',
      border: '3px solid #ff5252',
      cursor: 'grab', zIndex: '15',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '16px', color: '#fff', fontWeight: 'bold'
    });
    el.textContent = isScene ? '→' : 'i';
    el.title = `${hsData.title} (${x}%, ${y}%)`;

    let dragging = false, startX, startY, startLeft, startTop;
    el.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = parseFloat(el.style.left); startTop = parseFloat(el.style.top);
      el.style.cursor = 'grabbing';
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const rect = this.photoEl.getBoundingClientRect();
      const dx = ((e.clientX - startX) / rect.width * 100);
      const dy = ((e.clientY - startY) / rect.height * 100);
      const newX = Math.max(0, Math.min(100, startLeft + dx));
      const newY = Math.max(0, Math.min(100, startTop + dy));
      el.style.left = `${newX}%`;
      el.style.top = `${newY}%`;
      hsData.position.x = Math.round(newX * 10) / 10;
      hsData.position.y = Math.round(newY * 10) / 10;
      this.coordDisplay.textContent = `📍 ${hsData.title}: ${hsData.position.x}%, ${hsData.position.y}%`;
    });

    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        el.style.cursor = 'grab';
      }
    });

    this.editOverlay.appendChild(el);
    return el;
  }

  exitEditMode() {
    if (this._editExportBtn) {
      this._editExportBtn.remove();
      this._editExportBtn = null;
    }
    this.editOverlay.innerHTML = '';
    this.editOverlay.style.pointerEvents = 'none';
    this.coordDisplay.style.display = 'none';
    this.currentHotspotData = [];
  }

  setEditHotspotData(data) {
    this.currentHotspotData = data;
    if (this.editMode) {
      this.editOverlay.innerHTML = '';
      const tempCrosshair = document.createElement('div');
      Object.assign(tempCrosshair.style, {
        position: 'absolute', top: '0', left: '0',
        width: '20px', height: '20px', borderRadius: '50%',
        border: '2px solid #ff5252', background: 'rgba(255,82,82,0.3)',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        display: 'none', zIndex: '20'
      });
      this.editOverlay.appendChild(tempCrosshair);
      for (const hs of data) {
        this.addEditHotspotMarker(hs);
      }
    }
  }

  dispose() {
    this.photoEl.remove();
    this.overlayEl.remove();
    this.editOverlay.remove();
    this.coordDisplay.remove();
  }
}
