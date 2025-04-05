const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the content from the provided URL
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Replace Yale (case-insensitive) with Fale in text nodes only
    $('body *').contents().filter(function () {
      return this.nodeType === 3; // Text nodes only
    }).each(function () {
      const text = $(this).text();
      // Use regex with case preservation
      let newText = text;
      if (text.match(/Yale/i)) { // Only replace if Yale is actually present
        newText = text
          .replace(/YALE/g, 'FALE')
          .replace(/Yale/g, 'Fale')
          .replace(/yale/g, 'fale');
      }
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });

    // Process title separately
    let title = $('title').text();
    if (title.match(/Yale/i)) { // Only replace if Yale is actually present
      title = title
        .replace(/YALE/g, 'FALE')
        .replace(/Yale/g, 'Fale')
        .replace(/yale/g, 'fale');
    }
    $('title').text(title);

    return res.json({
      success: true,
      content: $.html(),
      title: title,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({
      error: `Failed to fetch content: ${error.message}`
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Faleproxy server running at http://localhost:${PORT}`);
});
