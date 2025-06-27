import React, { useEffect, useState } from "react";
import "./App.css";
import Board from "./components/Board";
import StatusBar from "./components/StatusBar";
import Controls from "./components/Controls";
import MoveHistory from "./components/MoveHistory";

/**
 * Game states for UI
 */
const EMPTY_BOARD = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

// --- Update this to point to backend API as appropriate ---
const API_BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

const defaultHistory = [
  { move: 0, location: [null, null], player: null, board: EMPTY_BOARD },
];

// PUBLIC_INTERFACE
function App() {
  // UI states
  const [theme, setTheme] = useState("light");
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [gameId, setGameId] = useState(null);
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [history, setHistory] = useState(defaultHistory);
  const [isOppoAI, setIsOppoAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  // Theming
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // --- Backend API calls ---
  // PUBLIC_INTERFACE
  async function startGame(opponent = isOppoAI ? "ai" : "human") {
    setLoading(true);
    setStatusMessage("Starting new game...");
    try {
      const resp = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponent }),
      });
      if (!resp.ok) throw new Error("Failed to start game");
      const data = await resp.json();
      setGameId(data.game_id);
      setBoard(data.board);
      setXIsNext(data.next_player === "X");
      setWinner(data.winner);
      setHistory([
        {
          move: 0,
          location: [null, null],
          player: null,
          board: data.board,
        },
      ]);
      setGameActive(true);
      setStatusMessage("Game started. X goes first!");
    } catch (e) {
      setStatusMessage(`Error: ${e.message}`);
      setGameActive(false);
    }
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  async function handleMove(row, col) {
    if (!gameActive || board[row][col]) return;
    setLoading(true);
    setStatusMessage("Submitting move...");
    try {
      const resp = await fetch(`${API_BASE}/game/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameId, row, col }),
      });
      if (!resp.ok) throw new Error("Invalid move");
      const data = await resp.json();
      setBoard(data.board);
      setXIsNext(data.next_player === "X");
      setWinner(data.winner);

      setHistory((prevHist) => [
        ...prevHist,
        {
          move: prevHist.length,
          location: [row, col],
          player: prevHist.length % 2 === 1 ? "O" : "X",
          board: data.board,
        },
      ]);
      if (data.winner) {
        setGameActive(false);
        setStatusMessage(
          data.winner === "draw"
            ? "It's a draw!"
            : `Winner: ${data.winner}`
        );
      } else {
        setStatusMessage(`Next turn: ${data.next_player}`);
      }
    } catch (e) {
      setStatusMessage(`Move failed: ${e.message}`);
    }
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  async function fetchGameState() {
    // Not used in MVP, but can poll for state restoration
    if (!gameId) return;
    try {
      const resp = await fetch(`${API_BASE}/game/state/${gameId}`);
      if (!resp.ok) throw new Error("Could not fetch game state");
      const data = await resp.json();
      setBoard(data.board);
      setXIsNext(data.next_player === "X");
      setWinner(data.winner);
      setGameActive(!data.winner);
      // Not updating move history for simplicity
    } catch (e) {
      setStatusMessage("Failed to sync state.");
    }
  }

  // PUBLIC_INTERFACE
  function handleNewGame() {
    startGame();
  }

  function handleOpponentSwitch() {
    setIsOppoAI((ai) => !ai);
  }

  function handleJumpTo(moveIdx) {
    // Restore board as per move history
    const snap = history[moveIdx];
    if (snap && snap.board) {
      setBoard(snap.board);
      setXIsNext(moveIdx % 2 === 0);
      setStatusMessage(
        snap.move === 0
          ? "At game start."
          : `Move #${snap.move}: ${snap.player} move.`
      );
    }
  }

  return (
    <div className="App">
      <header className="App-header" style={{ boxShadow: "0 2px 8px rgba(25, 118, 210, 0.05)" }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 className="ttt-title" style={{ color: "var(--primary-color, #1976d2)" }}>
          Tic Tac Toe
        </h1>
        <StatusBar status={statusMessage} />
        <Controls
          isOppoAI={isOppoAI}
          onToggleOpponent={handleOpponentSwitch}
          onNewGame={handleNewGame}
          gameActive={gameActive}
          loading={loading}
        />
        <section className="ttt-game-area">
          <Board
            board={board}
            onCellClick={handleMove}
            disabled={!gameActive || !!winner || loading}
          />
          <MoveHistory
            history={history}
            onJumpTo={handleJumpTo}
          />
        </section>
      </header>
    </div>
  );
}

export default App;
