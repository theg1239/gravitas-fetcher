import React from 'react';
import EventCard from './components/EventCard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center space-y-8">
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
        totalSeats={200}
      />
    </div>
  );
}

export default App;