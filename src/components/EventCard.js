import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ws, setWs] = useState(null);

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

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      if (event.data === 'triggerConfetti') {
        triggerConfetti();
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

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
            transform: `translate(${tilt.x}px, ${tilt.y}px)`,
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
