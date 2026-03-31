# Frontend

Frontend project ini dibangun dengan `React + Vite`.

## Script

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Modul Penting

- `src/App.jsx`
  Definisi route utama aplikasi.
- `src/context/AuthContext.jsx`
  State auth global, login/register/logout, dan inactivity timer 30 menit.
- `src/services/api.js`
  Axios instance global, auth header, dan handling session expiry dari backend.
- `src/utils/sessionExpiry.js`
  Mapping reason popup session expired.
- `src/components/SessionExpiredModal.jsx`
  Modal untuk timeout / session invalidation.
- `src/components/ProtectedRoute.jsx`
  Proteksi route dashboard.
- `src/components/RegisterRouteGate.jsx`
  Proteksi route `/register` berdasarkan public settings.
- `src/pages/Profile.jsx`
  Update profile, change password, upload avatar, dan opsi kamera mobile.
- `src/pages/Settings.jsx`
  UI role management, permission matrix, default role register, dan enable/disable halaman register.

## Flow Register

- Link `Sign up` di halaman login hanya muncul jika `registerPageEnabled` aktif
- Route `/register` tetap dicek lagi melalui endpoint public settings
- Jika register page dinonaktifkan, direct access ke `/register` akan diarahkan ke `/login`

## Session Handling

Frontend menangani beberapa reason session popup:

- 30 menit tanpa aktivitas browser
- idle timeout backend lebih dari 1 jam
- login dari device/browser lain
- session invalid generic

Popup session expired memakai payload yang sudah dinormalisasi, sehingga judul dan pesan tetap konsisten walau event datang dari beberapa sumber berbeda.

## Avatar Upload

Halaman profile mendukung:

- pilih file dari gallery/file picker
- opsi `Use Camera` pada device yang mendukung kamera/mobile capture
- feedback sukses/gagal upload langsung di UI

## Role Management UI

Tab `Role Management` di system settings saat ini sudah dioptimalkan untuk mobile dan desktop:

- card `Public Registration Access`
- card `Default Registration Role`
- card `Create New Role`
- daftar role berbentuk card di mobile dan tabel di desktop
