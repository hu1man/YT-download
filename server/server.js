
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const ytdl = require('ytdl-core');
const ytdlp = require('yt-dlp-exec');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rate limiter: max 10 downloads per IP per day
const downloadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: { error: 'Download limit reached for today. Please try again tomorrow.' },
  keyGenerator: (req) => req.ip,
});

// Helper to extract video ID from URL
function extractVideoID(url) {
  const regex = /(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/watch\?v=)([0-9A-Za-z_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Endpoint to fetch video info using ytdl-core
app.post('/api/video-info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

  // Use yt-dlp-exec to get video info as JSON
  try {
    const info = await ytdlp(url, {
      dumpJson: true,
      cookies: 'cookies.txt',
    });
    // Map formats for frontend
    const formats = (info.formats || []).filter(f => f.vcodec !== 'none').map(f => ({
      itag: f.format_id,
      qualityLabel: f.format_note || f.resolution || f.quality,
      contentLength: f.filesize || f.filesize_approx || null,
      mimeType: f.ext,
      url: f.url,
      hasAudio: f.acodec !== 'none',
      container: f.ext,
    }));
    res.json({
      id: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      formats,
      videoDetails: info,
    });
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ error: 'Failed to fetch video info', details: err.message });
  }
});

// Endpoint to download video using ytdl-core
app.get('/api/download', downloadLimiter, async (req, res) => {
  const { id, formatId } = req.query;
  if (!id || !formatId) return res.status(400).send('Missing video ID or formatId');

  // Download video and audio separately, merge with ffmpeg, then send the merged file
  const fs = require('fs');
  const path = require('path');
  const videoFile = path.join(__dirname, `${id}-${formatId}-video.mp4`);
  const audioFile = path.join(__dirname, `${id}-bestaudio-audio.mp4`);
  const outputFile = path.join(__dirname, `${id}-${formatId}-merged.mp4`);

  try {
    // Download video only
    await ytdlp(`https://www.youtube.com/watch?v=${id}`, {
      output: videoFile,
      format: formatId,
      cookies: 'cookies.txt',
    });
    // Download best audio only
    await ytdlp(`https://www.youtube.com/watch?v=${id}`, {
      output: audioFile,
      format: 'bestaudio',
      cookies: 'cookies.txt',
    });
    // Merge with ffmpeg
    const { execFileSync } = require('child_process');
    execFileSync('ffmpeg', [
      '-y',
      '-i', videoFile,
      '-i', audioFile,
      '-c', 'copy',
      outputFile
    ]);
    // Send merged file to user
    res.header('Content-Disposition', `attachment; filename="${id}-${formatId}.mp4"`);
    const readStream = fs.createReadStream(outputFile);
    readStream.pipe(res);
    readStream.on('close', () => {
      // Clean up temp files
      fs.unlink(videoFile, () => {});
      fs.unlink(audioFile, () => {});
      fs.unlink(outputFile, () => {});
    });
  } catch (err) {
    console.error('Download/merge error:', err);
    res.status(500).send('Failed to download or merge video/audio.');
    // Clean up any temp files if error
    [videoFile, audioFile, outputFile].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
