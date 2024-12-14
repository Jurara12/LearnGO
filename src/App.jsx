import React, { useRef, useEffect, useState } from 'react';

const BOARD_SIZE = 19; // 19x19 board
const CELL_SIZE = 30; // Size of each cell
const PADDING = 40; // Padding around the board

function App() {
  const canvasRef = useRef(null);

  // State management
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('B'); // 'B' for Black, 'W' for White
  const [illegalMoveMessage, setIllegalMoveMessage] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext('2d');
    drawBoard(ctx, board);
  }, [board]);

  // Helper function to create an empty 19x19 board
  function createEmptyBoard() {
    const arr = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      arr[i] = new Array(BOARD_SIZE).fill(null);
    }
    return arr;
  }

  // Function to draw the board and stones
  function drawBoard(ctx, boardState) {
    // Draw background
    ctx.fillStyle = '#f7c87b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw grid lines
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

    // Draw coordinates
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
  }

  // Function to draw a stone
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

  // Function to handle click events
  function handleClick(e) {
    const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
    placeStone(gridX, gridY);
  }

  // Function to handle touch events
  function handleTouch(e) {
    const touch = e.touches[0];
    if (touch) {
      const { gridX, gridY } = getGridCoords(touch.clientX, touch.clientY);
      placeStone(gridX, gridY);
    }
  }

  // Get grid coordinates from mouse/touch events
  function getGridCoords(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - PADDING;
    const y = clientY - rect.top - PADDING;
    const gridX = Math.round(x / CELL_SIZE);
    const gridY = Math.round(y / CELL_SIZE);
    return { gridX, gridY };
  }

  // Place a stone on the board
  function placeStone(col, row) {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return; // Out of bounds
    if (board[row][col] !== null) return; // Space is already occupied

    // Create a new board with the stone placed
    const newBoard = board.map((r) => r.slice());
    newBoard[row][col] = currentPlayer;

    // Check for suicides or invalid moves
    const isSuicide = checkSuicide(newBoard, row, col, currentPlayer);
    if (isSuicide) {
      setIllegalMoveMessage('Illegal move, not allowed.');
      return;
    }

    // Update the board and switch players
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'B' ? 'W' : 'B');
    setIllegalMoveMessage(''); // Clear any previous illegal move messages
  }

  // Check if a move is a suicide
  function checkSuicide(boardState, row, col, color) {
    const liberties = getLiberties(boardState, row, col, color);
    return liberties.length === 0;
  }

  // Get liberties for a stone
  function getLiberties(boardState, row, col, color) {
    const visited = new Set();
    const stack = [[row, col]];
    const liberties = [];

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        if (boardState[nr][nc] === null) {
          liberties.push([nr, nc]);
        } else if (boardState[nr][nc] === color) {
          stack.push([nr, nc]);
        }
      }
    }

    return liberties;
  }

  // Get neighboring intersections
  function getNeighbors(r, c) {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    return deltas
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE);
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}
      </div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block', margin: '0 auto' }}
        onClick={handleClick}
        onTouchStart={handleTouch}
      />
      {illegalMoveMessage && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {illegalMoveMessage}
        </div>
      )}
    </div>
  );
}

export default App;
