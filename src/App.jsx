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

  // For SGF puzzle functionality
  const [sgfMoves, setSgfMoves] = useState([]); // Parsed moves from SGF
  const [currentSgfStep, setCurrentSgfStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext("2d");
    drawBoard(ctx, history[currentStep], hintMove);
  }, [history, currentStep, hintMove]);

  function createEmptyBoard() {
    const board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      board.push(new Array(BOARD_SIZE).fill(null));
    }
    return board;
  }

  function drawBoard(ctx, boardState, hint) {
    ctx.fillStyle = "#f7c87b";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = PADDING + i * CELL_SIZE;
      const y = PADDING + i * CELL_SIZE;

      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, y);
      ctx.stroke();
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const stone = boardState[r][c];
        if (stone) {
          drawStone(ctx, c, r, stone);
        }
      }
    }

    if (hint) {
      drawHint(ctx, hint.col, hint.row);
    }
  }

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

  function drawHint(ctx, col, row) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
    ctx.fill();
  }

  function handleClick(e) {
    const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
    placeStone(gridX, gridY);
  }

  function getGridCoords(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - PADDING;
    const y = clientY - rect.top - PADDING;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    return { gridX, gridY };
  }

  function placeStone(col, row) {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
    const currentBoard = history[currentStep];

    if (currentBoard[row][col] !== null) {
      setIllegalMoveMessage("Illegal move: Spot already occupied.");
      return;
    }

    const newBoard = currentBoard.map((r) => r.slice());
    newBoard[row][col] = currentPlayer;

    const opponent = currentPlayer === "B" ? "W" : "B";
    const opponentDeadGroups = findDeadGroups(newBoard, opponent);

    let stonesCaptured = 0;
    if (opponentDeadGroups.length > 0) {
      opponentDeadGroups.forEach((group) => {
        stonesCaptured += group.length;
        group.forEach(([r, c]) => {
          newBoard[r][c] = null;
        });
      });

      setCaptures((prevCaptures) => ({
        ...prevCaptures,
        [currentPlayer]: prevCaptures[currentPlayer] + stonesCaptured,
      }));
    }

    const myDeadGroups = findDeadGroups(newBoard, currentPlayer);
    if (myDeadGroups.some((group) => group.some(([r, c]) => r === row && c === col))) {
      setIllegalMoveMessage("Illegal move: Self capture not allowed.");
      return;
    }

    setHistory([...history.slice(0, currentStep + 1), newBoard]);
    setCurrentStep(currentStep + 1);
    setCurrentPlayer(currentPlayer === "B" ? "W" : "B");
    setIllegalMoveMessage("");
  }

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

  function parseSgfFile(content) {
    const moves = [];
    const lines = content.split(";");
    for (const line of lines) {
      if (line.startsWith("B[") || line.startsWith("W[")) {
        const color = line[0] === "B" ? "B" : "W";
        const coords = line.slice(2, 4);
        const col = coords.charCodeAt(0) - 97; // Convert SGF letter to column index
        const row = coords.charCodeAt(1) - 97; // Convert SGF letter to row index
        moves.push({ color, row, col });
      }
    }
    setSgfMoves(moves);
    setCurrentSgfStep(0);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => parseSgfFile(reader.result);
      reader.readAsText(file);
    }
  }

  function applySgfMove(step) {
    const newBoard = createEmptyBoard();
    for (let i = 0; i <= step; i++) {
      const { color, row, col } = sgfMoves[i];
      newBoard[row][col] = color;
    }
    setHistory([newBoard]);
    setCurrentStep(0);
  }

  function moveSgfBack() {
    if (currentSgfStep > 0) {
      setCurrentSgfStep(currentSgfStep - 1);
      applySgfMove(currentSgfStep - 1);
    }
  }

  function moveSgfForward() {
    if (currentSgfStep < sgfMoves.length - 1) {
      setCurrentSgfStep(currentSgfStep + 1);
      applySgfMove(currentSgfStep + 1);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div>
        <div>
          Current Player: {currentPlayer === "B" ? "Black" : "White"}
        </div>
        <div>Black Captures: {captures.B} | White Captures: {captures.W}</div>
        <canvas
          ref={canvasRef}
          style={{ border: "1px solid black", display: "block" }}
          onClick={handleClick}
        />
        <button onClick={moveBack} disabled={currentStep === 0}>
          Move Back
        </button>
        <button onClick={moveForward} disabled={currentStep === history.length - 1}>
          Move Forward
        </button>
        <button onClick={() => setHintMove({ row: 9, col: 9 })}>
          Hint
        </button>
      </div>
      <div style={{ marginLeft: "20px" }}>
        <label>
          Upload SGF File:
          <input type="file" onChange={handleFileUpload} />
        </label>
        <div>
          SGF Moves: {currentSgfStep + 1} / {sgfMoves.length}
        </div>
        <button onClick={moveSgfBack} disabled={currentSgfStep === 0}>
          Previous SGF Move
        </button>
        <button onClick={moveSgfForward} disabled={currentSgfStep >= sgfMoves.length - 1}>
          Next SGF Move
        </button>
      </div>
    </div>
  );
}

export default App;
