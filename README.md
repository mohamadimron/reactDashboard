# React Dashboard

Aplikasi dashboard full-stack berbasis `React + Vite` di frontend dan `Node.js + Express + Prisma` di backend. Dokumentasi ini sudah disesuaikan dengan implementasi project saat ini: PostgreSQL, RBAC granular, session control frontend + backend, public registration settings, avatar upload, dan hardening konfigurasi auth/database.

## Fitur Utama

- Login, register, logout dengan JWT berbasis cookie `HttpOnly`
- Password hashing memakai `bcryptjs`
- Single-session enforcement berbasis `lastSessionId`
- Idle timeout:
  - frontend: logout lokal setelah 30 menit tanpa aktivitas browser
  - backend: invalidasi session setelah lebih dari 1 jam tanpa aktivitas request
- Popup session expired yang dibedakan berdasarkan penyebab:
  - idle browser 30 menit
  - idle server > 1 jam
  - login dari device/browser lain
  - session invalid generic
- RBAC granular per role
- User management
- Auth logs
- Internal messaging
- Profile update, change password, upload avatar
- Avatar upload:
  - gallery upload di desktop/mobile
  - opsi `Use Camera` untuk device yang mendukung kamera
  - optimasi image ke `.webp` memakai `sharp`
- System settings:
  - `defaultRegistrationRole`
  - `registerPageEnabled`
- Gate `/register` di UI dan validasi ulang di backend

## Stack

- Frontend: React 19, Vite 8, React Router 7, React Hook Form, Zod, Axios, Tailwind CSS 4
- Backend: Express 5, Prisma 7, PostgreSQL, JWT, bcryptjs, multer, sharp
- Database: PostgreSQL

## Struktur Project

- `/frontend` aplikasi web React
- `/backend` REST API Express
- `/backend/prisma/schema.prisma` skema database
- `/backend/uploads` file avatar hasil upload

## Komponen Penting

### Frontend

- `frontend/src/context/AuthContext.jsx`
  State auth global di memory, bootstrap session via `/auth/me`, inactivity timer 30 menit, login/register/logout, dan sync user context.
- `frontend/src/services/api.js`
  Axios instance global berbasis `withCredentials` dan penanganan popup session expired.
- `frontend/src/utils/sessionExpiry.js`
  Sumber mapping alasan session berakhir dan payload popup.
- `frontend/src/components/SessionExpiredModal.jsx`
  Modal popup untuk timeout / session invalidation.
- `frontend/src/components/ProtectedRoute.jsx`
  Proteksi halaman dashboard berbasis login dan permission.
- `frontend/src/components/RegisterRouteGate.jsx`
  Gate akses `/register` berdasarkan public settings.
- `frontend/src/pages/Profile.jsx`
  Update profile, ubah password, upload avatar, dan opsi kamera untuk mobile device.
- `frontend/src/pages/Settings.jsx`
  Role management, permission matrix, default role registration, dan enable/disable halaman register.

### Backend

- `backend/src/controllers/authController.js`
  Register, login, logout.
- `backend/src/middlewares/authMiddleware.js`
  Verifikasi JWT, validasi `lastSessionId`, update `lastActivity`, dan idle timeout backend.
- `backend/src/controllers/settingsController.js`
  System settings internal dan public.
- `backend/src/utils/systemSettings.js`
  Persistence helper untuk `defaultRegistrationRole` dan `registerPageEnabled`.
- `backend/src/utils/db.js`
  Koneksi database runtime dari `DATABASE_URL`.
- `backend/src/utils/auth.js`
  Signing JWT dan password helper. `JWT_SECRET` wajib ada.
- `backend/src/utils/authCookie.js`
  Helper cookie auth `HttpOnly` untuk set / clear session cookie.
- `backend/src/utils/userSerializer.js`
  Sanitasi semua respons user agar field sensitif tidak keluar ke client.
- `backend/src/utils/upload.js`
  Konfigurasi upload avatar dengan `multer`.

## Requirement

- Node.js 18+
- npm
- PostgreSQL 14+ direkomendasikan

## Setup Database Dari Nol

### 1. Login ke PostgreSQL sebagai superuser

```bash
psql -U postgres
```

### 2. Buat user dan database

Ganti nilai user/password/database sesuai kebutuhan environment Anda.

```sql
CREATE USER "react_dashboard_user" WITH PASSWORD 'replace-with-strong-password';
CREATE DATABASE "react_dashboard";
ALTER DATABASE "react_dashboard" OWNER TO "react_dashboard_user";
GRANT ALL PRIVILEGES ON DATABASE "react_dashboard" TO "react_dashboard_user";
```

### 3. Pastikan schema `public` bisa dipakai

```bash
psql -U postgres -d react_dashboard
```

```sql
GRANT ALL ON SCHEMA public TO "react_dashboard_user";
ALTER SCHEMA public OWNER TO "react_dashboard_user";
```

## Konfigurasi Environment

Masuk ke folder backend lalu buat file `.env`.

```bash
cd backend
```

Contoh isi:

```env
DATABASE_URL="postgresql://react_dashboard_user:replace-with-strong-password@127.0.0.1:5432/react_dashboard"
JWT_SECRET="replace-with-a-long-random-secret"
NODE_ENV="development"
```

Catatan:

- `DATABASE_URL` dipakai Prisma CLI dan runtime backend
- `JWT_SECRET` wajib ada. Server tidak lagi memakai fallback secret
- jangan commit `.env` production ke repository

## Setup Prisma

```bash
cd backend
npx prisma db push
npx prisma generate
```

Jika ingin memeriksa koneksi database:

```bash
node check_db.js
```

## Install Dependency

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Seed Data Awal

Seed utama:

```bash
cd backend
node seed_relational.js
```

Hasil seed utama:

- role `ADMIN`
- role `USER`
- role `OPERATOR`
- status `ACTIVE`
- status `NOT_ACTIVE`
- status `SUSPEND`
- akun admin awal:
  - email: `admin@mail.com`
  - password: `admin1234`

Catatan penting:

- bootstrap admin tidak lagi bergantung pada user pertama yang register
- admin awal harus disiapkan lewat seed atau provisioning lain
- public registration tidak akan pernah membuat akun `ADMIN`

Seed tambahan opsional:

```bash
cd backend
node seed_users.js
node seed_500_users.js
node seed_messages.js
```

## Menjalankan Project

### Backend

```bash
cd backend
npm run dev
```

Default lokal:

- `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

Default lokal:

- `http://localhost:5173`

## Build

### Frontend

```bash
cd frontend
npm run build
```

### Preview frontend

```bash
cd frontend
npm run preview
```

## Flow Register

Halaman register:

- `frontend/src/pages/Register.jsx`

Endpoint register:

- `POST /api/auth/register`

Aturan register saat ini:

1. Register publik hanya berjalan jika `registerPageEnabled = true`
2. Role akun baru mengikuti `defaultRegistrationRole`
3. Jika setting role belum ada atau tidak valid, fallback ke `USER`
4. `ADMIN` tidak bisa dipakai sebagai default public registration role
5. Admin awal harus dibuat lewat seed atau provisioning terpisah

## Register Page Access

System settings bisa mengontrol apakah halaman `/register` aktif atau tidak.

Behavior:

1. Jika aktif:
   - link `Sign up` muncul di halaman login
   - route `/register` bisa diakses
   - backend menerima request register
2. Jika nonaktif:
   - link `Sign up` tidak muncul
   - route `/register` redirect ke `/login`
   - backend menolak request register publik

Endpoint public setting:

- `GET /api/settings/public`

## Session dan Security

### Single Session

Setiap login membuat `sessionId` baru dan menyimpannya di database. Session dikirim ke browser melalui cookie `HttpOnly`. Jika user login dari browser/device lain, session lama tidak valid lagi.

### Idle Timeout Frontend

Frontend memonitor aktivitas browser seperti klik, keyboard, scroll, touch, dan mouse movement. Jika tidak ada aktivitas selama 30 menit:

- cookie logout dipanggil ke backend
- user logout dari state memory frontend
- popup `Session Expired` tampil dengan pesan khusus inactivity browser

### Idle Timeout Backend

Backend memeriksa `lastActivity` pada route yang dilindungi. Jika idle lebih dari 1 jam:

- session dibatalkan
- `lastSessionId` dihapus
- `lastActivity` di-reset
- request berikutnya menerima `401` dengan code `SESSION_IDLE_TIMEOUT`
- frontend menampilkan popup yang spesifik untuk inactivity server-side

### Popup Session Expired

Modal session popup saat ini membedakan pesan berdasarkan reason:

- inactivity browser 30 menit
- inactivity server > 1 jam
- session digantikan login di device/browser lain
- session invalid generic

## Avatar Upload

Endpoint:

- `PUT /api/users/profile/avatar`

Behavior:

- menerima format image umum seperti JPEG, JPG, PNG, WEBP
- limit upload 10 MB
- file disimpan sementara ke folder `backend/uploads`
- gambar diproses dengan `sharp`
- hasil akhir dikonversi ke `.webp`
- avatar lama dihapus jika ada
- halaman profile menyediakan:
  - `Choose Photo`
  - `Use Camera` pada device yang mendukung kamera/mobile capture

## API Ringkas

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`

### Users

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `PUT /api/users/profile`
- `PUT /api/users/profile/password`
- `PUT /api/users/profile/avatar`
- `GET /api/users/roles`
- `GET /api/users/statuses`
- `GET /api/users/search`
- `GET /api/users/stats`

### Roles

- `GET /api/roles`
- `POST /api/roles`
- `DELETE /api/roles/:id`
- `PUT /api/roles/:id/permissions`

### Settings

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/settings/public`

### Logs dan Messages

- `GET /api/logs`
- `GET /api/messages`

## Troubleshooting

### Halaman register tidak muncul

Cek:

- setting `registerPageEnabled`
- endpoint `GET /api/settings/public`
- user yang login memang punya akses ke menu settings jika ingin mengubahnya

### Gagal save system setting

Cek:

- backend sudah restart setelah perubahan kode
- koneksi PostgreSQL aktif
- tabel `SystemSetting` bisa dibuat/diubah oleh user database

### Popup session muncul dengan pesan yang tidak sesuai

Cek:

- frontend build terbaru sudah ter-deploy
- backend terbaru sudah mengirim `code` dan `title` yang benar untuk session invalidation
- request 401 yang terjadi memang berasal dari auth/session, bukan forbidden permission `403`

### Upload avatar gagal

Cek:

- ukuran file tidak lebih dari 10 MB
- format file valid
- folder `backend/uploads` writable
- browser/device mengizinkan akses file atau kamera

## Catatan Implementasi Penting

- runtime backend membaca koneksi database dari `.env` melalui `DATABASE_URL`
- `JWT_SECRET` wajib ada sebelum server dijalankan
- semua respons user yang keluar ke client sudah disanitasi
- auth frontend tidak lagi memakai `localStorage` atau `sessionStorage`
- tabel `SystemSetting` dibuat otomatis oleh backend saat pertama kali dibutuhkan
- route settings internal memerlukan permission `canManageSettings`

## Dokumentasi Tambahan

- [frontend/README.md](/DATA/Documents/react-app/react-dashboard/frontend/README.md)
- [backend/README.md](/DATA/Documents/react-app/react-dashboard/backend/README.md)
