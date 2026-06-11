<p align="center">
  <img src="https://i.imgur.com/6OV1X1E.png" alt="Berkeluh Kesah Logo" width="100%" />
</p>

# Berkeluh Kesah

Aplikasi web curahan hati secara anonim dengan desain Neo-brutalisme yang ditenagai oleh React (Vite), Tailwind CSS v4, dan Supabase.

---

## Fitur Utama

- **Kirim Keluhan**: Mengirim pesan curhat anonim ke penerima tertentu.
- **Reaksi**: Reaksi interaktif secara realtime (Love, Sad, Angry, Laugh).
- **Komentar & Balasan**: Komentar bertingkat dengan nama samaran acak otomatis.
- **Sensor Kata Kasar**: Penyaringan otomatis kata-kata kotor bahasa Indonesia.
- **Pin Post**: Menyematkan postingan penting di bagian atas (fitur admin).
- **Anti-Spam**: Batasan komentar ganda dan cooldown untuk mencegah spam.
- **Mode Gelap/Terang**: Dukungan tema dark dan light.

---

## Panduan Memulai

Ikuti langkah-langkah di bawah ini untuk menjalankan project secara lokal:

### 1. Prasyarat
Pastikan Anda sudah menginstal:
* Node.js (Versi 18 atau lebih tinggi)
* Akun Supabase (untuk database)

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
VITE_ADMIN_PASSCODE=your-password
```

### 4. Setup Database Supabase
Jalankan query SQL berikut di SQL Editor Supabase untuk membuat tabel dan mengaktifkan fitur realtime secara otomatis:

```sql
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

CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "from" TEXT DEFAULT 'Anonim',
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "postId" UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
```

### 5. Jalankan Aplikasi Secara Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:5173` atau `http://localhost:3000` di browser Anda.

---

## Kustomisasi Tema & Fitur

Jika ingin mengubah tema atau memodifikasi fitur:
- **Warna & Font**: Edit variabel `@theme` dan properti font di `src/index.css`.
- **Sensor Kata**: Tambahkan kata baru dalam array `badWords` di `src/lib/sensor.ts`.
- **Cooldown Komentar**: Ubah durasi `setCooldown` di `src/components/ConfessionCard.tsx`.
