import { logo } from "../assets";

const Hero = () => {
  return (
    <header className="w-full flex justify-center items-center flex-col">
      <nav className="flex justify-between items-center w-full mb-10 pt-3">
      </nav>

      <h1 className="head_text">
        Summarize Articles With <br className="max-md:hidden" />
        <span className="orange_gradient">Sumify</span>
      </h1>
      <h2 className="desc">
       "Cut through the noise with Sumify. 
       Transform information overload into crystal-clear brevity in seconds
      </h2>
    </header>
  );
};

export default Hero;
