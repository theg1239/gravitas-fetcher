const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; 

app.use(express.static(path.join(__dirname, 'static')));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));

const eventUrl1 = 'https://gravitas.vit.ac.in/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b';
const eventUrl2 = 'https://gravitas.vit.ac.in/events/c78879df-65f1-4eb2-a9fd-c80fb122369f';

let availableSeatsEvent1 = null;
let availableSeatsEvent2 = null;

// Scraping function
async function scrapeSeats(eventUrl, eventNumber) {
    try {
        const browser = await puppeteer.launch({
            cacheDirectory: '/app/.cache/puppeteer'
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
            ],
            executablePath: process.env.CHROME_BIN || null,
        });
        const page = await browser.newPage();
        console.log(`Navigating to event URL: ${eventUrl} for event ${eventNumber}`);

        await page.goto(eventUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('p.text-xs.md\\:text-sm', { timeout: 10000 });

        const seatsText = await page.$eval('p.text-xs.md\\:text-sm', el => el.textContent);
        const availableSeats = parseInt(seatsText.split(':')[1].trim());

        console.log(`Updated available seats for Event ${eventNumber}: ${availableSeats}`);

        if (eventNumber === 1) {
            availableSeatsEvent1 = availableSeats;
        } else if (eventNumber === 2) {
            availableSeatsEvent2 = availableSeats;
        }

        await browser.close();
    } catch (error) {
        console.error(`Error scraping seat data for Event ${eventNumber}:`, error);
    }
}

setInterval(() => scrapeSeats(eventUrl1, 1), 30000);
setInterval(() => scrapeSeats(eventUrl2, 2), 30000);

app.get('/seats1', (req, res) => {
    if (availableSeatsEvent1 !== null) {
        res.json({ availableSeats: availableSeatsEvent1 });
    } else {
        res.status(503).json({ error: 'Seat data for Event 1 is not yet available' });
    }
});

app.get('/seats2', (req, res) => {
    if (availableSeatsEvent2 !== null) {
        res.json({ availableSeats: availableSeatsEvent2 });
    } else {
        res.status(503).json({ error: 'Seat data for Event 2 is not yet available' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
    scrapeSeats(eventUrl1, 1);
    scrapeSeats(eventUrl2, 2);
});
