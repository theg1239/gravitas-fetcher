import React from 'react';
import EventCard from './components/EventCard';

function App() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black">
      <div className="space-y-8">
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
    </div>
  );
}

export default App;
