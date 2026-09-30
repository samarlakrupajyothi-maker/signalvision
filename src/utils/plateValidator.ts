// Indian State & Union Territory 2-letter RTO Codes
export const VALID_INDIAN_STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'OR', 'PB', 'PY',
  'RJ', 'SK', 'TN', 'TR', 'TS', 'UK', 'UA', 'UP', 'WB',
]);

export interface PlateValidationResult {
  isValid: boolean;
  normalizedPlate: string;
  stateCode?: string;
  rtoCode?: string;
  series?: string;
  vehicleNumber?: string;
  isBharatSeries?: boolean;
  reason?: string;
}

/**
 * Validates Indian License Plates according to MoRTH / CMVR rules:
 * Standard: SS DD AA NNNN (State, District/RTO, Series letters, 4-digit number)
 * Bharat Series: YY BH NNNN XX
 */
export function validateIndianPlate(rawPlate: string): PlateValidationResult {
  if (!rawPlate) {
    return { isValid: false, normalizedPlate: '', reason: 'Empty plate string' };
  }

  // Normalize: uppercase, remove special symbols except alphanumeric
  const clean = rawPlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (clean.length < 8 || clean.length > 11) {
    return { 
      isValid: false, 
      normalizedPlate: clean, 
      reason: `Invalid length: ${clean.length} chars (expected 8-11)` 
    };
  }

  // Check Bharat Series (e.g., 22BH1234AA)
  const bhMatch = clean.match(/^(\d{2})(BH)(\d{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    const formatted = `${bhMatch[1]} BH ${bhMatch[3]} ${bhMatch[4]}`;
    return {
      isValid: true,
      normalizedPlate: formatted,
      isBharatSeries: true,
      vehicleNumber: bhMatch[3],
      series: bhMatch[4],
    };
  }

  // Check Standard Indian Plate (e.g., AP16CQ4821 or DL01AB9942 or TS09FA1010)
  const stdMatch = clean.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})?(\d{4})$/);
  if (!stdMatch) {
    return { 
      isValid: false, 
      normalizedPlate: clean, 
      reason: 'Does not match Indian MoRTH format [State][RTO][Series][4-digits]' 
    };
  }

  const [, state, rto, series = '', num] = stdMatch;
  if (!VALID_INDIAN_STATE_CODES.has(state)) {
    return { 
      isValid: false, 
      normalizedPlate: clean, 
      reason: `Unknown state/UT code: '${state}'` 
    };
  }

  const paddedRto = rto.padStart(2, '0');
  const formatted = series 
    ? `${state} ${paddedRto} ${series} ${num}`
    : `${state} ${paddedRto} ${num}`;

  return {
    isValid: true,
    normalizedPlate: formatted,
    stateCode: state,
    rtoCode: paddedRto,
    series,
    vehicleNumber: num,
  };
}

/**
 * Levenshtein distance for fuzzy cross-camera plate matching (allows 1-2 character errors)
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const s2 = b.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Checks if two plates match within tolerance (distance <= 2)
 */
export function isFuzzyPlateMatch(plateA: string, plateB: string, maxDistance: number = 2): boolean {
  if (!plateA || !plateB) return false;
  return levenshteinDistance(plateA, plateB) <= maxDistance;
}
