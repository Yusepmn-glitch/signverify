# SignVerify

**"Tanda Tangani. Verifikasi. Percayai Dokumen."**

SignVerify adalah aplikasi web pembelajaran yang digunakan untuk memberikan tanda tangan digital pada dokumen dan memeriksa apakah dokumen tersebut masih asli atau sudah mengalami perubahan. Aplikasi ini dibuat khusus untuk tugas mata kuliah Keamanan Informasi dengan topik Digital Signature.

## Tujuan

Aplikasi ini mendemonstrasikan secara visual dan teknis bagaimana kriptografi digunakan untuk membuktikan bahwa dokumen berasal dari penandatangan tertentu (Authenticity) dan belum diubah setelah ditandatangani (Integrity).

## Teknologi

- **Next.js** & **React** (Frontend Framework)
- **TypeScript** (Static Typing)
- **Tailwind CSS** (Styling UI Modern)
- **Web Crypto API** (Native Browser Cryptography)
- **Lucide React** (Ikon)
- **Recharts** (Grafik Performa)
- **qrcode.react** (Pembuatan QR Code)

## Algoritma

1. **SHA-256 (Secure Hash Algorithm)**: Digunakan untuk menghasilkan nilai hash (digest) unik dari dokumen PDF. Perubahan satu karakter pada PDF akan mengubah seluruh nilai hash.
2. **ECDSA P-256 (Elliptic Curve Digital Signature Algorithm)**: Algoritma kunci asimetris yang digunakan untuk tanda tangan digital. 
   - **Private Key**: Untuk membuat tanda tangan (Sign).
   - **Public Key**: Untuk memverifikasi tanda tangan (Verify).

## Cara Kerja
1. **Penandatanganan**: Sistem membaca PDF, menghasilkan hash SHA-256, dan menandatangani hash tersebut beserta metadata (nama, waktu, dll) menggunakan Private Key ECDSA P-256. Sistem mengeluarkan QR Code.
2. **Verifikasi**: Sistem membaca PDF ulang dan menghitung hash-nya. Kemudian sistem membaca data dari QR Code, merekonstruksi data, dan memverifikasi kecocokannya menggunakan Public Key.

## Struktur Folder

```text
sign-verify/
├── app/
│   ├── about/        # Halaman Penjelasan Algoritma
│   ├── keys/         # Halaman Manajemen Kunci ECDSA
│   ├── sign/         # Halaman Pembuatan Tanda Tangan
│   ├── test/         # Halaman Pengujian & Performa
│   ├── verify/       # Halaman Verifikasi Dokumen
│   ├── layout.tsx    # Layout & Navbar
│   └── page.tsx      # Landing Page
├── utils/
│   └── crypto.ts     # Wrapper fungsi Web Crypto API (SHA-256 & ECDSA)
└── package.json      # Konfigurasi Dependensi
```

## Instalasi dan Menjalankan Lokal

Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstal (minimal v18+).

1. Clone repository ini.
2. Buka terminal di folder project.
3. Jalankan `npm install` untuk menginstal dependensi.
4. Jalankan `npm run dev` untuk memulai development server.
5. Buka `http://localhost:3000` di browser.

## Testing

Aplikasi ini menggunakan UI Test interaktif dan otomasi di dalam browser.
1. Buka halaman **Pengujian Sistem** (`/test`).
2. Klik tombol **Jalankan Semua Test**.
3. Sistem akan secara otomatis menguji pembuatan kunci, hashing, tamper detection, wrong key detection, serta uji waktu performa sebanyak 30 iterasi.

## Build

Untuk memastikan tidak ada error sebelum deploy:
```bash
npm run lint
npm run build
```

## Deploy Vercel

1. Push repository ke GitHub.
2. Login ke [Vercel](https://vercel.com).
3. Klik **Add New...** -> **Project**.
4. Import repository GitHub SignVerify Anda.
5. Klik **Deploy** (Tanpa environment variable khusus).

## Catatan Keamanan

> **PENTING:** Aplikasi ini dibuat untuk **tujuan pembelajaran/demonstrasi**. 
> - Aplikasi menggunakan Web Crypto API, sehingga semua pemrosesan terjadi **secara lokal di browser** (client-side). 
> - Tidak ada dokumen atau private key yang pernah dikirim ke server backend/database.
> - Private key **TIDAK PERNAH** di hardcode di source code, **TIDAK PERNAH** dikomit ke GitHub, dan **TIDAK PERNAH** disisipkan di dalam QR-Code.

## Anggota Kelompok
- [Nama Mahasiswa 1] - [NPM]
- [Nama Mahasiswa 2] - [NPM]
- [Nama Mahasiswa 3] - [NPM]
