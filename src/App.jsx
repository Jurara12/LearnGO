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

  // For SGF file parsing
  const [sgfMoves, setSgfMoves] = useState([]);
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

    setHistory([...history.slice(0, currentStep + 1), newBoard]);
    setCurrentStep(currentStep + 1);
    setCurrentPlayer(currentPlayer === "B" ? "W" : "B");
    setIllegalMoveMessage("");
  }

  function moveBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIllegalMoveMessage("");
    }
  }

  function moveForward() {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      setIllegalMoveMessage("");
    }
  }

  function parseSgfFile(content) {
    const moves = [];
    const lines = content.split(";");
    for (const line of lines) {
      if (line.startsWith("B[") || line.startsWith("W[")) {
        const move = {
          color: line[0],
          coords: line.slice(2, 4),
        };
        moves.push(move);
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

  function moveSgfBack() {
    if (currentSgfStep > 0) {
      setCurrentSgfStep(currentSgfStep - 1);
    }
  }

  function moveSgfForward() {
    if (currentSgfStep < sgfMoves.length - 1) {
      setCurrentSgfStep(currentSgfStep + 1);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div>
        <div>
          Current Player: {currentPlayer === "B" ? "Black" : "White"}
        </div>
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
      </div>
      <div style={{ marginLeft: "20px" }}>
        <button>
          <input type="file" onChange={handleFileUpload} />
        </button>
        <div>
          SGF Moves: {currentSgfStep} / {sgfMoves.length}
        </div>
        <button onClick={moveSgfBack} disabled={currentSgfStep === 0}>
          Previous SGF Move
        </button>
        <button onClick={moveSgfForward} disabled={currentSgfStep === sgfMoves.length - 1}>
          Next SGF Move
        </button>
      </div>
    </div>
  );
}

export default App;
