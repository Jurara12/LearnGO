import React, { useRef, useEffect, useState } from 'react';

const BOARD_SIZE = 19;
const CELL_SIZE = 30;
const PADDING = 40;

function App() {
  const canvasRef = useRef(null);

  // Board state: 2D array of 'B', 'W', or null
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('B'); // 'B' for Black, 'W' for White

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    const ctx = canvas.getContext('2d');
    drawBoard(ctx, board);
  }, [board]);

  function createEmptyBoard() {
    const arr = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      arr[i] = new Array(BOARD_SIZE).fill(null);
    }
    return arr;
  }

  function drawBoard(ctx, boardState) {
    // Background
    ctx.fillStyle = '#f7c87b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Draw grid lines
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

    // Draw coordinates
    const columns = 'ABCDEFGHIJKLMNOPQRST'.split('');
    ctx.fillStyle = '#000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top/Bottom coords (letters)
    for (let i = 0; i < BOARD_SIZE; i++) {
      const letter = columns[i];
      const x = PADDING + i * CELL_SIZE;
      // top
      ctx.fillText(letter, x, PADDING - 20);
      // bottom
      ctx.fillText(letter, x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20);
    }

    // Left/Right coords (numbers)
    for (let i = 0; i < BOARD_SIZE; i++) {
      const number = BOARD_SIZE - i;
      const y = PADDING + i * CELL_SIZE;

      ctx.textAlign = 'right';
      ctx.fillText(number, PADDING - 20, y);

      ctx.textAlign = 'left';
      ctx.fillText(number, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20, y);
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

  function handleClick(e) {
    const { gridX, gridY } = getGridCoords(e.clientX, e.clientY);
    placeStone(gridX, gridY);
  }

  function handleTouch(e) {
    const touch = e.touches[0];
    if (touch) {
      const { gridX, gridY } = getGridCoords(touch.clientX, touch.clientY);
      placeStone(gridX, gridY);
    }
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
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
    if (board[row][col] !== null) return; // intersection not empty

    // Clone board for immutability
    const newBoard = board.map(r => r.slice());
    newBoard[row][col] = currentPlayer;

    // After placing stone, check captures
    // Remove any opponent stones that have no liberties
    const opponent = (currentPlayer === 'B') ? 'W' : 'B';
    const groupsToRemove = findDeadGroups(newBoard, opponent);
    groupsToRemove.forEach(group => {
      group.forEach(([r, c]) => {
        newBoard[r][c] = null;
      });
    });

    // Check if our newly placed stone is now without liberties (self-capture)
    // If yes, remove it as well (unless you want to forbid suicide).
    const myGroupsToRemove = findDeadGroups(newBoard, currentPlayer);
    // If we want to allow suicide moves, we just remove them:
    myGroupsToRemove.forEach(group => {
      // If the group contains the stone we just placed, it means suicide
      // We'll remove it.
      if (group.some(([r, c]) => r === row && c === col)) {
        group.forEach(([r, c]) => {
          newBoard[r][c] = null;
        });
      }
    });

    setBoard(newBoard);
    setCurrentPlayer(opponentPlayer(currentPlayer));
  }

  function opponentPlayer(player) {
    return player === 'B' ? 'W' : 'B';
  }

  // Find all groups of a given color that have no liberties.
  function findDeadGroups(boardState, color) {
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    const deadGroups = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!visited[r][c] && boardState[r][c] === color) {
          const { group, liberties } = getGroupAndLiberties(boardState, r, c, color, visited);
          if (liberties.length === 0) {
            deadGroups.push(group);
          }
        }
      }
    }
    return deadGroups;
  }

  // Get the group of connected stones of a given color and their liberties
  function getGroupAndLiberties(boardState, row, col, color, visited) {
    const stack = [[row, col]];
    const group = [];
    const liberties = [];
    visited[row][col] = true;

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      group.push([r, c]);

      const neighbors = getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        if (boardState[nr][nc] === null) {
          // This is a liberty
          if (!liberties.some(([lr, lc]) => lr === nr && lc === nc)) {
            liberties.push([nr, nc]);
          }
        } else if (boardState[nr][nc] === color && !visited[nr][nc]) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }

    return { group, liberties };
  }

  function getNeighbors(r, c) {
    const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
    const neighbors = [];
    for (const [dr, dc] of deltas) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        neighbors.push([nr, nc]);
      }
    }
    return neighbors;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Go Board - Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}</h1>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000' }}
        onClick={handleClick}
        onTouchStart={handleTouch}
      />
    </div>
  );
}

export default App;
