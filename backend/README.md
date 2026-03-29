# Backend

Backend project ini dibangun dengan `Node.js + Express + Prisma + PostgreSQL`.

## Script

```bash
npm run dev
npm run start
```

## Setup Singkat

### Install dependency

```bash
npm install
```

### Siapkan `.env` untuk Prisma CLI

```env
DATABASE_URL="postgresql://user-react-dashboard:NoComent@x9x9@192.168.0.105:5432/react-dashboard"
JWT_SECRET="change-this-secret"
NODE_ENV="development"
```

### Push schema

```bash
npx prisma db push
npx prisma generate
```

### Seed data dasar

```bash
node seed_relational.js
```

### Jalankan server

```bash
npm run dev
```

## File Penting

- `src/index.js`
  Entry point server Express
- `src/utils/db.js`
  Koneksi database runtime
- `src/middlewares/authMiddleware.js`
  Proteksi route, session validation, idle timeout
- `src/controllers/authController.js`
  Login, register, logout
- `src/controllers/userController.js`
  User CRUD, profile, avatar
- `src/controllers/settingsController.js`
  System settings internal dan public
- `src/utils/systemSettings.js`
  Helper persistence `SystemSetting`
- `src/utils/upload.js`
  Konfigurasi upload avatar

## Seed yang Tersedia

- `seed_relational.js`
- `seed_users.js`
- `seed_500_users.js`
- `seed_messages.js`

## Catatan

- Runtime backend saat ini memakai konfigurasi koneksi database hardcoded di `src/utils/db.js`
- Prisma CLI memakai `DATABASE_URL`
- Jika ingin mengubah host/user/password database, sesuaikan keduanya
