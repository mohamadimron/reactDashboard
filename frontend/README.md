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
  State auth global dan local inactivity logout.
- `src/services/api.js`
  Axios instance global.
- `src/components/ProtectedRoute.jsx`
  Proteksi route dashboard.
- `src/components/RegisterRouteGate.jsx`
  Proteksi route `/register` berdasarkan public system setting.
- `src/pages/Settings.jsx`
  UI pengaturan role, permission, default role register, dan enable/disable halaman register.

## Catatan

- Link `Sign up` di halaman login hanya muncul jika `registerPageEnabled` aktif.
- Route `/register` juga tetap divalidasi lagi melalui endpoint public settings agar tidak hanya bergantung pada tampilan UI.
