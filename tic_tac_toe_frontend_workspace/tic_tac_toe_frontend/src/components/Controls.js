import React from "react";

// PUBLIC_INTERFACE
function Controls({
  isOppoAI,
  onToggleOpponent,
  onNewGame,
  gameActive,
  loading,
}) {
  /** Renders control buttons: new game, change opponent type.
   * @param {boolean} isOppoAI - True if opponent is AI, false if human.
   * @param {Function} onToggleOpponent - Handler to toggle opponent type.
   * @param {Function} onNewGame - Start new game handler.
   * @param {boolean} gameActive - Whether a game is currently running.
   * @param {boolean} loading - Block controls during API actions.
   */
  return (
    <div className="ttt-controls">
      <button
        className="ttt-btn accent"
        onClick={onNewGame}
        disabled={loading}
        aria-label="Start a new game"
      >
        {gameActive ? "Restart Game" : "New Game"}
      </button>
      <button
        className="ttt-btn"
        onClick={onToggleOpponent}
        disabled={loading || gameActive}
        aria-label="Switch opponent"
      >
        Opponent: {isOppoAI ? "AI" : "Human"}
      </button>
    </div>
  );
}

export default Controls;
