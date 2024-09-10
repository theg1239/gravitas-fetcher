import React, { useState, useEffect, useRef } from 'react';
import { animated, useSpring } from 'react-spring';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [endlessConfetti, setEndlessConfetti] = useState(false);
  const [seatsFull, setSeatsFull] = useState(false);
  
  const isInitialLoad = useRef(true); 

  const triggerConfetti = (endless = false) => {
    const confettiSettings = {
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
    };

    if (endless) {
      const interval = setInterval(() => {
        confetti(confettiSettings);
      }, 500); 
      return interval; 
    } else {
      confetti(confettiSettings);
    }
  };

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const filledSeats = totalSeats - availableSeats;

        if (!isInitialLoad.current) {
          const lastTwoDigits = filledSeats % 100;

          if (filledSeats > previousFilledSeats && lastTwoDigits === 0) {
            triggerConfetti();
          }

          if (filledSeats >= totalSeats) {
            setSeatsFull(true);
            if (!endlessConfetti) {
              const interval = triggerConfetti(true);
              setEndlessConfetti(interval);
            }
          } else {
            setSeatsFull(false);
            if (endlessConfetti) {
              clearInterval(endlessConfetti);
              setEndlessConfetti(false);
            }
          }
        } else {
          isInitialLoad.current = false;
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

    return () => {
      clearInterval(interval);
      if (endlessConfetti) {
        clearInterval(endlessConfetti); 
      }
    };
  }, [apiEndpoint, totalSeats, previousFilledSeats, endlessConfetti, eventName]);

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
    <div className={`event-card ${filledSeats >= totalSeats ? 'max-registrations' : ''}`}>
      <div className="logo">
        <img src={logoSrc} alt={`${eventName} Logo`} />
      </div>

      <div className="counter">
        {seatsFull ? totalSeats : filledSeats}
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
        <button className="seats-button">{seatsFull ? "Seats Full" : "Seats Filled"}</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
      </div>
    </div>
  );
};

export default EventCard;
