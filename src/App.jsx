import React, { useRef, useEffect } from 'react';

const BOARD_SIZE = 19;
const CELL_SIZE = 30;   // each cell 30px
const PADDING = 40;     // space around the board to draw coordinates

function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;

    const ctx = canvas.getContext('2d');
    drawBoard(ctx);
  }, []);

  function drawBoard(ctx) {
    ctx.fillStyle = '#f7c87b'; // Light wood color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    // Draw grid lines
    for (let i = 0; i < BOARD_SIZE; i++) {
      // vertical lines
      const x = PADDING + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();

      // horizontal lines
      const y = PADDING + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, y);
      ctx.stroke();
    }

    // Columns: A-T
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
    // If we follow the image provided, numbers go 1 at bottom to 19 at top
    for (let i = 0; i < BOARD_SIZE; i++) {
      const number = BOARD_SIZE - i;
      const y = PADDING + i * CELL_SIZE;

      // left side
      ctx.textAlign = 'right';
      ctx.fillText(number, PADDING - 20, y);

      // right side
      ctx.textAlign = 'left';
      ctx.fillText(number, PADDING + (BOARD_SIZE - 1) * CELL_SIZE + 20, y);
    }
  }

  function handleClick(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDING;
    const y = e.clientY - rect.top - PADDING;
    const gridX = Math.round(x / CELL_SIZE);
    const gridY = Math.round(y / CELL_SIZE);

    if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
      console.log(`User clicked on intersection: (${gridX}, ${gridY})`);
      // Future: Add logic to place stones or validate moves
    }
  }

  function handleTouch(e) {
    const touch = e.touches[0];
    if (touch) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - PADDING;
      const y = touch.clientY - rect.top - PADDING;
      const gridX = Math.round(x / CELL_SIZE);
      const gridY = Math.round(y / CELL_SIZE);

      if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
        console.log(`User touched intersection: (${gridX}, ${gridY})`);
        // Future: Add logic for stone placement on touch
      }
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Go Board</h1>
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
