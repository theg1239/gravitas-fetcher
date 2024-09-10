const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const redis = require('redis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().then(() => console.log('Connected to Redis'));

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));

const eventUrl1 = 'https://gravitas.vit.ac.in/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b';
const eventUrl2 = 'https://gravitas.vit.ac.in/events/c78879df-65f1-4eb2-a9fd-c80fb122369f';

let availableSeatsEvent1 = null;
let availableSeatsEvent2 = null;

async function scrapeSeats(eventUrl, eventNumber) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(eventUrl, { waitUntil: 'networkidle2' });

    const seatsText = await page.$eval('p.text-xs.md\\:text-sm', el => el.textContent);
    const availableSeats = parseInt(seatsText.split(':')[1].trim());

    if (eventNumber === 1) {
      availableSeatsEvent1 = availableSeats;
      await redisClient.set('seatsEvent1', availableSeats);
    } else if (eventNumber === 2) {
      availableSeatsEvent2 = availableSeats;
      await redisClient.set('seatsEvent2', availableSeats); 
    }

    await browser.close();
  } catch (error) {
    console.error(`Error scraping seat data for Event ${eventNumber}:`, error);
  }
}

app.get('/seats1', async (req, res) => {
  const availableSeats = await redisClient.get('seatsEvent1');
  if (availableSeats !== null) {
    res.json({ availableSeats: parseInt(availableSeats) });
  } else {
    res.status(503).json({ error: 'Seat data for Event 1 is not yet available' });
  }
});

app.get('/seats2', async (req, res) => {
  const availableSeats = await redisClient.get('seatsEvent2');
  if (availableSeats !== null) {
    res.json({ availableSeats: parseInt(availableSeats) });
  } else {
    res.status(503).json({ error: 'Seat data for Event 2 is not yet available' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  scrapeSeats(eventUrl1, 1);
  scrapeSeats(eventUrl2, 2);

  setInterval(() => {
    scrapeSeats(eventUrl1, 1);
    scrapeSeats(eventUrl2, 2);
  }, 30000); 
});
