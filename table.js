const { calculateBpm } = require('./index');

function generateBpmTable(
  heightInches = 70,
  paces = [14, 13, 12, 11, 10, 9, 8, 7],
  divisors = [2, 4, 5]
) {
  for (const [name, values] of Object.entries({ paces, divisors })) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new RangeError(`${name} must be a nonempty array of positive, finite numbers.`);
    }
  }

  const rows = [];
  for (const minutesPerMile of paces) {
    const row = {
      heightInches,
      minutesPerMile,
      cadenceBpm: calculateBpm(heightInches, minutesPerMile)
    };
    for (const divisor of divisors) {
      if (divisor === undefined) {
        throw new RangeError('divisor must be a positive, finite number.');
      }
      row[`BPM / ${divisor}`] = calculateBpm(heightInches, minutesPerMile, divisor);
    }
    rows.push(row);
  }
  return rows;
}

module.exports = { generateBpmTable };

if (require.main === module) {
  const rows = generateBpmTable();
  console.table(rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      key === 'heightInches' || key === 'minutesPerMile' ? value : value.toFixed(2)
    ])
  )));
}
