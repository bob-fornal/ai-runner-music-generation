# ai-runner-music-generation
Functionality to calculate BPM (for music) based on Runner Height and Target Mile Time in Minutes.

## Run

Requires Node.js 18 or newer; no dependencies or build step are needed.
From the repository directory:

```sh
node index.js 70 10
# Estimated BPM (steps per minute): 170.78

npm start -- 68.5 10.5

node index.js 70 10 2
# Modified music BPM (cadence / 2): 85.39
```

Height is in inches. Pace is a positive number of minutes per mile:
use `10.5` for a 10-minute, 30-second mile (not `10:30`).
Invalid inputs print an error and exit with status 1.

## Use as a function

```js
const { calculateBpm, calculateStepLength } = require('./index');

const bpm = calculateBpm(70, 10);
const modifiedBpm = calculateBpm(70, 10, 5); // about 34.16 music BPM
const stepLengthInches = calculateStepLength(70, 10); // 37.1 inches
```

Both functions accept height in inches and pace in minutes per mile as positive,
finite numbers. They return unrounded BPM or one-step length in inches.
Invalid inputs or results outside the positive, finite numeric range throw a
`RangeError`.

## BPM divisor

`calculateBpm(heightInches, minutesPerMile, divisor = 1)` and the optional third
CLI argument divide the estimated cadence by a positive, finite numeric divisor.
Omitting it (or using `1`) preserves the original cadence output. Fractional
divisors are also accepted. Division happens before display rounding; a zero,
negative, nonnumeric, or nonfinite divisor is rejected.

For a 70-inch runner targeting a 10-minute mile:

| Divisor | Music BPM | Interpretation |
| --- | --- | --- |
| 1 | 170.78 | One beat per step |
| 2 | 85.39 | One beat per two steps |
| 4 | 42.70 | One beat per four steps |
| 5 | 34.16 | One beat per five-step cycle |

Try `npm start -- 70 10 4` or `node index.js 70 10 5` to compare.
This changes the music target, **not** the estimated steps per minute or step
length. The CLI labels divided results as modified music BPM to distinguish them
from cadence.

A divisor of 5 can mark a five-step breathing cycle for experimentation, such as
two steps inhaling followed by three steps exhaling. One beat marks the entire
cycle; this calculator does not generate separate inhale/exhale cues. This is
an optional rhythm experiment, not a universal breathing technique or a claim
that these divisors improve mentality or movement.

## Compare variations in a table

Run `node table.js` from the repository directory to display eight rows for a
70-inch runner, from 14 down to 7 minutes per mile in one-minute increments.
Each row includes height, pace, undivided cadence, and music BPM for divisors
2, 4, and 5. Displayed BPM values are rounded to two decimal places.

The parent function can also accept different heights, pace lists, and divisors:

```js
const { generateBpmTable } = require('./table');

const defaultRows = generateBpmTable();
const customRows = generateBpmTable(68.5, [12, 10.5, 8], [2, 4, 5]);
console.table(customRows);
```

`generateBpmTable(heightInches = 70, paces = [14, 13, 12, 11, 10, 9, 8, 7],
divisors = [2, 4, 5])` returns an array of row objects with `heightInches`,
`minutesPerMile`, `cadenceBpm`, and `BPM / <divisor>` fields. It calls
`calculateBpm` for every variation and returns unrounded numeric values.
Paces and divisors must be nonempty arrays of positive, finite numbers; invalid
inputs throw a `RangeError`. Input order is preserved and input arrays are not
modified. Importing the module does not print a table.

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

A step is one footfall, not a full two-step stride. With the default divisor,
music BPM corresponds to one beat per step. Real step length varies with pace,
gait, terrain, and the runner;
use measured cadence for an accurate music target. This is not a recommendation
to change running form.

## Tests

```sh
npm test
```

Tests use Node's built-in test runner. No separate lint command is configured.

## Initial Prompt

> Build out a JavaScript function that I can run that will calculate a Beats Per Minute (equivalent to steps per minute) for a runner based on the runner's height in inches and time per mile (e.g. 10 minute mile) target. For now, this can target Node as the runner.
