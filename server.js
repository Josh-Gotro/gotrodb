require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Enable CORS for a specific origin ('https://www.joshgotro.com' in this case)
app.use(
  cors({
    origin: 'https://www.joshgotro.com',
  })
);

// Root endpoint just for basic testing
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// POST endpoint with validation for adding a calculation
app.post(
  '/plaster-calculation',
  [
    body('length')
      .exists()
      .withMessage('Length is required')
      .isNumeric()
      .withMessage('Length must be a number'),
    body('width')
      .exists()
      .withMessage('Width is required')
      .isNumeric()
      .withMessage('Width must be a number'),
    body('height')
      .exists()
      .withMessage('Height is required')
      .isNumeric()
      .withMessage('Height must be a number'),
    body('volume')
      .exists()
      .withMessage('Volume is required')
      .isNumeric()
      .withMessage('Volume must be a number'),
    body('water')
      .exists()
      .withMessage('Water is required')
      .isNumeric()
      .withMessage('Water must be a number'),
    body('plaster_lbs')
      .exists()
      .withMessage('Plaster lbs is required')
      .isNumeric()
      .withMessage('Plaster lbs must be a number'),
    body('plaster_oz')
      .exists()
      .withMessage('Plaster oz is required')
      .isNumeric()
      .withMessage('Plaster oz must be a number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { length, width, height, volume, water, plaster_lbs, plaster_oz } =
        req.body;
      const newCalculation = await pool.query(
        'INSERT INTO plaster_calculations (length, width, height, volume, water, plaster_lbs, plaster_oz) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [length, width, height, volume, water, plaster_lbs, plaster_oz]
      );
      res.json(newCalculation.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// GET endpoint to retrieve all calculations
app.get('/plaster-calculations', async (req, res) => {
  try {
    const allCalculations = await pool.query(
      'SELECT * FROM plaster_calculations'
    );
    res.json(allCalculations.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Starting the server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
