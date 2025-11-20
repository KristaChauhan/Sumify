import Demo from "./components/Demo";
import Hero from "./components/Hero";

import "./App.css";

const App = () => {
  return (
    <main>
      {/* Stars background */}
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <div className="main">
        <div className="gradient" />
      </div>

      <div className="app">
        <Hero />
        <Demo />
      </div>
    </main>
  );
};

export default App;

