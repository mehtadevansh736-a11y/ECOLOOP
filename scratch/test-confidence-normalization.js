function normalizeConfidence(val) {
  if (val === undefined || val === null || val === '') {
    return 85;
  }

  const num = Number(val);
  if (isNaN(num)) {
    return 85;
  }

  // Decimal float format (0.95 -> 95, 0.8 -> 80)
  if (num > 0 && num <= 1) {
    return Math.round(num * 100);
  }

  // Integer scale format (95 -> 95, 80 -> 80)
  if (num > 1 && num <= 100) {
    return Math.round(num);
  }

  if (num <= 0) return 0;
  return 100;
}

console.log('=== TESTING CONFIDENCE NORMALIZATION ===');

const testCases = [
  { input: 0.95, expected: 95 },
  { input: 0.92, expected: 92 },
  { input: 0.8, expected: 80 },
  { input: 0.99, expected: 99 },
  { input: 95, expected: 95 },
  { input: 92, expected: 92 },
  { input: 80, expected: 80 },
  { input: "0.95", expected: 95 },
  { input: "95", expected: 95 },
  { input: 1, expected: 100 },
  { input: 0, expected: 0 },
  { input: null, expected: 85 },
];

let failed = false;
testCases.forEach(({ input, expected }) => {
  const result = normalizeConfidence(input);
  const pass = result === expected;
  console.log(`Input: ${String(input).padStart(6)} | Output: ${String(result).padStart(3)} | Expected: ${String(expected).padStart(3)} | Status: ${pass ? 'PASSED ✓' : 'FAILED ✗'}`);
  if (!pass) failed = true;
});

if (failed) {
  console.error('\nSOME TEST CASES FAILED!');
  process.exit(1);
} else {
  console.log('\nALL CONFIDENCE TEST CASES PASSED SUCCESSFULLY!');
}
