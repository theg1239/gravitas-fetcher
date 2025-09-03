const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
// Firebase Admin SDK for Firestore + FCM push notifications
let firebaseReady = false;
let firestore = null;
let messaging = null;
try {
    const { initializeApp, cert } = require('firebase-admin/app');
    const { getFirestore, FieldValue } = require('firebase-admin/firestore');
    const { getMessaging } = require('firebase-admin/messaging');

    const firebaseCredentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
    if (!firebaseCredentialsBase64) {
        console.warn('FIREBASE_CREDENTIALS_BASE64 is not set. Push notifications and Firestore updates will be disabled.');
    } else {
        const decodedCredentials = Buffer.from(firebaseCredentialsBase64, 'base64').toString('utf8');
        const firebaseConfig = JSON.parse(decodedCredentials);
        initializeApp({ credential: cert(firebaseConfig) });
        firestore = getFirestore();
        messaging = getMessaging();
        // Expose FieldValue on firestore instance for convenience
        firestore._FieldValue = FieldValue;
        firebaseReady = true;
        console.log('Firebase Admin initialized.');
    }
} catch (e) {
    console.warn('Firebase Admin not available. Push notifications and Firestore updates will be disabled.', e?.message || e);
}

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.static(path.join(__dirname, 'build')));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
}));

const wss = new WebSocket.Server({ noServer: true });

const apiEvent1 = 'https://gravitas.vit.ac.in/api/events/3df08aa2-22c9-42ff-8640-de501218780f'; // Cryptic Hunt API
const apiEvent2 = 'https://gravitas.vit.ac.in/api/events/a6be23db-1fd8-4a5f-825c-4a2d00a85dba'; // Code2Create API

// Event metadata
const EVENT_META = {
    1: { key: 'cryptic', name: 'Cryptic Hunt', capacity: 1000 },
    2: { key: 'codex', name: 'Code2Create', capacity: 1500 },
};

// We store FILLED seats here (not left). Naming retained for backward compatibility with routes.
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
            const totalEntries = Number(apiData.data.eventSlots[0].total_entries);
            const meta = EVENT_META[eventNumber];
            const totalCapacity = meta.capacity; // Cryptic Hunt: 1000, Code2Create: 1500
            // API total_entries represents SEATS LEFT
            const seatsLeft = Math.max(0, Math.min(totalEntries, totalCapacity));
            // We treat availableSeats variable as FILLED seats for compatibility downstream
            availableSeats = Math.max(0, Math.min(totalCapacity - seatsLeft, totalCapacity));
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
            // On first fetch also sync Firestore snapshot if Firebase is ready
            if (firebaseReady) {
                const meta = EVENT_META[eventNumber];
                await updateFirestore(meta.key, availableSeats, meta.capacity);
            }
            return;
        }

        if (availableSeats !== previousAvailableSeats) {
            console.log(`Seat count changed for Event ${eventNumber} (${eventDoc}). Previous: ${previousAvailableSeats}, New: ${availableSeats}`);
            
            // Broadcast seat update via WebSocket
            const capacity = EVENT_META[eventNumber].capacity;
            const seatsFilled = Math.max(0, Math.min(availableSeats, capacity));
            const seatsLeft = capacity - seatsFilled;
            
            const updateMessage = JSON.stringify({
                type: 'seatUpdate',
                eventNumber,
                eventDoc,
                seatsFilled,
                seatsLeft,
                totalSeats: capacity
            });
            
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(updateMessage);
                }
            });

            // Update Firestore event doc and send push notifications if Firebase is ready
            if (firebaseReady) {
                try {
                    const meta = EVENT_META[eventNumber];
                    await updateFirestore(meta.key, seatsFilled, capacity);

                    const tokens = await getAllPushTokens();
                    if (tokens.length > 0) {
                        const otherMeta = EVENT_META[eventNumber === 1 ? 2 : 1];
                        // Compute latest snapshot for both events
                        const e1Capacity = EVENT_META[1].capacity;
                        const e2Capacity = EVENT_META[2].capacity;
                        const e1Filled = Number.isFinite(availableSeatsEvent1) ? availableSeatsEvent1 : 0;
                        const e2Filled = Number.isFinite(availableSeatsEvent2) ? availableSeatsEvent2 : 0;
                        const title = `Seats updated for ${meta.name}`;
                        const body = `Cryptic Hunt: ${e1Capacity - e1Filled} left.\n${otherMeta.name === 'Code2Create' ? 'Code2Create' : 'Codex Cryptum'}: ${e2Capacity - e2Filled} left.`;
                        await sendNotification(title, body, tokens);
                    } else {
                        console.log('No push tokens available to send notifications.');
                    }
                } catch (err) {
                    console.error('Error updating Firestore or sending notifications:', err);
                }
            }
        } else {
            console.log(`Seat count did not change for Event ${eventNumber} (${eventDoc}).`);
        }
    } catch (error) {
        console.error(`Error fetching and checking Event ${eventNumber}:`, error);
    }
}

// Helper: fetch tokens from Firestore
async function getAllPushTokens() {
    if (!firebaseReady) return [];
    try {
        const snapshot = await firestore.collection('pushTokens').get();
        return snapshot.docs.map(doc => doc.data().token).filter(Boolean);
    } catch (e) {
        console.error('Failed to fetch push tokens from Firestore:', e);
        return [];
    }
}

// Helper: send notification in chunks and prune invalid tokens
async function sendNotification(title, body, tokens) {
    if (!firebaseReady) return;
    try {
        console.log(`Sending notification to ${tokens.length} tokens.`);
        const chunks = chunkArray(tokens, 500);
        for (const chunk of chunks) {
            const message = { notification: { title, body }, tokens: chunk };
            const response = await messaging.sendEachForMulticast(message);
            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send notification to ${chunk[idx]}:`, resp.error?.code || resp.error);
                    const code = resp.error?.code;
                    if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
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
            console.log(`Notification sent to ${response.successCount} devices in this batch.`);
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

function chunkArray(array, size) {
    const results = [];
    for (let i = 0; i < array.length; i += size) {
        results.push(array.slice(i, i + size));
    }
    return results;
}

// Firestore event doc updater
async function updateFirestore(eventDocKey, seatsFilled, totalSeats) {
    if (!firebaseReady) return;
    try {
        const docRef = firestore.collection('events').doc(eventDocKey);
        const availableSeats = Math.max(0, totalSeats - Math.max(0, Math.min(seatsFilled, totalSeats)));
        await docRef.set({
            availableSeats,
            seatsFilled,
            totalSeats,
            timestamp: firestore._FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Firestore updated for ${eventDocKey} | filled: ${seatsFilled}, left: ${availableSeats}/${totalSeats}`);
    } catch (error) {
        console.error(`Error updating Firestore for ${eventDocKey}:`, error);
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
        const capacity = EVENT_META[1].capacity;
        const seatsFilled = Math.max(0, Math.min(availableSeatsEvent1, capacity));
        const seatsLeft = capacity - seatsFilled;
        res.json({ availableSeats: seatsFilled, seatsLeft });
    } else {
        res.status(503).json({ error: 'Seat data for Event 1 is not yet available' });
    }
});

app.get('/seats2', (req, res) => {
    if (availableSeatsEvent2 !== null) {
        const capacity = EVENT_META[2].capacity;
        const seatsFilled = Math.max(0, Math.min(availableSeatsEvent2, capacity));
        const seatsLeft = capacity - seatsFilled;
        res.json({ availableSeats: seatsFilled, seatsLeft });
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
