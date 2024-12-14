import React, { useRef, useEffect, useState } from 'react';

const BOARD_SIZE = 19;
const CELL_SIZE = 30;
const PADDING = 40;

function App() {
  const canvasRef = useRef(null);

  // Game history: array of { board, currentPlayer }
  const [history, setHistory] = useState([{
    board: createEmptyBoard(),
    currentPlayer: 'B'
  }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [illegalMoveMessage, setIllegalMoveMessage] = useState('');

  const currentBoard = history[currentStep].board;
  const currentPlayer = history[currentStep].currentPlayer;

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
    if (currentBoard[row][col] !== null) return; // not empty

    const newBoard = currentBoard.map(r => r.slice());
    const player = currentPlayer;
    const opponent = opponentPlayer(player);

    // Tentatively place the stone
    newBoard[row][col] = player;

    // Capture opponent groups with no liberties
    const opponentGroupsToRemove = findDeadGroups(newBoard, opponent);
    opponentGroupsToRemove.forEach(group => {
      group.forEach(([r, c]) => {
        newBoard[r][c] = null;
      });
    });

    // Check if our newly placed stone is now without liberties (suicide check)
    const myGroupsToRemove = findDeadGroups(newBoard, player);
    let suicide = false;
    myGroupsToRemove.forEach(group => {
      if (group.some(([gr, gc]) => gr === row && gc === col)) {
        // The newly placed stone group is dead
        // If we haven't captured any opponent stones, it's a suicide move
        if (opponentGroupsToRemove.length === 0) {
          suicide = true;
        }
      }
    });

    if (suicide) {
      // Illegal move under no-suicide rule, revert and show message
      setIllegalMoveMessage("Illegal move, not allowed.");
      return;
    } else {
      // If not suicide, remove our dead groups (if any)
      myGroupsToRemove.forEach(group => {
        group.forEach(([gr, gc]) => {
          newBoard[gr][gc] = null;
        });
      });

      // Update history
      const newStep = {
        board: newBoard,
        currentPlayer: opponentPlayer(player)
      };
      const updatedHistory = history.slice(0, currentStep + 1);
      updatedHistory.push(newStep);
      setHistory(updatedHistory);
      setCurrentStep(updatedHistory.length - 1);

      // Clear illegal move message on successful move
      setIllegalMoveMessage('');
    }
  }

  function opponentPlayer(player) {
    return player === 'B' ? 'W' : 'B';
  }

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

  function moveBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIllegalMoveMessage(''); // Clear message when navigating history
    }
  }

  function moveForward() {
    if (currentStep < history.length - 1) {
      setCurrentStep(currentStep + 1);
      setIllegalMoveMessage(''); // Clear message when navigating history
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px', width: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div style={{ height: '30px', lineHeight: '30px', marginBottom: '10px' }}>
        Current Player: {currentPlayer === 'B' ? 'Black' : 'White'}
      </div>

      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block', margin: '0 auto' }}
        onClick={handleClick}
        onTouchStart={handleTouch}
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
