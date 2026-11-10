# 💍 婚禮賓客自助查位與帶位導航系統 (Wedding Seating Guide)

專為婚禮招待與新人打造的**免登入自助查位網頁**。賓客只需使用手機或平板掃描迎賓處的 QR Code，輸入姓名即可快速得知桌號、查看座位平面圖位置與同桌親友。

---

## ✨ 系統核心亮點

1. **極致手機與平板體驗（Mobile-First RWD）**：
   - 專為行動裝置直式與橫式螢幕最佳化，大字體、高對比度、防呆易操作。
   - 賓客**完全免登入、免驗證帳號**，秒開秒查。
2. **智慧姓名比對與同名防呆**：
   - 支援即時打字聯想與模糊比對。
   - 若有同名同姓賓客，系統自動列出親友關係（如：大學同學 vs 國中好友），讓賓客一鍵確認。
3. **互動式平面圖與呼吸燈高亮 (Table Pulse Pin)**：
   - 查位後自動在平面圖上以金色光圈閃爍標出座位位置。
   - 支援手指雙指縮放 (Pinch-to-zoom)、單指拖曳平移、以及點擊各桌查看同桌清單。
4. **招待人員專用後台 (`admin.html`)**：
   - **視覺化點擊標記器 (Table Marker)**：上傳任何餐廳的平面圖後，直接在圖上點擊即可設定桌號座標，支援拖曳微調！
   - **新人照片背景更換**：支援本地圖檔即時上傳或貼上雲端圖床網址，隨附遮罩濃度調整。
   - **賓客名單批次匯入**：可直接從 Excel 複製貼上，支援 CSV 匯入與匯出。
   - **密碼保護機制**：後台設有安全密碼（預設 `1314`），可自行修改。
5. **雲端線上修改支援（GitHub / Cloudflare）**：
   - 無需任何伺服器（純靜態 Serverless 架構），抗瞬間數百人高併發。
   - 支援在 GitHub 網頁版直接編輯 `js/config.js`，儲存後 30 秒自動更新！

---

## 📁 檔案結構說明

```text
婚禮帶位/
├── index.html            # 賓客查位端前台（手機掃描後進入的主頁面）
├── admin.html            # 招待人員後台（上傳名單、平面圖、新人照、標記座標）
├── css/
│   ├── style.css         # 前台奢華浪漫婚禮風樣式
│   └── admin.css         # 後台管理控制面板樣式
├── js/
│   ├── config.js         # 核心設定與名單資料庫（在 GitHub 網頁上可直接編輯此檔）
│   ├── app.js            # 前台查位演算法、平面圖互動、同桌關聯邏輯
│   └── admin.js          # 後台標記器、CSV 解析、LocalStorage 與匯出邏輯
├── assets/
│   ├── default-bg.svg    # 內建高質感婚禮向量背景（照片備妥前預設呈現）
│   └── default-seating.svg # 內建標準宴會廳平面圖（含主桌、紅毯、1~16 桌）
├── .gitignore
└── README.md             # 本完整指引手冊
```

---

## 🚀 本機預覽方式

本專案為零依賴純前端架構：
- **方式一（最簡單）**：直接在電腦檔案總管中，雙擊滑鼠左鍵打開 `index.html`（前台）或 `admin.html`（後台）即可直接在瀏覽器運作！
- **方式二（招待測試模式）**：
  - 開啟 `index.html`，點擊右下角「📱 顯示現場 QR Code」。
  - 亦可點擊「⚙️ 招待人員後台管理」（密碼輸入 `1314`）進行增刪改查。

---

## ☁️ 雲端部署教學（GitHub Pages / Cloudflare Pages）

本系統完全相容於 **GitHub Pages** 與 **Cloudflare Pages**，永久免費、秒級載入。

### 方案 A：使用 GitHub Pages 部署（最推薦，最容易線上修改）

1. **建立 GitHub 儲存庫**：
   - 登入 [GitHub](https://github.com/)，點擊右上角「New repository」。
   - 輸入名稱（例如：`wedding-seating`），設為 **Public**，點擊「Create repository」。
2. **上傳本機程式碼至 GitHub**：
   - 在本專案資料夾內開啟終端機或命令提示字元，執行：
     ```bash
     git init
     git add .
     git commit -m "feat: 婚禮賓客自助查位系統初版"
     git branch -M main
     git remote add origin https://github.com/Ameipu/Ann.git
     git push -u origin main
     ```
3. **開啟 GitHub Pages 免費託管**：
   - 進入您的 GitHub 儲存庫頁面，點擊上方的 **Settings**（設定）。
   - 左側選單點擊 **Pages**。
   - 在 **Build and deployment** > **Branch** 下拉選單中，選擇 `main` 分支、資料夾選 `/ (root)`，點擊 **Save**。
   - 等待約 1 分鐘重新整理頁面，上方就會顯示您的專屬網址：
     `https://Ameipu.github.io/Ann/`
4. **生成迎賓立牌 QR Code**：
   - 打開該網址，點擊「📱 顯示現場 QR Code」並截圖或下載，印出貼在迎賓牌上即可！

---

### 方案 B：使用 Cloudflare Pages 部署

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 點擊左側 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**。
3. 選擇您剛剛推送的 GitHub 儲存庫 `wedding-seating`。
4. 設定建置參數：
   - **Framework preset**：選擇 `None`
   - **Build command**：（留空）
   - **Build output directory**：（留空，即根目錄）
5. 點擊 **Save and Deploy**，Cloudflare 即會為您配發一組極速 CDN 網址（例如 `wedding-seating.pages.dev`）。

---

## ✏️ 雲端線上修改教學（名單、照片、桌位更換）

當賓客名單確認、飯店平面圖或婚紗照拿到之後，您隨時可以進行更新，有兩種極為簡單的方式：

### 途徑 1：直接在 GitHub 網頁版修改（最快，免打開電腦終端機）

1. 在手機或電腦瀏覽器打開您的 GitHub 儲存庫。
2. 點進 `js/` 資料夾，點選 `config.js`。
3. 點擊右上角的「✏️ 鉛筆圖示 (Edit this file)」。
4. 您可以直接修改：
   - 新人稱呼、宴客時間、宴客地點
   - 圖片網址（如上傳到 Imgur 的婚紗照或放在 `assets/` 的檔名）
   - `guests` 陣列中的賓客姓名、桌號與飲食需求
5. 滾動到最下方，點擊綠色的 **Commit changes...**。
6. GitHub Pages 或 Cloudflare 會在 **10 ~ 30 秒內自動重新發布**，所有賓客掃碼即看到最新名單！

### 途徑 2：透過後台一鍵下載並覆蓋更新

1. 進入線上後台（網址後方加上 `/admin.html`，輸入密碼 `1314`）。
2. 在「👥 賓客名單管理」中批次貼上 Excel 名單、在「🗺️ 座位圖與桌位標記」上點擊標定新餐廳平面圖的桌位。
3. 切換到「☁️ 雲端同步與 GitHub 修改」分頁。
4. 點擊 **「📥 下載 config.js 檔案」** 或 **「📋 複製完整 config 程式碼」**。
5. 將該檔案替換回專案並推送到 GitHub，即完成更新。

---

## 💡 招待現場小秘訣 (Tips for Receptionists)

1. **平板立牌**：可以在收禮桌立一台 iPad / Android 平板，開啟 `index.html` 點擊「顯示現場 QR Code」，當賓客走近時直接用手機掃描。
2. **招待備用手機**：招待人員可將 `admin.html` 加入手機主畫面書籤，若現場有臨時換桌、加位或素食調整，招待直接在後台搜尋並修改，即刻儲存生效。
3. **同名同姓識別**：若有同學與親戚同名，輸入姓名後系統會貼心詢問「請問您是哪位親友？」，不會發生帶錯桌的窘況！
