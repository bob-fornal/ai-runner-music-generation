# ai-runner-music-generation
Functionality to calculate BPM (for music) based on Runner Height and Target Mile Time in Minutes.

## Run

Requires Node.js 18 or newer; no dependencies or build step are needed.
From the repository directory:

```sh
node index.js 70 10
# Estimated BPM (steps per minute): 170.78

npm start -- 68.5 10.5
```

Height is in inches. Pace is a positive number of minutes per mile:
use `10.5` for a 10-minute, 30-second mile (not `10:30`).
Invalid inputs print an error and exit with status 1.

## Use as a function

```js
const { calculateBpm, calculateStepLength } = require('./index');

const bpm = calculateBpm(70, 10);
const stepLengthInches = calculateStepLength(70, 10); // 37.1 inches
```

Both functions accept height in inches and pace in minutes per mile as positive,
finite numbers. They return unrounded BPM or one-step length in inches.
Invalid inputs or results outside the positive, finite numeric range throw a
`RangeError`.

## Estimation model

Height and pace alone cannot determine a runner's actual cadence. This calculator
estimates average leg length from height and adjusts step length with pace:

- `leg length in inches = height in inches × 0.53`
- `relative speed = 10 / minutes per mile`
- `step length in inches = leg length × relative speed ^ 0.75`
- `BPM = 63,360 / step length in inches / minutes per mile`

These are explicit heuristic assumptions, not an empirically validated running
model: leg length is approximated as 53% of height, and step length equals leg
length at the reference pace of 10 minutes per mile (6 mph). The 0.75 exponent
models most of a speed increase coming from longer steps, with some coming from
higher cadence. Doubling speed increases step length by about 68% and cadence by
about 19%, instead of doubling cadence as the old fixed-step model did.

The constants are modeling choices, not population measurements or a guarantee
of improved accuracy. Measured leg length and step lengths at known paces would
be needed to calibrate this model for an individual. It is intended for running,
not walking or sprinting; extreme paces should not be treated as reliable.

A step is one footfall, not a full two-step stride. Music BPM corresponds to one
beat per step. Real step length varies with pace, gait, terrain, and the runner;
use measured cadence for an accurate music target. This is not a recommendation
to change running form.

## Tests

```sh
npm test
```

Tests use Node's built-in test runner. No separate lint command is configured.
