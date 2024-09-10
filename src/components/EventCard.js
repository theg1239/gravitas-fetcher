import React, { useState, useEffect } from 'react';
import { animated, useSpring, config } from 'react-spring';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);

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

        if (
          filledSeats > previousFilledSeats &&
          Math.floor(filledSeats / 100) > Math.floor(previousFilledSeats / 100)
        ) {
          triggerConfetti();
        }

        setPreviousFilledSeats(filledSeats);
        setFilledSeats(filledSeats);
        setWaterLevel((filledSeats / totalSeats) * 100);
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, previousFilledSeats, eventName]);

  // Spring for water wave motion
  const waterWaveSpring = useSpring({
    loop: true,
    from: { transform: 'translateX(0%)' },
    to: { transform: 'translateX(-100%)' },
    config: { duration: 3000, tension: 100 },
  });

  const waterSpring = useSpring({
    height: `${waterLevel}%`,
    config: { tension: 180, friction: 12 },
  });

  return (
    <div className="event-card">
      <div className="logo">
        <img src={logoSrc} alt={`${eventName} Logo`} />
      </div>

      <div className="counter">
        {filledSeats}
      </div>

      <div className="water-container">
        <animated.div
          className="water"
          style={{
            ...waterSpring,
          }}
        >
          <animated.div
            className="wave"
            style={{
              ...waterWaveSpring,
            }}
          />
        </animated.div>
      </div>

      <div className="seats-info">
        <button className="seats-button">Seats Filled</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
