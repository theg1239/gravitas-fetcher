const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.error('Redis connection error:', err);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));

const eventUrl1 = 'https://gravitas.vit.ac.in/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b';
const eventUrl2 = 'https://gravitas.vit.ac.in/events/c78879df-65f1-4eb2-a9fd-c80fb122369f';

let availableSeatsEvent1 = null;
let availableSeatsEvent2 = null;

async function scrapeSeats(eventUrl, eventNumber, totalSeats) {
    try {
        const browser = await puppeteer.launch({
            cacheDirectory: '/app/.cache/puppeteer',
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
        const filledSeats = totalSeats - availableSeats;

        console.log(`Updated available seats for Event ${eventNumber}: ${availableSeats}`);

        if (eventNumber === 1) {
            availableSeatsEvent1 = availableSeats;
            await redisClient.set('event1Seats', filledSeats);
        } else if (eventNumber === 2) {
            availableSeatsEvent2 = availableSeats;
            await redisClient.set('event2Seats', filledSeats);
        }

        await browser.close();
    } catch (error) {
        console.error(`Error scraping seat data for Event ${eventNumber}:`, error);
    }
}

setInterval(() => scrapeSeats(eventUrl1, 1, 800), 30000);
setInterval(() => scrapeSeats(eventUrl2, 2, 200), 30000);

app.get('/seats1', async (req, res) => {
    try {
        const filledSeats = await redisClient.get('event1Seats');
        if (filledSeats !== null) {
            res.json({ filledSeats: parseInt(filledSeats) });
        } else {
            res.status(503).json({ error: 'Seat data for Event 1 is not yet available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Redis error' });
    }
});

app.get('/seats2', async (req, res) => {
    try {
        const filledSeats = await redisClient.get('event2Seats');
        if (filledSeats !== null) {
            res.json({ filledSeats: parseInt(filledSeats) });
        } else {
            res.status(503).json({ error: 'Seat data for Event 2 is not yet available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Redis error' });
    }
});

app.get('/all-registrations', async (req, res) => {
    try {
        const event1Seats = await redisClient.get('event1Seats');
        const event2Seats = await redisClient.get('event2Seats');
        res.json({
            event1: event1Seats || 0,
            event2: event2Seats || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Redis error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
    scrapeSeats(eventUrl1, 1, 800);
    scrapeSeats(eventUrl2, 2, 200);
});
