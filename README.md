# YouTube Video Downloader Web App

A modern, full-stack web application to download YouTube videos in any available quality with audio, built with React (Vite, TailwindCSS) and Node.js (Express, yt-dlp, ffmpeg).

---

## Features
- Paste any YouTube video URL and fetch all available video qualities
- Download videos with the best available audio merged
- Clean, responsive UI with per-format download buttons
- Backend uses yt-dlp and ffmpeg for reliable downloads and merging
- Rate limiting to prevent abuse
- CORS enabled for frontend-backend separation
- Deployable to Netlify (frontend) and Render/Railway (backend)

---

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express, yt-dlp, ffmpeg, yt-dlp-exec

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- ffmpeg installed and available in PATH
- (Optional) `cookies.txt` for authenticated YouTube downloads

### 1. Clone the repository
```bash
git clone https://github.com/hu1man/YT-download.git
cd YT-download
```

### 2. Install dependencies
```bash
cd server
npm install
cd ../client
npm install
```

### 3. Run the backend
```bash
cd ../server
npm start
```

### 4. Run the frontend
```bash
cd ../client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:4000` by default.

---

## Deployment

### Frontend (Netlify/Vercel)
- Deploy the `client` folder as a static site.
- Set the backend API URL in `client/src/App.jsx` (`API_BASE`) to your deployed backend URL.

### Backend (Render/Railway/VPS)
- Deploy the `server` folder as a Node.js web service.
- Ensure ffmpeg and yt-dlp are available in the environment.
- Add any required environment variables (e.g., for cookies).

---

## Credits
- Made with ❤ by [HU1MAN](https://github.com/hu1man)

---

## License
This project is for educational purposes only. Downloading copyrighted content may violate YouTube's Terms of Service.
