const express = require('express');
const fetch = require('cross-fetch');
const path = require('path');


const app = express();
const port = 8000; // You can choose any port you prefer

// Serve static files from the directory where this script is located
app.use(express.static(path.join(__dirname)));

// Serve static files from the /cdn directory
app.use('/cdn', express.static(path.join(__dirname, 'cdn')));

app.use('/locales', express.static(path.join(__dirname, 'cdn')));


// Function to dynamically determine the target URL
function getTarget(req) {
  // Extract the target URL from the request path
  const targetUrl = req.url.slice(1).split('/').slice(1).join('/');
  return targetUrl;
}

app.get('/download/*', async (req, res) => {
  const url = getTarget(req)

  // Validate the URL and check if it's for a PDF file
  if (!url || !url.toLowerCase().endsWith('.pdf')) {
    return res.status(400).send('Invalid URL or file type. Only PDF files are allowed.');
  }

  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the file: ${response.statusText}`);
    }

    // Get the buffer from the response
    const buffer = await response.buffer();

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${url.split('/').pop()}"`);

    // Send the buffer as the response
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading the file.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
