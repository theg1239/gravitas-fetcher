const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.static(path.join(__dirname, 'build')));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));

const wss = new WebSocket.Server({ noServer: true });

const apiEvent1 = 'https://gravitas.vit.ac.in/api/events/3df08aa2-22c9-42ff-8640-de501218780f'; // Cryptic event API
const apiEvent2 = 'https://gravitas.vit.ac.in/api/events/a6be23db-1fd8-4a5f-825c-4a2d00a85dba'; // Code2Create event API

let availableSeatsEvent1 = null;
let availableSeatsEvent2 = null;

let previousAvailableSeatsEvent1 = null;
let previousAvailableSeatsEvent2 = null;

async function fetchSeats(apiUrl, eventNumber, eventDoc) {
    try {
        console.log(`Fetching seat data from API: ${apiUrl} for event ${eventNumber}`);

        const response = await fetch(apiUrl, { method: 'GET' });
        const apiData = await response.json();

        // Check if data exists and eventSlots is not empty
        let availableSeats = null;
        if (apiData.data && apiData.data.eventSlots && apiData.data.eventSlots.length > 0) {
            const totalEntries = apiData.data.eventSlots[0].total_entries;
            // Calculate available seats based on total capacity minus registered entries
            const totalCapacity = eventNumber === 1 ? 1000 : 1500; // Cryptic Hunt: 1000, Code2Create: 1500
            // Seats left = capacity - entries (clamped 0..capacity)
            availableSeats = Math.max(0, Math.min(totalCapacity - totalEntries, totalCapacity));
        }

        if (typeof availableSeats === 'undefined' || availableSeats === null) {
            console.error(`Available seats undefined for Event ${eventNumber}`);
            return;
        }

        console.log(`Fetched available seats for Event ${eventNumber}: ${availableSeats}`);

        if (eventNumber === 1) {
            availableSeatsEvent1 = availableSeats;
        } else if (eventNumber === 2) {
            availableSeatsEvent2 = availableSeats;
        }

        return availableSeats;
    } catch (error) {
        console.error(`Error fetching seat data for Event ${eventNumber}:`, error);
        throw error;
    }
}

async function fetchAndCheckEvent(apiUrl, eventNumber, eventDoc) {
    try {
        const availableSeats = await fetchSeats(apiUrl, eventNumber, eventDoc);

        let previousAvailableSeats;
        if (eventNumber === 1) {
            previousAvailableSeats = previousAvailableSeatsEvent1;
            previousAvailableSeatsEvent1 = availableSeats;
        } else if (eventNumber === 2) {
            previousAvailableSeats = previousAvailableSeatsEvent2;
            previousAvailableSeatsEvent2 = availableSeats;
        }

        if (previousAvailableSeats === null) {
            console.log(`Initial seat count for Event ${eventNumber} (${eventDoc}): ${availableSeats}`);
            return;
        }

        if (availableSeats !== previousAvailableSeats) {
            console.log(`Seat count changed for Event ${eventNumber} (${eventDoc}). Previous: ${previousAvailableSeats}, New: ${availableSeats}`);
        } else {
            console.log(`Seat count did not change for Event ${eventNumber} (${eventDoc}).`);
        }
    } catch (error) {
        console.error(`Error fetching and checking Event ${eventNumber}:`, error);
    }
}

function broadcastConfetti() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('triggerConfetti');
        }
    });
}

setInterval(() => fetchAndCheckEvent(apiEvent1, 1, 'cryptic'), 15000);
setInterval(() => fetchAndCheckEvent(apiEvent2, 2, 'codex'), 15000);

app.get('/seats1', (req, res) => {
    if (availableSeatsEvent1 !== null) {
        const capacity = 1000;
        const seatsLeft = Math.max(0, Math.min(availableSeatsEvent1, capacity));
        const seatsFilled = capacity - seatsLeft;
        res.json({ availableSeats: seatsLeft, seatsFilled });
    } else {
        res.status(503).json({ error: 'Seat data for Event 1 is not yet available' });
    }
});

app.get('/seats2', (req, res) => {
    if (availableSeatsEvent2 !== null) {
        const capacity = 1500;
        const seatsLeft = Math.max(0, Math.min(availableSeatsEvent2, capacity));
        const seatsFilled = capacity - seatsLeft;
        res.json({ availableSeats: seatsLeft, seatsFilled });
    } else {
        res.status(503).json({ error: 'Seat data for Event 2 is not yet available' });
    }
});

app.post('/trigger-confetti', (req, res) => {
    broadcastConfetti();
    res.json({ message: 'Confetti triggered for all clients!' });
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    fetchAndCheckEvent(apiEvent1, 1, 'cryptic'); 
    fetchAndCheckEvent(apiEvent2, 2, 'codex');   
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
