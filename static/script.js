$(document).ready(function() {
    var totalSeatsEvent1 = 800; // Total seats for Cryptic Hunt
    var totalSeatsEvent2 = 200; // Total seats for Codex Cryptum

    var clockEvent1 = null;
    var clockEvent2 = null;

    var lastFilledSeatsEvent1 = null;
    var lastFilledSeatsEvent2 = null;

    function updateClock(filledSeats, clock, lastFilledSeats, selector) {
        if (!clock) {
            // Initialize the FlipClock only once
            clock = $(selector).FlipClock(filledSeats, {
                clockFace: 'Counter',
                autoStart: true,
                minimumDigits: 3
            });
            lastFilledSeats = filledSeats; // Set initial value
        } else {
            // Update the clock only if the filledSeats value has changed
            if (lastFilledSeats !== filledSeats) {
                clock.setTime(filledSeats);
                lastFilledSeats = filledSeats; // Store the updated value
            }
        }
        return { clock, lastFilledSeats };
    }

    function fetchSeats() {
        // Fetch seats for Cryptic Hunt (Event 1)
        $.get('http://localhost:3000/seats1', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent1 - availableSeats;
            var result = updateClock(filledSeats, clockEvent1, lastFilledSeatsEvent1, '.clock-event1');
            clockEvent1 = result.clock;
            lastFilledSeatsEvent1 = result.lastFilledSeats;
        });

        // Fetch seats for Codex Cryptum (Event 2)
        $.get('http://localhost:3000/seats2', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent2 - availableSeats;
            var result = updateClock(filledSeats, clockEvent2, lastFilledSeatsEvent2, '.clock-event2');
            clockEvent2 = result.clock;
            lastFilledSeatsEvent2 = result.lastFilledSeats;
        });
    }

    // Initial fetch and set interval for fetching every 15 seconds
    fetchSeats();
    setInterval(fetchSeats, 15000); // Fetch new data every 15 seconds
});
