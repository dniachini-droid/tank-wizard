/**
 * Test surface adapter — Phase 2.
 *
 * Presents the 196 names the legacy harness (`legacy/build/engines.js`)
 * exported, so the legacy test suite can run against the modular code
 * unchanged.
 *
 * RE-EXPORTS ONLY. No logic, no wrappers, no shims, no defaults. If a name is
 * absent here it is absent from the new code — see `.agent/adapter-report.md`.
 */

// src/App.jsx
export { deriveTankState, toRecords } from './App.jsx';

// src/components/DoseExpectation.jsx
export { findingHidden, findingKey, findingSignature } from './components/DoseExpectation.jsx';

// src/components/ReadingConfirmation.jsx
export { readingVerdict } from './components/ReadingConfirmation.jsx';

// src/components/ReadingContext.jsx
export { buildReadingSeries, readingGeometry } from './components/ReadingContext.jsx';

// src/components/ZoomableChart.jsx
export { niceAxis } from './components/ZoomableChart.jsx';

// src/lib/analytics/calcification.js
export { ARAGONITE_DENSITY, CACO3_MOLAR_MASS, computeSkeletonMass } from './lib/analytics/calcification.js';

// src/lib/analytics/consumption.js
export {
  computeConsumption,
  computeElementConsumption,
  CONSUMPTION_RULES,
  DOSE_ELEMENTS,
  predictAfterChange,
} from './lib/analytics/consumption.js';

// src/lib/analytics/correction.js
export { computeCorrection, CORRECTIONS, fmtDoseMass } from './lib/analytics/correction.js';

// src/lib/analytics/demand.js
export { computeDemandSeries, DEMAND_SERIES } from './lib/analytics/demand.js';

// src/lib/analytics/dose-strength.js
export { calibrateDoseStrength } from './lib/analytics/dose-strength.js';

// src/lib/analytics/drift.js
export {
  assessDrift,
  CA_PER_DKH_HI,
  CA_PER_DKH_LO,
  computeDoseAdvice,
  computeDoseCalc,
  computeIonicBalance,
  DOSE_ADVICE_RULES,
  DRIFT_GUIDE,
} from './lib/analytics/drift.js';

// src/lib/analytics/icp-calibration.js
export { computeCalibration, ICP_ALIASES, ICP_CONVERSIONS, labValueFor } from './lib/analytics/icp-calibration.js';

// src/lib/analytics/icp-data.js
export { ICP_SEED } from './lib/analytics/icp-data.js';

// src/lib/analytics/icp-reference.js
export {
  computeIcpTrends,
  ICP_GROUPS,
  ICP_REFERENCE,
  icpGroupOf,
  icpRef,
  icpStatus,
} from './lib/analytics/icp-reference.js';

// src/lib/analytics/measurement-noise.js
export { KIT_SIGMA, kitSigma, regressionWithError } from './lib/analytics/measurement-noise.js';

// src/lib/analytics/nutrients.js
export { computeNutrientProduction, computeNutrientRatio } from './lib/analytics/nutrients.js';

// src/lib/analytics/rate-analysis.js
export { computeRates, RATE_RULES, rateNarrative } from './lib/analytics/rate-analysis.js';

// src/lib/analytics/reading-meaning.js
export { computeControl, paramContext } from './lib/analytics/reading-meaning.js';

// src/lib/analytics/safe-rate.js
export { CORRECTION_MAX_RATE, SAFE_DAILY_RISE, safeDoseBand } from './lib/analytics/safe-rate.js';

// src/lib/analytics/salt-baseline.js
export { computeSaltComparison, SALT_MIX } from './lib/analytics/salt-baseline.js';

// src/lib/analytics/time-in-range.js
export {
  CONSISTENCY_RULES,
  fmtAmount,
  fmtVal,
  percentile,
  ROUND_STEP,
  roundTo,
} from './lib/analytics/time-in-range.js';

// src/lib/analytics/time-of-day.js
export {
  addDays,
  byNewest,
  byOldest,
  dayPos,
  fmtTime,
  minutesOf,
  nowTime,
  regressionSlope,
  windowRows,
} from './lib/analytics/time-of-day.js';

// src/lib/analytics/water-changes.js
export {
  DAY_NUM_CACHE,
  dayNum,
  DEFAULT_SETTINGS,
  fmtFriendly,
  LIGHTING_SEED,
  WATER_CHANGE_LITRES,
  WATER_CHANGE_SEED,
} from './lib/analytics/water-changes.js';

// src/lib/backup.jsx
export {
  BACKUP_KEYS,
  BACKUP_LABELS,
  buildBackup,
  downloadCsv,
  downloadJson,
  inspectBackup,
  pinReasonLabel,
  requestPersistence,
  restoreBackup,
  useEscape,
} from './lib/backup.jsx';

// src/lib/constants.js
export { NAV, PARAM_DEFS, uid } from './lib/constants.js';

// src/lib/dates.js
export {
  addDaysFromToday,
  daysBetween,
  fmtDate,
  fmtShort,
  isoLocal,
  paramStatus,
  parseLocal,
  STATUS_COLOR,
  todayStr,
} from './lib/dates.js';

// src/lib/dosing/alkalinity.js
export {
  ALK_EARLY_HOURS,
  ALK_SETTLE_HOURS,
  ALK_TREND,
  alkAnomaly,
  alkBandOf,
  alkEffectPerMl,
  alkFit,
  alkIntervals,
  alkStamp,
  applyDoseConstraints,
  assessAlkalinity,
  directionConsistent,
  noteCurrentAndInterventions,
  rateLimitDose,
  solveAlkEffect,
  STAMP_CACHE,
  trendConfirmed,
} from './lib/dosing/alkalinity.js';

// src/lib/dosing/calcium.js
export {
  assessCalcium,
  CA_SETTLE_DAYS,
  CA_TREND,
  caBandOf,
  caEffectPerMl,
  pickTrendWindow,
  repeatedCorrections,
  SLOW_SOLVERS,
  solveCaEffect,
  solveSlowEffect,
} from './lib/dosing/calcium.js';

// src/lib/dosing/corrected-strength.js
export { findingsFor, previewStrengthChange } from './lib/dosing/corrected-strength.js';

// src/lib/dosing/helpers.js
export {
  assessMagnesium,
  BRACKET_MEMORY_DAYS,
  bracketDose,
  canLowerByDose,
  capDoseStep,
  CORRECTION_PACE,
  correctionPlanFor,
  correctionProgress,
  DOSE_DRIFT_TRIGGER,
  DOSE_STEP_CAP,
  doseDriftedFrom,
  doseObservations,
  dosePlausible,
  mgBandOf,
  mgEffectPerMl,
  pendingCorrection,
  proposeCorrection,
  solveMgEffect,
} from './lib/dosing/helpers.js';

// src/lib/dosing/magnesium.js
export { MG_SETTLE_DAYS, MG_TREND, STRENGTH_RANGE, strengthPlausible } from './lib/dosing/magnesium.js';

// src/lib/dosing/state.js
export { doseStatus, ratePhrase } from './lib/dosing/state.js';

// src/lib/export-csv.js
export { buildCsv } from './lib/export-csv.js';

// src/lib/findings.js
export {
  buildFindings,
  directional,
  DOSED_ELEMENTS,
  KIT_PRECISION,
  kitNoise,
  SAFE_BOUNDS,
  settleWindow,
} from './lib/findings.js';

// src/lib/image-compression.js
export { compressImage } from './lib/image-compression.js';

// src/lib/narrative-engine.js
export {
  buildBriefing,
  buildHeadline,
  buildOverview,
  CORRECTION_STATES,
  explainScore,
  findingGist,
  firstSentence,
  isCorrectionState,
  joinList,
  safetyCapFor,
  sentenceCase,
  stripDrawable,
} from './lib/narrative-engine.js';

// src/lib/reminders.js
export {
  autoCompletions,
  computeReminders,
  intervalLabel,
  projectOccurrences,
  REMINDER_GROUPS,
  REMINDER_SEED,
  reminderState,
} from './lib/reminders.js';

// src/lib/seed-data.js
export { HISTORICAL_DATA } from './lib/seed-data.js';

// src/lib/stability-engine.js
export { computeStability, gradeSpread, STABILITY_COLOR, STABILITY_RULES } from './lib/stability-engine.js';

// src/lib/storage.js
export {
  isQuotaError,
  loadKey,
  LS_PREFIX,
  lsGet,
  lsSet,
  notify,
  onStorageError,
  onToast,
  saveKey,
} from './lib/storage.js';
