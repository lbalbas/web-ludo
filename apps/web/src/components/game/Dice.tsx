import { useState } from 'react';
import { useGame } from '../../context/GameContext';

export function Dice() {
  const { state, rollDice } = useGame();
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    // Simulate dice rolling animation delay
    setTimeout(() => {
      rollDice();
      setIsRolling(false);
    }, 500);
  };

  // Render a placeholder if no dice value, otherwise the value
  const displayValue = state.diceValue || '?';
  
  return (
    <button 
      onClick={handleRoll}
      disabled={isRolling}
      className={`w-full py-4 rounded-xl items-center justify-center flex gap-3 text-white font-bold text-lg shadow-lg border transition-all 
        ${isRolling ? 'bg-white/5 border-white/10 cursor-not-allowed cursor-wait' : 'bg-white/10 hover:bg-white/20 border-white/20 active:scale-95'}
      `}
    >
      <div className={`text-2xl ${isRolling ? 'animate-bounce' : ''}`}>🎲</div>
      <span>{isRolling ? 'Rolling...' : `Roll Dice (${displayValue})`}</span>
    </button>
  );
}
