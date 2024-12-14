const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { parseSGFData } = require('./sgfParser'); // Your SGF parsing function

const app = express();
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Store puzzles in memory (can be replaced with a database)
const puzzles = [];

// POST /puzzles/upload: Upload an SGF file and parse it
app.post('/puzzles/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  try {
    // Read the uploaded SGF file
    const sgfContent = fs.readFileSync(filePath, 'utf8');

    // Parse the SGF file to extract puzzle data
    const puzzleData = parseSGFData(sgfContent);

    // Store the puzzle
    const id = puzzles.length + 1;
    puzzles.push({
      id,
      title: puzzleData.title,
      initial_position: puzzleData.initialPosition,
      solution_lines: puzzleData.solutionLines,
      metadata: { difficulty: puzzleData.difficulty },
    });

    // Respond with the puzzle ID
    res.json({ success: true, puzzle_id: id });
  } catch (error) {
    console.error('Error parsing SGF:', error);
    res.status(400).json({ error: 'Failed to parse SGF file' });
  }
});

// GET /puzzles/:id: Retrieve a specific puzzle
app.get('/puzzles/:id', (req, res) => {
  const puzzleId = parseInt(req.params.id, 10);
  const puzzle = puzzles.find((p) => p.id === puzzleId);

  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }

  res.json(puzzle);
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
