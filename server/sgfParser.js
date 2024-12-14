const SmartGame = require('smartgame'); // Use smartgame for SGF parsing

// Function to parse SGF content and extract puzzle data
function parseSGFData(sgfContent) {
  const game = SmartGame.parse(sgfContent); // Parse SGF file
  const rootNode = game.nodes[0]; // Get the root node of the game

  const boardSize = rootNode.SZ || 19;

  // Extract initial positions (AB for black stones, AW for white stones)
  const initialPosition = {
    B: rootNode.AB || [],
    W: rootNode.AW || [],
  };

  // Extract solution lines (variations of moves in the SGF)
  const solutionLines = extractSolutionLines(game);

  const title = rootNode.GN || 'Untitled Puzzle';
  const difficulty = 'Intermediate'; // You can adjust this dynamically

  return {
    boardSize,
    initialPosition,
    solutionLines,
    title,
    difficulty,
  };
}

// Extract solution lines from the SGF tree
function extractSolutionLines(game) {
  if (!game || !game.nodes || game.nodes.length === 0) {
    return [];
  }

  const solution = [];
  function traverse(nodes) {
    nodes.forEach(node => {
      if (node.B) {
        solution.push({ color: 'B', move: node.B });
      } else if (node.W) {
        solution.push({ color: 'W', move: node.W });
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  }

  traverse(game.nodes);
  return solution;
}

module.exports = { parseSGFData };
