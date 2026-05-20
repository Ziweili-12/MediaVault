# MediaVault 📀🎬

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%2F%20Android-blue" />
  <img src="https://img.shields.io/badge/Framework-React%20Native%20%2F%20Expo-0088CC" />
  <img src="https://img.shields.io/badge/Database-SQLite%20%2B%20Supabase-3FCF8E" />
</p>

一个精美的个人多媒体收藏管理应用，用于追踪和管理您的黑胶唱片与影视收藏。采用 iPhone 风格设计，支持条码扫描、API 搜索、云同步等功能。

---

## ✨ 功能特色

### 🎵 黑胶唱片管理
- **条码扫描** — 扫描唱片条码自动识别
- **Discogs API 集成** — 搜索并获取唱片详细信息
- **自定义标签** — 添加个人标签分类
- **购买记录** — 记录购买日期和价格

### 🎬 影视收藏管理
- **TMDB API 集成** — 搜索电影和电视剧
- **中英双语** — 支持英文主标题 + 中文副标题
- **剧集追踪** — 按季管理电视剧进度
- **观看状态** — 已看/想看/在看

### 📊 数据统计
- **收藏概览** — 总数、本月新增、总花费
- **月度趋势** — 购买/观看数量与金额走势
- **艺术家排行** — 最爱的音乐人 TOP 10
- **类型分布** — 电影/电视剧/音乐分类统计

### ☁️ 数据同步
- **Supabase 云同步** — 多设备数据同步
- **本地 SQLite** — 离线可用，响应迅速

---

## 📱 界面预览

| 网格视图 | 列表视图 | 详情页 | 统计分析 |
|:---:|:---:|:---:|:---:|
| 封面墙展示 | 紧凑列表 | 完整信息 | 数据可视化 |

### 设计亮点
- 🎨 iPhone 风格 UI，支持深色/浅色模式
- 📐 电影海报 2:3 比例，音乐封面 1:1 比例
- 🏷️ 智能标签过滤，去除无意义通用词
- 📅 日历模式，查看每月收藏记录
- ⭐ 交互式评分系统，支持半星精度

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React Native + Expo SDK 52 |
| 数据库 | 本地 SQLite + Supabase 云同步 |
| API | Discogs (音乐)、TMDB (影视) |
| 动画 | React Native Reanimated |
| 状态管理 | React Context |
| 导航 | React Navigation |

---

## 🚀 快速开始

### 1. 环境准备
```bash
# 安装依赖
npm install

# 安装 Expo CLI
npm install -g expo-cli
```

### 2. 环境变量配置
创建 `.env` 文件：
```env
EXPO_PUBLIC_DISCOGS_TOKEN=your_discogs_token
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Supabase 数据库设置
```sql
-- 黑胶唱片表
CREATE TABLE vinyls (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  artist TEXT,
  release_date TEXT,
  format TEXT,
  cover_image TEXT,
  purchase_date TEXT,
  purchase_price NUMERIC,
  tags TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 影视表
CREATE TABLE movies (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  chinese_title TEXT,
  original_title TEXT,
  release_date TEXT,
  type TEXT, -- movie 或 tv
  poster_path TEXT,
  country TEXT,
  season TEXT,
  episode TEXT,
  rating NUMERIC,
  notes TEXT,
  watch_date TEXT,
  watch_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 运行项目
```bash
# 启动开发服务器
npx expo start

# 在真机上运行
# 扫描终端中的 QR 码，使用 Expo Go 应用打开
```

---

## 📂 项目结构

```
MediaVault/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── VinylDetailModal.tsx
│   │   ├── MovieDetailModal.tsx
│   │   ├── ArtistDetailModal.tsx
│   │   ├── StarRating.tsx
│   │   ├── CalendarMode.tsx
│   │   └── ...
│   ├── screens/           # 页面组件
│   │   ├── HomeScreen.tsx
│   │   ├── VinylScreen.tsx
│   │   ├── MovieScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── database/          # 数据库操作
│   │   └── database.ts
│   ├── services/          # API 服务
│   │   ├── discogs.ts
│   │   └── tmdb.ts
│   ├── utils/             # 工具函数
│   │   ├── colorExtractor.ts
│   │   └── deviceAdapter.ts
│   └── theme.ts           # 主题配置
├── App.tsx                # 应用入口
├── preview.html           # UI 预览文件
└── package.json
```

---

## 🔧 API 获取

### Discogs API
1. 访问 [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. 创建应用获取 Personal Access Token

### TMDB API
1. 访问 [TMDB API Settings](https://www.themoviedb.org/settings/api)
2. 申请 API Key（免费 400,000 次/月）

---

## 📋 开发路线图

- [x] 黑胶唱片 CRUD
- [x] 电影/电视剧 CRUD
- [x] 条码扫描
- [x] 统计分析
- [x] 网格/列表视图切换
- [ ] Supabase 双向同步
- [ ] 数据导入/导出
- [ ] 社交分享功能
- [ ] iPad 适配

---

## 📄 许可证

MIT License

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Ziweili-12">Ziweili</a>
</p>
