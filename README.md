<div align="center">

  <h1>🔐 SignVerify</h1>

  <p><strong>"Tanda Tangani. Verifikasi. Percayai Dokumen."</strong></p>

  <p>
    <a href="#tujuan">Tujuan</a> •
    <a href="#fitur-utama">Fitur</a> •
    <a href="#algoritma-kriptografi">Algoritma</a> •
    <a href="#instalasi-dan-menjalankan-lokal">Instalasi</a> •
    <a href="#pengujian">Testing</a> •
    <a href="#anggota-kelompok">Anggota</a>
  </p>

</div>

---

## 📌 Tentang SignVerify

**SignVerify** adalah aplikasi web edukasi yang digunakan untuk memberikan **tanda tangan digital** pada dokumen PDF dan melakukan **verifikasi terhadap integritas serta keabsahan tanda tangan digital** tersebut.

Aplikasi ini dibuat sebagai proyek mata kuliah **Keamanan Informasi** dengan topik **Digital Signature**.

SignVerify memanfaatkan teknologi kriptografi pada browser untuk mendemonstrasikan bagaimana:

- Dokumen dapat dibuatkan tanda tangan digital.
- Hash dokumen dapat digunakan untuk mendeteksi perubahan.
- Public Key digunakan untuk melakukan verifikasi.
- Private Key digunakan untuk membuat tanda tangan.
- QR Code digunakan sebagai media penyimpanan data tanda tangan.
- Perubahan pada dokumen atau data tanda tangan dapat dideteksi.

> **Catatan:** SignVerify dibuat untuk tujuan pembelajaran dan demonstrasi akademik, bukan sebagai pengganti sistem tanda tangan digital tersertifikasi untuk kebutuhan hukum atau produksi.

---

## 🎯 Tujuan

Aplikasi ini mendemonstrasikan secara visual dan teknis bagaimana kriptografi digunakan untuk membantu membuktikan:

- **Authenticity (Keaslian)**  
  Tanda tangan digital dapat diverifikasi menggunakan Public Key yang sesuai dengan Private Key yang digunakan untuk membuat tanda tangan.

- **Integrity (Integritas)**  
  Perubahan terhadap data dokumen setelah proses penandatanganan dapat dideteksi melalui perbandingan nilai hash.

- **Verification (Verifikasi)**  
  Sistem dapat memeriksa apakah tanda tangan digital sesuai dengan dokumen dan Public Key yang digunakan.

---

## ✨ Fitur Utama

### 🔑 1. Manajemen Kunci

Aplikasi dapat membuat pasangan kunci digital:

- **Private Key**
- **Public Key**

Kunci dibuat secara lokal menggunakan:

**ECDSA P-256**

Private Key digunakan untuk proses signing, sedangkan Public Key digunakan untuk proses verification.

---

### 🔐 2. Perlindungan Private Key

Private Key tidak disimpan dalam bentuk plaintext.

Private Key dilindungi menggunakan:

- **AES-GCM 256-bit**
- **PBKDF2**
- **SHA-256**
- **100.000 iterations**
- Random Salt
- Random IV

Private Key hanya didekripsi sementara di memory ketika dibutuhkan untuk proses signing.

Private Key:

- ❌ Tidak di-hardcode di source code
- ❌ Tidak dimasukkan ke QR Code
- ❌ Tidak dikirim ke repository GitHub
- ❌ Tidak dikirim ke backend
- ✅ Disimpan dalam bentuk terenkripsi pada browser

---

### 📝 3. Tanda Tangan Digital

Pengguna dapat mengunggah dokumen PDF kemudian sistem akan:

1. Membaca dokumen.
2. Menghasilkan hash menggunakan SHA-256.
3. Membuat metadata dokumen.
4. Menandatangani data menggunakan ECDSA P-256.
5. Menghasilkan digital signature.
6. Menghasilkan QR Code berisi informasi yang diperlukan untuk proses verifikasi.

---

### 🛡️ 4. Verifikasi Dokumen

Sistem dapat melakukan verifikasi terhadap dokumen yang telah ditandatangani.

Verifikasi dilakukan dengan:

- Menghitung kembali SHA-256 dokumen.
- Membandingkan hash dokumen.
- Membaca digital signature.
- Membaca Public Key.
- Melakukan verifikasi ECDSA.

Jika dokumen telah berubah, sistem dapat mendeteksi ketidaksesuaian hash.

---

### 📱 5. QR Code

Informasi tanda tangan digital dapat disimpan dalam QR Code.

QR Code dapat berisi informasi seperti:

- Nama penandatangan
- Posisi
- Institusi
- Waktu penandatanganan
- Nama file
- SHA-256 hash
- Algoritma
- Digital signature
- Public Key

**Private Key tidak disimpan di dalam QR Code.**

---

### 📷 6. QR Code Scanner

Aplikasi menyediakan fitur pembacaan QR Code.

QR Code dapat dibaca melalui:

- Kamera perangkat
- Upload gambar QR
- Input data QR secara manual

Scanner menggunakan library **jsQR** dan API kamera browser.

---

### 🧪 7. Testing & Performance

Aplikasi menyediakan halaman pengujian pada:

```text
/test
```

Pengujian meliputi:

* Key Pair Generation
* SHA-256 Hash
* Valid Signature
* Tamper Detection
* Wrong Public Key
* Modified Signature
* Private Key Encryption
* Performance Test
* QR Code Test

Performance test melakukan pengujian signing dan verification secara berulang hingga **30 iterasi**.

---

## 🛠️ Teknologi yang Digunakan

| Teknologi           | Penggunaan                       |
| ------------------- | -------------------------------- |
| **Next.js**         | Framework aplikasi web           |
| **React**           | Pembuatan antarmuka              |
| **TypeScript**      | Bahasa pemrograman               |
| **Tailwind CSS**    | Styling dan responsive UI        |
| **Web Crypto API**  | Operasi kriptografi pada browser |
| **ECDSA P-256**     | Digital Signature                |
| **SHA-256**         | Hashing dokumen                  |
| **AES-GCM 256-bit** | Enkripsi Private Key             |
| **PBKDF2**          | Derivasi encryption key          |
| **qrcode.react**    | Pembuatan QR Code                |
| **jsQR**            | Pembacaan QR Code                |
| **Recharts**        | Grafik/performa                  |
| **Vitest**          | Automated Testing                |
| **Vercel**          | Deployment                       |

---

# 🧮 Algoritma Kriptografi

## 1. SHA-256

**SHA-256 (Secure Hash Algorithm 256-bit)** digunakan untuk menghasilkan nilai hash dari dokumen PDF.

Alurnya:

```text
PDF Document
     ↓
SHA-256
     ↓
Document Hash
```

Hash memiliki panjang tetap dan digunakan sebagai representasi digital dari data dokumen.

Jika data/byte dokumen berubah, nilai hash yang dihasilkan akan berbeda.

Contoh sederhana:

```text
Dokumen Asli
     ↓
SHA-256
     ↓
Hash A
```

Setelah dokumen mengalami perubahan:

```text
Dokumen Berubah
     ↓
SHA-256
     ↓
Hash B
```

Jika:

```text
Hash A ≠ Hash B
```

maka terdapat perubahan pada data dokumen.

---

## 2. ECDSA P-256

**ECDSA (Elliptic Curve Digital Signature Algorithm)** digunakan untuk membuat dan memverifikasi tanda tangan digital.

SignVerify menggunakan kurva:

```text
P-256
```

ECDSA menggunakan pasangan kunci:

```text
Private Key
     ↓
Digital Signature
```

dan:

```text
Public Key
     ↓
Signature Verification
```

### Private Key

Private Key digunakan untuk membuat digital signature.

Private Key harus dijaga kerahasiaannya.

### Public Key

Public Key digunakan untuk memverifikasi digital signature.

Public Key dapat dibagikan kepada pihak yang ingin melakukan verifikasi.

---

# ⚙️ Cara Kerja Sistem

## ✍️ Fase 1 — Signing

Pengguna memilih dokumen PDF.

Sistem kemudian:

```text
PDF
 ↓
SHA-256
 ↓
Document Hash
 ↓
Metadata + Hash
 ↓
ECDSA P-256
 ↓
Private Key
 ↓
Digital Signature
 ↓
QR Code
```

Metadata yang digunakan dapat mencakup:

* Nama
* Posisi
* Institusi
* Tanggal/waktu
* Nama file
* Hash
* Algoritma
* Signature
* Public Key

---

## 🔎 Fase 2 — Verification

Pada proses verifikasi, pengguna memasukkan:

1. Dokumen PDF
2. QR Code atau data QR

Sistem kemudian:

```text
PDF
 ↓
SHA-256
 ↓
Hash Saat Ini
```

Kemudian hash dibandingkan dengan hash yang terdapat pada data tanda tangan.

Selanjutnya sistem melakukan verifikasi signature menggunakan Public Key.

Secara sederhana:

```text
PDF
 │
 ▼
SHA-256
 │
 ▼
Hash Saat Ini
 │
 ├────── dibandingkan ──────► Hash pada QR
 │
 ▼
Digital Signature
 │
 ▼
Public Key
 │
 ▼
ECDSA Verification
 │
 ▼
Hasil Verifikasi
```

Jika hash tidak sesuai atau digital signature tidak valid, proses verifikasi dinyatakan gagal.

---

# 🔐 Perlindungan Private Key

SignVerify menggunakan mekanisme enkripsi untuk melindungi Private Key yang disimpan pada browser.

Prosesnya:

```text
Private Key
     ↓
Password
     ↓
PBKDF2 + SHA-256
     ↓
Encryption Key
     ↓
AES-GCM 256-bit
     ↓
Encrypted Private Key
     ↓
Browser Local Storage
```

Parameter yang digunakan meliputi:

```text
Encryption  : AES-GCM
Key Size    : 256-bit
KDF         : PBKDF2
Hash        : SHA-256
Iterations  : 100,000
Salt        : Random
IV          : Random
```

Ketika proses signing membutuhkan Private Key:

```text
Encrypted Private Key
          ↓
       Password
          ↓
       Decryption
          ↓
Private Key sementara di memory
          ↓
       Signing
```

Private Key tidak perlu dikirim ke server untuk melakukan proses tersebut.

---

# 📱 Struktur Data QR Code

Contoh struktur data yang digunakan oleh QR Code:

```json
{
  "app": "SignVerify",
  "version": "1.0",
  "name": "Nama Pengguna",
  "position": "Mahasiswa Informatika",
  "institution": "Universitas",
  "date": "2026-09-28T18:44:51.876Z",
  "filename": "dokumen.pdf",
  "hash": "SHA-256_HASH",
  "algorithm": "ECDSA-P256",
  "signature": "DIGITAL_SIGNATURE",
  "publicKey": "PUBLIC_KEY"
}
```

### ⚠️ Informasi yang TIDAK ada di QR Code

```text
❌ Private Key
```

QR Code hanya digunakan untuk membawa informasi publik yang diperlukan dalam proses verifikasi.

---

# 📂 Struktur Direktori

```text
sign-verify/
│
├── app/
│   ├── about/
│   │   └── page.tsx
│   │
│   ├── keys/
│   │   └── page.tsx
│   │
│   ├── sign/
│   │   └── page.tsx
│   │
│   ├── test/
│   │   └── page.tsx
│   │
│   ├── verify/
│   │   └── page.tsx
│   │
│   ├── api/
│   │   ├── verify/
│   │   │   └── route.ts
│   │   │
│   │   └── signature/
│   │       └── validate/
│   │           └── route.ts
│   │
│   ├── components/
│   │   └── QRScanner.tsx
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── src/
│   ├── components/
│   │   └── QRScanner.tsx
│   │
│   └── utils/
│       ├── crypto.ts
│       └── crypto.test.ts
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

# 🚀 Instalasi dan Menjalankan Lokal

Pastikan sudah terinstall:

* Node.js versi 18 atau lebih baru
* npm
* Git

## 1. Clone Repository

```bash
git clone https://github.com/USERNAME/sign-verify.git
```

Ganti `USERNAME` dengan username GitHub pemilik repository.

## 2. Masuk ke Folder Project

```bash
cd sign-verify
```

## 3. Install Dependency

```bash
npm install
```

## 4. Jalankan Development Server

```bash
npm run dev
```

Kemudian buka:

```text
http://localhost:3000
```

---

# 🧪 Pengujian

SignVerify menyediakan halaman pengujian:

```text
/test
```

Halaman tersebut digunakan untuk melakukan pengujian fungsi kriptografi dan performa.

## Pengujian yang dilakukan

### 1. ECDSA Key Pair Generation

Memastikan sistem dapat menghasilkan:

* Private Key
* Public Key

menggunakan ECDSA P-256.

---

### 2. SHA-256 Hash

Memastikan data yang sama menghasilkan hash yang konsisten.

---

### 3. Valid Signature

Memastikan signature yang dibuat menggunakan Private Key dapat diverifikasi menggunakan Public Key yang sesuai.

---

### 4. Tamper Detection

Dokumen/data diubah setelah signing.

Hasil yang diharapkan:

```text
Dokumen Asli
    ↓
Verification
    ↓
PASS
```

Sedangkan:

```text
Dokumen Diubah
    ↓
Verification
    ↓
FAIL
```

---

### 5. Wrong Public Key

Signature diuji menggunakan Public Key yang berbeda/tidak sesuai.

Hasil yang diharapkan:

```text
Wrong Public Key
       ↓
Verification
       ↓
FAIL
```

---

### 6. Modified Signature

Digital signature diubah sebelum proses verification.

Hasil yang diharapkan:

```text
Modified Signature
       ↓
Verification
       ↓
FAIL
```

---

### 7. Private Key Encryption

Menguji:

* Enkripsi Private Key
* Dekripsi Private Key
* Password yang benar
* Password yang salah

Password yang salah harus menyebabkan proses dekripsi gagal.

---

### 8. Performance Test

Sistem melakukan pengujian signing dan verification sebanyak **30 iterasi** untuk memperoleh data performa.

Data yang dapat digunakan untuk analisis antara lain:

* Waktu signing
* Waktu verification
* Rata-rata waktu
* Ukuran signature
* Ukuran Public Key

---

### 9. QR Code Test

QR Code diuji untuk memastikan:

* QR dapat dibuat.
* QR dapat dibaca.
* Data QR dapat digunakan untuk verification.
* Perubahan data QR dapat terdeteksi.
* Private Key tidak terdapat dalam QR.

---

# 🧪 Automated Unit Test

Project menggunakan **Vitest** untuk automated testing.

File test:

```text
src/utils/crypto.test.ts
```

Test yang tersedia meliputi:

```text
✓ SHA-256 consistent hash
✓ ECDSA P-256 key generation
✓ Valid sign/verify
✓ Wrong public key fails
✓ Tampered data fails
✓ Modified signature fails
✓ Different data gives different hash
✓ Private key encryption/decryption
```

Hasil pengujian pada lingkungan pengembangan:

```text
8 Tests Passed
```

Untuk menjalankan automated test:

```bash
npm test
```

Atau:

```bash
npx vitest run
```

---

# 🛠️ Lint dan Build

Untuk memeriksa kualitas kode:

```bash
npm run lint
```

Untuk membuat production build:

```bash
npm run build
```

Sebelum melakukan deployment, dapat menjalankan:

```bash
npm run lint
npm test
npm run build
```

---

# 🌐 Deployment ke Vercel

SignVerify dapat di-deploy menggunakan **Vercel**.

## 1. Push ke GitHub

```bash
git add .
git commit -m "Update SignVerify"
git push origin main
```

## 2. Import Repository

Buka:

```text
https://vercel.com
```

Kemudian:

```text
Add New Project
       ↓
Import Git Repository
       ↓
Pilih repository SignVerify
       ↓
Deploy
```

Setelah proses deployment selesai, aplikasi dapat diakses melalui URL Vercel.

Aplikasi dapat digunakan melalui browser desktop maupun mobile selama browser mendukung fitur Web Crypto API dan akses kamera yang diperlukan oleh QR Scanner.

---

# 🔒 Catatan Keamanan

> [!IMPORTANT]
>
> SignVerify dibuat khusus untuk tujuan pembelajaran dan demonstrasi akademik.

* Operasi kriptografi menggunakan **Web Crypto API**.
* Private Key tidak di-hardcode pada source code.
* Private Key tidak dimasukkan ke dalam QR Code.
* Private Key tidak dikomit ke repository GitHub.
* Private Key disimpan dalam bentuk terenkripsi pada browser.
* Private Key tidak dikirim ke backend.
* Public Key digunakan untuk proses verification.
* SHA-256 digunakan untuk menghasilkan hash dokumen.
* ECDSA P-256 digunakan untuk digital signature.
* AES-GCM digunakan untuk mengenkripsi Private Key.
* PBKDF2 digunakan untuk menghasilkan key dari password.

> **Catatan:** Implementasi ini ditujukan untuk pembelajaran. Sistem ini bukan merupakan layanan tanda tangan elektronik tersertifikasi dan belum ditujukan untuk penggunaan produksi atau kebutuhan hukum.

---

# 📊 Ringkasan Hasil Pengujian

| Pengujian              | Hasil yang Diharapkan                 |
| ---------------------- | ------------------------------------- |
| Key Pair Generation    | Berhasil membuat Public & Private Key |
| SHA-256                | Hash berhasil dibuat                  |
| Valid Signature        | Verification berhasil                 |
| Tampered Data          | Verification gagal                    |
| Wrong Public Key       | Verification gagal                    |
| Modified Signature     | Verification gagal                    |
| Private Key Encryption | Enkripsi & dekripsi berhasil          |
| Wrong Password         | Dekripsi gagal                        |
| Performance 30x        | Data waktu berhasil diperoleh         |
| QR Code Generation     | QR berhasil dibuat                    |
| QR Code Scanner        | QR berhasil dibaca                    |
| QR Falsification       | Data tidak valid terdeteksi           |

> Data hasil pengujian lengkap, termasuk hasil 30 iterasi, waktu signing/verification, ukuran signature, ukuran Public Key, dan pengujian QR Code dicatat pada dokumen pengujian/Excel project.

---

# 📚 Konsep yang Didemonstrasikan

Project SignVerify mendemonstrasikan beberapa konsep keamanan informasi:

```text
Hash Function
      ↓
SHA-256
      ↓
Document Integrity
      ↓
ECDSA P-256
      ↓
Digital Signature
      ↓
Public Key Verification
      ↓
Tamper Detection
      ↓
QR Code
      ↓
Document Verification
```

Konsep utama:

* SHA-256
* Hash Function
* Public Key Cryptography
* Private Key
* Public Key
* ECDSA
* Digital Signature
* Document Integrity
* Signature Verification
* Tamper Detection
* QR Code
* Key Protection
* Browser Cryptography

---

# 👥 Anggota Kelompok


| Nama                   | NPM         | Peran / Tugas                        |
| :--------------------- | :---------- | :----------------------------------- |
| **Yusep Muhamad Nurhakim** | **247006111186** | Core Digital Signature / Kriptografi |
| **Atha Azaria Arifin** | **247006111185** | QR Code / QR Scanner / Laporan       |
| **Nazla Zulfa RR** | **247006111189** | Testing / Dokumentasi / XLSX         |

### Pembagian Kontribusi

**Anggota 1**

* Implementasi SHA-256
* Implementasi ECDSA P-256
* Proses signing dan verification
* Pengamanan Private Key

**Anggota 2**

* Implementasi QR Code
* QR Code Scanner
* Integrasi QR dengan proses verification
* Laporan

**Anggota 3**

* Automated testing
* Performance testing
* Dokumentasi project
* Pengujian tamper dan wrong public key

> Pembagian tugas di atas dapat disesuaikan dengan kontribusi nyata masing-masing anggota kelompok.

---

# 📌 Status Project

**Status: ✅ Completed / Ready for Testing**

Fitur yang telah tersedia:

* [x] Generate ECDSA P-256 Key Pair
* [x] SHA-256 Document Hash
* [x] Digital Signature
* [x] PDF Signing
* [x] PDF Verification
* [x] Tamper Detection
* [x] Wrong Public Key Detection
* [x] Modified Signature Detection
* [x] QR Code Generation
* [x] QR Code Scanner
* [x] Camera QR Scanner
* [x] QR Image Upload
* [x] Manual QR Input
* [x] Private Key Encryption
* [x] AES-GCM 256-bit
* [x] PBKDF2
* [x] Performance Test 30x
* [x] Automated Unit Test
* [x] Responsive Web Interface
* [x] Vercel Deployment Support

---

# 📄 Lisensi

Project ini dibuat untuk kebutuhan pembelajaran dan tugas akademik pada mata kuliah **Keamanan Informasi**.

---

<div align="center">

### 🔐 SignVerify

**Digital Signature Learning Application**

*Tanda Tangani. Verifikasi. Percayai Dokumen.*

</div>
