import React, { useRef, useEffect, useState } from 'react';

const BOARD_SIZE = 19; // 19x19 board
const CELL_SIZE = 30; // Size of each cell
const PADDING = 40; // Padding around the board

function App() {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([createEmptyBoard()]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('B'); // 'B' for Black, 'W' for White
  const [illegalMoveMessage, setIllegalMoveMessage] = useState('');
  const [hintMove, setHintMove] = useState(null); // Hint for puzzle moves

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext('2d');
    drawBoard(ctx, history[currentStep], hintMove);
  }, [history, currentStep, hintMove]);

  function createEmptyBoard() {
    const arr = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      arr[i] = new Array(BOARD_SIZE).fill(null);
    }
    return arr;
  }

  function drawBoard(ctx, boardState, hint) {
    // Background
    ctx.fillStyle = '#f7c87b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Grid lines
    ctx.strokeStyle = '#000';
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

  function drawStone(ctx, col, row, color) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = color === 'B' ? '#000' : '#FFF';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }

  function drawHint(ctx, col, row) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // Light blue for hint
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
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return; // Out of bounds
    const currentBoard = history[currentStep];

    if (currentBoard[row][col] !== null) {
      setIllegalMoveMessage('Illegal move: Spot already occupied.');
      return; // Space is already occupied
    }

    const newBoard = currentBoard.map((r) => r.slice());
    newBoard[row][col] = currentPlayer;

    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newBoard);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setCurrentPlayer(currentPlayer === 'B' ? 'W' : 'B'); // Toggle player
    setIllegalMoveMessage('');
  }

  function moveBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIllegalMoveMessage('');
    }
  }

  function moveForward() {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      setIllegalMoveMessage('');
    }
  }

  function showHint() {
    // For now, we'll simulate the hint by providing a random empty position
    const currentBoard = history[currentStep];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (currentBoard[row][col] === null) {
          setHintMove({ col, row });
          return;
        }
      }
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}
      </div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', margin: '10px auto', display: 'block' }}
        onClick={handleClick}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={moveBack} disabled={currentStep === 0}>
          Move Back
        </button>
        <button onClick={moveForward} disabled={currentStep === history.length - 1}>
          Move Forward
        </button>
        <button onClick={showHint}>Hint</button>
      </div>
      {illegalMoveMessage && (
        <div style={{ marginTop: '10px', color: 'red' }}>
          {illegalMoveMessage}
        </div>
      )}
    </div>
  );
}

export default App;
