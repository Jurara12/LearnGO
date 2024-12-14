const sgfParse = require('sgf-parse'); // This is the library for parsing SGF files

// Function to parse SGF content and extract puzzle data
function parseSGFData(sgfContent) {
  const sgfTree = sgfParse(sgfContent);
  const rootNode = sgfTree.nodes[0];

  const boardSize = rootNode.SZ ? parseInt(rootNode.SZ[0], 10) : 19;

  // Extract initial positions (AB for black stones, AW for white stones)
  const initialPosition = {
    B: rootNode.AB ? rootNode.AB.map(coord => coord) : [],
    W: rootNode.AW ? rootNode.AW.map(coord => coord) : [],
  };

  // Extract solution lines (the first variation of moves in the SGF)
  const solutionLines = extractSolutionLines(sgfTree);

  const title = rootNode.GN ? rootNode.GN[0] : 'Untitled Puzzle';
  const difficulty = 'Intermediate'; // Can be set dynamically based on SGF metadata

  return {
    boardSize,
    initialPosition,
    solutionLines,
    title,
    difficulty,
  };
}

// Extract solution lines from the SGF tree
function extractSolutionLines(sgfTree) {
  if (!sgfTree.children || sgfTree.children.length === 0) {
    return [];
  }

  const solution = [];
  function traverse(node) {
    if (node.nodes[0].B) {
      solution.push({ color: 'B', move: node.nodes[0].B[0] });
    } else if (node.nodes[0].W) {
      solution.push({ color: 'W', move: node.nodes[0].W[0] });
    }
    if (node.children && node.children[0]) {
      traverse(node.children[0]);
    }
  }

  traverse(sgfTree.children[0]);
  return solution;
}

module.exports = { parseSGFData };
