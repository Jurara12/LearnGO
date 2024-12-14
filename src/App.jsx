import React, { useRef, useEffect, useState } from "react";

const BOARD_SIZE = 19; // 19x19 board
const CELL_SIZE = 30; // Size of each cell
const PADDING = 40; // Padding around the board

function App() {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([createEmptyBoard()]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState("B"); // 'B' for Black, 'W' for White
  const [illegalMoveMessage, setIllegalMoveMessage] = useState("");
  const [hintMove, setHintMove] = useState(null); // Hint for puzzle moves
  const [captures, setCaptures] = useState({ B: 0, W: 0 }); // Capture counters

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext("2d");
    drawBoard(ctx, history[currentStep], hintMove);
  }, [history, currentStep, hintMove]);

  // Create an empty board
  function createEmptyBoard() {
    const board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      board.push(new Array(BOARD_SIZE).fill(null));
    }
    return board;
  }

  // Draw the board
  function drawBoard(ctx, boardState, hint) {
    // Background
    ctx.fillStyle = "#f7c87b";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Grid lines
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = PADDING + i * CELL_SIZE;
      const y = PADDING + i * CELL_SIZE;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, y);
      ctx.stroke();
    }

    // Draw stones
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const stone = boardState[r][c];
        if (stone) {
          drawStone(ctx, c, r, stone);
        }
      }
    }

    // Draw hint if available
    if (hint) {
      drawHint(ctx, hint.col, hint.row);
    }
  }

  // Draw a stone
  function drawStone(ctx, col, row, color) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = color === "B" ? "#000" : "#FFF";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }

  // Draw a hint
  function drawHint(ctx, col, row) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(0, 0, 255, 0.3)"; // Light blue for hint
    ctx.fill();
  }

  // Handle clicking on the board
  function handleClick(e) {
    const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
    placeStone(gridX, gridY);
  }

  // Convert screen coordinates to grid coordinates
  function getGridCoords(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - PADDING;
    const y = clientY - rect.top - PADDING;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    return { gridX, gridY };
  }

  // Place a stone on the board
  function placeStone(col, row) {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return; // Out of bounds
    const currentBoard = history[currentStep];

    if (currentBoard[row][col] !== null) {
      setIllegalMoveMessage("Illegal move: Spot already occupied.");
      return; // Space is already occupied
    }

    const newBoard = currentBoard.map((r) => r.slice());
    newBoard[row][col] = currentPlayer;

    // Remove captured opponent stones
    const opponent = currentPlayer === "B" ? "W" : "B";
    const opponentDeadGroups = findDeadGroups(newBoard, opponent);

    let stonesCaptured = 0; // Count captured stones
    if (opponentDeadGroups.length > 0) {
      opponentDeadGroups.forEach((group) => {
        stonesCaptured += group.length;
        group.forEach(([r, c]) => {
          newBoard[r][c] = null;
        });
      });

      // Update capture counter
      setCaptures((prevCaptures) => ({
        ...prevCaptures,
        [currentPlayer]: prevCaptures[currentPlayer] + stonesCaptured,
      }));
    }

    // Check for suicide
    const myDeadGroups = findDeadGroups(newBoard, currentPlayer);
    if (myDeadGroups.some((group) => group.some(([r, c]) => r === row && c === col))) {
      setIllegalMoveMessage("Illegal move: Self capture not allowed.");
      return;
    }

    // Update board and history
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newBoard);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setCurrentPlayer(opponent); // Switch player
    setIllegalMoveMessage("");
  }

  // Find dead groups of stones
  function findDeadGroups(board, color) {
    const visited = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(false)
    );
    const deadGroups = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!visited[r][c] && board[r][c] === color) {
          const { group, liberties } = getGroupAndLiberties(board, r, c, color, visited);
          if (liberties.length === 0) {
            deadGroups.push(group);
          }
        }
      }
    }
    return deadGroups;
  }

  // Get group and liberties for a stone
  function getGroupAndLiberties(board, row, col, color, visited) {
    const stack = [[row, col]];
    const group = [];
    const liberties = [];
    visited[row][col] = true;

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      group.push([r, c]);

      const neighbors = getNeighbors(r, c);
      neighbors.forEach(([nr, nc]) => {
        if (board[nr][nc] === null && !liberties.some(([lr, lc]) => lr === nr && lc === nc)) {
          liberties.push([nr, nc]);
        } else if (board[nr][nc] === color && !visited[nr][nc]) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      });
    }

    return { group, liberties };
  }

  // Get neighbors of a cell
  function getNeighbors(r, c) {
    const deltas = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    return deltas
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE);
  }

  // Move back in history
  function moveBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIllegalMoveMessage("");
    }
  }

  // Move forward in history
  function moveForward() {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      setIllegalMoveMessage("");
    }
  }

  // Add logic for hint
  function showHint() {
    setHintMove({ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) });

    // Set a timeout to remove the hint after 3 seconds
    setTimeout(() => {
      setHintMove(null);
    }, 3000);
  }

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <div style={{ marginBottom: "10px" }}>
        Current Player: {currentPlayer === "B" ? "Black" : "White"}
      </div>
      <div style={{ marginBottom: "10px" }}>
        Black Captures: {captures.B} | White Captures: {captures.W}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid black",
          margin: "10px auto",
          display: "block",
        }}
        onClick={handleClick}
      />
      <div style={{ marginTop: "10px" }}>
        <button onClick={moveBack} disabled={currentStep === 0}>
          Move Back
        </button>
        <button onClick={moveForward} disabled={currentStep === history.length - 1}>
          Move Forward
        </button>
        <button onClick={showHint}>Hint</button>
      </div>
      {illegalMoveMessage && (
        <div style={{ marginTop: "10px", color: "red" }}>{illegalMoveMessage}</div>
      )}
    </div>
  );
}

export default App;
