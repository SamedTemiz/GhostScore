# GhostScore — CLAUDE.md

## Proje Özeti

GhostScore, Instagram hesap analizleri sunan bir React Native (Expo SDK 54) mobil uygulamasıdır. Kullanıcılar Instagram WebView üzerinden giriş yapar; backend analiz sonuçlarını döner (stalkerlar, hayalet takipçiler, geri takip etmeyenler, ghost score). Hedef: Google Play Store.

## Mimari

### Frontend — React Native / Expo SDK 54
- Dil: JavaScript (JSX)
- Navigasyon: React Navigation (Stack)
- State: React Context (`AuthContext`, `ThemeContext`)
- HTTP: `fetch` + JWT refresh mantığı (`src/services/api.js`)
- Tema: Dark/Light mode, `src/constants/theme.js`'den merkezi renkler/spacing

### Backend — FastAPI + Python 3.12
- Konum: `backend/`
- Çalıştırma: `cd backend && venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Auth: RS256 JWT (access 15dk, refresh 7gün)
- Session şifreleme: AES-256-GCM
- DB: Supabase (PostgreSQL)
- Instagram entegrasyon: `instagrapi` (session cookie ile)
- Config: `backend/.env` (gitignored)

### Üretim Sunucusu
- Oracle Cloud Free Tier — VM.Standard.E2.1.Micro (Frankfurt)
- Backend arka planda: `cd ~/ghostscore/backend && nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 >> ~/uvicorn.log 2>&1 </dev/null &`
- Log: `~/uvicorn.log` üzerinden takip
- SSH: `ssh -i ~/.ssh/oracle_ghostscore.key ubuntu@138.2.143.7`
- API: `http://138.2.143.7:8000` (HTTP — cleartext, production için HTTPS planlanacak)

## Ekran Akışı

```
Welcome → Onboarding → Login (WebView) → Analysis → Results → Main (Dashboard)
                                                              ↕
                                                         Settings / Stalkers / Muted / Unfollowers
```

- **Login**: Instagram WebView açılır → sessionid cookie yakalanır → Analysis'e navigate
- **Analysis**: Backend `POST /api/v1/auth/session-login` çağrısı yapılır, bitince Interstitial reklam → Results
- **Results**: Kart bazlı scroll (Score, Stalkers, Ghost Followers, Unfollowers) — ilk 2 satır açık, kalanı Rewarded reklam ile açılır
- **Main**: JWT token varsa direkt buradan başlar (onboarding atlanır)

## Reklam Entegrasyonu (AdMob)

- Paket: `react-native-google-mobile-ads`
- Ad Unit ID'leri: `src/constants/ads.js` — `__DEV__` true ise test ID, false ise prod ID
- Başlatma: `App.js`'de `mobileAds().initialize()`
- **Interstitial**: Analiz bitince Results'a geçmeden önce (AnalysisScreen)
- **Rewarded**: Kilitleri açmak için (ResultsScreen — LockOverlay)
- **Banner**: ResultsScreen altında sabit (ANCHORED_ADAPTIVE_BANNER)
- **Interstitial**: Hesap silme sonrası (SettingsScreen)
- AdMob App ID: `ca-app-pub-1547168097704291~5427443880` (AndroidManifest.xml)

## Android Build

```powershell
# Release APK build
cd android
.\gradlew.bat assembleRelease

# Telefona yükle (USB bağlı)
& "C:\Users\helmsdeep\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\release\app-release.apk
```

- APK çıktı: `android/app/build/outputs/apk/release/app-release.apk`
- Signing: `debug.keystore` (henüz production keystore yok)
- `android/local.properties` gitignored (SDK path içerir)
- `android/build/` ve `android/app/build/` gitignored

## Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `App.js` | Uygulama giriş noktası, AdMob init |
| `src/navigation/AppNavigator.js` | Tüm ekranlar, splash animasyonu, initial route |
| `src/context/AuthContext.js` | user, data, loading, error state; login/logout fonksiyonları |
| `src/services/api.js` | HTTP client, JWT refresh, tüm API endpoint'leri |
| `src/constants/ads.js` | AdMob unit ID'leri (test/prod) |
| `src/constants/theme.js` | Renkler, spacing, radius, shadow sabitleri |
| `backend/app/main.py` | FastAPI app, CORS, rate limit, middleware |
| `backend/app/api/auth.py` | `/auth/session-login`, `/auth/webview-login`, `/auth/login` |
| `backend/app/core/instagram.py` | instagrapi entegrasyonu |
| `backend/app/config.py` | Pydantic settings, `.env`'den yüklenir |

## Env Dosyaları (gitignored)

### `.env` (proje kökü — frontend)
```
EXPO_PUBLIC_API_URL=http://138.2.143.7:8000/api/v1
```

### `backend/.env`
```
JWT_PRIVATE_KEY="..."
JWT_PUBLIC_KEY="..."
SESSION_ENCRYPTION_KEY="..."
SUPABASE_URL="https://dfxhfalxubnsvecfoaqn.supabase.co"
SUPABASE_SERVICE_KEY="..."
ALLOWED_ORIGINS="*"
ANALYSIS_PER_DAY_LIMIT=5
LOGIN_RATE_LIMIT="10/minute"
INSTAGRAM_MOCK=false
```

## Güvenlik Kuralları

- API key, secret veya sunucu IP'si kaynak koduna (src/, backend/app/) yazılmaz
- Tüm secret'lar `.env` dosyalarından gelir (gitignored)
- `backend/private.pem` gitignored, `backend/public.pem` tracked (public key)
- `android/local.properties` gitignored
- `usesCleartextTraffic="true"` AndroidManifest'te açık (HTTP backend nedeniyle)

## Dev Mode (Gizli)

Login ekranında footer'a 5 kez hızlı tıkla → Dev panel açılır:
- Mock Data ile giriş (gerçek Instagram'a bağlanmaz)
- Direkt ekran navigasyonu (Analysis simulation, Results, Dashboard)
- `AsyncStorage`'da `gs_dev_mode=1` ile persist

## Ampere A1 Auto-Creator Script

Oracle Cloud'da A1.Flex instance kapasitesi Frankfurt'ta dolu. Otomatik retry script:
```
C:\Users\helmsdeep\create_oracle_instance.ps1
```
Her 60 saniyede 3 AD'yi sırayla dener. A1 açılınca bu script ile daha güçlü sunucuya geçilecek.
