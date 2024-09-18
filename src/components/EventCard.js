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
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const newFilledSeats = totalSeats - availableSeats;

        if (!isInitialLoad.current) {
          const previousHundreds = Math.floor(previousFilledSeatsRef.current / 100);
          const currentHundreds = Math.floor(newFilledSeats / 100);

          if (
            newFilledSeats > previousFilledSeatsRef.current &&
            currentHundreds > previousHundreds
          ) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else {
          isInitialLoad.current = false;
        }

        previousFilledSeatsRef.current = newFilledSeats;

        setFilledSeats(newFilledSeats);
        setAvailableSeats(availableSeats);
        setWaterLevel((newFilledSeats / totalSeats) * 100); 
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

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
      <div className="absolute bottom-4 z-10 text-sm text-gray-400">
        <p>Total Seats: {totalSeats}</p>
        <p>Seats Left: {availableSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
