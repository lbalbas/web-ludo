import { useState } from 'react';
import { useGame } from '../../hooks/useGame';

export function Dice() {
  const { state, isMyTurn, rollDice } = useGame();
  const [isRolling, setIsRolling] = useState(false);

  const canRoll = isMyTurn && state.diceValue === null;

  const handleRoll = () => {
    if (isRolling || !canRoll) return;
    setIsRolling(true);
    
    // Simulate dice rolling animation delay
    setTimeout(() => {
      rollDice();
      setIsRolling(false);
    }, 500);
  };

  // Render a placeholder if no dice value, otherwise the value
  const displayValue = state.diceValue || '?';
  const isDisabled = isRolling || !canRoll;
  
  return (
    <button 
      onClick={handleRoll}
      disabled={isDisabled}
      className={`w-full py-4 rounded-xl items-center justify-center flex gap-3 text-white font-bold text-lg shadow-lg border transition-all 
        ${isDisabled ? 'bg-white/5 border-white/10 cursor-not-allowed opacity-50' : 'bg-white/10 hover:bg-white/20 border-white/20 active:scale-95'}
      `}
    >
      <div className={`text-2xl ${isRolling ? 'animate-bounce' : ''}`}>🎲</div>
      <span>
        {isRolling
          ? 'Rolling...'
          : !isMyTurn
            ? 'Not your turn'
            : state.diceValue !== null
              ? `Rolled: ${displayValue}`
              : `Roll Dice`}
      </span>
    </button>
  );
}
