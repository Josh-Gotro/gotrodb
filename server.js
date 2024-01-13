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
    origin: ['https://www.joshgotro.com', 'http://localhost:5173'], // Add localhost as an allowed origin
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
      if (err.code === '23505') {
        // Unique violation error
        const existingCalculation = await pool.query(
          'SELECT * FROM plaster_calculations WHERE length = $1 AND width = $2 AND height = $3',
          [length.toString(), width.toString(), height.toString()]
        );

        return res.status(200).json({
          message: 'A calculation with the same dimensions already exists.',
          calculation: existingCalculation.rows[0],
        });
      }

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

//  GET endpoint to retrieve the current ceramic kiln firing
app.get('/current-ceramic-firing', (req, res) => {
  pool.query(
    'SELECT * FROM public.kiln_ceramic_records WHERE firing_complete = false ORDER BY id DESC LIMIT 1',
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        console.log(results.rows); // Log the results
        res.json(results.rows[0]);
      }
    }
  );
});

//  GET endpoint to retrieve the completed ceramic kiln firings
app.get('/ceramic-firings', (req, res) => {
  pool.query(
    'SELECT * FROM public.kiln_ceramic_records WHERE firing_complete = true',
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        res.json(results.rows);
      }
    }
  );
});

// POST endpoint to update the current ceramic kiln firing if it exists, otherwise create a new one
app.post('/ceramic-firings', (req, res) => {
  const {
    id,
    room_temp,
    low_fire_start_time,
    medium_fire_start_time,
    high_fire_start_time,
    kiln_turn_off_time,
    loading_notes,
    unloading_notes,
    firing_complete = false,
    rating,
    cone_type,
  } = req.body;

  let query;
  let message;
  let values;

  if (id) {
    // Update existing record
    query = `
      INSERT INTO public.kiln_ceramic_records(id, room_temp, low_fire_start_time, medium_fire_start_time, high_fire_start_time, kiln_turn_off_time, loading_notes, unloading_notes, firing_complete, rating, cone_type)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
      room_temp = excluded.room_temp,
      low_fire_start_time = excluded.low_fire_start_time,
      medium_fire_start_time = excluded.medium_fire_start_time,
      high_fire_start_time = excluded.high_fire_start_time,
      kiln_turn_off_time = excluded.kiln_turn_off_time,
      loading_notes = excluded.loading_notes,
      unloading_notes = excluded.unloading_notes,
      firing_complete = excluded.firing_complete,
      rating = excluded.rating,
      cone_type = excluded.cone_type
    `;
    message = 'Record updated successfully';
    values = [
      id,
      room_temp,
      low_fire_start_time,
      medium_fire_start_time,
      high_fire_start_time,
      kiln_turn_off_time,
      loading_notes,
      unloading_notes,
      firing_complete,
      rating,
      cone_type,
    ];
  } else {
    // Insert new record
    query = `
      INSERT INTO public.kiln_ceramic_records(room_temp, low_fire_start_time, medium_fire_start_time, high_fire_start_time, kiln_turn_off_time, loading_notes, unloading_notes, firing_complete, rating, cone_type)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    message = 'Record created successfully';
    values = [
      room_temp,
      low_fire_start_time,
      medium_fire_start_time,
      high_fire_start_time,
      kiln_turn_off_time,
      loading_notes,
      unloading_notes,
      firing_complete,
      rating,
      cone_type,
    ];
  }

  pool.query(query, values, (error, results) => {
    if (error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.json({ status: 'success', message });
    }
  });
});

// Starting the server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
