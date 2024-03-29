require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
const cors = require('cors');

const app = express();

//#region [ Purple ] MIDDLEWARE
//parse JSON bodies
app.use(bodyParser.json());

app.set('log level', 'debug');

// Enable CORS for a specific origin ('https://www.joshgotro.com' in this case)
app.use(
  cors({
    origin: [
      'https://www.joshgotro.com',
      'http://www.joshgotro.com',
      'http://localhost:5173',
    ],
  })
);
//#endregion

// #region [ Grey ] SERVER

// Root endpoint just for basic testing
app.get('/', (req, res) => {
  res.send('I need a pencil, I need a pencil my dawg.');
});

//#endregion

// #region [ Green ] PLASTER

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
//#endregion

// #region [ Brown ] CERAMIC
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
    RETURNING id, created_at
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
    RETURNING id, created_at
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
      res.json({ status: 'success', message, id: results.rows[0].id });
    }
  });
});
//#endregion

// #region [ Blue ] GLASS
// GET all pro_tables
app.get('/pro-table', (req, res) => {
  pool.query('SELECT * FROM pro_table ORDER BY id DESC', (error, results) => {
    if (error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.json(results.rows);
    }
  });
});

// GET endpoint for pro_table by id
app.get('/pro-table/:id', (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(
    'SELECT * FROM pro_table WHERE id = $1',
    [id],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        if (results.rows.length > 0) {
          res.json(results.rows[0]);
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      }
    }
  );
});

// POST endpoint for pro_table
app.post('/pro-table', (req, res) => {
  const {
    name,
    slot,
    segs,
    rate_temp_hr_m_1,
    rate_temp_hr_m_2,
    rate_temp_hr_m_3,
    rate_temp_hr_m_4,
    rate_temp_hr_m_5,
    rate_temp_hr_m_6,
    rate_temp_hr_m_7,
    rate_temp_hr_m_8,
    skip,
    add_time_hr,
    add_time_m,
    adjusted_temp,
  } = req.body;

  let query = `INSERT INTO pro_table (name, slot, segs, rate_temp_hr_m_1, rate_temp_hr_m_2, rate_temp_hr_m_3, rate_temp_hr_m_4, rate_temp_hr_m_5, rate_temp_hr_m_6, rate_temp_hr_m_7, rate_temp_hr_m_8, skip, add_time_hr, add_time_m, adjusted_temp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;

  let values = [
    name,
    slot,
    segs,
    rate_temp_hr_m_1,
    rate_temp_hr_m_2,
    rate_temp_hr_m_3,
    rate_temp_hr_m_4,
    rate_temp_hr_m_5,
    rate_temp_hr_m_6,
    rate_temp_hr_m_7,
    rate_temp_hr_m_8,
    skip,
    add_time_hr,
    add_time_m,
    adjusted_temp,
  ];

  pool.query(query, values, (error, results) => {
    if (error) {
      res.status(500).json({ error: error.toString() });
    } else {
      res.status(201).json({
        status: 'success',
        message: 'Record added, lol.',
        record: results.rows[0],
      });
    }
  });
});

// PUT endpoint for pro_table by id
app.put('/pro-table/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, slot, segs, rate_temp_hr_m_1 } = req.body;

  pool.query(
    'UPDATE pro_table SET name = $1, slot = $2, segs = $3, rate_temp_hr_m_1 = $4 WHERE id = $5 RETURNING *',
    [name, slot, segs, rate_temp_hr_m_1, id],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        if (results.rowCount > 0) {
          res.status(200).json({
            status: 'success',
            message: 'Record updated.',
            record: results.rows[0],
          });
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      }
    }
  );
});

// DELETE endpoint for pro_table by id
app.delete('/pro-table/:id', (req, res) => {
  const id = parseInt(req.params.id);

  pool.query('DELETE FROM pro_table WHERE id = $1', [id], (error, results) => {
    if (error) {
      res.status(500).json({ error: error.toString() });
    } else {
      if (results.rowCount > 0) {
        res.status(200).json({ status: 'success', message: 'Record deleted.' });
      } else {
        res.status(404).json({ message: 'Record not found' });
      }
    }
  });
});

// GET endpoint for kiln_glass_records
app.get('/kiln-glass-records', (req, res) => {
  pool.query(
    'SELECT * FROM kiln_glass_records ORDER BY id DESC',
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        res.json(results.rows);
      }
    }
  );
});

// GET endpoint for kiln_glass_records by id
app.get('/kiln-glass-records/:id', (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(
    'SELECT * FROM kiln_glass_records WHERE id = $1',
    [id],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        if (results.rows.length > 0) {
          res.json(results.rows[0]);
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      }
    }
  );
});

// POST endpoint for kiln_glass_records
app.post(
  '/kiln-glass-records',
  [
    body('room_temp')
      .optional()
      .isNumeric()
      .withMessage('Room temperature must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('fire_time_hr')
      .optional()
      .isNumeric()
      .withMessage('Fire time (hours) must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('fire_time_m')
      .optional()
      .isNumeric()
      .withMessage('Fire time (minutes) must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('mode')
      .exists()
      .withMessage('Mode is required')
      .isIn(['AUTO', 'PRO'])
      .withMessage('Invalid mode'),
    body('auto_mod_temp')
      .optional()
      .isNumeric()
      .withMessage('Auto mod temp must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('auto_mod_hr')
      .optional()
      .isNumeric()
      .withMessage('Auto mod hour must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('auto_mod_m')
      .optional()
      .isNumeric()
      .withMessage('Auto mod minute must be a number')
      .customSanitizer((value) => {
        return value === '' ? null : value;
      }),
    body('pro_table_id')
      .optional()
      .isNumeric()
      .withMessage('Pro table ID must be a number')
      .customSanitizer((value) => {
        return value === '0' ? null : value;
      }),
    body('glass_type')
      .optional()
      .isIn(['WINE', 'BEER', 'STAINED', '96COE', '90COE', 'MIXED', 'OTHER'])
      .withMessage('Invalid glass type'),
    body('auto_speed')
      .optional()
      .isIn(['SLo', 'MEd', 'FASt'])
      .withMessage('Invalid auto speed'),
    body('auto_process')
      .optional()
      .isIn(['SLP', 'tAC', 'FULL'])
      .withMessage('Invalid auto process'),
  ],
  (req, res) => {
    const {
      room_temp,
      loading_notes,
      unloading_notes,
      fire_time_hr,
      fire_time_m,
      glass_type,
      glass_type_other,
      mode,
      auto_speed,
      auto_process,
      auto_mod_temp,
      auto_mod_hr,
      auto_mod_m,
      pro_table_id,
    } = req.body;

    pool.query(
      'INSERT INTO kiln_glass_records (room_temp, loading_notes, unloading_notes, fire_time_hr, fire_time_m, glass_type, glass_type_other, mode, auto_speed, auto_process, auto_mod_temp, auto_mod_hr, auto_mod_m, pro_table_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [
        room_temp,
        loading_notes,
        unloading_notes,
        fire_time_hr,
        fire_time_m,
        glass_type,
        glass_type_other,
        mode,
        auto_speed,
        auto_process,
        auto_mod_temp,
        auto_mod_hr,
        auto_mod_m,
        pro_table_id,
      ],
      (error, results) => {
        if (error) {
          res.status(500).json({ error: error.toString() });
        } else {
          res.status(201).json(results.rows[0]);
        }
      }
    );
  }
);

// PUT endpoint for kiln_glass_records by id
app.put('/kiln-glass-records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const {
    room_temp,
    loading_notes,
    unloading_notes,
    fire_time_hr,
    fire_time_m,
    glass_type,
    mode,
    pro_table_id,
  } = req.body;

  pool.query(
    'UPDATE kiln_glass_records SET room_temp = $1, loading_notes = $2, unloading_notes = $3, fire_time_hr = $4, fire_time_m = $5, glass_type = $6, mode = $7, pro_table_id = $8 WHERE id = $9 RETURNING *',
    [
      room_temp,
      loading_notes,
      unloading_notes,
      fire_time_hr,
      fire_time_m,
      glass_type,
      mode,
      pro_table_id,
      id,
    ],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        if (results.rowCount > 0) {
          res.status(200).json({
            status: 'success',
            message: 'Record updated.',
            record: results.rows[0],
          });
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      }
    }
  );
});

// DELETE endpoint for kiln_glass_records by id
app.delete('/kiln-glass-records/:id', (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(
    'DELETE FROM kiln_glass_records WHERE id = $1',
    [id],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: error.toString() });
      } else {
        if (results.rowCount > 0) {
          res
            .status(200)
            .json({ status: 'success', message: 'Record deleted.' });
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      }
    }
  );
});

//#endregion

// #region [ Grey]
// Starting the server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//#endregion
