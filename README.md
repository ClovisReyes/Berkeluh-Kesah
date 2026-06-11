<p align="center">
  <img src="https://i.imgur.com/6OV1X1E.png" alt="Berkeluh Kesah Logo" width="100%" />
</p>

# 📝 Berkeluh Kesah — Papan Curhat Neo-Brutalisme

Aplikasi web curahan hati secara anonim/semi-anonim yang interaktif, modern, dan responsif. Berkeluh Kesah dibangun menggunakan estetika **Neo-brutalisme** yang terinspirasi dari [neobrutalism.dev](https://www.neobrutalism.dev/), ditenagai oleh **React (Vite)**, **Tailwind CSS v4**, dan database realtime **Supabase**.

Aplikasi ini sangat cocok bagi Anda yang ingin membuat platform curhat anonim sendiri atau ingin memodifikasi temanya menjadi gaya retro/cyberpunk Anda sendiri!

---

## ✨ Fitur Utama

- **Kirim Keluhan**: Tulis pesan curhat dari pengirim (`from`) untuk penerima (`to`) tertentu.
- **Sistem Reaksi Retro**: Dukungan emoji reaksi interaktif (Love ❤️, Sad 😢, Angry 😡, Ngakak 😂) dengan state realtime.
- **Komentar & Balasan Bertingkat (Nested Comments)**: Berinteraksi dengan pengguna lain menggunakan nama samaran acak yang dihasilkan otomatis.
- **Sistem Sensor Otomatis**: Secara otomatis mendeteksi dan menyensor kata-kata kotor/kasar bahasa Indonesia agar tetap ramah.
- **Sematkan Post (Pin)**: Admin dapat menyematkan (pin) post penting di bagian atas halaman.
- **Keamanan & Anti-Spam**: Pembatasan komentar ganda dan cooldown tombol komentar untuk mencegah spamming.
- **Mode Gelap / Terang Retro**: Transisi tema bergaya brutalist retro yang premium.

---

## 🚀 Panduan Memulai (Setup Clone)

Ikuti langkah-langkah di bawah ini untuk menjalankan project ini di komputer Anda atau melakukan deploy sendiri:

### 1. Prasyarat
Pastikan Anda sudah menginstal:
* [Node.js](https://nodejs.org/) (Versi 18 atau lebih tinggi)
* Akun [Supabase](https://supabase.com/) untuk database cloud

### 2. Clone Repositori
```bash
git clone https://github.com/ClovisReyes/Berkeluh-Kesah.git
cd Berkeluh-Kesah
```

### 3. Setup Environment Variables
Salin berkas `.env.example` menjadi `.env` di direktori utama:
```bash
cp .env.example .env
```
Isi nilai variabel di dalam file `.env` dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_PASSCODE=admin123 # Passcode untuk masuk mode moderasi admin
```

### 4. Setup Database Supabase
Buka **SQL Editor** pada dashboard proyek Supabase Anda, tempelkan query SQL di bawah ini untuk membuat tabel `posts`, `comments`, beserta relasi dan status realtime-nya secara otomatis:

```sql
-- 1. Membuat tabel posts dengan kolom lengkap
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "from" TEXT DEFAULT 'Anonim',
    "to" TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "loveCount" INTEGER DEFAULT 0 NOT NULL,
    "sadCount" INTEGER DEFAULT 0 NOT NULL,
    "angryCount" INTEGER DEFAULT 0 NOT NULL,
    "laughCount" INTEGER DEFAULT 0 NOT NULL,
    "reactionCount" INTEGER DEFAULT 0 NOT NULL,
    "isPinned" BOOLEAN DEFAULT false NOT NULL,
    "isAdminPost" BOOLEAN DEFAULT false NOT NULL
);

-- 2. Membuat tabel comments
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "from" TEXT DEFAULT 'Anonim',
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "postId" UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL
);

-- 3. Mengaktifkan fitur Realtime untuk sinkronisasi instan
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
```

### 5. Jalankan Aplikasi Secara Lokal
Instal dependensi dan jalankan server pengembangan lokal:
```bash
npm install
npm run dev
```
Buka alamat local yang tertera di terminal Anda (biasanya `http://localhost:5173` atau `http://localhost:3000`).

---

## 🎨 Panduan Kustomisasi Tema & Fitur

Bagi Anda yang ingin mengubah tema Neo-brutalisme ini menjadi milik Anda sendiri atau memodifikasi fungsionalitasnya, berikut adalah petunjuk kustomisasinya:

### 1. Mengubah Skema Warna Tema (Tailwind CSS v4)
Semua konfigurasi token warna dan style Neo-brutalisme berada di file **[src/index.css](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/index.css)**.
Anda dapat memodifikasi variabel `@theme` untuk mengubah palet warna situs Anda:

```css
@theme {
  --color-main: #FFD93D;     /* Warna aksen utama (kuning neo-brutalist) */
  --color-bg: #f3f4f6;       /* Latar belakang halaman mode terang */
  --color-bw: #ffffff;       /* Latar belakang kartu/elemen */
  --color-border: #000000;   /* Warna border */
  /* ... sesuaikan variabel lain untuk mode gelap (.dark) di bawahnya ... */
}
```

### 2. Mengubah Tipografi & Font
Aplikasi ini menggunakan font Google Fonts **Space Grotesk** untuk mempertegas karakter Neo-brutalisme. Jika ingin menggantinya:
1. Ganti tautan (link) font di **[index.html](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/index.html)** (baris 10).
2. Perbarui aturan `font-family` pada **[src/index.css](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/index.css)** (baris 35-43) dengan font baru Anda.

### 3. Mengatur Ketebalan Border & Efek Kartu
Gaya visual Neo-brutalisme ditandai dengan garis tebal kaku dan bayangan tanpa blur (*hard shadow*).
* **Ubah Ketebalan & Pembulatan**: Ganti kelas Tailwind `border-2` atau `border-4` di komponen-komponen React, serta ubah nilai radius di `src/index.css` (`--border-radius-base`).
* **Efek Hover Kartu**: Aturan animasi transisi kartu saat di-hover didefinisikan pada kelas `.neobrutalism-card` di file **[src/index.css](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/index.css)**. Anda bisa memperlambat transisi atau mengubah jarak angkat hover.

### 4. Mengubah Logo & Identitas
* **Logo README**: Ganti url gambar pada bagian atas file `README.md` (`src="https://i.imgur.com/6OV1X1E.png"`).
* **Judul & Tagline Situs**: Sesuaikan judul besar "Berkeluh Kesah" dan tagline situs di file **[src/App.tsx](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/App.tsx)**.
* **Favicon & Metadata**: Edit title dan meta descriptions di file **[index.html](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/index.html)**.

### 5. Menambah Kata Kasar pada Sistem Sensor
Sistem deteksi kata kasar bekerja secara lokal di sisi klien. Jika ingin menambah kosakata yang disensor:
1. Buka file **[src/lib/sensor.ts](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/lib/sensor.ts)**.
2. Tambahkan kata baru ke dalam array `badWords` pada baris-baris awal.

### 6. Mengubah Cooldown Spam Komentar
Setiap pengiriman komentar dilindungi oleh cooldown selama 5 detik untuk menghindari flooding.
* Buka **[src/components/ConfessionCard.tsx](file:///C:/Users/Zaynkuro/Downloads/Berkeluh%20Kesah/src/components/ConfessionCard.tsx)**.
* Cari baris `setCooldown(5)` dan ubah angka `5` ke durasi detik yang Anda inginkan.

---

## 🛠️ Build untuk Produksi
Gunakan perintah berikut jika Anda siap merilis aplikasi ke server hosting seperti Vercel, Netlify, atau VPS:
```bash
npm run build
```
Hasil build akan berada di direktori `dist` dan siap di-deploy secara statis.
