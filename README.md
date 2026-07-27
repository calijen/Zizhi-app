# Zizhi (資治) — Vintage-Inspired EPUB & PDF Reader with Interactive Digital Notebook

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-ffca28.svg)](https://firebase.google.com/)

**Zizhi (資治)** is an elegant, distraction-free online reader and interactive digital notebook designed for book lovers, researchers, and students. Inspired by classic print craftsmanship and modern digital note-taking, Zizhi combines immersive EPUB and PDF reading with freehand sketchpads, AI summaries, quotes management, and cross-device cloud sync.

---

## ✨ Features

### 📚 **Rich EPUB & PDF Reader**
- **Dual Reading Modes**: Seamlessly toggle between smooth scrolling and paginated reading modes.
- **Table of Contents**: Deep nested chapter navigation for fast access.
- **Custom Typography**: Adjust font sizes, line heights, serif/sans-serif fonts, and paper textures.
- **Reading Progress Tracking**: Automatically remembers your exact reading position and chapter.

### 📒 **Interactive Digital Notebook**
- **Multi-Page Notebook**: Create, flip through, and organize multiple notebook pages per book.
- **Freehand Drawing & Highlighter**: Canvas pencil draw, stroke thickness selector, and semi-transparent highlighters.
- **Text Layering**: Type notes directly on lined paper with precise color controls.
- **Sticky Notes & Photo Stickers**: Add repositionable sticky notes and drag-and-drop image stickers onto notebook pages.
- **Dark Mode Visibility**: Color swatches and text automatically adjust in dark mode so hand-written and typed notes remain crisp and visible.

### 🤖 **AI Reading Assistant (Powered by Gemini)**
- **Book Summaries**: Generate intelligent executive summaries for any uploaded book or chapter.
- **Context-Aware Q&A**: Ask Gemini AI questions about what you're reading without leaving the app.
- **Concept Explanation**: Select difficult passages and receive instant AI clarifications.

### 🎨 **Paper Aesthetic Themes**
- **Vintage & Modern Presets**: Sepia, Cream, Slate Dark, Pearl Light, and high-contrast night modes.
- **Adaptive UI**: High-contrast contrast guarantees comfortable reading day or night.

### ☁️ **Cloud Storage & Sync**
- **Firebase Firestore Integration**: Sync your library, bookmarks, digital notebooks, quotes, and reading activity across devices.
- **Offline First**: Works locally in your browser with automatic cloud sync whenever online.

### 📊 **Reading Analytics & Quotes**
- **Reading Statistics**: Track daily reading time and build reading streaks.
- **Quote & Note Vault**: Highlight and save favorite passages into a searchable personal library.
- **Export Capabilities**: Export notebooks and reading summaries as PDFs.

---

## 🛠️ Tech Stack

- **Core Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & Animations**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) + [Lucide React Icons](https://lucide.dev/)
- **Document Parsers**: JSZip (EPUB decompression & DOM parsing), PDF.js (PDF rendering)
- **AI Engine**: Google Gemini API (`@google/generative-ai`)
- **Backend & Auth**: Firebase Auth & Firestore (`firebase/app`, `firebase/firestore`)
- **Export Tools**: [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js version **18.0.0 or higher** installed on your system.

```bash
node -v # Should be >= 18.0.0
```

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/zizhi.git
   cd zizhi
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root directory (or rename `.env.example` if available):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` (or the port specified in terminal).

---

## 📜 Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Compiles production assets into `dist/` |
| `npm run lint` | Runs TypeScript type checker (`tsc --noEmit`) |
| `npm run preview` | Previews the production build locally |

---

## 📂 Project Structure

```text
├── components/          # React components
│   ├── NotebookPage.tsx # Interactive canvas, text & drawing layer
│   ├── NotebookSidebar.tsx # Notebook navigation, stationery controls & swatches
│   ├── Reader.tsx       # Core EPUB & PDF reading interface
│   ├── Library.tsx      # Book management & upload grid
│   ├── QuoteVault.tsx   # Saved quotes & notes manager
│   ├── AIAssistant.tsx  # Gemini AI summaries & chat
│   └── SettingsModal.tsx# Theme, typography & font options
├── epubParser.ts        # Client-side EPUB file parser
├── pdfParser.ts         # Client-side PDF file parser
├── db.ts                # Local & Firestore sync layer
├── firebase.ts          # Firebase SDK configuration
├── types.ts             # TypeScript definitions
├── App.tsx              # Main application container
└── index.css            # Global Tailwind CSS styles & dark mode rules
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
