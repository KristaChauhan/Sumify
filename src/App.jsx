import Demo from "./components/Demo";
import Hero from "./components/Hero";

import "./App.css";
const Stars = () => {
  return (
    <div className="stars">
      {Array.from({ length: 120 }).map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};
const App = () => {
  return (
    <main className="relative w-full h-full overflow-visible">

      {/*Stars background */}
      <Stars />

      {/* Galaxy background */}
      <div className="main">
        <div className="gradient" />
      </div>

      {/* Foreground content */}
      <div className="app">
        <Hero />
        <Demo />
      </div>

    </main>
  );
};
export default App;

