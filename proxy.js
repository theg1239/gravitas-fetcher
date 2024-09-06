const express = require('express');
const puppeteer = require('puppeteer-core'); // using puppeteer-core to control a pre-installed Chrome

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/seats', async (req, res) => {
  try {
    // Launch Puppeteer with system-installed Chrome
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/google-chrome-stable', // Path to Chrome in Render environment
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto('https://gravitas.vit.ac.in/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b', { waitUntil: 'networkidle2' });

    // Wait for the element and extract seat data
    await page.waitForSelector('p.text-xs.md\\:text-sm', { timeout: 60000 });
    const seatsText = await page.$eval('p.text-xs.md\\:text-sm', el => el.textContent);
    
    // Extract seat availability and send it in response
    const availableSeats = parseInt(seatsText.split(':')[1].trim());
    res.json({ availableSeats });

    await browser.close();
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
