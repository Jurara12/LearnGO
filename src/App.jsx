import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios'; // For fetching puzzle data

const BOARD_SIZE = 19; // 19x19 board
const CELL_SIZE = 30; // Size of each cell
const PADDING = 40; // Padding around the board

function App() {
  const canvasRef = useRef(null);

  // Game state
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('B'); // 'B' for Black, 'W' for White
  const [illegalMoveMessage, setIllegalMoveMessage] = useState('');
  const [history, setHistory] = useState([{ board: createEmptyBoard(), currentPlayer: 'B' }]);
  const [currentStep, setCurrentStep] = useState(0);

  // Puzzle state
  const [puzzle, setPuzzle] = useState(null); // Puzzle data from server
  const [puzzleHint, setPuzzleHint] = useState(null); // Coordinates of the next move hint

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext('2d');
    drawBoard(ctx, board, puzzleHint);
  }, [board, puzzleHint]);

  // Load puzzle data on component mount
  useEffect(() => {
    fetchPuzzle();
  }, []);

  function createEmptyBoard() {
    const arr = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      arr[i] = new Array(BOARD_SIZE).fill(null);
    }
    return arr;
  }

  function fetchPuzzle() {
    axios
      .get('/puzzles/random') // Assuming the backend serves a random puzzle
      .then((response) => {
        const puzzleData = response.data;
        setPuzzle(puzzleData);

        // Apply initial puzzle state
        const newBoard = createEmptyBoard();
        puzzleData.initialPosition.B.forEach(([row, col]) => {
          newBoard[row][col] = 'B';
        });
        puzzleData.initialPosition.W.forEach(([row, col]) => {
          newBoard[row][col] = 'W';
        });
        setBoard(newBoard);
        setHistory([{ board: newBoard, currentPlayer: 'B' }]); // Reset history
        setCurrentStep(0);
      })
      .catch((error) => {
        console.error('Failed to load puzzle:', error);
      });
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
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();
    }

    // Coordinates
    const columns = 'ABCDEFGHIJKLMNOPQRST'.split('');
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letters at top and bottom
    for (let i = 0; i < BOARD_SIZE; i++) {
      const letter = columns[i];
      const x = PADDING + i * CELL_SIZE;
      ctx.fillText(letter, x, PADDING - 20); // Top
      ctx.fillText(letter, x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20); // Bottom
    }

    // Numbers at left and right
    for (let i = 0; i < BOARD_SIZE; i++) {
      const number = BOARD_SIZE - i;
      const y = PADDING + i * CELL_SIZE;
      ctx.fillText(number, PADDING - 20, y); // Left
      ctx.fillText(number, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20, y); // Right
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

    // Highlight hint if available
    if (hint) {
      const [hintRow, hintCol] = hint;
      drawHint(ctx, hintCol, hintRow);
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
    ctx.arc(x, y, CELL_SIZE / 2 - 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(135, 206, 250, 0.6)'; // Light blue color
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
    const gridX = Math.round(x / CELL_SIZE);
    const gridY = Math.round(y / CELL_SIZE);
    return { gridX, gridY };
  }

  function placeStone(col, row) {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return; // Out of bounds
    if (board[row][col] !== null) return; // Space is already occupied

    const newBoard = board.map((r) => r.slice());
    newBoard[row][col] = currentPlayer;

    setBoard(newBoard);
    setHistory([...history.slice(0, currentStep + 1), { board: newBoard, currentPlayer }]);
    setCurrentStep(currentStep + 1);
    setCurrentPlayer(currentPlayer === 'B' ? 'W' : 'B');
    setIllegalMoveMessage('');
  }

  function handleHint() {
    if (puzzle && puzzle.solutionLines && puzzle.solutionLines.length > currentStep) {
      const nextMove = puzzle.solutionLines[currentStep];
      setPuzzleHint(nextMove.move); // Highlight the next move
    }
  }

  function moveBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const previousBoard = history[currentStep - 1].board;
      setBoard(previousBoard);
      setIllegalMoveMessage('');
    }
  }

  function moveForward() {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextBoard = history[currentStep + 1].board;
      setBoard(nextBoard);
      setIllegalMoveMessage('');
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <div>Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}</div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', margin: '10px auto', display: 'block' }}
        onClick={handleClick}
      />
      <div>
        <button onClick={moveBack} disabled={currentStep === 0}>
          Move Back
        </button>
        <button onClick={moveForward} disabled={currentStep >= history.length - 1}>
          Move Forward
        </button>
        <button onClick={handleHint}>Hint</button>
      </div>
      {illegalMoveMessage && <div style={{ color: 'red' }}>{illegalMoveMessage}</div>}
    </div>
  );
}

export default App;
