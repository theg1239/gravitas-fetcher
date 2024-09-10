import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [endlessConfetti, setEndlessConfetti] = useState(false);

  const triggerConfetti = (endless = false) => {
    const confettiSettings = {
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
    };

    if (endless) {
      // Trigger endless confetti
      const interval = setInterval(() => {
        confetti(confettiSettings);
      }, 500); // Confetti every 500ms
      return interval; // Return the interval for cleanup
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

        // Trigger confetti for every 100th registration
        if (
          filledSeats > previousFilledSeats &&
          Math.floor(filledSeats / 100) > Math.floor(previousFilledSeats / 100)
        ) {
          triggerConfetti();
        }

        // Trigger endless confetti if all seats are filled
        if (filledSeats >= totalSeats) {
          if (!endlessConfetti) {
            const interval = triggerConfetti(true);
            setEndlessConfetti(interval); // Store the interval to clear later
          }
        } else if (endlessConfetti) {
          // Stop endless confetti if seats decrease
          clearInterval(endlessConfetti);
          setEndlessConfetti(false);
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
        clearInterval(endlessConfetti); // Clear the endless confetti on unmount
      }
    };
  }, [apiEndpoint, totalSeats, previousFilledSeats, eventName, endlessConfetti]);

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
