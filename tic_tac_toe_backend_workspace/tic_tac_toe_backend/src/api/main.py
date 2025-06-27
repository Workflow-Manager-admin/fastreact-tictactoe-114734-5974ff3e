from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Literal
import uuid

# ============ Data Models ============


class GameStartRequest(BaseModel):
    mode: Literal['pvp', 'ai'] = Field(
        ...,
        description="Game mode: 'pvp' (Player vs Player) or 'ai' (Player vs AI)"
    )


class GameStartResponse(BaseModel):
    game_id: str
    board: List[List[Optional[str]]]
    next_player: str
    mode: str


class MoveRequest(BaseModel):
    player: Literal['X', 'O'] = Field(
        ...,
        description='Player symbol: X or O'
    )
    row: int = Field(..., ge=0, le=2)
    col: int = Field(..., ge=0, le=2)


class MoveResponse(BaseModel):
    board: List[List[Optional[str]]]
    next_player: Optional[str]
    winner: Optional[str]
    draw: bool
    history: List[Dict]


class GameStateResponse(BaseModel):
    game_id: str
    board: List[List[Optional[str]]]
    next_player: Optional[str]
    winner: Optional[str]
    draw: bool
    mode: str
    history: List[Dict]


class SessionResponse(BaseModel):
    session_id: str


# ============ In-Memory Storage (for prototype/demo) ============


SESSIONS: Dict[str, Dict] = {}  # session_id -> {games: [game_ids]}
GAMES: Dict[str, Dict] = {}     # game_id -> game data


def new_board():
    return [[None, None, None], [None, None, None], [None, None, None]]


def check_winner(board):
    # Rows, columns, diagonals
    for i in range(3):
        if board[i][0] and all(board[i][j] == board[i][0] for j in range(3)):
            return board[i][0]
        if board[0][i] and all(board[j][i] == board[0][i] for j in range(3)):
            return board[0][i]
    # Diagonals
    if board[0][0] and all(board[k][k] == board[0][0] for k in range(3)):
        return board[0][0]
    if board[0][2] and all(board[k][2 - k] == board[0][2] for k in range(3)):
        return board[0][2]
    return None


def is_draw(board):
    return all(cell for row in board for cell in row) and not check_winner(board)


def ai_move(board, ai_symbol):
    # Simple: choose first empty cell (can be improved for real AI)
    for r in range(3):
        for c in range(3):
            if not board[r][c]:
                board[r][c] = ai_symbol
                return r, c
    return None, None


# ============ FastAPI App ============


app = FastAPI(
    title="Tic Tac Toe API",
    description=(
        "FastAPI backend for web-based Tic Tac Toe. Provides endpoints to start games, "
        "make moves, retrieve state, and manage sessions."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "games", "description": "Manage Tic Tac Toe games."},
        {"name": "sessions", "description": "Session creation and management."}
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def health_check():
    """Health check root endpoint."""
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.post(
    "/api/session",
    response_model=SessionResponse,
    tags=["sessions"],
    summary="Create new session"
)
def create_session():
    """
    Create a new user session.
    Returns a session_id to associate with client requests.
    """
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {"games": []}
    return {"session_id": session_id}


# PUBLIC_INTERFACE
@app.post(
    "/api/game/start",
    response_model=GameStartResponse,
    tags=["games"],
    summary="Start new game"
)
def start_game(
    request: GameStartRequest = Body(...),
    session_id: Optional[str] = None
):
    """
    Start a new Tic Tac Toe game.
    - 'mode': 'pvp' for player vs player, 'ai' for player vs computer.
    Returns initial game state and ID.
    """
    game_id = str(uuid.uuid4())
    board = new_board()
    mode = request.mode
    state = {
        "game_id": game_id,
        "board": board,
        "next_player": "X",  # X always starts
        "winner": None,
        "draw": False,
        "mode": mode,
        "history": [],
    }
    GAMES[game_id] = state
    if session_id and session_id in SESSIONS:
        SESSIONS[session_id]["games"].append(game_id)
    return GameStartResponse(
        game_id=game_id,
        board=state["board"],
        next_player=state["next_player"],
        mode=state["mode"]
    )


# PUBLIC_INTERFACE
@app.post(
    "/api/game/{game_id}/move",
    response_model=MoveResponse,
    tags=["games"],
    summary="Make a move"
)
def make_move(game_id: str, move: MoveRequest):
    """
    Make a move in the specified game (by ID).
    Validates turn, checks win condition, supports AI move in 'ai' mode.
    Returns updated game state.
    """
    game = GAMES.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game["winner"] or game["draw"]:
        raise HTTPException(status_code=400, detail="Game is already finished.")

    player = move.player
    row, col = move.row, move.col
    board = game["board"]

    # Turn order validation
    if player != game["next_player"]:
        raise HTTPException(
            status_code=400,
            detail=f"It's {game['next_player']}'s turn."
        )

    # Valid move?
    if board[row][col] is not None:
        raise HTTPException(status_code=400, detail="Cell already taken.")

    # Make move
    board[row][col] = player
    game["history"].append({"player": player, "row": row, "col": col})

    winner = check_winner(board)
    draw = is_draw(board)
    next_player = None if winner or draw else ("O" if player == "X" else "X")

    # If AI mode, make AI's move if game is not over and it's AI's turn
    if game["mode"] == "ai" and not winner and not draw and next_player == "O":
        ai_r, ai_c = ai_move(board, "O")
        if ai_r is not None:
            game["history"].append({"player": "O", "row": ai_r, "col": ai_c})
            winner = check_winner(board)
            draw = is_draw(board)
            next_player = None if winner or draw else "X"

    game["winner"] = winner
    game["draw"] = draw
    game["next_player"] = next_player

    return MoveResponse(
        board=board,
        next_player=next_player,
        winner=winner,
        draw=draw,
        history=game["history"]
    )


# PUBLIC_INTERFACE
@app.get(
    "/api/game/{game_id}/state",
    response_model=GameStateResponse,
    tags=["games"],
    summary="Get game state"
)
def get_game_state(game_id: str):
    """
    Retrieve the current state of a game (by ID).
    Returns board, whose turn, winner, and move history.
    """
    game = GAMES.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return GameStateResponse(
        game_id=game["game_id"],
        board=game["board"],
        next_player=game["next_player"],
        winner=game["winner"],
        draw=game["draw"],
        mode=game["mode"],
        history=game["history"]
    )
