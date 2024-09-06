const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');  // Import CORS middleware

const app = express();
const PORT = 3000;

app.use(cors());

const eventUrl = 'https://gravitas.vit.ac.in/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b';

app.get('/seats', async (req, res) => {
    try {
        const browser = await puppeteer.launch({ headless: true });  // headless: true means it will run in the background
        const page = await browser.newPage();

        await page.goto(eventUrl, { waitUntil: 'networkidle2' });  // Wait for all network requests to finish

        await page.waitForSelector('p.text-xs.md\\:text-sm', { timeout: 10000 });

        const seatsText = await page.$eval('p.text-xs.md\\:text-sm', el => el.textContent);

        await browser.close();

        const availableSeats = parseInt(seatsText.split(':')[1].trim());
        res.json({ availableSeats });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Seats element not found or timed out' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});