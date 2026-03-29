# React Dashboard

Aplikasi dashboard full-stack berbasis `React + Vite` di frontend dan `Node.js + Express + Prisma` di backend. Dokumentasi ini sudah disesuaikan dengan implementasi project saat ini, termasuk PostgreSQL, RBAC granular, session control, pengaturan system settings, avatar upload, dan kontrol akses halaman register.

## Ringkasan Fitur

- Autentikasi JWT: login, register, logout
- Password hashing dengan `bcryptjs`
- Single-session enforcement berbasis `lastSessionId`
- Idle session invalidation di backend setelah lebih dari 1 jam tanpa aktivitas request
- Auto logout inactivity timer di frontend
- RBAC granular berbasis permission per role
- Dashboard statistik
- User management lengkap
- Auth logs
- Internal messaging
- Update profile, ubah password, upload avatar, dan optimasi gambar dengan `sharp`
- System settings:
  - default role untuk public registration
  - enable / disable halaman register

## Stack

- Frontend: React 19, Vite 8, React Router 7, React Hook Form, Zod, Axios, Tailwind CSS 4
- Backend: Express 5, Prisma 7, PostgreSQL, JWT, bcryptjs, multer, sharp
- Database: PostgreSQL

## Struktur Project

- `/frontend` aplikasi web React
- `/backend` REST API Express
- `/backend/prisma/schema.prisma` skema database
- `/backend/uploads` file avatar yang disimpan server

## Komponen Penting

### Frontend

- `frontend/src/context/AuthContext.jsx`
  State auth global, local inactivity timer, login/register/logout, dan sync user context.
- `frontend/src/services/api.js`
  Axios instance global, auth header, dan event `session-expired`.
- `frontend/src/components/ProtectedRoute.jsx`
  Proteksi halaman dashboard berbasis login dan permission.
- `frontend/src/components/RegisterRouteGate.jsx`
  Gate untuk akses `/register` berdasarkan public system setting.
- `frontend/src/pages/Settings.jsx`
  UI role management, permission matrix, default role registration, dan enable/disable halaman register.

### Backend

- `backend/src/controllers/authController.js`
  Register, login, logout.
- `backend/src/middlewares/authMiddleware.js`
  Verifikasi JWT, validasi `lastSessionId`, update `lastActivity`, dan idle timeout server-side.
- `backend/src/controllers/settingsController.js`
  System settings internal dan public.
- `backend/src/utils/systemSettings.js`
  Persistence helper untuk setting seperti `defaultRegistrationRole` dan `registerPageEnabled`.
- `backend/src/utils/upload.js`
  Validasi upload avatar dengan `multer`.
- `backend/src/controllers/userController.js`
  CRUD user, profile update, password update, avatar upload.

## Requirement

- Node.js 18+
- npm
- PostgreSQL 14+ direkomendasikan

## Setup Database Dari Nol

Project ini saat ini memakai kredensial database yang hardcoded di:

- [backend/src/utils/db.js](/DATA/Documents/react-app/react-dashboard/backend/src/utils/db.js)

Nilai aktif saat ini:

- host: `192.168.0.105`
- port: `5432`
- database: `react-dashboard`
- user: `user-react-dashboard`
- password: `NoComent@x9x9`

Jika ingin langsung mengikuti konfigurasi existing, buat user dan database PostgreSQL dengan nilai yang sama.

### 1. Login ke PostgreSQL sebagai superuser

```bash
psql -U postgres
```

### 2. Buat user dan database

```sql
CREATE USER "user-react-dashboard" WITH PASSWORD 'NoComent@x9x9';
CREATE DATABASE "react-dashboard" OWNER "user-react-dashboard";
GRANT ALL PRIVILEGES ON DATABASE "react-dashboard" TO "user-react-dashboard";
```

### 3. Pastikan user bisa mengakses schema `public`

Setelah database dibuat, masuk ke database:

```bash
psql -U postgres -d react-dashboard
```

Lalu jalankan:

```sql
GRANT ALL ON SCHEMA public TO "user-react-dashboard";
ALTER SCHEMA public OWNER TO "user-react-dashboard";
```

## Setup Schema Prisma

Walaupun runtime backend membaca koneksi dari `backend/src/utils/db.js`, Prisma CLI tetap membaca `DATABASE_URL` dari `.env` atau environment variable saat menjalankan `db push`.

### 1. Masuk ke folder backend

```bash
cd backend
```

### 2. Buat file `.env`

Isi contoh:

```env
DATABASE_URL="postgresql://user-react-dashboard:NoComent@x9x9@192.168.0.105:5432/react-dashboard"
JWT_SECRET="change-this-secret"
NODE_ENV="development"
```

Catatan:

- `DATABASE_URL` dipakai oleh Prisma CLI
- runtime Express saat ini tetap memakai konfigurasi hardcoded di `backend/src/utils/db.js`
- jika host database lokal Anda berbeda, sesuaikan dua tempat:
  - `backend/src/utils/db.js`
  - `.env` untuk Prisma CLI

### 3. Push schema ke database

```bash
npx prisma db push
```

Jika ingin generate Prisma client ulang:

```bash
npx prisma generate
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

Project sudah menyediakan beberapa script seed.

### Seed utama role, status, dan admin awal

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

### Seed tambahan opsional

```bash
cd backend
node seed_users.js
node seed_500_users.js
node seed_messages.js
```

## Menjalankan Project

### Jalankan backend

```bash
cd backend
npm run dev
```

Backend default:

- `http://localhost:5000` jika dijalankan lokal

### Jalankan frontend

```bash
cd frontend
npm run dev
```

Frontend default:

- `http://localhost:5173`

## Build dan Preview

### Build frontend

```bash
cd frontend
npm run build
```

### Preview frontend build

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

1. Jika belum ada user sama sekali, user pertama otomatis menjadi `ADMIN`.
2. Jika user sudah ada, role register mengikuti setting `defaultRegistrationRole`.
3. `defaultRegistrationRole` tidak boleh `ADMIN`.
4. Jika setting `registerPageEnabled = false`, public registration ditolak backend.

## Register Page Access

System settings sekarang bisa mengontrol apakah halaman `/register` aktif atau tidak.

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

Setiap login membuat `sessionId` baru dan menyimpannya di database. Jika user login dari browser/device lain, token lama menjadi tidak valid.

### Idle Timeout Backend

Backend memeriksa `lastActivity` pada route yang dilindungi. Jika idle lebih dari 1 jam:

- session dibatalkan
- `lastSessionId` dihapus
- user dipaksa login ulang
- frontend menampilkan popup session expired

### Idle Timeout Frontend

Frontend juga memiliki inactivity timer berbasis event browser untuk logout lokal saat tidak ada aktivitas UI.

## Avatar Upload

Endpoint:

- `PUT /api/users/profile/avatar`

Behavior:

- menerima JPEG, JPG, PNG, WEBP
- limit upload 10 MB
- upload disimpan sementara di folder `uploads`
- gambar diproses dengan `sharp`
- hasil akhir dikonversi ke format `.webp`
- avatar lama dihapus jika ada

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

### Register page tidak muncul

Cek:

- setting `registerPageEnabled`
- endpoint `GET /api/settings/public`

### Gagal save system setting

Cek:

- backend sudah restart setelah perubahan kode
- koneksi PostgreSQL aktif
- tabel `SystemSetting` bisa dibuat / diubah oleh user database

### Upload avatar gagal

Cek:

- ukuran file tidak lebih dari 10 MB
- format file valid
- folder `backend/uploads` writable

## Catatan Implementasi Penting

- Runtime backend saat ini tidak membaca kredensial DB dari `.env`, tetapi dari `backend/src/utils/db.js`
- Prisma CLI tetap memakai `DATABASE_URL` saat menjalankan `db push`
- Tabel `SystemSetting` dibuat otomatis oleh backend saat pertama kali dibutuhkan
- Route settings internal memerlukan permission `canManageSettings`

## Dokumentasi Tambahan

- [frontend/README.md](/DATA/Documents/react-app/react-dashboard/frontend/README.md)
- [backend/README.md](/DATA/Documents/react-app/react-dashboard/backend/README.md)
