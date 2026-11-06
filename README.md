# ai-runner-music-generation
Functionality to calculate BPM (for music) based on Runner Height and Target Mile Time in Minutes.

## Run

Requires Node.js 18 or newer; no dependencies or build step are needed.
From the repository directory:

```sh
node index.js 70 10
# Estimated BPM (steps per minute): 139.25

npm start -- 68.5 10.5
```

Height is in inches. Pace is a positive number of minutes per mile:
use `10.5` for a 10-minute, 30-second mile (not `10:30`).
Invalid inputs print an error and exit with status 1.

## Use as a function

```js
const { calculateBpm } = require('./index');

const bpm = calculateBpm(70, 10);
```

The function accepts positive, finite numbers and returns an unrounded BPM.
Invalid inputs or results outside the positive, finite numeric range throw a
`RangeError`.

## Estimation model

Height and pace alone cannot determine a runner's actual cadence. This calculator
uses a fixed, approximate **step length of 0.65 × height**, as a simplifying
assumption, not a validated prediction for individual runners:

`BPM = 63,360 inches per mile / (height in inches × 0.65) / minutes per mile`

A step is one footfall, not a full two-step stride. Music BPM corresponds to one
beat per step. Real step length varies with pace, gait, terrain, and the runner;
use measured cadence for an accurate music target. This is not a recommendation
to change running form.

## Tests

```sh
npm test
```

Tests use Node's built-in test runner. No separate lint command is configured.
