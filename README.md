# Aplikasi Turnamen Karta Cup V

Aplikasi pengelolaan turnamen sepak bola Karta Cup V dengan fitur manajemen tim, jadwal pertandingan, hasil pertandingan, klasemen, dan statistik pemain.

## Teknologi yang Digunakan

- React dengan TypeScript
- Firebase Firestore untuk database
- TailwindCSS untuk styling
- Vite sebagai build tool

## Cara Menjalankan Aplikasi Secara Lokal

1. Clone repository ini
2. Install dependensi:
   ```
   npm install --legacy-peer-deps
   ```
3. Buat file `.env` dengan konfigurasi Firebase Anda:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Jalankan server pengembangan:
   ```
   npm run dev
   ```

## Cara Deploy ke Vercel

### Metode 1: Deploy melalui Vercel Dashboard

1. Buat akun di [Vercel](https://vercel.com) jika belum memilikinya
2. Push kode ke repository GitHub
3. Hubungkan repository GitHub ke Vercel:
   - Buka dashboard Vercel
   - Klik "Add New" > "Project"
   - Pilih repository GitHub Anda
   - Konfigurasi project:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
4. Tambahkan variabel lingkungan:
   - Buka tab "Settings" > "Environment Variables"
   - Tambahkan semua variabel lingkungan yang ada di file `.env`
5. Klik "Deploy"

### Metode 2: Deploy melalui Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
2. Login ke Vercel:
   ```
   vercel login
   ```
3. Deploy aplikasi:
   ```
   vercel
   ```
4. Untuk deployment produksi:
   ```
   vercel --prod
   ```

### Metode 3: Deploy dengan Script Otomatis

1. Jalankan script deployment:
   ```
   bash vercel.sh
   ```
   atau
   ```
   chmod +x vercel.sh
   ./vercel.sh
   ```

## Troubleshooting

Jika mengalami masalah saat build atau deployment:

1. Pastikan menggunakan Node.js versi 18.x:
   ```
   nvm use 18
   ```
   atau install Node.js 18 jika belum terinstal.

2. Gunakan flag `--legacy-peer-deps` saat menginstal dependensi:
   ```
   npm install --legacy-peer-deps
   ```

3. Jika masih mengalami masalah, coba hapus folder `node_modules` dan file `package-lock.json`, lalu instal ulang:
   ```
   rm -rf node_modules
   rm package-lock.json
   npm install --legacy-peer-deps
   ```

## Fitur Aplikasi

- Manajemen tim dan pemain
- Penjadwalan pertandingan
- Pencatatan hasil pertandingan
- Klasemen otomatis
- Statistik pemain (gol, kartu)
- Tampilan responsif untuk mobile dan desktop
