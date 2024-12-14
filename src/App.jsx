import React, { useRef, useEffect } from 'react';

const BOARD_SIZE = 19;
const CELL_SIZE = 30;
const PADDING = 40;

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
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>LearnGO</h1>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block', margin: '0 auto' }}
      />
    </div>
  );
}

export default App;
