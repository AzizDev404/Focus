# Tsukiyomi Workspace

> Open source productivity workspace — for students, developers, and companies.

Tsukiyomi — bu **ochiq kodli** fokus va samaradorlik maydonchasi. Unda:

- 🎯 **Focus timer** + stats + streaklar
- ✅ **Tasks** (drag & drop)
- 🎨 **Temalar**, ambient sounds, quotes, flip clock
- 👤 **Profil** va **reyting** (leaderboard)
- 🛒 **Magazine** — aksessuarlar (avatar, cover, frame, charm)
- 📬 **Mail** + OTP tasdiqlash
- 🔐 **Registratsiya** (email/password + Google)
- 🛠 **Admin panel** — barcha foydalanuvchilar, achivmentlar, rewards, shop, uploads

**Hech narsa bloklanmagan.** Yuboritib olgan har bir kishi — talaba, dasturchi yoki kompaniya — barcha funksiyalarni to'liq ishlata oladi.

---

## 🎯 Kimlar uchun?

### 🎓 Talabalar (Students)
Agar siz talaba bo'lsangiz:
- Focus timer + Pomodoro → o'qishga intilish
- Tasks + ETA → rejalashtirish
- Streaklar, Focus Score, leaderboard → motivatsiya
- Profil, aksessuarlar → kunlik maqsadlarni yanada qiziqarli qilish
- Notepad, quotes, greetings → shaxsiy ish maydoni

**Talabalar uchun — to'liq bepul va cheklovsiz.**

### 👨‍💻 Dasturchilar (Developers)
Agar siz dasturchi bo'lsangiz:
- Full-stack TypeScript/Node loyihasini **o'rganing**
- O'z workflow'ingizga moslab **tahrirlang**
- Self-host qiling (localhost, VPS, Docker — ixtiyoringiz)
- Monorepo: `frontend/` (React + Vite) + `admin/` + `backend/` (Express)
- Zustand, Framer Motion, Recharts, dnd-kit, Howler kabi ishlatilgan kutubxonalar bilan tanishing

### 🏢 Kompaniyalar / Jamoalar (Companies / Teams)
Agar siz kompaniya / jamoa bo'lsangiz:
- **Ichki engagement tizimi** — ishchilar uchun fokus, streaks, reyting
- **Profil** — hamma uchun karta (avatar, cover, ID, frame, charm)
- **Leaderboard** — jamoaviy reyting
- **Admin panel** — boshqaruv: userlar, rewards, achivmentlar, do'kon (magazine), moderation
- **Self-host** — ma'lumotlaringiz sizning serveringizda
- Custom branding → `.env.example` orqali APP_NAME va boshqalarni o'zgartiring

---

## 🏗 Loyiha struktura

```
Tsukiyomi/
├── frontend/   # Foydalanuvchi app — http://localhost:5173
├── admin/      # Admin panel — http://localhost:5174
└── backend/    # API + ma'lumotlar (SQLite yoki JSON) — http://localhost:3001
```

Monorepo — npm workspaces. Root `package.json` da barcha scriptlar mavjud.

---

## 🚀 Laptopda ishga tushirish (5 daqiqa)

**Talab:** [Node.js 18+](https://nodejs.org/) (LTS tavsiya). Windows, macOS, Linux.

### 1. Yuklab oling
```bash
git clone https://github.com/AzizDev404/Focus.git
cd Focus
```

Yoki GitHub’dan ZIP yuklab, papkani oching va shu papkada terminal oching.

### 2. Bog'lamlarni o'rnating
```bash
npm install
```

### 3. Konfiguratsiya
```bash
copy .env.example .env        # Windows
# yoki
cp .env.example .env           # Linux / macOS
```

`.env` ichida (dev uchun `.env.example` qiymatlari yetadi):
- `JWT_SECRET` — istalgan uzun matn (production’da kamida 32 belgi)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin panel login (dev: `admin` / `admin123`)
- Google Sign-In va SMTP — ixtiyoriy

> ⚠️ **Hech qachon** `.env` faylni GitHub'ga commit qilmang.

### 4. Ishga tushiring
```bash
npm run dev
```

Brauzerda oching:
| Narsa | Manzil |
|---|---|
| Frontend (user app) | http://localhost:5173 |
| Admin panel | http://localhost:5174 |
| Backend API | http://localhost:3001 |

### 5. Akkaunt ochish
1. http://localhost:5173 ni oching (avtomatik `/app` ga o‘tadi)
2. **Sign up** — email + parol
3. `REQUIRE_EMAIL_VERIFICATION=false` bo‘lsa darhol kirasiz. Production’da SMTP bo‘lmasa ham `false` qoldirish mumkin (uy serveri). SMTP bo‘lsa kod emailga ketadi; bo‘lmasa **API terminalida** chiqadi.
4. Admin: http://localhost:5174 — `.env` dagi login/parol.

Sessiya **httpOnly cookie** da saqlanadi (`localStorage` da JWT yo‘q). Dev’da `VITE_API_URL` ni bo‘sh qoldiring — Vite `/api` ni proxy qiladi, cookie ishlashi uchun shu kerak.

---

## 📦 Production'ga joylash

```bash
# 1. To'liq build
npm run build

# 2. Production rejimida ishga tushirish
NODE_ENV=production npm run start
```

Production da API (3001 port) o'zi built frontend (`/app`) va admin (`/admin`) ni statik fayl sifatida xizmat qiladi — barchasi bitta portda. Admin Vite `base` `/admin/` bo'lishi shart (`npm run build`).

**Talablar:**
- Node.js 18+ (22+ da SQLite avtomatik; 18–21 da `backend/data/db.json`)
- `JWT_SECRET` kamida 32 belgi
- `ADMIN_USERNAME` = `admin` bo'lmasligi kerak
- `ADMIN_PASSWORD` kamida 12 belgi
- Email tasdiqlash: SMTP sozlangan bo‘lsa avtomatik; uyda SMTP yo‘q bo‘lsa `REQUIRE_EMAIL_VERIFICATION=false`
- UI va API bir hostda bo‘lsin (yoki `CORS_ORIGINS` va cookie `Secure` production’da)

See `SECURITY.md` for session cookies, rate limits, and self-host notes.

---

## 🐳 Docker (local development)

Agar siz Docker bilan ishlashni xohlasangiz, loyiha oddiy Docker Compose fayli bilan keladi. Buning uchun Docker va Docker Compose o'rnatilgan bo'lishi kerak.

1) `.env` faylingizni tayyorlang (ko'pincha `.env.example` ni nusxalash kifoya qiladi):

```bash
cp .env.example .env
# edit .env and set JWT_SECRET and ADMIN_PASSWORD
```

2) Docker Compose orqali dev stackni ishga tushiring:

```bash
docker compose up --build
```

Bu yerda xizmatlar:
- `backend` — API (port 3001)
- `frontend` — Vite dev server (port 5173)
- `admin` — Admin Vite dev server (port 5174)

Ishni to'xtatish uchun:

```bash
docker compose down
```

Eslatma: `docker compose up` — lokal development. Production: `docker compose -f docker-compose.prod.yml up --build` (`.env` da production `JWT_SECRET` va admin parol).

---

## ✨ Asosiy funksiyalar

| Bo'lim | Nima bor |
|---|---|
| **3 rejim** | Home, Focus |
| **Timer tizimi** | Pomodoro, Countdown, Stopwatch, Animedoro, 52/17, Task ETA, PiP, tallies |
| **Tasks** | Drag & drop, emoji, colors, ETA, workflow sozlamalari |
| **Themes** | Standart temalar + custom rasm qo'llab-quvvatlanadi |
| **Sounds** | Layered ambient audio (howler) |
| **Account** | Profil, Magazine, Leaderboard, Mail (OTP/reset) |
| **Stats** | Streak, Focus Score, sessiyalar, charts (today/week/month) |
| **Extras** | Flip clock, seconds, clear mode, wake lock, greetings, quotes |
| **Admin** | Users, dashboard stats, rewards, shop items, achievements, uploads, moderation |
| **Auth** | Email/password + bcrypt + JWT + Google Sign-In (optional) |

---

## 🔒 Security (Ommaviy repo uchun)

✅ Tayyor:
- `.env` → `.gitignore` da (commit qilinmaydi)
- `backend/data/db.json` → ignore
- `backend/uploads/` → ignore
- Parollar → bcrypt hash holatida
- Production'ga zaif parollar bilan kirish taqiqlangan
- API kalitlar, OpenAI key, SMTP password kod ichida hardcoded emas — faqat `.env` orqali

**Siz qilishingiz kerak:**
1. GitHub'ga push qilishdan OLDIN tarixda `.env` yoki `db.json` bor-yo'qligini tekshiring:
   ```bash
   git log --all --full-history -- .env
   git log --all --full-history -- backend/data/db.json
   ```
2. Agar tarixda maxfiy narsa topilsa → `git filter-repo` yoki BFG bilan tozalang.

---

## 🛠 Ishlatilgan kutubxonalar

| Library | Maqsadi |
|---|---|
| [howler](https://howlerjs.com/) | Ambient audio engine |
| [@dnd-kit/core](https://dndkit.com/) + sortable | Task drag-and-drop |
| [recharts](https://recharts.org/) | Stats chartlari |
| [framer-motion](https://www.framer.com/motion/) | UI transitionlar |
| [lucide-react](https://lucide.dev/) | Ikonkalar |
| [date-fns](https://date-fns.org/) | Sanalar hisoblash |
| [zustand](https://zustand.docs.pmnd.rs/) | Client state |
| Express + JWT + bcrypt | Backend auth |
| Vite + React + TypeScript | Frontend stack |

---

## ❤️ Donate / Sponsor (Sizdan iltimos!)

Bu loyiha **to'liq bepul** va **ochiq kodli**. Hech qanday premium / paywall / blok yopiq.

Agar sizga foyda bergan bo'lsa — yuklab olib ishlatyapsizmi, o'rganayapsizmi, kompaniyangizda ishlatyapsizmi — iltimos, qo'llab-quvvatlang:

📧 **Pochtam:** **u03062010@gmail.com**

Nima uchun donate qilsangiz kerak:
- Yangi funksiyalar (masalan, mobile app, dark/light toggle, teams) tezroq chiqadi
- Server va domen xarajatlari qoplanadi
- Loyiha uzoq vaqt ishlab turishini ta'minlaysiz
- Umumiy open source hamjamiyatiga hissa qo'shgan bo'lasiz

📧 **Hamkorlik, savollar, takliflar uchun ham shu pochtani yozishingiz mumkin.**

---

## 🤝 Qanday hissa qo'shish mumkin?

1. Repo'ni fork qiling
2. Feature branch yarating (`git checkout -b feature/awesome-thing`)
3. O'zgarishlarni commit qiling
4. Push qiling (`git push origin feature/awesome-thing`)
5. Pull Request yuboring

Hissangiz uchun oldindan **katta rahmat!** 🙏

---

## 📄 Litsenziya

[MIT License](LICENSE) — barcha huquqlar xolis.
O'zgartirishingiz, tarqatishingiz, sotishingiz, o'z loyihangizda ishlatishingiz mumkin. Bitta shart: litsenziya matnini saqlab qoling.

---

## ✅ Open Source & Verification

Tsukiyomi bu ochiq kodli loyiha va MIT litsenziyasi ostida tarqatiladi — siz kodni ko'rishingiz, o'zgartirishingiz va tarqatishingiz mumkin.

Iltimos, quyidagi tekshiruvlardan o'tkazing har qanday noxush holatlarni oldini olish uchun:

- 1) Lokal buildni ishga tushiring (frontend + admin):

```bash
npm install
npm run build
```

- 2) TypeScript va bundler xatolari yo'qligini tekshiring (yuqoridagi buyruq ham shu tekshiruvni bajaradi).

- 3) Maxfiy ma'lumotlar uchun git tarixini tekshiring (agar `.env` yoki boshqa kalitlar bor-yo'qligini tekshirish):

```bash
git log --all --full-history -- .env || true
git log --all --full-history -- backend/data/db.json || true
```

- 4) Lint va testlarni ishga tushiring (agar mavjud bo'lsa):

```bash
npm run lint
# npm test  # agar test script mavjud bo'lsa
```

- 5) Media (uploads) va fontlar: agar siz custom fayllar yuklagan bo'lsangiz, brauzerda ilovani ochib, upload/qo'llash/oqish oqimini sinab ko'ring.

Qo'shimcha xavfsizlik tekshiruvlari:
- GitHub Secrets va `.env` fayllarini push qilishdan avval ikki marta tekshiring.
- Agar tarixda maxfiy ma'lumot topilsa, `git filter-repo` yoki BFG yordamida tozalang.

Kontakt va xavfsizlik muammolari uchun: u03062010@gmail.com


## 🙏 Minnetdorchilik

- Ambient fokus g'oyasi qisman [Flocus](https://flocus.com) dan ilhomlangan.
- Tsukiyomi — mustaqil ochiq kodli loyiha; Gridfiti yoki Flocus bilan aloqasi yo'q.
