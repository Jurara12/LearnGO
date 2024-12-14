const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { execFile } = require('child_process');
const { parseSGFData } = require('./sgfParser'); // Import the SGF parser

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' }); // Folder for storing uploaded SGF files
const puzzles = []; // Temporary in-memory storage for puzzles

// Upload endpoint
app.post('/puzzles/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  // Run SGFC to validate the SGF file
  execFile('sgfc', [filePath], (error, stdout, stderr) => {
    if (error) {
      console.error('SGFC Error:', stderr);
      return res.status(400).json({ error: 'Invalid SGF file' });
    }

    // SGFC cleans the SGF file in place; read the cleaned content
    const sgfContent = fs.readFileSync(filePath, 'utf8');

    // Parse the SGF content
    const puzzleData = parseSGFData(sgfContent);

    // Store the puzzle in memory (replace this with database storage later)
    const id = puzzles.length + 1;
    puzzles.push({
      id,
      title: puzzleData.title,
      sgf_content: sgfContent,
      initial_position: puzzleData.initialPosition,
      solution_lines: puzzleData.solutionLines,
      metadata: { difficulty: puzzleData.difficulty },
    });

    res.json({ success: true, puzzle_id: id });
  });
});

// Fetch a puzzle by ID
app.get('/puzzles/:id', (req, res) => {
  const puzzleId = parseInt(req.params.id, 10);
  const puzzle = puzzles.find(p => p.id === puzzleId);

  if (!puzzle) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }

  res.json({
    id: puzzle.id,
    title: puzzle.title,
    initial_position: puzzle.initial_position,
    metadata: puzzle.metadata,
  });
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
