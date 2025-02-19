import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

const ConfettiEasterEgg = () => {
  const [, setTypedWord] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const secretWord = 'ROXY';

  useEffect(() => {
    const handleKeyDown = (event) => {
      setTypedWord((currentWord) => {
        const newWord = currentWord + event.key;
        if (newWord.toLowerCase().includes(secretWord.toLowerCase())) {
          setShowConfetti(true);
          setTimeout(() => {
            setTypedWord('');
            setShowConfetti(false);
          }, 5000); 
          return '';
        } else {
          return newWord;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); 

  return (
    <>
      {showConfetti && <Confetti />}
    
    </>
  );
};

export default ConfettiEasterEgg;