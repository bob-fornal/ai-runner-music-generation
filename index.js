const INCHES_PER_MILE = 63360;
const STEP_LENGTH_HEIGHT_RATIO = 0.65;

function calculateBpm(heightInches, minutesPerMile) {
  for (const [name, value] of Object.entries({ heightInches, minutesPerMile })) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new RangeError(`${name} must be a positive, finite number.`);
    }
  }

  const stepLengthInches = heightInches * STEP_LENGTH_HEIGHT_RATIO;
  const bpm = INCHES_PER_MILE / stepLengthInches / minutesPerMile;
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new RangeError('Inputs must produce a positive, finite BPM.');
  }
  return bpm;
}

module.exports = { calculateBpm };

if (require.main === module) {
  const args = process.argv.slice(2);
  try {
    if (args.length !== 2) {
      throw new Error('Usage: node index.js <height-in-inches> <minutes-per-mile>');
    }
    const bpm = calculateBpm(Number(args[0]), Number(args[1]));
    console.log(`Estimated BPM (steps per minute): ${bpm.toFixed(2)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
