<media xmlns="http://search.yahoo.com/mrss/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://search.yahoo.com/mrss/ http://search.yahoo.com/mrss/">
<metadata xmlns="http://search.yahoo.com/mrss/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://search.yahoo.com/mrss/ http://search.yahoo.com/mrss/">
<title>MediaVault</title>
<description></description>
</metadata>
<media:content xmlns:media="http://search.yahoo.com/mrss/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://search.yahoo.com/mrss/ http://search.yahoo.com/mrss/" url="" fileSize="0" type="image/png"/>
</media>
# MediaVault 🎬💿

> A beautiful iOS app for managing your vinyl record and movie/TV show collections — with auto-fetch from Discogs/OMDB and optional Notion sync.

![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
![Platform](https://img.shields.io/badge/platform-iOS-000000?logo=apple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 💿 Vinyl Records
- **Barcode scan** — Scan barcodes to auto-fetch album info from Discogs
- **Search** — Search Discogs by album/artist name
- **Auto metadata** — Album title, artist, version, release year, genre, cover art
- **Price tracking** — Log purchase price for each record

### 🎬 Movies & TV Shows
- **Smart search** — Search OMDB by title, auto-fetch IMDb rating, genre, poster
- **Type classification** — Separate movie and TV show collections
- **Watch tracking** — Log watch date and personal rating (1-5 stars)
- **Series progress** — Track current season/episode for TV shows

### 📊 Statistics
- **Year filter** — Filter all stats by year (2024/2025/2026)
- **Metric cards** — Total count, total spent, artist count (vinyl) / movie vs series (video)
- **Monthly trend chart** — Interactive bar chart showing vinyl purchase trends
  - Tap any bar for exact count
  - Filtered by selected year

### 🔄 Notion Sync (Optional)
- Two-way sync with Notion databases
- Auto-create Notion pages when adding records locally
- Sync metadata updates back to Notion

### 🎨 UI
- iOS-native design inspired by Apple Music & IMDb
- Dark/Light adaptive theme
- SafeArea-aware layout
- Portrait-optimized grids (1:1 squares for vinyl, 2:3 posters for movies)

---

## 📱 Screenshots

| Home | Music | Movies | Stats |
|------|-------|--------|-------|
| Dashboard with recent additions & quick stats | Vinyl grid with barcode scan & search | Movie/TV poster wall with filters | Year-filtered metrics & trend chart |

---

## 🏗 Architecture

```
MediaVault/
├── src/
│   ├── database/
│   │   ├── schema.ts         # SQLite schema & TypeScript types
│   │   └── database.ts       # CRUD operations & stats queries
│   ├── services/
│   │   └── api.ts            # Discogs, OMDB, Notion API clients
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Bottom tab navigation (Home/Music/Movie/Stats)
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Dashboard
│   │   ├── MusicScreen.tsx    # Vinyl grid
│   │   ├── MovieScreen.tsx    # Movie/TV poster wall
│   │   ├── StatsScreen.tsx    # Analytics with year filter
│   │   └── modals/
│   │       ├── AddVinylModal.tsx    # Search + barcode scan for vinyl
│   │       ├── VinylDetailModal.tsx # Vinyl detail/edit modal
│   │       ├── AddMovieModal.tsx    # Movie/TV search modal
│   │       └── MovieDetailModal.tsx # Movie/TV detail modal
│   ├── App.tsx                # Entry point
│   └── index.ts               # Expo register root component
├── assets/                    # Icons, splash screen
├── app.json                   # Expo configuration
├── .env.example               # Environment variables template
└── package.json               # Dependencies
```

### Data Flow

```
User Action → Screen Component → database.ts (SQLite) → Local Storage
                                    ↓ (optional)
                                api.ts → Discogs / OMDB / Notion APIs
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) on your iPhone/iPad (or Xcode simulator)
- (Optional) API keys for Discogs, OMDB, and Notion

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/MediaVault.git
cd MediaVault

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see below)

# 4. Start the development server
npx expo start --tunnel
# Scan the QR code with Expo Go on your iPhone
```

### 🔑 Getting API Keys

#### Discogs (for Vinyl)
1. Go to https://www.discogs.com/settings/developers
2. Create a new application → Copy your **Personal Access Token**
3. Add to `.env`: `DISCOGS_TOKEN=your_token_here`

#### OMDB (for Movies/TV)
1. Go to https://www.omdbapi.com/apikey.aspx
2. Choose **FREE** tier ($0, 1,000 requests/day)
3. Add to `.env`: `OMDB_API_KEY=your_key_here`

#### Notion (for sync, optional)
1. Go to https://www.notion.so/my-integrations → New integration
2. Copy the **Internal Integration Secret** (starts with `secret_`)
3. **Share your databases** with the integration:
   - Open your database → Share → Add your integration
4. Get your **Database IDs**:
   - Open the database in a browser
   - The URL contains: `https://www.notion.so/.../{database_id}?v=...`
5. Add to `.env`:
   ```
   NOTION_API_KEY=secret_your_key_here
   NOTION_VINYLS_DB_ID=your_vinyl_db_id
   NOTION_MOVIES_DB_ID=your_movies_db_id
   ```

### Notion Database Schema

#### Vinyl Database
| Property | Type | Description |
|----------|------|-------------|
| Album | Title | Album name |
| Artist | Rich Text | Artist name |
| Date | Date | Purchase date |
| Version | Rich Text | Edition/version info |
| Price | Number | Purchase price |
| Cover | Files | Album cover image |
| Status | Select | ✈️ / ✅ / 🔹 (shipping/delivered/wishlist) |

#### Movies & TV Database
| Property | Type | Description |
|----------|------|-------------|
| Title | Title | Movie/TV show title |
| Director/Creator | Rich Text | Director or creator |
| Year | Date | Release date |
| Genre | Rich Text | Genre(s) |
| Type | Select | Movie / TV Show |
| IMDb ID | Rich Text | IMDb identifier |
| Poster | Files | Poster image |
| Rating | Number | IMDb rating |
| Personal Rating | Number | Your rating (0-10) |
| Watched Date | Date | Date watched |

---

## 🛠 Development

### Commands

```bash
npm start            # Start Expo dev server
npm run ios          # Open in iOS simulator
npm run android      # Open in Android emulator
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

---

## 🤝 Contributing

This project is designed to be easy to contribute to! Here's how:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/amazing-feature`
3. **Make your changes**
4. **Test on Expo Go**
5. **Commit** with conventional commits: `git commit -m "feat: add amazing feature"`
6. **Push** and open a **Pull Request**

### Ideas for Improvement

- [ ] **Android support** — Currently optimized for iOS, Android needs testing
- [ ] **Dark mode toggle** — Currently follows system preference
- [ ] **Export/import** — Backup SQLite database
- [ ] **Genre analytics** — Real genre distribution from actual data
- [ ] **Vinyl wantlist** — Wishlist tracking separate from collection
- [ ] **Search filters** — Sort/search within local collection
- [ ] **iCloud sync** — Sync across devices
- [ ] **Widgets** — iOS home screen widgets
- [ ] **Better scan feedback** — Haptic + sound on successful barcode scan

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Discogs API](https://www.discogs.com/developers) for vinyl metadata
- [OMDB API](https://www.omdbapi.com/) for movie/TV show data
- [Notion API](https://developers.notion.com/) for cloud sync
- Built with [Expo](https://expo.dev/) & [React Native](https://reactnative.dev/)
