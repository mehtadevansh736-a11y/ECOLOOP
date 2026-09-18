# ♻️ EcoLoop — AI-Powered Waste & Circular Economy Platform

<div align="center">

![EcoLoop Banner](https://img.shields.io/badge/EcoLoop-AI%20Circular%20Economy-10b981?style=for-the-badge&logo=leaf&logoColor=white)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Vision%20v3.6-8e44ad?style=for-the-badge&logo=google)
![Google Maps](https://img.shields.io/badge/Google%20Maps-Places%20API-4285f4?style=for-the-badge&logo=google-maps)

</div>

---

## 🌟 Overview

**EcoLoop** is a state-of-the-art, AI-powered circular economy platform designed to gamify sustainable waste management, empower local circular resource recovery, and connect communities to create a zero-waste future.

By integrating **Google Gemini Vision AI** and real-time **Google Places & Google Maps location data**, EcoLoop bridges the gap between item disposal and circular action — enabling users to instantly scan physical items, receive accurate material classifications, discover real nearby recycling & repair centers, list items on a circular marketplace, and track their personal environmental footprint.

---

## ✨ Key Features

### 📸 1. AI Waste Scanner & Vision Engine
- **Multimodal AI Classification**: Powered by `gemini-3.6-flash` vision models to analyze uploaded photos or camera feeds in real time.
- **Strict Taxonomy**: Categorizes materials into *Plastic, E-Waste, Organic, Metal, Glass, Paper/Cardboard, Textile, and Hazardous Waste*.
- **Actionable AI Recommendations**: Returns immediate recovery routes (Recycle, Upcycle, Donate, Repair, Discard) with material purity and recycling instructions.

### 📍 2. Real Circular Centers & Location Discovery
- **Google Maps & Places API Integration**: Dynamically locates nearby recycling centers, e-waste facilities, repair cafes, and donation centers using the New Google Places API.
- **Smart Filtering & Directions**: Filter centers by target material or service type with 1-click Google Maps turn-by-turn navigation.
- **Fallback Verification**: Includes curated fallback database for offline/demo reliability.

### 🏆 3. Gamification & Community Leaderboard
- **Eco Points System**: Earn points for scanning waste, taking circular actions, and creating marketplace listings.
- **Tier & Badge Milestones**: Unlock badges (*Eco Pioneer, Zero Waste Hero, Circular Master*) and track monthly & all-time community rankings.
- **Streak & Activity Tracker**: Interactive daily action logs and impact timelines.

### 🛒 4. Circular Marketplace & AI Listing Generator
- **Peer-to-Peer Redistribution**: Buy, sell, trade, or request upcycled and reusable goods.
- **1-Click AI Listing Generator**: Automatically creates title, description, category, and suggested pricing directly from scanner results.

### 📊 5. Environmental Impact Analytics
- **Personal & Global Metrics**: Visualize total CO₂ emission reductions (kg), landfill waste diverted (kg), and water saved (L).
- **Material Breakdown Charts**: Visual representation (Recharts) of recycled materials and recovery progress over time.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **AI Models**: Google Gemini Vision API (`@google/genai`)
- **Maps & Location**: Google Maps JavaScript API, Google Places API (New)
- **Data Visualization**: Recharts
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security) with automatic Demo Mode fallback

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
Ensure you have Node.js 18+ installed on your computer.

### 2. Clone Repository
```bash
git clone https://github.com/mehtadevansh736-a11y/ECOLOOP.git
cd ECOLOOP
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Gemini API Key (Required for AI Vision Scanner)
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps & Places API (Required for Real Centers Map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Supabase (Optional - Platform runs in Demo Mode if omitted)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Demo Mode Configuration
NEXT_PUBLIC_DEMO_MODE=false
```

### 5. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

```text
ECOLOOP/
├── app/                        # Next.js 14 App Router Pages & API Routes
│   ├── api/                    # Serverless API routes (scan, places, marketplace, action)
│   ├── centers/                # Circular Centers directory & Google Map view
│   ├── create-listing/         # AI Marketplace Listing creation page
│   ├── dashboard/              # User Dashboard & streak tracking
│   ├── impact/                 # Environmental Impact Analytics
│   ├── leaderboard/            # Community Leaderboards & Badges
│   ├── marketplace/            # Circular Marketplace & Item detail views
│   ├── scanner/                # AI Vision Waste Scanner UI
│   └── scan/[id]/              # Scan result details & AI recommendation page
├── components/                 # Reusable UI components & charts
│   ├── centers/                # Google Maps integration components
│   ├── charts/                 # Recharts visual analytics components
│   ├── navigation/             # Navbar, Sidebar, and Mobile Navigation
│   └── ui/                     # Design system buttons, cards, and modal dialogs
├── lib/                        # Services & utilities
│   ├── services/               # AI vision, Google Places, Impact analytics, Leaderboard services
│   ├── supabase/               # Database client setup
│   └── seedData.ts             # Demo fallback dataset
├── types/                      # TypeScript definitions & data models
└── supabase/                   # PostgreSQL schema & RLS policies
```

---

## 🔒 Security & Privacy

- **Server-Side API Key Protection**: `GEMINI_API_KEY` and `GOOGLE_PLACES_API_KEY` are strictly encapsulated in server-side API endpoints (`app/api/scan/route.ts`, `app/api/places/search/route.ts`) and are **never** exposed to the client bundle.
- **Git Ignore Safeguards**: All `.env*` environment configuration files and local secrets are excluded from repository commits.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with 💚 for a Sustainable & Zero-Waste Future

</div>
