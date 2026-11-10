/**
 * 婚禮帶位系統 - 核心設定與資料檔
 * 
 * 💡 雲端修改方式：
 * 只要在 GitHub 倉庫中打開這個檔案 (js/config.js)，點擊右上角的「鉛筆 ✏️」圖示即可直接編輯！
 * 編輯完畢點擊「Commit changes」儲存，GitHub Pages 或 Cloudflare 就會自動更新。
 */

window.WEDDING_CONFIG = {
  // 婚禮基本資訊
  weddingInfo: {
    title: "WEDDING INVITATION",
    couple: "宇翔 ❤️ 語彤",
    subtitle: "誠摯邀請您見證我們的幸福時刻",
    date: "2026 年 11 月 28 日 星期六",
    time: "12:00 入席 • 12:30 開席",
    venue: "格萊天漾大飯店 15F 萬大廳",
    address: "台北市萬華區艋舺大道 101 號",
    welcomeMessage: "親愛的賓客，感謝您遠道而來！請輸入您的姓名，為您指引專屬座位。",
    adminPassword: "1314" // 後台管理預設密碼，可自由修改
  },

  // 視覺外觀設定
  theme: {
    // 新人婚紗照背景圖：可填寫相對路徑（如 'assets/my-photo.jpg'）或雲端圖片網址
    // 若為空字串 ""，則會自動使用內建的優雅婚禮手繪向量背景
    backgroundImage: "",
    // 背景圖片遮罩濃度 (0.1 ~ 0.9)，數值越高文字越清楚
    overlayOpacity: 0.65,
    // 主題色 (Hex)
    primaryColor: "#DFBA75"
  },

  // 座位平面圖設定
  seatingMap: {
    // 平面圖路徑：可填寫上傳的圖片檔或外部網址，預設使用內建宴會廳平面圖
    imageUrl: "assets/default-seating.svg",
    // 各桌在平面圖上的相對位置百分比 (x: 0~100%, y: 0~100%)
    tables: [
      { id: "M", name: "主桌", note: "新人與雙方主婚人", x: 50.0, y: 20.0 },
      { id: "1", name: "01 桌", note: "男方長輩桌", x: 25.0, y: 30.0 },
      { id: "2", name: "02 桌", note: "女方長輩桌", x: 75.0, y: 30.0 },
      { id: "3", name: "03 桌", note: "男方親戚桌", x: 25.0, y: 41.7 },
      { id: "4", name: "04 桌", note: "女方親戚桌", x: 75.0, y: 41.7 },
      { id: "5", name: "05 桌", note: "男方貴賓桌", x: 10.0, y: 35.8 },
      { id: "6", name: "06 桌", note: "女方貴賓桌", x: 90.0, y: 35.8 },
      { id: "7", name: "07 桌", note: "新郎大學同學", x: 25.0, y: 53.3 },
      { id: "8", name: "08 桌", note: "新娘大學同學", x: 75.0, y: 53.3 },
      { id: "9", name: "09 桌", note: "新郎高中好友", x: 10.0, y: 49.2 },
      { id: "10", name: "10 桌", note: "新娘閨蜜死黨", x: 90.0, y: 49.2 },
      { id: "11", name: "11 桌", note: "新郎公司同事", x: 25.0, y: 65.0 },
      { id: "12", name: "12 桌", note: "新娘公司同事", x: 75.0, y: 65.0 },
      { id: "13", name: "13 桌", note: "男方社團夥伴", x: 10.0, y: 61.7 },
      { id: "14", name: "14 桌", note: "女方親朋好友", x: 90.0, y: 61.7 },
      { id: "15", name: "15 桌", note: "工作人員桌", x: 25.0, y: 75.8 },
      { id: "16", name: "16 桌", note: "預備桌", x: 75.0, y: 75.8 }
    ]
  },

  // 賓客名單範例資料（您隨時可以透過後台直接上傳覆蓋，或直接在此修改）
  guests: [
    // 主桌
    { id: 1, name: "張國華", tableId: "M", relation: "新郎父親", diet: "葷", note: "主婚人" },
    { id: 2, name: "李淑芬", tableId: "M", relation: "新郎母親", diet: "葷", note: "主婚人" },
    { id: 3, name: "林建志", tableId: "M", relation: "新娘父親", diet: "葷", note: "主婚人" },
    { id: 4, name: "陳美惠", tableId: "M", relation: "新娘母親", diet: "葷", note: "主婚人" },
    { id: 5, name: "張爺爺", tableId: "M", relation: "新郎長輩", diet: "素食", note: "輪椅引導" },

    // 01 桌 - 男方長輩桌
    { id: 6, name: "張伯父", tableId: "1", relation: "男方大伯", diet: "葷", note: "" },
    { id: 7, name: "張伯母", tableId: "1", relation: "男方大嬸", diet: "葷", note: "" },
    { id: 8, name: "張大姑", tableId: "1", relation: "男方姑姑", diet: "葷", note: "" },
    { id: 9, name: "李小舅", tableId: "1", relation: "男方舅舅", diet: "葷", note: "" },

    // 02 桌 - 女方長輩桌
    { id: 10, name: "林大伯", tableId: "2", relation: "女方伯父", diet: "葷", note: "" },
    { id: 11, name: "林大嬸", tableId: "2", relation: "女方伯母", diet: "葷", note: "" },
    { id: 12, name: "陳大舅", tableId: "2", relation: "女方舅舅", diet: "葷", note: "" },
    { id: 13, name: "陳小姨", tableId: "2", relation: "女方阿姨", diet: "素食", note: "素食餐" },

    // 07 桌 - 新郎大學同學
    { id: 14, name: "王小明", tableId: "7", relation: "台大資工同窗", diet: "葷", note: "伴郎" },
    { id: 15, name: "陳冠宇", tableId: "7", relation: "台大資工同窗", diet: "葷", note: "" },
    { id: 16, name: "林志豪", tableId: "7", relation: "台大資工室友", diet: "葷", note: "" },
    { id: 17, name: "黃俊傑", tableId: "7", relation: "熱音社吉他手", diet: "葷", note: "" },
    { id: 18, name: "李佳穎", tableId: "7", relation: "資工系學妹", diet: "素食", note: "蛋奶素" },

    // 08 桌 - 新娘大學同學
    { id: 19, name: "張雅婷", tableId: "8", relation: "政大企管同窗", diet: "葷", note: "伴娘" },
    { id: 20, name: "陳冠宇", tableId: "8", relation: "企管系同班（同名測試）", diet: "葷", note: "新娘大學同學" },
    { id: 21, name: "許瑋庭", tableId: "8", relation: "政大企管同窗", diet: "葷", note: "需兒童椅 x1" },
    { id: 22, name: "蔡佩珊", tableId: "8", relation: "企管系啦啦隊", diet: "葷", note: "" },

    // 09 桌 - 新郎高中好友
    { id: 23, name: "吳宗翰", tableId: "9", relation: "建中熱舞社", diet: "葷", note: "" },
    { id: 24, name: "劉哲銘", tableId: "9", relation: "高中死黨", diet: "葷", note: "" },
    { id: 25, name: "郭宇倫", tableId: "9", relation: "建中同班", diet: "葷", note: "" },

    // 10 桌 - 新娘閨蜜死黨
    { id: 26, name: "周若晴", tableId: "10", relation: "北一女高中閨蜜", diet: "葷", note: "總召協助" },
    { id: 27, name: "方詩涵", tableId: "10", relation: "國中摯友", diet: "素食", note: "全素" },
    { id: 28, name: "何品萱", tableId: "10", relation: "留學室友", diet: "葷", note: "" },

    // 11 桌 - 新郎公司同事
    { id: 29, name: "張總監", tableId: "11", relation: "公司主管", diet: "葷", note: "貴賓祝詞" },
    { id: 30, name: "楊研發長", tableId: "11", relation: "部門副總", diet: "葷", note: "" },
    { id: 31, name: "謝工程師", tableId: "11", relation: "專案隊友", diet: "葷", note: "" },
    { id: 32, name: "趙產品經理", tableId: "11", relation: "同組同事", diet: "葷", note: "" },

    // 12 桌 - 新娘公司同事
    { id: 33, name: "洪經理", tableId: "12", relation: "行銷主管", diet: "葷", note: "" },
    { id: 34, name: "徐專員", tableId: "12", relation: "行銷部好夥伴", diet: "葷", note: "" },
    { id: 35, name: "彭設計師", tableId: "12", relation: "視覺設計師", diet: "葷", note: "" }
  ]
};
