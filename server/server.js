const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const SmartGame = require('smartgame'); // For parsing SGF files

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Store puzzles in memory
const puzzles = [];

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to LearnGO Backend!');
});

// Upload SGF file and parse it
app.post('/puzzles/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    try {
        // Read and parse the SGF file
        const sgfContent = fs.readFileSync(filePath, 'utf8');
        const game = SmartGame.parse(sgfContent);

        const puzzleData = {
            id: puzzles.length + 1,
            title: game.tree?.nodes[0]?.GN || 'Untitled Puzzle',
            initial_position: {
                B: game.tree?.nodes[0]?.AB || [],
                W: game.tree?.nodes[0]?.AW || [],
            },
            solution_lines: extractSolutionLines(game.tree),
            metadata: { difficulty: 'Intermediate' },
        };

        puzzles.push(puzzleData);

        res.json({ success: true, puzzle_id: puzzleData.id });
    } catch (error) {
        console.error('Error parsing SGF file:', error);
        res.status(400).json({ error: 'Failed to parse SGF file' });
    }
});

// Fetch puzzle by ID
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

// Helper function to extract solution lines
function extractSolutionLines(tree) {
    if (!tree || !tree.children) {
        return [];
    }

    const solution = [];
    function traverse(node) {
        const move = node.nodes[0];
        if (move.B) {
            solution.push({ color: 'B', move: move.B });
        } else if (move.W) {
            solution.push({ color: 'W', move: move.W });
        }

        if (node.children && node.children.length > 0) {
            traverse(node.children[0]);
        }
    }

    traverse(tree.children[0]);
    return solution;
}
