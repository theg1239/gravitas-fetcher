import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [seatsFull, setSeatsFull] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(totalSeats); // Add availableSeats

  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const filledSeats = totalSeats - availableSeats;

        // Trigger confetti when filled seats pass through 00 or end with 00
        if (
          (filledSeats > previousFilledSeats && Math.floor(filledSeats / 100) > Math.floor(previousFilledSeats / 100)) ||
          (filledSeats % 100 === 0)
        ) {
          triggerConfetti();
        }

        // Check if max seats are filled
        if (filledSeats >= totalSeats) {
          setSeatsFull(true);
        } else {
          setSeatsFull(false);
        }

        setPreviousFilledSeats(filledSeats);
        setFilledSeats(filledSeats);
        setWaterLevel((filledSeats / totalSeats) * 100);
        setAvailableSeats(availableSeats); // Update availableSeats
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [apiEndpoint, totalSeats, previousFilledSeats, eventName]);

  return (
    <div className="event-card">
      <div className="logo">
        <img src={logoSrc} alt={`${eventName} Logo`} />
      </div>

      <div className="counter">
        {seatsFull ? totalSeats : filledSeats} {/* Always display totalSeats when seatsFull */}
      </div>

      <div className="water-container">
        <div className="water" style={{ height: `${waterLevel}%` }} />
      </div>

      <div className="seats-info">
        <button className="seats-button">{seatsFull ? 'Seats Full' : 'Seats Filled'}</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
        <p className="seats-left">Seats Left: {availableSeats}</p> {/* New line for seats left */}
      </div>
    </div>
  );
};

export default EventCard;
