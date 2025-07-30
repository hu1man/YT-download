import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadingFormatId, setDownloadingFormatId] = useState(null);

  const API_BASE = 'https://vidunvdulmika.duckdns.org';
  const handleDownloadClick = async () => {
    setError('');
    setDownloadSuccess(false);
    if (!url) {
      setError('Please enter a YouTube video URL.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/video-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Failed to fetch video info.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setVideoInfo(data);
    } catch (err) {
      setError('Error fetching video info.');
    } finally {
      setLoading(false);
    }
  };

  const handleQualityDownload = async (format) => {
    setDownloadSuccess(false);
    setError('');
    setDownloadingFormatId(format.itag);
    try {
      // Always use backend proxy download to avoid 403 errors
      const videoId = videoInfo.id || (videoInfo.videoDetails && videoInfo.videoDetails.videoId);
      const formatId = format.itag;
      const downloadUrl = `${API_BASE}/api/download?id=${videoId}&formatId=${formatId}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        const errText = await res.text();
        setError('Download failed. ' + errText);
        setDownloadingFormatId(null);
        return;
      }
      // Start download
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${videoInfo.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
    } catch (err) {
      setError('Error downloading video: ' + err.message);
    } finally {
      setDownloadingFormatId(null);
    }
  };

  // Helper to get best thumbnail URL with fallback and HTTPS
  const getThumbnailUrl = () => {
    let url = '';
    if (videoInfo) {
      if (typeof videoInfo.thumbnail === 'string' && videoInfo.thumbnail.length > 5) {
        url = videoInfo.thumbnail;
      } else if (videoInfo.videoDetails && Array.isArray(videoInfo.videoDetails.thumbnails)) {
        const thumbs = videoInfo.videoDetails.thumbnails;
        url = thumbs[thumbs.length - 1]?.url || '';
      }
    }
    // Ensure HTTPS and valid URL
    if (typeof url === 'string' && url.startsWith('http://')) url = url.replace('http://', 'https://');
    if (typeof url === 'string' && url.startsWith('//')) url = 'https:' + url;
    if (typeof url === 'string' && url.length > 5) return url;
    // Fallback image
    return 'https://img.youtube.com/vi/' + (videoInfo.id || videoInfo.videoDetails?.videoId || 'dQw4w9WgXcQ') + '/hqdefault.jpg';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 bg-opacity-30 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">YouTube Video Downloader</h1>
        {!videoInfo && (
          <div className="flex">
            <input
              type="text"
              placeholder="Paste YouTube video URL here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow rounded-l-2xl bg-gray-700 bg-opacity-50 px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={handleDownloadClick}
              className="bg-blue-600 hover:bg-blue-700 rounded-r-2xl px-6 py-3 transition"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Download'}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

        {videoInfo && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">{videoInfo.title || videoInfo.videoDetails?.title}</h2>
            <img
              src={getThumbnailUrl()}
              alt="Thumbnail"
              className="mb-4 rounded-lg mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://img.youtube.com/vi/' + (videoInfo.id || videoInfo.videoDetails?.videoId || 'dQw4w9WgXcQ') + '/hqdefault.jpg';
              }}
            />
            {videoInfo.formats && videoInfo.formats.length > 0 ? (
              <ul>
                {videoInfo.formats.map((format) => (
                  <li key={format.itag} className="flex flex-col md:flex-row justify-between items-center mb-3 bg-gray-700 bg-opacity-40 rounded-lg px-4 py-2">
                    <span>
                      <b>{format.qualityLabel || format.quality || format.format_note || 'Unknown Quality'}</b>
                      {format.hasAudio ? ' (with audio)' : ' (no audio)'}
                      {format.container ? ` [${format.container}]` : ''}
                      {format.contentLength ? ` - ${(format.contentLength / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </span>
                    <button
                      onClick={() => handleQualityDownload(format)}
                      className={`bg-green-600 hover:bg-green-700 rounded px-4 py-1 mt-2 md:mt-0 transition ${downloadingFormatId === format.itag ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!!downloadingFormatId}
                    >
                      {downloadingFormatId === format.itag ? 'Downloading...' : 'Download'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No downloadable formats available.</p>
            )}
            {downloadSuccess && (
              <div className="mt-4 p-3 bg-green-700 bg-opacity-70 rounded text-center">
                Download started successfully!
              </div>
            )}
            <button
              onClick={() => {
                setVideoInfo(null);
                setUrl('');
                setError('');
                setDownloadSuccess(false);
              }}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 rounded py-2 transition"
            >
              Search Another Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
