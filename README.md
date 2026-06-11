<p align="center">
  <img src="https://i.imgur.com/6OV1X1E.png" alt="Berkeluh Kesah Logo" width="350" />
</p>

# Berkeluh Kesah (React + Supabase Edition)

Aplikasi web curahan hati secara anonim/semi-anonim yang ditenagai oleh **React (Vite)**, **Tailwind CSS v4 (Neo-brutalist)**, dan **Supabase**.

## Fitur Utama

- **Kirim Keluhan**: Tulis pesan curhat dari pengirim (`from`) untuk penerima (`to`) tertentu.
- **Sistem Sensor**: Otomatis menyensor kata-kata kasar/kotor bahasa Indonesia.
- **Komentar & Love**: Tanggapi keluhan pengguna lain secara instan dengan mengirimkan komentar atau menyukai pesan tersebut.
- **Anti Spam**: Pembatasan pengiriman pesan ganda untuk mencegah spam.
- **Wibu Mode & Dark/Light Theme**: Kostumisasi tema tampilan yang menarik dan interaktif.

## Cara Menjalankan

1. Salin berkas `.env.example` ke `.env` dan isi dengan kredensial Supabase Anda.
2. Buat tabel database di Supabase SQL Editor (lihat skema di bawah).
3. Jalankan server lokal:
   ```bash
   npm install
   npm run dev
   ```
4. Buka [http://localhost:3000](http://localhost:3000) (atau port yang tertera) di browser Anda.

---

## 🗄️ Konfigurasi Database Supabase (SQL Editor)

Buka tab **SQL Editor** di dashboard Supabase Anda, lalu tempel dan jalankan query SQL berikut untuk membuat tabel secara otomatis:

```sql
-- 1. Membuat tabel posts
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "from" TEXT DEFAULT 'Anonim',
    "to" TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "loveCount" INTEGER DEFAULT 0 NOT NULL
);

-- 2. Membuat tabel comments
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "from" TEXT DEFAULT 'Anonim',
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "postId" UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL
);

-- 3. Mengaktifkan fitur Realtime untuk kedua tabel
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
```
