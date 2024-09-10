$(document).ready(function() {
    var totalSeatsEvent1 = 800;
    var totalSeatsEvent2 = 200;

    var clockEvent1 = null;
    var clockEvent2 = null;

    var lastFilledSeatsEvent1 = null;
    var lastFilledSeatsEvent2 = null;

    var isClockEvent1Initialized = false;
    var isClockEvent2Initialized = false;

    var eventData = {
        labels: [],
        datasets: [
            {
                label: 'Cryptic Hunt',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
            },
            {
                label: 'Codex Cryptum',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                fill: true,
            }
        ]
    };

    var ctx = document.getElementById('eventGraph').getContext('2d');
    var eventGraph = new Chart(ctx, {
        type: 'line',
        data: eventData,
        options: {
            scales: {
                x: {
                    display: true
                },
                y: {
                    display: true,
                    beginAtZero: true
                }
            }
        }
    });

    function triggerConfetti() {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            disableForReducedMotion: true
        });
    }

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

            eventData.labels.push(new Date().toLocaleTimeString());
            eventData.datasets[0].data.push(filledSeats);
            eventGraph.update();

            var result = updateClock(filledSeats, clockEvent1, lastFilledSeatsEvent1, '.clock-event1', isClockEvent1Initialized);
            clockEvent1 = result.clock;
            lastFilledSeatsEvent1 = result.lastFilledSeats;
            isClockEvent1Initialized = result.isClockInitialized;

            $('#registrations-event1').text(data.registrations || 'N/A');
        });

        $.get('/seats2', function(data) {
            var availableSeats = data.availableSeats;
            var filledSeats = totalSeatsEvent2 - availableSeats;

            eventData.labels.push(new Date().toLocaleTimeString());
            eventData.datasets[1].data.push(filledSeats);
            eventGraph.update();

            var result = updateClock(filledSeats, clockEvent2, lastFilledSeatsEvent2, '.clock-event2', isClockEvent2Initialized);
            clockEvent2 = result.clock;
            lastFilledSeatsEvent2 = result.lastFilledSeats;
            isClockEvent2Initialized = result.isClockInitialized;

            $('#registrations-event2').text(data.registrations || 'N/A');
        });
    }

    fetchSeats();
    setInterval(fetchSeats, 30000);
});
