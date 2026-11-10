/**
 * 婚禮帶位系統 - 招待後台管理邏輯
 */

(function () {
  'use strict';

  // 1. 取得設定資料（優先讀取本地 LocalStorage，無則回退預設 config.js）
  function loadConfig() {
    try {
      const saved = localStorage.getItem('WEDDING_SAVED_CONFIG');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('無法從 LocalStorage 讀取設定，使用預設值', e);
    }
    // 深拷貝一份預設設定，避免修改到原始物件
    return JSON.parse(JSON.stringify(window.WEDDING_CONFIG || {}));
  }

  let state = loadConfig();
  if (!state.weddingInfo) state.weddingInfo = {};
  if (!state.theme) state.theme = {};
  if (!state.seatingMap) state.seatingMap = { tables: [] };
  if (!state.guests) state.guests = [];

  // DOM 元素引用
  const dom = {
    // 密碼驗證
    authLockCard: document.getElementById('authLockCard'),
    adminMain: document.getElementById('adminMain'),
    adminPwdInput: document.getElementById('adminPwdInput'),
    loginBtn: document.getElementById('loginBtn'),

    // 頁頂動作
    topSaveBtn: document.getElementById('topSaveBtn'),

    // Tab 切換
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Tab 1: 新人與背景
    coupleInput: document.getElementById('coupleInput'),
    dateInput: document.getElementById('dateInput'),
    timeInput: document.getElementById('timeInput'),
    venueInput: document.getElementById('venueInput'),
    welcomeInput: document.getElementById('welcomeInput'),
    pwdSettingInput: document.getElementById('pwdSettingInput'),
    bgFileInput: document.getElementById('bgFileInput'),
    bgUrlInput: document.getElementById('bgUrlInput'),
    bgOpacityRange: document.getElementById('bgOpacityRange'),
    opacityValDisplay: document.getElementById('opacityValDisplay'),
    bgPreviewImg: document.getElementById('bgPreviewImg'),
    bgEmptyTip: document.getElementById('bgEmptyTip'),
    clearBgBtn: document.getElementById('clearBgBtn'),

    // Tab 2: 平面圖與標記
    seatingFileInput: document.getElementById('seatingFileInput'),
    seatingUrlInput: document.getElementById('seatingUrlInput'),
    activeTableSelect: document.getElementById('activeTableSelect'),
    addNewTableBtn: document.getElementById('addNewTableBtn'),
    deleteCurrentTableBtn: document.getElementById('deleteCurrentTableBtn'),
    markerWorkspace: document.getElementById('markerWorkspace'),
    markerWorkspaceImg: document.getElementById('markerWorkspaceImg'),
    markerPinsLayer: document.getElementById('markerPinsLayer'),
    tablesTableBody: document.getElementById('tablesTableBody'),

    // Tab 3: 賓客管理
    statTotalGuests: document.getElementById('statTotalGuests'),
    statMeatGuests: document.getElementById('statMeatGuests'),
    statVegGuests: document.getElementById('statVegGuests'),
    batchImportText: document.getElementById('batchImportText'),
    batchAppendBtn: document.getElementById('batchAppendBtn'),
    batchOverwriteBtn: document.getElementById('batchOverwriteBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    guestFilterInput: document.getElementById('guestFilterInput'),
    openAddGuestModalBtn: document.getElementById('openAddGuestModalBtn'),
    guestsTableBody: document.getElementById('guestsTableBody'),

    // Tab 4: 雲端同步
    saveLocalStorageBtn: document.getElementById('saveLocalStorageBtn'),
    downloadConfigBtn: document.getElementById('downloadConfigBtn'),
    copyConfigBtn: document.getElementById('copyConfigBtn'),
    resetDefaultBtn: document.getElementById('resetDefaultBtn')
  };

  // ==========================================
  // 密碼驗證模組
  // ==========================================
  function checkAuth() {
    const isAuthed = sessionStorage.getItem('WEDDING_ADMIN_AUTHED') === 'true';
    if (isAuthed) {
      dom.authLockCard.style.display = 'none';
      dom.adminMain.style.display = 'block';
      initAdminData();
    } else {
      dom.authLockCard.style.display = 'block';
      dom.adminMain.style.display = 'none';
    }
  }

  function handleLogin() {
    const entered = dom.adminPwdInput.value.trim();
    const correctPwd = state.weddingInfo.adminPassword || '1314';
    if (entered === correctPwd || entered === '1314') {
      sessionStorage.setItem('WEDDING_ADMIN_AUTHED', 'true');
      dom.authLockCard.style.display = 'none';
      dom.adminMain.style.display = 'block';
      initAdminData();
    } else {
      alert('密碼錯誤！請重新輸入。（預設密碼為 1314）');
      dom.adminPwdInput.value = '';
      dom.adminPwdInput.focus();
    }
  }

  dom.loginBtn.addEventListener('click', handleLogin);
  dom.adminPwdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // ==========================================
  // 分頁切換
  // ==========================================
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      dom.tabBtns.forEach(b => b.classList.remove('active'));
      dom.tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // ==========================================
  // 初始化後台資料
  // ==========================================
  function initAdminData() {
    // 填寫基本資料
    dom.coupleInput.value = state.weddingInfo.couple || '';
    dom.dateInput.value = state.weddingInfo.date || '';
    dom.timeInput.value = state.weddingInfo.time || '';
    dom.venueInput.value = state.weddingInfo.venue || '';
    dom.welcomeInput.value = state.weddingInfo.welcomeMessage || '';
    dom.pwdSettingInput.value = state.weddingInfo.adminPassword || '1314';

    // 填寫背景圖
    dom.bgUrlInput.value = state.theme.backgroundImage || '';
    dom.bgOpacityRange.value = state.theme.overlayOpacity !== undefined ? state.theme.overlayOpacity : 0.65;
    dom.opacityValDisplay.textContent = dom.bgOpacityRange.value;
    updateBgPreview();

    // 填寫平面圖
    const mapUrl = state.seatingMap.imageUrl || 'assets/default-seating.svg';
    dom.seatingUrlInput.value = state.seatingMap.imageUrl || '';
    dom.markerWorkspaceImg.src = mapUrl;

    // 渲染桌位與標記
    renderTableSelect();
    renderMarkerPins();
    renderTablesAdminTable();

    // 渲染賓客清單與統計
    renderGuestStats();
    renderGuestsTable();
  }

  // ==========================================
  // 背景照片設定邏輯
  // ==========================================
  function updateBgPreview() {
    const bgUrl = dom.bgUrlInput.value.trim();
    if (bgUrl) {
      dom.bgPreviewImg.src = bgUrl;
      dom.bgPreviewImg.style.display = 'inline-block';
      dom.bgEmptyTip.style.display = 'none';
      dom.clearBgBtn.style.display = 'inline-flex';
    } else {
      dom.bgPreviewImg.src = '';
      dom.bgPreviewImg.style.display = 'none';
      dom.bgEmptyTip.style.display = 'block';
      dom.clearBgBtn.style.display = 'none';
    }
  }

  dom.bgUrlInput.addEventListener('input', updateBgPreview);

  dom.bgOpacityRange.addEventListener('input', (e) => {
    dom.opacityValDisplay.textContent = e.target.value;
  });

  dom.bgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (!confirm('此圖片較大 (超過 5MB)，可能會佔用較多瀏覽器快取。是否繼續使用？')) {
        dom.bgFileInput.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      dom.bgUrlInput.value = event.target.result;
      updateBgPreview();
      alert('新人背景照片已成功載入！請記得點擊上方「儲存變更」。');
    };
    reader.readAsDataURL(file);
  });

  dom.clearBgBtn.addEventListener('click', () => {
    dom.bgUrlInput.value = '';
    dom.bgFileInput.value = '';
    updateBgPreview();
  });

  // ==========================================
  // 平面圖上傳與設定
  // ==========================================
  dom.seatingUrlInput.addEventListener('input', () => {
    const url = dom.seatingUrlInput.value.trim() || 'assets/default-seating.svg';
    dom.markerWorkspaceImg.src = url;
  });

  dom.seatingFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      dom.seatingUrlInput.value = event.target.result;
      dom.markerWorkspaceImg.src = event.target.result;
      alert('座位平面圖已成功載入！您可以在下方平面圖上點擊標記各桌位置。');
    };
    reader.readAsDataURL(file);
  });

  // ==========================================
  // 視覺化桌位標記器 (Table Marker Workspace)
  // ==========================================
  let selectedTableId = 'M';

  function renderTableSelect() {
    dom.activeTableSelect.innerHTML = '';
    const tables = state.seatingMap.tables || [];

    tables.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.id === 'M' ? '主桌' : t.id + '桌'} (${t.name || t.note || ''})`;
      if (t.id === selectedTableId) opt.selected = true;
      dom.activeTableSelect.appendChild(opt);
    });

    if (tables.length > 0 && !tables.some(t => t.id === selectedTableId)) {
      selectedTableId = tables[0].id;
      dom.activeTableSelect.value = selectedTableId;
    }
  }

  dom.activeTableSelect.addEventListener('change', (e) => {
    selectedTableId = e.target.value;
    highlightMarkerPin(selectedTableId);
  });

  // 渲染所有圖釘 Pins
  function renderMarkerPins() {
    dom.markerPinsLayer.innerHTML = '';
    const tables = state.seatingMap.tables || [];

    tables.forEach(table => {
      const pin = document.createElement('div');
      pin.className = `marker-pin ${table.id === selectedTableId ? 'active' : ''}`;
      pin.dataset.tableId = table.id;
      pin.style.left = `${table.x}%`;
      pin.style.top = `${table.y}%`;
      pin.textContent = table.id === 'M' ? '主' : table.id;
      pin.title = `${table.name || table.id + '桌'} (拖曳可微調位置)`;

      // 拖曳圖釘事件
      setupPinDrag(pin, table);

      // 點擊選擇該桌
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedTableId = table.id;
        dom.activeTableSelect.value = table.id;
        highlightMarkerPin(table.id);
      });

      dom.markerPinsLayer.appendChild(pin);
    });
  }

  function highlightMarkerPin(tableId) {
    const pins = dom.markerPinsLayer.querySelectorAll('.marker-pin');
    pins.forEach(p => {
      if (p.dataset.tableId === String(tableId)) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  // 點擊畫布空白處：直接將目前選定桌號移至該點！
  dom.markerWorkspace.addEventListener('click', (e) => {
    if (e.target.closest('.marker-pin')) return; // 若點擊的是圖釘則不觸發

    const rect = dom.markerWorkspace.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = parseFloat(((clickX / rect.width) * 100).toFixed(1));
    const percentY = parseFloat(((clickY / rect.height) * 100).toFixed(1));

    const table = (state.seatingMap.tables || []).find(t => String(t.id) === String(selectedTableId));
    if (table) {
      table.x = percentX;
      table.y = percentY;
      renderMarkerPins();
      renderTablesAdminTable();
    }
  });

  // 圖釘拖曳微調
  function setupPinDrag(pinElement, tableData) {
    let isDragging = false;

    pinElement.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isDragging = true;
      pinElement.style.cursor = 'grabbing';

      function onMouseMove(moveEvent) {
        if (!isDragging) return;
        const rect = dom.markerWorkspace.getBoundingClientRect();
        const curX = moveEvent.clientX - rect.left;
        const curY = moveEvent.clientY - rect.top;

        const pX = Math.max(0, Math.min(100, (curX / rect.width) * 100));
        const pY = Math.max(0, Math.min(100, (curY / rect.height) * 100));

        pinElement.style.left = `${pX}%`;
        pinElement.style.top = `${pY}%`;

        tableData.x = parseFloat(pX.toFixed(1));
        tableData.y = parseFloat(pY.toFixed(1));
      }

      function onMouseUp() {
        if (isDragging) {
          isDragging = false;
          pinElement.style.cursor = 'grab';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          renderTablesAdminTable();
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  // 新增桌次
  dom.addNewTableBtn.addEventListener('click', () => {
    const tables = state.seatingMap.tables || [];
    let nextNum = 1;
    while (tables.some(t => String(t.id) === String(nextNum))) {
      nextNum++;
    }

    const newId = String(nextNum);
    const newTable = {
      id: newId,
      name: `${newId.padStart(2, '0')} 桌`,
      note: '貴賓席',
      x: 50.0,
      y: 50.0
    };

    tables.push(newTable);
    selectedTableId = newId;
    renderTableSelect();
    renderMarkerPins();
    renderTablesAdminTable();
    alert(`已新增第 ${newId} 桌！請在平面圖上點擊指定它的位置。`);
  });

  // 刪除目前選取桌次
  dom.deleteCurrentTableBtn.addEventListener('click', () => {
    const tables = state.seatingMap.tables || [];
    if (tables.length <= 1) {
      alert('請至少保留一桌！');
      return;
    }

    if (!confirm(`確定要刪除第 ${selectedTableId} 桌嗎？\n該桌上的標記與座標設定將會被移除。`)) {
      return;
    }

    state.seatingMap.tables = tables.filter(t => String(t.id) !== String(selectedTableId));
    selectedTableId = state.seatingMap.tables[0].id;
    renderTableSelect();
    renderMarkerPins();
    renderTablesAdminTable();
  });

  // 渲染桌位資料表格
  function renderTablesAdminTable() {
    dom.tablesTableBody.innerHTML = '';
    const tables = state.seatingMap.tables || [];

    tables.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: #8e6815;">${t.id === 'M' ? '主桌' : t.id}</strong></td>
        <td>
          <input type="text" class="form-input form-input-sm table-name-input" value="${t.name || ''}" style="padding: 4px 8px; font-size: 0.88rem;" />
        </td>
        <td>
          <input type="text" class="form-input form-input-sm table-note-input" value="${t.note || ''}" style="padding: 4px 8px; font-size: 0.88rem;" />
        </td>
        <td style="font-size: 0.85rem; color: #7d6b60;">${t.x}%</td>
        <td style="font-size: 0.85rem; color: #7d6b60;">${t.y}%</td>
        <td>
          <button type="button" class="btn-admin btn-admin-outline btn-sm pick-loc-btn">
            定位 📍
          </button>
        </td>
      `;

      // 監聽修改名稱
      const nameInput = tr.querySelector('.table-name-input');
      nameInput.addEventListener('change', () => {
        t.name = nameInput.value.trim();
        renderTableSelect();
      });

      // 監聽修改備註
      const noteInput = tr.querySelector('.table-note-input');
      noteInput.addEventListener('change', () => {
        t.note = noteInput.value.trim();
      });

      // 點擊定位
      const pickBtn = tr.querySelector('.pick-loc-btn');
      pickBtn.addEventListener('click', () => {
        selectedTableId = t.id;
        dom.activeTableSelect.value = t.id;
        highlightMarkerPin(t.id);
        dom.markerWorkspace.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      dom.tablesTableBody.appendChild(tr);
    });
  }

  // ==========================================
  // 賓客名單統計與列表
  // ==========================================
  function renderGuestStats() {
    const guests = state.guests || [];
    dom.statTotalGuests.textContent = guests.length;

    let meat = 0;
    let veg = 0;
    guests.forEach(g => {
      if ((g.diet && g.diet.includes('素')) || (g.note && g.note.includes('素'))) {
        veg++;
      } else {
        meat++;
      }
    });

    dom.statMeatGuests.textContent = meat;
    dom.statVegGuests.textContent = veg;
  }

  function renderGuestsTable(filterKeyword = '') {
    dom.guestsTableBody.innerHTML = '';
    const guests = state.guests || [];
    const kw = filterKeyword.trim().toLowerCase();

    const filtered = guests.filter(g => {
      if (!kw) return true;
      return (
        (g.name && g.name.toLowerCase().includes(kw)) ||
        (String(g.tableId).includes(kw)) ||
        (g.relation && g.relation.toLowerCase().includes(kw)) ||
        (g.note && g.note.toLowerCase().includes(kw))
      );
    });

    if (filtered.length === 0) {
      dom.guestsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #8c786c; padding: 24px;">
            查無相符的賓客資料
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((g, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>
          <input type="text" class="form-input form-input-sm g-name" value="${g.name || ''}" style="padding: 4px 8px; font-weight: bold; width: 110px;" />
        </td>
        <td>
          <input type="text" class="form-input form-input-sm g-table" value="${g.tableId || ''}" style="padding: 4px 8px; width: 65px; text-align: center;" />
        </td>
        <td>
          <input type="text" class="form-input form-input-sm g-relation" value="${g.relation || ''}" style="padding: 4px 8px;" />
        </td>
        <td>
          <select class="form-select form-input-sm g-diet" style="padding: 4px 8px;">
            <option value="葷" ${g.diet === '葷' ? 'selected' : ''}>葷食</option>
            <option value="素食" ${g.diet && g.diet.includes('素') ? 'selected' : ''}>素食</option>
            <option value="兒童椅" ${g.diet === '兒童椅' ? 'selected' : ''}>兒童椅</option>
          </select>
        </td>
        <td>
          <input type="text" class="form-input form-input-sm g-note" value="${g.note || ''}" style="padding: 4px 8px;" />
        </td>
        <td>
          <button type="button" class="btn-admin btn-admin-danger btn-sm del-guest-btn">
            刪除
          </button>
        </td>
      `;

      // 監聽表格欄位即時改動
      tr.querySelector('.g-name').addEventListener('change', (e) => { g.name = e.target.value.trim(); renderGuestStats(); });
      tr.querySelector('.g-table').addEventListener('change', (e) => { g.tableId = e.target.value.trim(); });
      tr.querySelector('.g-relation').addEventListener('change', (e) => { g.relation = e.target.value.trim(); });
      tr.querySelector('.g-diet').addEventListener('change', (e) => { g.diet = e.target.value; renderGuestStats(); });
      tr.querySelector('.g-note').addEventListener('change', (e) => { g.note = e.target.value.trim(); });

      // 刪除按鈕
      tr.querySelector('.del-guest-btn').addEventListener('click', () => {
        if (confirm(`確定要刪除「${g.name}」嗎？`)) {
          state.guests = state.guests.filter(item => item !== g);
          renderGuestStats();
          renderGuestsTable(dom.guestFilterInput.value);
        }
      });

      dom.guestsTableBody.appendChild(tr);
    });
  }

  // 搜尋過濾
  dom.guestFilterInput.addEventListener('input', (e) => {
    renderGuestsTable(e.target.value);
  });

  // 新增單筆賓客
  dom.openAddGuestModalBtn.addEventListener('click', () => {
    const name = prompt('請輸入賓客姓名：');
    if (!name || !name.trim()) return;

    const tableId = prompt('請輸入所屬桌號 (如: 7 或 M)：', '1');
    if (!tableId || !tableId.trim()) return;

    const relation = prompt('請輸入親友關係或身分 (如: 大學同學)：', '賓客');
    const diet = prompt('飲食需求 (葷 / 素食)：', '葷');

    const newGuest = {
      id: Date.now(),
      name: name.trim(),
      tableId: tableId.trim(),
      relation: (relation || '').trim(),
      diet: (diet || '葷').trim(),
      note: ''
    };

    if (!state.guests) state.guests = [];
    state.guests.push(newGuest);

    renderGuestStats();
    renderGuestsTable();
    alert(`成功新增賓客：${name}（第 ${tableId} 桌）`);
  });

  // ==========================================
  // 批次文字匯入 (CSV / Excel 複製貼上)
  // ==========================================
  function parseBatchText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsed = [];

    lines.forEach((line, index) => {
      // 支援逗號或 Tab (Excel 複製) 分隔
      let parts = line.includes('\t') ? line.split('\t') : line.split(',');
      parts = parts.map(p => p.trim());

      if (parts[0]) {
        parsed.push({
          id: Date.now() + index,
          name: parts[0],
          tableId: parts[1] || '1',
          relation: parts[2] || '賓客',
          diet: parts[3] || '葷',
          note: parts[4] || ''
        });
      }
    });

    return parsed;
  }

  dom.batchAppendBtn.addEventListener('click', () => {
    const text = dom.batchImportText.value.trim();
    if (!text) {
      alert('請先在文字框中輸入或貼上名單內容！');
      return;
    }

    const list = parseBatchText(text);
    if (list.length === 0) {
      alert('未能解析出有效的賓客名單，請確認格式！');
      return;
    }

    if (!state.guests) state.guests = [];
    state.guests = state.guests.concat(list);

    renderGuestStats();
    renderGuestsTable();
    dom.batchImportText.value = '';
    alert(`成功批次追加了 ${list.length} 位賓客名單！`);
  });

  dom.batchOverwriteBtn.addEventListener('click', () => {
    const text = dom.batchImportText.value.trim();
    if (!text) {
      alert('請先在文字框中輸入或貼上名單內容！');
      return;
    }

    if (!confirm('⚠️ 警告：這將會完全清空並取代現有的賓客名單！確定要覆蓋嗎？')) {
      return;
    }

    const list = parseBatchText(text);
    state.guests = list;

    renderGuestStats();
    renderGuestsTable();
    dom.batchImportText.value = '';
    alert(`已成功覆蓋！目前賓客名單共有 ${list.length} 位。`);
  });

  // 匯出 CSV (支援 Excel 不亂碼的 UTF-8 BOM)
  dom.exportCsvBtn.addEventListener('click', () => {
    const guests = state.guests || [];
    let csvContent = '\uFEFF姓名,桌號,關係,飲食需求,備註\n';

    guests.forEach(g => {
      const row = [
        `"${(g.name || '').replace(/"/g, '""')}"`,
        `"${(g.tableId || '').replace(/"/g, '""')}"`,
        `"${(g.relation || '').replace(/"/g, '""')}"`,
        `"${(g.diet || '').replace(/"/g, '""')}"`,
        `"${(g.note || '').replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `婚禮賓客名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ==========================================
  // 收集全站設定資料物件
  // ==========================================
  function gatherFullState() {
    state.weddingInfo.couple = dom.coupleInput.value.trim();
    state.weddingInfo.date = dom.dateInput.value.trim();
    state.weddingInfo.time = dom.timeInput.value.trim();
    state.weddingInfo.venue = dom.venueInput.value.trim();
    state.weddingInfo.welcomeMessage = dom.welcomeInput.value.trim();
    state.weddingInfo.adminPassword = dom.pwdSettingInput.value.trim() || '1314';

    state.theme.backgroundImage = dom.bgUrlInput.value.trim();
    state.theme.overlayOpacity = parseFloat(dom.bgOpacityRange.value);

    state.seatingMap.imageUrl = dom.seatingUrlInput.value.trim() || 'assets/default-seating.svg';

    return state;
  }

  // 產生 config.js 檔案內容字串
  function generateConfigFileString() {
    const fullState = gatherFullState();
    return `/**
 * 婚禮帶位系統 - 核心設定與資料檔
 * 匯出時間: ${new Date().toLocaleString()}
 */

window.WEDDING_CONFIG = ${JSON.stringify(fullState, null, 2)};
`;
  }

  // ==========================================
  // 儲存至本地瀏覽器 LocalStorage
  // ==========================================
  function saveToLocalStorage() {
    const fullState = gatherFullState();
    try {
      localStorage.setItem('WEDDING_SAVED_CONFIG', JSON.stringify(fullState));
      alert('🎉 變更已成功儲存至目前瀏覽器！\n\n現在打開前台頁面即可立即檢視最新效果。');
    } catch (e) {
      alert('儲存失敗：' + e.message + '\n（若上傳的照片尺寸過大，建議改用雲端圖片網址或下載 config.js 覆蓋專案檔案）');
    }
  }

  dom.topSaveBtn.addEventListener('click', saveToLocalStorage);
  dom.saveLocalStorageBtn.addEventListener('click', saveToLocalStorage);

  // ==========================================
  // 下載 config.js 檔案
  // ==========================================
  dom.downloadConfigBtn.addEventListener('click', () => {
    const content = generateConfigFileString();
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 複製 config.js 程式碼
  dom.copyConfigBtn.addEventListener('click', () => {
    const content = generateConfigFileString();
    navigator.clipboard.writeText(content).then(() => {
      alert('已成功複製完整 config.js 程式碼！\n\n您可以到 GitHub 網頁上打開 js/config.js，按編輯並全選貼上覆蓋即可。');
    }).catch(err => {
      alert('無法複製到剪貼簿，請手動下載檔案。');
    });
  });

  // 還原預設值
  dom.resetDefaultBtn.addEventListener('click', () => {
    if (confirm('確定要清除自訂修改，還原成系統預設的示範資料嗎？')) {
      localStorage.removeItem('WEDDING_SAVED_CONFIG');
      state = JSON.parse(JSON.stringify(window.WEDDING_CONFIG || {}));
      initAdminData();
      alert('已還原為系統預設資料！');
    }
  });

  // 啟動驗證檢查
  checkAuth();
})();
