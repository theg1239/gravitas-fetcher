$(document).ready(function() {
    var totalSeatsEvent1 = 800;
    var totalSeatsEvent2 = 200;

    var clockEvent1 = null;
    var clockEvent2 = null;

    var lastFilledSeatsEvent1 = null;
    var lastFilledSeatsEvent2 = null;

    var isClockEvent1Initialized = false;
    var isClockEvent2Initialized = false;

    function triggerConfetti() {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            disableForReducedMotion: true
        });
    }

    var socket = new WebSocket('wss://gravitas-scraper-ccbb9811264f.herokuapp.com');
    socket.onmessage = function(event) {
        if (event.data === 'triggerConfetti') {
            triggerConfetti();
        }
    };

    function updateClock(filledSeats, clock, lastFilledSeats, selector, isClockInitialized) {
        if (!isClockInitialized) {
            clock = $(selector).FlipClock(filledSeats, {
                clockFace: 'Counter',
                autoStart: false,
                minimumDigits: 3
            });
            isClockInitialized = true; 
            lastFilledSeats = filledSeats;

            if (filledSeats % 100 === 0 && filledSeats !== 0) {
                triggerConfetti();
            }
        } else {
            if (lastFilledSeats !== filledSeats) {
                clock.stop();
                clock.setTime(filledSeats); 
                clock.start(); 

                if (Math.floor(lastFilledSeats / 100) !== Math.floor(filledSeats / 100)) {
                    triggerConfetti();
                }

                lastFilledSeats = filledSeats;
            }
        }
        return { clock, lastFilledSeats, isClockInitialized };
    }

    function fetchSeats() {
        $.get('/seats1', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent1 - availableSeats;

            var result = updateClock(filledSeats, clockEvent1, lastFilledSeatsEvent1, '.clock-event1', isClockEvent1Initialized);
            clockEvent1 = result.clock;
            lastFilledSeatsEvent1 = result.lastFilledSeats;
            isClockEvent1Initialized = result.isClockInitialized;
        });

        $.get('/seats2', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent2 - availableSeats;

            var result = updateClock(filledSeats, clockEvent2, lastFilledSeatsEvent2, '.clock-event2', isClockEvent2Initialized);
            clockEvent2 = result.clock;
            lastFilledSeatsEvent2 = result.lastFilledSeats;
            isClockEvent2Initialized = result.isClockInitialized;
        });
    }

    fetchSeats();
    setInterval(fetchSeats, 30000);
});
