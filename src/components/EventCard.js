// EventCard.js
import React, { useState, useEffect } from 'react';
import FlipNumbers from 'react-flip-numbers';
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
        setWaterLevel((filledSeats / totalSeats) * 100);
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000); 

    return () => clearInterval(interval); 
  }, [apiEndpoint, totalSeats, eventName]);

  useEffect(() => {
    const handleOrientation = (event) => {
      const { beta, gamma } = event;
      setTilt({ x: gamma / 5, y: beta / 5 });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);


  const waterSpring = useSpring({
    height: `${waterLevel}%`,
    config: { tension: 180, friction: 12 },
  });

  return (
    <div className="event-card">
      {/* Logo */}
      <div className="logo">
        <img src={logoSrc} alt={`${eventName} Logo`} />
      </div>

      {/* Counter */}
      <div className="counter">
        <FlipNumbers
          height={40}
          width={30}
          color="white"
          play
          numbers={filledSeats.toString()}
        />
      </div>

      {/* Water container with tilt animation */}
      <div className="water-container">
        <animated.div
          className="water"
          style={{
            ...waterSpring,
            transform: `translate(${tilt.x}px, ${tilt.y}px)`, 
          }}
        ></animated.div>
      </div>

      {/* Seats Info */}
      <div className="seats-info">
        <button className="seats-button">Seats Filled</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
