# React & Node.js Dashboard Application

Aplikasi web dashboard full-stack yang responsif, modern, dan scalable menggunakan **React.js** (Frontend) dan **Node.js/Express** (Backend) dengan **SQLite** dan **Prisma ORM**.

## Fitur Utama
*   **Autentikasi:** Register, Login, Logout dengan enkripsi password (bcrypt) dan JWT.
*   **User Management (CRUD):** Tambah, Edit, Hapus, dan Lihat pengguna (Khusus Role ADMIN).
*   **Dashboard:** Menampilkan ringkasan data statistik.
*   **Role-Based Access Control (RBAC):** Proteksi rute berdasarkan role (ADMIN vs USER).
*   **Pagination & Search:** Pencarian pengguna dan paginasi data pada tabel pengguna.
*   **UI Modern:** Dibangun menggunakan Tailwind CSS dan Lucide Icons.

## Struktur Direktori
*   `/backend` - Server Node.js, Express API, dan database SQLite (Prisma).
*   `/frontend` - Aplikasi React.js (Vite) dengan Tailwind CSS v4.

## Persyaratan Sistem
*   Node.js (versi 18+ direkomendasikan)
*   NPM / Yarn

---

## Panduan Instalasi dan Menjalankan Aplikasi

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer lokal Anda.

### 1. Setup Backend
Buka terminal dan jalankan perintah berikut:

```bash
# Masuk ke direktori backend
cd backend

# Install dependencies
npm install

# Jalankan migrasi database Prisma (SQLite)
npx prisma migrate dev --name init

# Jalankan server backend (mode development)
npm run dev
# Atau jika script dev belum ada di package.json:
npx nodemon src/index.js
```
*Backend akan berjalan di `http://localhost:5000`.*

### 2. Setup Frontend
Buka tab terminal baru dan jalankan perintah berikut:

```bash
# Masuk ke direktori frontend (dari root project)
cd frontend

# Install dependencies
npm install

# Jalankan server frontend (Vite)
npm run dev
```
*Frontend akan berjalan di `http://localhost:5173` (port default Vite).*

---

## Cara Menggunakan Aplikasi

1.  **Register:** Buka frontend di browser, klik **Sign up** dan buat akun baru. *(Catatan: Pengguna pertama yang mendaftar akan otomatis mendapatkan role `ADMIN` sesuai logika di backend).*
2.  **Login:** Gunakan email dan password yang baru saja didaftarkan untuk masuk.
3.  **Dashboard:** Setelah login, Anda akan diarahkan ke halaman Dashboard yang menampilkan statistik pengguna.
4.  **User Management:** Jika Anda login sebagai `ADMIN`, Anda akan melihat menu "User Management" di sidebar kiri. Di sana Anda dapat menambah, mengedit, mencari, dan menghapus pengguna. Pengguna dengan role `USER` biasa tidak akan melihat menu ini.
