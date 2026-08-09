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
├── frontend/   # Foydalanuvchi app (React + Vite) — localhost:5173
├── admin/      # Admin panel (React + Vite)   — localhost:5174
├── backend/    # API, auth, mail, DB, uploads — localhost:3001
└── server/     # Local JSON DB (dev uchun)
```

Monorepo — npm workspaces. Root `package.json` da barcha scriptlar mavjud.

---

## 🚀 Tez o'rnatish (5 daqiqa)

### 1. Yuklab oling
```bash
git clone https://github.com/YOUR_USERNAME/Tsukiyomi.git
cd Tsukiyomi
```

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

`.env` ichida:
- `JWT_SECRET` — kamida 32 belgidan iborat random string yozing
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin panel uchun login
- Google Sign-In va SMTP — ixtiyoriy (bo'sh qolsa ham ishlaydi)

> ⚠️ **Hech qachon** `.env` faylni GitHub'ga commit qilmang. (U `.gitignore` da.)

### 4. Ishga tushiring (Development)
```bash
npm run dev
```

Bu 3 ta jarayonni parallel ishga tushiradi:
| Narsa | Manzil |
|---|---|
| Frontend (user app) | http://localhost:5173 |
| Admin panel | http://localhost:5174 |
| Backend API | http://localhost:3001 |

### 5. Akkaunt ochish
1. Frontendni (5173) oching
2. **Sign up** ni bosing → email + parol bilan ro'yxatdan o'ting
3. Agar `REQUIRE_EMAIL_VERIFICATION=false` bo'lsa → darvozabon tushadi. Aks holda OTP konsolga (API terminaliga) chiqadi.
4. Admin panelga kirish → `/admin` manziliga o'ting, `.env` dagi `ADMIN_USERNAME` / `ADMIN_PASSWORD` bilan kiring.

---

## 📦 Production'ga joylash

```bash
# 1. To'liq build
npm run build

# 2. Production rejimida ishga tushirish
NODE_ENV=production npm run start
```

Production da API (3001 port) o'zi built frontend + adminni statik fayl sifatida xizmat qiladi — barchasi bitta portda.

**Talablar:**
- Node.js 18+
- `JWT_SECRET` kamida 32 belgi
- `ADMIN_USERNAME` = `admin` bo'lmasligi kerak
- `ADMIN_PASSWORD` kamida 12 belgi
- (Ixtiyoriy) SMTP yuborish uchun sozlamalar

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

## 🙏 Minnetdorchilik

- Ambient fokus g'oyasi qisman [Flocus](https://flocus.com) dan ilhomlangan.
- Tsukiyomi — mustaqil ochiq kodli loyiha; Gridfiti yoki Flocus bilan aloqasi yo'q.
