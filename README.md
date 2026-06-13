# 🌌 Aether Carbon: Unified Sync Matrix

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-8.0-blue.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald.svg)](https://supabase.com/)

> *"To sync with nature is to remember that we are not observers, but the ecosystem itself."*

**Aether Carbon: Unified Sync Matrix** is a premium, cinematic, eco-themed carbon footprint tracker. Designed with rich glassmorphism aesthetics, fluid organic animations, and a futuristic sci-fi terminal vibe, it offers users an immersive interface to log daily activities, calculate carbon impact, analyze metrics, and study climate factors.

---

## 🎨 Visual Showcase & Aesthetics

The interface is built to deliver a premium, high-fidelity experience:
- **Cinematic Boot Screen Overlay**: A glowing green neon leaf icon pulses while terminal status messages load, creating a dramatic gateway sequence.
- **Organic Green Smoke & Falling Leaves**: Shifting green smoke bubbles warped by an SVG fractal-noise displacement map float behind the UI, accompanied by 18 floating React-rendered falling leaves.
- **High-Transparency Glassmorphism**: Cards feature high-transparency glass background panels, backdrop-blur overlays, and glowing green highlights.
- **Top-Left Profile Dropdown Popover**: Replaced heavy sidebars with an interactive avatar-triggered popover menu showcasing rank, stats, avatar upload, and card claiming.
- **Full-Width Feed**: Clean, expanded 12-column ledger feed optimized for high-readability typography.
- **3D Card Layout & Scroll**: 8 beautiful carbon fact cards stacked in a scrollable tray. On desktop, they split side-by-side with interactive 3D hover effects.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev/) & [Vite 8](https://vite.dev/)
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) (native CSS integration)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & GoTrue Auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Export**: [html-to-image](https://www.npmjs.com/package/html-to-image) (for generating downloadable Aether Cards)

---

## 🚀 Key Features

### 🔐 1. Custom Eco-ID Authentication
- **Futuristic Login Screen**: Interactive registration and login portal.
- **Eco-ID Generator**: Automatically generates usernames (e.g., `terra-guardian-402`) or accepts custom display names, mapping them to virtual cryptographic credentials.
- **Sandbox Fallback Mode**: Works out-of-the-box using local storage fallback if Supabase is offline or environment variables are missing.

### 🧠 2. Compassionate Client-Side LLM Analyzer
- **Multimodal API Routing**: Configurable to fetch directly from OpenAI, Claude, Groq, OpenRouter, or a local Ollama server.
- **Anti-CORS Development Proxies**: Features built-in Vite reverse-proxy routing for localhost dev testing against Groq, OpenAI, and Anthropic APIs.
- **Compassionate & Scientific Voice**: Enforces a friendly, supportive tone in the LLM prompt. It avoids preachy lectures, respects user busy schedules, and guides them step-by-step.
- **Rich Structured Output**: Returns precise footprint calculations, narratives, itemized emissions causes (custom labeled), actionable step-by-step suggestions, and supportive motivational blocks.

### 📊 3. 5-Day Rolling Progress Matrix
- **Intraday Log Aggregation**: Groups and averages multiple logs submitted on the same calendar day.
- **Sliding Active Window**: Tracks the 5 most recent active days to represent the user's progress.
- **Rolling Mean Calculation**: Dynamically computes the average efficiency score of the 5 active days.
- **Reactive Rank Synchronization**: User ranks are automatically updated in real-time as the 5-day rolling mean crosses threshold boundaries.

### 🎖️ 4. Dynamic Sync Rank Badges
- **Carbon Beginner** (Avg < 4.0): default amber rank with a Flame icon.
- **Sustainability Seeker** (Avg >= 4.0): blue rank with a Globe icon.
- **Earth Guardian** (Avg >= 7.0): green rank with a Trees icon.
- **Eco Vanguard** (Avg >= 9.0): teal metallic rank with an Award icon.

### 🖼️ 5. Personalized Aether Cards
- **Dynamic Themes**: Border styling, custom appreciate-texts, metallic ribbons, and background gradients automatically adapt to the user's current rank.
- **Local Avatar Upload**: Supports persistent Base64 avatar upload from the profile dropdown menu, displaying the user photo centered inside a rank-colored glow ring on the Aether Card.
- **Unified PNG Exports**: Uses `html-to-image` at a fixed layout dimension of `800px` by `566px`, ensuring absolute mathematical centering of the badge seal and ribbon on all screen resolutions.

### 📖 6. Interactive Carbon Facts
A collection of 8 detailed ecological fact cards representing core climate components:
- 🌲 **Forest Sequestration**
- 🚄 **Transit Coefficients**
- 🥗 **Methane Sequestration (Diet)**
- 🪸 **Ocean Buffer Sinks**
- ⚡ **Clean Utility Grid**
- 🌱 **Soil Sequestration**
- 📱 **Supply-Chain Loads**
- 🛡️ **Greenhouse Budgets**

---

## 📁 Directory Structure

```text
unified-carbon-data/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD Action Workflow
├── public/
│   ├── images/                 # Carbon Fact Card Illustrations
│   │   ├── forest_canopy.png
│   │   ├── eco_transit.png
│   │   ├── green_diet.png
│   │   ├── ocean_sink.png
│   │   ├── renewable_grid.png
│   │   ├── soil_growth.png
│   │   ├── eco_hardware.png
│   │   └── climate_globe.png
│   ├── favicon.svg
│   ├── icons.svg
│   └── leaf_background.mp4
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx      # Authentication & Eco-ID Setup
│   │   ├── Dashboard.jsx       # Carbon Dashboard, Stats & Facts Scrollable Tray
│   │   └── FallingLeaves.jsx   # Background Leaf Particle System
│   ├── utils/
│   │   └── carbonAnalyzer.js   # Client-side NLP Carbon Parsing Engine
│   ├── App.css
│   ├── App.jsx                 # App shell, Boot sequence, Smoke filters
│   ├── index.css               # Tailwind v4 directives, custom animations & typography
│   ├── main.jsx
│   └── supabaseClient.js       # Supabase Client Init
├── .env.example                # Example environment variables
├── .gitignore
├── package.json
└── vite.config.js
```

---

## ⚡ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (version 18 or 20 recommended) and `npm` installed.

### 2. Installation
Clone this repository and install the dependencies:
```bash
git clone <your-repository-url>
cd unified-carbon-data
npm install
```

### 3. Database Setup (Supabase)
Sign up for a [Supabase](https://supabase.com/) account, create a new project, and execute the following SQL script in the **SQL Editor** to initialize the schema:

```sql
-- Create Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  eco_id text unique not null,
  badge_status text default 'Carbon Beginner', -- 'Carbon Beginner', 'Sustainability Seeker', 'Earth Guardian', 'Eco Vanguard'
  created_at timestamp with time zone default now() not null
);

-- Create Journal Logs Table
create table journal_logs (
  log_id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  raw_text text not null,
  calculated_kg numeric(10, 2) not null,
  efficiency_score numeric(5, 2) not null,
  category text not null,
  suggestions jsonb,
  created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table journal_logs enable row level security;

-- Set up RLS Policies
create policy "Users can modify own profile" on profiles for all using (auth.uid() = id);
create policy "Users can modify own logs" on journal_logs for all using (auth.uid() = user_id);

-- Auto-Create Profiles Trigger (Recommended)
-- Resolves RLS violations when email verification is enabled
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, eco_id, badge_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'eco_id', split_part(new.email, '@', 1)),
    'Carbon Beginner'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. Configuration
Create a `.env` file at the root of the project (or copy `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
```

### 5. Running Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to experience the application.

---

## 🚀 Deployment (GitHub Pages)

A CI/CD deployment configuration is set up at `.github/workflows/deploy.yml` to build and deploy the application to GitHub Pages on every push to the `main` branch.

### Deployment Steps:
1. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Go to **Settings** -> **Pages** -> **Build and deployment**. Under **Source**, select **GitHub Actions**.
4. Push changes to your repository's `main` branch, and the workflow will automate the build and deploy.

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
