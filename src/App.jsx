import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios'; // Import Axios for API calls

const BOARD_SIZE = 19;
const CELL_SIZE = 30;
const PADDING = 40;

function App() {
  const canvasRef = useRef(null);

  // Game history: array of { board, currentPlayer }
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [illegalMoveMessage, setIllegalMoveMessage] = useState('');
  const [puzzleTitle, setPuzzleTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentBoard = history[currentStep]?.board || createEmptyBoard();
  const currentPlayer = history[currentStep]?.currentPlayer || 'B';

  // Fetch puzzle data from the backend
  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:4000/puzzles/1') // Replace localhost with your backend URL if hosted remotely
      .then((response) => {
        const puzzle = response.data;

        // Initialize board with the puzzle's initial position
        const initialBoard = createEmptyBoard();
        puzzle.initial_position.B.forEach((coord) => {
          const [col, row] = parseSGFCoordinate(coord);
          initialBoard[row][col] = 'B';
        });
        puzzle.initial_position.W.forEach((coord) => {
          const [col, row] = parseSGFCoordinate(coord);
          initialBoard[row][col] = 'W';
        });

        // Set initial history
        setHistory([{ board: initialBoard, currentPlayer: 'B' }]);
        setPuzzleTitle(puzzle.title || 'Untitled Puzzle');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching puzzle:', err);
        setError('Failed to load puzzle');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext('2d');
    drawBoard(ctx, currentBoard);
  }, [currentBoard]);

  function createEmptyBoard() {
    const arr = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      arr[i] = new Array(BOARD_SIZE).fill(null);
    }
    return arr;
  }

  function parseSGFCoordinate(sgfCoord) {
    const columns = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
    const col = columns.indexOf(sgfCoord[0].toUpperCase());
    const row = BOARD_SIZE - parseInt(sgfCoord.slice(1), 10);
    return [col, row];
  }

  function drawBoard(ctx, boardState) {
    // Background
    ctx.fillStyle = '#f7c87b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Grid lines
    for (let i = 0; i < BOARD_SIZE; i++) {
      const x = PADDING + i * CELL_SIZE;
      const y = PADDING + i * CELL_SIZE;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, y);
      ctx.stroke();
    }

    // Coordinates
    const columns = 'ABCDEFGHIJKLMNOPQRST'.split('');
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letters top/bottom
    for (let i = 0; i < BOARD_SIZE; i++) {
      const letter = columns[i];
      const x = PADDING + i * CELL_SIZE;
      // top
      ctx.fillText(letter, x, PADDING - 20);
      // bottom
      ctx.fillText(letter, x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20);
    }

    // Numbers left/right
    for (let i = 0; i < BOARD_SIZE; i++) {
      const number = BOARD_SIZE - i;
      const y = PADDING + i * CELL_SIZE;

      ctx.textAlign = 'right';
      ctx.fillText(number, PADDING - 20, y);

      ctx.textAlign = 'left';
      ctx.fillText(number, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20, y);
    }

    // Stones
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const stone = boardState[r][c];
        if (stone) {
          drawStone(ctx, c, r, stone);
        }
      }
    }
  }

  function drawStone(ctx, col, row, color) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = (color === 'B') ? '#000000' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', width: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h1>{puzzleTitle}</h1>
      <div style={{ height: '30px', lineHeight: '30px', marginBottom: '10px' }}>
        Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}
      </div>

      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block', margin: '0 auto' }}
      />

      <div style={{ marginTop: '10px' }}>
        <button onClick={moveBack} disabled={currentStep === 0}>Move Back</button>
        <button onClick={moveForward} disabled={currentStep === history.length - 1}>Move Forward</button>
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
