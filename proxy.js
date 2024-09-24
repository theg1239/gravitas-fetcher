const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const app = express();
const PORT = process.env.PORT || 3000;

const firebaseCredentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
if (!firebaseCredentialsBase64) {
    console.error('Missing FIREBASE_CREDENTIALS_BASE64 environment variable');
    process.exit(1);
}
const decodedCredentials = Buffer.from(firebaseCredentialsBase64, 'base64').toString('utf8');
const firebaseConfig = JSON.parse(decodedCredentials);

initializeApp({
    credential: cert(firebaseConfig),
});

const firestore = getFirestore(); // Initialize Firestore
const messaging = getMessaging(); // Initialize Firebase Messaging

app.use(express.static(path.join(__dirname, 'build')));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));

const wss = new WebSocket.Server({ noServer: true });

const apiEvent1 = 'https://gravitas.vit.ac.in/api/events/ea3eb2e8-7036-4265-9c9d-ecb8866d176b'; // Cryptic event API
const apiEvent2 = 'https://gravitas.vit.ac.in/api/events/c78879df-65f1-4eb2-a9fd-c80fb122369f'; // Codex event API

let availableSeatsEvent1 = null;
let availableSeatsEvent2 = null;

let previousAvailableSeatsEvent1 = null;
let previousAvailableSeatsEvent2 = null;

const sendNotification = async (title, body, tokens) => {
    try {
        console.log(`Sending notification to ${tokens.length} tokens.`);

        const tokenChunks = chunkArray(tokens, 500);

        for (const chunk of tokenChunks) {
            const message = {
                notification: {
                    title,
                    body,
                },
                tokens: chunk,
            };

            const response = await messaging.sendEachForMulticast(message);

            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send notification to ${chunk[idx]}:`, resp.error);
                    if (
                        resp.error.code === 'messaging/invalid-registration-token' ||
                        resp.error.code === 'messaging/registration-token-not-registered'
                    ) {
                        tokensToRemove.push(chunk[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                const batch = firestore.batch();
                tokensToRemove.forEach((token) => {
                    const tokenRef = firestore.collection('pushTokens').doc(token);
                    batch.delete(tokenRef);
                });
                await batch.commit();
                console.log(`Removed ${tokensToRemove.length} invalid tokens from Firestore.`);
            }

            console.log(`Notification sent to ${response.successCount} devices.`);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

function chunkArray(array, size) {
    const results = [];
    for (let i = 0; i < array.length; i += size) {
        results.push(array.slice(i, i + size));
    }
    return results;
}

async function fetchSeats(apiUrl, eventNumber, eventDoc) {
    try {
        console.log(`Fetching seat data from API: ${apiUrl} for event ${eventNumber}`);

        const response = await fetch(apiUrl, { method: 'GET' });
        const data = await response.json();

        // Extract the seat data from the API response
        const availableSeats = data.total_entries;

        console.log(`Fetched available seats for Event ${eventNumber}: ${availableSeats}`);

        if (eventNumber === 1) {
            availableSeatsEvent1 = availableSeats;
        } else if (eventNumber === 2) {
            availableSeatsEvent2 = availableSeats;
        }

        await updateFirestore(eventDoc, availableSeats);

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

            const pushTokensSnapshot = await firestore.collection('pushTokens').get();
            const pushTokens = pushTokensSnapshot.docs.map(doc => doc.data().token);

            if (pushTokens.length > 0) {
                const title = `Seats updated for ${eventDoc === 'cryptic' ? 'Cryptic Hunt' : 'Codex Cryptum'}`;
                const body = `Cryptic Hunt: ${availableSeatsEvent1} seats left.\nCodex Cryptum: ${availableSeatsEvent2} seats left.`;
                await sendNotification(title, body, pushTokens);
            } else {
                console.log('No push tokens available to send notifications.');
            }
        } else {
            console.log(`Seat count did not change for Event ${eventNumber} (${eventDoc}).`);
        }
    } catch (error) {
        console.error(`Error fetching and checking Event ${eventNumber}:`, error);
    }
}

async function updateFirestore(eventDoc, availableSeats) {
    try {
        const docRef = firestore.collection('events').doc(eventDoc);

        let totalSeats;
        if (eventDoc === 'cryptic') {
            totalSeats = 800;
        } else if (eventDoc === 'codex') {
            totalSeats = 120;
        }

        const seatsFilled = totalSeats - availableSeats;

        await docRef.set({
            availableSeats,
            seatsFilled,
            totalSeats,
            timestamp: FieldValue.serverTimestamp(),
        });

        console.log(`Firestore updated for ${eventDoc} with ${availableSeats} available seats and ${seatsFilled} seats filled.`);
    } catch (error) {
        console.error(`Error updating Firestore for ${eventDoc}:`, error);
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
