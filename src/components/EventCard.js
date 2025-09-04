import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [availableSeats, setAvailableSeats] = useState(totalSeats);
  const [waterLevel, setWaterLevel] = useState(0);

  const previousFilledSeatsRef = useRef(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const ws = new WebSocket('wss://track.cryptichunt.in');

    ws.onmessage = (event) => {
      if (event.data === 'triggerConfetti') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'seatUpdate') {
            // Check if this update is for our event
            const isOurEvent = 
              (eventName === 'Cryptic Hunt' && data.eventNumber === 1) ||
              (eventName === 'Code2Create' && data.eventNumber === 2);
            
            if (isOurEvent) {
              // Real-time update from WebSocket
              updateSeatData(data.seatsFilled, data.seatsLeft);
            }
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    };

    return () => ws.close();
  }, [eventName]);

  // Helper function to check if confetti should trigger on initial load
  const shouldTriggerConfettiOnLoad = (seatCount) => {
    // Trigger if within 5 seats of any 100-seat milestone
    const milestone = Math.floor(seatCount / 100) * 100;
    return seatCount >= milestone && seatCount <= milestone + 5 && milestone > 0;
  };

  // Helper function to update seat data (used by both HTTP and WebSocket)
  const updateSeatData = (newFilledSeats, newAvailableSeats) => {
    if (!isInitialLoad.current) {
      // Trigger confetti on every 100 seat milestone (100, 200, 300, etc.)
      const previousMilestone = Math.floor(previousFilledSeatsRef.current / 100) * 100;
      const currentMilestone = Math.floor(newFilledSeats / 100) * 100;

      if (
        newFilledSeats > previousFilledSeatsRef.current &&
        currentMilestone > previousMilestone &&
        newFilledSeats >= currentMilestone
      ) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      // On initial load, trigger confetti if exactly on milestone OR near one
      if ((newFilledSeats % 100 === 0 && newFilledSeats !== 0) || shouldTriggerConfettiOnLoad(newFilledSeats)) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      isInitialLoad.current = false;
    }

    previousFilledSeatsRef.current = newFilledSeats;
    setFilledSeats(newFilledSeats);
    setAvailableSeats(newAvailableSeats);
    setWaterLevel(totalSeats > 0 ? (newFilledSeats / totalSeats) * 100 : 0);
  };

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        // Server now returns availableSeats as FILLED seats, seatsLeft as seats LEFT
        // Big number should show FILLED seats (which matches water level)
        const serverSeatsFilled = Number(data.availableSeats); // This is now filled!
        const serverSeatsLeft = Number(data.seatsLeft);

        // Use filled seats directly
        let newFilledSeats;
        let availableSeats;
        
        if (Number.isFinite(serverSeatsFilled)) {
          // Use server's filled count directly
          newFilledSeats = Math.max(0, Math.min(serverSeatsFilled, totalSeats));
          availableSeats = Number.isFinite(serverSeatsLeft) 
            ? Math.max(0, Math.min(serverSeatsLeft, totalSeats))
            : Math.max(0, Math.min(totalSeats - newFilledSeats, totalSeats));
        } else {
          // Fallback
          newFilledSeats = 0;
          availableSeats = totalSeats;
        }

        updateSeatData(newFilledSeats, availableSeats);
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 30000); // Reduced to 30s since we have WebSocket updates

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, eventName]);

  const waterColor = availableSeats === 0 ? 'bg-green-500' : 'bg-blue-600';

  return (
    <div className="relative bg-gray-900 text-white rounded-lg border border-gray-700 w-64 h-64 overflow-hidden flex flex-col items-center justify-center transition-all">
      <div
        className={`absolute bottom-0 left-0 w-full ${waterColor} opacity-60 transition-all duration-700`}
        style={{ height: `${waterLevel}%` }}
      />
      <div className="z-10 flex flex-col items-center">
        <img
          src={logoSrc}
          alt={`${eventName} Logo`}
          className="w-16 h-16 mb-2 -translate-y-9"
        />
        <h1 className="text-5xl font-bold text-white -translate-y-5">
          {filledSeats}
        </h1>
      </div>
      <div className="absolute bottom-4 z-10 text-sm text-gray-400 text-center space-y-1">
        <p>Total Seats: {totalSeats}</p>
        <p>Filled: {filledSeats} | Left: {availableSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
