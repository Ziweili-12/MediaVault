# MediaVault 推荐系统与主题色实现框架

> 生成时间：2026-05-17  
> 版本：v1.0

---

## 📋 目录

1. [智能推荐系统](#1-智能推荐系统)
2. [主题色提取增强](#2-主题色提取增强)
3. [日夜间模式深度适配](#3-日夜间模式深度适配)
4. [技术实现细节](#4-技术实现细节)
5. [开发步骤与时间规划](#5-开发步骤与时间规划)

---

## 1. 智能推荐系统

### 1.1 每日推荐算法

#### 核心思路
根据天气、心情、用户偏好等因素，每天为用户推荐适合聆听的黑胶唱片。

#### 输入因素

| 因素 | 权重 | 数据来源 | 说明 |
|------|------|----------|------|
| 天气 | 30% | 天气 API | 根据天气状况匹配音乐风格 |
| 心情 | 30% | 用户选择/时间推断 | 根据心情状态推荐 |
| 流派偏好 | 20% | 用户历史数据 | 分析用户最常听的流派 |
| 艺术家相似度 | 20% | Discogs API | 推荐相似艺术家作品 |

#### 天气-音乐映射规则

```typescript
const WEATHER_MOOD_MAP: Record<string, { genres: string[]; energy: number }> = {
  '晴天': { genres: ['Pop', 'Indie Pop', 'Funk'], energy: 0.8 },
  '多云': { genres: ['Indie', 'Alternative', 'Britpop'], energy: 0.6 },
  '雨天': { genres: ['Jazz', 'Blues', 'Lo-fi', 'Ambient'], energy: 0.4 },
  '雪天': { genres: ['Classical', 'Post-Rock', 'Ambient'], energy: 0.3 },
  '雷暴': { genres: ['Rock', 'Metal', 'Electronic'], energy: 0.9 },
  '夜晚': { genres: ['Jazz', 'R&B', 'Soul', 'Chillout'], energy: 0.5 },
};
```

#### 心情-音乐映射规则

```typescript
const MOOD_MUSIC_MAP: Record<string, { genres: string[]; tempo: string }> = {
  '开心': { genres: ['Pop', 'Disco', 'Funk', 'Dance'], tempo: 'fast' },
  '平静': { genres: ['Classical', 'Ambient', 'New Age'], tempo: 'slow' },
  '忧郁': { genres: ['Blues', 'Indie', 'Slowcore'], tempo: 'slow' },
  '兴奋': { genres: ['Rock', 'Electronic', 'Hip-Hop'], tempo: 'fast' },
  '专注': { genres: ['Post-Rock', 'Minimal', 'Lo-fi'], tempo: 'medium' },
  '浪漫': { genres: ['Jazz', 'Soul', 'R&B', 'Bossa Nova'], tempo: 'slow' },
};
```

#### 推荐分数计算

```typescript
interface RecommendationScore {
  vinyl_id: number;
  total_score: number;
  weather_score: number;
  mood_score: number;
  genre_score: number;
  artist_score: number;
  reason: string; // 推荐理由
}

function calculateRecommendationScore(
  vinyl: Vinyl,
  weather: WeatherInfo,
  mood: UserMood,
  userPreferences: UserPreferences
): RecommendationScore {
  // 1. 天气匹配度 (0-1)
  const weatherScore = calculateWeatherMatch(vinyl.genre, weather);
  
  // 2. 心情匹配度 (0-1)
  const moodScore = calculateMoodMatch(vinyl.genre, mood);
  
  // 3. 流派偏好 (0-1)
  const genreScore = calculateGenrePreference(vinyl.genre, userPreferences);
  
  // 4. 艺术家相似度 (0-1)
  const artistScore = calculateArtistSimilarity(vinyl.artist, userPreferences);
  
  // 加权总分
  const totalScore = 
    weatherScore * 0.3 +
    moodScore * 0.3 +
    genreScore * 0.2 +
    artistScore * 0.2;
  
  // 生成推荐理由
  const reason = generateRecommendationReason(weather, mood, vinyl);
  
  return {
    vinyl_id: vinyl.id,
    total_score: totalScore,
    weather_score: weatherScore,
    mood_score: moodScore,
    genre_score: genreScore,
    artist_score: artistScore,
    reason,
  };
}
```

#### 推荐理由生成

```typescript
function generateRecommendationReason(
  weather: WeatherInfo,
  mood: UserMood,
  vinyl: Vinyl
): string {
  const reasons = [];
  
  if (weather.condition === '雨天') {
    reasons.push('今天下雨，适合听点爵士');
  }
  if (mood.type === '平静') {
    reasons.push('心情平静，这张专辑很搭');
  }
  if (vinyl.personal_rating >= 8) {
    reasons.push('这是你收藏中的高分作品');
  }
  
  return reasons.slice(0, 2).join('，') || '根据你的喜好推荐';
}
```

### 1.2 社交推荐功能

#### 功能定义

| 功能 | 说明 | 数据来源 |
|------|------|----------|
| 大家都在听 | 热门黑胶推荐 | 全局统计/模拟数据 |
| 大家都在看 | 热门影视推荐 | 全局统计/模拟数据 |
| 相似用户推荐 | 基于用户画像匹配 | 本地算法 |

#### 第一阶段：本地模拟实现

```typescript
// 使用本地数据模拟社交推荐
function getPopularVinyls(allVinyls: Vinyl[]): Vinyl[] {
  // 按评分和添加时间排序
  return allVinyls
    .sort((a, b) => {
      const scoreA = (a.personal_rating || 5) + (a.created_at ? 1 : 0);
      const scoreB = (b.personal_rating || 5) + (b.created_at ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 10);
}

function getSimilarUserRecommendations(
  currentVinyls: Vinyl[],
  allVinyls: Vinyl[]
): Vinyl[] {
  // 分析用户偏好流派
  const userGenres = analyzeUserGenres(currentVinyls);
  
  // 推荐同流派但用户未收藏的作品（模拟）
  return allVinyls
    .filter(v => !currentVinyls.find(cv => cv.id === v.id))
    .filter(v => hasMatchingGenre(v.genre, userGenres))
    .slice(0, 5);
}
```

---

## 2. 主题色提取增强

### 2.1 当前实现分析

现有 `colorExtractor.ts` 支持：
- **Web 平台**：Canvas API 真实提取 ✅
- **Native 平台**：URL hash 生成伪随机颜色 ⚠️

**问题**：Native 平台无法真实提取封面主色调。

### 2.2 增强方案

#### 安装依赖

```bash
npx expo install react-native-image-colors
```

#### 增强后的 colorExtractor.ts

```typescript
import { Platform } from 'react-native';
import ImageColors from 'react-native-image-colors';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  gradient: string[];
}

export async function extractColors(imageUrl: string): Promise<ColorPalette> {
  if (!imageUrl) return DEFAULT_PALETTE;

  try {
    if (Platform.OS === 'web') {
      return await extractColorsWeb(imageUrl);
    } else {
      // Native: 使用 react-native-image-colors
      return await extractColorsNative(imageUrl);
    }
  } catch (error) {
    console.warn('Color extraction failed:', error);
    return generateFallbackPalette(imageUrl);
  }
}

async function extractColorsNative(imageUrl: string): Promise<ColorPalette> {
  const result = await ImageColors.getColors(imageUrl, {
    fallback: '#000000',
    cache: true,
    key: imageUrl,
  });

  if (result.platform === 'ios') {
    return {
      primary: result.primary,
      secondary: result.secondary,
      accent: result.detail || result.secondary,
      background: result.background,
      gradient: [result.primary, result.secondary, result.background],
    };
  } else if (result.platform === 'android') {
    return {
      primary: result.vibrant || result.dominant,
      secondary: result.darkVibrant || result.muted,
      accent: result.lightVibrant || result.lightMuted,
      background: result.dominant,
      gradient: [
        result.vibrant || result.dominant,
        result.darkVibrant || result.muted,
        result.dominant,
      ],
    };
  }

  return generateFallbackPalette(imageUrl);
}
```

### 2.3 主题色应用场景

#### 详情页背景渐变

```typescript
// VinylDetailModal.tsx / MovieDetailModal.tsx
const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);

useEffect(() => {
  if (item.cover_url) {
    extractColors(item.cover_url).then(setPalette);
  }
}, [item.cover_url]);

// 背景渐变样式
const backgroundStyle = {
  background: `linear-gradient(180deg, ${palette.primary}40 0%, ${palette.background}20 50%, #000000 100%)`,
};
```

#### 卡片边框动态配色

```typescript
const cardStyle = {
  borderColor: palette.accent,
  shadowColor: palette.primary,
};
```

---

## 3. 日夜间模式深度适配

### 3.1 主题色与日夜间融合

```typescript
// 增强后的 ThemeProvider
interface EnhancedThemeContext {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  
  // 新增：动态主题色
  getAdaptiveColor: (palette: ColorPalette) => {
    primary: string;
    secondary: string;
    text: string;
  };
}

function getAdaptiveColor(palette: ColorPalette, isDark: boolean) {
  if (isDark) {
    // 夜间模式：使用原始饱和色
    return {
      primary: palette.primary,
      secondary: palette.secondary,
      text: '#ffffff',
    };
  } else {
    // 日间模式：降低饱和度，提高亮度
    return {
      primary: adjustBrightness(palette.primary, 20),
      secondary: adjustBrightness(palette.secondary, 30),
      text: '#000000',
    };
  }
}
```

### 3.2 动态对比度调整

```typescript
function getContrastColor(background: string): string {
  const rgb = hexToRgb(background);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
```

---

## 4. 技术实现细节

### 4.1 新增依赖

```json
{
  "dependencies": {
    "react-native-image-colors": "^2.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

### 4.2 数据库扩展

#### 新增表：user_preferences

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 示例数据
INSERT INTO user_preferences (key, value) VALUES
  ('mood_history', '["平静","开心","专注"]'),
  ('genre_weights', '{"Jazz": 0.8, "Rock": 0.6, "Classical": 0.4}'),
  ('recommendation_enabled', 'true');
```

#### 新增表：recommendation_history

```sql
CREATE TABLE IF NOT EXISTS recommendation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vinyl_id INTEGER,
  recommended_at TEXT DEFAULT CURRENT_TIMESTAMP,
  weather_condition TEXT,
  user_mood TEXT,
  score REAL,
  accepted INTEGER DEFAULT 0,
  FOREIGN KEY (vinyl_id) REFERENCES vinyls(id)
);
```

### 4.3 新增文件结构

```
src/
├── services/
│   ├── weatherApi.ts          # 天气API服务
│   └── recommendationEngine.ts # 推荐算法引擎
├── screens/
│   └── RecommendationScreen.tsx # 推荐页面
├── components/
│   ├── RecommendationCard.tsx   # 推荐卡片组件
│   └── MoodSelector.tsx        # 心情选择器
├── hooks/
│   └── useRecommendation.ts    # 推荐逻辑Hook
└── utils/
    └── weatherMoodMapper.ts    # 天气/心情映射规则
```

### 4.4 天气 API 集成

```typescript
// services/weatherApi.ts
interface WeatherInfo {
  condition: string;  // '晴天', '雨天', etc.
  temperature: number;
  humidity: number;
  description: string;
}

export async function getCurrentWeather(): Promise<WeatherInfo> {
  // 使用免费天气 API (如 OpenWeatherMap, 和风天气)
  const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
  const location = await getLocation();
  
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=zh_cn`
  );
  
  const data = await response.json();
  
  return {
    condition: mapWeatherCondition(data.weather[0].main),
    temperature: data.main.temp,
    humidity: data.main.humidity,
    description: data.weather[0].description,
  };
}

function mapWeatherCondition(condition: string): string {
  const mapping: Record<string, string> = {
    'Clear': '晴天',
    'Clouds': '多云',
    'Rain': '雨天',
    'Drizzle': '雨天',
    'Thunderstorm': '雷暴',
    'Snow': '雪天',
    'Mist': '多云',
    'Fog': '多云',
  };
  return mapping[condition] || '晴天';
}
```

---

## 5. 开发步骤与时间规划

### 第一阶段：主题色增强（1-2天）

- [ ] 安装 `react-native-image-colors`
- [ ] 修改 `colorExtractor.ts`，增强 Native 平台提取
- [ ] 在详情页集成主题色背景
- [ ] 测试 iOS/Android 平台效果

### 第二阶段：基础推荐算法（2-3天）

- [ ] 创建 `recommendationEngine.ts`
- [ ] 实现天气-音乐映射规则
- [ ] 实现心情-音乐映射规则
- [ ] 创建推荐分数计算逻辑
- [ ] 创建 `useRecommendation` Hook

### 第三阶段：天气 API 集成（1天）

- [ ] 注册天气 API（推荐和风天气或 OpenWeatherMap）
- [ ] 创建 `weatherApi.ts`
- [ ] 获取用户位置权限
- [ ] 测试天气数据获取

### 第四阶段：社交推荐模拟（1-2天）

- [ ] 实现"大家都在听"算法
- [ ] 实现"大家都在看"算法
- [ ] 实现相似用户推荐算法
- [ ] 创建推荐理由生成逻辑

### 第五阶段：UI 集成与测试（2-3天）

- [ ] 创建 `RecommendationScreen.tsx`
- [ ] 创建 `MoodSelector.tsx` 心情选择器
- [ ] 创建 `RecommendationCard.tsx` 推荐卡片
- [ ] 在首页添加"今日推荐"入口
- [ ] 完整功能测试
- [ ] 性能优化

---

## 📊 预期效果

### 首页新增模块

```
┌─────────────────────────────────────┐
│  🎵 今日推荐                         │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ 🌧️  │ │ 😌  │ │ 🎸  │           │
│  │雨天  │ │平静  │ │爵士  │           │
│  └─────┘ └─────┘ └─────┘           │
│  "今天下雨，适合听这张爵士专辑"         │
│  ┌─────────────────────────┐        │
│  │  [封面]  Kind of Blue   │        │
│  │          Miles Davis    │        │
│  │          ⭐ 9.2/10      │        │
│  └─────────────────────────┘        │
└─────────────────────────────────────┘
```

### 详情页主题色效果

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────┐        │
│  │                         │        │
│  │      [封面海报]          │        │
│  │                         │        │
│  └─────────────────────────┘        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │
│  ▓  主题色渐变背景            ▓      │
│  ▓  ──────────────────────  ▓      │
│  ▓  专辑名：Kind of Blue    ▓      │
│  ▓  艺术家：Miles Davis     ▓      │
│  ▓  年份：1959              ▓      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │
└─────────────────────────────────────┘
```

---

## 🔗 相关资源

- [react-native-image-colors 文档](https://github.com/nickvdyck/react-native-image-colors)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [和风天气 API](https://devapi.qweather.com/v7/)
- [Discogs API](https://www.discogs.com/developers)

---

## ✅ 检查清单

### 功能完整性
- [ ] 天气 API 正常获取数据
- [ ] 心情选择器 UI 完成
- [ ] 推荐算法计算正确
- [ ] 主题色提取在 iOS/Android 都生效
- [ ] 日夜间模式切换流畅

### 性能要求
- [ ] 推荐计算 < 500ms
- [ ] 主题色提取 < 1s
- [ ] 天气 API 请求 < 2s

### 用户体验
- [ ] 推荐理由清晰易懂
- [ ] 主题色过渡自然
- [ ] 心情选择直观便捷

---

> 文档生成完毕。如有疑问，请随时联系。
