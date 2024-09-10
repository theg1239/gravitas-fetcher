import React, { useState, useEffect } from 'react';
import { animated, useSpring } from 'react-spring';
import confetti from 'canvas-confetti';
import './EventCard.css';

const EventCard = ({ logoSrc, eventName, apiEndpoint, totalSeats }) => {
  const [filledSeats, setFilledSeats] = useState(0);
  const [previousFilledSeats, setPreviousFilledSeats] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [endlessConfetti, setEndlessConfetti] = useState(false);
  const [seatsFull, setSeatsFull] = useState(false);
  const [specialEffectsActive, setSpecialEffectsActive] = useState(false);

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

  const triggerFireworks = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const triggerLaserEffects = () => {
    const laserEffect = document.createElement('div');
    laserEffect.className = 'laser';
    document.body.appendChild(laserEffect);

    setTimeout(() => {
      laserEffect.remove();
    }, 5000); 
  };

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats;
        const filledSeats = totalSeats - availableSeats;

        if (filledSeats > previousFilledSeats && Math.floor(filledSeats / 100) > Math.floor(previousFilledSeats / 100)) {
          triggerConfetti();
        }

        if (filledSeats >= totalSeats) {
          setSeatsFull(true);
          if (!endlessConfetti) {
            const interval = triggerConfetti(true);
            setEndlessConfetti(interval);
            setSpecialEffectsActive(true); 
            triggerLaserEffects(); 
          }
        } else {
          setSeatsFull(false);
          setSpecialEffectsActive(false); 
          if (endlessConfetti) {
            clearInterval(endlessConfetti);
            setEndlessConfetti(false);
          }
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
    <div className={`event-card ${filledSeats >= totalSeats ? 'max-registrations' : ''} ${specialEffectsActive ? 'special-effects' : ''}`}>
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
        <button className="seats-button">{seatsFull ? 'Seats Full' : 'Seats Filled'}</button>
        <p className="total-seats">Total Seats: {totalSeats}</p>
      </div>

      {specialEffectsActive && (
        <>
          {triggerFireworks()}
          <div className="neon-lights" />
          <div className="laser-beams" />
        </>
      )}
    </div>
  );
};

export default EventCard;
