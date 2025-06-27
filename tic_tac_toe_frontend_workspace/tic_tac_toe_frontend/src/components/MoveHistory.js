import React from "react";

// PUBLIC_INTERFACE
function MoveHistory({ history, onJumpTo }) {
  /** Shows a history of moves in the game.
   * @param {Array} history - List of moves [{move, location, player}...].
   * @param {Function} onJumpTo - Handler to jump to a particular move.
   */
  return (
    <div className="ttt-history">
      <div className="ttt-history-title">Move History</div>
      <ul>
        {history.map((item, idx) => (
          <li key={idx}>
            <button className="ttt-history-btn" onClick={() => onJumpTo(idx)}>
              {item.move === 0
                ? "Game start"
                : `#${item.move}: ${
                    item.player
                  } at (${item.location[0] + 1}, ${item.location[1] + 1})`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MoveHistory;
