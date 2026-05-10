# MediaVault

iPhone 风格的收藏管理应用 - 黑胶唱片和电影收藏

## 功能

- 🎵 黑胶唱片收藏管理
- 🎬 电影收藏管理
- 📊 收藏统计
- 🔍 Discogs/OMDB 搜索集成
- ☁️ Supabase 云同步
- 📱 iPhone 风格界面

## 快速开始

1. 克隆仓库
2. 在 Supabase 创建 `vinyls` 和 `movies` 表
3. 部署到 Vercel 或其他静态托管服务

## Supabase 表结构

### vinyls
- id (int8, 主键)
- title (text)
- artist (text)
- release_date (date)
- format (text)
- cover_image (text)
- purchase_date (date)
- purchase_price (numeric)
- rating (int4)
- barcode (text)
- genre (text)

### movies
- id (int8, 主键)
- title (text)
- director (text)
- release_date (date)
- type (text)
- poster_url (text)
- imdb_id (text)
- my_rating (int4)
- watch_date (date)
- genre (text)
- country (text)
- runtime (int4)
- plot (text)

## API Keys

需要在 Supabase 设置 RLS 策略为允许公开读写
