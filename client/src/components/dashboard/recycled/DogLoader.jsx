import PropTypes from "prop-types";
import { useEffect, useState } from "react";

const DogLoader = ({ duration = 3000 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = duration / 3; // Divide the duration into 3 parts
    const timer1 = setTimeout(() => setProgress(20), interval);
    const timer2 = setTimeout(() => setProgress(60), interval * 2);
    const timer3 = setTimeout(() => setProgress(100), duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [duration]);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 m-auto h-64 w-64 animate-[bounce_0.25s_infinite_alternate]">
        {/* Dog Belly */}
        <div className="absolute h-52 w-14 left-24 bg-primary-pink rotate-90 rounded-3xl animate-[bellymove_0.25s_infinite_alternate] z-20"></div>

        {/* Dog Head */}
        <div className="absolute h-24 w-14 left-[172.5px] top-6 rounded-3xl bg-primary-pink animate-[headbob_0.5s_infinite_alternate_ease-in-out] origin-bottom">
          {/* Eye */}
          <div className="absolute h-4 w-4 left-8 top-2.5 bg-white rounded-full z-10 overflow-hidden">
            <div className="h-3 w-3 bg-[#be4d85] rounded-full translate-x-1"></div>
          </div>

          {/* Nose */}
          <div className="absolute w-16 h-6 top-5 left-4 bg-primary-pink rounded-br-2xl"></div>

          {/* Nose Spot */}
          <div className="absolute left-[67.5px] top-4 w-3 h-3 bg-[#be4d85] rounded-full"></div>

          {/* Right Ear */}
          <div className="absolute h-10 w-8 -left-2.5 bg-[#be4d85] rounded-2xl animate-[earflop_0.25s_infinite_alternate]"></div>
        </div>

        {/* Front Right Leg */}
        <div className="absolute h-10 w-4 bg-primary-pink top-[117.5px] left-[190px] rounded-3xl z-10 animate-[legmoveFront_0.5s_infinite_alternate_ease-in-out]"></div>

        {/* Front Left Leg */}
        <div className="absolute h-10 w-4 bg-primary-pink top-[117.5px] left-[50px] rounded-3xl animate-[legmoveBack_0.5s_infinite_alternate_ease-in-out]"></div>

        {/* Back Left Leg */}
        <div className="absolute h-10 w-4 bg-[#be4d85] top-[117.5px] left-[50px] rounded-3xl animate-[legmoveFront_0.5s_infinite_alternate_ease-in-out] z-0"></div>

        {/* Back Right Leg */}
        <div className="absolute h-10 w-4 bg-[#be4d85] top-[117.5px] left-[190px] rounded-3xl animate-[legmoveBack_0.5s_infinite_alternate_ease-in-out] z-0"></div>

        {/* Tail */}
        <div className="absolute top-20 left-1 h-4 bg-primary-pink rounded-3xl animate-[tailwag_0.25s_infinite_alternate_ease-in-out] origin-right"></div>
      </div>

      <div className="mt-28">
        <p className="text-primary-pink">
          Veuillez patienter, on a perdu vos chiens... (mais on les cherche !)
        </p>
        <div className="w-[400px] bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-pink h-full rounded-full"
            style={{ width: `${progress}%`, transition: "width 0.5s ease-in-out" }}
          ></div>
        </div>
      </div>

      <style>{`
        :root {
          --primary-pink: #e91e63;
        }

        @keyframes bellymove {
          from {
            width: 50px;
          }
          to {
            width: 53.5px;
          }
        }

        @keyframes headbob {
          0% {
            transform: rotate(2deg);
          }
          100% {
            transform: rotate(-2deg);
          }
        }

        @keyframes legmoveFront {
          0% {
            transform: rotate(15deg) translateX(-2px);
          }
          50% {
            transform: translateY(-4px);
          }
          100% {
            transform: rotate(-15deg) translateX(2px);
          }
        }

        @keyframes legmoveBack {
          0% {
            transform: rotate(-15deg) translateX(2px);
          }
          50% {
            transform: translateY(-4px);
          }
          100% {
            transform: rotate(15deg) translateX(-2px);
          }
        }

        @keyframes tailwag {
          from {
            width: 40px;
            transform: rotate(25deg);
          }
          to {
            width: 38px;
            transform: rotate(12.5deg);
          }
        }

        @keyframes earflop {
          from {
            transform: rotate(60deg);
          }
          to {
            transform: rotate(45deg);
          }
        }

        @keyframes bounce {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </div>
  );
};

DogLoader.propTypes = {
  duration: PropTypes.number, // Duration in milliseconds
};

export default DogLoader;