<p align="center">
  <img src="https://i.imgur.com/6OV1X1E.png" alt="Berkeluh Kesah Logo" width="100%" />
</p>

# Berkeluh Kesah

An anonymous confession website built with React (Vite), Tailwind CSS v4, and Supabase.

---

## Features

- **Send Confessions**: Post anonymous confessions to a specific recipient.
- **Reactions**: Interactive, real-time reactions (Love, Sad, Angry, Laugh).
- **Comments & Replies**: Nested comment sections with auto-generated anonymous pseudonyms.
- **Profanity Filter**: Automatic censorship of Indonesian bad words.
- **Pin Posts**: Pin important confessions to the top (Admin feature).
- **Anti-Spam**: Double-comment prevention and comment button cooldowns.
- **Dark & Light Mode**: Tactile Neo-brutalist theme toggle.

---

## Getting Started

Follow the steps below to set up the project locally:

### 1. Prerequisites
Make sure you have the following installed:
* Node.js (v18 or higher)
* A Supabase account

### 2. Clone the Repository
```bash
git clone https://github.com/ClovisReyes/Berkeluh-Kesah.git
cd Berkeluh-Kesah
```

### 3. Setup Environment Variables
Duplicate `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in the variables inside `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ADMIN_PASSCODE=your-password
```

### 4. Setup Supabase Database
Run the following SQL script in your Supabase SQL Editor to create the tables and enable real-time replication:

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

### 5. Run the Project
Install dependencies and start the local development server:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` or the port shown in your terminal.