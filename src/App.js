import React, { useEffect } from 'react';
import EventCard from './components/EventCard';
import './App.css'; 

function App() {
  useEffect(() => {
    const canvas = document.getElementById('stars');
    const ctx = canvas.getContext('2d');
    const numStars = 100;
    let stars = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    function Star(x, y, radius, dx, dy) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.dx = dx;
      this.dy = dy;

      this.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
      };

      this.update = function () {
        const movementFactor = 0.005;
        this.x += (mouseX - canvas.width / 2) * movementFactor * this.dx;
        this.y += (mouseY - canvas.height / 2) * movementFactor * this.dy;

        if (this.x - this.radius > canvas.width || this.x + this.radius < 0) {
          this.x = Math.random() * canvas.width;
        }
        if (this.y - this.radius > canvas.height || this.y + this.radius < 0) {
          this.y = Math.random() * canvas.height;
        }

        this.draw();
      };
    }

    function initStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        const radius = Math.random() * 2;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const dx = (Math.random() - 0.5) * 0.5;
        const dy = (Math.random() - 0.5) * 0.5;
        stars.push(new Star(x, y, radius, dx, dy));
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => star.update());
    }

    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    });

    initStars();
    animate();
  }, []);

  return (
    <div className="relative flex flex-col justify-center items-center min-h-screen">
      <canvas id="stars" className="absolute top-0 left-0 z-0"></canvas>

      <div className="relative z-10 space-y-8">
        <EventCard
          logoSrc="/static/ch.png"
          eventName="Cryptic Hunt"
          apiEndpoint="https://track.cryptichunt.in/seats1"
          totalSeats={800}
        />
        <EventCard
          logoSrc="/static/cx.png"
          eventName="Codex Cryptum"
          apiEndpoint="https://track.cryptichunt.in/seats2"
          totalSeats={120}
        />
      </div>
    </div>
  );
}

export default App;