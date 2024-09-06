$(document).ready(function() {
    var totalSeatsEvent1 = 800; // Total seats for Cryptic Hunt
    var totalSeatsEvent2 = 200; // Total seats for Codex Cryptum

    var clockEvent1 = null;
    var clockEvent2 = null;

    var lastFilledSeatsEvent1 = null;
    var lastFilledSeatsEvent2 = null;

    var isClockEvent1Initialized = false;
    var isClockEvent2Initialized = false;

    function updateClock(filledSeats, clock, lastFilledSeats, selector, isClockInitialized) {
        if (!isClockInitialized) {
            // Initialize the FlipClock only once
            clock = $(selector).FlipClock(filledSeats, {
                clockFace: 'Counter',
                autoStart: false,  // Prevent the clock from auto-starting
                minimumDigits: 3
            });
            isClockInitialized = true;  // Mark clock as initialized
            lastFilledSeats = filledSeats; // Set initial value
        } else {
            // Update the clock only if the filledSeats value has changed
            if (lastFilledSeats !== filledSeats) {
                clock.stop(); // Stop the clock before updating
                clock.setTime(filledSeats);  // Set the clock to the new value
                clock.start(); // Start the clock after setting the new time
                lastFilledSeats = filledSeats; // Store the updated value
            }
        }
        return { clock, lastFilledSeats, isClockInitialized };
    }

    function fetchSeats() {
        // Fetch seats for Cryptic Hunt (Event 1)
        $.get('/seats1', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent1 - availableSeats;

            // Update the clock for Event 1
            var result = updateClock(filledSeats, clockEvent1, lastFilledSeatsEvent1, '.clock-event1', isClockEvent1Initialized);
            clockEvent1 = result.clock;
            lastFilledSeatsEvent1 = result.lastFilledSeats;
            isClockEvent1Initialized = result.isClockInitialized;
        });

        // Fetch seats for Codex Cryptum (Event 2)
        $.get('/seats2', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent2 - availableSeats;

            // Update the clock for Event 2
            var result = updateClock(filledSeats, clockEvent2, lastFilledSeatsEvent2, '.clock-event2', isClockEvent2Initialized);
            clockEvent2 = result.clock;
            lastFilledSeatsEvent2 = result.lastFilledSeats;
            isClockEvent2Initialized = result.isClockInitialized;
        });
    }

    // Initial fetch and set interval for fetching every 15 seconds
    fetchSeats(); // Fetch the seats when the page first loads
    setInterval(fetchSeats, 15000); // Fetch new data every 15 seconds
});
