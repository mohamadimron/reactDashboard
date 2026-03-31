# Backend

Backend project ini dibangun dengan `Node.js + Express + Prisma + PostgreSQL`.

## Script

```bash
npm run dev
npm run start
```

## Setup

### Install dependency

```bash
npm install
```

### Buat `.env`

Contoh:

```env
DATABASE_URL="postgresql://react_dashboard_user:replace-with-strong-password@127.0.0.1:5432/react_dashboard"
JWT_SECRET="replace-with-a-long-random-secret"
NODE_ENV="development"
```

Catatan:

- `DATABASE_URL` dipakai runtime backend dan Prisma CLI
- `JWT_SECRET` wajib ada, tidak ada fallback default

### Push schema dan generate Prisma client

```bash
npx prisma db push
npx prisma generate
```

### Seed data dasar

```bash
node seed_relational.js
```

Seed ini menyiapkan role dasar, status dasar, dan admin awal.

### Jalankan server

```bash
npm run dev
```

## File Penting

- `src/index.js`
  Entry point server Express.
- `src/utils/db.js`
  Koneksi database runtime dari `DATABASE_URL`.
- `src/utils/auth.js`
  Signing JWT dan helper password.
- `src/utils/userSerializer.js`
  Sanitasi respons user agar field sensitif tidak keluar ke frontend.
- `src/middlewares/authMiddleware.js`
  Proteksi route, session validation, single-session enforcement, idle timeout backend.
- `src/controllers/authController.js`
  Login, register, logout.
- `src/controllers/userController.js`
  User CRUD, profile, password, avatar.
- `src/controllers/settingsController.js`
  System settings internal dan public.
- `src/utils/systemSettings.js`
  Helper persistence `SystemSetting`.
- `src/utils/upload.js`
  Konfigurasi upload avatar.

## Register dan System Settings

Backend saat ini mendukung:

- `defaultRegistrationRole`
- `registerPageEnabled`

Aturan register:

1. Request public register ditolak jika `registerPageEnabled = false`
2. Role akun baru mengikuti `defaultRegistrationRole`
3. Jika role setting kosong/tidak valid, fallback ke `USER`
4. `ADMIN` tidak bisa dijadikan default public registration role
5. Admin awal tidak dibuat dari pendaftar pertama, tetapi lewat seed/provisioning

## Session Handling

### Single session

Setiap login membuat `sessionId` baru. Jika `lastSessionId` di database tidak sama dengan token aktif, backend membalas `401` dengan code `SESSION_REPLACED`.

### Idle timeout backend

Pada setiap route yang diproteksi:

- backend memeriksa `lastActivity`
- jika idle lebih dari 1 jam:
  - `lastSessionId` dihapus
  - `lastActivity` di-reset
  - API mengembalikan `401` dengan code `SESSION_IDLE_TIMEOUT`

## Avatar Upload

Endpoint:

- `PUT /api/users/profile/avatar`

Behavior:

- menerima image upload melalui `multer`
- limit 10 MB
- file diproses ulang ke `.webp` dengan `sharp`
- avatar lama dihapus jika ada

## Seed yang Tersedia

- `seed_relational.js`
- `seed_users.js`
- `seed_500_users.js`
- `seed_messages.js`
- `migrate_permissions.js`
- `test_perms.js`
- `check_db.js`

## Catatan

- backend bergantung pada `DATABASE_URL` dan `JWT_SECRET` di `.env`
- permission `canManageSettings` diperlukan untuk mengubah settings internal
- tabel `SystemSetting` dibuat otomatis jika belum ada
