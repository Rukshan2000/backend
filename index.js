const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
const port = process.env.PORT || 4000;

// Update CORS configuration
const allowedOrigins = ['https://www.rukshantharindu.link'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9_\-]/gi, '_');
};

app.get('/download', async (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL) {
    console.error('URL is required');
    return res.status(400).send('URL is required');
  }

  try {
    console.log(`Fetching video info for URL: ${videoURL}`);
    const info = await ytdl.getInfo(videoURL);
    const format = ytdl.chooseFormat(info.formats, { filter: 'videoandaudio', quality: 'highest', container: 'mp4' });
    const sanitizedFilename = sanitizeFilename(info.videoDetails.title);

    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    const videoStream = ytdl(videoURL, { format: format });

    videoStream.on('error', (err) => {
      console.error('Error during download:', err);
      res.status(500).send('Error downloading video');
    });

    videoStream.pipe(res).on('finish', () => {
      console.log('Download complete');
    }).on('error', (err) => {
      console.error('Error piping video stream:', err);
      res.status(500).send('Error downloading video');
    });

  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).send('Error downloading video');
  }
});

app.listen(port, () => {
  console.log(`Server started on PORT ${port}`);
});
