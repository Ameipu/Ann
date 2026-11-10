/**
 * 婚禮賓客自助查位系統 - 前台互動邏輯
 */

(function () {
  'use strict';

  // 1. 取得設定資料（優先讀取本地修改的 LocalStorage，無則回退預設 config.js）
  function loadConfig() {
    try {
      const saved = localStorage.getItem('WEDDING_SAVED_CONFIG');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('無法從 LocalStorage 讀取設定，使用預設值', e);
    }
    return window.WEDDING_CONFIG || {};
  }

  const config = loadConfig();
  const { weddingInfo = {}, theme = {}, seatingMap = {}, guests = [] } = config;

  // DOM 元素引用
  const dom = {
    coupleNames: document.getElementById('coupleNames'),
    weddingDate: document.getElementById('weddingDate'),
    weddingTime: document.getElementById('weddingTime'),
    weddingVenue: document.getElementById('weddingVenue'),
    welcomeText: document.getElementById('welcomeText'),
    weddingBg: document.getElementById('weddingBg'),
    weddingBgOverlay: document.getElementById('weddingBgOverlay'),

    // 搜尋相關
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearBtn: document.getElementById('clearBtn'),
    searchSuggestions: document.getElementById('searchSuggestions'),
    multiMatchesCard: document.getElementById('multiMatchesCard'),
    multiMatchesList: document.getElementById('multiMatchesList'),

    // 結果卡片
    resultCard: document.getElementById('resultCard'),
    guestNameHighlight: document.getElementById('guestNameHighlight'),
    tableNumDisplay: document.getElementById('tableNumDisplay'),
    tableNicknameDisplay: document.getElementById('tableNicknameDisplay'),
    relationPill: document.getElementById('relationPill'),
    dietPill: document.getElementById('dietPill'),
    notePill: document.getElementById('notePill'),
    tablematesBox: document.getElementById('tablematesBox'),
    tablematesTags: document.getElementById('tablematesTags'),
    locateMapBtn: document.getElementById('locateMapBtn'),

    // 平面圖相關
    seatingViewport: document.getElementById('seatingViewport'),
    seatingCanvas: document.getElementById('seatingCanvas'),
    seatingImage: document.getElementById('seatingImage'),
    tablesOverlay: document.getElementById('tablesOverlay'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),

    // 現場 QR Code
    showQrBtn: document.getElementById('showQrBtn'),
    qrModal: document.getElementById('qrModal'),
    closeQrBtn: document.getElementById('closeQrBtn'),
    qrContainer: document.getElementById('qrContainer')
  };

  // 平面圖縮放與平移狀態
  const mapState = {
    scale: 1,
    minScale: 0.6,
    maxScale: 3.5,
    posX: 0,
    posY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPinchDistance: null,
    highlightedTableId: null
  };

  // ==========================================
  // 初始化頁面外觀與文字
  // ==========================================
  function initPageInfo() {
    if (weddingInfo.couple) dom.coupleNames.textContent = weddingInfo.couple;
    if (weddingInfo.date) dom.weddingDate.textContent = weddingInfo.date;
    if (weddingInfo.time) dom.weddingTime.textContent = weddingInfo.time;
    if (weddingInfo.venue) dom.weddingVenue.textContent = weddingInfo.venue;
    if (weddingInfo.welcomeMessage) dom.welcomeText.textContent = weddingInfo.welcomeMessage;

    // 設定背景圖
    if (theme.backgroundImage && theme.backgroundImage.trim() !== '') {
      dom.weddingBg.style.backgroundImage = `url("${theme.backgroundImage}")`;
    } else {
      dom.weddingBg.style.backgroundImage = `url("assets/default-bg.svg")`;
    }

    if (theme.overlayOpacity !== undefined) {
      dom.weddingBgOverlay.style.background = `rgba(253, 251, 247, ${theme.overlayOpacity})`;
    }

    // 設定平面圖
    const mapUrl = seatingMap.imageUrl && seatingMap.imageUrl.trim() !== ''
      ? seatingMap.imageUrl
      : 'assets/default-seating.svg';
    dom.seatingImage.src = mapUrl;

    // 載入桌位標記
    renderTablePins();
  }

  // ==========================================
  // 繪製平面圖上的桌位點標記 (Table Pins)
  // ==========================================
  function renderTablePins() {
    dom.tablesOverlay.innerHTML = '';
    const tables = seatingMap.tables || [];

    tables.forEach(table => {
      const pin = document.createElement('div');
      pin.className = 'table-pin';
      pin.dataset.tableId = table.id;
      pin.style.left = `${table.x}%`;
      pin.style.top = `${table.y}%`;

      pin.innerHTML = `
        <div class="pin-badge" title="${table.name} (${table.note || ''})">
          ${table.id === 'M' ? '主' : table.id}
        </div>
      `;

      // 點擊桌位標記，顯示同桌所有賓客
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        highlightTable(table.id);
        showTableGuestsModal(table);
      });

      dom.tablesOverlay.appendChild(pin);
    });
  }

  // 點亮特定桌號
  function highlightTable(tableId) {
    mapState.highlightedTableId = tableId;
    const allPins = dom.tablesOverlay.querySelectorAll('.table-pin');
    allPins.forEach(pin => {
      if (pin.dataset.tableId === String(tableId)) {
        pin.classList.add('is-highlighted');
      } else {
        pin.classList.remove('is-highlighted');
      }
    });
  }

  // 將視角平滑聚焦到指定桌號
  function focusOnTable(tableId) {
    const table = (seatingMap.tables || []).find(t => String(t.id) === String(tableId));
    if (!table) return;

    highlightTable(tableId);

    // 計算視窗中心相對於百分比座標
    mapState.scale = 1.6; // 適度放大
    const viewportRect = dom.seatingViewport.getBoundingClientRect();
    const centerX = viewportRect.width / 2;
    const centerY = viewportRect.height / 2;

    const targetX = (table.x / 100) * viewportRect.width;
    const targetY = (table.y / 100) * viewportRect.height;

    mapState.posX = (centerX - targetX) * (mapState.scale - 0.5);
    mapState.posY = (centerY - targetY) * (mapState.scale - 0.5);

    updateCanvasTransform();
  }

  // ==========================================
  // 平面圖縮放與拖曳邏輯 (Pan & Zoom)
  // ==========================================
  function updateCanvasTransform() {
    dom.seatingCanvas.style.transform = `translate(${mapState.posX}px, ${mapState.posY}px) scale(${mapState.scale})`;
  }

  function resetMapTransform() {
    mapState.scale = 1;
    mapState.posX = 0;
    mapState.posY = 0;
    updateCanvasTransform();
  }

  // 滑鼠滾輪縮放
  dom.seatingViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    const newScale = Math.min(Math.max(mapState.scale * zoomFactor, mapState.minScale), mapState.maxScale);
    mapState.scale = newScale;
    updateCanvasTransform();
  }, { passive: false });

  // 拖曳開始
  function onPointerDown(clientX, clientY) {
    mapState.isDragging = true;
    mapState.startX = clientX - mapState.posX;
    mapState.startY = clientY - mapState.posY;
    dom.seatingViewport.style.cursor = 'grabbing';
  }

  // 拖曳中
  function onPointerMove(clientX, clientY) {
    if (!mapState.isDragging) return;
    mapState.posX = clientX - mapState.startX;
    mapState.posY = clientY - mapState.startY;
    updateCanvasTransform();
  }

  // 拖曳結束
  function onPointerUp() {
    mapState.isDragging = false;
    dom.seatingViewport.style.cursor = 'grab';
  }

  // 滑鼠事件綁定
  dom.seatingViewport.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onPointerUp);

  // 觸控手勢綁定（單指拖曳、雙指縮放）
  dom.seatingViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      mapState.isDragging = false;
      mapState.initialPinchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  dom.seatingViewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && mapState.isDragging) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && mapState.initialPinchDistance) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDistance / mapState.initialPinchDistance;
      mapState.scale = Math.min(Math.max(mapState.scale * (ratio > 1 ? 1.03 : 0.97), mapState.minScale), mapState.maxScale);
      updateCanvasTransform();
    }
  }, { passive: true });

  dom.seatingViewport.addEventListener('touchend', () => {
    mapState.isDragging = false;
    mapState.initialPinchDistance = null;
  });

  // 縮放按鈕
  dom.zoomInBtn.addEventListener('click', () => {
    mapState.scale = Math.min(mapState.scale * 1.25, mapState.maxScale);
    updateCanvasTransform();
  });

  dom.zoomOutBtn.addEventListener('click', () => {
    mapState.scale = Math.max(mapState.scale * 0.8, mapState.minScale);
    updateCanvasTransform();
  });

  dom.zoomResetBtn.addEventListener('click', resetMapTransform);

  // ==========================================
  // 賓客搜尋核心演算法
  // ==========================================
  function cleanString(str) {
    if (!str) return '';
    return str.replace(/\s+/g, '').trim().toLowerCase();
  }

  function searchGuests(query) {
    const q = cleanString(query);
    if (!q) return [];

    return guests.filter(guest => {
      const gName = cleanString(guest.name);
      return gName.includes(q);
    });
  }

  // 執行查詢
  function handleSearch() {
    const query = dom.searchInput.value;
    const matches = searchGuests(query);

    // 關閉下拉快選
    dom.searchSuggestions.style.display = 'none';

    if (matches.length === 0) {
      alert(`很抱歉，名單中沒有找到「${query}」！\n\n小提醒：\n1. 請確認姓名是否有別名或錯別字\n2. 亦可向現場熱情的招待人員洽詢帶位喔！`);
      dom.resultCard.style.display = 'none';
      dom.multiMatchesCard.style.display = 'none';
      return;
    }

    if (matches.length === 1) {
      // 唯一符合，直接呈現結果
      dom.multiMatchesCard.style.display = 'none';
      displayGuestResult(matches[0]);
    } else {
      // 同名同姓多筆符合，呈現選擇卡片
      dom.resultCard.style.display = 'none';
      renderMultiMatches(matches);
    }
  }

  // 渲染同名選擇清單
  function renderMultiMatches(matches) {
    dom.multiMatchesList.innerHTML = '';
    matches.forEach(guest => {
      const tableInfo = (seatingMap.tables || []).find(t => String(t.id) === String(guest.tableId)) || {};
      const tableName = tableInfo.name || `第 ${guest.tableId} 桌`;

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'match-item-btn';
      item.innerHTML = `
        <div>
          <div style="font-weight: 800; font-size: 1.15rem; color: #3d2f28;">${guest.name}</div>
          <div style="font-size: 0.85rem; color: #786458; margin-top: 3px;">
            關係身分：<strong style="color: #c59b27;">${guest.relation || '賓客'}</strong>
            ${guest.note ? ` • 備註: ${guest.note}` : ''}
          </div>
        </div>
        <div style="font-size: 0.95rem; font-weight: 700; color: #8e6815; background: #faf4ea; padding: 6px 12px; border-radius: 8px;">
          ${tableName} ➔
        </div>
      `;

      item.addEventListener('click', () => {
        dom.multiMatchesCard.style.display = 'none';
        displayGuestResult(guest);
      });

      dom.multiMatchesList.appendChild(item);
    });

    dom.multiMatchesCard.style.display = 'block';
    dom.multiMatchesCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 顯示單一賓客座位結果卡片
  function displayGuestResult(guest) {
    const tableInfo = (seatingMap.tables || []).find(t => String(t.id) === String(guest.tableId)) || {
      id: guest.tableId,
      name: `第 ${guest.tableId} 桌`,
      note: ''
    };

    dom.guestNameHighlight.textContent = guest.name;
    dom.tableNumDisplay.textContent = tableInfo.id === 'M' ? '主桌' : `${tableInfo.id} 桌`;
    dom.tableNicknameDisplay.textContent = tableInfo.name ? `${tableInfo.name} (${tableInfo.note || '席次'})` : '貴賓專席';

    dom.relationPill.textContent = guest.relation || '貴賓';
    dom.dietPill.textContent = guest.diet || '一般葷食';
    dom.notePill.textContent = guest.note || '無特殊需求';

    // 尋找同桌親友
    renderTablemates(guest);

    // 顯示卡片並聚焦
    dom.resultCard.style.display = 'block';
    dom.resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 平面圖高亮對應桌位
    focusOnTable(tableInfo.id);

    // 綁定「查看平面圖位置」按鈕
    dom.locateMapBtn.onclick = () => {
      dom.seatingViewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusOnTable(tableInfo.id);
    };
  }

  // 渲染同桌親友
  function renderTablemates(currentGuest) {
    const tablemates = guests.filter(g => String(g.tableId) === String(currentGuest.tableId));
    dom.tablematesTags.innerHTML = '';

    if (tablemates.length <= 1) {
      dom.tablematesBox.style.display = 'none';
      return;
    }

    dom.tablematesBox.style.display = 'block';
    tablemates.forEach(g => {
      const tag = document.createElement('span');
      const isMe = g.id === currentGuest.id || g.name === currentGuest.name;
      tag.className = `tablemate-tag ${isMe ? 'is-me' : ''}`;
      tag.textContent = isMe ? `${g.name} (您)` : g.name;
      dom.tablematesTags.appendChild(tag);
    });
  }

  // 點擊桌位查看同桌所有賓客（供招待人員或賓客點閱）
  function showTableGuestsModal(table) {
    const tableGuests = guests.filter(g => String(g.tableId) === String(table.id));
    const names = tableGuests.map(g => `• ${g.name} (${g.relation || '貴賓'}${g.diet ? ' / ' + g.diet : ''})`).join('\n');
    const msg = `【${table.name || table.id + '桌'}】\n桌名備註：${table.note || '無'}\n目前入座賓客 (${tableGuests.length} 位)：\n\n${names || '（暫無名單）'}`;
    alert(msg);
  }

  // ==========================================
  // 即時打字聯想與清除按鈕
  // ==========================================
  dom.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    dom.clearBtn.style.display = val ? 'flex' : 'none';

    if (!val) {
      dom.searchSuggestions.style.display = 'none';
      return;
    }

    const matches = searchGuests(val);
    if (matches.length > 0 && matches.length <= 8) {
      dom.searchSuggestions.innerHTML = '';
      matches.forEach(g => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <span class="suggestion-name">${g.name}</span>
          <span class="suggestion-badge">${g.relation || '賓客'} • 第 ${g.tableId} 桌</span>
        `;
        item.addEventListener('click', () => {
          dom.searchInput.value = g.name;
          dom.searchSuggestions.style.display = 'none';
          handleSearch();
        });
        dom.searchSuggestions.appendChild(item);
      });
      dom.searchSuggestions.style.display = 'block';
    } else {
      dom.searchSuggestions.style.display = 'none';
    }
  });

  dom.clearBtn.addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.clearBtn.style.display = 'none';
    dom.searchSuggestions.style.display = 'none';
    dom.searchInput.focus();
  });

  dom.searchBtn.addEventListener('click', handleSearch);

  dom.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  });

  // 點擊空白處隱藏搜尋聯想
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrap') && !e.target.closest('.search-suggestions')) {
      dom.searchSuggestions.style.display = 'none';
    }
  });

  // ==========================================
  // 現場 QR Code 彈窗功能
  // ==========================================
  dom.showQrBtn.addEventListener('click', () => {
    dom.qrModal.style.display = 'flex';
    dom.qrContainer.innerHTML = '';

    // 使用輕量 QR Code 庫產生當前網址
    const currentUrl = window.location.href.split('#')[0].split('?')[0];

    if (window.QRCode) {
      new QRCode(dom.qrContainer, {
        text: currentUrl,
        width: 220,
        height: 220,
        colorDark: "#3d2f28",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // 備用方案：使用 Google Chart API 產生 QR 圖片
      dom.qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}" alt="QR Code" width="220" height="220" style="border-radius: 8px;" />`;
    }
  });

  dom.closeQrBtn.addEventListener('click', () => {
    dom.qrModal.style.display = 'none';
  });

  dom.qrModal.addEventListener('click', (e) => {
    if (e.target === dom.qrModal) {
      dom.qrModal.style.display = 'none';
    }
  });

  // 啟動初始化
  initPageInfo();
})();
