import React, { useEffect, useRef } from 'react';
import { GobanCore } from 'goban';

function App() {
  const boardRef = useRef(null);

  useEffect(() => {
    const gobanInstance = new GobanCore(boardRef.current, {
      boardSize: 19,
    });
    return () => gobanInstance.destroy();
  }, []);

  return (
    <div style={{ width: '500px', height: '500px', margin: '20px auto' }}>
      <div ref={boardRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default App;
