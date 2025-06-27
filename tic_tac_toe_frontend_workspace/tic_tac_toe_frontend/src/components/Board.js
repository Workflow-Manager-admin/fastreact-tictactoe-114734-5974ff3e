import React from "react";

// PUBLIC_INTERFACE
function Board({ board, onCellClick, disabled }) {
  /** This is the Tic Tac Toe board component.
   * @param {Array} board - 2D array representing the game board ('X', 'O', or null).
   * @param {Function} onCellClick - Handler for cell click events.
   * @param {boolean} disabled - Whether all cells are disabled.
   */
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {board.map((row, rowIndex) =>
        <div key={rowIndex} className="ttt-row" role="row">
          {row.map((cell, colIndex) =>
            <button
              key={colIndex}
              className="ttt-cell"
              aria-label={`cell ${rowIndex * 3 + colIndex + 1}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              disabled={!!cell || disabled}
              tabIndex={0}
            >
              {cell}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Board;
