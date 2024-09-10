// EventCard.js
import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0); 
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const filledSeats = totalSeats - availableSeats;
        setFilledSeats(filledSeats);
        setWaterLevel((filledSeats / totalSeats) * 100);  // Adjust water level
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, eventName]);

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
            transform: `translate(${tilt.x}px, ${tilt.y}px)`, // Tilt effect based on device movement
          }}
        ></animated.div>
      </div>

      <div className="seats-info">
        <button className="seats-button">Seats Filled</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
