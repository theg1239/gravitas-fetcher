import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [availableSeats, setAvailableSeats] = useState(totalSeats);
  const [waterLevel, setWaterLevel] = useState(0);

  // Ref to keep track of the previous filledSeats value
  const previousFilledSeatsRef = useRef(null);

  // Ref to detect the initial load
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const newFilledSeats = totalSeats - availableSeats;

        // If it's not the initial load, check for milestones
        if (!isInitialLoad.current) {
          // Check for milestones
          if (newFilledSeats > previousFilledSeatsRef.current) {
            const milestones = [100, 200, 300, 400, 500, 600];

            milestones.forEach((milestone) => {
              if (
                previousFilledSeatsRef.current < milestone &&
                newFilledSeats >= milestone
              ) {
                // Trigger confetti
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }
            });
          }
        } else {
          // Set the initial load flag to false after the first data fetch
          isInitialLoad.current = false;
        }

        // Update the previous filledSeats value
        previousFilledSeatsRef.current = newFilledSeats;

        setFilledSeats(newFilledSeats);
        setAvailableSeats(availableSeats);
        setWaterLevel((newFilledSeats / totalSeats) * 100); // Update water level percentage
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats]);

  return (
    <div className="relative bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 w-64 h-64 overflow-hidden flex flex-col items-center justify-center">
      <div
        className="absolute bottom-0 left-0 w-full bg-blue-600 opacity-60 transition-all duration-700"
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
