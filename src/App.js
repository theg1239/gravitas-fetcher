// App.js
import React from 'react';
import EventCard from './components/EventCard';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="events-container">
        <EventCard
          logoSrc="/static/ch.png"
          eventName="Cryptic Hunt"
          apiEndpoint="/seats1" // API endpoint for Cryptic Hunt
          totalSeats={800}
        />
        <EventCard
          logoSrc="/static/cx.png"
          eventName="Codex Cryptum"
          apiEndpoint="/seats2" // API endpoint for Codex Cryptum
          totalSeats={200}
        />
      </div>
    </div>
  );
}

export default App;
