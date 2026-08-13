import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, FlaskConical, FileBarChart2, ListChecks, SunMedium,
  StickyNote, Images, Plus, Trash2, X, Waves, Bell,
  CheckCircle2, AlertTriangle, Upload, Check, ArrowUp, ArrowDown, Minus, RotateCcw,
  ChevronDown, ChevronUp, Settings2, Save, Activity, Scale, Beaker, Target, Gauge,
  Calculator, Download, Droplets
} from "lucide-react";

/* ---------------------------------- historical seed data ---------------------------------- */

const HISTORICAL_DATA = {"alkalinity":[{"date":"2026-08-09","value":9.3},{"date":"2026-08-08","value":9.2},{"date":"2026-08-06","value":9.0},{"date":"2026-08-05","value":9.0},{"date":"2026-08-04","value":9.0},{"date":"2026-08-02","value":8.7},{"date":"2026-08-01","value":8.7},{"date":"2026-07-30","value":8.7},{"date":"2026-07-28","value":8.6},{"date":"2026-07-27","value":8.6},{"date":"2026-07-25","value":8.9},{"date":"2026-07-23","value":8.9},{"date":"2026-07-21","value":8.9},{"date":"2026-07-20","value":8.7},{"date":"2026-07-19","value":8.9},{"date":"2026-07-18","value":8.8},{"date":"2026-07-17","value":8.6},{"date":"2026-07-16","value":8.6},{"date":"2026-07-14","value":9.1},{"date":"2026-07-13","value":9.1},{"date":"2026-07-12","value":9.2},{"date":"2026-07-11","value":9.3},{"date":"2026-07-10","value":9.6},{"date":"2026-07-09","value":9.5},{"date":"2026-07-08","value":9.8},{"date":"2026-07-07","value":9.2},{"date":"2026-07-06","value":9.0},{"date":"2026-07-05","value":9.4},{"date":"2026-07-04","value":9.2},{"date":"2026-07-03","value":9.0},{"date":"2026-07-02","value":9.0},{"date":"2026-07-01","value":9.3},{"date":"2026-06-30","value":9.3},{"date":"2026-06-29","value":9.3},{"date":"2026-06-28","value":9.4},{"date":"2026-06-27","value":9.5},{"date":"2026-06-26","value":9.6},{"date":"2026-06-25","value":9.7},{"date":"2026-06-24","value":9.5},{"date":"2026-06-23","value":9.4},{"date":"2026-06-22","value":9.5},{"date":"2026-06-21","value":9.5},{"date":"2026-06-20","value":9.2},{"date":"2026-06-18","value":9.2},{"date":"2026-06-17","value":9.1},{"date":"2026-06-15","value":8.9},{"date":"2026-06-14","value":9.0},{"date":"2026-06-12","value":9.2},{"date":"2026-06-10","value":9.3},{"date":"2026-06-08","value":9.3},{"date":"2026-06-07","value":9.5},{"date":"2026-06-06","value":9.4},{"date":"2026-06-03","value":9.0},{"date":"2026-06-02","value":8.8},{"date":"2026-06-01","value":9.0},{"date":"2026-05-30","value":8.9},{"date":"2026-05-28","value":8.9},{"date":"2026-05-26","value":9.1},{"date":"2026-05-25","value":9.1},{"date":"2026-05-24","value":10.0},{"date":"2026-05-23","value":9.9},{"date":"2026-05-22","value":9.8},{"date":"2026-05-21","value":9.5},{"date":"2026-05-20","value":9.6},{"date":"2026-05-19","value":9.6},{"date":"2026-05-18","value":9.4},{"date":"2026-05-17","value":9.6},{"date":"2026-05-16","value":9.7},{"date":"2026-05-15","value":10.0},{"date":"2026-05-14","value":10.0},{"date":"2026-05-13","value":10.2},{"date":"2026-05-12","value":10.4},{"date":"2026-05-11","value":10.4},{"date":"2026-05-10","value":9.9},{"date":"2026-05-08","value":9.6},{"date":"2026-05-07","value":9.4},{"date":"2026-05-06","value":9.4},{"date":"2026-05-05","value":9.3},{"date":"2026-05-04","value":9.3}],"calcium":[{"date":"2026-08-04","value":430},{"date":"2026-07-27","value":440},{"date":"2026-07-20","value":460},{"date":"2026-07-19","value":450},{"date":"2026-07-13","value":460},{"date":"2026-07-06","value":460},{"date":"2026-06-29","value":445},{"date":"2026-06-24","value":450},{"date":"2026-06-21","value":450},{"date":"2026-06-17","value":450},{"date":"2026-06-15","value":470},{"date":"2026-06-14","value":470},{"date":"2026-06-08","value":500},{"date":"2026-06-07","value":490},{"date":"2026-05-30","value":465},{"date":"2026-05-24","value":450},{"date":"2026-05-22","value":495},{"date":"2026-05-18","value":490},{"date":"2026-05-14","value":485},{"date":"2026-05-10","value":450},{"date":"2026-05-06","value":445},{"date":"2026-05-03","value":455},{"date":"2026-04-30","value":440},{"date":"2026-04-28","value":455},{"date":"2026-04-27","value":405},{"date":"2026-04-25","value":445},{"date":"2026-04-23","value":470},{"date":"2026-04-19","value":485},{"date":"2026-04-18","value":435},{"date":"2026-04-11","value":415},{"date":"2026-04-06","value":420},{"date":"2026-04-04","value":450},{"date":"2026-04-01","value":440},{"date":"2026-03-30","value":435},{"date":"2026-03-29","value":425},{"date":"2026-03-26","value":425},{"date":"2026-03-24","value":440},{"date":"2026-03-23","value":450},{"date":"2026-03-22","value":450}],"magnesium":[{"date":"2026-08-04","value":1520},{"date":"2026-07-27","value":1560},{"date":"2026-07-20","value":1560},{"date":"2026-07-19","value":1560},{"date":"2026-07-13","value":1520},{"date":"2026-07-06","value":1520},{"date":"2026-07-01","value":1500},{"date":"2026-06-29","value":1400},{"date":"2026-06-26","value":1400},{"date":"2026-06-21","value":1400},{"date":"2026-06-17","value":1400},{"date":"2026-06-15","value":1400},{"date":"2026-06-08","value":1400},{"date":"2026-06-07","value":1360},{"date":"2026-05-30","value":1290},{"date":"2026-05-24","value":1350},{"date":"2026-05-22","value":1320},{"date":"2026-05-15","value":1350},{"date":"2026-05-10","value":1350},{"date":"2026-05-06","value":1350},{"date":"2026-05-03","value":1350},{"date":"2026-04-30","value":1350},{"date":"2026-04-27","value":1380},{"date":"2026-04-25","value":1320},{"date":"2026-04-23","value":1380},{"date":"2026-04-18","value":1395},{"date":"2026-04-11","value":1455},{"date":"2026-04-09","value":1455},{"date":"2026-04-06","value":1270},{"date":"2026-04-04","value":1260},{"date":"2026-03-31","value":1305},{"date":"2026-03-24","value":1330},{"date":"2026-03-23","value":1290},{"date":"2026-03-21","value":1305},{"date":"2026-03-20","value":1320},{"date":"2026-03-19","value":1260},{"date":"2026-03-17","value":1290},{"date":"2026-03-14","value":1290},{"date":"2026-03-10","value":1230},{"date":"2026-03-09","value":1230}],"nitrate":[{"date":"2026-08-04","value":11.3},{"date":"2026-07-27","value":13.5},{"date":"2026-07-20","value":10.9},{"date":"2026-07-13","value":13.7},{"date":"2026-07-06","value":12.6},{"date":"2026-06-29","value":13.0},{"date":"2026-06-21","value":12.0},{"date":"2026-06-15","value":11.3},{"date":"2026-06-08","value":12.6},{"date":"2026-05-30","value":11.7},{"date":"2026-05-23","value":9.5},{"date":"2026-05-17","value":9.4},{"date":"2026-05-10","value":9.9},{"date":"2026-05-04","value":10.6},{"date":"2026-04-28","value":9.6},{"date":"2026-04-24","value":10.1},{"date":"2026-04-17","value":12.1},{"date":"2026-04-11","value":12.2},{"date":"2026-04-06","value":11.9},{"date":"2026-03-31","value":10.0},{"date":"2026-03-28","value":12.2},{"date":"2026-03-26","value":11.5},{"date":"2026-03-24","value":8.5},{"date":"2026-03-20","value":11.8},{"date":"2026-03-19","value":11.5},{"date":"2026-03-18","value":10.5},{"date":"2026-03-17","value":12.0},{"date":"2026-03-16","value":11.7},{"date":"2026-03-15","value":11.9},{"date":"2026-03-13","value":11.8},{"date":"2026-03-11","value":10.5},{"date":"2026-03-10","value":12.8},{"date":"2026-03-09","value":12.2},{"date":"2026-03-07","value":12.8},{"date":"2026-03-05","value":10.1},{"date":"2026-03-04","value":13.1},{"date":"2026-02-19","value":8.7},{"date":"2026-02-18","value":11.8},{"date":"2026-02-17","value":10.4},{"date":"2026-02-13","value":9.2}],"phosphate":[{"date":"2026-08-04","value":0.12},{"date":"2026-08-02","value":0.12},{"date":"2026-07-30","value":0.15},{"date":"2026-07-27","value":0.19},{"date":"2026-07-23","value":0.16},{"date":"2026-07-18","value":0.12},{"date":"2026-07-16","value":0.14},{"date":"2026-07-14","value":0.11},{"date":"2026-07-13","value":0.14},{"date":"2026-07-12","value":0.1},{"date":"2026-07-11","value":0.13},{"date":"2026-07-10","value":0.23},{"date":"2026-07-09","value":0.16},{"date":"2026-07-08","value":0.15},{"date":"2026-07-07","value":0.07},{"date":"2026-07-06","value":0.09},{"date":"2026-07-05","value":0.11},{"date":"2026-07-04","value":0.17},{"date":"2026-07-03","value":0.08},{"date":"2026-07-02","value":0.1},{"date":"2026-07-01","value":0.12},{"date":"2026-06-30","value":0.1},{"date":"2026-06-29","value":0.1},{"date":"2026-06-28","value":0.11},{"date":"2026-06-27","value":0.09},{"date":"2026-06-26","value":0.09},{"date":"2026-06-25","value":0.11},{"date":"2026-06-24","value":0.08},{"date":"2026-06-23","value":0.06},{"date":"2026-06-22","value":0.07},{"date":"2026-06-21","value":0.07},{"date":"2026-06-20","value":0.09},{"date":"2026-06-19","value":0.04},{"date":"2026-06-18","value":0.08},{"date":"2026-06-15","value":0.06},{"date":"2026-06-14","value":0.06},{"date":"2026-06-12","value":0.05},{"date":"2026-06-10","value":0.06},{"date":"2026-06-08","value":0.09},{"date":"2026-06-06","value":0.06},{"date":"2026-06-01","value":0.06},{"date":"2026-05-29","value":0.06},{"date":"2026-05-24","value":0.09},{"date":"2026-05-23","value":0.08},{"date":"2026-05-22","value":0.1},{"date":"2026-05-21","value":0.16},{"date":"2026-05-20","value":0.14},{"date":"2026-05-19","value":0.14},{"date":"2026-05-18","value":0.15},{"date":"2026-05-17","value":0.13},{"date":"2026-05-16","value":0.13},{"date":"2026-05-15","value":0.13},{"date":"2026-05-14","value":0.12},{"date":"2026-05-13","value":0.1},{"date":"2026-05-12","value":0.11},{"date":"2026-05-11","value":0.12},{"date":"2026-05-10","value":0.11},{"date":"2026-05-08","value":0.18},{"date":"2026-05-07","value":0.09},{"date":"2026-05-06","value":0.07},{"date":"2026-05-05","value":0.095},{"date":"2026-05-04","value":0.1},{"date":"2026-05-01","value":0.14},{"date":"2026-04-30","value":0.05},{"date":"2026-04-29","value":0.03},{"date":"2026-04-28","value":0.04},{"date":"2026-04-26","value":0.01},{"date":"2026-04-25","value":0.03},{"date":"2026-04-24","value":0.01},{"date":"2026-04-22","value":0.06},{"date":"2026-04-21","value":0.06},{"date":"2026-04-20","value":0.01},{"date":"2026-04-19","value":0.01},{"date":"2026-04-18","value":0.03},{"date":"2026-04-17","value":0.02},{"date":"2026-04-15","value":0.05},{"date":"2026-04-13","value":0.05},{"date":"2026-04-12","value":0.07},{"date":"2026-04-11","value":0.04},{"date":"2026-04-09","value":0.07},{"date":"2026-04-06","value":0.11},{"date":"2026-04-04","value":0.07},{"date":"2026-04-03","value":0.07},{"date":"2026-04-02","value":0.08},{"date":"2026-04-01","value":0.05},{"date":"2026-03-31","value":0.05},{"date":"2026-03-30","value":0.1},{"date":"2026-03-29","value":0.07},{"date":"2026-03-28","value":0.08},{"date":"2026-03-27","value":0.08},{"date":"2026-03-26","value":0.03},{"date":"2026-03-24","value":0.08},{"date":"2026-03-22","value":0.14},{"date":"2026-03-20","value":0.09},{"date":"2026-03-19","value":0.08},{"date":"2026-03-18","value":0.1},{"date":"2026-03-17","value":0.11},{"date":"2026-03-16","value":0.12},{"date":"2026-03-15","value":0.12},{"date":"2026-03-13","value":0.1}],"potassium":[{"date":"2026-07-20","value":420},{"date":"2026-07-06","value":410},{"date":"2026-07-01","value":405},{"date":"2026-06-29","value":390},{"date":"2026-06-26","value":390},{"date":"2026-06-15","value":400},{"date":"2026-06-08","value":410},{"date":"2026-05-30","value":410},{"date":"2026-05-22","value":410},{"date":"2026-05-17","value":390},{"date":"2026-05-15","value":370},{"date":"2026-05-06","value":380}],"ph":[{"date":"2026-06-29","value":8.0},{"date":"2026-06-15","value":8.1},{"date":"2026-06-08","value":8.1},{"date":"2026-05-30","value":8.1},{"date":"2026-04-30","value":8.2},{"date":"2026-04-11","value":8.1},{"date":"2026-04-01","value":8.0},{"date":"2026-03-24","value":8.0},{"date":"2026-03-23","value":8.1},{"date":"2026-03-20","value":8.1},{"date":"2026-03-19","value":8.1},{"date":"2026-03-18","value":8.1},{"date":"2026-03-17","value":8.1},{"date":"2026-03-11","value":8.2},{"date":"2026-03-09","value":8.2}]};

/* ---------------------------------- constants ---------------------------------- */

const PARAM_DEFS = [
  { key: "alkalinity", label: "Alkalinity", unit: "dKH", min: 8.5, max: 9.5, step: 0.1, freqDays: 2, color: "#0B7C86" },
  { key: "salinity", label: "Salinity", unit: "ppt", min: 34, max: 36, step: 0.1, freqDays: 3, color: "#1D6FA5" },
  { key: "calcium", label: "Calcium", unit: "ppm", min: 450, max: 500, step: 1, freqDays: 7, color: "#D9631F" },
  { key: "magnesium", label: "Magnesium", unit: "ppm", min: 1450, max: 1500, step: 1, freqDays: 7, color: "#7B4FCB" },
    /* Potassium is slow-moving and monthly-tested. 380-420 is all comfortable
     territory, so the band is wide and the cadence is 30 days rather than 7. */
  { key: "potassium", label: "Potassium", unit: "ppm", min: 380, max: 420, step: 5, freqDays: 30, color: "#B8860B" },
  { key: "phosphate", label: "Phosphate", unit: "ppm", min: 0.07, max: 0.15, step: 0.01, freqDays: 7, color: "#C4285B" },
  { key: "nitrate", label: "Nitrate", unit: "ppm", min: 9, max: 15, step: 0.1, freqDays: 7, color: "#2E8B57" },
  { key: "ammonia", label: "Ammonia", unit: "ppm", min: 0, max: 0.25, step: 0.01, freqDays: null, color: "#D0342C", idealAt: "min" },
  { key: "ph", label: "pH", unit: "", min: 7.8, max: 8.4, step: 0.01, freqDays: null, color: "#2AA7B0" },
];

const DEFAULT_TASKS = [
  { id: "waterchange", label: "Water change", freqDays: 7, builtin: true, needsVolume: true },
  { id: "carbon", label: "Replace carbon", freqDays: 28, builtin: true },
  { id: "purigen", label: "Replace Purigen", freqDays: 28, builtin: true },
  { id: "icp", label: "Send ICP test", freqDays: 42, builtin: true },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "log", label: "Test Lab", icon: FlaskConical },
  { id: "dosing", label: "Dosing", icon: Beaker },
  { id: "insights", label: "Insights", icon: Activity },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "setup", label: "Setup", icon: Settings2 },
];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
/* --- Local dates ---
 *
 * toISOString() returns UTC. At 9am in Sydney it is still the previous day in
 * UTC, so the app believed "today" was yesterday: a reminder due today read as
 * "in 1 day", and adding days to a date could land a day short. Every date in
 * this app is a calendar day in the user's own timezone, so they are formatted
 * and parsed locally throughout.
 */
const isoLocal = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const parseLocal = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const todayStr = () => isoLocal(new Date());
/* Shorthand for "n days from today", in local terms. */
const addDaysFromToday = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return isoLocal(x); };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
const fmtShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

function paramStatus(def, value) {
  if (value == null || isNaN(value)) return "unknown";
  if (value < def.min) return "low";
  if (value > def.max) return "high";
  return "ok";
}

const STATUS_COLOR = { ok: "#0B7C86", low: "#B8860B", high: "#C4285B", unknown: "#9FB0AE" };

/* ---------------------------------- stability engine ---------------------------------- */
/*
 * Rate-of-change based stability scoring.
 *
 * Rationale (from reef husbandry consensus): corals respond to the RATE parameters
 * move, not the absolute number. A tank held steady slightly outside "ideal" reliably
 * outperforms one that bounces through perfect values. Published survival data shows
 * alkalinity held within ~0.2 dKH/day correlating with far better long-term SPS
 * outcomes than +/-1.0 dKH daily swings.
 *
 * We normalise every change to a PER-DAY rate so the score is independent of how
 * often testing happens. `perUnit` sets whether thresholds are absolute or percentage.
 * `noiseFloor` prevents ordinary test-kit resolution (e.g. a single Salifert increment)
 * from ever scoring as instability on its own.
 */

const STABILITY_RULES = {
  alkalinity: { windowDays: 14, greenPerDay: 0.2, amberPerDay: 0.5, mode: "absolute", noiseFloor: 0.1, unit: "dKH" },
  calcium:    { windowDays: 28, greenPerDay: 20 / 7, amberPerDay: 40 / 7, mode: "absolute", noiseFloor: 10, unit: "ppm", displayPer: "week" },
  magnesium:  { windowDays: 28, greenPerDay: 40 / 7, amberPerDay: 80 / 7, mode: "absolute", noiseFloor: 30, unit: "ppm", displayPer: "week" },
  salinity:   { windowDays: 14, greenPerDay: 0.3 / 7, amberPerDay: 0.6 / 7, mode: "absolute", noiseFloor: 0.2, unit: "ppt", displayPer: "week" },
  /* Monthly testing means a 90-day window, and hobby potassium kits are only
     good to about 20 ppm, so movement below that is measurement noise. */
  potassium:  { windowDays: 90, greenPerDay: 40 / 30, amberPerDay: 70 / 30, mode: "absolute", noiseFloor: 20, unit: "ppm", displayPer: "month" },
  phosphate:  { windowDays: 14, greenPerDay: 40 / 7, amberPerDay: 70 / 7, mode: "percent", noiseFloor: 0.02, unit: "%", displayPer: "week" },
  nitrate:    { windowDays: 28, greenPerDay: 25 / 7, amberPerDay: 50 / 7, mode: "percent", noiseFloor: 1.0, unit: "%", displayPer: "week" },
  ph:         { windowDays: 28, greenPerDay: 0.05, amberPerDay: 0.1, mode: "absolute", noiseFloor: 0.1, unit: "" },
};

/* Stability is derived from the same spread-based engine as Control &
   alignment, so the two can never contradict each other. The previous
   version divided each change by elapsed days, which turned a 10 ppm
   difference between two readings a day apart into "70 ppm/week" even
   though 10 ppm is calcium's own test resolution. */
/* Grade a set of readings by spread, using the same sourced per-parameter
   rules as Control & alignment. Shared so the windowed and fallback paths
   can never diverge. */
function gradeSpread(def, rows) {
  if (!rows || rows.length < 2) return null;
  const cr = CONSISTENCY_RULES[def.key];
  if (!cr) return null;
  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const p05 = percentile(vals, 5), p95 = percentile(vals, 95);
  const spread = p95 - p05;
  let metric, metricLabel;
  if (cr.mode === "fold") {
    metric = p05 > 0 ? p95 / p05 : (p95 > 0 ? Infinity : 1);
    metricLabel = `${isFinite(metric) ? metric.toFixed(1) : "\u221E"}x swing`;
  } else {
    metric = spread;
    metricLabel = `${fmtVal(def, spread)}${cr.unit} spread`;
  }
  const consistency = metric <= cr.tight ? "tight" : metric <= cr.moderate ? "moderate" : "loose";
  return { metric, metricLabel, consistency, spread, p05, p95 };
}

function computeStability(def, readings) {
  const rule = STABILITY_RULES[def.key];
  if (!rule) return null;

  const all = readings.filter((r) => r.param === def.key)
    .sort(byOldest);
  if (all.length < 2) {
    return { grade: "unknown", label: "Not enough data", detail: `Need at least 2 readings`, rule, fmtRate: "\u2014" };
  }

  /* Prefer readings inside the parameter's own window. If testing has been
     less frequent than that, fall back to the most recent few and say so,
     rather than reporting nothing useful. */
  const cutoffDate = addDaysFromToday(-rule.windowDays);
  const inWindow = all.filter((r) => r.date >= cutoffDate);
  const stale = inWindow.length < 3;
  const useRows = stale ? all.slice(-4) : inWindow;

  const g = gradeSpread(def, useRows);
  if (!g) {
    return { grade: "unknown", label: "Not enough data", rule, fmtRate: "\u2014",
      detail: "Log another reading to establish a trend", readingCount: all.length,
      spread: 0, spanDays: 1, netChange: 0, typicalRate: 0, fmtRate: "\u2014",
      pattern: "flat", atResolution: false, maxDelta: 0 };
  }
  const c = g;

  // Largest single step, to spot movement that is only test resolution.
  let maxDelta = 0;
  for (let i = 1; i < useRows.length; i++) {
    maxDelta = Math.max(maxDelta, Math.abs(useRows[i].value - useRows[i - 1].value));
  }
  const atResolution = maxDelta <= rule.noiseFloor;

  // Is it travelling one way, or just moving back and forth?
  const netChange = useRows[useRows.length - 1].value - useRows[0].value;
  let totalMovement = 0;
  for (let i = 1; i < useRows.length; i++) totalMovement += Math.abs(useRows[i].value - useRows[i - 1].value);
  const directionality = totalMovement > 0 ? Math.abs(netChange) / totalMovement : 0;
  const pattern = totalMovement === 0 ? "flat"
    : directionality > 0.6 ? (netChange > 0 ? "trending up" : "trending down")
    : "oscillating";

  const grade = atResolution ? "green"
    : c.consistency === "tight" ? "green"
    : c.consistency === "moderate" ? "amber" : "red";

  const label = atResolution ? "At test resolution"
    : c.consistency === "tight" ? "Rock steady"
    : c.consistency === "moderate" ? "Some movement" : "Unstable";

  const spanDays = Math.max(1, daysBetween(useRows[0].date, useRows[useRows.length - 1].date));

  /* Spread between readings taken weeks apart cannot tell you how steady the
     parameter was in between, so it should not be graded as tight control. */
  const avgGap = spanDays / Math.max(1, useRows.length - 1);
  /* "Tested rarely" has to mean rarely FOR THIS PARAMETER. Alkalinity every
     8 days is sparse; nitrate every 8 days is a normal routine. Judging both
     against a flat 7-day rule downgraded perfectly well-run nutrients. */
  const expectedGap = Math.max(7, (def.freqDays || 7) * 2);
  const farApart = avgGap > expectedGap;
  const shownGrade = farApart && grade === "green" ? "amber" : grade;
  const shownLabel = farApart
    ? (grade === "green" ? "Steady, but tested rarely" : label)
    : label;

  return {
    grade: shownGrade, label: shownLabel, trueGrade: grade,
    farApart, avgGap,
    rule, pattern, netChange, spanDays,
    spread: c.spread, consistency: c.consistency, metricLabel: c.metricLabel,
    p05: c.p05, p95: c.p95,
    fmtRate: c.metricLabel || "not enough readings",
    typicalRate: Math.abs(netChange) / spanDays,
    readingCount: useRows.length,
    atResolution, maxDelta,
    stale,
    detail: `${c.metricLabel} · ${useRows.length} readings over ${spanDays}d${stale ? " (outside usual window)" : ""}${farApart ? ` · averaging ${Math.round(avgGap)}d apart, further apart than this parameter wants` : ""} · ${pattern}`,
  };
}

const STABILITY_COLOR = { green: "#0B7C86", amber: "#D98324", red: "#C4285B", unknown: "#9FB0AE" };

/* ---------------------------------- narrative overview engine ---------------------------------- */

/* "A and B and C" reads like a child's sentence; join lists properly. */
function joinList(items) {
  if (!items || !items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

/* Findings carry a full explanation; the assessment only needs its opening
   claim, with the rest available on the parameter card. */
function firstSentence(text) {
  if (!text) return "";
  /* Must not split on the decimal point in "22.4ppm", which is why a plain
     [^.!?] match was cutting sentences off after two characters. A sentence
     end is punctuation followed by a space or the end of the string. */
  const m = String(text).match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : String(text).slice(0, 150)).trim();
}

/* Titles are written lower-case for use mid-sentence; as a headline they need
   a capital. */
function sentenceCase(t) {
  const x = String(t || "").trim();
  if (!x) return x;
  /* "pH" is spelt that way; capitalising the first letter produced "PH is low
     while alkalinity is fine". Any word whose second letter is already capital
     is left alone. */
  if (/^[a-z][A-Z]/.test(x)) return x;
  return x[0].toUpperCase() + x.slice(1);
}


/* ===========================================================================
   buildBriefing — the tank summary as claims rather than paragraphs
   ===========================================================================
   The prose version ran to about 280 words in four paragraphs, and a paragraph
   turned out to be a container rather than an idea: one of them carried two
   unrelated stories (two elements parked off-target, and a third one climbing)
   glued together with no signal that they were separate. It also spent forty
   words describing a shape — "nine readings, a 0.7 dKH spread, climbing" —
   that a strip of pixels shows instantly, and it buried the single most useful
   line, what to do this week, at the bottom.

   This returns an ordered list of claims. Each carries a short assertion, one
   line of support, and optionally a strip to draw. Ordering is by what to do
   first, so the feed reads top-down as a priority list.

   It shares its inputs with the dosing engines and reads their doseStates
   directly, so a dose change in progress appears here in the same words the
   Dosing screen uses. That is the point: one question, one answer, wherever
   you are standing.
   ========================================================================= */

/* ===========================================================================
   explainScore — the working behind the number
   ===========================================================================
   The score was an assertion. Every other figure in the app can be
   interrogated; 80/100 could not.

   The obvious design — "calcium is costing you 2 points" — was tested and
   thrown out. Recomputing the score with one parameter made perfect moves it
   by only one or two points, because the weakest-link term is still dragged by
   whichever parameter is next worst. Those marginal costs summed to 5 against
   a shortfall of 20, so a breakdown built from them would have left fifteen
   points unexplained and looked authoritative while doing it.

   What is shown instead is the actual arithmetic: each parameter's two
   components, the average, the weakest link, and the blend. It adds up exactly
   because it is the calculation, not a story about it.
   ========================================================================= */
function explainScore(readings, latestByParam, defs, score) {
  /* No score, nothing to explain. The card would otherwise show a full
     derivation — average, weakest link, a total — for a number it is not
     displaying, because the tank has too little recent history to be scored
     at all. */
  if (score == null) return null;
  const parts = [];
  for (const def of defs) {
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const stab = computeStability(def, readings);

    /* Must mirror the score exactly, including parameters with no usable
       stability yet — those count as 0.7 rather than being left out. Skipping
       them here made the stated average drift from the real one. */
    const stabPt = !stab ? 0.7
      : stab.grade === "green" ? 1 : stab.grade === "amber" ? 0.55
      : stab.grade === "red" ? 0.15 : 0.7;

    const st = paramStatus(def, reading.value);
    let rangePt = 1;
    if (st !== "ok") {
      const width = Math.max(1e-9, def.max - def.min);
      const gap = reading.value > def.max ? reading.value - def.max : def.min - reading.value;
      const bands = gap / width;
      rangePt = bands <= 0.25 ? 0.78 : bands <= 0.75 ? 0.45 : bands <= 1.5 ? 0.2 : 0.03;
    }
    parts.push({
      key: def.key, label: def.label, def,
      stability: Math.round(stabPt * 100),
      range: Math.round(rangePt * 100),
      sub: Math.round((stabPt * 0.4 + rangePt * 0.6) * 100),
      /* Kept unrounded: averaging rounded figures drifts from the real score. */
      raw: stabPt * 0.4 + rangePt * 0.6,
      /* Which of the two is actually holding this parameter back — the single
         number hid that alkalinity's problem is movement while calcium's is
         position. */
      weakness: rangePt < stabPt ? "range" : stabPt < rangePt ? "stability" : null,
    });
  }
  if (!parts.length) return null;

  const raws = parts.map((p) => p.raw);
  const rawMean = raws.reduce((a, b) => a + b, 0) / raws.length;
  const rawWorst = Math.min(...raws);
  const blended = Math.round((rawMean * 0.6 + rawWorst * 0.4) * 100);

  const mean = Math.round(rawMean * 100);
  const worst = Math.round(rawWorst * 100);
  /* When everything scores the same there is no weakest link to name, and
     listing all seven reads as a fault report on a perfect tank. */
  const allEqual = parts.every((p) => Math.abs(p.raw - rawWorst) < 1e-9);
  const weakest = allEqual ? [] : parts.filter((p) => p.raw === rawWorst).map((p) => p.label);

  /* Decided by looking at ammonia, not by noticing the numbers disagree. The
     previous version inferred it from a mismatch, so a one-point rounding
     difference printed a warning about ammonia on tanks that have never had an
     ammonia reading. */
  const amDef = defs.find((d) => d.key === "ammonia");
  const amLast = latestByParam && latestByParam.ammonia;
  const ammoniaCap = !!(amDef && amLast && amLast.value > (amDef.step || 0.01) / 2);

  /* The score is also held down by how little data supports it — a ceiling the
     explanation never mentioned, which is most of why the stated arithmetic
     could land several points above the score shown. */
  const totalReadings = parts.reduce((n, p) =>
    n + readings.filter((r) => r.param === p.key).length, 0);
  const evidenceCap = parts.length < 3 || totalReadings < 12 ? 70
    : totalReadings < 30 ? 85 : null;

  return {
    parts: parts.sort((a, b) => a.raw - b.raw),
    mean, worst, weakest, blended,
    capped: ammoniaCap, evidenceCap, totalReadings,
    score,
  };
}


/* ===========================================================================
   buildHeadline — one line describing the whole tank
   ===========================================================================
   The old headline named a single metric: "Calcium dose could change". Useful,
   but it is a finding, not an assessment — it says nothing about the other six
   parameters, so a tank with one dose tweak and a tank in real trouble could
   read identically.

   Writing a hundred fixed sentences was the obvious approach and the wrong
   one: each would have to be checked by hand against the state that triggers
   it, and any drift between the two produces a confident, false headline.
   Instead this composes from two halves, each chosen by an explicit condition
   — a state clause and a qualifier. Around fifteen states against a dozen
   qualifiers gives well over a hundred distinct lines, and every one is
   accurate by construction because each half is only ever emitted when its own
   condition holds.
   ========================================================================= */
function buildHeadline(ctx) {
  const { total, inRange, steady, urgent, offSteady, drifting,
          settling, dueTests, suggested, missed, thinData, staleCount,
          urgentTitle, watching } = ctx;

  if (!total) return "Nothing logged yet";
  if (thinData) {
    return staleCount
      ? "Too little recent history to judge the tank"
      : "Early days — not enough history to read a trend yet";
  }

  /* ---- The state clause: what the tank is, overall ---------------------- */
  const allIn = inRange === total;
  const allSteady = steady === total;
  const mostIn = inRange >= Math.ceil(total * 0.75);
  const mostSteady = steady >= Math.ceil(total * 0.75);
  const halfOut = inRange <= Math.floor(total * 0.5);

  let state;
  /* Urgency used to end the sentence, which made three quarters of all tanks
     read identically and said nothing about the other six parameters. Naming
     what is wrong is both more accurate and more varied. */
  if (urgent >= 2) state = `${urgent} things need attention now`;
  else if (urgent === 1) state = urgentTitle
    ? sentenceCase(urgentTitle)
    : "One thing needs attention now";
  /* "Everything is in range and holding" while a claim underneath says
     phosphate is heading out of range is a straight contradiction. A
     watch-level finding means something is worth knowing, whatever the
     snapshot says. */
  else if (allIn && allSteady && !watching) state = "Everything is in range and holding";
  else if (allIn && allSteady) state = "All in range today, with something worth watching";
  else if (allIn && mostSteady) state = "All in range, and mostly holding steady";
  else if (allIn) state = "All in range, but not all of it settled";
  else if (allSteady && halfOut) state = "Rock steady, but a lot of it is off-target";
  else if (allSteady) state = "Steady throughout, with a few sitting off-target";
  else if (mostIn && mostSteady) state = "Mostly stable and in range";
  else if (mostIn && drifting >= 2) state = "Mostly in range, but several are moving";
  else if (mostIn) state = "Mostly in range, with some movement";
  else if (mostSteady && halfOut) state = "Held steady, but held in the wrong place";
  else if (mostSteady) state = "Fairly steady, with several off-target";
  else if (halfOut && drifting >= 2) state = "Unsettled — several are off-target and moving";
  else if (halfOut) state = "A good part of the tank is off-target";
  else state = "Mixed picture across the tank";

  /* ---- The qualifier: what that means for you today -------------------- */
  let qualifier = null;
  /* With something urgent named, the qualifier says how the rest of the tank
     is doing — which is the question the headline is supposed to answer. */
  if (urgent) {
    qualifier = allIn && allSteady ? "everything else is in range and holding"
      : mostIn && mostSteady ? "the rest is mostly stable"
      : halfOut ? "and a good part of the rest is off-target"
      : drifting >= 2 ? "and several others are moving"
      : offSteady >= 1 ? "the rest is steady, some off-target"
      : "the rest looks alright";
  }
  else if (missed) qualifier = missed === 1
    ? "one dose change did not land as expected"
    : `${missed} dose changes did not land as expected`;
  else if (dueTests) qualifier = dueTests === 1
    ? "one dose is waiting on a test to confirm it"
    : `${dueTests} doses are waiting on tests to confirm them`;
  else if (settling) qualifier = settling === 1
    ? "a dose change is still settling"
    : `${settling} dose changes are still settling`;
  else if (suggested) qualifier = suggested === 1
    ? "one dose could change"
    : `${suggested} doses could change`;
  else if (staleCount) qualifier = staleCount === 1
    ? "one reading is getting old"
    : `${staleCount} readings are getting old`;
  else if (drifting === 1) qualifier = "one parameter to keep an eye on";
  else if (drifting > 1) qualifier = `${drifting} parameters to keep an eye on`;
  else if (offSteady === 1) qualifier = "one sitting off-target but going nowhere";
  else if (offSteady > 1) qualifier = `${offSteady} sitting off-target but going nowhere`;
  else if (allIn && allSteady && !watching) qualifier = "nothing needs doing";

  if (!qualifier) return state;
  /* Some state clauses already contain a dash. A second one turns the line
     into a list of fragments. */
  const joiner = state.includes("\u2014") ? "; " : " \u2014 ";
  const q = qualifier.startsWith("and ") ? qualifier.slice(4) : qualifier;
  return `${state}${joiner}${q}`;
}


/* Where a finding says something is heading is usually its second sentence —
   "at that pace it reaches the top of your range in roughly 34 days" — and
   taking only the first threw away the useful half. Two sentences, never the
   whole essay: the rest is reasoning that belongs on the parameter card. */
function findingGist(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/);
  const first = parts[0] || "";
  const second = parts[1] || "";
  /* Only carry the second when it says where this is going or when it lands. */
  const projects = /\b(reach|reaches|hit|hits|in roughly|in about|within|by the time|at that pace|settle|settles|end up)\b/i.test(second);
  return projects ? `${first} ${second}`.trim() : first;
}


/* Whether a stability strip can be drawn for a parameter at all. Checked
   before asking for one, because a strip that returns null leaves a gap that
   looks like a rendering fault. */
function stripDrawable(key, defs, readings) {
  const def = (defs || []).find((d) => d.key === key);
  if (!def) return false;
  const stab = computeStability(def, readings);
  return !!(stab && stab.p05 != null && stab.p95 != null);
}

function buildBriefing(readings, latestByParam, defs, findings, doseStates, opts) {
  const claims = [];
  const o = opts || {};
  const hidden = o.dismissed || {};
  /* Three kinds of claim, and only one of them should be dismissible.
       - Urgent: never. Hiding "ammonia is dangerously high" is the one thing
         the summary must not allow.
       - Needs an action the app can take you to: never, because acting on it
         clears it anyway, and hiding it just loses the job.
       - Everything else: yes, but as a snooze rather than a delete. The key
         carries the numbers behind the claim, so a material change brings it
         straight back rather than leaving you blind to it. */
  /* A hidden claim is still built, then flagged — not skipped. Skipping it
     meant it never reserved its parameter, so hiding "calcium is parked
     off-target" could make a different claim about calcium appear in its
     place, and the count of hidden notes was taken from a list that did not
     match what was actually on screen. Building everything and marking what to
     draw keeps the set of claims stable regardless of what is put away. */
  /* Identity and state are separate fields, and conflating them was the bug.
     A key of "drift|alkalinity|climbing|9.3" changes the moment a reading
     moves, so a claim you put away silently came back under a new key while
     the old one lingered in storage — the count went stale and it looked like
     a different claim had taken its place.

     dismissKey is now stable for the life of the claim; dismissSignature holds
     the facts that should bring it back. Storage maps one to the other, so a
     claim is hidden only while the situation it was hidden in still holds. */
  const add = (c) => {
    if (!c) return;
    if (c.dismissible && c.dismissKey) {
      const was = hidden[c.dismissKey];
      const sig = c.dismissSignature != null ? String(c.dismissSignature) : "";
      if (was != null && String(was.sig != null ? was.sig : was) === sig) c.hidden = true;
    }
    claims.push(c);
  };

  const analysed = defs.map((def) => {
    const reading = latestByParam[def.key];
    if (!reading) return null;
    const stab = computeStability(def, readings);
    return { def, reading, stab, status: paramStatus(def, reading.value) };
  }).filter(Boolean);

  const ds = (doseStates || []).filter(Boolean);

  /* ---- 1. Findings, all of them ----------------------------------------
     Only urgent findings used to reach the summary, so "phosphate is heading
     out of range" — which carries a projection of where it settles — existed
     on the parameter card and nowhere else. If a finding is worth raising at
     all it belongs where people look first. */
  const TONE_FOR = { act: "act", watch: "watch", info: "busy" };
  const RANK_FOR = { act: 0, watch: 4, info: 7 };
  for (const f of (findings || [])) {
    const single = f.params && f.params.length === 1 ? f.params[0] : null;
    add({
      id: "finding:" + f.id,
      tone: TONE_FOR[f.severity] || "watch",
      rank: RANK_FOR[f.severity] != null ? RANK_FOR[f.severity] : 5,
      claim: sentenceCase(f.title),
      support: sentenceCase(findingGist(f.detail)),
      goto: single ? { tab: "param", key: single } : null,
      /* Acute chemistry hazards only — ammonia, a parameter far outside its
         range. A calibration offset is serious but persistent, and refusing to
         let it be acknowledged just leaves a permanent line in the summary. */
      dismissible: !(f.severity === "act" && f.scope === "chemistry"),
      dismissKey: findingKey(f),
      dismissSignature: findingSignature(f),
      /* A strip only where one can actually be drawn. Ammonia has no
         stability rule — it should read zero, so the spread of its readings
         means nothing — and asking for one there rendered an empty gap. */
      strip: single && f.severity !== "info" && stripDrawable(single, defs, readings)
        ? { key: single } : null,
    });
  }

  /* ---- 2. Dose work in progress ----------------------------------------
     Stated before any observation about the parameter, because "it moved" is
     not news when you moved it. */
  /* A dose suggestion you have decided against should go away — but only
     until there is new evidence, which for a dose means the next test. Keying
     the snooze to the latest reading for that parameter makes it
     self-limiting: it cannot be hidden indefinitely without also stopping
     testing, and it returns the moment there is something new to judge it on.
     The recommended amount is in the key too, so a materially different
     suggestion comes back rather than inheriting an old decision.

     This is deliberately not a permanent "never tell me". Someone who is
     content running calcium at 430 does not want a suppressed warning, they
     want a different target — and the app already lets them set one. */
  /* The dose snooze is the one that genuinely should lift on the next test, so
     the reading's timestamp belongs in the signature — but the key stays
     stable so the count and the storage entry survive it. */
  const snoozeKey = (d) => `dose|${d.key}`;
  const snoozeSig = (d) => {
    const last = latestByParam[d.key];
    const stamp = last ? `${last.date}T${last.time || ""}` : "none";
    return `${stamp}|${d.short || d.headline || ""}`;
  };

  for (const d of ds) {
    /* When a finding already says this element is a long way out of range,
       a dose claim saying "the dose is right, the level is not" is the same
       news twice — and the finding is the better of the two, carrying the
       reading and the target. Only claims about the level are dropped; a real
       dose change, a settling one, or one awaiting a test still has something
       of its own to say. */
    if ((findings || []).some((f) => f.id === "far-out-" + d.key)
      && (d.state === "off-target" || d.state === "suggested")
      && /level is not|steady but/i.test(d.headline || "")) continue;

    if (d.state === "settling") {
      add({ id: "dose:" + d.key, tone: "busy", rank: 1,
        claim: `${sentenceCase(d.el)} dose changed — leave it alone`,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key } });
    } else if (d.state === "due") {
      add({ id: "dose:" + d.key, tone: "busy", rank: 1,
        claim: `${sentenceCase(d.el)} is ready to judge`,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "log", key: d.key } });
    } else if (d.state === "fell-short" || d.state === "overshot") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 1,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    } else if (d.state === "suggested") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 2,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    } else if (d.state === "off-target") {
      add({ id: "dose:" + d.key, tone: "warn", rank: 3,
        claim: d.headline,
        support: sentenceCase(firstSentence(d.detail)),
        goto: { tab: "dosing", key: d.key },
        /* The only dose state with nothing to do: the dose is right and the
           level is not, and nothing you add brings it down. */
        dismissible: true, snoozeUntilTest: true,
        dismissKey: snoozeKey(d), dismissSignature: snoozeSig(d) });
    }
  }

  const spokenFor = new Set();
  for (const c of claims) {
    if (c.goto && c.goto.tab === "param") spokenFor.add(c.goto.key);
    const el = c.id.split(":")[1];
    if (el) spokenFor.add(el);
  }

  /* ---- 3. Moving through the band rather than settling in it ------------
     The claim the old prose spent most of its words on. Here it is one line
     plus a strip, and only for parameters the dosing engine has not already
     accounted for. */
  const drifting = analysed.filter((x) =>
    x.stab && (x.stab.grade === "red" || x.stab.grade === "amber") && !spokenFor.has(x.def.key));
  for (const x of drifting.slice(0, 3)) {
    const dir = x.stab.pattern === "trending up" ? "climbing"
      : x.stab.pattern === "trending down" ? "falling" : "swinging";
    add({
      id: "drift:" + x.def.key, tone: x.stab.grade === "red" ? "warn" : "watch", rank: 4,
      claim: `${x.def.label} is ${dir}, not settling`,
      support: x.status === "ok"
        ? `Inside the band today, but passing through it rather than holding.`
        : `Outside the band and still moving.`,
      strip: { key: x.def.key },
      goto: { tab: "param", key: x.def.key },
      dismissible: true,
      dismissKey: `drift|${x.def.key}`,
      /* Direction and the graded band, not the raw reading: a single new test
         should not undo a decision, but a change of direction or of severity
         should. */
      dismissSignature: `${dir}|${x.status}`,
    });
  }

  /* ---- 4. Parked off-target but steady — grouped, never repeated -------- */
  const parked = analysed.filter((x) =>
    x.status !== "ok" && x.stab && x.stab.grade === "green" && !spokenFor.has(x.def.key));
  if (parked.length) {
    add({
      id: "parked", tone: "watch", rank: 5,
      claim: parked.length === 1
        ? `${parked[0].def.label} is parked off-target`
        : `${joinList(parked.map((x) => x.def.label))} are parked off-target`,
      support: parked.length === 1
        ? `Steady rather than drifting, so there is nothing to chase — water changes will bring it round.`
        : `Steady rather than drifting, so there is nothing to chase — water changes will bring them round.`,
      goto: parked.length === 1 ? { tab: "param", key: parked[0].def.key } : null,
      dismissible: true,
      dismissKey: "parked",
      dismissSignature: parked.map((x) => x.def.key).sort().join(","),
      facts: parked.map((x) => `${x.def.label} ${fmtVal(x.def, x.reading.value)}${x.def.unit}`),
    });
  }

  /* ---- 5. What is genuinely fine, in one line ---------------------------
     The count is of every parameter that is in range and holding, not of the
     ones left over after the claims above. Those were two different
     populations: the numerator dropped anything already mentioned while the
     denominator counted all of them, so a tank with five parameters in range
     could read "2 of 7". Being raised above for some other reason — a kit
     offset, say — does not stop a parameter being in range and steady. */
  /* Both sides of the ratio come from the parameters that can actually be
     judged on both counts. A single reading says nothing about holding, and
     ammonia has no steadiness rule at all, so counting them in the denominator
     understated how much of the tank was genuinely fine. */
  const judged = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  /* A parameter with a live claim against its level is not "in range and
     holding", whatever its grade says. Something heading out of range can
     still be inside the band and read green today, so without this the same
     screen said both "phosphate is heading out of range" and named phosphate
     among the ones that are fine. */
  const flaggedLevel = new Set();
  for (const c of claims) {
    const m = /^finding:(far-out-|heading-out-|salinity-off)/.exec(c.id);
    if (m && c.goto && c.goto.tab === "param") flaggedLevel.add(c.goto.key);
    if (c.id.startsWith("drift:")) flaggedLevel.add(c.id.slice(6));
    /* A dose claim wanting a change is a live objection to that element too.
       Calcium could be inside its band and graded green while the protocol
       said the dose no longer matches consumption, so the same screen listed
       calcium among the ones that are fine and asked you to change its dose. */
    if (c.id.startsWith("dose:")) flaggedLevel.add(c.id.slice(5));
  }
  const solid = judged.filter((x) =>
    x.status === "ok" && x.stab.grade === "green" && !flaggedLevel.has(x.def.key));
  if (solid.length >= 2) {
    /* Every parameter in the count is named. Listing only the unmentioned ones
       and finishing with "and others noted above" left the reader to work out
       which — the whole point of the line is to say what is fine, so it says
       all of it. A parameter raised above for some other reason is still in
       range and holding, and naming it here does not contradict that. */
    const named = solid;
    add({
      id: "solid", tone: "ok", rank: 8,
      claim: `${solid.length} of ${judged.length} are in range and holding`,
      /* "pH" is the one label that starts lower-case, so a list beginning with
         it opens the sentence in lower case. Prefixing keeps the parameter's
         own spelling intact rather than capitalising it wrongly. */
      support: (() => {
        const list = joinList(named.map((x) => x.def.label));
        /* "pH" is the one label that starts lower-case, so a list beginning
           with it would open the sentence in lower case. Prefixing keeps the
           parameter's own spelling rather than capitalising it wrongly. */
        return /^[a-z]/.test(list) ? `Holding: ${list}.` : `${list}.`;
      })(),
      dismissible: true,
      dismissKey: "solid",
      dismissSignature: `${solid.length}/${judged.length}`,
    });
  }

  claims.sort((a, b) => a.rank - b.rank);
  /* The hidden ones travel with the list so the caller can count them, but
     they are not part of the visible dozen. */
  const visible = claims.filter((c) => !c.hidden);
  const put_away = claims.filter((c) => c.hidden);
  /* Everything goes in the box — it is collapsed by default, so a long list
     costs nothing until it is asked for. */
  const out = visible.slice(0, o.limit || 12);
  out.hiddenCount = put_away.length;
  return out;
}

function buildOverview(readings, latestByParam, defs, findings, doseStates) {
  const paras = [];
  const analysed = (defs || PARAM_DEFS)
    .map((def) => ({ def, reading: latestByParam[def.key], stab: computeStability(def, readings) }))
    .filter((x) => x.reading);

  if (!analysed.length) {
    return { headline: "No data yet", paragraphs: ["Log your first readings and this summary will start describing how the tank is tracking."], score: null };
  }

  const inRange = analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok");
  const outRange = analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok");
  const steady = analysed.filter((x) => x.stab && x.stab.grade === "green");
  const wobbly = analysed.filter((x) => x.stab && x.stab.grade === "amber");
  const unstable = analysed.filter((x) => x.stab && x.stab.grade === "red");

  /* Composite health score.
     Two earlier faults: being out of range cost a flat penalty regardless of
     how far out, so magnesium 300 ppm low scored the same as 5 ppm low; and a
     tank with two readings scored 100 because nothing had gone wrong yet.
     Distance now scales the penalty, and thin data caps the score. */
  const scored = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  let score = null;
  if (scored.length) {
    /* Score each parameter on its own, then combine. Averaging alone let a
       single badly-wrong parameter disappear behind good ones — magnesium
       300 ppm low still scored 89 — so the worst performer carries real
       weight in the total. */
    const perParam = analysed.map((x) => {
      const stabPt = x.stab
        ? (x.stab.grade === "green" ? 1 : x.stab.grade === "amber" ? 0.55 : x.stab.grade === "red" ? 0.15 : 0.7)
        : 0.7;
      const st = paramStatus(x.def, x.reading.value);
      let rangePt = 1;
      if (st !== "ok") {
        const width = Math.max(1e-9, x.def.max - x.def.min);
        const gap = x.reading.value > x.def.max
          ? x.reading.value - x.def.max
          : x.def.min - x.reading.value;
        const bands = gap / width;
        rangePt = bands <= 0.25 ? 0.78 : bands <= 0.75 ? 0.45 : bands <= 1.5 ? 0.2 : 0.03;
      }
      /* Range now outweighs stability. The previous 60/40 split the other way
         let a tank hold every parameter steadily in the wrong place and still
         score in the high seventies — stability is only a virtue when what is
         being held is roughly right. */
      return stabPt * 0.4 + rangePt * 0.6;
    });

    const mean = perParam.reduce((a, b) => a + b, 0) / perParam.length;
    const worst = Math.min(...perParam);
    // 60% how the tank looks overall, 40% how bad its weakest link is.
    score = Math.round((mean * 0.6 + worst * 0.4) * 100);

    /* Ammonia overrides everything. A tank can look immaculate on every other
       measure while poisoning its livestock, and a score in the seventies
       alongside a detectable reading is actively misleading. */
    const amDef = (defs || PARAM_DEFS).find((d) => d.key === "ammonia");
    const amLast = latestByParam && latestByParam.ammonia;
    if (amDef && amLast) {
      if (amLast.value > amDef.max) score = Math.min(score, 22);
      else if (amLast.value > (amDef.step || 0.01) / 2) score = Math.min(score, 42);
    }

    /* A score is a claim about the tank, and a claim needs evidence. */
    const totalReadings = analysed.reduce((n, x) =>
      n + readings.filter((r) => r.param === x.def.key).length, 0);
    if (analysed.length < 3 || totalReadings < 12) score = Math.min(score, 70);
    else if (totalReadings < 30) score = Math.min(score, 85);
  }

  const thinData = analysed.reduce((n, x) => n + readings.filter((r) => r.param === x.def.key).length, 0) < 12;
  const headline = score == null ? "Building a picture"
    : thinData ? "Not enough history yet to judge"
    : score >= 85 ? "Tank is tracking really well"
    : score >= 70 ? "Solid, with a couple of things to watch"
    : score >= 50 ? "Mixed — some parameters need attention"
    : "Several parameters need attention";


  /* --- Urgent findings lead ---
     Previously the assessment never read findings, so an [act] item lived only
     as a small badge on one card. A person could open the app to a warm
     paragraph about steady alkalinity while ammonia sat at 0.4ppm. When
     something urgent exists it is said first, and the rest of the summary
     stands down to make room for it. */
  /* Ordered by how much it matters, not by the order findings happen to be
     generated. Ammonia threatens livestock today; a nutrient a long way out is
     a problem for the month. */
  const URGENCY = ["ammonia-high", "ammonia-detected", "contaminants", "strength-missing", "far-out"];
  const rank = (f) => {
    const i = URGENCY.findIndex((k) => String(f.id).startsWith(k));
    return i === -1 ? URGENCY.length : i;
  };
  const urgent = (findings || [])
    .filter((f) => f.severity === "act")
    .sort((a, b) => rank(a) - rank(b));
  const watch = (findings || []).filter((f) => f.severity === "watch");
  /* --- Dosing, if anything is happening ---
     Placed before the parameter commentary because a change in progress
     changes how the numbers below should be read: a tank mid-correction is
     supposed to be moving. */
  const ds = (doseStates || []).filter(Boolean);
  const running = ds.filter((d) => d.state === "settling" || d.state === "due");
  const needsTest = ds.filter((d) => d.state === "due");
  const suggested = ds.filter((d) => d.state === "suggested");
  const landed = ds.filter((d) => d.state === "worked");
  const missed = ds.filter((d) => d.state === "fell-short" || d.state === "overshot");

  if (needsTest.length) {
    paras.push(needsTest.length === 1
      ? `${needsTest[0].headline}. ${needsTest[0].detail}`
      : `${joinList(needsTest.map((d) => d.el))} all have dose changes waiting on a test before they can be judged. Until those readings go in, the app cannot tell you whether the changes worked or what to do next.`);
  } else if (running.length) {
    paras.push(running.length === 1
      ? `${running[0].headline}. ${running[0].detail}`
      : `${joinList(running.map((d) => d.el))} both have dose changes settling. Hold them and test when due — reading anything into the numbers before then is guesswork.`);
  }
  if (missed.length) {
    paras.push(`${missed.map((d) => d.headline).join(". ")}. ${missed[0].detail}`);
  } else if (landed.length && !running.length) {
    paras.push(landed.length === 1
      ? `${landed[0].headline}. ${landed[0].detail}`
      : `${joinList(landed.map((d) => d.el))} have settled after their dose changes.`);
  }
  if (suggested.length && !running.length) {
    paras.push(suggested.length === 1
      ? `${suggested[0].headline}. ${suggested[0].detail}`
      : `${joinList(suggested.map((d) => d.el))} each look like the dose no longer matches what the tank uses. The Dosing tab shows the working for each.`);
  }

  /* --- Paragraph 0: anything urgent, said first ---
     This is the only paragraph that can push the rest aside. A person opening
     the app to a tank in trouble should read about the trouble, not about how
     steadily magnesium has been holding. */
  if (urgent.length) {
    const titles = urgent.map((f) => f.title);
    paras.push(urgent.length === 1
      ? `Start here: ${titles[0]}. ${firstSentence(urgent[0].detail)}`
      : `Start here — ${urgent.length} things need attention: ${joinList(titles)}. Tap the parameter cards below for what to do about each.`);
  }

  // --- Paragraph 1: overall shape ---
  /* Each parameter should be explained once, in whichever paragraph explains it
     best. Without this, alkalinity was being named up to nine times in one
     summary — roll-call, detail, trend, trio, cross-set comparison, priority —
     all describing the same drift. */
  const detailed = new Set();

  /* Paragraph 2 gives a full account of in-range-but-moving parameters, so the
     roll-call above shouldn't flag them as well — that was the last remaining
     double-mention. */
  const willDetail = new Set(
    analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok"
      && x.stab && (x.stab.grade === "red" || x.stab.grade === "amber"))
      .map((x) => x.def.key));

  /* Opening paragraph is the headline only: how many are where they should be,
     and whether the tank is steady overall. Naming individual parameters here
     duplicated the detail paragraphs that follow. */
  const p1 = [];
  const steadyAndIn = steady.filter((x) => paramStatus(x.def, x.reading.value) === "ok");
  p1.push(`${inRange.length} of ${analysed.length} tracked ${analysed.length === 1 ? "parameter is" : "parameters are"} sitting inside ${analysed.length === 1 ? "its" : "their"} target range${steady.length ? `, and ${steady.length} of ${analysed.length} ${steady.length === 1 ? "is" : "are"} holding steady` : ""}.`);

  if (steady.length && steadyAndIn.length !== steady.length) {
    p1.push(`Steady isn't the same as on target though — ${steady.length - steadyAndIn.length === 1 ? "one of those is being held" : `${steady.length - steadyAndIn.length} of those are being held`} at a level outside the band you set, which is worth separating from being genuinely under control.`);
  } else if (steady.length === analysed.length) {
    p1.push(`Day-to-day movement is inside the tolerance corals prefer, which matters more for long-term health than hitting an exact number.`);
  }

  if (unstable.length) {
    p1.push(`The bigger concern is movement rather than position: ${joinList(unstable.map((x) => x.def.label))} ${unstable.length === 1 ? "is" : "are"} swinging faster than is comfortable.`);
    unstable.forEach((x) => detailed.add(x.def.key));
  } else if (wobbly.length) {
    const notElsewhere = wobbly.filter((x) => !willDetail.has(x.def.key));
    if (notElsewhere.length) {
      p1.push(`${joinList(notElsewhere.map((x) => x.def.label))} ${notElsewhere.length === 1 ? "shows" : "show"} moderate movement — not alarming, but worth tightening if you can.`);
      notElsewhere.forEach((x) => detailed.add(x.def.key));
    }
  }
  paras.push(p1.join(" "));

  // --- Paragraph 2: the nuanced cases (out of range but stable, in range but volatile) ---
  /* Only genuinely marginal parameters belong in the "steady, leave it" group.
     Magnesium 300 ppm low was being described as "parked slightly off" and told
     to be left alone, while a later paragraph said to fix it first. */
  /* A parameter climbing back into its band from below is being corrected, not
     misbehaving. Flagging it as the tank's biggest problem tells someone to
     stop the fix they're in the middle of. */
  const isRecovering = (x) => {
    if (!x.stab || !x.stab.netChange) return false;
    const now = x.reading.value;
    const started = now - x.stab.netChange;
    const up = x.stab.pattern === "trending up";
    const down = x.stab.pattern === "trending down";
    if (up) return started < x.def.min && now <= x.def.max;
    if (down) return started > x.def.max && now >= x.def.min;
    return false;
  };

  const bandsOut = (x) => {
    const width = Math.max(1e-9, x.def.max - x.def.min);
    const gap = x.reading.value > x.def.max ? x.reading.value - x.def.max : x.def.min - x.reading.value;
    return gap / width;
  };
  const outButStable = outRange.filter((x) => x.stab && x.stab.grade === "green" && bandsOut(x) <= 1);
  const outAndFar = outRange.filter((x) => bandsOut(x) > 1);
  const inButVolatile = inRange.filter((x) => x.stab && (x.stab.grade === "red" || x.stab.grade === "amber"));
  const p2 = [];

  /* Grouped rather than repeated: two parameters that are both steady-but-off
     used to produce the same forty-word passage twice in a row. */
  if (outButStable.length) {
    outButStable.forEach((x) => detailed.add(x.def.key));
    const bits = outButStable.map((x) => {
      const status = paramStatus(x.def, x.reading.value);
      const dir = status === "high" ? "above" : "below";
      const target = status === "high" ? x.def.max : x.def.min;
      const gap = Math.abs(x.reading.value - target);
      return `${x.def.label} at ${fmtVal(x.def, x.reading.value)}${x.def.unit} (${fmtVal(x.def, gap)}${x.def.unit} ${dir === "above" ? "over" : "under"} target)`;
    });
    const list = bits.length === 1 ? bits[0]
      : bits.slice(0, -1).join(", ") + " and " + bits[bits.length - 1];
    p2.push(`${bits.length === 1 ? "One parameter is" : `${bits.length} parameters are`} sitting off-target but holding steady: ${list}. Parked slightly off but rock steady beats bouncing through the ideal band, so there's no need to chase ${bits.length === 1 ? "it" : "them"} — let water changes bring ${bits.length === 1 ? "it" : "them"} round gradually.`);
  }

  if (outAndFar.length) {
    const bits = outAndFar.map((x) => {
      const st = paramStatus(x.def, x.reading.value);
      const target = st === "high" ? x.def.max : x.def.min;
      const gap = Math.abs(x.reading.value - target);
      return `${x.def.label} at ${fmtVal(x.def, x.reading.value)}${x.def.unit}, ${fmtVal(x.def, gap)}${x.def.unit} ${st === "high" ? "above" : "below"} target`;
    });
    outAndFar.forEach((x) => detailed.add(x.def.key));
    p2.push(`${joinList(bits)} ${bits.length === 1 ? "is" : "are"} a long way out — far enough that this isn't a case of the target being set slightly wrong. ${bits.length === 1 ? "It needs" : "They need"} correcting rather than accepting, though still gradually.`);
  }

  for (const x of inButVolatile) {
    detailed.add(x.def.key);
    /* Plain language: today's single reading is inside the band, but the run of
       readings behind it is not settled. Avoid "spot value" and similar jargon. */
    const moving = x.stab.pattern === "oscillating" ? "moving up and down"
      : x.stab.pattern === "trending up" ? "climbing steadily"
      : x.stab.pattern === "trending down" ? "falling steadily" : "moving about";
    p2.push(`${x.def.label} happens to be inside your target today at ${fmtVal(x.def, x.reading.value)}${x.def.unit}, but today's reading only tells you where it is right now. Look at the last ${x.stab.readingCount} readings and it has covered a ${x.stab.fmtRate} and is ${moving} — so it's passing through your target band rather than settling in it, and that movement is what corals respond to.`);
  }
  if (p2.length) paras.push(p2.join(" "));

  /* Only call something a trend when the movement clears the test kit's own
     resolution. pH shifting 0.10 across a month, or phosphate 0.07, is inside
     the noise and was previously reported as a direction with a deadline.
     Dosing advice deliberately lives in the dosing box, not here. */
  const trending = analysed.filter((x) => {
    if (!x.stab) return false;
    /* Already described in the paragraph above; saying it again adds nothing. */
    if (detailed.has(x.def.key)) return false;
    if (x.stab.pattern !== "trending up" && x.stab.pattern !== "trending down") return false;
    const floor = STABILITY_RULES[x.def.key] ? STABILITY_RULES[x.def.key].noiseFloor : 0;
    return Math.abs(x.stab.netChange) > floor * 2;
  });

  if (trending.length) {
    const p3 = trending.map((x) => {
      const dir = x.stab.pattern === "trending up" ? "risen" : "fallen";
      const amt = Math.abs(x.stab.netChange);
      const status = paramStatus(x.def, x.reading.value);
      const headroom = status === "ok"
        ? (x.stab.pattern === "trending up" ? x.def.max - x.reading.value : x.reading.value - x.def.min)
        : null;
      if (isRecovering(x)) {
        return `${x.def.label} has ${dir} ${amt < 1 ? amt.toFixed(2) : amt.toFixed(0)}${x.def.unit} over the past ${x.stab.spanDays} days, moving back toward its target band rather than away from it — that's a correction in progress, so let it run rather than reacting to the movement.`;
      }
      let s2 = `${x.def.label} has ${dir} ${amt < 1 ? amt.toFixed(2) : amt.toFixed(0)}${x.def.unit} over the past ${x.stab.spanDays} days, which is a consistent direction rather than noise.`;
      if (headroom != null && headroom >= 0 && x.stab.typicalRate > 0) {
        const daysToExit = Math.round(headroom / x.stab.typicalRate);
        if (daysToExit > 0 && daysToExit < 90) {
          s2 += ` Carry on at that pace and it reaches the edge of your target band in roughly ${daysToExit} days.`;
        }
      }
      return s2;
    });
    paras.push(p3.join(" "));
  }

  /* --- The foundation trio, read together ---
     Alkalinity, calcium and magnesium are the three every experienced reefer
     names first, and they only make sense as a set: calcium supplies the
     building blocks, alkalinity the carbonate, magnesium keeps both in
     solution. Reporting them separately misses the interactions. */
  const p4 = [];
  const alk = analysed.find((x) => x.def.key === "alkalinity");
  const ca = analysed.find((x) => x.def.key === "calcium");
  const mg = analysed.find((x) => x.def.key === "magnesium");

  if (alk && ca && mg) {
    const trio = [alk, ca, mg];
    const steadyTrio = trio.filter((x) => x.stab && x.stab.grade === "green").length;
    const inTrio = trio.filter((x) => paramStatus(x.def, x.reading.value) === "ok").length;
    if (steadyTrio === 3 && inTrio === 3) {
      p4.push(`The foundation trio is in good shape: alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm and magnesium ${fmtVal(mg.def, mg.reading.value)}ppm are all on target and all holding. Those three carry coral skeleton growth between them, so with the set behaving you have room to pay attention elsewhere.`);
    } else if (steadyTrio === 3) {
      p4.push(mg.reading.value < 1250
        ? `The foundation trio — alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm, magnesium ${fmtVal(mg.def, mg.reading.value)}ppm — is holding steady, but steady isn't the same as sufficient here.`
        : `The foundation trio — alkalinity ${fmtVal(alk.def, alk.reading.value)}${alk.def.unit}, calcium ${fmtVal(ca.def, ca.reading.value)}ppm, magnesium ${fmtVal(mg.def, mg.reading.value)}ppm — is all steady, even where the numbers sit off your targets. Corals build skeleton from these three together, and consistency across the set matters more than any one of them hitting a textbook figure.`);
    } else {
      const looseX = trio.filter((x) => x.stab && x.stab.grade !== "green");
      const loose = looseX.map((x) => x.def.label);
      /* If the roll-call already named these, repeating them adds nothing —
         the set explanation only earns its place when it tells you something
         the paragraphs above didn't. */
      const alreadySaid = looseX.every((x) => detailed.has(x.def.key));
      if (alreadySaid && loose.length < 3) {
        // nothing new to add about the trio
      } else p4.push(loose.length === 3
        ? `All three of the foundation parameters are moving about at once. When they wander together it's usually one underlying cause rather than three separate ones — worth checking dosing consistency and water change routine before adjusting any of them individually.`
        : `Of the foundation trio, ${joinList(loose)} ${loose.length === 1 ? "is" : "are"} moving more than the other${loose.length === 1 ? "s" : ""}. They work as a set — one supplies the building blocks, one the carbonate, one keeps both in solution — so settling the loose one usually steadies the others with it.`);
    }
  }

  /* Magnesium only stops calcium and alkalinity holding when it is genuinely
     low in absolute terms. Below a user-set target of 1450 it may still be
     1400, which is a perfectly ordinary level and not a blocker. */
  const MG_CRITICAL = 1250;
  const mgTrulyLow = mg && mg.reading.value < MG_CRITICAL;
  if (mgTrulyLow) {
    p4.push(`Magnesium at ${fmtVal(mg.def, mg.reading.value)}ppm is low enough to matter — below about ${MG_CRITICAL} it stops holding calcium and alkalinity in solution, and they become difficult to maintain no matter how much you dose. Worth resolving before anything else.`);
  } else if (mg && paramStatus(mg.def, mg.reading.value) === "low") {
    p4.push(`Magnesium sits under your target at ${fmtVal(mg.def, mg.reading.value)}ppm, though it's still within the range most tanks run without trouble — worth nudging up gradually rather than treating as urgent.`);
  }

  /* Calcium and alkalinity are consumed in fixed proportion, so their ratio is
     a cross-check that neither number gives on its own. */
  if (alk && ca) {
    const ratio = ca.reading.value / alk.reading.value;
    if (ratio < 42) {
      p4.push(`Calcium to alkalinity sits at ${ratio.toFixed(0)}:1, on the low side of the roughly 50:1 a balanced tank shows — calcium is lagging what your alkalinity implies, so the calcium side of your dosing is the one to look at.`);
    } else if (ratio > 60) {
      p4.push(`Calcium to alkalinity sits at ${ratio.toFixed(0)}:1, above the roughly 50:1 of a balanced tank — there's more calcium in solution than your alkalinity is drawing on, which usually means the calcium dose is running ahead.`);
    }
  }

  if (mg && ca) {
    const mgRatio = mg.reading.value / ca.reading.value;
    if (mgRatio < 2.7) {
      p4.push(`Magnesium to calcium is ${mgRatio.toFixed(1)}:1, under the ~3.1:1 of natural seawater — too little magnesium to hold calcium and alkalinity comfortably in solution.`);
    }
  }

  if (p4.length) paras.push(p4.join(" "));

  /* --- Nutrients: the ratio, not just the levels ---
     Corals build tissue from nitrogen and phosphorus and skeleton from
     alkalinity, so the nutrient pair and alkalinity have to be read together.
     High alkalinity on lean nutrients is the classic burnt-tip setup. */
  const p5 = [];
  const po4 = analysed.find((x) => x.def.key === "phosphate");
  const no3 = analysed.find((x) => x.def.key === "nitrate");

  if (po4 && no3 && po4.reading.value > 0) {
    const ratio = no3.reading.value / po4.reading.value;
    const balanced = ratio >= 50 && ratio <= 150;
    /* A ratio says nothing about whether there is enough of either. Nitrate 1.0
       against phosphate 0.01 is exactly 100:1 and also a starving tank. */
    const starved = no3.reading.value < 3 || po4.reading.value < 0.03;
    const loaded = no3.reading.value > 25 || po4.reading.value > 0.2;

    if (starved) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate. The proportion between them is ${balanced ? "fine" : "off"}, but the levels themselves are the problem — both are close to bottom, and corals need measurable nitrogen and phosphorus to build tissue. Running this lean pales corals out and is the classic opening for dinoflagellates. Feeding more, or dosing nitrate back toward 5ppm, matters more here than the ratio.`);
    } else if (loaded) {
      const wayOver = no3.reading.value > no3.def.max * 2 || po4.reading.value > po4.def.max * 2;
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — a ratio of about ${ratio.toFixed(0)}:1. ${wayOver ? `Both are well above where you want them, far enough that this needs actively bringing down rather than just watching` : `The levels are on the high side, which tends to show as darker coral tissue and faster algae growth rather than anything acute`}. Work them down through water changes and export gradually; sudden nutrient crashes are harder on corals than steady high readings.`);
    } else if (balanced) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — a ratio of about ${ratio.toFixed(0)}:1, close to the 100:1 reefers treat as balanced. The ratio matters more than either figure alone: when one runs out well ahead of the other, whichever is left over tends to feed algae or cyano instead of coral.`);
    } else if (ratio > 150) {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — about ${ratio.toFixed(0)}:1, well above the 100:1 that counts as balanced. Phosphate is the limiting one here, and when it runs short corals pale while the spare nitrate goes to nuisance growth. Easing off phosphate export usually works better than chasing nitrate down.`);
    } else {
      p5.push(`Your nutrients read ${fmtVal(no3.def, no3.reading.value)}ppm nitrate against ${fmtVal(po4.def, po4.reading.value)}ppm phosphate — about ${ratio.toFixed(0)}:1, below the 100:1 that counts as balanced. Phosphate is running ahead of nitrate, which favours algae and can slow calcification. Nudging nitrate up usually rebalances this more gently than stripping phosphate.`);
    }
  }

  /* Alkalinity and nutrients set each other's safe range. */
  if (alk && po4 && no3) {
    const alkVal = alk.reading.value;
    const lean = no3.reading.value < 3 || po4.reading.value < 0.03;
    const rich = no3.reading.value >= 5 && po4.reading.value >= 0.05;
    if (alkVal >= 9 && lean) {
      p5.push(`Worth flagging: alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} on nutrients this lean is the combination that burns SPS tips. Skeleton growth outruns tissue growth when there's carbonate to spare but little nitrogen and phosphorus to build with. Either feed a little more, or bring alkalinity down toward 8 — the two have to move together.`);
    } else if (alkVal >= 9 && rich) {
      p5.push(`Alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} is on the higher side, but your nutrients support it — tissue growth can keep pace with skeleton growth at these nitrate and phosphate levels. That pairing is coherent; the same alkalinity on a lean tank would risk burnt tips.`);
    } else if (alkVal <= 7.5 && rich) {
      p5.push(`Alkalinity at ${fmtVal(alk.def, alkVal)}${alk.def.unit} is fairly low for nutrients this generous. Corals have plenty to build tissue with but less carbonate for skeleton, which tends to show as good colour and slow growth. Raising alkalinity gently would let growth catch up.`);
    }
  }

  if (p5.length) paras.push(p5.join(" "));

  /* --- Control quality across the set ---
     Only worth saying when it draws a contrast the roll-call above didn't
     already make. Repeating the same names in a different sentence made the
     summary feel padded. */
  const graded = analysed.filter((x) => x.stab && x.stab.grade !== "unknown");
  if (graded.length >= 3) {
    const tightest = graded.filter((x) => x.stab.grade === "green");
    const loosest = graded.filter((x) => x.stab.grade === "red");
    const anyOff = analysed.some((x) => paramStatus(x.def, x.reading.value) !== "ok");
    if (tightest.length === graded.length) {
      paras.push(anyOff
        ? `Taken as a whole, everything you track is being held steadily — including the parameters sitting off their targets. Steady in the wrong place is a much easier problem than unsteady in the right one.`
        : `Taken as a whole, everything you track is holding tightly. There's nothing here that needs adjusting.`);
    } else if (loosest.length && loosest.length < graded.length) {
      const names = loosest.map((x) => x.def.label);
      paras.push(`Set against the rest of the tank, ${joinList(names)} ${names.length === 1 ? "is the outlier" : "are the outliers"} — everything else is holding. Tightening the loose one usually lifts the whole tank more than fine-tuning something already steady.`);
    }
  }

  /* pH is the parameter most often misdiagnosed, so say where it comes from. */
  const ph = analysed.find((x) => x.def.key === "ph");
  if (ph && ph.reading.value > 8.4) {
    paras.push(`On pH: at ${fmtVal(ph.def, ph.reading.value)} you're running high, which usually means kalkwasser or a heavy buffer rather than a problem. Corals tolerate it well as long as it's steady, but watch that alkalinity doesn't get pushed up alongside it, and be careful adding anything else alkaline while pH sits here.`);
  } else if (ph && ph.reading.value < 7.9) {
    paras.push(`On pH: at ${fmtVal(ph.def, ph.reading.value)} it's on the low side, and the usual cause is carbon dioxide in the room rather than anything wrong in the tank. More surface agitation, fresh air to the skimmer intake, or a refugium lit opposite your display all lift it more reliably than buffering does — and chasing pH with alkalinity additives usually causes more trouble than the low reading itself.`);
  }

  // --- Paragraph 5: testing cadence feedback ---
  const stale = analysed.filter((x) => {
    if (!x.def.freqDays) return false;
    return daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2;
  });
  if (stale.length) {
    paras.push(`Worth noting the data itself is thinning out: ${stale.map((x) => `${x.def.label} (last tested ${daysBetween(x.reading.date, todayStr())} days ago)`).join(", ")}. Stability readings get less trustworthy as gaps widen, since a smooth line between two distant points can hide real movement in between.`);
  }

  /* --- One priority ---
     The commentary above lists observations; this ranks them. Ordered by what
     actually destabilises a tank fastest: magnesium failing first (it gates
     the other two), then genuine swing, then sustained drift, then placement. */
  const priority = (() => {
    // Magnesium gates the other two, so it goes first regardless.
    if (mg && mg.reading.value < 1250) {
      return `bring magnesium up — below about 1250 it stops holding calcium and alkalinity in solution, and they'll fight you no matter what you dose.`;
    }
    /* Starved nutrients paired with high alkalinity burns SPS tips, which
       outranks a parameter merely sitting under its target. */
    if (alk && no3 && po4 && alk.reading.value >= 9
        && (no3.reading.value < 3 || po4.reading.value < 0.03)) {
      return `feed more — alkalinity this high on nutrients this lean is what burns SPS tips, and the nutrients are the easier half to fix.`;
    }
    /* A foundation parameter swinging wildly is more dangerous than a nutrient
       sitting off-target, because corals feel movement faster than position. */
    const bigThree = ["alkalinity", "calcium", "magnesium"];
    const wildFoundation = analysed.filter((x) =>
      bigThree.includes(x.def.key) && x.stab && x.stab.grade === "red" && !isRecovering(x));
    if (wildFoundation.length) {
      const worst = wildFoundation.sort((a, b) =>
        (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0))[0];
      return `settle ${worst.def.label.toLowerCase()} — it's swinging widely, and corals feel that movement long before they mind a number being off target.`;
    }

    // Anything a long way outside its band outranks remaining stability concerns.
    const farOut = analysed
      .filter((x) => {
        if (paramStatus(x.def, x.reading.value) === "ok" || x.def.key === "ph") return false;
        if (bandsOut(x) <= 1) return false;
        /* Magnesium above the critical level is never the most important thing
           on a tank that is otherwise behaving, however far it sits from a
           user-set target. */
        if (x.def.key === "magnesium" && x.reading.value >= 1250) return false;
        return true;
      })
      .sort((a, b) => bandsOut(b) - bandsOut(a));
    if (farOut.length) {
      return `bring ${farOut[0].def.label.toLowerCase()} back toward its band — at ${fmtVal(farOut[0].def, farOut[0].reading.value)}${farOut[0].def.unit} it's far enough out that steadiness isn't the issue.`;
    }
    // Starved nutrients are a real risk even when everything looks steady.
    if (no3 && po4 && (no3.reading.value < 3 || po4.reading.value < 0.03)) {
      return `feed a little more — nutrients this lean starve corals and invite dinoflagellates, whatever the rest of the numbers say.`;
    }
    const swinging = analysed
      .filter((x) => x.stab && x.stab.grade === "red" && !isRecovering(x))
      .sort((a, b) => (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0));
    if (swinging.length) {
      return `settle ${swinging[0].def.label.toLowerCase()} — it's the widest-moving thing here, and movement costs corals more than being off-target does.`;
    }
    const drifting = analysed.filter((x) => {
      if (!x.stab || isRecovering(x)) return false;
      const floor = STABILITY_RULES[x.def.key] ? STABILITY_RULES[x.def.key].noiseFloor : 0;
      return (x.stab.pattern === "trending up" || x.stab.pattern === "trending down")
        && Math.abs(x.stab.netChange) > floor * 2;
    }).sort((a, b) => (a.def.key === "alkalinity" ? -1 : b.def.key === "alkalinity" ? 1 : 0));
    if (drifting.length) {
      return `keep an eye on ${drifting[0].def.label.toLowerCase()} — it's travelling in one direction, and a small dosing correction now beats a large one later.`;
    }
    /* pH is never managed by moving a target, so it is excluded here. */
    const off = analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok" && x.def.key !== "ph");
    /* Changing a target is a decision that needs history behind it; a handful
       of readings is not grounds for redefining what you are aiming at. */
    if (off.length && !thinData) {
      return `decide whether your ${off[0].def.label.toLowerCase()} target is still the right one — the tank is holding steady, just not where you told it to.`;
    }
    if (off.length && thinData) {
      return `keep testing — ${off[0].def.label.toLowerCase()} is sitting outside your target, but there isn't enough history yet to know whether that's the tank or the target.`;
    }
    if (ph && ph.reading.value < 7.9) {
      return `work on gas exchange for the low pH — more surface agitation or fresh air to the skimmer, rather than anything added to the water.`;
    }
    const stale = analysed.filter((x) => x.def.freqDays && daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2);
    if (stale.length) {
      return `get a fresh ${stale[0].def.label.toLowerCase()} reading in — everything looks well held, but the data behind that is getting old.`;
    }
    if (thinData) {
      return `keep logging — there isn't enough history yet for any of this to mean much, and a few weeks of consistent testing will change that.`;
    }
    return `nothing needs attention — keep testing at your current rhythm and leave the dosing alone.`;
  })();
  paras.push(`If you do one thing this week: ${priority}`);

  /* When something urgent leads, the rest of the summary steps back. Three
     screenfuls of prose beneath a warning buries it, and the detail is all
     still on the parameter cards. */
  const trimmed = urgent.length
    ? [paras[0], ...paras.slice(1, 3)]
    : paras;

  /* One line, and it says what rather than how many. "One thing needs
     attention" made you open the card to find out which; naming it costs the
     same space and answers the question. */
  /* The headline used to name a single metric, which made a tank with one
     dose tweak read the same as a tank in trouble. It now describes the whole
     thing; the individual findings are the claims below it. */
  const staleList = analysed.filter((x) => x.def.freqDays
    && daysBetween(x.reading.date, todayStr()) > x.def.freqDays * 2);
  const lead = buildHeadline({
    total: analysed.length,
    inRange: analysed.filter((x) => paramStatus(x.def, x.reading.value) === "ok").length,
    steady: analysed.filter((x) => x.stab && x.stab.grade === "green").length,
    drifting: analysed.filter((x) => x.stab && (x.stab.grade === "amber" || x.stab.grade === "red")).length,
    offSteady: analysed.filter((x) => paramStatus(x.def, x.reading.value) !== "ok"
      && x.stab && x.stab.grade === "green").length,
    urgent: urgent.length,
    settling: ds.filter((d) => d.state === "settling").length,
    dueTests: needsTest.length,
    suggested: suggested.length,
    missed: missed.length,
    staleCount: staleList.length,
    urgentTitle: urgent.length === 1 ? urgent[0].title : null,
    /* Anything raised at watch level, so the headline cannot declare the tank
       spotless while a claim below it disagrees. */
    watching: (findings || []).some((f) => f.severity === "watch"),
    thinData,
  });

  return {
    headline: lead || headline,
    paragraphs: trimmed.filter(Boolean),
    score,
    urgentCount: urgent.length,
    watchCount: watch.length,
  };
}

/* ---------------------------------- storage helpers ---------------------------------- */

/* Two storage backends, tried in order. The host bridge is preferred where it
   exists, but it can fail in ways localStorage doesn't — a bridge that returns
   an unexpected response would otherwise lose a change with only a red banner
   to show for it. Falling through means the data still lands somewhere. */
const LS_PREFIX = "danstank:";

function lsGet(key) {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}
function lsSet(key, value) {
  try { window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); return true; }
  catch { return false; }
}

async function loadKey(key, fallback) {
  try {
    if (window.storage && window.storage.get) {
      const res = await window.storage.get(key, false);
      if (res && res.value) return JSON.parse(res.value);
    }
  } catch (e) { /* fall through to local storage */ }
  const local = lsGet(key);
  return local === undefined ? fallback : local;
}
/* Storage failures used to be swallowed, which made a full quota look like a
   successful save until the next reload. Surface them instead. */
let toastHandler = null;
function onToast(fn) { toastHandler = fn; }
/* Brief confirmation that something happened — used where the thing you acted
   on disappears, so there is otherwise no feedback that it worked. */
function notify(message) { if (toastHandler) toastHandler(message); }

let storageErrorHandler = null;
function onStorageError(fn) { storageErrorHandler = fn; }

function isQuotaError(e) {
  if (!e) return false;
  const n = e.name || "";
  const m = String(e.message || "");
  return n === "QuotaExceededError" || n === "NS_ERROR_DOM_QUOTA_REACHED" ||
         /quota|exceeded|storage is full|too large/i.test(m);
}

async function saveKey(key, value) {
  let bridgeError = null;
  try {
    if (window.storage && window.storage.set) {
      await window.storage.set(key, JSON.stringify(value), false);
      /* Mirror to local storage as well, so a later bridge failure can still
         read back what was written. */
      lsSet(key, value);
      return true;
    }
  } catch (e) {
    bridgeError = e;
    console.error("storage bridge save failed", key, e);
  }

  /* Bridge unavailable or failed — write locally instead. */
  if (lsSet(key, value)) return true;

  const e = bridgeError;
  if (storageErrorHandler) {
    storageErrorHandler(
      isQuotaError(e)
        ? "Storage is full, so that change was not saved. ICP report photos use the most space — remove a few, then try again. Save a backup file first if you need one."
        : "That change could not be saved (" + (e && e.message ? e.message : "unknown error") + ")."
    );
  }
  return false;
}

/* ---------------------------------- image compression ---------------------------------- */

/* Browser storage is small, so shrink until the encoded image fits a budget
   rather than trusting a single quality setting. */
function compressImage(file, maxW = 900, quality = 0.7, maxBytes = 220000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = maxW, q = quality, out = null;
          for (let attempt = 0; attempt < 7; attempt++) {
            const scale = Math.min(1, w / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            out = canvas.toDataURL("image/jpeg", q);
            // base64 is ~4/3 the byte size of the encoded data
            if (out.length * 0.75 <= maxBytes) break;
            if (q > 0.45) q -= 0.12; else w = Math.round(w * 0.8);
          }
          resolve(out);
        } catch (err) {
          reject(new Error("Could not process that image. Try a JPEG or PNG."));
        }
      };
      img.onerror = () => reject(new Error(
        "That image format could not be read. iPhone photos saved as HEIC sometimes fail — in Settings > Camera > Formats choose Most Compatible, or share the photo as a JPEG first."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------- advanced analytics ---------------------------------- */

/* Dosing strength expressed as dKH raised per mL per 100L. A standard
   two-part alkalinity solution (BRS soda ash and equivalents) needs roughly
   33 mL to raise 100L by 1 dKH, i.e. about 0.03 dKH per mL per 100L. */
/* --- Real ICP panels, seeded once ---
 * Triton reports traces in ug/L and macros in mg/L; everything here is stored
 * in mg/L to match the app's reference ranges. Dates are the sampling dates
 * (five days before the reported date), since that is when the water actually
 * came out of the tank and is what the calibration pairing needs.
 */
const ICP_SEED = [{"id": "icp-2026-06-14","date": "2026-06-14","lab": "Triton","ref": "B-ovXZ3O","elements": {"aluminium": 0.006,"antimony": 0,"arsenic": 0,"lead": 0,"cadmium": 0,"copper": 0,"lanthanum": 0,"mercury": 0,"scandium": 0,"selenium": 0,"titanium": 0,"tungsten": 0,"tin": 0,"chloride": 19574,"sodium": 10795,"calcium": 438,"magnesium": 1349,"potassium": 397,"bromide": 66,"boron": 5,"fluoride": 0.67,"strontium": 7,"sulphur": 912,"lithium": 0.192,"nickel": 0,"molybdenum": 0.007,"vanadium": 0,"zinc": 0,"manganese": 0.001,"iodine": 0.013,"chromium": 0,"cobalt": 0,"iron": 0,"barium": 0.026,"beryllium": 0,"silicon": 0.16,"phosphorus": 0.015,"phosphate": 0.046,"salinity": 34.713}},{"id": "icp-2026-07-26","date": "2026-07-26","lab": "Triton","ref": "B-l8j2NQ","elements": {"aluminium": 0.001,"antimony": 0,"arsenic": 0,"lead": 0,"cadmium": 0,"copper": 0,"lanthanum": 0,"mercury": 0,"scandium": 0,"selenium": 0,"titanium": 0,"tungsten": 0,"tin": 0,"chloride": 20075,"sodium": 11010,"calcium": 435,"magnesium": 1407,"potassium": 421,"bromide": 66,"boron": 5,"fluoride": 0.61,"strontium": 8,"sulphur": 920,"lithium": 0.195,"nickel": 0,"molybdenum": 0.006,"vanadium": 0.001,"zinc": 0,"manganese": 0.001,"iodine": 0.033,"chromium": 0,"cobalt": 0,"iron": 0,"barium": 0.021,"beryllium": 0,"silicon": 0.146,"phosphorus": 0.012,"phosphate": 0.037,"salinity": 35.514}}];

/* --- Water change history ---
 * 10L every Monday since the tank was set up. Seeded once so the nutrient
 * production and dilution maths have the export side of the equation; without
 * it they cannot separate "produces nothing" from "produces plenty and exports
 * exactly as much".
 */
const WATER_CHANGE_SEED = ["2026-02-16","2026-02-23","2026-03-02","2026-03-09","2026-03-16","2026-03-23","2026-03-30","2026-04-06","2026-04-13","2026-04-20","2026-04-27","2026-05-04","2026-05-11","2026-05-18","2026-05-25","2026-06-01","2026-06-08","2026-06-15","2026-06-22","2026-06-29","2026-07-06","2026-07-13","2026-07-20","2026-07-27","2026-08-03"];
const WATER_CHANGE_LITRES = 10;

/* AI Blade channel settings, seeded once so the lighting marker and history
   have a starting point. */
const LIGHTING_SEED = [
  { id: "light-2026-08-05", date: "2026-08-05",
    note: "UV 66% · V 72% · RY 93% · B 93% · CW 20%" },
];

const DEFAULT_SETTINGS = {
  volumeL: 77,
  /* Derived from the actual mix rather than a label. Aquaforest Balling at 2x
     standard: 101 g soda ash per L = 1906 meq/L, so 1 mL into 100 L gives
     0.0533 dKH. Calcium: 100 g AF Calcium per L (anhydrous CaCl2, 36.1% Ca)
     = 36,110 ppm, so 1 mL into 100 L gives 0.3611 ppm. Their ratio is
     6.77 ppm per dKH, which is what a balanced 1:1 recipe must produce. */
  dailyDoseMl: 8, dkhPerMlPer100L: 0.0533,
  /* Calcium default is derived rather than guessed: a balanced two-part
     delivers ~7.14 ppm of calcium per dKH of alkalinity, so a 0.03 dKH/mL/100L
     alkalinity part pairs with ~0.21 ppm/mL/100L on the calcium side.
     Magnesium is taken from the product's own figure rather than derived:
     Aquaforest's magnesium part raises 100 L by 1.2 ppm per 100 mL at standard
     strength, so 0.012 ppm/mL/100L, and 0.024 at the double-strength mix used
     here. Commercial magnesium supplements really are this dilute — magnesium
     sits near 1400 ppm, so shifting it is inherently a large-volume job, and a
     figure that looks implausibly small next to the calcium part is correct. */
  calciumDoseMl: 9, caPpmPerMlPer100L: 0.36,
  magDoseMl: 8, mgPpmPerMlPer100L: 0.024,
  waterChangeL: 10,
};

/* Stoichiometry: 1 meq/L of alkalinity pairs with 20 ppm calcium, and
   1 meq/L = 2.8 dKH. So each dKH of alkalinity consumed corresponds to
   roughly 7.14 ppm of calcium consumed in a balanced system. */
const CA_PPM_PER_DKH = 20 / 2.8;

/* Calendar-day index. Built from local midnight and divided after removing the
   timezone offset, so a day is always a day regardless of DST. */
/* Memoised, because this sits in the hot path of every assessment: each one
   sorts its readings, and a sort comparator calls this O(n log n) times. With
   a couple of years of history that is millions of date parses per screen —
   enough to make the dosing tab visibly slow on a phone. The set of distinct
   dates is small, so caching them costs almost nothing. */
const DAY_NUM_CACHE = new Map();
const dayNum = (d) => {
  const hit = DAY_NUM_CACHE.get(d);
  if (hit !== undefined) return hit;
  const x = parseLocal(d);
  const n = Math.floor((x.getTime() - x.getTimezoneOffset() * 60000) / 86400000);
  if (DAY_NUM_CACHE.size < 20000) DAY_NUM_CACHE.set(d, n);
  return n;
};
/* ISO date shifted by n days, in and out as ISO date strings. */
/* "Wed 12 Aug" — a date you can act on without counting. */
const fmtFriendly = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

/* --- Time of day ---
 *
 * Alkalinity swings through the day as the doser runs and the corals
 * photosynthesise, so a reading is only comparable to another taken at a
 * similar hour. Without a time, two readings from the same day sit at the same
 * x on every chart and regression, and a normal daily cycle reads as
 * instability. Readings logged before this existed simply have no time, and are
 * treated as midday so they neither lead nor lag.
 */
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/* Minutes past midnight, or null if the reading predates timestamps. */
const minutesOf = (t) => {
  if (!t || typeof t !== "string") return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
};

/* A reading's position on the timeline, in days, including time of day. */
const dayPos = (row) => {
  const mins = minutesOf(row && row.time);
  return dayNum(row.date) + (mins == null ? 0.5 : mins / 1440);
};

/* Newest first, breaking ties on time so same-day readings order correctly. */
const byNewest = (a, b) => dayPos(b) - dayPos(a);
const byOldest = (a, b) => dayPos(a) - dayPos(b);

const fmtTime = (t) => {
  const mins = minutesOf(t);
  if (mins == null) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
};

const addDays = (iso, n) => {
  const x = parseLocal(iso);
  x.setDate(x.getDate() + n);   // setDate handles month, year and DST correctly
  return isoLocal(x);
};

/* Least-squares slope in units-per-day. More robust than first-vs-last,
   which is hostage to a single bad reading at either end. */
function regressionSlope(rows) {
  if (rows.length < 2) return null;
  /* Fractional days, so two readings taken twelve hours apart are twelve hours
     apart to the maths rather than simultaneous. */
  const xs = rows.map((r) => dayPos(r));
  const ys = rows.map((r) => r.value);
  const x0 = xs[0];
  const X = xs.map((x) => x - x0);
  const n = X.length;
  const mx = X.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (X[i] - mx) * (ys[i] - my); den += (X[i] - mx) ** 2; }
  if (den === 0) return null;
  return num / den;
}

function windowRows(readings, key, days) {
  const cutoff = addDaysFromToday(-days);
  return readings.filter((r) => r.param === key && r.date >= cutoff)
    .sort(byOldest);
}

/* --- 1. Alkalinity consumption & doser guidance --- */
function computeConsumption(readings, settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return null;
  const rows = windowRows(readings, "alkalinity", 30);
  if (rows.length < 3) return null;

  const driftPerDay = regressionSlope(rows);
  if (driftPerDay == null) return null;

  // What the current daily dose actually delivers, in dKH, for this volume.
  const dosePerDayDkh = s.dailyDoseMl > 0
    ? s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL)
    : null;

  // Consumption = what you put in, minus what stayed. If alk is falling while
  // dosing, the tank is eating more than the dose delivers.
  const consumption = dosePerDayDkh != null ? dosePerDayDkh - driftPerDay : null;

  const dkhPerMl = s.dkhPerMlPer100L * (100 / s.volumeL);
  const recommendedMl = consumption != null && dkhPerMl > 0 ? consumption / dkhPerMl : null;
  const adjustMl = recommendedMl != null ? recommendedMl - s.dailyDoseMl : null;

  // Demand trend: consumption inferred window by window. With a constant dose,
  // a steepening decline means the tank is eating more, i.e. growing.
  const windows = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(Date.now() - i * 14 * 86400000);
    const start = new Date(end.getTime() - 14 * 86400000);
    const seg = readings.filter((r) => r.param === "alkalinity"
      && r.date >= isoLocal(start)
      && r.date < isoLocal(end))
      .sort(byOldest);
    if (seg.length < 2) continue;
    const slope = regressionSlope(seg);
    if (slope == null) continue;
    windows.push({
      label: fmtShort(seg[seg.length - 1].date),
      drift: slope,
      demand: dosePerDayDkh != null ? dosePerDayDkh - slope : -slope,
      n: seg.length,
    });
  }

  let demandTrend = null;
  if (windows.length >= 3) {
    const firstHalf = windows.slice(0, Math.floor(windows.length / 2));
    const lastHalf = windows.slice(-Math.floor(windows.length / 2));
    const a = firstHalf.reduce((s2, w) => s2 + w.demand, 0) / firstHalf.length;
    const b = lastHalf.reduce((s2, w) => s2 + w.demand, 0) / lastHalf.length;
    const change = b - a;
    demandTrend = {
      change,
      direction: Math.abs(change) < 0.02 ? "steady" : change > 0 ? "rising" : "falling",
      pctChange: a !== 0 ? (change / Math.abs(a)) * 100 : 0,
    };
  }

  return { driftPerDay, dosePerDayDkh, consumption, recommendedMl, adjustMl, windows, demandTrend, settings: s, readingCount: rows.length };
}


/* --- Generalised consumption, water-change aware ---
 *
 * Mass balance: what you added, plus what water changes brought in, minus what
 * stayed, is what the tank consumed.
 *
 *   consumed = dosed + addedByWaterChanges - netChangeInTank
 *
 * Each parameter gets its own minimum window because they move at very
 * different speeds. Magnesium demand is roughly a tenth of calcium's, so a
 * week of weekly tests would show nothing but kit noise; three weeks gives the
 * signal a chance to clear the noise floor. Where it still doesn't, the result
 * is reported as unreliable rather than dressed up as a number.
 */
/* Which settings fields belong to which element, so the setup panel and the
   dose log can be driven by a single dropdown rather than stacking all three. */
const DOSE_ELEMENTS = [
  { key: "alkalinity", label: "Alkalinity", doseField: "dailyDoseMl", strengthField: "dkhPerMlPer100L",
    unit: "dKH", strengthLabel: "dKH/mL/100L", strengthStep: 0.005, defaultStrength: 0.0533,
    hint: "Aquaforest Balling at 2x standard (101 g soda ash per litre) works out at 0.0533 dKH per mL per 100L. Their standard strength is half that." },
  { key: "calcium", label: "Calcium", doseField: "calciumDoseMl", strengthField: "caPpmPerMlPer100L",
    unit: "ppm", strengthLabel: "ppm/mL/100L", strengthStep: 0.01, defaultStrength: 0.3611,
    hint: "Aquaforest Balling at 2x standard (100 g AF Calcium per litre) works out at 0.3611 ppm per mL per 100L. Paired with the alkalinity part that gives 6.8 ppm calcium per dKH — the ratio corals actually consume." },
  { key: "magnesium", label: "Magnesium", doseField: "magDoseMl", strengthField: "mgPpmPerMlPer100L",
    unit: "ppm", strengthLabel: "ppm/mL/100L", strengthStep: 0.1, defaultStrength: 1.0,
    hint: "Magnesium products vary a lot in concentration — check your bottle. Leave the dose at 0 if water changes alone replenish it." },
];

const CONSUMPTION_RULES = {
  alkalinity: { minDays: 7,  maxDays: 45,  unit: "dKH", dp: 2,
                dose: (s) => s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL) },
  calcium:    { minDays: 14, maxDays: 60,  unit: "ppm", dp: 1,
                dose: (s) => s.calciumDoseMl * s.caPpmPerMlPer100L * (100 / s.volumeL) },
  magnesium:  { minDays: 21, maxDays: 90,  unit: "ppm", dp: 1,
                dose: (s) => s.magDoseMl * s.mgPpmPerMlPer100L * (100 / s.volumeL) },
};

function computeElementConsumption(key, readings, waterChanges, settings) {
  const rule = CONSUMPTION_RULES[key];
  const def = PARAM_DEFS.find((d) => d.key === key);
  if (!rule || !def) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };

  /* Widen until there are enough readings AND they actually span the minimum
     period. Checking only the count let a cluster of four tests inside 16 days
     satisfy a 21-day rule, which then failed the span check and reported
     "not enough data" even though months of history existed. */
  let rows = [], days = rule.minDays, spanDays = 0;
  for (; days <= rule.maxDays; days += 7) {
    rows = windowRows(readings, key, days);
    if (rows.length < 3) continue;
    spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
    if (spanDays >= rule.minDays) break;
  }

  if (rows.length < 3) return { status: "insufficient", need: 3, have: rows.length, rule, def, days };
  spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  if (spanDays < rule.minDays) {
    // Genuinely not enough history yet, even reaching back as far as allowed.
    return { status: "tooshort", spanDays, minDays: rule.minDays, rule, def, rows: rows.length };
  }

  const slope = regressionSlope(rows);
  if (slope == null) return { status: "insufficient", need: 3, have: rows.length, rule, def, days };
  const netChange = slope * spanDays;

  // What water changes contributed across the same span.
  const from = rows[0].date, to = rows[rows.length - 1].date;
  const wcs = (waterChanges || []).filter((w) => w.date >= from && w.date <= to);
  const saltVal = SALT_MIX.values[key];

  /* A water change moves the level toward the salt's value by a fraction of the
     volume, so the effect depends on where the tank was AT THAT MOMENT — not on
     the window's median. Using the median made calcium's contribution vanish
     whenever the median happened to equal the salt figure, which is exactly
     what it did here: median 450, salt 450, contribution zero. */
  let wcContribution = 0;
  const perChange = [];
  for (const w of wcs) {
    const f = Math.min(1, (w.litres || 0) / s.volumeL);
    if (saltVal == null || f <= 0) continue;
    let near = rows[0], best = Infinity;
    for (const r of rows) {
      const gap = Math.abs(daysBetween(r.date, w.date));
      if (gap < best) { best = gap; near = r; }
    }
    const contribution = f * (saltVal - near.value);
    wcContribution += contribution;
    perChange.push({ date: w.date, litres: w.litres, level: near.value, contribution });
  }

  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const typical = vals[Math.floor(vals.length / 2)];

  const dosePerDay = rule.dose(s);
  const dosed = dosePerDay * spanDays;

  // The balance itself.
  const consumedTotal = dosed + wcContribution - netChange;
  const perDay = consumedTotal / spanDays;

  // Is the signal bigger than what the test kit can resolve?
  const sRule = STABILITY_RULES[key];
  const floor = sRule ? sRule.noiseFloor : 0;
  const reliable = Math.abs(consumedTotal) > floor * 1.5;

  /* Three readings across two months is not the same evidence as three across
     a fortnight, and the figure should not be presented as though it were. */
  const avgGap = spanDays / Math.max(1, rows.length - 1);
  const sparse = avgGap > (rule.minDays / 2);

  return {
    status: "ok", rule, def, rows: rows.length, spanDays, sparse, avgGap,
    netChange, dosePerDay, dosed, wcContribution, wcCount: wcs.length,
    consumedTotal, perDay, reliable, saltVal, typical, perChange,
    doseConfigured: dosePerDay > 0,
  };
}

/* Predicted levels straight after a water change. */
/* Uses the salt maker's published figures. Batches vary, so these are
   estimates to test against rather than values to rely on. */
function predictAfterChange(latestByParam, paramDefs, volumeL, litres) {
  const f = Math.min(1, litres / volumeL);
  const out = [];
  for (const def of paramDefs) {
    const nominal = SALT_MIX.values[def.key];
    if (nominal == null) continue;
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const after = reading.value * (1 - f) + nominal * f;
    out.push({ def, before: reading.value, after, delta: after - reading.value });
  }
  return { pct: f * 100, rows: out };
}

/* --- 2. Ionic balance: do calcium and alkalinity move together? --- */

/* --- Dose adjustment advisor ---
 *
 * Turns a sustained trend into a concrete dosing suggestion, following the
 * standard rule of nudging a daily dose by ~10% rather than making large
 * corrections. Deliberately conservative:
 *
 *  - Stays silent unless the dose has been unchanged long enough for a trend
 *    to mean anything. Right after an adjustment the tank is still settling.
 *  - Treats alkalinity as the lead parameter. Chasing calcium while ignoring
 *    alkalinity is the classic way to destabilise a tank, so when both drift
 *    together it says so instead of issuing two separate suggestions.
 *  - Gives percentages, not millilitres, for calcium. Without knowing the
 *    product's concentration an exact volume would be false precision.
 *  - Magnesium is excluded: it is usually replenished by water changes rather
 *    than dosed, so a dose suggestion would be advice about nothing.
 */

/* --- Kit measurement noise ---
 * Standard deviation of repeat measurements on the same water, NOT how much
 * the tank varies. Used by the cadence optimiser and the change detector.
 * Editable in Setup, because a Hanna checker and a Salifert titration are not
 * the same instrument.
 */
const KIT_SIGMA = {
  alkalinity: 0.05, calcium: 8, magnesium: 15,
  nitrate: 1.0, phosphate: 0.01, potassium: 10, ph: 0.03, salinity: 0.2,
};
function kitSigma(key, settings) {
  const s = settings && settings.kitSigma ? settings.kitSigma[key] : null;
  return s != null && s > 0 ? s : (KIT_SIGMA[key] || 0);
}

/* Slope with its standard error, so estimates can carry uncertainty rather
   than pretending to a precision the data doesn't support. */
function regressionWithError(rows) {
  if (!rows || rows.length < 3) return null;
  const xs = rows.map((r) => dayPos(r));
  const ys = rows.map((r) => r.value);
  const x0 = xs[0];
  const X = xs.map((x) => x - x0);
  const n = X.length;
  const mx = X.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (X[i] - mx) * (ys[i] - my); sxx += (X[i] - mx) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let ssr = 0;
  for (let i = 0; i < n; i++) { const pred = intercept + slope * X[i]; ssr += (ys[i] - pred) ** 2; }
  const resSD = n > 2 ? Math.sqrt(ssr / (n - 2)) : 0;
  const seSlope = resSD / Math.sqrt(sxx);
  return { slope, intercept, seSlope, resSD, n, spanDays: X[n - 1] - X[0] };
}

/* --- 1. Self-calibrating dose strength ---
 *
 * A dose change is a controlled experiment. Before it, consumption
 * C = D1*k - s1; after, C = D2*k - s2, where k is units delivered per mL and
 * s is the observed drift. If consumption held steady across the change, the
 * two are equal and k falls out:
 *
 *     k = (s1 - s2) / (D1 - D2)
 *
 * The assumption that consumption is unchanged is the weak point, so the
 * comparison windows are kept short and the result is reported as a range from
 * the regression standard errors — never as a bare number.
 */
function calibrateDoseStrength(key, readings, doseLog, waterChanges, settings) {
  const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const volumeL = s.volumeL || 77;

  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === key)
    .sort(byOldest);
  if (!changes.length) return { status: "nochanges", key };

  const rows = readings.filter((r) => r.param === key).sort(byOldest);
  const WINDOW = 21;           // days either side — long enough for signal,
  const MIN_READINGS = 4;      // short enough that demand shouldn't move much
  const estimates = [];
  const skipped = [];

  for (let i = 0; i < changes.length; i++) {
    const ch = changes[i];
    const prior = i > 0 ? changes[i - 1] : null;
    const dBefore = prior ? prior.ml : null;
    const dAfter = ch.ml;
    // Without a previous logged rate the earlier dose is unknown.
    if (dBefore == null) { skipped.push({ date: ch.date, why: "no earlier dose on record" }); continue; }
    const deltaD = dAfter - dBefore;
    if (Math.abs(deltaD) < 1 || Math.abs(deltaD) / Math.max(dBefore, 1) < 0.15) {
      skipped.push({ date: ch.date, why: `change of ${deltaD.toFixed(1)} mL is too small to measure against` });
      continue;
    }

    const startBefore = addDays(ch.date, -WINDOW);
    const endAfter = addDays(ch.date, WINDOW);
    const before = rows.filter((r) => r.date >= startBefore && r.date < ch.date);
    const after = rows.filter((r) => r.date > ch.date && r.date <= endAfter);
    if (before.length < MIN_READINGS || after.length < MIN_READINGS) {
      skipped.push({ date: ch.date, why: `only ${before.length} readings before and ${after.length} after` });
      continue;
    }

    // A water change inside either window shifts the level independently.
    const wcInside = (waterChanges || []).some((w) => w.date >= startBefore && w.date <= endAfter);
    if (wcInside) { skipped.push({ date: ch.date, why: "a water change falls inside the comparison window" }); continue; }

    const r1 = regressionWithError(before);
    const r2 = regressionWithError(after);
    if (!r1 || !r2) { skipped.push({ date: ch.date, why: "not enough spread in the readings" }); continue; }

    const kPerMl = (r1.slope - r2.slope) / (dBefore - dAfter);
    if (!isFinite(kPerMl) || kPerMl <= 0) {
      skipped.push({ date: ch.date, why: "the level moved opposite to the dose change — something else was going on" });
      continue;
    }
    const seK = Math.sqrt(r1.seSlope ** 2 + r2.seSlope ** 2) / Math.abs(deltaD);
    const strength = kPerMl * volumeL / 100;
    const seStrength = seK * volumeL / 100;
    estimates.push({
      date: ch.date, dBefore, dAfter, deltaD,
      slopeBefore: r1.slope, slopeAfter: r2.slope,
      nBefore: r1.n, nAfter: r2.n,
      kPerMl, strength, seStrength,
      lo: Math.max(0, strength - 2 * seStrength), hi: strength + 2 * seStrength,
    });
  }

  const entered = s[cfg.strengthField];
  if (!estimates.length) return { status: "nodata", key, cfg, entered, skipped };

  // Median is more robust than a mean when one experiment was disturbed.
  const sorted = [...estimates].sort((a, b) => a.strength - b.strength);
  const median = sorted[Math.floor(sorted.length / 2)].strength;
  const widest = {
    lo: Math.min(...estimates.map((e) => e.lo)),
    hi: Math.max(...estimates.map((e) => e.hi)),
  };
  const enteredInside = entered >= widest.lo && entered <= widest.hi;
  const ratio = entered > 0 ? median / entered : null;
  // A result wildly different from the entered figure usually means the
  // assumption of steady consumption failed, not that the bottle is wrong.
  const implausible = ratio != null && (ratio > 5 || ratio < 0.2);

  return {
    status: "ok", key, cfg, entered, estimates, skipped,
    median, range: widest, enteredInside, ratio, implausible,
  };
}



/* --- Demand over time, for any dosed element ---
 *
 * Rolling windows of consumption = dose - drift. Each point carries its own
 * standard error so the chart can show an uncertainty band rather than a bare
 * line implying more precision than the readings support.
 *
 * Only offered where the signal actually clears the noise. Measured against
 * this tank's own data: alkalinity has a signal-to-noise ratio around 97,
 * calcium around 13, magnesium around 1.2 — magnesium's estimate flips sign
 * between windows, so charting it would be drawing patterns in noise.
 */
const DEMAND_SERIES = {
  alkalinity: { windowDays: 21, stepDays: 10, minReadings: 4, unit: "dKH" },
  calcium:    { windowDays: 30, stepDays: 14, minReadings: 4, unit: "ppm" },
};

function computeDemandSeries(key, readings, waterChanges, settings) {
  const cfg = DEMAND_SERIES[key];
  const el = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg || !el) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return { status: "novolume", key, el };
  const doseMl = s[el.doseField] || 0;
  const strength = s[el.strengthField] || 0;
  if (doseMl <= 0 || strength <= 0) return { status: "nodose", key, el };

  const perDay = doseMl * strength * (100 / s.volumeL);
  const rows = readings.filter((r) => r.param === key).sort(byOldest);
  if (rows.length < cfg.minReadings + 2) return { status: "insufficient", key, el, have: rows.length };

  const first = dayNum(rows[0].date), last = dayNum(rows[rows.length - 1].date);
  const points = [];
  for (let t = first + cfg.windowDays; t <= last; t += cfg.stepDays) {
    const lo = t - cfg.windowDays;
    const seg = rows.filter((r) => dayNum(r.date) >= lo && dayNum(r.date) <= t);
    if (seg.length < cfg.minReadings) continue;
    const r = regressionWithError(seg);
    if (!r) continue;

    /* Water changes inside the window move the level independently of coral
       demand, so their contribution is added back before calling the remainder
       consumption. */
    const saltVal = SALT_MIX.values[key];
    let wcPerDay = 0;
    if (saltVal != null) {
      const inWin = (waterChanges || []).filter((w) => {
        const d = dayNum(w.date);
        return d >= lo && d <= t;
      });
      let total = 0;
      for (const w of inWin) {
        const f = Math.min(1, (w.litres || 0) / s.volumeL);
        let near = seg[0], best = Infinity;
        for (const x of seg) {
          const gap = Math.abs(dayNum(x.date) - dayNum(w.date));
          if (gap < best) { best = gap; near = x; }
        }
        total += f * (saltVal - near.value);
      }
      wcPerDay = total / cfg.windowDays;
    }

    const demand = perDay + wcPerDay - r.slope;
    const date = addDays(rows[0].date, t - dayNum(rows[0].date));
    points.push({
      label: fmtShort(date), date, demand,
      lo: demand - 2 * r.seSlope, hi: demand + 2 * r.seSlope,
      se: r.seSlope, n: seg.length,
    });
  }

  if (points.length < 2) return { status: "insufficient", key, el, have: rows.length };

  const vals = points.map((p) => p.demand);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const meanSE = points.reduce((a, p) => a + p.se, 0) / points.length;
  const snr = meanSE > 0 ? Math.abs(mean) / meanSE : Infinity;

  // Is demand growing? Compare the first and last thirds rather than endpoints.
  const third = Math.max(1, Math.floor(points.length / 3));
  const early = points.slice(0, third).reduce((a, p) => a + p.demand, 0) / third;
  const late = points.slice(-third).reduce((a, p) => a + p.demand, 0) / third;
  const change = late - early;
  const meaningful = Math.abs(change) > 2 * meanSE;
  const direction = !meaningful ? "steady" : change > 0 ? "rising" : "falling";

  return {
    status: "ok", key, el, points, perDay, mean, meanSE, snr,
    change, direction, meaningful, unit: cfg.unit, windowDays: cfg.windowDays,
  };
}

/* --- 2. Calcium carbonate deposited ---
 *
 * Alkalinity consumption converts directly to mass of CaCO3:
 *   dKH -> meq/L  (1 dKH = 1/2.8 meq/L)
 *   x volume     -> meq/day
 *   / 2          -> mmol/day  (carbonate carries two charges)
 *   x 100.087    -> mg/day
 *
 * Scope matters: this is ALL calcium carbonate laid down, which includes
 * coralline algae, calcifying inverts, and abiotic precipitation on heaters
 * and pumps — not coral growth alone. Partial nitrogen cycling and magnesium
 * incorporation also consume a little alkalinity, so the figure is a slight
 * overstatement. Published guidance holds these are much less important than
 * calcification, so it remains a fair proxy provided it is labelled honestly.
 */
const CACO3_MOLAR_MASS = 100.087;   // g/mol
const ARAGONITE_DENSITY = 2.93;     // g/cm3

function computeSkeletonMass(alkConsumedPerDay, volumeL) {
  if (!alkConsumedPerDay || alkConsumedPerDay <= 0 || !volumeL) return null;
  const meqPerDay = alkConsumedPerDay * (1 / 2.8) * volumeL;
  const mmolPerDay = meqPerDay / 2;
  const gPerDay = (mmolPerDay * CACO3_MOLAR_MASS) / 1000;
  return {
    gPerDay, gPerWeek: gPerDay * 7, gPerMonth: gPerDay * 30.44,
    kgPerYear: (gPerDay * 365) / 1000,
    cm3PerMonth: (gPerDay * 30.44) / ARAGONITE_DENSITY,
    meqPerDay, mmolPerDay,
  };
}

/* --- 3. Nutrient production ---
 *
 * A water change replaces a fraction f of the volume, so it removes
 * f x (current - newWater), proportional to the standing level rather than a
 * fixed amount. Over a window:
 *
 *   Cend - Cstart = P*days - SUM_i f_i*(C_i - Cnew)
 *   =>  P = [ (Cend - Cstart) + SUM_i f_i*(C_i - Cnew) ] / days
 *
 * Scope: P is production NET OF ALL OTHER EXPORT — skimmer, carbon, GFO,
 * refugium. It is not gross biological production, and saying otherwise would
 * overstate what the arithmetic supports.
 */
function computeNutrientProduction(key, readings, waterChanges, settings, days = 60) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  if (!(s.volumeL > 0)) return { status: "novolume", key };
  const def = PARAM_DEFS.find((d) => d.key === key);
  if (!def) return null;
  const rows = windowRows(readings, key, days);
  if (rows.length < 3) return { status: "insufficient", have: rows.length, def };

  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  if (spanDays < 14) return { status: "tooshort", spanDays, def };

  const cStart = rows[0].value, cEnd = rows[rows.length - 1].value;
  const cNew = SALT_MIX.values[key] != null ? SALT_MIX.values[key] : 0;

  const wcs = (waterChanges || []).filter((w) => w.date >= rows[0].date && w.date <= rows[rows.length - 1].date);
  let removed = 0;
  for (const w of wcs) {
    const f = Math.min(1, (w.litres || 0) / s.volumeL);
    // Concentration at the time of that change, from the nearest reading.
    let near = rows[0], best = Infinity;
    for (const r of rows) {
      const gap = Math.abs(daysBetween(r.date, w.date));
      if (gap < best) { best = gap; near = r; }
    }
    removed += f * (near.value - cNew);
  }

  /* Without logged water changes the equation has no export term, so
     "production" collapses to net drift — which is near zero on a stable tank
     and says nothing about what the tank actually makes. Report that honestly
     rather than printing 0 ppm/week alongside advice that assumes otherwise. */
  if (!wcs.length) {
    return {
      status: "nowaterchanges", def, key, spanDays, cStart, cEnd, cNew,
      netDrift: (cEnd - cStart) / spanDays * 7,
    };
  }

  const perDay = ((cEnd - cStart) + removed) / spanDays;
  const perWeek = perDay * 7;

  /* Production can legitimately come out negative — a tank running heavy
     export consumes more than it generates. That is worth reporting, but an
     equilibrium and a "litres needed to hold" figure derived from it are not:
     they would be negative concentrations, which cannot exist. */
  const netConsumer = perWeek <= 0;

  // Weekly export at the current level, and where the level would settle if
  // water changes were the only thing removing it.
  const avgF = wcs.length
    ? wcs.reduce((a, w) => a + Math.min(1, (w.litres || 0) / s.volumeL), 0) / wcs.length : 0;
  const changesPerWeek = wcs.length ? (wcs.length / spanDays) * 7 : 0;
  const weeklyExport = avgF * changesPerWeek * (cEnd - cNew);
  const offsetPct = perWeek > 0 ? (weeklyExport / perWeek) * 100 : null;
  const equilibrium = (avgF * changesPerWeek) > 0 && !netConsumer
    ? cNew + perWeek / (avgF * changesPerWeek) : null;

  /* At equilibrium production equals export:
     P = (litres/volume) x (level - newWater) per week
     so the volume needed to hold any chosen level is
     litres = P x volume / (level - newWater) */
  const litresToHold = (target) => {
    const head = target - cNew;
    if (!(head > 0) || netConsumer) return null;
    const litres = (perWeek * s.volumeL) / head;
    return isFinite(litres) && litres > 0 ? litres : null;
  };
  const holdAtTarget = litresToHold(def.max);
  const holdAtMid = litresToHold((def.min + def.max) / 2);

  /* How quickly a change in routine actually lands. Each change removes a
     fraction f, so a deviation decays with a half-life of ln2 / -ln(1-f). */
  const weeklyF = avgF * changesPerWeek;
  const halfLifeDays = weeklyF > 0 && weeklyF < 1
    ? (Math.log(2) / -Math.log(1 - weeklyF)) * 7 : null;

  return {
    status: "ok", def, key, spanDays, cStart, cEnd, cNew,
    removed, perDay, perWeek, wcCount: wcs.length,
    weeklyExport, offsetPct: netConsumer ? null : offsetPct,
    equilibrium, saltFree: cNew === 0, netConsumer,
    holdAtTarget, holdAtMid, halfLifeDays, currentLitres: avgF * s.volumeL,
  };
}




/* --- The one drift rule ---
 *
 * Published guidance gives a clean decision line: weekly drift under ~0.5 dKH
 * is normal and needs no action; beyond that, dosing needs adjusting. Every
 * box on screen now derives from this same figure over the same window, so
 * "keep doing what you're doing" and "raise the dose" can no longer appear
 * side by side.
 */
const DRIFT_GUIDE = {
  alkalinity: { perWeek: 0.5, unit: "dKH", dp: 2 },
  calcium:    { perWeek: 10,  unit: "ppm", dp: 0 },
  magnesium:  { perWeek: 25,  unit: "ppm", dp: 0 },
};

function assessDrift(key, readings, days) {
  const guide = DRIFT_GUIDE[key];
  if (!guide) return null;
  const rows = windowRows(readings, key, days);
  if (rows.length < 3) return { status: "insufficient", rows: rows.length, guide };
  const slope = regressionSlope(rows);
  if (slope == null) return { status: "insufficient", rows: rows.length, guide };
  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  const perWeek = slope * 7;
  const shown = parseFloat(Math.abs(perWeek).toFixed(guide.dp));
  return {
    status: "ok", guide, perWeek, shown, spanDays, rows: rows.length,
    direction: perWeek > 0 ? "rising" : perWeek < 0 ? "falling" : "flat",
    // Within the guide means hold; beyond it means the dose needs a nudge.
    needsAction: shown > guide.perWeek,
    severity: shown > guide.perWeek * 2 ? "high" : shown > guide.perWeek ? "mild" : "none",
  };
}

const DOSE_ADVICE_RULES = {
  /* Assessment windows match the timescale each element is actually managed
     on: alkalinity weekly, calcium and magnesium fortnightly. After a doser
     change the clock restarts — a full window has to pass before the new rate
     can be judged, because the tank is still settling into it. */
  alkalinity: { minReadings: 3, minDaysSinceChange: 7,  meaningful: 0.3, unit: "dKH", dp: 2, window: 7,  maxWindow: 21 },
  calcium:    { minReadings: 3, minDaysSinceChange: 14, meaningful: 15,  unit: "ppm", dp: 0, window: 14, maxWindow: 35 },
  /* Magnesium only gets advice when it is actually being dosed — otherwise the
     movement is water changes, and telling someone to adjust a dose that does
     not exist is worse than saying nothing. Longer window, bigger threshold,
     because demand is roughly a tenth of calcium's. */
  magnesium:  { minReadings: 3, minDaysSinceChange: 14, meaningful: 40,  unit: "ppm", dp: 0, window: 14, maxWindow: 35, requiresDose: true },
};

function computeDoseAdvice(readings, doseLog, paramDefs, days = null, settings = DEFAULT_SETTINGS) {
  const out = {};
  let anyLastChange = null, anyDays = null;

  for (const key of Object.keys(DOSE_ADVICE_RULES)) {
    const def = paramDefs.find((d) => d.key === key);
    if (!def) continue;
    const rule = DOSE_ADVICE_RULES[key];

    /* Every element needs this, not just magnesium: telling someone "the dose
       is matching consumption, leave it alone" when they dose nothing at all
       is nonsense. */
    const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
    const dosed = cfg ? (settings[cfg.doseField] || 0) : 0;
    if (dosed <= 0) { out[key] = { status: "notdosed", key, def }; continue; }

    /* Each element has its own doser history — changing the calcium dose says
       nothing about whether an alkalinity trend is readable. */
    const sortedDoses = [...(doseLog || [])]
      .filter((d) => (d.element || "alkalinity") === key)
      .sort(byNewest);
    const lastChange = sortedDoses.length ? sortedDoses[0] : null;
    const daysSinceChange = lastChange ? daysBetween(lastChange.date, todayStr()) : null;
    if (lastChange && (!anyLastChange || lastChange.date > anyLastChange.date)) {
      anyLastChange = lastChange; anyDays = daysSinceChange;
    }

    /* Dosing decisions use a fixed assessment window per element, NOT whatever
       window the user happens to be viewing. A week of alkalinity holds only
       four to six readings; at +/-0.1 dKH kit resolution, noise alone can fake
       a 0.5 dKH weekly slope. The chips change what you're looking at; they
       must not change what the app tells you to do to your doser. */
    /* Start at the element's natural window. If testing has been less frequent
       than that window assumes, reach back a little further rather than
       reporting nothing — and flag that it did, so the figure isn't mistaken
       for a clean fortnight. */
    let win = rule.window;
    let extended = false;
    while (win < (rule.maxWindow || rule.window)) {
      const r = windowRows(readings, key, win)
        .filter((x) => !lastChange || x.date >= lastChange.date);
      if (r.length >= rule.minReadings) break;
      win += 7;
      extended = true;
    }
    const viewWin = days && days < 99999 ? days : null;

    let rows = windowRows(readings, key, win);
    if (lastChange) rows = rows.filter((r) => r.date >= lastChange.date);
    if (rows.length < rule.minReadings) {
      out[key] = { status: "insufficient", key, rows: rows.length, need: rule.minReadings, win, extended, lastChange, daysSinceChange };
      continue;
    }
    if (lastChange && daysSinceChange != null && daysSinceChange < rule.minDaysSinceChange) {
      /* Still describe what the readings are doing — the user can see the
         parameter moving, and saying nothing about it feels evasive. It just
         isn't grounds for touching the doser again yet. */
      let sinceMove = null;
      const sinceRows = rows.filter((r) => r.date >= lastChange.date);
      if (sinceRows.length >= 2) {
        const first = sinceRows[0].value, last = sinceRows[sinceRows.length - 1].value;
        const delta = last - first;
        if (Math.abs(delta) > 1e-9) {
          sinceMove = {
            delta, direction: delta > 0 ? "risen" : "fallen",
            amount: Math.abs(delta), n: sinceRows.length,
          };
        }
      }
      out[key] = {
        status: "settling", key, def, daysSinceChange, need: rule.minDaysSinceChange,
        lastChange, sinceMove, guide: DRIFT_GUIDE[key],
      };
      continue;
    }

    // Everything below comes from the one shared drift assessment.
    const drift = assessDrift(key, readings, win);

    /* Rising toward a band you are below is recovery, not overdosing. Judging
       by drift alone tells someone bringing a crashed tank back up to cut the
       dose, which would stall exactly the correction they are making. */
    if (drift && drift.status === "ok" && def) {
      const rowsWin = windowRows(readings, key, win);
      const first = rowsWin[0].value, last = rowsWin[rowsWin.length - 1].value;
      const startedBelow = first < def.min, startedAbove = first > def.max;
      const nowInside = last >= def.min && last <= def.max;
      const movingUp = drift.direction === "rising";
      /* Recovery means an active correction, not a parameter sitting stuck
         just outside its band while drifting by less than the kit can read.
         Require the movement to be real before calling it a correction. */
      const meaningful = drift.needsAction;
      const closing = meaningful &&
        ((startedBelow && movingUp) || (startedAbove && !movingUp));
      const overshooting = (startedBelow && movingUp && last > def.max)
        || (startedAbove && !movingUp && last < def.min);
      if (closing && !overshooting) {
        out[key] = {
          status: "recovering", key, def, drift, win,
          startedAt: first, now: last, nowInside,
          direction: drift.direction,
        };
        continue;
      }
    }
    if (!drift || drift.status !== "ok") {
      out[key] = { status: "insufficient", key, rows: rows.length, need: rule.minReadings, win };
      continue;
    }

    /* If the window on screen tells a different story, say so rather than
       leaving the user to spot the discrepancy themselves. */
    let viewNote = null;
    if (viewWin && viewWin < win) {
      const viewDrift = assessDrift(key, readings, viewWin);
      if (viewDrift && viewDrift.status === "ok" && viewDrift.needsAction !== drift.needsAction) {
        viewNote = {
          days: viewWin,
          shown: viewDrift.shown,
          direction: viewDrift.direction,
          steeper: viewDrift.shown > drift.shown,
        };
      }
    }

    /* A dose that matches consumption holds the level wherever it happens to
       be — including below the band. "Leave it alone" is right for the dose
       and wrong for the tank, so the two need separating. */
    const rowsNow = windowRows(readings, key, win);
    const latestVal = rowsNow.length ? rowsNow[rowsNow.length - 1].value : null;
    const offTarget = latestVal == null ? null
      : latestVal < def.min ? "low" : latestVal > def.max ? "high" : null;

    out[key] = {
      status: drift.needsAction ? "adjust" : "hold",
      key, def, drift, win, extended, viewWin, viewNote, daysSinceChange, lastChange,
      offTarget, latestVal,
      direction: drift.direction,
      pct: drift.severity === "high" ? 15 : 10,
      /* Only computed once the drift has cleared the same evidence bar the
         verdict uses, so a single reading can never move the doser. */
      calc: computeDoseCalc(key, drift.perWeek, settings),
    };
  }

  /* The joint observation is specifically about calcium and alkalinity moving
     as a pair. It must not be attached to magnesium, which was producing text
     naming the wrong two elements. */
  const a = out.alkalinity, c = out.calcium;
  const together = !!(a && c && a.status === "adjust" && c.status === "adjust" &&
    a.direction === c.direction);

  return { advice: out, together, lastChange: anyLastChange, daysSinceChange: anyDays };
}


/* --- Turning a drift into an actual dose ---
 *
 * The percentage nudge is a rule of thumb. With the doser rate and the product
 * strength recorded, the real figure can be derived instead:
 *
 *   delivered/day   = mL/day x strength x (100 / tank litres)
 *   consumed/day    = delivered/day - observed drift/day
 *   dose to hold    = consumed/day / (strength x 100 / litres)
 *
 * Any drift means dose and demand disagree; solving for the dose that makes
 * them equal is just arithmetic once the inputs exist.
 */
function computeDoseCalc(key, driftPerWeek, settings) {
  const cfg = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!cfg) return null;
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const doseMl = s[cfg.doseField] || 0;
  const strength = s[cfg.strengthField] || 0;
  const litres = s.volumeL || 77;
  if (doseMl <= 0 || strength <= 0 || litres <= 0) return null;

  const perMl = strength * (100 / litres);      // units delivered per mL
  const delivered = doseMl * perMl;              // units per day
  const driftPerDay = driftPerWeek / 7;
  const consumed = delivered - driftPerDay;      // what the tank actually uses

  // If the tank consumes nothing (or gains), no dose can hold it level.
  if (consumed <= 0) {
    return { doseMl, perMl, delivered, driftPerDay, consumed, litres,
             impossible: true, recommendedMl: 0 };
  }

  const recommendedMl = consumed / perMl;
  const deltaMl = recommendedMl - doseMl;
  const pct = (deltaMl / doseMl) * 100;

  /* A single jump of more than about a fifth is a bigger correction than the
     tank should absorb at once, so suggest getting there in two steps. */
  const big = Math.abs(pct) > 20;
  const stepMl = big ? doseMl + deltaMl / 2 : recommendedMl;

  return {
    doseMl, perMl, delivered, driftPerDay, consumed, litres,
    recommendedMl, deltaMl, pct, big, stepMl, impossible: false,
  };
}

/* The calculation written out, so the number can be checked rather than trusted. */
function doseCalcText(calc, key, def) {
  if (!calc) return null;
  const u = def.unit;
  const f = (v) => fmtAmount(v);

  if (calc.impossible) {
    return `Working it through: ${calc.doseMl} mL a day delivers about ${f(calc.delivered)}${u}, and your ${key} is climbing by ${f(Math.abs(calc.driftPerDay))}${u} a day on top of that — so the tank is using less than you're adding. There's no dose that holds this level; ease right back, or pause dosing until it settles, then start again from a lower rate.`;
  }

  const dir = calc.deltaMl > 0 ? "up" : "down";
  const lines = [
    `Working it through: your ${calc.doseMl} mL a day delivers about ${f(calc.delivered)}${u} to ${calc.litres}L, and the tank has been ${calc.driftPerDay >= 0 ? "gaining" : "losing"} ${f(Math.abs(calc.driftPerDay))}${u} a day — so it's actually consuming around ${f(calc.consumed)}${u} a day.`,
    `To match that, the dose wants to be about ${calc.recommendedMl.toFixed(1)} mL a day — ${dir} ${Math.abs(calc.deltaMl).toFixed(1)} mL from where you are now (${calc.pct > 0 ? "+" : ""}${calc.pct.toFixed(0)}%).`,
  ];
  if (calc.big) {
    lines.push(`That's a sizeable jump in one go, so move to about ${calc.stepMl.toFixed(1)} mL first, give it a week and re-test, then finish the change if the trend confirms it.`);
  } else {
    lines.push(`Make the change, then leave it a week and re-test before touching it again.`);
  }
  return lines.join(" ");
}

function windowPhrase(days) {
  if (!days || days >= 99999) return "your whole log";
  if (days === 7) return "the last 7 days";
  return `the last ${days} days`;
}

/* doseAdviceText belonged to the old dose UI and had no remaining caller. */

/* Calcification consumes calcium and alkalinity in a fixed proportion: about
   20 ppm of calcium per meq of alkalinity, which is 7.1 ppm per dKH at the
   textbook figure. Real tanks land a little either side, so a band is used
   rather than a point. These were referenced in seven places and declared in
   none — lost when the old dosing UI that preceded them was removed, and
   invisible because the app never exercised that path in normal use. */
const CA_PER_DKH_LO = 6.4;
const CA_PER_DKH_HI = 7.6;

function computeIonicBalance(readings, settings = DEFAULT_SETTINGS) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  /* Every per-litre figure divides by volume, so without a sensible one the
     whole comparison degenerates into NaN and Infinity. */
  if (!(s.volumeL > 0)) return { status: "novolume",
    note: "Set your tank volume in Setup — calcium and alkalinity consumption are both worked out per litre, so nothing here can be calculated without it." };
  const alk = windowRows(readings, "alkalinity", 60);
  const ca = windowRows(readings, "calcium", 60);
  const mg = windowRows(readings, "magnesium", 60);
  if (alk.length < 2 || ca.length < 2) return null;

  const alkSlope = regressionSlope(alk);
  const caSlope = regressionSlope(ca);
  if (alkSlope == null || caSlope == null) return null;

  const alkDose = s.dailyDoseMl > 0 && s.dkhPerMlPer100L > 0
    ? s.dailyDoseMl * s.dkhPerMlPer100L * (100 / s.volumeL) : null;
  const caDose = s.calciumDoseMl > 0 && s.caPpmPerMlPer100L > 0
    ? s.calciumDoseMl * s.caPpmPerMlPer100L * (100 / s.volumeL) : null;

  const mgNote = (() => {
    if (!mg.length || !ca.length) return null;
    const mgV = mg[mg.length - 1].value, caV = ca[ca.length - 1].value;
    if (!caV) return null;
    const r = mgV / caV;
    if (r < 2.7) return { ok: false, ratio: r,
      text: `Magnesium to calcium is ${r.toFixed(2)}:1, below the ~3.1:1 of natural seawater. Low magnesium makes alkalinity and calcium hard to hold no matter how much you dose - worth correcting first.` };
    return { ok: true, ratio: r,
      text: `Magnesium to calcium is ${r.toFixed(2)}:1, around the ~3.1:1 of natural seawater. That's the ratio that keeps calcium and alkalinity in solution and easy to dose.` };
  })();

  if (alkDose == null || caDose == null) {
    const missing = [alkDose == null ? "alkalinity" : null, caDose == null ? "calcium" : null].filter(Boolean);
    return {
      status: "nodose", mgNote, missing,
      note: `Checking whether calcium and alkalinity are consumed in proportion needs to know what you dose - consumption is the dose minus whatever drift is left over. Enter your ${missing.join(" and ")} dose in Setup and this will work.`,
    };
  }

  const alkConsumed = alkDose - alkSlope;
  const caConsumed = caDose - caSlope;

  if (alkConsumed <= 0.01) {
    return {
      status: "noconsumption", mgNote, alkConsumed, caConsumed, alkDose, caDose,
      note: `Your alkalinity isn't being drawn down at all - the dose is outpacing whatever the tank uses, so there's no calcification signal to compare calcium against. Ease the alkalinity dose back until alkalinity holds level, then this check becomes meaningful.`,
    };
  }

  const ratio = caConsumed / alkConsumed;
  const expectedLo = alkConsumed * CA_PER_DKH_LO;
  const expectedHi = alkConsumed * CA_PER_DKH_HI;
  const impliedAlk = caConsumed / ((CA_PER_DKH_LO + CA_PER_DKH_HI) / 2);

  let verdict, note;
  if (ratio >= CA_PER_DKH_LO && ratio <= CA_PER_DKH_HI) {
    verdict = "balanced";
    note = `Calcium and alkalinity are being consumed in proportion - ${ratio.toFixed(1)} ppm of calcium per dKH, inside the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} that calcification produces. Nothing is pulling one down faster than the other, and your two products are matched to what the tank actually uses.`;
  } else if (ratio > CA_PER_DKH_HI) {
    verdict = "ca-heavy";
    note = `Calcium is disappearing faster than calcification can explain - ${ratio.toFixed(1)} ppm per dKH against the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} coral skeleton actually takes. Read it the other way: using ${caConsumed.toFixed(1)} ppm of calcium a day should come with about ${impliedAlk.toFixed(2)} dKH of alkalinity, but you only use ${alkConsumed.toFixed(2)}. Most likely causes in order: the calcium product's strength is entered wrong in Setup, your calcium kit reads high, or calcium is precipitating out - check pumps and heaters for white crust.`;
  } else {
    verdict = "ca-light";
    note = `Alkalinity is being consumed faster than the calcium figure explains - only ${ratio.toFixed(1)} ppm of calcium per dKH against the ${CA_PER_DKH_LO}-${CA_PER_DKH_HI} calcification takes. Either something is consuming alkalinity beyond coral growth, or one of the inputs is off. Worth checking the alkalinity product strength in Setup, and whether nitrate has been climbing - that consumes alkalinity without touching calcium.`;
  }

  return {
    status: "ok", verdict, note, mgNote,
    alkDose, caDose, alkSlope, caSlope,
    alkConsumed, caConsumed, ratio, expectedLo, expectedHi, impliedAlk,
    band: [CA_PER_DKH_LO, CA_PER_DKH_HI],
  };
}

/* --- 3. Nutrient ratio (NO3:PO4) --- */
function computeNutrientRatio(readings) {
  const no3 = windowRows(readings, "nitrate", 60);
  const po4 = windowRows(readings, "phosphate", 60);
  if (!no3.length || !po4.length) return null;
  const n = no3[no3.length - 1], p = po4[po4.length - 1];
  if (!p.value) return null;
  const ratio = n.value / p.value;

  /* Reef convention treats roughly 100:1 NO3:PO4 by weight as balanced
     (e.g. 10 ppm nitrate against 0.10 ppm phosphate). A ratio alone says
     nothing about whether there is enough of either: 0.5 ppm nitrate against
     0.005 phosphate is exactly 100:1 and also a starving tank, so check the
     levels before praising the proportion. */
  const starved = n.value < 3 || p.value < 0.03;
  const loaded = n.value > 25 || p.value > 0.2;

  let verdict, note;
  if (starved) {
    verdict = "starved";
    note = `At ${n.value}ppm nitrate and ${p.value}ppm phosphate the proportion between them is ${ratio >= 50 && ratio <= 150 ? "fine" : "off"}, but the levels are the real issue — both are close to bottom. Corals need measurable nitrogen and phosphorus to build tissue, and running this lean pales them out while giving dinoflagellates an opening. Feed more, or dose nitrate back toward 5ppm, before worrying about the ratio.`;
  } else if (loaded) {
    verdict = "loaded";
    note = `At ${n.value}ppm nitrate and ${p.value}ppm phosphate the ratio is about ${ratio.toFixed(0)}:1, but both are on the high side. That usually shows as darker coral tissue and faster algae growth rather than anything acute. Bring them down gradually through water changes and export — a sudden nutrient crash is harder on corals than steady high readings.`;
  } else if (ratio >= 50 && ratio <= 150) {
    verdict = "balanced";
    note = `At ${ratio.toFixed(0)}:1 your nitrate and phosphate are in good proportion — close to the ~100:1 reefers treat as balanced. This is the zone that supports coral colour without handing an advantage to nuisance algae.`;
  } else if (ratio > 150) {
    verdict = "n-heavy";
    note = `At ${ratio.toFixed(0)}:1 you're running nitrate-heavy relative to phosphate. When phosphate becomes the limiting nutrient, corals can pale and cyanobacteria or dinoflagellates get an opening. Consider easing off phosphate export rather than chasing nitrate down.`;
  } else {
    verdict = "p-heavy";
    note = `At ${ratio.toFixed(0)}:1 phosphate is high relative to nitrate. Phosphate-dominant systems tend toward algae and can suppress calcification. Raising nitrate slightly often rebalances this better than stripping phosphate hard.`;
  }
  return { ratio, verdict, note, no3: n.value, po4: p.value, date: n.date };
}

/* --- 4. ICP cross-calibration of hobby test kits --- */
const ICP_ALIASES = {
  calcium: ["calcium", "ca"],
  magnesium: ["magnesium", "mg"],
  potassium: ["potassium", "k"],
  alkalinity: ["alkalinity", "kh", "dkh", "carbonate hardness"],
  nitrate: ["nitrate", "no3"],
  phosphate: ["phosphate", "po4"],
};

/* Labs often report the element rather than the ion. Convert to the units
   hobby kits read so the comparison is like-for-like. */
const ICP_CONVERSIONS = {
  phosphate: [
    { names: ["phosphorus", "p"], factor: 3.066, from: "P" },
  ],
  nitrate: [
    { names: ["nitrogen", "n"], factor: 4.427, from: "N" },
  ],
};

function labValueFor(def, elements) {
  const aliases = ICP_ALIASES[def.key];
  if (aliases) {
    const direct = Object.keys(elements).find((k) => aliases.includes(k.trim().toLowerCase()));
    if (direct) return { value: elements[direct], sourceName: direct, converted: null };
  }
  const convs = ICP_CONVERSIONS[def.key] || [];
  for (const c of convs) {
    const hit = Object.keys(elements).find((k) => c.names.includes(k.trim().toLowerCase()));
    if (hit) {
      return {
        value: elements[hit] * c.factor,
        sourceName: hit,
        converted: { from: c.from, factor: c.factor, raw: elements[hit] },
      };
    }
  }
  return null;
}

function computeCalibration(readings, icps, paramDefs, windowDays = 7, kitChanges = {}) {
  const results = [];
  const diagnostics = [];
  const replaced = [];
  for (const def of paramDefs) {
    if (!ICP_ALIASES[def.key] && !ICP_CONVERSIONS[def.key]) continue;
    /* Comparisons made with a kit you no longer own say nothing about the one
       you do. Anything before the replacement date is retired. */
    const since = kitChanges && kitChanges[def.key];
    const pairs = [];
    let sawElement = false;
    let nearestGap = Infinity;
    for (const test of icps) {
      if (!test.elements) continue;
      const lab = labValueFor(def, test.elements);
      if (!lab) continue;
      sawElement = true;
      let best = null, bestGap = Infinity;
      for (const r of readings.filter((r2) => r2.param === def.key)) {
        const gap = Math.abs(daysBetween(r.date, test.date));
        if (gap < bestGap) { bestGap = gap; best = r; }
      }
      if (bestGap < nearestGap) nearestGap = bestGap;
      if (since && test.date < since) continue;
      if (best && bestGap <= windowDays) {
        pairs.push({
          date: test.date, lab: lab.value, kit: best.value,
          diff: best.value - lab.value, gap: bestGap, converted: lab.converted,
        });
      }
    }
    if (!pairs.length && since) {
      replaced.push({ def, since });
    }
    if (pairs.length) {
      const meanDiff = pairs.reduce((s2, p) => s2 + p.diff, 0) / pairs.length;
      const meanPct = pairs.reduce((s2, p) => s2 + (p.lab ? (p.diff / p.lab) * 100 : 0), 0) / pairs.length;
      results.push({ def, pairs, meanDiff, meanPct, n: pairs.length, converted: pairs[0].converted });
    } else if (sawElement) {
      diagnostics.push({ def, nearestGap: nearestGap === Infinity ? null : nearestGap });
    }
  }
  return { results, diagnostics, windowDays, replaced };
}

/* --- 5. Time in range --- */
function computeTimeInRange(def, readings, days = 90) {
  const rows = windowRows(readings, def.key, days);
  if (!rows.length) return null;
  const inRange = rows.filter((r) => paramStatus(def, r.value) === "ok").length;
  const below = rows.filter((r) => r.value < def.min).length;
  const above = rows.filter((r) => r.value > def.max).length;
  return {
    pct: Math.round((inRange / rows.length) * 100),
    inRange, below, above, total: rows.length, days,
  };
}

/* --- Operating band & control quality ---
   Time in range alone conflates two different things: a tank that swings
   wildly, and a tank that sits rock-steady somewhere the target does not
   cover. Consistency is measured against the tank's own distribution, so it
   is independent of where the target happens to sit. */

function percentile(sortedVals, p) {
  if (!sortedVals.length) return null;
  const idx = Math.min(sortedVals.length - 1, Math.max(0, Math.round((p / 100) * (sortedVals.length - 1))));
  return sortedVals[idx];
}

const ROUND_STEP = {
  alkalinity: 0.1, calcium: 5, magnesium: 10, potassium: 10,
  phosphate: 0.01, nitrate: 0.5, salinity: 0.1, ph: 0.05, ammonia: 0.01,
};

/* Format a value at the precision that parameter is actually measured to,
   so pH shows 8.10 rather than 8 and calcium shows 450 rather than 450.00. */
function fmtVal(def, v) {
  if (v == null || isNaN(v)) return "—";
  const step = ROUND_STEP[def.key] || def.step || 0.1;
  const decimals = (String(step).split(".")[1] || "").length;
  return v.toFixed(decimals);
}

/* Amounts and rates need different precision from readings. A magnesium
   reading is sensibly shown to the nearest 10 ppm, but a dose of
   0.031 ppm/day rounded that way reads as zero. Scale the decimals to the
   size of the number instead. */
function fmtAmount(v) {
  if (v == null || isNaN(v)) return "\u2014";
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  if (a >= 0.01) return v.toFixed(3);
  return v.toFixed(4);
}

function roundTo(v, step) {
  const decimals = (String(step).split(".")[1] || "").length;
  return parseFloat((Math.round(v / step) * step).toFixed(decimals));
}

/* --- Per-parameter consistency rules, from published reef guidance ---
 *
 * Measured on the p05-p95 spread of readings in the window.
 *
 * Macro elements use ABSOLUTE spreads, because corals respond to the size of
 * the change: alkalinity within ~0.2 dKH/day is the figure associated with
 * strong long-term SPS outcomes, ~0.5 dKH is widely called acceptable, and
 * 1.0+ dKH swings are the ones linked to tissue loss. Calcium and magnesium
 * follow the safe-correction rates commonly quoted (~20 ppm/day Ca,
 * 50-100 ppm/day Mg). Salinity matters because even fluctuation inside the
 * optimal range is documented to stress corals.
 *
 * Nutrients use FOLD change (p95/p05) instead, because they operate at very
 * low concentrations where absolute spread is meaningless: the difference
 * between 0.01 and 0.15 ppm phosphate is a 15x swing, not "0.14 ppm". Reef
 * guidance treats a steady 0.08 as far healthier than that range.
 */
const CONSISTENCY_RULES = {
  alkalinity: { mode: "absolute", tight: 0.5,  moderate: 1.0,  unit: "dKH",
                why: "0.2 dKH/day is the tightest control band; beyond about 1 dKH of movement you are into the range linked with tissue loss" },
  calcium:    { mode: "absolute", tight: 30,   moderate: 60,   unit: "ppm",
                why: "20 ppm/day is the accepted safe rate of change for calcium" },
  magnesium:  { mode: "absolute", tight: 50,   moderate: 100,  unit: "ppm",
                why: "magnesium moves slowly; 50-100 ppm/day is the safe correction ceiling" },
  potassium:  { mode: "absolute", tight: 45,   moderate: 70,   unit: "ppm",
                why: "potassium moves slowly and hobby kits only resolve to about 20 ppm, so anywhere in the 380-420 range is comfortable" },
  salinity:   { mode: "absolute", tight: 0.5,  moderate: 1.0,  unit: "ppt",
                why: "fluctuation even inside the optimal range is documented to stress corals" },
  ph:         { mode: "absolute", tight: 0.2,  moderate: 0.4,  unit: "",
                why: "a daily swing of 0.2-0.3 is normal; more than that usually points at CO2 or alkalinity instability" },
  phosphate:  { mode: "fold",     tight: 1.8,  moderate: 2.6,  unit: "x",
                why: "nutrients are judged proportionally — a steady 0.08 ppm is healthier than a range of 0.01-0.15 ppm" },
  nitrate:    { mode: "fold",     tight: 1.6,  moderate: 2.3,  unit: "x",
                why: "nitrate should track feeding and export smoothly rather than stepping between levels" },
  ammonia:    { mode: "absolute", tight: 0.05, moderate: 0.1,  unit: "ppm",
                why: "any sustained detectable ammonia indicates a biological problem" },
};

/* --- Rate analysis for frequently-tested parameters ---
 *
 * Spread alone cannot tell apart a slow steady climb from a violent bounce.
 * Published guidance treats these as separate questions with separate
 * thresholds: daily swings under ~0.3 dKH, and weekly drift under ~0.5 dKH.
 *
 * A rate is only trustworthy when readings sit close together. Testing 8.0,
 * then 9.0 three weeks later, divides out to a flattering 0.05 dKH/day while
 * hiding whatever happened in between — so gaps beyond maxGapDays are left
 * out of the rate entirely and reported as drift instead.
 */
const RATE_RULES = {
  alkalinity: { maxGapDays: 4, dailyGood: 0.3, dailyOk: 0.5, weeklyGood: 0.5, weeklyOk: 1.0, unit: "dKH", dp: 2 },
  salinity:   { maxGapDays: 5, dailyGood: 0.1, dailyOk: 0.2, weeklyGood: 0.3, weeklyOk: 0.6, unit: "ppt", dp: 2 },
};

function computeRates(def, readings, days) {
  const rr = RATE_RULES[def.key];
  if (!rr) return null;
  const rows = windowRows(readings, def.key, days);
  if (rows.length < 3) return null;

  // Daily swing, using only pairs close enough together to mean anything.
  const closeRates = [];
  let widestGap = 0, gappedPairs = 0;
  for (let i = 1; i < rows.length; i++) {
    const gap = Math.max(0.5, daysBetween(rows[i - 1].date, rows[i].date));
    if (gap > widestGap) widestGap = gap;
    if (gap > rr.maxGapDays) { gappedPairs++; continue; }
    closeRates.push(Math.abs(rows[i].value - rows[i - 1].value) / gap);
  }

  let daily = null;
  if (closeRates.length >= 2) {
    const sorted = [...closeRates].sort((a, b) => a - b);
    // 90th percentile: tolerate one odd jump without ignoring real volatility.
    const typical = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
    /* Compare on the rounded, displayed value. Otherwise 0.30000000000000004
       reads as "above 0.3" while the screen shows 0.30. */
    const shown = parseFloat(typical.toFixed(rr.dp));
    daily = {
      value: typical,
      shown,
      worst: sorted[sorted.length - 1],
      n: closeRates.length,
      grade: shown <= rr.dailyGood ? "good" : shown <= rr.dailyOk ? "ok" : "poor",
    };
  }

  // Weekly drift: the underlying trend, not the noise around it.
  const slope = regressionSlope(rows);
  const weeklyVal = slope == null ? null : slope * 7;
  const weeklyShown = weeklyVal == null ? null : parseFloat(Math.abs(weeklyVal).toFixed(rr.dp));
  const weekly = weeklyVal == null ? null : {
    value: weeklyVal,
    shown: weeklyShown,
    direction: weeklyVal > 0 ? "up" : weeklyVal < 0 ? "down" : "flat",
    grade: weeklyShown <= rr.weeklyGood ? "good"
      : weeklyShown <= rr.weeklyOk ? "ok" : "poor",
  };

  const spanDays = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  return { rr, daily, weekly, rows: rows.length, spanDays, widestGap, gappedPairs,
           sparse: daily == null };
}

/* Describes how the parameter is moving. Deliberately says nothing about
   changing a dose — that call belongs to the dosing box, which uses the same
   window and the same drift figure, so the two can never disagree. */
function rateNarrative(def, r, windowLabel) {
  if (!r) return null;
  const { rr, daily, weekly } = r;
  const d = (v) => v.toFixed(rr.dp);
  const parts = [];
  const span = windowLabel || `these ${r.spanDays} days`;

  /* When movement is one-directional, the day-to-day figure IS the drift —
     0.30/day and 2.1/week are the same thing. Calling the daily number
     reassuring in that case contradicts the drift warning underneath it. */
  const oneWay = weekly && weekly.grade !== "good" && daily
    && Math.abs(weekly.value) > daily.value * 4;

  if (daily) {
    const dv = d(daily.value);
    if (daily.grade === "good" && oneWay) {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day. On its own that's inside the ${rr.dailyGood} ${rr.unit} most reefers aim for, but it isn't random movement — it's all in one direction, so it compounds into the drift below rather than cancelling out.`);
    } else if (daily.grade === "good") {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day — inside the ${rr.dailyGood} ${rr.unit} most reefers aim for, and it's the movement corals actually feel.`);
    } else if (daily.grade === "ok") {
      parts.push(`Between tests across ${span} you're moving about ${dv} ${rr.unit} a day, a little above the ${rr.dailyGood} ${rr.unit} ideal but still in territory most tanks handle fine. Splitting the dose into more, smaller doses across the day is the usual way to tighten it.`);
    } else {
      parts.push(`Between tests across ${span} you're swinging about ${dv} ${rr.unit} a day, more than corals like to see. More frequent smaller doses tighten this, and it's worth checking the doser is delivering what you think it is.`);
    }
  }

  if (weekly && Math.abs(weekly.value) > 0.001) {
    const wv = d(Math.abs(weekly.value));
    const dir = weekly.direction === "up" ? "climbing" : "falling";
    parts.push(`Over the same period it's ${dir} at an average of ${wv} ${rr.unit} a week.`);
    if (weekly.grade === "good") {
      parts.push(`That's gentle enough to count as normal drift.`);
    } else {
      parts.push(`That's a real direction rather than noise — what it means for your dose is covered below.`);
    }
  }

  if (r.sparse) {
    parts.push(`There aren't enough closely-spaced tests to judge day-to-day movement — readings are up to ${Math.round(r.widestGap)} days apart, and a lot can happen in between. Testing a couple of days running would tell you far more than the spread alone.`);
  } else if (r.gappedPairs > 0) {
    parts.push(`A few gaps of more than ${rr.maxGapDays} days were left out of the daily figure, since there's no way to know what happened between those tests.`);
  }

  return parts.join(" ");
}

/* --- What a reading actually means in practice ---
 *
 * Ranges alone don't tell you whether to worry. These notes carry the
 * practical consequence: magnesium at 1550 is above the usual target but
 * widely reported as harmless (and typical of Aquaforest Reef Salt, which
 * mixes high), whereas phosphate at 0.3 is a real problem. Written to be
 * read as advice, not as a lookup table.
 */
function paramContext(def, value, salt) {
  if (value == null || isNaN(value)) return null;
  const k = def.key;
  const above = value > def.max, below = value < def.min;
  if (!above && !below) return null;

  if (k === "magnesium") {
    if (above) {
      const fromSalt = salt && salt.values.magnesium >= 1380;
      return `For context, magnesium sitting in the 1500s is above the 1300–1400 most guides quote, but it's very widely reported as harmless — plenty of tanks run there for years with no ill effect on corals.${fromSalt ? ` ${salt.name} is known for mixing high in magnesium, so water changes are the likely source rather than anything going wrong.` : ""} Worth watching snails and other inverts, which are the first to mind it, and avoid pushing it higher.`;
    }
    return `Low magnesium is the one to fix promptly — it's what keeps calcium and alkalinity in solution, and when it drops they become difficult to hold no matter how much you dose.`;
  }

  if (k === "calcium") {
    if (above) {
      return `Calcium on the high side is not much of a worry — tanks run happily up to around 500–550 ppm, and high calcium causes far fewer problems than low. Just avoid raising alkalinity at the same time, since the two together are what causes precipitation.`;
    }
    return value < 380
      ? `Below about 380 ppm calcium starts to limit how fast corals can build skeleton, so this one is worth correcting — though gently. Check magnesium first, since low magnesium is usually the reason calcium won't hold.`
      : `At ${Math.round(value)} ppm you're just under your own target, but comfortably inside the 380–450 ppm range most tanks run happily. Nothing here is harming corals — it only matters if it keeps falling, so watch the direction rather than the number.`;
  }

  if (k === "alkalinity") {
    if (above) {
      return `High alkalinity speeds up calcification, which sounds good but raises the risk of burnt SPS tips when nutrients are low. If your nitrate and phosphate are on the lean side, easing alkalinity down is worth more than chasing growth.`;
    }
    return `Alkalinity on the low side slows coral growth and leaves less buffer against pH swings. Bring it up slowly — no more than about 0.5 dKH a day — since the change itself stresses corals more than the low number does.`;
  }

  if (k === "phosphate") {
    if (above) {
      return `Elevated phosphate mostly shows up as nuisance algae and slower skeletal growth, and above roughly 0.15 ppm it can start interfering with alkalinity uptake. Bring it down gradually rather than stripping it — a sudden crash is harder on corals than the high number.`;
    }
    return `Phosphate this low starves corals rather than protecting them — pale, washed-out colour is the usual sign, and near-zero nutrients are what dinoflagellates thrive on. A little more feeding is normally the fix.`;
  }

  if (k === "nitrate") {
    if (above) {
      return `Higher nitrate usually shows as darker, browner coral tissue and faster algae growth rather than anything acute. Bring it down through water changes and export rather than chasing it with additives.`;
    }
    return `Nitrate this low tends to pale corals out and, combined with low phosphate, is the classic setup for dinoflagellates. Most reefers dose nitrate back up to around 5 ppm rather than running at zero.`;
  }

  if (k === "potassium") {
    if (above) {
      return `Potassium above about 430 ppm is rarely a problem on its own and usually tracks a salt mix or a supplement. Water changes will bring it back in line. Anywhere in the 380-420 range is comfortable, so small movements within that aren't worth chasing.`;
    }
    return `Potassium below about 360 ppm is sometimes linked to pale or washed-out colour in SPS. It moves slowly and hobby kits only resolve to roughly 20 ppm, so correct it gently and re-test in a month rather than a week.`;
  }

  if (k === "salinity") {
    return above
      ? `Salinity running high is usually evaporation outpacing top-off rather than anything added. Correct it slowly with fresh RODI — sudden salinity changes stress corals more than the level itself.`
      : `Salinity running low is normally too much top-off or a water change mixed light. Bring it up gradually over days rather than in one go.`;
  }

  if (k === "ph") {
    return above
      ? `A high pH reading is usually alkalinity-driven or a probe needing calibration. It rarely needs direct action.`
      : `Low pH is most often indoor CO2 rather than anything in the tank. More surface agitation, fresh air to the skimmer, or a refugium on a reverse light cycle all help more than buffering does.`;
  }

  if (k === "ammonia") {
    return above
      ? `Any measurable ammonia needs attention now — check for a dead animal, an overfed tank, or filtration that has been disturbed.`
      : null;
  }

  return null;
}

function computeControl(def, readings, days = 90) {
  const rows = windowRows(readings, def.key, days);
  if (rows.length < 3) return null;
  const vals = rows.map((r) => r.value).sort((a, b) => a - b);
  const p05 = percentile(vals, 5), p50 = percentile(vals, 50), p95 = percentile(vals, 95);
  const spread = p95 - p05;
  const targetWidth = def.max - def.min;

  /* Direction of travel and whether every step is inside test resolution —
     previously computed separately, now part of the single control result. */
  const chrono = rows;
  const spanDaysAll = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
  let maxDelta = 0, totalMovement = 0;
  for (let i = 1; i < chrono.length; i++) {
    const d = Math.abs(chrono[i].value - chrono[i - 1].value);
    if (d > maxDelta) maxDelta = d;
    totalMovement += d;
  }
  const netChange = chrono[chrono.length - 1].value - chrono[0].value;
  const directionality = totalMovement > 0 ? Math.abs(netChange) / totalMovement : 0;
  const pattern = totalMovement === 0 ? "flat"
    : directionality > 0.6 ? (netChange > 0 ? "trending up" : "trending down")
    : "oscillating";
  const sRule = STABILITY_RULES[def.key];
  const atResolution = sRule ? maxDelta <= sRule.noiseFloor : false;

  const inRange = rows.filter((r) => paramStatus(def, r.value) === "ok").length;
  const below = rows.filter((r) => r.value < def.min).length;
  const above = rows.filter((r) => r.value > def.max).length;
  const pct = Math.round((inRange / rows.length) * 100);

  // How tight is the tank's own band relative to the width of the target band?
  /* Consistency is now judged against published per-parameter tolerances
     rather than the width of whatever target band happens to be set. */
  /* Where a rate can be measured it supersedes the spread for grading, since
     a spread cannot distinguish a slow climb from a bounce. */
  const rateInfo = computeRates(def, readings, days);
  const rateGrade = rateInfo && rateInfo.daily
    ? (rateInfo.daily.grade === "good" && (!rateInfo.weekly || rateInfo.weekly.grade !== "poor") ? "tight"
       : rateInfo.daily.grade === "poor" ? "loose" : "moderate")
    : null;
  /* A parameter sliding steadily one way can keep its median inside the band
     while being anything but controlled. Treat severe drift as its own state
     rather than letting the median decide. */
  const severeDrift = rateInfo && rateInfo.weekly && rateInfo.weekly.grade === "poor";

  /* Spread between readings taken weeks apart says nothing about how much the
     parameter swung in between, so it should not be described as a swing. */
  const avgGapDays = spanDaysAll / Math.max(1, rows.length - 1);
  const readingsFarApart = avgGapDays > Math.max(7, (def.freqDays || 7) * 2);

  const cRule = CONSISTENCY_RULES[def.key];
  let metric = null, consistency = "unknown", metricLabel = "";
  if (cRule) {
    if (cRule.mode === "fold") {
      metric = p05 > 0 ? p95 / p05 : (p95 > 0 ? Infinity : 1);
      metricLabel = `${isFinite(metric) ? metric.toFixed(1) : "\u221E"}x swing`;
    } else {
      metric = spread;
      metricLabel = `${fmtVal(def, spread)}${cRule.unit} spread`;
    }
    consistency = metric <= cRule.tight ? "tight"
      : metric <= cRule.moderate ? "moderate" : "loose";
    if (rateGrade) consistency = rateGrade;
  }
  const ratio = targetWidth > 0 ? spread / targetWidth : null;

  /* Bar fill runs the intuitive way round: full means tightly held. */
  let consistencyScore = 0;
  if (cRule && metric != null && isFinite(metric)) {
    const base = cRule.mode === "fold" ? 1 : 0;
    const t = cRule.tight, m = cRule.moderate;
    if (metric <= t) consistencyScore = 1 - 0.15 * ((metric - base) / Math.max(1e-9, t - base));
    else if (metric <= m) consistencyScore = 0.85 - 0.35 * ((metric - t) / Math.max(1e-9, m - t));
    else consistencyScore = Math.max(0.12, 0.5 - 0.38 * Math.min(1, (metric - m) / Math.max(1e-9, m - base)));
  }
  const consistencyColor = consistency === "tight" ? "#0B7C86"
    : consistency === "moderate" ? "#D98324" : "#C4285B";

  const step = ROUND_STEP[def.key] || def.step || 0.1;
  const suggested = { min: roundTo(p05, step), max: roundTo(p95, step) };
  // Only worth suggesting if it is materially different from the current target.
  const suggestDiff = Math.abs(suggested.min - def.min) + Math.abs(suggested.max - def.max);

  /* Verdict is driven by where the median sits relative to the band, not by a
     percentage cliff. A median inside the band means the tank is on target and
     the excursions are noise; a median outside it means genuinely off target. */
  const medianInside = p50 >= def.min && p50 <= def.max;
  /* If the whole spread sits inside the target band, the parameter is doing
     exactly what was asked of it — a fold ratio shouldn't override that. */
  const wholeRangeInBand = p05 >= def.min && p95 <= def.max;
  if (wholeRangeInBand && consistency === "moderate") consistency = "tight";
  const bias = p50 > def.max ? "high" : p50 < def.min ? "low" : "centred";
  const gap = bias === "high" ? p50 - def.max : bias === "low" ? def.min - p50 : 0;
  const gapTxt = gap === 0 ? "" : (gap < 1 ? gap.toFixed(2) : gap.toFixed(0)) + (def.unit || "");
  const dirWord = bias === "high" ? "above" : "below";

  let verdict, tone, headline, note;

  const name = def.label.toLowerCase();
  const band = `${fmtVal(def, def.min)}\u2013${fmtVal(def, def.max)}${def.unit}`;
  const latestVal = chrono[chrono.length - 1].value;
  const outside = below + above;

  const directional = pattern === "trending up" || pattern === "trending down";
  const wayWord = pattern === "trending up" ? "up" : "down";

  if (severeDrift || (consistency === "loose" && directional)) {
    /* One-way movement is a slide, not a swing — the advice differs and so
       should the word. */
    verdict = "sliding"; tone = "#C4285B"; headline = `Moving ${wayWord} fast`;
    const change = Math.abs(netChange);
    note = `Your ${name} has gone from ${fmtVal(def, chrono[0].value)} to ${fmtVal(def, latestVal)}${def.unit} across these ${rows.length} readings — ${fmtVal(def, change)}${def.unit} in one direction. That's not test scatter, it's a genuine slide, and it's the fastest way to lose corals even while the average still looks respectable. Getting it to stop matters more than where it stops.`;
  } else if (consistency === "loose") {
    verdict = "loose"; tone = "#C4285B"; headline = "Wide swing";
    note = readingsFarApart
      ? `Your ${name} has covered ${fmtVal(def, p05)} to ${fmtVal(def, p95)}${def.unit} across these readings, but they average ${Math.round(avgGapDays)} days apart — so that range is drift over time rather than a swing you can pin down. Testing closer together would show whether it's moving smoothly or bouncing.`
      : `Your ${name} has bounced between ${fmtVal(def, p05)} and ${fmtVal(def, p95)}${def.unit} here, and a swing that size is something corals notice. ${cRule ? cRule.why.charAt(0).toUpperCase() + cRule.why.slice(1) + "." : ""} Getting the movement under control matters more right now than where the number sits — steady in the wrong place beats bouncing through the right one.`;
  } else if (medianInside && pct >= 85 && consistency === "tight") {
    verdict = "dialled"; tone = "#0B7C86"; headline = "Dialled in";
    note = `Your ${name} is sitting comfortably in the ${band} you're aiming for, and holding it there. ${outside === 0 ? `Every reading landed inside the band.` : `Only ${outside} of ${rows.length} readings stepped outside.`} This is what you want it to look like.`;
  } else if (medianInside) {
    verdict = "controlled"; tone = "#2E8B57"; headline = "Well controlled";
    const bothSides = below > 0 && above > 0;
    note = `Your ${name} is centred in the ${band} band, currently reading ${fmtVal(def, latestVal)}${def.unit}.${outside === 0 ? ` Every reading landed inside it.` : bothSides ? ` ${outside} of ${rows.length} readings drifted outside, on both the high and low side, so there's no consistent bias — that pattern is normal test-to-test variation.` : ` ${outside} of ${rows.length} readings sat ${below > 0 ? "under" : "over"} the band.`}${consistency === "moderate" ? ` Movement is a little wider than ideal, so it's worth keeping an eye on.` : ``}`;
  } else if (consistency === "tight") {
    verdict = "steady-off"; tone = "#1D6FA5"; headline = `Steady, running ${bias}`;
    note = `Your ${name} has been very steady, but it's settled around ${fmtVal(def, p50)}${def.unit} — about ${gapTxt} ${dirWord} the ${band} you're aiming for. Corals care far more about steadiness than about the exact number, so a tank parked here and holding is in decent shape. The usual call is to move your target to match the tank rather than push the tank to match the target.`;
  } else {
    verdict = "drifting"; tone = "#D98324"; headline = `Drifting ${bias}`;
    note = `Your ${name} is running around ${fmtVal(def, p50)}${def.unit}, roughly ${gapTxt} ${dirWord} the ${band} band, and it's moving about while it does. Steady the movement first — corrections are far easier to judge once a parameter has stopped wandering.`;
  }

  const contextNote = paramContext(def, latestVal, SALT_MIX);

  /* Only offer a new target where the tank is genuinely biased and held
     tightly. Suggesting a wider band for a swinging parameter would just
     hide instability, and a centred median needs no retarget at all. */
  const suggestWorth = verdict === "steady-off" && suggestDiff > (ROUND_STEP[def.key] || def.step || 0.1) * 1.5;

  return {
    rows: rows.length, pct, inRange, below, above,
    p05, p50, p95, spread, ratio, consistency, consistencyScore, consistencyColor,
    medianInside, bias, gap, metric, metricLabel, cRule,
    pattern, atResolution, maxDelta, netChange, rateInfo, rateGrade,
    suggested, suggestWorth, verdict, tone, headline, note, contextNote, days,
  };
}

/* --- Salt mix baseline: Aquaforest Reef Salt, manufacturer figures at 35 ppt --- */
const SALT_MIX = {
  name: "Aquaforest Reef Salt",
  salinity: 35,
  /* Midpoints of the published ranges. Aquaforest state Reef Salt is
     nitrate- and phosphate-free, so both baseline to zero. */
  values: { alkalinity: 8.0, calcium: 425, magnesium: 1390, potassium: 390, nitrate: 0, phosphate: 0 },
  ranges: { alkalinity: [7.7, 8.3], calcium: [410, 440], magnesium: [1360, 1420], potassium: [380, 400] },
};

/* --- ICP reference ranges (mg/L). Trace targets follow natural seawater
       and the bands the major reef ICP labs report against. --- */
/* Reference ranges as published by Triton on their ICP-OES reports.
   Where Triton states a single setpoint rather than a range, the band is
   that setpoint +/-10% and is marked `derived` so the app can say so
   rather than implying Triton drew the boundary. */
/* Triton's report is organised into groups, and so is this list. Alphabetical
   order buried the elements you actually manage under a dozen contaminants
   that should always read zero. */
const ICP_GROUPS = [
  { id: "macro", label: "Macro elements",
    members: ["calcium", "magnesium", "potassium", "sodium", "chloride", "sulphur",
              "strontium", "boron", "bromide", "fluoride", "salinity"] },
  { id: "nutrient", label: "Nutrients",
    members: ["phosphate", "phosphorus", "nitrate", "nitrogen"] },
  { id: "trace", label: "Trace elements",
    members: ["iodine", "lithium", "molybdenum", "manganese", "iron", "zinc",
              "nickel", "vanadium", "chromium", "cobalt", "barium", "silicon"] },
  { id: "contaminant", label: "Contaminants (target zero)",
    members: ["aluminium", "aluminum", "antimony", "arsenic", "lead", "cadmium",
              "copper", "lanthanum", "mercury", "scandium", "selenium",
              "titanium", "tungsten", "tin", "beryllium"] },
];

function icpGroupOf(name) {
  const k = String(name || "").toLowerCase();
  const g = ICP_GROUPS.find((grp) => grp.members.includes(k));
  return g ? g.id : "other";
}

const ICP_REFERENCE = {
  aluminium:   { lo: 0, hi: 0.06, ideal: 0.02, unit: "mg/L", toxic: true },
  antimony:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  arsenic:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  lead:        { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  cadmium:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  copper:      { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  lanthanum:   { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  mercury:     { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  scandium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  selenium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  titanium:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  tungsten:    { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  tin:         { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  sodium:      { lo: 10000, hi: 11300, ideal: 10650, unit: "mg/L" },
  calcium:     { lo: 415, hi: 520, ideal: 450, unit: "mg/L" },
  magnesium:   { lo: 1320, hi: 1500, ideal: 1400, unit: "mg/L" },
  potassium:   { lo: 380, hi: 480, ideal: 420, unit: "mg/L" },
  strontium:   { lo: 8, hi: 12, ideal: 9, unit: "mg/L" },
  vanadium:    { lo: 0, hi: 0.003, ideal: 0.001, unit: "mg/L" },
  zinc:        { lo: 0, hi: 0.005, ideal: 0.002, unit: "mg/L" },
  manganese:   { lo: 0, hi: 0.003, ideal: 0.001, unit: "mg/L" },
  iodine:      { lo: 0.03, hi: 0.09, ideal: 0.06, unit: "mg/L" },
  chromium:    { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  cobalt:      { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  iron:        { lo: 0, hi: 0.001, ideal: 0, unit: "mg/L" },
  barium:      { lo: 0, hi: 0.01, ideal: 0.003, unit: "mg/L" },
  beryllium:   { lo: 0, hi: 0, ideal: 0, unit: "mg/L", toxic: true },
  silicon:     { lo: 0, hi: 0.2, ideal: 0.08, unit: "mg/L" },
  phosphorus:  { lo: 0.006, hi: 0.023, ideal: 0.014, unit: "mg/L" },
  phosphate:   { lo: 0.018, hi: 0.07, ideal: 0.04, unit: "mg/L" },
  chloride:    { lo: 17550, hi: 21450, ideal: 19500, unit: "mg/L", setpoint: 19500, derived: true },
  bromide:     { lo: 59.4, hi: 72.6, ideal: 66, unit: "mg/L", setpoint: 66, derived: true },
  boron:       { lo: 4.05, hi: 4.95, ideal: 4.5, unit: "mg/L", setpoint: 4.5, derived: true },
  fluoride:    { lo: 1.17, hi: 1.43, ideal: 1.3, unit: "mg/L", setpoint: 1.3, derived: true },
  sulphur:     { lo: 810, hi: 990, ideal: 900, unit: "mg/L", setpoint: 900, derived: true },
  lithium:     { lo: 0.18, hi: 0.22, ideal: 0.2, unit: "mg/L", setpoint: 0.2, derived: true },
  nickel:      { lo: 0.0045, hi: 0.0055, ideal: 0.005, unit: "mg/L", setpoint: 0.005, derived: true },
  molybdenum:  { lo: 0.0108, hi: 0.0132, ideal: 0.012, unit: "mg/L", setpoint: 0.012, derived: true },
  salinity:    { lo: 31.5, hi: 38.5, ideal: 35, unit: "PSU", setpoint: 35, derived: true },
  aluminum:    { lo: 0, hi: 0.06, ideal: 0.02, unit: "mg/L", toxic: true },
  bromine:     { lo: 59.4, hi: 72.6, ideal: 66, unit: "mg/L", setpoint: 66, derived: true },
  fluorine:    { lo: 1.17, hi: 1.43, ideal: 1.3, unit: "mg/L", setpoint: 1.3, derived: true },
};

function icpRef(name) {
  const k = String(name).trim().toLowerCase();
  if (ICP_REFERENCE[k]) return { key: k, ...ICP_REFERENCE[k] };
  for (const [alias, keys] of Object.entries(ICP_ALIASES)) {
    if (keys.includes(k) && ICP_REFERENCE[alias]) return { key: alias, ...ICP_REFERENCE[alias] };
  }
  return null;
}

function icpStatus(ref, v) {
  if (!ref) return "unknown";
  /* Triton's target for the unwanted metals is literally zero, so any reading
     above the detection floor is a detection rather than a "high" range value. */
  if (ref.hi === 0) return v > 0 ? "detected" : "ok";
  if (v > ref.hi) return "high";
  if (v < ref.lo) return "low";
  return "ok";
}

/* Trace element accumulation/depletion across successive ICP tests. */
function computeIcpTrends(icps) {
  const sorted = [...icps].sort(byOldest);
  if (sorted.length < 2) return [];
  const names = new Set();
  sorted.forEach((t) => Object.keys(t.elements || {}).forEach((n) => names.add(n)));
  const out = [];
  for (const name of names) {
    const series = sorted.filter((t) => t.elements && t.elements[name] != null)
      .map((t) => ({ date: t.date, value: t.elements[name] }));
    if (series.length < 2) continue;
    const slope = regressionSlope(series);
    const ref = icpRef(name);
    const first = series[0].value, last = series[series.length - 1].value;
    const spanDays = Math.max(1, daysBetween(series[0].date, series[series.length - 1].date));
    const pctChange = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
    out.push({
      name, series, slope, ref, first, last, spanDays, pctChange,
      status: ref ? icpStatus(ref, last) : "unknown",
      direction: Math.abs(pctChange) < 12 ? "steady" : pctChange > 0 ? "accumulating" : "depleting",
    });
  }
  return out.sort((a, b) => {
    const rank = (x) => (x.ref && x.ref.toxic && x.status === "high" ? 0 : x.status === "high" || x.status === "low" ? 1 : 2);
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });
}

/* --- Salt baseline comparison: what the system adds vs consumes --- */
function computeSaltComparison(latestByParam, paramDefs) {
  const rows = [];
  for (const def of paramDefs) {
    const base = SALT_MIX.values[def.key];
    if (base == null) continue;
    const reading = latestByParam[def.key];
    if (!reading) continue;
    const delta = reading.value - base;
    const pct = base !== 0 ? (delta / base) * 100 : null;
    rows.push({ def, base, current: reading.value, delta, pct, date: reading.date });
  }
  return rows;
}

/* --- Correction calculator ---
   Compound factors convert the target ion mass into the mass of the salt
   that actually carries it. Daily limits keep corrections gentle enough
   that the change itself doesn't stress corals. */
const CORRECTIONS = {
  alkalinity: {
    label: "Alkalinity", unit: "dKH", maxPerDay: 0.5,
    products: [
      { name: "Sodium bicarbonate (baking soda)", gPerUnitPer100L: 3.0, note: "pH-neutral; the safer default" },
      { name: "Soda ash (sodium carbonate)", gPerUnitPer100L: 1.9, note: "raises pH too — use when pH runs low" },
    ],
  },
  calcium: {
    /* Published guidance puts the safe daily rise under about 20 ppm; larger
       corrections get spread across several days. */
    label: "Calcium", unit: "ppm", maxPerDay: 20,
    products: [{ name: "Calcium chloride dihydrate", gPerUnitPer100L: 0.367, note: "per 1 ppm Ca per 100L" }],
  },
  magnesium: {
    label: "Magnesium", unit: "ppm", maxPerDay: 100,
    products: [
      { name: "Magnesium chloride hexahydrate", gPerUnitPer100L: 0.836, note: "use roughly 3:1 with sulphate" },
      { name: "Magnesium sulphate heptahydrate", gPerUnitPer100L: 1.01, note: "the sulphate share of a mixed dose" },
    ],
  },
  potassium: {
    label: "Potassium", unit: "ppm", maxPerDay: 10,
    products: [{ name: "Potassium chloride", gPerUnitPer100L: 0.191, note: "per 1 ppm K per 100L" }],
  },
  nitrate: {
    label: "Nitrate", unit: "ppm", maxPerDay: 2,
    products: [{ name: "Sodium nitrate", gPerUnitPer100L: 0.137, note: "per 1 ppm NO3 per 100L" }],
  },
  phosphate: {
    label: "Phosphate", unit: "ppm", maxPerDay: 0.03,
    products: [{ name: "Potassium dihydrogen phosphate", gPerUnitPer100L: 0.143, note: "make a stock solution — raw amounts are tiny" }],
  },
};

/* Hobby scales read to about 0.1 g, so anything smaller is meaningless as a
   weight. Below that, milligrams are at least honest about the scale of the
   thing, and the UI advises a stock solution instead of weighing it. */
function fmtDoseMass(g) {
  if (g == null || isNaN(g)) return "\u2014";
  if (g >= 1) return g.toFixed(1) + " g";
  if (g >= 0.1) return g.toFixed(2) + " g";
  return Math.round(g * 1000) + " mg";
}

function computeCorrection(paramKey, current, target, volumeL) {
  const c = CORRECTIONS[paramKey];
  if (!c || current == null || target == null || isNaN(current) || isNaN(target)) return null;
  const delta = target - current;
  if (Math.abs(delta) < 1e-9) return null;
  const volFactor = volumeL / 100;
  const days = Math.max(1, Math.ceil(Math.abs(delta) / c.maxPerDay));
  const products = delta > 0
    ? c.products.map((p) => ({
        ...p,
        totalG: Math.abs(delta) * p.gPerUnitPer100L * volFactor,
        perDayG: (Math.abs(delta) / days) * p.gPerUnitPer100L * volFactor,
      }))
    : [];
  const tiny = products.length > 0 && products.every((p) => p.perDayG < 0.1);
  return { delta, days, products, unit: c.unit, maxPerDay: c.maxPerDay, raising: delta > 0, tiny };
}

/* --- Water change dilution model --- */
function modelWaterChange(latestByParam, paramDefs, volumeL, changeLitres) {
  if (!changeLitres || changeLitres <= 0 || !volumeL) return [];
  const f = Math.min(1, changeLitres / volumeL);
  const out = [];
  for (const def of paramDefs) {
    const base = SALT_MIX.values[def.key];
    const reading = latestByParam[def.key];
    if (base == null || !reading) continue;
    const after = reading.value * (1 - f) + base * f;
    out.push({ def, before: reading.value, after, delta: after - reading.value, pct: f * 100 });
  }
  return out;
}


/* --- CSV export --- */
function buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks }) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = ["section,date,item,value,unit,note"];
  for (const r of [...readings].sort(byOldest)) {
    const def = PARAM_DEFS.find((d) => d.key === r.param);
    lines.push(["reading", r.date, r.param, r.value, def ? def.unit : "", r.note || ""].map(esc).join(","));
  }
  for (const t of icps) {
    for (const [k, v] of Object.entries(t.elements || {})) {
      lines.push(["icp", t.date, k, v, "mg/L", t.note || ""].map(esc).join(","));
    }
  }
  for (const d of doseLog || []) {
    lines.push(["dose", d.date, `${d.element || "alkalinity"} dose`, d.ml, "mL/day", d.note || ""].map(esc).join(","));
  }
  for (const w of waterChanges || []) lines.push(["water-change", w.date, "volume", w.litres, "L", w.note || ""].map(esc).join(","));
  for (const l of lighting) lines.push(["lighting", l.date, "change", "", "", l.note || ""].map(esc).join(","));
  for (const t of taskLog || []) {
    const task = (allTasks || []).find((x) => x.id === t.taskId);
    lines.push(["task", t.date, task ? task.label : t.taskId, "", "", ""].map(esc).join(","));
  }
  return lines.join("\n");
}



/* --- Smart reminders ---
 *
 * A reminder is due a fixed interval after it was last COMPLETED, not after it
 * was last due. Test three days late and the next one falls three days later
 * too, so being behind never compounds into a backlog that can't be cleared.
 *
 * Test reminders are linked to a parameter and complete themselves when that
 * test is logged — there is no separate tick to remember, because the act of
 * recording the reading is the completion.
 */
const REMINDER_SEED = [
  { id: "rem-alkalinity", label: "Test alkalinity", paramKey: "alkalinity", kind: "test", intervalDays: 2,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-phosphate",  label: "Test phosphate",  paramKey: "phosphate",  kind: "test", intervalDays: 3,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-salinity",   label: "Test salinity",   paramKey: "salinity",   kind: "test", intervalDays: 3,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-nitrate",    label: "Test nitrate",    paramKey: "nitrate",    kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-calcium",    label: "Test calcium",    paramKey: "calcium",    kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-magnesium",  label: "Test magnesium",  paramKey: "magnesium",  kind: "test", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-potassium",  label: "Test potassium",  paramKey: "potassium",  kind: "test", intervalDays: 30, startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "rem-icp",        label: "Send ICP sample", paramKey: null,         kind: "icp",  intervalDays: 42, startDate: "2026-08-10", enabled: true, builtin: true },

  /* Husbandry. Same model as the tests, so they get the same scheduling,
     snoozing and editing rather than a second parallel system. Ids match the
     old task ids so completion history carries straight over. */
  { id: "waterchange", label: "Water change",    paramKey: null, kind: "water", intervalDays: 7,  startDate: "2026-08-10", enabled: true, builtin: true, needsVolume: true },
  { id: "carbon",      label: "Replace carbon",  paramKey: null, kind: "task",  intervalDays: 28, startDate: "2026-08-10", enabled: true, builtin: true },
  { id: "purigen",     label: "Replace Purigen", paramKey: null, kind: "task",  intervalDays: 28, startDate: "2026-08-10", enabled: true, builtin: true },
];

/* Reminders grouped the way the Tasks screen presents them. */
const REMINDER_GROUPS = [
  { id: "test", label: "Test schedule", kinds: ["test"] },
  { id: "husbandry", label: "Husbandry & maintenance", kinds: ["icp", "water", "task"] },
];

/* Interval shown the way it was entered: 42 days reads better as 6 weeks. */
function intervalLabel(days) {
  if (days % 7 === 0 && days >= 7) {
    const w = days / 7;
    return w === 1 ? "every week" : `every ${w} weeks`;
  }
  return days === 1 ? "every day" : `every ${days} days`;
}

/* One reminder's state: when it was last done, when it is next due, and how
   that reads today. `adjustDays` shifts only the next occurrence — the one
   after it is scheduled from the actual completion, so a nudge never
   permanently skews the rhythm. */
function reminderState(rem, log, today) {
  const done = (log || [])
    .filter((l) => l.taskId === rem.id)
    .sort(byNewest);
  const lastDone = done.length ? done[0].date : null;

  let due = lastDone ? addDays(lastDone, rem.intervalDays) : rem.startDate;
  /* An override set by the dosing protocol: after a dose change the next test
     matters more than the usual rhythm, so it is pinned to a specific day and
     cleared as soon as the test is logged. */
  if (rem.dueOverride && (!lastDone || rem.dueOverride > lastDone)) due = rem.dueOverride;
  else if (rem.adjustDays) due = addDays(due, rem.adjustDays);

  const daysOut = daysBetween(today, due);
  return {
    rem, lastDone, due, daysOut,
    pinned: !!(rem.dueOverride && (!lastDone || rem.dueOverride > lastDone)),
    pinReason: rem.dueReason || null,
    dueTime: rem.dueTime || null,
    completions: done,
    status: daysOut < 0 ? "overdue" : daysOut === 0 ? "today" : "upcoming",
    /* Completed within the current cycle — i.e. there is nothing to do yet. */
    doneToday: lastDone === today,
  };
}

/* Future occurrences of one reminder up to a horizon, so a calendar can show
   what's coming as well as what's been done. Projection only — completing early
   or late reschedules everything after it. */
function projectOccurrences(rem, log, today, untilDate) {
  if (!rem || rem.enabled === false || !rem.intervalDays) return [];
  const st = reminderState(rem, log, today);
  const out = [];
  let d = st.due;
  let guard = 0;
  while (dayNum(d) <= dayNum(untilDate) && guard++ < 400) {
    if (dayNum(d) >= dayNum(today)) out.push(d);
    d = addDays(d, rem.intervalDays);
  }
  return out;
}

function computeReminders(reminders, log, today, windowDays = 14) {
  const active = (reminders || []).filter((r) => r.enabled !== false);
  const states = active.map((r) => reminderState(r, log, today));

  const overdue  = states.filter((s) => s.status === "overdue").sort((a, b) => a.daysOut - b.daysOut);
  const dueToday = states.filter((s) => s.status === "today");
  const upcoming = states.filter((s) => s.status === "upcoming" && s.daysOut <= windowDays)
                         .sort((a, b) => a.daysOut - b.daysOut);
  const later    = states.filter((s) => s.status === "upcoming" && s.daysOut > windowDays)
                         .sort((a, b) => a.daysOut - b.daysOut);

  /* Recently completed, most recent completion per reminder only — a new
     completion replaces the previous one rather than stacking up. */
  const recent = states
    .filter((s) => s.lastDone && daysBetween(s.lastDone, today) <= windowDays)
    .sort((a, b) => (a.lastDone < b.lastDone ? 1 : -1));

  return {
    states, overdue, dueToday, upcoming, later, recent,
    actionable: [...overdue, ...dueToday],
    allClear: overdue.length === 0 && dueToday.length === 0,
  };
}

/* Logging a test is the completion. Returns the log entries to add, so the
   caller can write them alongside the reading in one update. */
function autoCompletions(reminders, log, paramKey, date, kind = "test") {
  const hits = (reminders || []).filter(
    (r) => r.enabled !== false &&
           (kind === "icp" ? r.kind === "icp" : r.kind === "test" && r.paramKey === paramKey));
  const out = [];
  for (const r of hits) {
    const already = (log || []).some((l) => l.taskId === r.id && l.date === date);
    if (already) continue;
    out.push({ id: uid(), taskId: r.id, date, auto: true });
  }
  return out;
}

/* --- Backup and restore ---
 *
 * Browser storage is not durable. On iOS, Safari deletes a site's local storage
 * after seven days without a visit, and clearing browsing data wipes it at any
 * time. Adding the app to the home screen avoids the seven-day rule, but not a
 * lost phone or an accidental clear.
 *
 * The CSV export is for reading — open it in a spreadsheet, share it. It is not
 * a backup: it flattens ICP panels into rows and drops settings entirely, so it
 * cannot be restored from. This is the file that can.
 */
const BACKUP_LABELS = {
  "readings": "Test readings", "icp-tests": "ICP panels", "water-changes": "Water changes",
  "dose-log": "Dose changes", "lighting-log": "Lighting notes", "task-log": "Completed tasks",
  "tasks-custom": "Custom tasks", "reminders": "Reminder schedules",
};

const BACKUP_KEYS = [
  "readings", "icp-tests", "tasks-custom", "task-log", "lighting-log",
  "custom-ranges", "tank-settings", "dose-log", "water-changes", "reminders", "kit-changes",
  "findings-dismissed", "alk-plan", "corrections", "ca-plan", "mg-plan",
];

async function buildBackup() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    data[key] = await loadKey(key, null);
  }
  return {
    format: "dans-tank-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    counts: {
      readings: (data["readings"] || []).length,
      icps: (data["icp-tests"] || []).length,
      waterChanges: (data["water-changes"] || []).length,
      doseChanges: (data["dose-log"] || []).length,
      taskLog: (data["task-log"] || []).length,
      lighting: (data["lighting-log"] || []).length,
    },
    data,
  };
}

/* Describe a backup file without writing anything, so the restore can be seen
   before it happens. Merging is by natural key, never by id, because ids are
   regenerated and would let the same reading in twice. */
function inspectBackup(parsed, current) {
  if (!parsed || parsed.format !== "dans-tank-backup") {
    return { ok: false, reason: "That doesn't look like a backup from this app." };
  }
  if (!parsed.data || typeof parsed.data !== "object") {
    return { ok: false, reason: "The file is missing its data." };
  }
  const b = parsed.data;
  const keyOf = {
    "readings": (r) => `${r.param}|${r.date}`,
    "icp-tests": (r) => r.date,
    "water-changes": (r) => `${r.date}|${r.litres}`,
    "dose-log": (r) => `${r.element || "alkalinity"}|${r.date}`,
    "lighting-log": (r) => r.date,
    "task-log": (r) => `${r.taskId}|${r.date}`,
    "tasks-custom": (r) => r.id,
    "reminders": (r) => r.id,
  };
  const summary = [];
  for (const key of Object.keys(keyOf)) {
    const incoming = Array.isArray(b[key]) ? b[key] : [];
    const have = new Set((current[key] || []).map(keyOf[key]));
    const fresh = incoming.filter((r) => !have.has(keyOf[key](r))).length;
    if (incoming.length) summary.push({ key, total: incoming.length, fresh });
  }
  const hasSettings = b["tank-settings"] && typeof b["tank-settings"] === "object";
  return {
    ok: true, summary, hasSettings,
    createdAt: parsed.createdAt,
    hasRanges: b["custom-ranges"] && Object.keys(b["custom-ranges"]).length > 0,
  };
}

/* Merge rather than replace. Restoring the same file twice changes nothing the
   second time, and restoring an old backup never removes newer entries. */
async function restoreBackup(parsed, current, applySettings) {
  const b = parsed.data;
  const keyOf = {
    "readings": (r) => `${r.param}|${r.date}`,
    "icp-tests": (r) => r.date,
    "water-changes": (r) => `${r.date}|${r.litres}`,
    "dose-log": (r) => `${r.element || "alkalinity"}|${r.date}`,
    "lighting-log": (r) => r.date,
    "task-log": (r) => `${r.taskId}|${r.date}`,
    "tasks-custom": (r) => r.id,
    "reminders": (r) => r.id,
  };
  const result = {};
  for (const key of Object.keys(keyOf)) {
    const incoming = Array.isArray(b[key]) ? b[key] : [];
    if (!incoming.length) { result[key] = current[key] || []; continue; }
    const merged = [...(current[key] || [])];
    const have = new Set(merged.map(keyOf[key]));
    for (const row of incoming) {
      const k = keyOf[key](row);
      if (have.has(k)) continue;
      have.add(k);
      merged.push({ ...row, id: row.id || uid() });
    }
    merged.sort((x, y) => ((x.date || "") < (y.date || "") ? 1 : -1));
    await saveKey(key, merged);
    result[key] = merged;
  }
  if (applySettings && b["tank-settings"]) {
    const s = { ...DEFAULT_SETTINGS, ...b["tank-settings"] };
    await saveKey("tank-settings", s);
    result["tank-settings"] = s;
  }
  if (b["findings-dismissed"]) {
    await saveKey("findings-dismissed", b["findings-dismissed"]);
    result["findings-dismissed"] = b["findings-dismissed"];
  }
  if (b["kit-changes"]) {
    await saveKey("kit-changes", b["kit-changes"]);
    result["kit-changes"] = b["kit-changes"];
  }
  if (b["custom-ranges"]) {
    await saveKey("custom-ranges", b["custom-ranges"]);
    result["custom-ranges"] = b["custom-ranges"];
  }
  return result;
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Ask the browser not to evict this site's data. Apple doesn't document whether
   this overrides the seven-day rule, but it costs nothing to request and
   developers report it helping. */
async function requestPersistence() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return { supported: false };
    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    if (already) return { supported: true, granted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, granted };
  } catch {
    return { supported: false };
  }
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}




function ParamGauge({ def, value, recent, compact = false }) {
  const status = paramStatus(def, value);
  const color = STATUS_COLOR[status];
  const has = value != null && !isNaN(value);

  /* The scale must contain the band, the current value and the recent range,
     with a little air so a marker at the extreme isn't clipped. */
  const pts = [def.min, def.max];
  if (has) pts.push(value);
  if (recent && recent.lo != null) pts.push(recent.lo, recent.hi);
  const rawLo = Math.min(...pts), rawHi = Math.max(...pts);
  const span = rawHi - rawLo || Math.abs(rawHi) * 0.2 || 1;
  const lo = rawLo - span * 0.18, hi = rawHi + span * 0.18;
  const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

  const bandL = pos(def.min), bandR = pos(def.max);
  const valPos = has ? pos(value) : null;

  return (
    <div className="w-full">
      {/* The card draws its own value now, so the gauge does not repeat it. */}
      {!compact && (
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="font-black text-[26px] text-ink leading-none tabular-nums">
            {has ? fmtVal(def, value) : "\u2014"}
          </span>
          <span className="text-[11px] font-bold text-ink2">{def.unit}</span>
        </div>
      )}

      <div className="relative w-full" style={{ height: compact ? 16 : 22 }}>
        {/* Full scale */}
        <div className="absolute rounded-full" style={{ left: 0, right: 0, top: compact ? 6 : 9, height: compact ? 4 : 5, background: "#E9EFEE" }} />

        {/* Target band — the only region that should read as "good" */}
        <div className="absolute rounded-full"
          style={{ left: `${bandL}%`, width: `${Math.max(2, bandR - bandL)}%`,
                   top: compact ? 6 : 9, height: compact ? 4 : 5,
                   background: has && status === "ok" ? color + "55" : "#C8D6D4" }} />

        {/* Where the parameter has been recently, so spread is visible at a glance */}
        {recent && recent.lo != null && recent.hi > recent.lo && (
          <div className="absolute rounded-full"
            style={{ left: `${pos(recent.lo)}%`, width: `${Math.max(1.5, pos(recent.hi) - pos(recent.lo))}%`,
                     top: compact ? 4 : 6, height: compact ? 8 : 11, background: color + "22" }} />
        )}

        {/* Current reading */}
        {valPos != null && (
          <div className="absolute" style={{ left: `${valPos}%`, top: compact ? 1 : 2, transform: "translateX(-50%)" }}>
            <div className="rounded-full ring-2 ring-white shadow-sm"
              style={{ width: compact ? 9 : 11, height: compact ? 14 : 17, background: color }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.min)}</span>
        <span className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: has ? color : "#8AA0A0" }}>
          {has ? (status === "ok" ? "in band" : status === "low" ? "below band" : "above band") : "no data"}
        </span>
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.max)}</span>
      </div>
    </div>
  );
}


function StatusPill({ status }) {
  const map = {
    ok: { label: "In range", cls: "bg-teal-50 text-teal-800 border-teal-200" },
    low: { label: "Low", cls: "bg-amber-50 text-amber-800 border-amber-300" },
    high: { label: "High", cls: "bg-rose-50 text-rose-800 border-rose-300" },
    unknown: { label: "No data", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const m = map[status];
  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>;
}


/* What moved a task off its normal rhythm. "Pinned" on its own left you unable
   to tell an app-scheduled check from a date you chose yourself. */
function pinReasonLabel(reason) {
  return reason === "dose" ? "to check the new dose"
    : reason === "correction" ? "to check the correction"
    : reason === "skipped" ? "skipped once"
    : "moved by you";
}

function ReminderRow({ rem, state, onComplete, onReschedule, completeLabel = "Mark done" }) {
  /* This row used to expand into its own editor — interval, start date, nudge
     buttons — which was a second, older way of changing a schedule than the
     sheet the calendar opens. The two drifted: the sheet could move a task with
     completion history, the inline editor's "starting from" silently could not.
     The row is now purely a display that opens the same sheet, so there is one
     way to change a schedule regardless of where you tapped it. */
  const off = !rem.enabled;
  const due = state ? state.daysOut : null;
  const tone = off ? "#8AA0A0"
    : due != null && due < 0 ? "#D98324"
    : due === 0 ? "#0B7C86" : "#45605F";

  return (
    <div className="rounded-xl border border-app overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onReschedule} className="flex-1 min-w-0 text-left">
          <div className="text-[14px] font-black truncate" style={{ color: off ? "#8AA0A0" : "#08191D" }}>
            {rem.label}
          </div>
          <div className="text-[11px] font-bold" style={{ color: tone }}>
            {off ? "turned off"
              : `${intervalLabel(rem.intervalDays)}${state ? ` · ${due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "due today" : `next ${fmtShort(state.due)}`}` : ""}`}
            {state && state.pinned ? ` · ${pinReasonLabel(state.pinReason)}` : ""}
          </div>
        </button>
        {!off && state && due <= 0 && (
          <button onClick={onComplete}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            {completeLabel}
          </button>
        )}
        <button aria-label="Change schedule" onClick={onReschedule}
          className="shrink-0 p-2 -m-1 text-ink2">
          <Settings2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ReminderSheet({ rem, state, onClose, onSetDue, onSetInterval, onComplete, onSkip,
  onToggleEnabled = null, onDelete = null }) {
  const [date, setDate] = useState(state && state.due ? state.due : todayStr());
  const [every, setEvery] = useState(String(rem ? rem.intervalDays : 7));
  const [tab, setTab] = useState("when");
  if (!rem) return null;

  const daysOut = state ? state.daysOut : null;
  const late = daysOut != null && daysOut < 0;
  const tone = late ? "#D98324" : daysOut === 0 ? "#0B7C86" : "#45605F";
  const quick = [
    { label: "Today", iso: todayStr() },
    { label: "Tomorrow", iso: addDays(todayStr(), 1) },
    { label: "In 3 days", iso: addDays(todayStr(), 3) },
    { label: "Next week", iso: addDays(todayStr(), 7) },
  ];
  const intervalNum = parseInt(every, 10);
  const intervalOk = isFinite(intervalNum) && intervalNum >= 1 && intervalNum <= 365;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(8,25,29,0.5)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(8,25,29,0.3)" }}>

        <div className="px-4 pt-4 pb-3" style={{ background: tone + "10" }}>
          <div className="text-[15px] font-black text-ink">{rem.label}</div>
          <div className="text-[12px] font-bold mt-0.5" style={{ color: tone }}>
            {!rem.enabled ? "Turned off — no reminders until you turn it back on"
              : state && state.pinned
              ? `Moved to ${fmtFriendly(state.due)} — ${pinReasonLabel(state.pinReason)}`
              : late ? `${Math.abs(daysOut)} day${Math.abs(daysOut) === 1 ? "" : "s"} overdue · was due ${fmtFriendly(state.due)}`
              : daysOut === 0 ? "Due today"
              : `Due ${fmtFriendly(state.due)}`}
          </div>
          <div className="text-[11px] font-semibold text-ink2 mt-0.5">
            {intervalLabel(rem.intervalDays)}
            {state && state.lastDone ? ` · last done ${fmtFriendly(state.lastDone)}` : " · never done"}
          </div>
        </div>

        <div className="flex border-b border-app">
          {[["when", "Reschedule"], ["how", "How often"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2.5 text-[12px] font-extrabold"
              style={{ color: tab === k ? "#0B7C86" : "#8AA0A0",
                       borderBottom: tab === k ? "2px solid #0B7C86" : "2px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "when" ? (
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {quick.map((q) => (
                <Btn key={q.label} variant="ghost" onClick={() => onSetDue(rem.id, q.iso)}>
                  {q.label}
                </Btn>
              ))}
            </div>
            <Field label="Or pick a date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" onClick={() => onSetDue(rem.id, date)}>
              <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Move to {fmtShort(date)}</span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Moving a task changes only this occurrence. Once you complete it, the normal
              {" "}{intervalLabel(rem.intervalDays).toLowerCase()} rhythm picks up from the day you did it.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-app">
              <Btn variant="ghost" onClick={() => onSkip(rem.id)}>Skip this one</Btn>
              <Btn onClick={() => onComplete(rem.id)}>
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Mark done</span>
              </Btn>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 2, 3, 7, 14, 21, 30, 42].map((d) => (
                <button key={d} onClick={() => setEvery(String(d))}
                  className="rounded-lg py-2 text-[12px] font-extrabold"
                  style={{ background: intervalNum === d ? "#0B7C86" : "#F1F5F4",
                           color: intervalNum === d ? "#fff" : "#45605F" }}>
                  {d}d
                </button>
              ))}
            </div>
            <Field label="Or every N days">
              <input type="number" min="1" max="365" value={every}
                onChange={(e) => setEvery(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" disabled={!intervalOk}
              onClick={() => onSetInterval(rem.id, intervalNum)}>
              <span className="flex items-center justify-center gap-1.5">
                <Save size={13} /> {intervalOk ? intervalLabel(intervalNum) : "Enter 1–365"}
              </span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Changing how often also moves the next one, counted from when you last did it. Testing
              less often is not a failure — a settled tank genuinely needs fewer readings than one
              you are still working out.
            </p>
          </div>
        )}

        {(onToggleEnabled || onDelete) && (
          <div className="px-4 pb-3 pt-3 border-t border-app flex items-center gap-2">
            {onToggleEnabled && (
              <Btn variant="ghost" className="flex-1" onClick={() => onToggleEnabled(rem.id, !rem.enabled)}>
                {rem.enabled ? "Turn off" : "Turn back on"}
              </Btn>
            )}
            {onDelete && !rem.builtin && (
              <Btn variant="danger" className="flex-1" onClick={() => onDelete(rem.id)}>Delete</Btn>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 text-[12px] font-extrabold text-ink2 border-t border-app">
          Close
        </button>
      </div>
    </div>
  );
}

function CompletionCalendar({ taskLog, reminders, waterChanges, onPickTask = null }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [picked, setPicked] = useState(null);

  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const labelFor = (id) => {
    const r = (reminders || []).find((x) => x.id === id);
    return r ? r.label : id;
  };

  /* Completions grouped by day, with water-change volumes folded in so the
     detail can say "Water change · 10L" rather than just naming the task. */
  const byDay = useMemo(() => {
    const map = {};
    for (const l of taskLog || []) {
      if (!l.date) continue;
      (map[l.date] = map[l.date] || []).push({
        id: l.id, label: labelFor(l.taskId), taskId: l.taskId, auto: !!l.auto, done: true,
      });
    }
    for (const w of waterChanges || []) {
      const day = map[w.date];
      if (!day) continue;
      const row = day.find((x) => x.taskId === "waterchange");
      if (row) row.detail = `${w.litres}L`;
    }
    return map;
  }, [taskLog, waterChanges, reminders]);

  /* What's scheduled ahead, so the month reads as a plan and not only a record. */
  const dueByDay = useMemo(() => {
    const map = {};
    const today = todayStr();
    const horizon = `${year}-${String(month + 1).padStart(2, "0")}-28`;
    const until = addDays(horizon, 10);
    for (const r of reminders || []) {
      for (const d of projectOccurrences(r, taskLog, today, until)) {
        (map[d] = map[d] || []).push({ id: r.id + d, label: r.label, taskId: r.id, done: false });
      }
    }
    return map;
  }, [reminders, taskLog, year, month]);

  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;          // weeks start Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, iso, items: byDay[iso] || [], due: dueByDay[iso] || [] });
  }

  const today = todayStr();
  const monthTotal = cells.reduce((a, c) => a + (c ? c.items.length : 0), 0);

  return (
    <Card className="p-4 mb-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button onClick={() => { setMonthOffset(monthOffset - 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app" aria-label="Previous month">
          <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div className="text-center">
          <div className="text-[14px] font-black text-ink">{monthLabel}</div>
          <div className="text-[10px] font-bold text-ink2">
            {monthTotal} completed · {cells.reduce((a, c) => a + (c ? c.due.length : 0), 0)} scheduled
          </div>
        </div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app disabled:opacity-25" aria-label="Next month">
          <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-extrabold uppercase text-ink2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={`p${i}`} />;
          const n = c.items.length, m = c.due.length;
          const isToday = c.iso === today;
          const isPicked = picked === c.iso;
          const total = n + m;
          return (
            <button key={c.iso} onClick={() => setPicked(isPicked ? null : c.iso)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border"
              style={{
                borderColor: isPicked ? "#0B7C86" : isToday ? "#0B7C86" : "transparent",
                background: isPicked ? "#0B7C8618" : n ? "#0B7C860C" : "transparent",
              }}>
              <span className="text-[11px] font-bold leading-none"
                style={{ color: total ? "#08191D" : "#9FB0AE" }}>{c.d}</span>
              {total > 0 && (total <= 3 ? (
                <span className="flex gap-0.5">
                  {/* Solid = done, hollow = scheduled. */}
                  {Array.from({ length: n }).map((_, k) => (
                    <span key={"d" + k} className="w-1 h-1 rounded-full" style={{ background: "#0B7C86" }} />
                  ))}
                  {Array.from({ length: m }).map((_, k) => (
                    <span key={"u" + k} className="w-1 h-1 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
                  ))}
                </span>
              ) : (
                <span className="text-[8px] font-extrabold leading-none"
                  style={{ color: n ? "#0B7C86" : "#8AA0A0" }}>{total}</span>
              ))}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-3 pt-3 border-t border-app">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
            {fmtFriendly(picked)}
          </div>
          {((byDay[picked] || []).length + (dueByDay[picked] || []).length) === 0 ? (
            <p className="text-[13px] text-ink2 font-medium">Nothing logged or scheduled that day.</p>
          ) : (
            <div className="space-y-1">
              {(byDay[picked] || []).map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <Check size={13} style={{ color: "#0B7C86" }} className="shrink-0" />
                  <span className="text-[13px] font-bold text-ink">{it.label}</span>
                  {it.detail && <span className="text-[12px] font-bold text-ink2">· {it.detail}</span>}
                  {it.auto && <span className="text-[10px] font-bold text-ink2">· from a logged test</span>}
                </div>
              ))}
              {/* Scheduled items are tappable: seeing a task on a day you
                  cannot make it is exactly the moment you want to move it, and
                  previously the calendar could only be read. */}
              {(dueByDay[picked] || []).map((it) => (
                <button key={it.id} onClick={() => onPickTask && onPickTask(it.taskId)}
                  disabled={!onPickTask}
                  className="w-full flex items-center gap-2 text-left rounded-lg px-1 py-1 -mx-1"
                  style={{ background: onPickTask ? "transparent" : undefined }}>
                  <span className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: "#0B7C8699" }} />
                  <span className="text-[13px] font-bold text-ink2 flex-1">{it.label}</span>
                  {onPickTask
                    ? <span className="text-[10px] font-extrabold" style={{ color: "#0B7C86" }}>Reschedule</span>
                    : <span className="text-[10px] font-bold text-ink2">· scheduled</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!picked && (
        <div className="flex items-center gap-3 mt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#0B7C86" }} />
            <span className="text-[10px] font-bold text-ink2">done</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
            <span className="text-[10px] font-bold text-ink2">scheduled</span>
          </span>
          <span className="text-[10px] font-medium text-ink2">Tap a day for detail</span>
        </div>
      )}
    </Card>
  );
}


/* The calendar as an overlay, so it can be reached from the dashboard without
   losing your place. */
function CalendarModal({ taskLog, reminders, waterChanges, onClose, onPickTask = null }) {
  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="bg-app w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="sticky top-0 bg-app px-4 pt-4 pb-2 flex items-center justify-between gap-2 z-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold">Calendar</div>
            <h2 className="text-xl font-display text-ink">Done &amp; coming up</h2>
          </div>
          <button aria-label="Close" onClick={onClose}
            className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-white/60"><X size={20} /></button>
        </div>
        <div className="px-4 pb-4">
          <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
            onPickTask={onPickTask} />
        </div>
      </div>
    </div>
  );
}





/* --- The new reading in context ---
 *
 * A number alone doesn't say whether 9.3 is the highest in a fortnight or the
 * middle of a steady run. This draws the recent history and lands on the value
 * just logged, so the reading arrives with its own background.
 */
function buildReadingSeries(def, readings, result) {
  const prior = (readings || [])
    .filter((r) => r.param === def.key)
    .sort(byOldest)
    .slice(-11);
  return [...prior, { date: result.date, time: result.time, value: result.value, isNew: true }];
}

/* --- Geometry shared by the chart and the counter ---
 *
 * Both are driven from one progress value, so the travelling dot, the drawn
 * line and the number on screen cannot drift apart. Three separate animations
 * — a CSS dash, an SVG motion path and a JS timer — could never stay in step,
 * which is why the dot ran ahead of its own line.
 */
function readingGeometry(def, rows, W, H, PAD) {
  const vals = rows.map((r) => r.value);
  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
  const span = (hi - lo) || 1;
  const pad = span * 0.22;
  const yMin = lo - pad, yMax = hi + pad;

  /* Room on the left for axis labels. Without them the line has shape but no
     scale, and you cannot tell a 0.2 dKH move from a 2 dKH one. */
  const AXIS = 34;
  const x = (i) => AXIS + (i / (rows.length - 1)) * (W - AXIS - PAD);
  const y = (v) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2);
  const pts = rows.map((r, i) => [x(i), y(r.value)]);

  /* Cumulative arc length, so the drawn line can be cut at exactly the point
     the dot has reached rather than at a proportional guess. */
  const seg = [], cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); cum.push(cum[i - 1] + d);
  }
  const total = cum[cum.length - 1] || 1;

  /* Position at progress p, interpolated between readings — so between a 9.0
     and a 10.0 the counter runs through 9.1, 9.2, 9.3 rather than jumping. */
  const at = (p) => {
    const t = Math.max(0, Math.min(1, p)) * (rows.length - 1);
    const i = Math.min(rows.length - 2, Math.floor(t));
    const f = rows.length > 1 ? t - i : 0;
    return {
      value: rows[i].value + (rows[i + 1].value - rows[i].value) * f,
      px: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
      py: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      drawn: cum[i] + seg[i] * f,
      index: i, frac: f,
    };
  };

  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  /* Axis labels: the band edges plus the highest and lowest readings actually
     plotted, so a peak on the line can be read off the left rather than
     guessed at. Anything closer than 11px to a label already chosen is
     dropped, since two overlapping numbers are worse than one. */
  const dataMax = Math.max(...vals), dataMin = Math.min(...vals);
  const candidates = [dataMax, def.max, def.min, dataMin]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => b - a);
  const ticks = [];
  for (const val of candidates) {
    if (ticks.every((t) => Math.abs(y(t) - y(val)) > 11)) ticks.push(val);
  }

  return { pts, total, at, d, y, yMin, yMax, AXIS, ticks,
           bandTop: y(def.max), bandBottom: y(def.min), W, H };
}

function ReadingSparkline({ def, rows, result, progress, geo }) {
  const W = geo.W, H = geo.H;
  if (!rows || rows.length < 2) return null;

  const tone = STATUS_COLOR[result.status] || def.color;
  const head = geo.at(progress);
  const done = progress >= 1;
  const last = geo.pts[geo.pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rc-chart" style={{ height: H }} aria-hidden="true">
      <defs>
        <filter id={`rcGlow-${def.key}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /></feMerge>
        </filter>
        <filter id={`rcHead-${def.key}`} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={`rcArea-${def.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.26" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
        {/* The fill is revealed by a rectangle that tracks the head, so it can
            never run ahead of the line above it. */}
        <clipPath id={`rcClip-${def.key}`}>
          <rect x={0} y={0} width={head.px} height={H} />
        </clipPath>
      </defs>

      {/* Scale: band edges, plus the peak and trough of what's plotted. Band
          lines are drawn more strongly, since those are the thresholds. */}
      {geo.ticks.map((val, i) => {
        const isBand = val === def.max || val === def.min;
        return (
          <g key={i} className="rc-band">
            <line x1={geo.AXIS - 4} x2={W} y1={geo.y(val)} y2={geo.y(val)}
              stroke={isBand ? tone : "#9FB0AE"} strokeOpacity={isBand ? 0.32 : 0.22}
              strokeWidth="1" strokeDasharray={isBand ? "3 3" : "2 4"} />
            <text x={geo.AXIS - 7} y={geo.y(val) + 3.6} textAnchor="end"
              fontSize="10.5" fontWeight={isBand ? 800 : 700}
              fill={isBand ? "#08191D" : "#3D5654"}>
              {fmtVal(def, val)}
            </text>
          </g>
        );
      })}

      {/* Area beneath the line, filling in behind the head. */}
      <path d={`${geo.d} L${geo.pts[geo.pts.length - 1][0]},${H} L${geo.pts[0][0]},${H} Z`}
        fill={`url(#rcArea-${def.key})`} clipPath={`url(#rcClip-${def.key})`} />

      <rect x={geo.AXIS} y={Math.min(geo.bandTop, geo.bandBottom)} width={W - geo.AXIS}
        height={Math.max(2, Math.abs(geo.bandBottom - geo.bandTop))}
        fill={tone}
        className={`rc-band${done && result.status === "ok" ? " rc-band-hit" : ""}`} />

      {/* Both strokes are cut at the dot's exact position along the path. */}
      <path d={geo.d} fill="none" stroke={tone} strokeWidth="4.5" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.45" filter={`url(#rcGlow-${def.key})`}
        strokeDasharray={geo.total} strokeDashoffset={geo.total - head.drawn} />
      <path d={geo.d} fill="none" stroke={tone} strokeWidth="2.6" strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={geo.total} strokeDashoffset={geo.total - head.drawn} />

      {/* A reading's dot lights up as the head passes it. Nothing is drawn
          before the travel starts: the first dot otherwise appeared with the
          empty chart and the falling head then landed on top of it, which drew
          the eye to the wrong thing. */}
      {progress > 0 && geo.pts.slice(0, -1).map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="2.6" fill={tone}
          opacity={progress * (rows.length - 1) >= i ? 0.55 : 0}
          style={{ transition: "opacity 200ms ease-out" }} />
      ))}

      {/* The head itself — the same coordinates the counter is reading from.
          Before the travel begins it drops onto the first point. */}
      {!done && (
        <g className={progress <= 0 ? "rc-drop" : undefined}>
          <circle cx={head.px} cy={head.py} r="8" fill={tone} opacity="0.5"
            filter={`url(#rcHead-${def.key})`} />
          <circle cx={head.px} cy={head.py} r="3.4" fill="#fff" opacity="0.95" />
        </g>
      )}

      {done && (
        <>
          <circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={tone} strokeWidth="2"
            className="rc-ring rc-ring1" />
          <circle cx={last[0]} cy={last[1]} r="4" fill="none" stroke={tone} strokeWidth="1.5"
            className="rc-ring rc-ring2" />
          <circle cx={last[0]} cy={last[1]} r="9" fill={tone} opacity="0.18" className="rc-new" />
          <circle cx={last[0]} cy={last[1]} r="4.8" fill={tone} className="rc-new" />
          <circle cx={last[0]} cy={last[1]} r="1.9" fill="#fff" className="rc-new" />
        </>
      )}
    </svg>
  );
}




/* --- Launch animation ---
 *
 * A reef scene that plays once per session and then washes away to reveal the
 * dashboard sitting behind it. Skippable at any point.
 */

/* Branching stony coral, generated rather than drawn, so no two clumps repeat.
   Tapering strokes and polyp dots are what stop it reading as a bare shrub. */
function CoralClump({ x, y, scale = 1, colour, tip, depth = 3, delay = 0, soft = false, lean = 0 }) {
  const seg = [];
  const grow = (px, py, ang, len, w, d) => {
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps, t1 = (i + 1) / steps;
      const a0 = ang + lean * t0 * 0.5, a1 = ang + lean * t1 * 0.5;
      seg.push({
        x: px + Math.cos(a0) * len * t0, y: py - Math.sin(a0) * len * t0,
        x2: px + Math.cos(a1) * len * t1, y2: py - Math.sin(a1) * len * t1,
        w: w * (1 - t1 * 0.28), tipEnd: d === 0 && i === steps - 1,
      });
    }
    const ex = px + Math.cos(ang) * len, ey = py - Math.sin(ang) * len;
    if (d <= 0) return;
    grow(ex, ey, ang + 0.40 + d * 0.03, len * 0.70, w * 0.66, d - 1);
    grow(ex, ey, ang - 0.44 - d * 0.02, len * 0.70, w * 0.66, d - 1);
  };
  grow(0, 0, Math.PI / 2, 30, 8, depth);
  const tips = seg.filter((b) => b.tipEnd);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="sp-coral" style={{ animationDelay: `${delay}ms` }}>
        <g className={soft ? "sp-swaySoft" : "sp-sway"} style={{ animationDelay: `${delay % 1200}ms` }}>
          <ellipse cx="0" cy="2" rx={14} ry={4} fill="#000" opacity="0.13" />
          {seg.map((b, i) => (
            <line key={i} x1={b.x} y1={b.y} x2={b.x2} y2={b.y2}
              stroke={colour} strokeWidth={b.w} strokeLinecap="round" />
          ))}
          {tips.map((b, i) => (
            <g key={"t" + i}>
              <circle cx={b.x2} cy={b.y2} r={b.w * 1.5} fill={tip} opacity="0.22"
                className="sp-tip" style={{ animationDelay: `${i * 150}ms` }} />
              <circle cx={b.x2} cy={b.y2} r={b.w * 0.85} fill={tip}
                className="sp-polyp" style={{ animationDelay: `${i * 190}ms` }} />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

/* A soft coral: fleshy lobes rather than branches, swaying more freely. */
function SoftCoral({ x, y, scale = 1, colour, delay = 0 }) {
  const lobes = [[0, -34, 12], [-13, -24, 9], [13, -26, 10], [-7, -44, 8], [8, -46, 7]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="sp-coral" style={{ animationDelay: `${delay}ms` }}>
        <g className="sp-swaySoft" style={{ animationDelay: `${delay % 900}ms` }}>
          <ellipse cx="0" cy="2" rx={16} ry={4} fill="#000" opacity="0.13" />
          <path d="M-7,0 Q-9,-20 -4,-34 L5,-34 Q10,-18 7,0 Z" fill={colour} opacity="0.95" />
          {lobes.map(([lx, ly, r], i) => (
            <circle key={i} cx={lx} cy={ly} r={r} fill={colour}
              className="sp-polyp" style={{ animationDelay: `${i * 240}ms` }} />
          ))}
        </g>
      </g>
    </g>
  );
}

function Clownfish() {
  return (
    <g>
      <g className="sp-wag" transform="translate(-19 0)">
        <path d="M0,0 L-15,-11 Q-9,0 -15,11 Z" fill="#E8701A" />
        <path d="M-2,0 L-12,-8 Q-8,0 -12,8 Z" fill="#F79445" opacity="0.8" />
      </g>
      <ellipse cx="0" cy="0" rx="20" ry="12" fill="#F58220" />
      <path d="M-20,0 Q-4,-15 12,-7 Q2,-11 -20,0 Z" fill="#E8701A" opacity="0.5" />
      <path d="M-10,-11.4 Q-6,0 -10,11.4 L-5,11 Q-1,0 -5,-11 Z" fill="#FFF" />
      <path d="M2,-11.6 Q6,0 2,11.6 L7,10 Q10,0 7,-10 Z" fill="#FFF" />
      <path d="M17,-8 Q21,0 17,8 Q19,0 17,-8 Z" fill="#FFF" />
      <g className="sp-fin"><path d="M-3,-11 Q2,-21 9,-11 Z" fill="#E8701A" /></g>
      <g className="sp-fin"><path d="M-2,11 Q3,19 9,11 Z" fill="#E8701A" /></g>
      <circle cx="13" cy="-3" r="3.1" fill="#0D2A2E" />
      <circle cx="14" cy="-3.9" r="1.1" fill="#fff" />
    </g>
  );
}

function Firefish() {
  return (
    <g>
      <g className="sp-wag" transform="translate(-22 0)">
        <path d="M0,0 L-16,-8 Q-11,0 -16,8 Z" fill="#4B32A0" />
      </g>
      <path d="M-22,0 Q-4,-3 22,-1 Q6,8 -22,0 Z" fill="#6B4BC0" />
      <ellipse cx="4" cy="0" rx="19" ry="7" fill="#7B5BC9" />
      <ellipse cx="15" cy="0" rx="9" ry="7" fill="#F7F4FC" />
      <ellipse cx="20" cy="1" rx="4" ry="5" fill="#FBD24E" />
      <g className="sp-fin"><path d="M-6,-6 Q-2,-30 4,-8 Z" fill="#9A7BE8" /></g>
      <g className="sp-fin"><path d="M-2,6 Q2,16 8,7 Z" fill="#6B4BC0" /></g>
      <circle cx="19" cy="-2" r="2.4" fill="#0D2A2E" />
      <circle cx="19.8" cy="-2.7" r="0.9" fill="#fff" />
    </g>
  );
}

function LaunchSplash({ onDone }) {
  const [washing, setWashing] = useState(false);
  const finish = () => {
    if (washing) return;
    setWashing(true);
    setTimeout(onDone, 900);
  };
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(finish, reduced ? 600 : 6400);
    return () => clearTimeout(t);
  }, []);

  /* The title is drawn, not typeset: each letter rises separately from behind
     the reef, with a gradient fill and a light sweeping across afterwards. */
  const line1 = "Dan's Tank";
  const line2 = "Wizard";
  /* Two nested spans per letter, deliberately: the outer one carries the
     transform, the inner one the gradient fill. Putting both on one element
     makes WebKit drop the background-clip, which rendered the whole title
     transparent — visible in the DOM, invisible on screen. */
  const letter = (ch, i, base) => (
    <span key={i} className="sp-letter" style={{ animationDelay: `${base + i * 55}ms` }}>
      <span className="sp-glyph">{ch === " " ? "\u00A0" : ch}</span>
    </span>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" onClick={finish}>
      <div className={`absolute inset-0 sp-wrap${washing ? " sp-wash" : ""}`}
        style={{ background: "linear-gradient(180deg,#1AA0AC 0%,#0C6470 38%,#063744 72%,#04222B 100%)" }}>

        <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <linearGradient id="spSand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EDE2C9" /><stop offset="100%" stopColor="#BFAD87" />
            </linearGradient>
            <linearGradient id="spRay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CFFAF4" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#CFFAF4" stopOpacity="0" />
            </linearGradient>
            <filter id="spSoft"><feGaussianBlur stdDeviation="6" /></filter>
            <radialGradient id="spVig" cx="50%" cy="42%" r="72%">
              <stop offset="60%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
            </radialGradient>
          </defs>

          <g className="sp-caustic">
            <g className="sp-ray" filter="url(#spSoft)">
              <polygon points="42,0 84,0 126,300 62,300" fill="url(#spRay)" />
              <polygon points="150,0 182,0 228,300 176,300" fill="url(#spRay)" />
              <polygon points="238,0 264,0 300,300 258,300" fill="url(#spRay)" />
            </g>
          </g>

          {[[46,"0s",3.2],[96,"1.6s",2.1],[150,"0.7s",3.8],[198,"2.9s",2.5],[68,"4.2s",1.9],
            [124,"5.1s",2.9],[176,"3.4s",2.2],[220,"1.1s",3.1]].map(([y, d, r], i) => (
            <circle key={i} cx="-20" cy={y} r={r} fill="#DFFBF6" className="sp-drift"
              style={{ animationDelay: d }} />
          ))}

          {/* Far reef, dimmed for depth. */}
          <g opacity="0.34">
            <CoralClump x={16}  y={258} scale={0.55} colour="#8FD9D2" tip="#CFF6F1" delay={520} soft lean={0.2} />
            <CoralClump x={122} y={256} scale={0.5}  colour="#7FCBD8" tip="#CFF6F1" delay={660} soft lean={-0.2} />
            <CoralClump x={288} y={258} scale={0.52} colour="#8FD9D2" tip="#CFF6F1" delay={600} soft lean={0.15} />
          </g>

          <g className="sp-sand">
            <path d="M0,254 Q56,238 118,250 T236,244 T300,254 L300,300 L0,300 Z" fill="url(#spSand)" />
            <path d="M0,262 Q70,252 150,260 T300,256 L300,300 L0,300 Z" fill="#B3A07A" opacity="0.45" />
          </g>

          {/* Near reef. */}
          <SoftCoral  x={44}  y={256} scale={0.95} colour="#F2A0C0" delay={240} />
          <CoralClump x={84}  y={258} scale={1.15} colour="#F6FCFB" tip="#7FE3D4" delay={120} lean={0.12} />
          <CoralClump x={252} y={256} scale={1.0}  colour="#EFE4FB" tip="#B98BF0" delay={380} lean={-0.15} />
          <SoftCoral  x={286} y={258} scale={0.8}  colour="#F5C98A" delay={480} />
          <CoralClump x={176} y={260} scale={0.72} colour="#CFF0EC" tip="#7FE3D4" delay={560} soft lean={0.1} />

          <g className="sp-fishR" style={{ animationDelay: "400ms" }}>
            <g transform="translate(0 104)"><Clownfish /></g>
          </g>
          <g className="sp-fishL" style={{ animationDelay: "1400ms" }}>
            <g transform="translate(0 176)"><Firefish /></g>
          </g>

          <rect x="0" y="0" width="300" height="300" fill="url(#spVig)" />
        </svg>

        {/* Title — letters rising individually from behind the reef. */}
        <div className="absolute inset-x-0 flex flex-col items-center px-4"
          style={{ top: "17%", pointerEvents: "none" }}>
          <div className="relative">
            <div className="font-display text-center leading-[1.02]"
              style={{
                fontSize: "clamp(34px, 12vw, 58px)",
                filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(127,227,212,0.5))",
              }}>
              <div>{line1.split("").map((c, i) => letter(c, i, 3050))}</div>
              <div>{line2.split("").map((c, i) => letter(c, i, 3050 + line1.length * 55))}</div>
            </div>
            {/* Light sweeping across once the letters have landed. */}
            <div className="sp-shine absolute inset-y-0" style={{
              width: "42%", left: 0,
              background: "linear-gradient(100deg,transparent,rgba(255,255,255,0.55),transparent)",
              mixBlendMode: "overlay" }} />
          </div>
        </div>

        {/* The wizard — larger, with a swaying robe and sparks from his hands. */}
        <div className="absolute" style={{ left: "50%", bottom: "9%", transform: "translateX(-50%)" }}>
          <div className="sp-bubble absolute" style={{ left: "68%", bottom: "96%", whiteSpace: "nowrap" }}>
            <div className="rounded-2xl px-3.5 py-2 bg-white" style={{ boxShadow: "0 8px 26px rgba(0,0,0,0.35)" }}>
              <span className="text-[15px] font-black" style={{ color: "#08191D" }}>Wanna frag?</span>
            </div>
            <div className="absolute" style={{ bottom: -6, left: 18, width: 0, height: 0,
              borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
              borderTop: "8px solid #fff" }} />
          </div>

          <svg width="186" height="212" viewBox="0 0 186 212" className="sp-wizard" aria-hidden="true">
            <defs>
              <linearGradient id="spRobe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12909C" /><stop offset="100%" stopColor="#07545E" />
              </linearGradient>
              <linearGradient id="spHat" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#16A5B2" /><stop offset="100%" stopColor="#0A6B76" />
              </linearGradient>
            </defs>

            {/* arms, raised outward */}
            <g className="sp-armR">
              <path d="M66,126 L30,96" stroke="#0E8892" strokeWidth="12" strokeLinecap="round" />
              <circle cx="27" cy="93" r="9" fill="#F3DDC6" />
              <circle cx="27" cy="93" r="4" fill="#B8F5EC" className="sp-spark" />
              <circle cx="20" cy="86" r="2.6" fill="#EFFFFC" className="sp-spark" style={{ animationDelay: "400ms" }} />
            </g>
            <g className="sp-armL">
              <path d="M120,126 L156,96" stroke="#0E8892" strokeWidth="12" strokeLinecap="round" />
              <circle cx="159" cy="93" r="9" fill="#F3DDC6" />
              <circle cx="159" cy="93" r="4" fill="#B8F5EC" className="sp-spark" style={{ animationDelay: "200ms" }} />
              <circle cx="166" cy="86" r="2.6" fill="#EFFFFC" className="sp-spark" style={{ animationDelay: "700ms" }} />
            </g>

            {/* robe */}
            <g className="sp-robe">
              <path d="M70,116 Q93,108 116,116 L130,204 L56,204 Z" fill="url(#spRobe)" />
              <path d="M93,112 L93,204" stroke="#064851" strokeWidth="2" opacity="0.55" />
              <path d="M70,116 Q93,132 116,116 L112,142 Q93,152 74,142 Z" fill="#0A6B76" opacity="0.55" />
            </g>

            {/* head */}
            <circle cx="93" cy="96" r="23" fill="#F3DDC6" />
            <circle cx="85" cy="93" r="2.9" fill="#08191D" />
            <circle cx="101" cy="93" r="2.9" fill="#08191D" />
            <circle cx="86" cy="92" r="1" fill="#fff" />
            <circle cx="102" cy="92" r="1" fill="#fff" />
            <path d="M83,104 Q93,113 103,104" stroke="#08191D" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <circle cx="76" cy="103" r="4.5" fill="#E8A08C" opacity="0.4" />
            <circle cx="110" cy="103" r="4.5" fill="#E8A08C" opacity="0.4" />
            {/* beard */}
            <path d="M72,102 Q93,142 114,102 Q104,124 93,124 Q82,124 72,102 Z" fill="#F7FBFA" />
            <path d="M80,110 Q93,130 106,110 Q99,120 93,120 Q87,120 80,110 Z" fill="#E4EFEE" opacity="0.7" />

            {/* hat */}
            <g className="sp-hat">
              <path d="M93,16 Q104,48 116,74 L70,74 Q82,48 93,16 Z" fill="url(#spHat)" />
              <path d="M93,16 Q99,40 106,60 L86,60 Q90,38 93,16 Z" fill="#3FCADA" opacity="0.45" />
              <ellipse cx="93" cy="75" rx="34" ry="8" fill="#0E8892" />
              <ellipse cx="93" cy="73" rx="34" ry="7" fill="#16A5B2" />
              <circle cx="93" cy="18" r="5" fill="#B8F5EC" className="sp-tip" />
              <circle cx="82" cy="56" r="2.4" fill="#B8F5EC" opacity="0.8" />
              <circle cx="103" cy="46" r="2" fill="#B8F5EC" opacity="0.7" />
            </g>
          </svg>
        </div>
      </div>

      {washing && (
        <div className="sp-foam absolute inset-y-0" style={{ left: 0, width: "46%" }}>
          <svg viewBox="0 0 100 300" preserveAspectRatio="none" className="w-full h-full">
            <path d="M100,0 Q62,58 80,118 Q96,190 58,242 Q32,278 44,300 L0,300 L0,0 Z"
              fill="rgba(200,246,240,0.94)" />
            <path d="M100,0 Q72,64 88,124 Q104,196 68,248 Q42,282 54,300 L26,300 L26,0 Z"
              fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      )}

      {!washing && (
        <button onClick={finish}
          className="absolute inset-x-0 mx-auto text-[11px] font-extrabold uppercase tracking-widest text-white/60"
          style={{ bottom: "calc(2.5% + env(safe-area-inset-bottom, 0px))" }}>
          Tap to skip
        </button>
      )}
    </div>
  );
}

/* --- Task completion ---
 *
 * Ticking off a chore used to move a row quietly. This marks it, and shows the
 * run of times it has been done — the one thing the app knows that you don't
 * carry in your head.
 */
function TaskDonePopup({ result, onClose }) {
  const AUTO_SECONDS = 10;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);
  const [lit, setLit] = useState(0);

  const stats = useMemo(() => {
    if (!result) return null;
    const dates = (result.history || []).slice(0, 12);
    /* Actual interval between completions, which is often not the interval that
       was set — worth showing without comment. */
    const gaps = [];
    for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i], dates[i - 1]));
    const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    return { dates, count: (result.history || []).length, avg };
  }, [result]);

  /* Stars light one at a time, most recent last, so the run reads left to right. */
  useEffect(() => {
    if (!result || !stats) return;
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = Math.min(stats.dates.length, 12);
    if (reduced) { setLit(n); return; }
    setLit(0);
    const timers = [];
    for (let i = 1; i <= n; i++) timers.push(setTimeout(() => setLit(i), 380 + i * 110));
    return () => timers.forEach(clearTimeout);
  }, [result, stats]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result || !stats) return null;
  const tone = "#0B7C86";
  const shown = stats.dates.slice().reverse();   // oldest first

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{"\u2705"}</div>
          <div className="text-[17px] font-black text-ink mt-3">{result.label}</div>
          <div className="text-[12px] font-bold text-ink2 mt-0.5">
            done {fmtFriendly(result.date)}
          </div>

          {/* The run so far. Twelve at most, so it stays a glance not a list. */}
          <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
            {shown.map((d, i) => {
              const isLatest = i === shown.length - 1;
              return (
                <span key={d + i}
                  className={i < lit ? "tp-star" : undefined}
                  style={{
                    fontSize: isLatest ? 19 : 14,
                    opacity: i < lit ? 1 : 0,
                    animationDelay: `${i * 40}ms`,
                    lineHeight: 1,
                  }}>
                  {isLatest ? "\u2B50" : "\u2734\uFE0F"}
                </span>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: tone, animationDelay: "260ms" }}>
            {stats.count === 1 ? "First time logged"
              : `${stats.count} times now`}
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
            style={{ animationDelay: "380ms" }}>
            {stats.avg != null
              ? `You do this about every ${Math.round(stats.avg)} days${
                  result.intervalDays && Math.abs(stats.avg - result.intervalDays) >= 2
                    ? `, against a schedule of ${intervalLabel(result.intervalDays).replace("every ", "")}`
                    : " — right on schedule"}.`
              : "The next one is scheduled from today."}
          </p>

          {result.nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">Next due</div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(result.nextDue)}
                {result.intervalDays
                  ? <span className="text-ink2 font-bold"> · {intervalLabel(result.intervalDays)}</span>
                  : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: tone, animationDelay: "620ms" }}>
            Done
          </button>
          <div className="mt-2" style={{ animationDelay: "740ms" }}>
            {held
              ? <span className="text-[10px] font-bold text-ink2">Staying open — tap Done when you're finished</span>
              : <span className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- ICP panel confirmation ---
 *
 * A lab panel is the most information-dense thing entered into the app, and it
 * arrived silently. This gives it a moment: the elements count in, the ones
 * outside reference are named, and anything that moved since the last panel is
 * shown with its direction.
 */
function IcpResultPopup({ result, onClose, icps }) {
  const AUTO_SECONDS = 16;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);
  const [phase, setPhase] = useState(0);      // 0 counting, 1 counted, 2 details

  const summary = useMemo(() => {
    if (!result) return null;
    const els = Object.entries(result.elements || {})
      .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
      .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }));
    const known = els.filter((e) => e.ref);
    const off = known.filter((e) => e.st !== "ok");
    const detected = els.filter((e) => e.st === "detected");

    /* Movement against the previous panel, so a new result reads as a change
       rather than a snapshot. */
    const prior = (icps || [])
      .filter((p) => p.date < result.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const moves = [];
    if (prior) {
      for (const e of known) {
        const was = prior.elements ? prior.elements[e.n] : undefined;
        if (was == null || was === e.v) continue;
        const denom = Math.abs(was) || Math.abs(e.v) || 1;
        const pct = ((e.v - was) / denom) * 100;
        if (Math.abs(pct) >= 25) moves.push({ ...e, was, pct });
      }
      moves.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    }
    return { total: els.length, known: known.length, off, detected, moves: moves.slice(0, 3), prior };
  }, [result, icps]);

  /* The element count ticks up rather than appearing, so the size of the panel
     registers before the detail does. */
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!result || !summary) return;
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setCount(summary.total); setPhase(2); return; }

    setCount(0); setPhase(0);
    let raf = 0, start = 0, cancelled = false;
    const DUR = 1400, DELAY = 420;
    const step = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const e = ts - start - DELAY;
      if (e < 0) { raf = requestAnimationFrame(step); return; }
      const t = Math.min(1, e / DUR);
      setCount(Math.round((1 - Math.pow(1 - t, 2.6)) * summary.total));
      if (t < 1) raf = requestAnimationFrame(step);
      else { setPhase(1); setTimeout(() => setPhase(2), 260); }
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [result, summary]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result || !summary) return null;

  const clean = summary.off.length === 0 && summary.detected.length === 0;
  const alarming = summary.detected.length > 0;
  const tone = alarming ? "#C4285B" : clean ? "#0B7C86" : "#D98324";
  const emoji = alarming ? "\u{1F6A8}" : clean ? "\u{1F52C}" : "\u{1F4CB}";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 42, lineHeight: 1 }}>{emoji}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className={`rc-value text-[38px] font-black leading-none tabular-nums${phase >= 1 ? " landed" : ""}`}
              style={{ color: tone }}>
              <span className="rc-sheen">{count}</span>
            </span>
            <span className="text-[13px] font-bold text-ink2">elements</span>
          </div>
          <div className="text-[12px] font-black text-ink mt-1">
            {result.lab || "ICP panel"} · {fmtDate(result.date)}
          </div>
        </div>

        {phase >= 2 && (
          <div className="px-5 py-4 rc-stagger">
            <div className="text-center" style={{ animationDelay: "0ms" }}>
              <div className="text-[15px] font-black" style={{ color: tone }}>
                {alarming ? "Contaminant detected"
                  : clean ? "Everything in reference"
                  : `${summary.off.length} outside reference`}
              </div>
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
                {alarming
                  ? `${joinList(summary.detected.map((e) => e.n))} should read zero. Worth finding what went in recently.`
                  : clean
                  ? `All ${summary.known} elements with a published range came back inside it.`
                  : `${summary.known - summary.off.length} of ${summary.known} elements sit inside their range.`}
              </p>
            </div>

            {summary.off.length > 0 && (
              <div className="mt-3 space-y-1" style={{ animationDelay: "150ms" }}>
                {summary.off.slice(0, 4).map((e) => (
                  <div key={e.n} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-ink capitalize truncate">{e.n}</span>
                    <span className="text-[12px] font-black shrink-0"
                      style={{ color: e.st === "detected" ? "#C4285B" : "#D98324" }}>
                      {e.v} · {e.st}
                    </span>
                  </div>
                ))}
                {summary.off.length > 4 && (
                  <div className="text-[11px] font-bold text-ink2">
                    and {summary.off.length - 4} more
                  </div>
                )}
              </div>
            )}

            {summary.moves.length > 0 && (
              <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "300ms" }}>
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                  Biggest moves since {fmtShort(summary.prior.date)}
                </div>
                {summary.moves.map((m) => (
                  <div key={m.n} className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-ink capitalize truncate">{m.n}</span>
                    <span className="text-[12px] font-black shrink-0"
                      style={{ color: m.pct > 0 ? "#D98324" : "#1D6FA5" }}>
                      {m.was} {m.pct > 0 ? "\u2191" : "\u2193"} {m.v}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
              style={{ background: tone, animationDelay: "450ms" }}>
              Done
            </button>
            <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
              {held
                ? <span className="text-[10px] font-bold text-ink2">Staying open — tap Done when you're finished</span>
                : <span className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Reading confirmation ---
 *
 * Logging a test is the thing you do most often, so it's worth making it feel
 * like something happened. The tone stays honest: a reading outside its band
 * gets a calm, useful line rather than an alarm, and one inside gets
 * acknowledgement rather than confetti.
 */
function readingVerdict(def, result) {
  const { value, status, delta, prev } = result;

  /* Some parameters have a ceiling rather than a target — ammonia should read
     zero, and anything measurable is worth acting on however far it sits
     "inside" the range. */
  if (def.idealAt === "min") {
    if (value <= (def.step || 0.01) / 2) {
      return { emoji: "\u{1F3AF}", tone: "#0B7C86", headline: "Undetectable",
        line: "Exactly where it should be — an established tank should read zero." };
    }
    if (value <= def.max) {
      return { emoji: "\u26A0\uFE0F", tone: "#D98324", headline: "Detectable",
        line: "Any measurable ammonia means something isn't being processed. Check for a dead animal, an overfeed, or a disturbed filter — and re-test today." };
    }
    return { emoji: "\u{1F6A8}", tone: "#C4285B", headline: "Dangerously high",
      line: "This is harmful to livestock now. Test again to confirm, then act — water change, and find what died or overloaded the system." };
  }

  const mid = (def.min + def.max) / 2;
  const halfBand = (def.max - def.min) / 2 || 1;
  const fromMid = Math.abs(value - mid) / halfBand;   // 0 = dead centre, 1 = at the edge

  if (status === "ok") {
    if (fromMid < 0.35) {
      return { emoji: "\u{1F3AF}", tone: "#0B7C86",
        headline: "Dead centre",
        line: prev != null && Math.abs(delta) < def.step * 1.5
          ? "Barely moved since last time. That's the boring kind of good."
          : "Right in the middle of your band — nothing to do." };
    }
    if (prev != null && Math.abs(value - mid) < Math.abs(prev - mid)) {
      return { emoji: "\u{1F44C}", tone: "#0B7C86",
        headline: "Heading the right way",
        line: `In band, and closer to the middle than last time.` };
    }
    return { emoji: "\u2705", tone: "#0B7C86",
      headline: "In band",
      line: fromMid > 0.8 ? "Inside your range, though near the edge — worth watching."
        : "Comfortably within your target range." };
  }

  if (status === "high") {
    const far = value > def.max + halfBand;
    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C8}", tone: "#D98324",
      headline: far ? "Well above band" : "A little high",
      line: far ? "Far enough out that a re-test is worth doing before you act on it."
        : `${fmtVal(def, +(value - def.max).toFixed(4))}${def.unit} above the top of your range.` };
  }

  if (status === "low") {
    const far = value < def.min - halfBand;
    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C9}", tone: "#D98324",
      headline: far ? "Well below band" : "A little low",
      line: far ? "Far enough out that a re-test is worth doing before you act on it."
        : `${fmtVal(def, +(def.min - value).toFixed(4))}${def.unit} below the bottom of your range.` };
  }

  return { emoji: "\u2705", tone: "#0B7C86", headline: "Saved", line: "" };
}

function LogResultPopup({ result, onClose, readings = [] }) {
  /* The full sequence runs to about 6.8 seconds; the countdown leaves roughly
     eight more to actually look at the result. */
  const AUTO_SECONDS = 15;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);

  /* A card that vanishes without warning feels like a glitch, and one that
     vanishes while you're still reading is worse. The countdown says what will
     happen, and touching the card stops it — so it only closes itself when
     you've clearly moved on. */
  useEffect(() => {
    if (!result) return;
    setLeft(AUTO_SECONDS); setHeld(false);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  const series = useMemo(
    () => (result && result.def ? buildReadingSeries(result.def, readings, result) : []),
    [result, readings]);

  const geo = useMemo(
    () => (result && result.def && series.length >= 2
      ? readingGeometry(result.def, series, 260, 108, 12) : null),
    [result, series]);

  /* One clock for everything. The dot's position, the length of drawn line and
     the number on screen are all read from this single progress value, so they
     move as one rather than as three animations that happen to start together. */
  const [progress, setProgress] = useState(0);
  const [sheenDone, setSheenDone] = useState(false);
  const landed = progress >= 1;

  /* The sweep leaves the gradient clipped to the text, so the number keeps a
     faint sheen forever unless the class is removed once it has finished. */
  useEffect(() => {
    if (!landed) { setSheenDone(false); return; }
    const t = setTimeout(() => setSheenDone(true), 1250);
    return () => clearTimeout(t);
  }, [landed]);

  useEffect(() => {
    if (!result || !geo) { setProgress(1); return; }
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setProgress(1); return; }

    /* The chart bounces in, then the dot falls onto the first point, and only
       then does the travel begin — so nothing moves along the line until there
       is a line to move along. */
    /* Chart lands by 460ms and the scale by 640ms; a beat of stillness, then
       the dot falls from 900ms to 1340ms. The travel starts as it settles. */
    const DURATION = 4600, DELAY = 1340;
    let raf = 0, start = 0, cancelled = false;
    setProgress(0);
    const step = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start - DELAY;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      /* Eased so it sets off briskly and settles onto the final reading. */
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [result, geo]);

  if (!result || !result.def) return null;

  const { def, value, delta, prev, nextDue, interval } = result;
  const v = readingVerdict(def, result);
  const moved = prev != null && Math.abs(delta) >= (def.step || 0.01);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        {/* A tinted cap so the result reads before any words do. */}
        <div className="px-5 pt-6 pb-5 text-center" style={{ background: v.tone + "12" }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{v.emoji}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1">
            <span className={`rc-value text-[34px] font-black leading-none tabular-nums${landed && !sheenDone ? " landed" : ""}`}
              style={{ color: v.tone }}>
              <span className="rc-sheen">
                {fmtVal(def, geo ? geo.at(progress).value : value)}
              </span>
            </span>
            <span className="text-[14px] font-bold text-ink2">{def.unit}</span>
          </div>
          <div className="text-[13px] font-black text-ink mt-1">{def.label}</div>
          {moved && (
            <div className="text-[11px] font-bold text-ink2 mt-1">
              {delta > 0 ? "\u2191" : "\u2193"} {fmtVal(def, +Math.abs(delta).toFixed(4))}{def.unit} from {fmtVal(def, prev)}
            </div>
          )}

          {geo && (
            <div className="mt-2 -mx-1">
              <ReadingSparkline def={def} rows={series} result={result}
                progress={progress} geo={geo} />
            </div>
          )}
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: v.tone, animationDelay: "260ms" }}>
            {v.headline}
          </div>
          {v.line && (
            <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
              style={{ animationDelay: "380ms" }}>{v.line}</p>
          )}

          {nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">
                Next {def.label.toLowerCase()} test
              </div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(nextDue)}
                {interval ? <span className="text-ink2 font-bold"> · {intervalLabel(interval)}</span> : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: v.tone, animationDelay: "620ms" }}>
            Done
          </button>

          {held ? (
            <div className="mt-2 text-[10px] font-bold text-ink2" style={{ animationDelay: "740ms" }}>
              Staying open — tap Done when you're finished
            </div>
          ) : (
            <div className="mt-2" style={{ animationDelay: "740ms" }}>
              <div className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</div>
              {/* A bar as well as a number, so the time left is legible at a glance. */}
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: v.tone + "1F" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(left / AUTO_SECONDS) * 100}%`, background: v.tone,
                           transition: "width 1s linear" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* A brief, unobtrusive confirmation. Sits above the nav bar and clears itself. */
function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="fixed left-0 right-0 px-4 pointer-events-none flex justify-center"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))", zIndex: 80 }}>
      <div className="pointer-events-auto rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2"
        style={{ background: "#08191D" }}>
        <Check size={14} color="#7FE3D4" strokeWidth={3} />
        <span className="text-[12px] font-bold text-white">{message}</span>
      </div>
    </div>
  );
}

/* --- Enter every parameter on one screen ---
 *
 * The old form had a dropdown, so recording six tests meant six round trips
 * through a select. Every parameter is listed instead: type the value, press
 * Log, move on. The date applies to all of them, since a testing session
 * happens at one sitting.
 */
function TestLab({ paramDefs, readings, onAdd, onOpenParam, reminders = [], reminderView = null }) {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [values, setValues] = useState({});

  const setVal = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  const latest = useMemo(() => {
    const m = {};
    for (const d of paramDefs) {
      const rows = readings.filter((r) => r.param === d.key).sort(byNewest);
      m[d.key] = rows[0] || null;
    }
    return m;
  }, [readings, paramDefs]);

  const log = async (def) => {
    const raw = values[def.key];
    if (raw === undefined || raw === "") return;
    const v = parseFloat(raw);
    if (!isFinite(v)) return;
    await onAdd({ param: def.key, value: v, date, time, note: "" });
    setVal(def.key, "");

  };

  /* Progress for the chosen date: how many parameters that were due have been
     tested. Anything not due doesn't count against you. */
  const { sessionDue, sessionDone } = useMemo(() => {
    let due = 0, done = 0;
    for (const def of paramDefs) {
      const st = reminderView && reminderView.states.find(
        (x) => x.rem.paramKey === def.key && x.rem.kind === "test");
      const rows = readings.filter((r) => r.param === def.key);
      const testedOnDate = rows.some((r) => r.date === date);
      const wasDue = st && st.daysOut <= 0;
      if (wasDue || testedOnDate) due += 1;
      if (testedOnDate) done += 1;
    }
    return { sessionDue: due, sessionDone: done };
  }, [paramDefs, readings, date, reminderView]);

  const dueFor = (key) => {
    if (!reminderView) return null;
    const st = reminderView.states.find((x) => x.rem.paramKey === key && x.rem.kind === "test");
    return st || null;
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 border-b border-app">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[13px] font-black text-ink">Log your readings</div>
            <div className="text-[11px] text-ink2 font-semibold">Tap a name to see its graph</div>
          </div>
          {/* How much of this session is done. Only the parameters that were
              actually due count, so a full bar means finished rather than
              "everything tested regardless of schedule". */}
          {sessionDue > 0 && (
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-black" style={{ color: sessionDone >= sessionDue ? "#0B7C86" : "#45605F" }}>
                {sessionDone}/{sessionDue}
              </div>
              <div className="text-[9px] font-extrabold uppercase tracking-wide text-ink2">due done</div>
            </div>
          )}
        </div>

        {sessionDue > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "#0B7C8618" }}>
            <div className="h-full rounded-full"
              style={{ width: `${(sessionDone / sessionDue) * 100}%`, background: "#0B7C86",
                       transition: "width 600ms cubic-bezier(.2,.8,.3,1)" }} />
          </div>
        )}

        {sessionDue > 0 && sessionDone < sessionDue && (
          <div className="flex items-center gap-3 mb-2.5">
            {[["#1D6FA5", "due today"], ["#D98324", "overdue"], ["#0B7C86", "done"]].map(([c, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-ink2">{label}</span>
              </span>
            ))}
          </div>
        )}

        {sessionDue > 0 && sessionDone >= sessionDue && (
          <div className="rounded-lg px-3 py-2 mb-2.5 flex items-center gap-2" style={{ background: "#0B7C8614" }}>
            <span style={{ fontSize: 16 }}>{"\u{1F389}"}</span>
            <span className="text-[12px] font-extrabold" style={{ color: "#0B7C86" }}>
              Everything due today is done.
            </span>
          </div>
        )}
        {/* One date and time for the whole session, on their own row so both
            are comfortably usable. Editable because a reading written down at
            10pm and entered next morning belongs at 10pm — alkalinity moves
            through the day. */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Date</span>
            <input type="date" value={date} max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-0.5 rounded-lg border border-app bg-white px-2 py-2 text-[13px] font-bold text-ink" />
          </label>
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Time</span>
            <input type="time" value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-0.5 rounded-lg border border-app bg-white px-2 py-2 text-[13px] font-bold text-ink" />
          </label>
        </div>
      </div>

      <div className="divide-y divide-app">
        {paramDefs.map((def) => {
          const last = latest[def.key];
          const st = dueFor(def.key);
          const filled = values[def.key] !== undefined && values[def.key] !== "";
          /* Tested today: the row reads as ticked off rather than merely
             carrying a small line of grey text saying when it last was. */
          const doneToday = last && last.date === date;
          /* Three states worth telling apart at a glance: waiting for you,
             already done, and not on today's list at all. A left stripe marks
             the first two so the "due done" count has something to point at. */
          const overdue = !doneToday && st && st.daysOut < 0;
          const dueNow = !doneToday && st && st.daysOut === 0;
          const stripe = doneToday ? "#0B7C86" : overdue ? "#D98324" : dueNow ? "#1D6FA5" : "transparent";
          const rowBg = doneToday ? "#0B7C860E" : overdue ? "#D983240D" : dueNow ? "#1D6FA50A" : undefined;
          const idle = !doneToday && !overdue && !dueNow;
          return (
            <div key={def.key} className="px-3 py-2.5 transition-colors"
              style={{ background: rowBg, borderLeft: `3px solid ${stripe}`,
                       opacity: idle ? 0.62 : 1 }}>
              <div className="flex items-center gap-2">
                <button onClick={() => onOpenParam(def.key)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    {doneToday ? (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 tp-tick"
                        style={{ background: "#0B7C86" }}>
                        <Check size={10} strokeWidth={4} color="#fff" />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0 ml-1" style={{ background: def.color }} />
                    )}
                    <span className="text-[14px] font-black truncate"
                      style={{ color: doneToday ? "#0B7C86" : "#08191D" }}>{def.label}</span>
                    {(overdue || dueNow) && (
                      <span className="shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide"
                        style={{ background: overdue ? "#D9832422" : "#1D6FA51F",
                                 color: overdue ? "#D98324" : "#1D6FA5" }}>
                        {overdue ? `${Math.abs(st.daysOut)}d late` : "Due"}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold truncate"
                    style={{ color: doneToday ? "#0B7C86" : "#45605F" }}>
                    {doneToday ? (
                      <span className="font-extrabold">
                        Done · {fmtVal(def, last.value)}{def.unit}
                        {fmtTime(last.time) ? ` at ${fmtTime(last.time)}` : ""}
                      </span>
                    ) : (
                      <>
                        {last
                          ? `last ${fmtVal(def, last.value)}${def.unit} · ${fmtShort(last.date)}${fmtTime(last.time) ? ` ${fmtTime(last.time)}` : ""}`
                          : "no readings yet"}
                        {st && st.daysOut > 0 && (
                          <span className="ml-1">· next {fmtShort(st.due)}</span>
                        )}
                      </>
                    )}
                  </div>
                </button>

                <input type="number" inputMode="decimal" step={def.step}
                  value={values[def.key] ?? ""} onChange={(e) => setVal(def.key, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") log(def); }}
                  placeholder={def.unit}
                  className="w-20 shrink-0 rounded-lg border border-app bg-white px-2 py-1.5 text-[14px] font-bold text-ink text-right" />

                <button onClick={() => log(def)} disabled={!filled}
                  className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold transition-colors"
                  style={filled
                    ? { background: def.color, color: "#fff" }
                    : doneToday
                    ? { background: "transparent", color: "#0B7C8699", border: "1px solid #0B7C8633" }
                    : { background: "#EDF3F2", color: "#9FB0AE" }}>
                  {doneToday && !filled ? "Again" : "Log"}
                </button>
              </div>


            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Every chart in one place, stripped of commentary — for when you want to scan
   the tank's whole history rather than study one parameter. */
function AllGraphsModal({ paramDefs, readings, chartEvents, onClose, onOpenParam }) {
  /* One window setting for every chart, so they're comparable at a glance —
     charts on different timescales invite the wrong conclusion. */
  const [win, setWin] = useState(30);
  const cutoff = win >= 9999 ? null : addDaysFromToday(-win);

  const series = paramDefs
    .map((def) => ({
      def,
      data: readings.filter((r) => r.param === def.key && (!cutoff || r.date >= cutoff))
        .sort(byOldest)
        .map((r) => ({ date: r.date, value: r.value, label: fmtShort(r.date), time: r.time })),
    }))
    .filter((x) => x.data.length >= 2);

  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}>
      <div className="bg-app w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* The header sticks, so the window control stays reachable however far
            you scroll without floating over the charts. */}
        <div className="sticky top-0 bg-app px-4 pt-4 pb-2.5 z-10 border-b border-app">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold">At a glance</div>
              <h2 className="text-xl font-display text-ink">Parameter overview</h2>
            </div>
            <button aria-label="Close" onClick={onClose}
              className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-white/60"><X size={20} /></button>
          </div>
          <div className="flex gap-1.5">
            {[[7, "7d"], [14, "14d"], [30, "30d"], [90, "90d"], [9999, "All"]].map(([d, lbl]) => (
              <button key={d} onClick={() => setWin(d)}
                className="flex-1 rounded-lg py-1.5 text-[11px] font-extrabold border-2 transition-colors"
                style={{ borderColor: win === d ? "#0B7C86" : "#E3ECEA",
                         color: win === d ? "#0B7C86" : "#45605F",
                         background: win === d ? "#0B7C8610" : "#fff" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {series.length === 0 ? (
            <p className="text-[13px] text-ink2 font-medium">
              Nothing has two or more readings in the last {win >= 9999 ? "of your log" : `${win} days`}. Try a wider window.
            </p>
          ) : series.map(({ def, data }) => (
            <Card key={def.key} className="p-3">
              <button onClick={() => { onClose(); onOpenParam(def.key); }}
                className="flex items-center justify-between w-full gap-2 mb-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: def.color }} />
                  <span className="text-[13px] font-black text-ink truncate">{def.label}</span>
                </span>
                <span className="text-[11px] font-bold text-ink2 shrink-0">
                  {fmtVal(def, data[data.length - 1].value)}{def.unit} · target {fmtVal(def, def.min)}–{fmtVal(def, def.max)}
                </span>
              </button>
              <ZoomableLineChart data={data} color={def.color} targetMin={def.min} targetMax={def.max}
                height={150} events={chartEvents.filter((ev) => !ev.param || ev.param === def.key)} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Log a reading from the parameter view ---
 *
 * You often want to record a test at the moment you're looking at the trend for
 * that parameter, rather than going back to the Testing tab and re-selecting it.
 * Kept to the two fields that matter — value and date — and collapsed by
 * default so it never competes with the chart for attention.
 */
function QuickLog({ def, onAdd, settings, reminders = [] }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());

  const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === def.key);

  const submit = async () => {
    if (value === "") return;
    await onAdd({ param: def.key, value: parseFloat(value), date, time, note: "" });
    setValue("");
    setDate(todayStr()); setTime(nowTime());
  };

  return (
    <div className="rounded-xl border border-app overflow-hidden mb-4">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left active:bg-app">
        <span className="flex items-center gap-1.5">
          <Plus size={13} style={{ color: def.color }} />
          <span className="text-[12px] font-extrabold" style={{ color: def.color }}>
            Log a {def.label.toLowerCase()} reading
          </span>
        </span>
        {open ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-app">
          {/* Stacked rather than squeezed into columns: a date and a time
              control need most of a phone's width between them. */}
          <Field label={`Value (${def.unit || ""})`}>
            <input type="number" inputMode="decimal" step={def.step} value={value}
              onChange={(e) => setValue(e.target.value)} className={inputCls}
              placeholder={String(def.min)} />
          </Field>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Date">
              {/* Backdating matters: readings are often written down first and
                  entered later, and the hour is part of the reading. */}
              <input type="date" value={date} max={todayStr()}
                onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Time">
              <input type="time" value={time}
                onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Btn onClick={submit} className="w-full mt-3">
            <span className="flex items-center justify-center gap-1.5"><Plus size={13} /> Save reading</span>
          </Btn>
        </div>
      )}

    </div>
  );
}

/* --- What needs doing today ---
 * Sits directly under the tank assessment and shows only what is overdue or due
 * now. It disappears entirely when there's nothing to do, so its presence alone
 * means something needs attention.
 */
/* One row of the today panel. Test reminders take the reading inline: going to
   another tab to type one number was the most repeated friction in the app. */
function TodayRow({ s: st, onOpenTest, onComplete, onNudge, onPickTask, def, onAddReading }) {
  const [value, setValue] = useState("");
  const isTest = st.rem.kind === "test" && st.rem.paramKey;
  const late = st.status === "overdue";
  const canLogHere = isTest && def && onAddReading;

  const save = async () => {
    const v = parseFloat(value);
    if (!isFinite(v)) return;
    await onAddReading({ param: def.key, value: v, date: todayStr(), time: nowTime(), note: "" });
    setValue("");
  };

  return (
    <div className="rounded-xl bg-white border border-app p-2.5">
      <div className="flex items-center justify-between gap-2">
        <button className="min-w-0 text-left flex-1"
          onClick={() => (isTest ? onOpenTest(st.rem.paramKey) : onComplete(st.rem.id))}>
          <div className="text-[14px] font-black text-ink truncate">{st.rem.label}</div>
          <div className="text-[11px] font-bold"
            style={{ color: late ? "#D98324" : st.daysOut === 0 ? "#0B7C86" : "#45605F" }}>
            {late ? `${Math.abs(st.daysOut)} day${Math.abs(st.daysOut) === 1 ? "" : "s"} overdue`
              : st.daysOut === 0 ? "due today"
              : `in ${st.daysOut} day${st.daysOut === 1 ? "" : "s"} · ${fmtShort(st.due)}`}
            {/* A test pinned by the dosing protocol says so, since it sits off
                the usual rhythm for a reason. */}
            {st.pinned
                          ? ` · ${pinReasonLabel(st.pinReason)}${st.dueTime && fmtTime(st.dueTime) ? `, around ${fmtTime(st.dueTime)}` : ""}`
                          : ` · ${intervalLabel(st.rem.intervalDays)}`}
                      </div>
        </button>

        {canLogHere ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input type="number" inputMode="decimal" step={def.step} value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder={def.unit}
              className="w-16 rounded-lg border border-app bg-white px-2 py-1.5 text-[13px] font-bold text-ink text-right" />
            <button onClick={save} disabled={value === ""}
              className="rounded-lg px-3 py-2 text-[12px] font-extrabold transition-colors"
              style={{ background: value === "" ? "#EDF3F2" : "#0B7C86", color: value === "" ? "#9FB0AE" : "#fff" }}>
              Log
            </button>
          </div>
        ) : (
          <button onClick={() => onComplete(st.rem.id)}
            className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            Done
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <NudgeButton onClick={() => onNudge(st.rem.id, 1 - Math.min(0, st.daysOut))} label="Snooze until tomorrow" />
          {onPickTask && <NudgeButton onClick={() => onPickTask(st.rem.id)} label="Change schedule…" />}
          {canLogHere && (
            <button onClick={() => onOpenTest(st.rem.paramKey)}
              className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
              Open in Test Lab
            </button>
          )}
      </div>
    </div>
  );
}

function TodayPanel({ view, onOpenTest, onComplete, onNudge, onPickTask, paramDefs = [], onAddReading = null }) {
  /* Collapsed to one line by default so it never crowds the dashboard, but
     always present: hiding it entirely when nothing was due made it look like
     the reminders had disappeared. When you're clear it shows what's next
     instead of vanishing. */
  const [open, setOpen] = useState(false);
  if (!view) return null;

  const actionable = view.actionable;
  const soon = view.upcoming.slice(0, 4);
  const rows = actionable.length ? actionable : soon;
  if (!rows.length) return null;

  const overdue = view.overdue.length;
  const clear = actionable.length === 0;
  const tone = overdue ? "#D98324" : clear ? "#45605F" : "#0B7C86";

  const headline = overdue
    ? `${overdue} overdue`
    : actionable.length
    ? `${actionable.length} due today`
    : "Nothing due today";

  const preview = clear
    ? (soon[0] ? `next ${soon[0].rem.label.replace(/^Test /, "")} in ${soon[0].daysOut}d` : "")
    : rows.slice(0, 2).map((s) => s.rem.label.replace(/^Test /, "")).join(", ") +
      (rows.length > 2 ? ` +${rows.length - 2}` : "");

  return (
    <div className="rounded-2xl border-2 mb-4"
      style={{ borderColor: overdue ? "#D9832555" : clear ? "#E3ECEA" : "#0B7C8640",
               background: overdue ? "#D9832410" : clear ? "#fff" : "#0B7C860A" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 p-4 text-left">
        <Bell size={15} style={{ color: tone }} className="shrink-0" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.13em] shrink-0" style={{ color: tone }}>
          {headline}
        </span>
        <span className="text-[11px] font-bold text-ink2 truncate flex-1 min-w-0 text-right">{preview}</span>
        {open ? <ChevronUp size={15} style={{ color: tone }} className="shrink-0" />
              : <ChevronDown size={15} style={{ color: tone }} className="shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {rows.map((st) => (
              <TodayRow key={st.rem.id} s={st} onOpenTest={onOpenTest} onComplete={onComplete}
                onNudge={onNudge} onPickTask={onPickTask} onAddReading={onAddReading}
                def={paramDefs.find((d) => d.key === st.rem.paramKey)} />
            ))}
          </div>
          <p className="text-[10px] text-ink2 font-medium mt-2.5 leading-relaxed">
            {clear
              ? "Nothing needs doing right now — these are what's coming. Type a reading straight in when you test."
              : "Type the reading in and it saves, completes the reminder, and schedules the next one from today."}
          </p>
        </div>
      )}
    </div>
  );
}

function NudgeButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
      {label}
    </button>
  );
}

/* The fuller picture: what's coming, and what's recently been done. The window
   is adjustable because a two-day alkalinity rhythm and a six-week ICP cycle
   want very different horizons. */
function RemindersPanel({ view, windowDays, setWindowDays, onOpenTest, onComplete, onNudge, onPickTask, onOpenCalendar = null }) {
  if (!view) return null;
  const Row = ({ s, tone, right }) => (
    <div className="flex items-center justify-between gap-2 py-2 border-t border-app first:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
        <div className="text-[10px] font-bold text-ink2">{intervalLabel(s.rem.intervalDays)}</div>
      </div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        {onOpenCalendar ? (
          <button onClick={onOpenCalendar}
            className="flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[11px] font-extrabold"
            style={{ borderColor: "#E3ECEA", color: "#45605F" }}>
            <ListChecks size={13} /> Calendar
          </button>
        ) : <span />}
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className="rounded-lg px-2 py-1 text-[11px] font-extrabold border-2"
              style={{ borderColor: windowDays === d ? "#0B7C86" : "#E3ECEA",
                       color: windowDays === d ? "#0B7C86" : "#45605F" }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {view.actionable.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Needs doing</div>
          {view.actionable.map((s) => (
            <div key={s.rem.id} className="py-2.5 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
                  <div className="text-[10px] font-bold" style={{ color: s.status === "overdue" ? "#D98324" : "#0B7C86" }}>
                    {s.status === "overdue" ? `${Math.abs(s.daysOut)} day${Math.abs(s.daysOut) === 1 ? "" : "s"} overdue` : "due today"}
                  </div>
                </button>
                <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
                  className="shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-extrabold text-white" style={{ background: "#0B7C86" }}>
                  {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
                </button>
              </div>
              {/* Snooze stays as a one-tap shortcut; anything more than that
                  opens the same sheet the calendar uses, so there is one way to
                  change a schedule however you got here. */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <NudgeButton onClick={() => onNudge(s.rem.id, 1 - Math.min(0, s.daysOut))} label="Snooze until tomorrow" />
                {onPickTask && <NudgeButton onClick={() => onPickTask(s.rem.id)} label="Change schedule…" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {view.upcoming.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Coming up</div>
          {view.upcoming.map((s) => (
            <div key={s.rem.id} className="py-2 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
                  <div className="text-[10px] font-bold text-ink2">
                    in {s.daysOut} day{s.daysOut === 1 ? "" : "s"} · {fmtShort(s.due)} · {intervalLabel(s.rem.intervalDays)}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
                    className="rounded-lg border-2 px-3 py-1.5 text-[11px] font-extrabold"
                    style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
                    {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view.recent.length > 0 && (
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Recently done</div>
          {view.recent.map((s) => (
            <Row key={s.rem.id} s={s} right={
              <>
                <div className="text-[12px] font-black flex items-center gap-1 justify-end" style={{ color: "#0B7C86" }}>
                  <Check size={12} /> {s.doneToday ? "today" : fmtShort(s.lastDone)}
                </div>
                <div className="text-[10px] font-bold text-ink2">next {fmtShort(s.due)}</div>
              </>
            } />
          ))}
        </div>
      )}

      {view.actionable.length === 0 && view.upcoming.length === 0 && view.recent.length === 0 && (
        <p className="text-[13px] text-ink2 font-medium">Nothing due in the next {windowDays} days.</p>
      )}

      {/* Say what sits beyond the window. Without this the selector looks
          broken whenever everything happens to be due at once — there is no
          visible difference between "nothing further out" and "not shown". */}
      <p className="text-[11px] text-ink2 font-medium mt-2.5 pt-2.5 border-t border-app leading-relaxed">
        Showing what's due and what was done within {windowDays} days.
        {view.later.length > 0
          ? ` ${view.later.length} further ${view.later.length === 1 ? "reminder falls" : "reminders fall"} beyond that — next is ${view.later[0].rem.label.toLowerCase()} on ${fmtShort(view.later[0].due)}.`
          : " Nothing falls outside it."}
      </p>
    </Card>
  );
}


/* ===========================================================================
   StabilityStrip — the picture that replaced forty words
   ===========================================================================
   The old summary described a shape in prose: "the last nine readings covered
   a 0.7 dKH spread and is climbing steadily, so it's passing through your
   target band rather than settling in it". This draws it.

   The target band is the lit segment. The observed spread of recent readings
   is the darker bar. Today is the dot. Where the bar sits inside the band the
   tank is settled; where it overhangs either end, the parameter is travelling
   through — which is the distinction the paragraph needed a whole sentence to
   make and the eye makes instantly.
   ========================================================================= */
function StabilityStrip({ def, readings }) {
  const rows = (readings || []).filter((r) => r.param === def.key);
  if (rows.length < 2) return null;
  const stab = computeStability(def, readings);
  if (!stab || stab.p05 == null || stab.p95 == null) return null;

  /* The axis spans the band plus a margin, widened if the readings run past
     it, so an excursion is visible rather than clipped at the edge. */
  const bandW = (def.max - def.min) || 1;
  const lo = Math.min(def.min - bandW * 0.35, stab.p05 - bandW * 0.08);
  const hi = Math.max(def.max + bandW * 0.35, stab.p95 + bandW * 0.08);
  /* Clamped: an excursion beyond the drawn axis used to place the marker and
     its travel line outside the rail entirely. */
  const at = (v) => Math.max(0, Math.min(100, ((v - lo) / ((hi - lo) || 1)) * 100));

  const now = rows[rows.length - 1].value;
  const outside = stab.p05 < def.min || stab.p95 > def.max;

  /* The oldest reading in the same window the stability engine graded, so the
     two can never tell different stories. */
  const windowRows = rows.slice(-Math.max(2, stab.readingCount || 2));
  const then = windowRows[0].value;
  const travelled = Math.abs(now - then) >= (def.step || 0.01);

  return (
    <div className="strip" role="img"
      aria-label={`${def.label}: recent readings span ${fmtVal(def, stab.p05)} to ${fmtVal(def, stab.p95)}${def.unit}, target ${fmtVal(def, def.min)} to ${fmtVal(def, def.max)}${def.unit}`}>
      <div className="strip-rail">
        <div className="strip-band"
          style={{ left: `${at(def.min)}%`, width: `${at(def.max) - at(def.min)}%`,
                   background: def.color, opacity: 0.16 }} />
        <div className="strip-span"
          style={{ left: `${at(stab.p05)}%`, width: `${Math.max(1.5, at(stab.p95) - at(stab.p05))}%`,
                   background: outside ? "#D98324" : def.color }} />
        {travelled && (
          <>
            <div className="strip-travel"
              style={{ left: `${Math.min(at(then), at(now))}%`,
                       width: `${Math.abs(at(now) - at(then))}%` }} />
            <div className="strip-then" style={{ left: `${at(then)}%` }}
              title={`${stab.readingCount} readings ago: ${fmtVal(def, then)}${def.unit}`} />
          </>
        )}
        <div className="strip-now" style={{ left: `${at(now)}%` }}
          title={`now: ${fmtVal(def, now)}${def.unit}`} />
      </div>
      <div className="strip-scale">
        <span>{fmtVal(def, def.min)}</span>
        <span className="strip-scale-mid">
          {travelled
            ? `${fmtVal(def, then)} \u2192 ${fmtVal(def, now)}${def.unit}`
            : "target"}
        </span>
        <span>{fmtVal(def, def.max)}</span>
      </div>
    </div>
  );
}

/* ===========================================================================
   Briefing — the summary, as a feed of claims
   ========================================================================= */

/* ===========================================================================
   ScoreBreakdown — the score, shown working
   ========================================================================= */
function ScoreBreakdown({ ex, onOpenParam }) {
  if (!ex) return null;
  return (
    <div className="sb">
      {ex.capped && (
        <p className="sb-capped">
          Overridden: a detectable ammonia reading caps the score regardless of
          everything else below.
        </p>
      )}

      <div className="sb-rows">
        {ex.parts.map((p) => (
          <button key={p.key} className="sb-row" onClick={() => onOpenParam(p.key)}>
            <span className="sb-name">{p.label}</span>
            <span className="sb-bars">
              {/* Two bars, because the single number hid which of the two was
                  the problem — alkalinity moves, calcium sits in the wrong
                  place, and those need opposite responses. */}
              <span className="sb-bar" title={`Position in range: ${p.range}`}>
                <span className="sb-fill sb-range" style={{ width: `${p.range}%` }} />
              </span>
              <span className="sb-bar" title={`Steadiness: ${p.stability}`}>
                <span className="sb-fill sb-stab" style={{ width: `${p.stability}%` }} />
              </span>
            </span>
            <span className={`sb-sub ${p.sub < 70 ? "sb-low" : p.sub < 90 ? "sb-mid" : "sb-hi"}`}>{p.sub}</span>
          </button>
        ))}
      </div>

      <div className="sb-key">
        <span><i className="sb-swatch sb-range" /> position in range</span>
        <span><i className="sb-swatch sb-stab" /> steadiness</span>
      </div>

      <div className="sb-maths">
        <div className="sb-line">
          <span>Average of all {ex.parts.length}</span><span>{ex.mean}</span>
        </div>
        <div className="sb-line">
          <span>{ex.weakest.length ? `Weakest link · ${joinList(ex.weakest)}` : "Weakest link"}</span>
          <span>{ex.worst}</span>
        </div>
        <div className={`sb-line ${ex.evidenceCap != null && ex.evidenceCap < ex.blended ? "" : "sb-total"}`}>
          <span>60% average + 40% weakest</span><span>{ex.blended}</span>
        </div>
        {ex.evidenceCap != null && ex.evidenceCap < ex.blended && (
          <div className="sb-line sb-total">
            <span>Capped — only {ex.totalReadings} readings so far</span>
            <span>{ex.evidenceCap}</span>
          </div>
        )}
      </div>

      <p className="sb-note">
        The weakest link is weighted deliberately, so one badly-wrong parameter cannot
        hide behind six good ones. It also means fixing a single parameter moves the
        total only a little — the others still hold the weakest-link term down.
      </p>
    </div>
  );
}


/* ===========================================================================
   SnoozeSheet — shown the first time, and when it becomes a habit
   ===========================================================================
   Not shown on every snooze. Putting a suggestion off is cheap and reversible,
   and a dialog in front of a cheap reversible action is friction that teaches
   people to dismiss dialogs. It appears twice: the first time, so the promise
   is explicit, and again once the same suggestion has been put off three
   times, which is the point at which the target is more likely wrong than the
   advice.
   ========================================================================= */
function SnoozeSheet({ claim, param, count, onConfirm, onCancel, onOpenTargets }) {
  const habit = count >= 2;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{ background: "#08191D66" }} onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-display text-ink mb-1">
          {habit ? "Put this off again?" : "Put this off for now?"}
        </h3>
        <p className="text-[13px] text-ink2 font-medium leading-relaxed mb-3">
          {claim}
        </p>

        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860D", border: "1px solid #0B7C8626" }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#0B7C86" }}>
            It comes back
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">
            As soon as you log your next {param} reading — or sooner if the
            recommended amount changes materially. It is not switched off, just
            not asked again until there is something new to judge it on.
          </p>
        </div>

        {habit && (
          /* The honest alternative. Someone content at this level does not want
             a suppressed warning, they want a target that matches the tank they
             are actually keeping. */
          <div className="rounded-xl p-3 mb-3" style={{ background: "#D983240D", border: "1px solid #D9832433" }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#D98324" }}>
              You have put this off {count} times
            </div>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
              If you are content with {param} where it is, the target is the thing
              to change rather than the dose. A range you actually want beats a
              warning you always dismiss.
            </p>
            {onOpenTargets && (
              <Btn variant="ghost" className="w-full" onClick={onOpenTargets}>
                Change the {param} target
              </Btn>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Btn variant="ghost" className="flex-1" onClick={onCancel}>Keep showing</Btn>
          <Btn className="flex-1" onClick={onConfirm}>Not now</Btn>
        </div>
      </div>
    </div>
  );
}

function Briefing({ claims, readings, paramDefs, onOpenParam, onGoTo, onDismiss,
  hiddenCount = 0, onRestoreAll, snoozeHint = false }) {
  const [openId, setOpenId] = useState(null);
  if (!claims || !claims.length) return null;

  const MARK = { act: "!", warn: "\u25B2", busy: "\u25CB", watch: "\u25CF", ok: "\u2713" };

  return (
    <div className="brief">
      {claims.map((c) => {
        const def = c.strip ? paramDefs.find((d) => d.key === c.strip.key) : null;
        const open = openId === c.id;
        return (
          <div key={c.id} className={`brief-item brief-${c.tone}`}>
            {/* A claim is a pointer, not a statement: tapping it goes to the
                place that can act on it — the dosing screen for a dose claim,
                the parameter's own history for anything else. */}
            <button className="brief-head"
              onClick={() => { if (c.goto) onGoTo(c.goto); else setOpenId(open ? null : c.id); }}
              aria-expanded={c.goto ? undefined : open}>
              <span className="brief-mark" aria-hidden="true">{MARK[c.tone] || "\u25CF"}</span>
              <span className="brief-claim">{c.claim}</span>
              {c.goto && <span className="brief-go" aria-hidden="true">{"\u203A"}</span>}
            </button>

            {/* Put away, not deleted: the key carries the numbers behind the
                claim, so a material change brings it straight back. */}
            {c.dismissible && onDismiss && (
              <div className="brief-actions">
                {/* Two different promises, so they get two different words.
                    "Hide" waits for the numbers to change; "Not now" waits for
                    the next test, which is when there is anything new to say
                    about a dose. */}
                <button className="brief-hide" onClick={() => onDismiss(c)}
                  aria-label={`${c.snoozeUntilTest ? "Not now" : "Hide"}: ${c.claim}`}>
                  {c.snoozeUntilTest ? "Not now" : "Hide"}
                </button>
                <span className="brief-hint">
                  {c.snoozeUntilTest
                    ? "back after your next test"
                    : "back if this changes"}
                </span>
              </div>
            )}

            <div className="brief-support">{c.support}</div>

            {c.facts && (
              <div className="brief-facts">
                {c.facts.map((f, i) => <span key={i}>{f}</span>)}
              </div>
            )}

            {def && <StabilityStrip def={def} readings={readings} />}

            {def && open && (
              <button className="brief-link" onClick={() => onOpenParam(def.key)}>
                Open {def.label.toLowerCase()} history
              </button>
            )}
          </div>
        );
      })}

      {snoozeHint && (
        <p className="brief-target-note">
          Putting the same suggestion off each time usually means the target is
          the thing to change, not the dose — targets live in Setup, and a range
          you actually want is better than a warning you always dismiss.
        </p>
      )}

      {hiddenCount > 0 && onRestoreAll && (
        <button className="brief-restore" onClick={onRestoreAll}>
          {hiddenCount === 1 ? "1 hidden note" : `${hiddenCount} hidden notes`} — show again
        </button>
      )}
    </div>
  );
}

function OverviewCard({ overview, scoreEx, onOpenParam, claims = [], readings = [],
  paramDefs = [], onGoTo, onDismissNote, hiddenCount = 0, onRestoreNotes, snoozeHint = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showMaths, setShowMaths] = useState(false);
  const s = overview.score;
  const scoreColor = s == null ? "#9FB0AE" : s >= 85 ? "#0B7C86" : s >= 70 ? "#2E8B57" : s >= 50 ? "#D98324" : "#C4285B";
  return (
    <div className="bg-white border-2 rounded-2xl p-5 mb-6 shadow-sm" style={{ borderColor: scoreColor + "40" }}>
      <div className="flex items-start gap-4">
        {s != null && (
          /* The score was the one figure in the app that could not be
             interrogated. Tapping it shows the arithmetic. */
          <button className="shrink-0 text-center"
            onClick={() => { setExpanded(true); setShowMaths(true); }}
            aria-label="Show how the score is calculated">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: scoreColor + "15", border: `2px solid ${scoreColor}` }}>
              <span className="text-2xl font-black" style={{ color: scoreColor }}>{s}</span>
            </div>
            <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1 text-ink2">
              {showMaths ? "Health" : "How?"}
            </div>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] font-extrabold mb-1" style={{ color: scoreColor }}>
            Tank assessment
          </div>
          <h3 className="text-lg font-display text-ink leading-snug mb-2">{overview.headline}</h3>
          {/* Collapsed by default: the headline is the answer, and most days
              that is the whole visit. Everything behind it is one tap. */}
          {!expanded && claims.length > 0 && (
            <button onClick={() => setExpanded(true)}
              className="text-xs font-extrabold flex items-center gap-1" style={{ color: scoreColor }}>
              <ChevronDown size={13} />
              {claims.length === 1 ? "1 thing to look at" : `${claims.length} things to look at`}
            </button>
          )}

          {expanded && (
            <>
              {/* The score working sits above the claims, not below them: at the
                  bottom it read as one more finding rather than an explanation
                  of the number at the top of the card. */}
              <button onClick={() => setShowMaths((v) => !v)}
                className="text-[11px] font-extrabold flex items-center gap-1 mb-2" style={{ color: scoreColor }}>
                {showMaths ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showMaths ? "Hide the score working" : `How is the score of ${s} calculated?`}
              </button>
              {showMaths && <ScoreBreakdown ex={scoreEx} onOpenParam={onOpenParam} />}

              <Briefing claims={claims} readings={readings} paramDefs={paramDefs}
                onOpenParam={onOpenParam} onGoTo={onGoTo}
                onDismiss={onDismissNote} hiddenCount={hiddenCount}
                onRestoreAll={onRestoreNotes} snoozeHint={snoozeHint} />

              <button onClick={() => { setExpanded(false); setShowMaths(false); }}
                className="mt-2 text-xs font-extrabold flex items-center gap-1" style={{ color: scoreColor }}>
                <ChevronUp size={13} /> Show less
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

/* --- Error boundary ---
 *
 * A crash in one tab used to render nothing at all: a blank page with no clue
 * what happened, and no way to reach the rest of the app. This catches it,
 * names it, and leaves the navigation working so the other tabs are still
 * usable while the fault is fixed.
 */
class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    /* Moving to another tab should clear a previous tab's failure. */
    if (prev.tabKey !== this.props.tabKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <Card className="p-4 mb-6" style={{ borderColor: "#C4285B55" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} color="#C4285B" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#C4285B" }}>
            This tab hit an error
          </span>
        </div>
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
          Something in this screen failed to display. Your data is untouched — the other tabs still
          work, and nothing has been lost.
        </p>
        <div className="rounded-lg p-2.5 mb-3" style={{ background: "#F7FAFA" }}>
          <p className="text-[11px] font-mono text-ink2 leading-relaxed break-words">
            {String(e && e.message ? e.message : e)}
          </p>
        </div>
        <Btn variant="ghost" className="w-full" onClick={() => this.setState({ error: null })}>
          <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Try again</span>
        </Btn>
      </Card>
    );
  }
}

function Card({ children, className = "", style }) {
  return <div style={style} className={`bg-white border border-app rounded-2xl shadow-[0_1px_2px_rgba(15,40,45,0.04)] ${className}`}>{children}</div>;
}

/* Deleting a reading or an ICP panel was a single tap on a 13px icon with no
   confirmation and no undo. Two taps, with the second clearly labelled, costs
   almost nothing and prevents losing data to a mis-tap. */
function DeleteButton({ onDelete, label = "Delete", size = 15, confirmMessage = "Entry removed" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation(); setArmed(false);
          onDelete();
          /* The row vanishes on delete, so without this there is no sign it
             worked rather than silently failing. */
          notify(confirmMessage);
        }}
        className="shrink-0 px-2.5 py-2 -my-1 rounded-lg text-[11px] font-extrabold"
        style={{ background: "#C4285B", color: "#fff" }}>
        {label}?
      </button>
    );
  }
  return (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className="shrink-0 p-2 -m-1 rounded-lg text-ink2 hover:text-rose-700 active:bg-app">
      <Trash2 size={size} />
    </button>
  );
}

/* Findings render identically wherever they appear — dashboard modal, insights
   section, tasks — so the same conclusion always looks and reads the same. */
/* One element's dose verdict: the number you'd act on, large and legible,
   with the reasoning tucked behind a tap. Previously the recommendation was
   buried mid-paragraph and you had to read to find it. */
/* The full assessment, laid out in the order the protocol asks for: what was
   measured, what it implies, and only then what to do about it. */
function AlkAssessmentBlock({ a, def, onApplyDose = null, onClearPlan = null, onLogCorrection = null, onApplyEffect = null }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  /* Which figure the sheet opens on: the staged step, the full maintenance
     dose, or whatever the person types over it. */
  const [prefill, setPrefill] = useState(null);
  if (!a) return null;
  const tone = a.action === "implausible" ? "#C4285B"
    : a.action === "increase" || a.action === "decrease" ? "#0B7C86" : "#45605F";
  const Row = ({ k, v, strong }) => (
    <div className="flex items-start justify-between gap-3 py-1 border-t border-app first:border-0">
      <span className="text-[11px] font-bold text-ink2 shrink-0">{k}</span>
      <span className={`text-[12px] text-right ${strong ? "font-black text-ink" : "font-bold text-ink"}`}>{v}</span>
    </div>
  );

  const headline = a.action === "implausible" ? "Check your solution strength"
    : a.action === "increase" ? `Increase to ${fmtAmount(a.recommendedDose)} mL/day`
    : a.action === "decrease" ? `Reduce to ${fmtAmount(a.recommendedDose)} mL/day`
    : `Hold at ${fmtAmount(a.currentDose)} mL/day`;

  return (
    <div>
      {/* Where the staged correction stands, carried between sessions so a plan
          begun on Monday is still a plan on Wednesday. */}
      {a.activePlan && (
        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860F", border: "1px solid #0B7C8633" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
              Correction in progress
              {a.stages > 1 ? ` · step ${a.stage} of ${a.stages}` : ""}
            </span>
            {onClearPlan && (
              <button onClick={onClearPlan} className="text-[10px] font-extrabold text-ink2">Cancel</button>
            )}
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">
            You set {fmtAmount(a.activePlan.appliedDose)} mL/day on {fmtDate(String(a.activePlan.appliedAt).slice(0, 10))}
            {a.planTarget != null && Math.abs(a.planTarget - a.activePlan.appliedDose) > 0.05
              ? `, heading for about ${fmtAmount(a.planTarget)} mL/day once this step is confirmed.`
              : "."}
          </p>
          {a.nextTestDue && (
            <p className="text-[12px] font-black mt-1" style={{ color: "#0B7C86" }}>
              Test {def.label.toLowerCase()} {fmtFriendly(a.nextTestDue)}
              {a.activePlan.nextTestTime ? ` around ${fmtTime(a.activePlan.nextTestTime)}` : ""} — it's on your reminders.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl p-3 mb-3" style={{ background: tone + "12", border: `1px solid ${tone}33` }}>
        <div className="text-[14px] font-black mb-1" style={{ color: tone }}>{headline}</div>
        <p className="text-[12px] text-ink font-medium leading-relaxed">
          {a.explanation || a.reason}
        </p>
        {a.rateLimited && (
          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#1D6FA514" }}>
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#1D6FA5" }}>
              Held to {fmtAmount(a.rateLimited.allowed)} mL rather than {fmtAmount(a.rateLimited.wanted)} mL:
              the larger figure would move {def.label.toLowerCase()} faster than {fmtAmount(a.rateLimited.perDay)}{a.rateLimited.unit} a
              day, and the speed of a change stresses corals more than the level itself does. Getting
              there will take about {a.rateLimited.days} more {a.rateLimited.days === 1 ? "day" : "days"} this way.
            </p>
          </div>
        )}

        {a.caution && (
          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#D9832414" }}>
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#8A5A18" }}>
              {a.caution}
            </p>
          </div>
        )}

        {a.staged && a.plan && a.plan.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: tone + "33" }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1.5" style={{ color: tone }}>
              The plan from here
            </div>
            {/* Each step waits 48 hours and a re-test. Showing them makes the
                waiting part of the plan rather than something to remember. */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white"
                  style={{ background: tone }}>1</span>
                <span className="text-[12px] font-bold text-ink">
                  Set {fmtAmount(a.plan[0])} mL/day now
                </span>
              </div>
              {a.plan.slice(1).map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
                    style={{ background: tone + "22", color: tone }}>{i + 2}</span>
                  <span className="text-[12px] font-bold text-ink2">
                    after 48h and a re-test, {i + 2 === a.plan.length ? "settle around" : "move to"} {fmtAmount(step)} mL/day
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
              Staging exists because the strength figure is an estimate — each step gets checked before the
              next, so a wrong estimate is caught early rather than compounded. If you are confident in
              your numbers, going straight to {fmtAmount(a.maintenanceDose)} mL/day is a {fmtAmount(Math.abs(a.maintenanceDose - a.currentDose))} mL
              jump and gets there in one move.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Btn variant="ghost" onClick={() => { setPrefill(a.recommendedDose); setSheetOpen(true); }}>
                Step to {fmtAmount(a.recommendedDose)}
              </Btn>
              <Btn variant="ghost" onClick={() => { setPrefill(Math.round(a.maintenanceDose * 10) / 10); setSheetOpen(true); }}>
                Go to {fmtAmount(a.maintenanceDose)}
              </Btn>
            </div>
          </div>
        )}

        {/* The correction the protocol asks for, logged rather than left to
            memory — and split across days, since a large single addition moves
            alkalinity faster than is safe. */}
        {a.targetCorrection && onLogCorrection && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: tone + "33" }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1" style={{ color: tone }}>
              One-off correction
            </div>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
              Raise {def.label.toLowerCase()} by about {a.targetCorrection.ppmToRaise}{def.unit} in total,
              spread over at least {a.targetCorrection.days} days — around {fmtAmount(a.targetCorrection.ppmPerDay)}{def.unit} a
              day. At that pace it moves no faster than {fmtAmount(SAFE_DAILY_RISE[def.key])}{def.unit} a day, which is what
              corals tolerate; the whole amount at once would be far quicker than that.
              {a.targetCorrection.viaMaintenance
                ? ` With your maintenance solution that is about ${fmtAmount(a.targetCorrection.oneOffMl)} mL in total.`
                : ` That would take about ${fmtAmount(a.targetCorrection.oneOffMl)} mL of your maintenance solution, which is more liquid than makes sense — a stronger mix or the dry salt is the usual route, and the daily dose stays as it is.`}
              {" "}Log it once added and the rise is treated as your doing rather than as the tank needing less.
            </p>
            <Btn variant="ghost" className="w-full"
              onClick={() => onLogCorrection(Math.round(a.targetCorrection.oneOffMl * 10) / 10,
                                             a.targetCorrection.direction)}>
              <span className="flex items-center justify-center gap-1.5">
                <Plus size={13} /> Log a {fmtAmount(a.targetCorrection.oneOffMl)} mL correction
              </span>
            </Btn>
          </div>
        )}

        {onApplyDose && a.recommendedDose != null && a.action !== "implausible" && (
          sheetOpen ? (
            <DoseChangeSheet def={def} element={a.element || "alkalinity"}
              current={a.currentDose} recommended={prefill != null ? prefill : a.recommendedDose}
              suggested={a.recommendedDose} plan={a.plan}
              onCancel={() => setSheetOpen(false)}
              onSave={(ml, date, time) => {
                setSheetOpen(false);
                onApplyDose(ml, {
                  date, time,
                  target: a.staged ? Math.round(a.maintenanceDose * 10) / 10 : ml,
                  stage: a.continuingPlan && a.stage ? a.stage + 1 : 1,
                  stages: a.staged ? ((a.plan ? a.plan.length : 1) + (a.continuingPlan && a.stage ? a.stage : 0)) : 1,
                  fromDose: a.currentDose,
                  maintenanceDose: a.maintenanceDose, consumption: a.consumption,
                  effectPerMl: a.effectPerMl, currentValue: a.current ? a.current.value : null,
                  staged: a.staged,
                });
              }} />
          ) : (
            <Btn className="w-full mt-3" onClick={() => { setPrefill(null); setSheetOpen(true); }}>
              <span className="flex items-center justify-center gap-1.5">
                <Save size={13} /> {a.action === "hold"
                  ? "Change the dose anyway"
                  : `Set the dose${a.recommendedDose != null ? ` — suggested ${fmtAmount(a.recommendedDose)} mL/day` : ""}`}
              </span>
            </Btn>
          )
        )}
      </div>

      <div className="rounded-xl p-3" style={{ background: "#F7FAFA" }}>
        <Row k={`Current ${def.label.toLowerCase()}`} v={`${fmtVal(def, a.current.value)}${def.unit}`} strong />
        <Row k="Target range" v={`${fmtVal(def, a.target.min)}–${fmtVal(def, a.target.max)}${def.unit}`} />
        <Row k="Current dose" v={`${fmtAmount(a.currentDose)} mL/day`} />
        <Row k="Time on this dose"
          v={a.hoursOnDose == null ? "unchanged throughout"
            : a.hoursOnDose < 48 ? `${Math.round(a.hoursOnDose)} hours`
            : `${(a.hoursOnDose / 24).toFixed(1)} days`} />
        <Row k="Readings used" v={`${a.used.length} over ${fmtAmount(
          a.used.length >= 2
            ? (alkStamp(a.used[a.used.length - 1]) - alkStamp(a.used[0])) : 0)} days`} />
        {a.trendPerDay != null && (
          <Row k="Observed trend"
            v={`${a.trendPerWeek != null
              ? `${a.trendPerWeek > 0 ? "+" : ""}${fmtAmount(a.trendPerWeek)}${def.unit}/week`
              : `${a.trendPerDay > 0 ? "+" : ""}${fmtAmount(a.trendPerDay)}${def.unit}/day`
            }${a.consistent === true ? " · consistent" : a.consistent === false ? " · mixed" : ""}`} strong />
        )}
        {a.supplied != null && <Row k="Your dose supplies" v={`${fmtAmount(a.supplied)}${def.unit}/day`} />}
        {a.consumption != null && (
          <Row k={a.gaining ? "Tank is gaining" : "Tank is using"}
            v={a.gaining
              ? `${fmtAmount(a.gaining)}${def.unit}/day`
              : `${fmtAmount(a.consumption)}${def.unit}/day`} strong />
        )}
        {a.maintenanceDose != null && (
          <Row k="Calculated maintenance" v={`${fmtAmount(a.maintenanceDose)} mL/day`} />
        )}
        <Row k="Recommended next dose"
          v={a.recommendedDose == null ? "hold and re-test" : `${fmtAmount(a.recommendedDose)} mL/day`} strong />
      </div>

      {/* How well the one number everything rests on is actually known. */}
      {a.effectSolved && (
        <div className="mt-2 rounded-lg p-2.5" style={{ background: "#F7FAFA" }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
            Solution strength
          </div>
          {a.effectSolved.status === "ok" ? (
            <>
              <p className="text-[12px] text-ink font-medium leading-relaxed">
                Your tank's response across {a.effectSolved.periods} dosing periods puts the real effect at
                about {a.effectSolved.k.toFixed(4)} {def.unit} per mL, against the {a.effectPerMl.toFixed(4)} you have entered
                {Math.abs(a.effectSolved.pctOff) >= 10
                  ? ` — ${fmtAmount(Math.abs(a.effectSolved.pctOff))}% ${a.effectSolved.pctOff > 0 ? "stronger" : "weaker"} than assumed, which shifts every millilitre figure above by the same proportion.`
                  : `, which agrees closely.`}
              </p>
              {onApplyEffect && Math.abs(a.effectSolved.pctOff) >= 10 && a.effectSolved.suggestedPer100L && (
                <Btn variant="ghost" className="w-full mt-2"
                  onClick={() => onApplyEffect(a.effectSolved.suggestedPer100L)}>
                  <span className="flex items-center justify-center gap-1.5">
                    <Save size={13} /> Use {a.effectSolved.suggestedPer100L} {def.unit}/mL/100L
                  </span>
                </Btn>
              )}
            </>
          ) : (
            <p className="text-[12px] text-ink2 font-medium leading-relaxed">
              {a.effectSolved.status === "nochanges"
                ? `Every figure here rests on ${a.effectPerMl.toFixed(4)} ${def.unit} per mL, taken from what you entered. Once you have changed the dose once and tested either side of it, the app can solve for the real value from how the tank responded.`
                : `Solving for the real strength needs two settled dosing periods with a millilitre or more between them. ${a.effectSolved.periods || 0} so far.`}
            </p>
          )}
        </div>
      )}

      {a.used.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
            Measurements used
          </div>
          <div className="space-y-0.5">
            {a.used.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-ink2">
                  {fmtDate(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
                </span>
                <span className="text-[11px] font-black text-ink">{fmtVal(def, r.value)}{def.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">{a.nextCheck}</p>
    </div>
  );
}

/* --- Recording a dose change ---
 *
 * The recommendation is a starting point, not a instruction: the amount is
 * editable, and so are the date and time. When the dose actually changed
 * matters as much as the amount — setting 10.3 mL at 9am and testing the next
 * morning gives the tank a full day, while setting it at 9pm gives it twelve
 * hours, and the engine measures from that moment.
 */
function DoseChangeSheet({ def, element, current, recommended, suggested, plan, onCancel, onSave }) {
  const [ml, setMl] = useState(String(recommended != null ? recommended : current));
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const val = parseFloat(ml);
  const valid = isFinite(val) && val >= 0;
  const ref = suggested != null ? suggested : recommended;
  const differs = valid && ref != null && Math.abs(val - ref) > 0.05;

  return (
    <div className="rounded-xl border-2 p-3 mt-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
      <div className="text-[12px] font-black text-ink mb-2">Record the new dose</div>

      <Field label={`Amount (mL/day)`}>
        <input type="number" inputMode="decimal" step="0.1" min="0" value={ml}
          onChange={(e) => setMl(e.target.value)} className={inputCls} autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Field label="Changed on">
          {/* Backdatable: people often change the doser and record it later. */}
          <input type="date" value={date} max={todayStr()}
            onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="At">
          <input type="time" value={time}
            onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </Field>
      </div>

      {differs && (
        <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: "#45605F" }}>
          That's {fmtAmount(Math.abs(val - ref))} mL {val > ref ? "more" : "less"} than
          suggested, which is fine — the app will work from what you actually set and tell you what to
          expect from it.
        </p>
      )}

      {plan && plan.length > 1 && (
        <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: "#45605F" }}>
          This is the first of {plan.length} steps. The next is worked out from how the tank responds,
          so it may differ from {fmtAmount(plan[1])} mL once there are readings.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn disabled={!valid} onClick={() => onSave(Math.round(val * 10) / 10, date, time)}>
          <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Record</span>
        </Btn>
      </div>
    </div>
  );
}

/* --- What to expect after a dose change ---
 *
 * A dose change is a prediction as much as an action: it says the tank should
 * move a certain way over a certain time. Stating that up front means the next
 * test either confirms it or doesn't, rather than being read from scratch.
 */
function DoseChangePopup({ result, onClose }) {
  const AUTO = 14;
  const [left, setLeft] = useState(AUTO);
  const [held, setHeld] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!result) return;
    setPhase(0);
    const t = [setTimeout(() => setPhase(1), 420), setTimeout(() => setPhase(2), 900)];
    return () => t.forEach(clearTimeout);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result) return null;
  const { def, from, to, date, time, testOn, expected, perDay, days, staged, target } = result;
  const up = to > from;
  const tone = "#0B7C86";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>{up ? "\u{1F4C8}" : "\u{1F4C9}"}</div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-[19px] font-black text-ink2 tabular-nums">{fmtAmount(from)}</span>
            <span className="text-[15px] font-bold text-ink2">{"\u2192"}</span>
            <span className={`rc-value text-[32px] font-black leading-none tabular-nums${phase >= 1 ? " landed" : ""}`}
              style={{ color: tone }}>
              <span className="rc-sheen">{fmtAmount(to)}</span>
            </span>
            <span className="text-[12px] font-bold text-ink2">mL/day</span>
          </div>
          <div className="text-[12px] font-black text-ink mt-1">
            {def.label} · from {fmtFriendly(date)}{fmtTime(time) ? ` at ${fmtTime(time)}` : ""}
          </div>
        </div>

        {phase >= 2 && (
          <div className="px-5 py-4 rc-stagger">
            <div className="text-center" style={{ animationDelay: "0ms" }}>
              <div className="text-[15px] font-black" style={{ color: tone }}>Recorded</div>
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
                {expected != null
                  ? `If this is right, ${def.label.toLowerCase()} should move about ${fmtAmount(Math.abs(perDay))}${def.unit} a day and read near ${fmtVal(def, expected)}${def.unit} when you next test.`
                  : `The next test will show what this dose actually does.`}
              </p>
            </div>

            <div className="mt-3 rounded-xl p-3" style={{ background: "#F7FAFA", animationDelay: "150ms" }}>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-[11px] font-bold text-ink2">Test again</span>
                <span className="text-[12px] font-black text-ink">{fmtFriendly(testOn)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                <span className="text-[11px] font-bold text-ink2">That's in</span>
                <span className="text-[12px] font-black text-ink">{days} day{days === 1 ? "" : "s"}</span>
              </div>
              {expected != null && (
                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                  <span className="text-[11px] font-bold text-ink2">Expect around</span>
                  <span className="text-[12px] font-black" style={{ color: tone }}>
                    {fmtVal(def, expected)}{def.unit}
                  </span>
                </div>
              )}
              {staged && target != null && (
                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                  <span className="text-[11px] font-bold text-ink2">Heading for</span>
                  <span className="text-[12px] font-black text-ink">{fmtAmount(target)} mL/day</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2" style={{ animationDelay: "300ms" }}>
              It's on your reminders, so it'll appear when it's due. Don't change the dose again before
              then — the reading is only meaningful if this dose has run undisturbed.
            </p>

            <button onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
              style={{ background: tone, animationDelay: "450ms" }}>
              Done
            </button>
            <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
              <span className="text-[10px] font-bold text-ink2">
                {held ? "Staying open — tap Done when you're finished" : `Closes in ${left}s · tap to keep open`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* DoseAdviceRow lived here. It was the dose UI before the Dosing Wizard, and
   the wizard renders AlkAssessmentBlock directly, so nothing referenced it any
   more — an old screen kept alive only by being defined. */

/* A function declaration rather than a const arrow: buildBriefing calls this
   and is defined earlier in the file, so it has to hoist. */
/* The stable identity of a finding, used by every surface that can dismiss
   one. Previously the parameter modal and Insights keyed on id+title while the
   summary keyed on id alone, so the same finding had two identities and
   dismissing it in one place left it showing in the other. */
function findingKey(f) {
  return "finding|" + f.id;
}

/* What has to hold for that dismissal to stay in force. The title carries the
   severity wording and, for urgent findings, the reading itself — so a worse
   number brings it straight back. */
function findingSignature(f) {
  return f.severity === "act" && f.value != null
    ? `${f.id}|${f.title}|${f.value}`
    : `${f.id}|${f.title}`;
}

/* Shared by every surface: is this finding currently put away? */
function findingHidden(f, dismissed) {
  const e = (dismissed || {})[findingKey(f)];
  if (e == null) return false;
  const sig = e && typeof e === "object" ? e.sig : null;
  /* A bare date is the old format and lapses rather than sticking forever. */
  return sig != null && sig === findingSignature(f);
}

function FindingList({ items, compact = false, onDismiss = null }) {
  if (!items || !items.length) return null;
  const tone = (sev) => (sev === "act" ? "#C4285B" : sev === "watch" ? "#D98324" : "#45605F");
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((f) => (
        <div key={f.id} className="rounded-lg p-2.5" style={{ background: tone(f.severity) + "10", border: `1px solid ${tone(f.severity)}30` }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(f.severity) }} />
            <span className="text-[11px] font-extrabold uppercase tracking-wide flex-1" style={{ color: tone(f.severity) }}>
              {f.title}
            </span>
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">{f.detail}</p>
          {onDismiss && (
            <div className="flex justify-end mt-1.5">
              <button onClick={() => onDismiss(f)}
                className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-md"
                style={{ color: tone(f.severity), background: tone(f.severity) + "14" }}>
                Got it — hide this
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* A small badge for dashboard cards, so a card looks as interesting as it is. */
/* An icon per parameter, so a card is recognisable before it is read. Reusing
   the icon set already imported keeps the weight and stroke consistent with
   the rest of the app. */
const PARAM_ICON = {
  alkalinity: Waves, salinity: Droplets, calcium: Scale, magnesium: Gauge,
  potassium: Target, phosphate: Beaker, nitrate: FlaskConical,
  ammonia: AlertTriangle, ph: Activity,
};

/* A short trace of where the parameter has been. It replaces a second bar with
   something that carries more information in the same space. */
function MicroSpark({ rows, def, colour }) {
  if (!rows || rows.length < 3) return <div style={{ height: 20 }} />;
  const W = 100, H = 20, P = 2;
  const vals = rows.map((r) => r.value);
  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
  const span = (hi - lo) || 1;
  const x = (i) => (i / (rows.length - 1)) * W;
  const y = (v) => H - P - ((v - lo) / span) * (H - P * 2);
  const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
  const bandTop = y(def.max), bandBot = y(def.min);
  const last = [x(rows.length - 1), y(rows[rows.length - 1].value)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 20 }}>
      <rect x="0" y={Math.min(bandTop, bandBot)} width={W}
        height={Math.max(1, Math.abs(bandBot - bandTop))} fill={colour} opacity="0.10" />
      <path d={d} fill="none" stroke={colour} strokeWidth="1.6" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.75" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={colour} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ParamCard({ def, reading, recent, stab, findings, rows, onOpen, onLog = null, dose = null }) {
  const status = reading ? paramStatus(def, reading.value) : "unknown";
  const tone = STATUS_COLOR[status] || "#45605F";
  const Icon = PARAM_ICON[def.key] || Beaker;
  const notes = findings || [];
  const worst = notes[0];

  /* Direction since the previous reading, shown as a glyph rather than a
     sentence — enough to tell a rising tank from a falling one at a glance. */
  const prev = rows && rows.length >= 2 ? rows[rows.length - 2].value : null;
  const delta = reading && prev != null ? reading.value - prev : null;
  const moved = delta != null && Math.abs(delta) >= (def.step || 0.01);

  return (
    <div className="relative h-full">
      <button onClick={onOpen} className="text-left h-full w-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all cursor-pointer"
        style={{ borderColor: status === "ok" ? undefined : tone + "55" }}>

        {/* A tinted cap in the parameter's own colour, which is what makes the
            grid scannable rather than eight identical white boxes. */}
        <div className="flex items-center gap-1.5 px-3 py-2"
          style={{ background: def.color + "14" }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "26" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[12px] font-black truncate flex-1 min-w-0" style={{ color: "#08191D" }}>
            {def.label}
          </span>
          {moved && (
            <span className="shrink-0" style={{ color: tone, opacity: 0.8 }}>
              {delta > 0 ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
            </span>
          )}
          {/* Sits in the header row rather than floating over the card, so it
              cannot land on top of the trend arrow. Nested inside the card's
              own button, so it stops the event to log rather than open. */}
          {onLog && (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLog(def.key); }}
              aria-label={`Log a ${def.label.toLowerCase()} reading`}
              className="shrink-0 rounded-md flex items-center justify-center cursor-pointer"
              style={{ width: 18, height: 18, background: def.color + "26", color: def.color }}>
              <Plus size={11} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="px-3 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-[24px] leading-none tabular-nums" style={{ color: tone }}>
              {reading ? fmtVal(def, reading.value) : "\u2014"}
            </span>
            <span className="text-[10px] font-bold text-ink2">{def.unit}</span>
          </div>

          <ParamGauge def={def} value={reading ? reading.value : null} recent={recent} compact />

          <MicroSpark rows={rows} def={def} colour={def.color} />

          <div className="flex items-center justify-between gap-1 mt-auto pt-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
              style={{ color: stab ? STABILITY_COLOR[stab.grade] || "#45605F" : "#8AA0A0" }}>
              {stab ? stab.label : "\u2014"}
            </span>
            <span className="text-[9px] font-bold text-ink2 shrink-0">
              {reading ? fmtShort(reading.date) : ""}
            </span>
          </div>

          {dose && dose.state !== "idle" && (
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
              style={{ background: dose.tone + "14" }}>
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: dose.tone }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
                style={{ color: dose.tone }}>
                {dose.short}
              </span>
            </div>
          )}

          {worst && (
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
              style={{ background: (worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#D98324" : "#45605F") + "14" }}>
              <span className="w-1 h-1 rounded-full shrink-0"
                style={{ background: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#D98324" : "#45605F" }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
                style={{ color: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#D98324" : "#45605F" }}>
                {notes.length > 1 ? `${notes.length} notes` : worst.title}
              </span>
            </div>
          )}
        </div>
      </Card>
      </button>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">{eyebrow}</div>}
        <h2 className="text-2xl font-display text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const styles = {
    primary: "bg-teal-brand text-white hover:brightness-110 font-bold shadow-sm",
    ghost: "bg-white border-2 border-app text-ink hover:border-teal-brand font-bold",
    danger: "bg-transparent text-rose-700 hover:bg-rose-50 font-bold",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-3.5 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-xs font-bold text-ink2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full min-w-0 max-w-full bg-white border-2 border-app rounded-lg px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink2/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand";

/* ---------------------------------- zoomable / pannable chart ---------------------------------- */


/* --- Axis scaling ---
 *
 * Padding a domain by a percentage produces values like 8.591999999999999,
 * and a numeric domain is printed verbatim by the chart library — which is
 * where the long strings of 9s on the y-axis came from. Snap the bounds to a
 * round step instead, and format every tick to a sensible number of decimals.
 */
function niceAxis(min, max, padFrac = 0.18) {
  if (!isFinite(min) || !isFinite(max)) return { domain: [0, 1], ticks: undefined, format: (v) => v };
  if (min === max) {
    /* A flat line still needs a range. For an all-zero trace element, expand
       upward only — a negative concentration axis is meaningless. */
    if (min === 0) { max = 1; }
    else { const w = Math.abs(min) * 0.05; min -= w; max += w; }
  }

  const span = (max - min) * (1 + padFrac * 2);
  // Choose a step that gives roughly 4-6 gridlines at a human-friendly size.
  const rawStep = span / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  /* 1/2/5/10 only. Allowing 2.5 produced ticks like 8.00, 8.03, 8.05, 8.07
     where the printed gaps look uneven once rounded. */
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;

  let lo = Math.floor((min - (max - min) * padFrac) / step) * step;
  const hi = Math.ceil((max + (max - min) * padFrac) / step) * step;
  /* Concentrations can't be negative, so don't scale below zero just to make
     room — an all-zero trace element was drawing a -0.10 gridline. */
  if (min >= 0 && lo < 0) lo = 0;

  // Decimals needed to express the step exactly, capped for readability.
  const decimals = Math.min(6, Math.max(0, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0)));

  const ticks = [];
  for (let v = lo; v <= hi + step / 1000; v += step) {
    ticks.push(+(Math.round(v / step) * step).toFixed(10));
  }
  /* Axis ticks are snapped to the step so gridline labels read cleanly. */
  const format = (v) => {
    if (v == null || isNaN(v)) return "";
    const r = +(Math.round(v / step) * step).toFixed(10);
    return decimals > 0 ? r.toFixed(decimals) : String(r);
  };

  /* Data values must NOT be snapped — doing so displayed a reading of 9.3 as
     9.5, because 9.3 is nearer the 9.5 gridline than the 9.0 one. Show the
     actual number, trimmed only of floating-point noise. */
  const formatValue = (v) => {
    if (v == null || isNaN(v)) return "";
    const a = Math.abs(v);
    const dp = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    return String(+v.toFixed(dp));
  };

  /* Trim floating-point noise off the bounds themselves: repeated multiplication
     produced domains like 0.30000000000000004. */
  const clean = (v) => +v.toFixed(10);
  return { domain: [clean(lo), clean(hi)], ticks, format, formatValue, step, decimals };
}

function ZoomableLineChart({ data, color, targetMin, targetMax, height = 280, events = [] }) {
  const containerRef = useRef(null);
  const [range, setRange] = useState({ start: 0, end: 1 });
  const gestureRef = useRef(null);
  const lastTapRef = useRef(0);

  const total = data.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const clampRange = (start, end) => {
      if (start < 0) { end -= start; start = 0; }
      if (end > 1) { start -= (end - 1); end = 1; }
      return { start: Math.max(0, start), end: Math.min(1, end) };
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        gestureRef.current = { mode: "pinch", startDist: dist(e.touches), startRange: { ...range } };
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setRange({ start: 0, end: 1 });
          gestureRef.current = null;
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...range } };
      }
    };

    const onTouchMove = (e) => {
      if (!gestureRef.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (gestureRef.current.mode === "pinch" && e.touches.length === 2) {
        const newDist = dist(e.touches);
        const scale = newDist / gestureRef.current.startDist;
        const { start, end } = gestureRef.current.startRange;
        const span = end - start;
        const center = start + span / 2;
        let newSpan = Math.max(0.04, Math.min(1, span / scale));
        setRange(clampRange(center - newSpan / 2, center + newSpan / 2));
      } else if (gestureRef.current.mode === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - gestureRef.current.startX;
        const { start, end } = gestureRef.current.startRange;
        const span = end - start;
        const deltaFrac = -(dx / rect.width) * span;
        setRange(clampRange(start + deltaFrac, end + deltaFrac));
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) gestureRef.current = null;
      else if (e.touches.length === 1) {
        gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...range } };
      }
    };

    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const scale = e.deltaY < 0 ? 1.15 : 0.87;
      setRange((r) => {
        const span = r.end - r.start;
        const center = r.start + span / 2;
        const newSpan = Math.max(0.04, Math.min(1, span / scale));
        return clampRange(center - newSpan / 2, center + newSpan / 2);
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [range]);

  const startIdx = total > 0 ? Math.max(0, Math.floor(range.start * (total - 1))) : 0;
  const endIdx = total > 0 ? Math.min(total - 1, Math.ceil(range.end * (total - 1))) : 0;
  const visible = total > 0 ? data.slice(startIdx, endIdx + 1) : [];
  const isZoomed = range.start > 0.001 || range.end < 0.999;

  const values = visible.map((d) => d.value);
  /* Include the target band in the scale so the shaded area is never clipped. */
  const scaleVals = values.slice();
  if (targetMin != null) scaleVals.push(targetMin);
  if (targetMax != null) scaleVals.push(targetMax);
  const axis = niceAxis(
    scaleVals.length ? Math.min(...scaleVals) : 0,
    scaleVals.length ? Math.max(...scaleVals) : 1);

  /* Snap each event to the nearest visible reading so the marker lands on a
     real x-axis category, then drop any that fall outside the zoom window. */
  const visibleEvents = useMemo(() => {
    if (!events.length || !visible.length) return [];
    const out = [];
    const seen = new Set();
    for (const ev of events) {
      let best = null, bestGap = Infinity;
      for (const d of visible) {
        const gap = Math.abs(daysBetween(d.date, ev.date));
        if (gap < bestGap) { bestGap = gap; best = d; }
      }
      if (best && bestGap <= 4) {
        const k = best.label + ev.icon;
        if (!seen.has(k)) { seen.add(k); out.push({ ...ev, label: best.label }); }
      }
    }
    return out.slice(0, 25);
  }, [events, visible]);

  return (
    <div>
      <div ref={containerRef} style={{ height, touchAction: "none" }} className="select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#E3ECEA" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#5C7876" fontSize={11} fontWeight={600} minTickGap={24} />
            <YAxis stroke="#5C7876" fontSize={11} fontWeight={600} domain={axis.domain} ticks={axis.ticks} tickFormatter={axis.format} width={46} />
            {targetMin != null && <ReferenceArea y1={targetMin} y2={targetMax} fill={color} fillOpacity={0.10} />}
            {visibleEvents.map((ev, i) => (
              <ReferenceLine key={i} x={ev.label} stroke={ev.color} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: ev.icon, position: "top", fontSize: 11, fill: ev.color }} />
            ))}
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#08191D" }}
              formatter={(v) => axis.formatValue(v)} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.75} dot={visible.length < 50} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Legend: the dashed markers were unlabelled, so a line on the chart
          gave no clue what it represented. Only kinds actually present are
          listed, so it stays out of the way on a chart with no events. */}
      {(() => {
        const kinds = [];
        const seen = new Set();
        for (const ev of visibleEvents) {
          if (seen.has(ev.kind)) continue;
          seen.add(ev.kind);
          kinds.push({ kind: ev.kind, color: ev.color, icon: ev.icon });
        }
        const hasBand = targetMin != null && targetMax != null;
        if (!kinds.length && !hasBand) return null;
        return (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
            {hasBand && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: color, opacity: 0.18 }} />
                <span className="text-[10px] font-bold text-ink2">target range</span>
              </span>
            )}
            {kinds.map((k) => (
              <span key={k.kind} className="flex items-center gap-1.5">
                <span className="inline-block" style={{ color: k.color, fontSize: 11, lineHeight: 1 }}>{k.icon}</span>
                <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: k.color }} />
                <span className="text-[10px] font-bold text-ink2">
                  {k.kind === "Dose" ? "dose change" : k.kind === "Lighting" ? "lighting change" : k.kind.toLowerCase()}
                </span>
              </span>
            ))}
          </div>
        );
      })()}

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-ink2 font-semibold">Pinch to zoom · drag to pan · double-tap to reset</span>
        {isZoomed && (
          <button onClick={() => setRange({ start: 0, end: 1 })} className="text-[11px] font-bold text-teal-brand flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}




/* --- Safe rate of change ---
 *
 * Every correction so far has been capped in millilitres — a percentage of the
 * calculated change, staged over days. That protects against a wrong estimate
 * but says nothing about what the tank actually experiences. On a small volume
 * a modest millilitre change is a large daily swing, and the swing is what
 * harms corals: tissue recession follows rapid movement even when it is
 * heading toward a better number.
 *
 * The hobby consensus is a hard ceiling near 1.4 dKH a day with most keepers
 * staying under 0.5, so 0.5 is used as the working limit and the tighter of
 * the two constraints wins. Calcium and magnesium are scaled from it through
 * the stoichiometry of calcification, which is what ties them together.
 */
const SAFE_DAILY_RISE = {
  alkalinity: 0.5,      /* dKH per day */
  calcium: 3.5,         /* ppm per day — 0.5 dKH x ~7 ppm Ca per dKH */
  magnesium: 15,        /* ppm per day — slow parameter, slow correction */
};

/* The safe band around the maintenance dose.
 *
 * The anchor has to be the maintenance dose — the dose that holds the level
 * exactly steady — because any surplus or shortfall against it is what moves
 * the tank. Anchoring on measured consumption instead was wrong: consumption
 * is derived as supplied minus trend, so a tank merely drifting upward reports
 * a small or negative consumption, the ceiling collapsed toward zero, the dose
 * was clamped down, alkalinity then fell, and the next assessment swung it back.
 * In simulation that oscillation spiked 105 tanks and crashed 29.
 */
function safeDoseBand(element, maintenanceDose, effectPerMl) {
  const limit = SAFE_DAILY_RISE[element];
  if (!limit || !isFinite(maintenanceDose) || !isFinite(effectPerMl) || effectPerMl <= 0) return null;
  const swing = limit / effectPerMl;
  return { lo: Math.max(0, maintenanceDose - swing), hi: maintenanceDose + swing, limit };
}

/* --- Alkalinity dosing assessment ---
 *
 * Built to a written protocol rather than assembled from heuristics. The
 * ordering of the steps below mirrors that protocol deliberately, because the
 * order is what stops the engine reacting to a number without first asking
 * whether the number should be trusted.
 *
 * Three ideas do most of the work:
 *
 *  - Elapsed time comes from timestamps, never from counting readings. Three
 *    measurements span two days, not three.
 *  - A dose change starts a new assessment period. Readings from before it
 *    describe a tank that no longer exists, so they are not mixed in.
 *  - The calculated maintenance dose and the recommended next dose are
 *    different numbers. The first is arithmetic; the second accounts for
 *    uncertainty and moves in steps a tank can absorb.
 */

const ALK_TREND = {
  stable: 0.10,        /* dKH/day — below this, treat as noise */
  mild: 0.20,
  meaningful: 0.30,    /* at or above this in ~24h, act early */
};

/* Hours the new dose must run before a routine reassessment. */
const ALK_SETTLE_HOURS = 48;
const ALK_EARLY_HOURS = 24;

/* Precise position in days, including time of day. */
const STAMP_CACHE = new Map();
function alkStamp(r) {
  if (!r || !r.date) return 0;
  const key = r.date + "|" + (r.time || "");
  const hit = STAMP_CACHE.get(key);
  if (hit !== undefined) return hit;
  const mins = minutesOf(r.time);
  const v = dayNum(r.date) + (mins == null ? 0.5 : mins / 1440);
  if (STAMP_CACHE.size < 40000) STAMP_CACHE.set(key, v);
  return v;
}

/* How much alkalinity one millilitre of the solution adds to this tank.
   Configurable, and recalculated whenever volume or concentration changes. */
/* Solve for the real effect-per-mL from the tank's response to dose changes.
 *
 * Across two periods under different doses, consumption is assumed roughly
 * constant, so:
 *     s1 = D1*k - C     and     s2 = D2*k - C
 *     k  = (s1 - s2) / (D1 - D2)
 * where s is the measured slope and D the dose. Consumption cancels, which is
 * why this works without knowing it. */
function solveAlkEffect(readings, doseLog, waterChanges, settings) {
  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === "alkalinity" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (changes.length < 1) return { status: "nochanges" };

  const all = (readings || [])
    .filter((r) => r.param === "alkalinity" && isFinite(r.value))
    .sort((a, b) => alkStamp(a) - alkStamp(b));

  /* Periods of constant dose, bounded by changes and by anything that moves
     alkalinity independently. */
  const disturbances = [...(waterChanges || []), ...(settings && settings._corrections || [])]
    .map((x) => alkStamp(x));
  const bounds = [];
  for (let i = 0; i < changes.length; i++) {
    const from = alkStamp(changes[i]);
    const to = i + 1 < changes.length ? alkStamp(changes[i + 1]) : Infinity;
    bounds.push({ from, to, dose: changes[i].ml });
  }
  const first = changes[0];
  const priorDose = Number(settings && settings.dailyDoseMl);
  if (isFinite(priorDose) && priorDose !== first.ml) {
    bounds.unshift({ from: -Infinity, to: alkStamp(first), dose: priorDose });
  }

  const periods = [];
  for (const b of bounds) {
    const rows = all.filter((r) => {
      const t = alkStamp(r);
      if (t < b.from || t >= b.to) return false;
      return !disturbances.some((d) => d > b.from && d <= t);
    });
    if (rows.length < 3) continue;
    const span = alkStamp(rows[rows.length - 1]) - alkStamp(rows[0]);
    if (span < 1.5) continue;
    const f = alkFit(rows);
    if (!f) continue;
    periods.push({ dose: b.dose, slope: f.slope, n: rows.length, span, rmse: f.rmse });
  }
  if (periods.length < 2) return { status: "needmore", periods: periods.length };

  /* Every usable pair, weighted toward the larger dose separations, which
     resolve k better. */
  const ests = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const dD = periods[i].dose - periods[j].dose;
      if (Math.abs(dD) < 1) continue;
      const k = (periods[i].slope - periods[j].slope) / dD;
      if (!isFinite(k) || k <= 0) continue;
      ests.push({ k, weight: Math.abs(dD) });
    }
  }
  if (!ests.length) return { status: "nospread", periods: periods.length };

  const wsum = ests.reduce((a, e) => a + e.weight, 0);
  const k = ests.reduce((a, e) => a + e.k * e.weight, 0) / wsum;
  const spread = ests.length > 1
    ? Math.sqrt(ests.reduce((a, e) => a + (e.k - k) ** 2, 0) / (ests.length - 1))
    : null;

  const entered = alkEffectPerMl(settings);
  return {
    status: "ok", k, spread, pairs: ests.length, periods: periods.length,
    entered,
    pctOff: entered ? ((k - entered) / entered) * 100 : null,
    /* The figure to type into Setup, expressed the way Setup asks for it. */
    suggestedPer100L: settings && settings.volumeL
      ? Math.round((k * settings.volumeL / 100) * 10000) / 10000 : null,
  };
}

function alkEffectPerMl(settings) {
  const per100 = Number(settings && settings.dkhPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

/* Least-squares slope in dKH per day, with the residual spread that says how
   much to trust it. */
function alkFit(rows) {
  const n = rows.length;
  if (n < 2) return null;
  const xs = rows.map(alkStamp), ys = rows.map((r) => r.value);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const pred = my + slope * (xs[i] - mx);
    ss += (ys[i] - pred) ** 2;
  }
  const rmse = n > 2 ? Math.sqrt(ss / (n - 2)) : 0;
  return { slope, rmse, spanDays: xs[xs.length - 1] - xs[0] };
}

/* Each consecutive pair, so a consistent decline can be told from two
   movements that happen to average out. */
function alkIntervals(rows) {
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const days = alkStamp(rows[i]) - alkStamp(rows[i - 1]);
    if (days <= 0) continue;
    out.push({
      from: rows[i - 1], to: rows[i], days,
      change: rows[i].value - rows[i - 1].value,
      perDay: (rows[i].value - rows[i - 1].value) / days,
    });
  }
  return out;
}

function alkBandOf(perDay) {
  const a = Math.abs(perDay);
  if (a < ALK_TREND.stable) return "stable";
  if (a < ALK_TREND.mild) return "mild";
  if (a < ALK_TREND.meaningful) return "meaningful";
  return "significant";
}

/* A reading that contradicts everything around it should be re-tested rather
   than acted on. Flagged, never silently discarded. */
function alkAnomaly(rows, fit, floor = 0.45) {
  /* Four readings, so the expectation is drawn from at least three points.
     Extrapolating from two and calling the third an anomaly flagged ordinary
     noise as a testing error. `floor` is the smallest deviation worth calling
     odd, and must be in the parameter's own units — a threshold of 0.45 is
     meaningful for dKH and meaningless for ppm. */
  if (rows.length < 4 || !fit) return null;
  const last = rows[rows.length - 1];
  const prior = rows.slice(0, -1);
  const pf = alkFit(prior);
  if (!pf) return null;
  const expected = prior[prior.length - 1].value
    + pf.slope * (alkStamp(last) - alkStamp(prior[prior.length - 1]));
  const residual = last.value - expected;
  const scale = Math.max(floor / 3, pf.rmse * 3);
  if (Math.abs(residual) < Math.max(floor, scale)) return null;

  /* A value the series has already produced cannot be out of character with
     it. Readings of 1520, 1560, 1560, 1560, 1520 were being flagged because a
     line through the first four slopes upward — driven entirely by the first
     point sitting low — and extrapolating it predicted 1582. The final 1520
     then looked 62 adrift, despite being identical to a reading in the same
     set. Comparing against the range the series actually occupies avoids
     trusting an extrapolation further than the data supports. */
  const prev = prior.map((r) => r.value);
  const lo = Math.min(...prev), hi = Math.max(...prev);
  const margin = Math.max(floor / 4, (hi - lo) * 0.25);
  if (last.value >= lo - margin && last.value <= hi + margin) return null;
  return { value: last.value, expected, residual, date: last.date, time: last.time };
}


/* Consistency of direction, ignoring movements too small to be real.
 *
 * Strict sign agreement treats a single sub-resolution wobble as the series
 * contradicting itself: readings of 9.2, 9.3, 9.0, 8.7 give intervals of
 * +0.1, -0.3, -0.3, and calling that "scattered" because of a 0.1 step means a
 * clear decline gets damped down to "re-test". `flat` is the movement below
 * which an interval carries no direction at all. */
function directionConsistent(intervals, flat) {
  if (!intervals || intervals.length < 2) return null;
  const dirs = intervals
    .map((iv) => (Math.abs(iv.change) <= flat ? 0 : (iv.change > 0 ? 1 : -1)))
    .filter((d) => d !== 0);
  if (dirs.length < 2) return true;
  return dirs.every((d) => d === dirs[0]);
}

function assessAlkalinity({ readings, doseLog = [], waterChanges = [], settings, def,
                            now = null, plan = null, corrections = [] }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null,
    current: null, target: null, currentDose: null, hoursOnDose: null,
    used: [], trendPerDay: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, events: [], effectPerMl: null,
    /* A staged correction spans days, so the destination has to survive between
       sessions. Without it the app would recompute a fresh plan each time and
       forget it was already partway through one. */
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
  };

  /* A plan is live while the dose it set is still the current one. */
  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan;
    out.planTarget = plan.target;
    out.stage = plan.stage;
    out.stages = plan.stages;
    out.nextTestDue = plan.nextTestAt || null;
  }

  const effect = alkEffectPerMl(settings);
  out.effectPerMl = effect;
  /* Every figure below rests on this number, so how well it is known is part
     of the answer rather than a footnote. */
  out.effectSolved = solveAlkEffect(readings, doseLog, waterChanges,
    { ...settings, _corrections: corrections });
  if (!effect) {
    out.reason = "Set your tank volume and alkalinity solution strength in Setup before this can be calculated.";
    return out;
  }

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const alkFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "alkalinity" && isFinite(r.value) && alkStamp(r) >= alkFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) {
    out.reason = "No alkalinity readings yet.";
    return out;
  }
  out.current = all[all.length - 1];
  out.target = { min: def.min, max: def.max };

  /* Step 2 — has the dose changed? Everything before the most recent change
     describes the tank under a dose it is no longer receiving. */
  const changes = (doseLog || [])
    .filter((d) => (d.element || "alkalinity") === "alkalinity" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.dailyDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily alkalinity dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.hoursOnDose = lastChange ? (nowStamp - windowStart) * 24 : null;

  /* Step 3 — confounding events.
     Water changes are deliberately NOT among them. A routine change of a tenth
     of the volume shifts alkalinity by about as much as the test can resolve,
     while restarting the window every week left the assessment with a single
     reading to work from — which is why it answered "hold" on tanks that were
     visibly draining. A manual correction is different: large, deliberate, and
     known exactly, so it is subtracted from the readings further down rather
     than throwing the window away. */
  const eventStamps = [];
  const corrList = (corrections || [])
    .filter((c) => (c.element || "alkalinity") === "alkalinity" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastEvent = eventStamps.length
    ? eventStamps.reduce((a, b) => (a.stamp > b.stamp ? a : b)) : null;
  out.events = eventStamps;

  const cutoff = Math.max(windowStart, lastEvent ? lastEvent.stamp : -Infinity);
  /* Step 26 — recent data under the same dose. Two to four days is the working
     window; older readings give context but must not dilute a new trend. */
  /* Four days is the working window when testing daily, per the protocol. But
     someone testing every third day has only two readings in that span, and a
     slow drift can then never be confirmed — it simply persists uncorrected.
     The protocol also says to use all relevant recent measurements under the
     same dose, so the window widens to gather at least four readings, and only
     ever within the current dose period. */
  const horizon = nowStamp - 4;
  let used = all.filter((r) => alkStamp(r) >= cutoff && alkStamp(r) >= horizon);
  /* Widening was added so that someone testing every third day could still
     confirm a slow drift. But it must not reach back over a settled period and
     average out a clear recent trend — three readings over two days showing a
     steady decline is exactly the evidence section 26 says to act on, and
     pulling in the flat week before it cancels the signal entirely. So the
     window only widens when the recent one genuinely cannot support a trend. */
  if (used.length < 3) {
    const wider = all.filter((r) => alkStamp(r) >= cutoff && alkStamp(r) >= nowStamp - 12);
    if (wider.length > used.length) used = wider.slice(-6);
  }
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= cutoff).slice(-4);

  /* The protocol asks for alkalinity to be recorded at the time of the change
     and used as the Day-0 anchor. Without it the first day after a change has
     one point and nothing to compare it against — the assessment would sit
     idle for a day longer than it needs to. */
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < cutoff && (cutoff - alkStamp(r)) <= 0.5)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Subtract what a logged correction put in, spread over the three days it is
     delivered across. What remains is the tank's own behaviour, which is what
     the dose has to match — otherwise the lift shows up as reduced consumption
     and the engine cuts a dose that was correct. */
  const CORRECTION_DAYS = 3;
  const correctionAddedBy = (stamp) => corrList.reduce((sum, c) => {
    const t = alkStamp(c);
    if (stamp <= t) return sum;
    const frac = Math.min(1, (stamp - t) / CORRECTION_DAYS);
    return sum + c.ml * effect * frac;
  }, 0);
  if (corrList.length) {
    const anchor = used.length ? correctionAddedBy(alkStamp(used[0])) : 0;
    out.usedRaw = used;
    used = used.map((r) => ({ ...r, value: r.value - (correctionAddedBy(alkStamp(r)) - anchor) }));
    out.correctionAdjusted = corrList.some((c) => used.length
      && alkStamp(c) >= alkStamp(used[0]) - CORRECTION_DAYS);
  }

  const spanDays = used.length >= 2 ? alkStamp(used[used.length - 1]) - alkStamp(used[0]) : 0;
  /* Step 5 — enough evidence? */
  if (used.length < 2 || spanDays <= 0) {
    out.reason = lastChange
      ? `Only ${used.length} reading${used.length === 1 ? "" : "s"} since the dose changed. Hold the current dose and test again.`
      : "At least two readings are needed to see a trend. Hold the current dose and test again.";
    out.nextCheck = "Test again tomorrow, ideally at a similar time of day.";
    return out;
  }

  out.used = out.usedRaw || used;
  const anomalyRows = used;
  const fit = alkFit(used);
  const intervals = alkIntervals(used);
  const trend = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerDay = trend;

  /* Where alkalinity sits, judged from the fitted line rather than the last
     number: one low titration on a tank that has held 9.0 for a fortnight is a
     test result, not a tank at 8.2. */
  const fittedNow = (fit && used.length >= 3)
    ? used.reduce((a, r) => a + r.value, 0) / used.length
      + fit.slope * (alkStamp(used[used.length - 1])
        - used.reduce((a, r) => a + alkStamp(r), 0) / used.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  const inRange = fittedNow >= def.min && fittedNow <= def.max;
  const above = fittedNow > def.max;
  const below = fittedNow < def.min;
  out.band = alkBandOf(trend);
  out.anomaly = alkAnomaly(used, fit);

  /* A trend is consistent when every interval points the same way. Two
     movements that cancel out are not the same as a steady decline. */
  /* One kit step is the smallest movement worth calling a direction. */
  out.consistent = directionConsistent(intervals, (def.step || 0.1) * 1.5);

  /* Requiring every interval to point the same way is a strict test that kit
     noise defeats easily: a genuine 0.15 dKH/day drift measured to ±0.05 will
     show one interval going the other way sooner or later, and the engine would
     then never confirm it. So a trend also counts as confirmed when the fitted
     slope is far enough from zero relative to its own scatter — which is what
     "more measurements are better" buys you. */
  const seSlope = (() => {
    if (!fit || used.length < 4 || !isFinite(fit.rmse)) return null;
    const xs = used.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  out.slopeSE = seSlope;
  out.confirmedByFit = seSlope != null && seSlope > 0
    && Math.abs(trend) > seSlope * 2.5 && spanDays >= 2;

  const lastInterval = intervals[intervals.length - 1];
  const bigMove = lastInterval && Math.abs(lastInterval.change) >= ALK_TREND.meaningful
    && lastInterval.days <= 1.5;

  /* Steps 9–11 — the arithmetic. */
  out.supplied = out.currentDose * effect;
  out.consumption = out.supplied - trend;
  out.maintenanceDose = out.consumption / effect;

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies. The formula then produces a negative maintenance dose,
     which is not a thing anyone can pour. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }

  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  const alkStrength = strengthPlausible("alkalinity", settings);
  if (!alkStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !alkStrength.ok
      ? `The alkalinity strength in Setup is ${alkStrength.value} ${alkStrength.unit}, which is outside anything a real product delivers (${alkStrength.lo}–${alkStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A soda-ash two-part is around 0.05.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }


  /* Step 22 — verify before acting on something that looks wrong. */
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Worth a second test if anything felt off — otherwise the working below takes it as read.`;
  }

  /* Steps 3 and 15 — a freshly changed dose needs time to show its effect. */
  /* The exception the protocols allow: already outside the band and still
     heading the wrong way is not a trend to be confirmed, it is a tank in
     trouble, and waiting out the settling period makes it worse. */
  const alkEmergency = lastChange
    && ((out.current.value < def.min && trend < 0) || (out.current.value > def.max && trend > 0))
    && Math.abs(trend) >= ALK_TREND.meaningful;

  if (!alkEmergency && lastChange && out.hoursOnDose != null && out.hoursOnDose < ALK_EARLY_HOURS) {
    out.reason = `The dose changed to ${fmtAmount(out.currentDose)} mL/day about ${Math.round(out.hoursOnDose)} hours ago. That is not long enough to judge it. Hold and test again.`;
    out.nextCheck = `Test again around ${Math.max(1, Math.round((ALK_EARLY_HOURS - out.hoursOnDose)))} hours from now.`;
    return out;
  }
  if (!alkEmergency && lastChange && out.hoursOnDose < ALK_SETTLE_HOURS) {
    if (bigMove) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `That is a large move so soon after a dose change — worth checking the doser is delivering what you set, rather than changing the dose again.`;
    }
    out.reason = `The dose changed to ${fmtAmount(out.currentDose)} mL/day about ${Math.round(out.hoursOnDose)} hours ago and alkalinity has moved ${fmtVal(def, Math.abs(lastInterval.change))}${def.unit} since — inside normal variation. Hold this dose and take one more reading before deciding.`;
    out.nextCheck = `Test again around ${Math.max(1, Math.round(ALK_SETTLE_HOURS - out.hoursOnDose))} hours from now.`;
    return out;
  }

  /* Step 4 — a large one-day movement is grounds for an early review, but the
     protocol asks for the reading to be checked first: a single interval is a
     single test, and acting on it without confirmation is how a mis-measured
     drop becomes a real overdose. */
  if (bigMove && intervals.length < 2) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is a large move for ${Math.round(lastInterval.days * 24)} hours and rests on a single interval — worth checking for a missed dose or a sample taken at an unusual hour.`;
  }

  /* Step 6 — do not react to small movements, unless alkalinity is already
     outside the band and still drifting further out. A trend below the noise
     floor still empties a tank given enough weeks. */
  const alkClearlyOut = above ? (fittedNow - def.max) > 0.2
    : below ? (def.min - fittedNow) > 0.2 : false;
  const alkRepeats = repeatedCorrections(corrections, "alkalinity", nowStamp);
  const alkWorsening = alkClearlyOut
    && (Math.abs(trend) >= ALK_TREND.stable || alkRepeats >= 2)
    && ((below && trend <= 0) || (above && trend >= 0));
  if (out.band === "stable" && !alkWorsening) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is moving ${fmtAmount(Math.abs(trend))} dKH a day, which is within normal test variation. Your current dose is matching consumption.`;
    out.nextCheck = "Keep testing on your usual schedule.";

    /* Steps 18–19 — holding steady is not the same as being right. A dose that
       exactly matches consumption will hold alkalinity wherever it happens to
       sit, including well outside the range. That needs a separate one-off
       correction, and must not be folded into the daily dose. */
    if (!inRange) {
      const gap = above ? out.current.value - def.max : def.min - out.current.value;
      const mid = (def.min + def.max) / 2;
      const toMid = Math.abs(mid - out.current.value);
      /* Additive only: nothing you can dose brings alkalinity down. */
      const oneOff = Math.round((toMid / effect) * 10) / 10;
      out.targetCorrection = !above
        ? {
            direction: "up", toMid,
            days: Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key])),
            ppmToRaise: Math.round(toMid * 100) / 100,
            ppmPerDay: Math.round((toMid / Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key]))) * 100) / 100,
            oneOffMl: oneOff,
            perDayMl: Math.round((SAFE_DAILY_RISE[def.key] / effect) * 10) / 10,
            /* Whether quoting the maintenance bottle is sensible at all: a lift
               this size is usually done with a stronger mix or the dry salt. */
            viaMaintenance: dosePlausible(oneOff / 5, settings),
          }
        : null;
      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, which is ${fmtAmount(gap)}${def.unit} ${above ? "above" : "below"} your range — a steady dose will keep it there indefinitely rather than bring it back.`;
      const repeats = repeatedCorrections(corrections, "alkalinity", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected alkalinity ${repeats} times in the last couple of months and it keeps sagging back. Something is pulling it down continuously — usually a salt mix below your target arriving with each water change — and the daily dose is what should answer that. Around ${fmtAmount(out.targetCorrection.perDayMl)} mL more a day would carry it instead of correcting again.`;
      }
      out.nextCheck = above
        ? `Bringing it down is a matter of letting it drift: reduce the dose temporarily, or leave it and let consumption pull it back, then restore this dose once it reaches the range.`
        : out.targetCorrection
        ? `Raising it back is a separate one-off correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL spread over two or three days — not a permanent increase, which would then push it past the range. Keep the daily dose where it is.`
        : `Raising it back needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }
  /* Step 8 — a trend whose intervals contradict each other is weaker evidence
     than its size suggests. Previously only mild trends were damped this way,
     so 9.3 / 8.8 / 9.0 / 8.5 — down, up, down — still produced a dose change.
     The average is real; the confidence is not. */
  if (out.consistent === false && intervals.length >= 2) {
    const swings = intervals.map((iv) => `${iv.perDay > 0 ? "+" : ""}${fmtAmount(iv.perDay)}`).join(", ");
    /* A large last movement inside an already scattered series is more likely
       to be another scattered reading than a new direction. Confirm it rather
       than dose against it. */
    if (bigMove) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `The intervals before this one were going in different directions (${swings} ${def.unit} a day), so the size of the last step is less certain than it looks.`;
      out.nextCheck = "Repeat the alkalinity test now, then judge from the pair.";
      return out;
    }
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `The overall trend is ${fmtAmount(Math.abs(trend))} dKH a day, but the individual intervals disagree: ${swings} dKH a day. A number that jumps around like that is usually test scatter rather than a real direction, and dosing against scatter makes a tank less stable, not more.`;
    out.nextCheck = "Two or three more readings at a consistent time of day will show whether there is a real trend underneath this.";
    return out;
  }

  if (out.band === "mild" && intervals.length < 2) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is drifting about ${fmtAmount(Math.abs(trend))} dKH a day, but ${intervals.length < 2 ? "over only one interval" : "the individual intervals disagree with each other"}. That is not yet firm enough to change the dose on.${used.length < 4 ? " A fourth reading would let the trend be judged on its overall shape rather than interval by interval." : ""}`;
    out.nextCheck = "One more reading will confirm whether this is a real trend.";
    return out;
  }
  /* A steep per-day rate extrapolated from a short gap is not the same as a
     confirmed daily movement. Half a day at 0.3 dKH/day is a 0.15 change —
     well inside test variation — so any adjustment needs either a real ~48h
     span or an actual movement of 0.30 dKH within about a day. */
  if ((out.band === "meaningful" || out.band === "significant") && spanDays < 1.5 && !bigMove) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is moving about ${fmtAmount(Math.abs(trend))} dKH a day, but that rate comes from only ${fmtAmount(spanDays)} days — an actual change of ${fmtVal(def, Math.abs(lastInterval.change))}${def.unit}, which is inside normal test variation.`;
    out.nextCheck = "Confirm it with a reading tomorrow, then adjust.";
    return out;
  }

  /* Steps 18–21 — trend control is not the same as target correction. */
  const movingToTarget = (above && trend < 0) || (below && trend > 0);
  if (movingToTarget && Math.abs(trend) <= ALK_TREND.meaningful) {
    out.ok = true;
    out.recommendedDose = out.currentDose;
    out.action = "hold";
    out.explanation = `Alkalinity is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${trend < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(trend))} dKH a day. That is the direction you want, so changing the dose now would work against it. Reassess once it reaches the range.`;
    out.nextCheck = `Recalculate once alkalinity is back inside ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`;
    return out;
  }

  /* Step 17 — size the correction. If a plan is already running and its
     destination still agrees with what the readings now say, keep walking it
     rather than inventing a new target every time. */
  const planLive = out.activePlan
    && Math.abs(out.activePlan.appliedDose - out.currentDose) < 0.05
    && Math.abs(out.activePlan.target - out.maintenanceDose) <= Math.max(1.5, out.activePlan.target * 0.2);
  out.continuingPlan = !!planLive;

  const rawChange = out.maintenanceDose - out.currentDose;
  const urgent = (below && trend < 0) || (above && trend > 0)
    || Math.abs(trend) >= ALK_TREND.meaningful * 1.5;
  let applied;
  const mag = Math.abs(rawChange);
  /* Already out of band and still heading away: staging is the wrong instinct
     here, because each held-back step costs another two days at a level the
     tank should not be at. Simulation showed tanks crashing while the engine
     politely corrected 70% at a time. */
  const rescue = alkEmergency
    || ((below && trend < 0) || (above && trend > 0));
  if (rescue) applied = rawChange;
  else if (mag <= 2) applied = rawChange;
  else if (mag <= 4) applied = rawChange * 0.9;
  else applied = urgent ? rawChange * 0.7 : rawChange * 0.55;

  let next = out.currentDose + applied;
  next = Math.max(0, Math.round(next * 10) / 10);

  out.ok = true;
  out.recommendedDose = next;
  out.action = next > out.currentDose ? "increase" : next < out.currentDose ? "decrease" : "hold";
  out.staged = mag > 4;

  /* A staged correction is a plan, not a single number. Spelling out the steps
     means the 48-hour wait between them is visible rather than something the
     user has to remember from the explanation. */
  if (out.staged) {
    const steps = [];
    let at = out.currentDose;
    let guard = 0;
    while (Math.abs(out.maintenanceDose - at) > 2 && guard++ < 5) {
      const remaining = out.maintenanceDose - at;
      const stepSize = Math.abs(remaining) > 4
        ? remaining * (urgent ? 0.7 : 0.55)
        : remaining;
      at = Math.round((at + stepSize) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) {
      steps.push(Math.round(out.maintenanceDose * 10) / 10);
    }
    out.plan = steps;
  }

  const dirWord = trend < 0 ? "falling" : "rising";
  /* How much the recommendation could be out, given how well the readings
     actually fit a straight line. A single figure implies a precision the data
     rarely supports. */
  if (fit && fit.rmse > 0 && spanDays > 0) {
    const slopeErr = fit.rmse / Math.max(0.5, spanDays / 2);
    out.doseUncertaintyMl = Math.round((slopeErr / effect) * 10) / 10;
  }

  out.explanation =
    `Alkalinity is ${dirWord} ${fmtAmount(Math.abs(trend))} dKH a day across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", consistently in every interval" : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)} dKH a day, so the tank is using about ${fmtAmount(out.consumption)} dKH a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged
      ? `, which is a large jump from ${fmtAmount(out.currentDose)}. Move part of the way first and re-check — a big correction is harder on corals than the drift itself.`
      : `.`)
    + (out.doseUncertaintyMl && out.doseUncertaintyMl >= 0.5
      ? ` Your readings scatter enough that this figure is only good to about ±${fmtAmount(out.doseUncertaintyMl)} mL, so treat it as a direction rather than a precise number.`
      : ``);
  out.nextCheck = `Hold the new dose for 48 hours, then test again. Two readings at a similar time of day will show whether it has settled.`;
  return out;
}

/* --- Calcium dosing assessment ---
 *
 * Same architecture as the alkalinity protocol, but calcium is a different
 * animal and the constants reflect that. Calcium moves slowly and test
 * uncertainty is a large fraction of a week's real movement, so the engine is
 * deliberately more reluctant: weekly intervals rather than daily, a seven-day
 * wait after any change rather than forty-eight hours, and a strong preference
 * for confirming a small trend over a second week before touching anything.
 *
 * Everything learned building the alkalinity engine is carried over: timestamps
 * rather than reading counts, a window that starts at the last dose change,
 * separate maintenance and recommended figures, staged corrections with a
 * remembered destination, one-off corrections accounted for mathematically
 * rather than resetting the window, anomaly detection before action, and an
 * empirical solver for the effect-per-mL that everything else rests on.
 */

const CA_TREND = {
  stable: 5,        /* ppm/week — below this, treat as test variation */
  small: 10,
  meaningful: 20,   /* at or above this, verify before acting */
};

const CA_SETTLE_DAYS = 7;

function caEffectPerMl(settings) {
  const per100 = Number(settings && settings.caPpmPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

/* Solve the real ppm-per-mL from the tank's response across dose periods.
   Consumption cancels between two periods, so it need not be known. */
function solveCaEffect(readings, doseLog, waterChanges, settings, corrections) {
  const changes = (doseLog || [])
    .filter((d) => d.element === "calcium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!changes.length) return { status: "nochanges" };

  const all = (readings || [])
    .filter((r) => r.param === "calcium" && isFinite(r.value))
    .sort((a, b) => alkStamp(a) - alkStamp(b));

  const disturbances = [...(waterChanges || []), ...(corrections || [])].map((x) => alkStamp(x));
  const bounds = [];
  for (let i = 0; i < changes.length; i++) {
    bounds.push({
      from: alkStamp(changes[i]),
      to: i + 1 < changes.length ? alkStamp(changes[i + 1]) : Infinity,
      dose: changes[i].ml,
    });
  }
  const priorDose = Number(settings && settings.calciumDoseMl);
  if (isFinite(priorDose) && priorDose !== changes[0].ml) {
    bounds.unshift({ from: -Infinity, to: alkStamp(changes[0]), dose: priorDose });
  }

  const periods = [];
  for (const b of bounds) {
    const rows = all.filter((r) => {
      const t = alkStamp(r);
      if (t < b.from || t >= b.to) return false;
      return !disturbances.some((d) => d > b.from && d <= t);
    });
    /* Calcium needs a fortnight to show a slope worth trusting. */
    if (rows.length < 3) continue;
    const span = alkStamp(rows[rows.length - 1]) - alkStamp(rows[0]);
    if (span < 12) continue;
    const f = alkFit(rows);
    if (!f) continue;
    periods.push({ dose: b.dose, slope: f.slope, n: rows.length, span });
  }
  if (periods.length < 2) return { status: "needmore", periods: periods.length };

  const ests = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const dD = periods[i].dose - periods[j].dose;
      if (Math.abs(dD) < 1) continue;
      const k = (periods[i].slope - periods[j].slope) / dD;
      if (!isFinite(k) || k <= 0) continue;
      ests.push({ k, weight: Math.abs(dD) });
    }
  }
  if (!ests.length) return { status: "nospread", periods: periods.length };
  const wsum = ests.reduce((a, e) => a + e.weight, 0);
  const k = ests.reduce((a, e) => a + e.k * e.weight, 0) / wsum;
  const entered = caEffectPerMl(settings);
  return {
    status: "ok", k, pairs: ests.length, periods: periods.length, entered,
    pctOff: entered ? ((k - entered) / entered) * 100 : null,
    suggestedPer100L: settings && settings.volumeL
      ? Math.round((k * settings.volumeL / 100) * 10000) / 10000 : null,
  };
}

function caBandOf(perWeek) {
  const a = Math.abs(perWeek);
  if (a < CA_TREND.stable) return "stable";
  if (a < CA_TREND.small) return "small";
  if (a < CA_TREND.meaningful) return "meaningful";
  return "significant";
}


/* Choose between a long context window and a shorter recent one.
 *
 * Both protocols say the same thing: older data gives context but must not
 * overpower a new sustained trend (calcium §36, magnesium §47). A month of
 * stability followed by a fortnight of steady decline averages out to a mild
 * drift, and the engine then holds while the tank empties. When the recent
 * window has enough readings of its own and shows a materially stronger trend,
 * it is the one that describes the tank now.
 */
function pickTrendWindow(rows, recentDays, nowStamp, minWeekly) {
  if (rows.length < 4) return { rows, narrowed: false };
  const recent = rows.filter((r) => alkStamp(r) >= nowStamp - recentDays);
  if (recent.length === rows.length) return { rows, narrowed: false };
  /* Two readings a week apart is enough for a clearly meaningful movement,
     which is what both protocols allow for a single strong weekly interval. */
  const span = recent.length >= 2
    ? alkStamp(recent[recent.length - 1]) - alkStamp(recent[0]) : 0;
  if (recent.length < 2 || span < 6) return { rows, narrowed: false };
  const fullFit = alkFit(rows), recentFit = alkFit(recent);
  if (!fullFit || !recentFit) return { rows, narrowed: false };
  /* Two conditions, both necessary. The recent window has to be materially
     steeper than the whole period — a third again — and steep enough to matter
     on its own. Without the second test, a flat series with one noisy last
     reading narrows to a "trend" that is pure test error, which is how this
     started recommending dose cuts on a stable tank. */
  const recentWeekly = Math.abs(recentFit.slope) * 7;
  if (recentWeekly >= minWeekly
      && Math.abs(recentFit.slope) > Math.abs(fullFit.slope) * 1.3) {
    return { rows: recent, narrowed: true, fullSlope: fullFit.slope };
  }
  return { rows, narrowed: false };
}

/* Corrections that keep recurring mean the maintenance dose is short.
   A tank lifted back into range that sags out again within weeks is not
   asking for another lift; something is pulling it down continuously, and the
   daily dose is the thing that should answer that. */
function repeatedCorrections(corrections, element, nowStamp, days = 70) {
  const recent = (corrections || [])
    .filter((c) => c.element === element && isFinite(c.ml) && c.ml > 0
      && alkStamp(c) >= nowStamp - days);
  return recent.length;
}

function assessCalcium({ readings, doseLog = [], waterChanges = [], settings, def,
                         now = null, plan = null, corrections = [] }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null, element: "calcium",
    current: null, previous: null, target: null, currentDose: null, daysOnDose: null,
    used: [], trendPerDay: null, trendPerWeek: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, events: [], effectPerMl: null, effectSolved: null,
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
    targetCorrection: null,
  };

  const effect = caEffectPerMl(settings);
  out.effectPerMl = effect;
  if (!effect) {
    out.reason = "Set your tank volume and calcium solution strength in Setup before this can be calculated.";
    return out;
  }
  out.effectSolved = solveCaEffect(readings, doseLog, waterChanges, settings, corrections);

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const caFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "calcium" && isFinite(r.value) && alkStamp(r) >= caFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) { out.reason = "No calcium readings yet."; return out; }
  out.current = all[all.length - 1];
  out.previous = all.length >= 2 ? all[all.length - 2] : null;
  out.target = { min: def.min, max: def.max };

  const changes = (doseLog || [])
    .filter((d) => d.element === "calcium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.calciumDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily calcium dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.daysOnDose = lastChange ? nowStamp - windowStart : null;

  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan; out.planTarget = plan.target;
    out.stage = plan.stage; out.stages = plan.stages; out.nextTestDue = plan.nextTestAt || null;
  }

  /* Sections 36 and 7: three to four weeks of context, but only within the
     current dose period. Calcium wants a longer view than alkalinity. */
  const horizon = nowStamp - 28;
  let used = all.filter((r) => alkStamp(r) >= windowStart && alkStamp(r) >= horizon);
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= windowStart).slice(-4);
  /* The reading at the moment of the change anchors the new period. */
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < windowStart && (windowStart - alkStamp(r)) <= 1)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Section 18: a water change moves calcium independently. Regular weekly
     changes of similar size are part of normal behaviour (section 19), so only
     an unusual one is called out. */
  /* Routine water changes are part of the tank's normal behaviour and are left
     in the trend rather than flagged — a regular tenth-volume change is already
     reflected in the consumption the dose has to match. */

  /* Section 20: a manual correction is deliberate, and its contribution is
     known exactly — so it is subtracted rather than used to reset the window. */
  const corrList = (corrections || [])
    .filter((c) => c.element === "calcium" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const CORRECTION_DAYS = 3;
  if (corrList.length && used.length) {
    const addedBy = (stamp) => corrList.reduce((sum, c) => {
      const t = alkStamp(c);
      if (stamp <= t) return sum;
      return sum + c.ml * effect * Math.min(1, (stamp - t) / CORRECTION_DAYS);
    }, 0);
    const anchor = addedBy(alkStamp(used[0]));
    out.usedAdjusted = used.map((r) => ({ ...r, value: r.value - (addedBy(alkStamp(r)) - anchor) }));
    out.correctionAdjusted = true;
  }
  let maths = out.usedAdjusted || used;
  /* Kept before any narrowing: the anomaly test needs the wider context. */
  const anomalyRows = maths;
  const caPick = pickTrendWindow(maths, 15, nowStamp, CA_TREND.small);
  if (caPick.narrowed) {
    maths = caPick.rows;
    out.narrowedWindow = true;
    out.fullWindowTrend = caPick.fullSlope * 7;
  }

  if (maths.length < 2) {
    out.reason = lastChange
      ? "Only one calcium reading since the dose changed. Hold and measure at the next weekly test."
      : "Two calcium readings are needed to see a trend. Hold the current dose and test again next week.";
    out.nextCheck = "Measure calcium at your next weekly test.";
    return out;
  }

  const spanDays = alkStamp(maths[maths.length - 1]) - alkStamp(maths[0]);
  if (spanDays <= 0) { out.reason = "Readings need to be on different days."; return out; }

  const fit = alkFit(maths);
  const intervals = alkIntervals(maths);
  out.trendPerDay = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerWeek = out.trendPerDay * 7;
  out.band = caBandOf(out.trendPerWeek);
  out.consistent = directionConsistent(intervals, CA_TREND.stable * 0.5);
  out.intervals = intervals.length;

  /* Confidence in the slope itself, as with alkalinity. With a calcium kit
     resolving to about ±10 ppm, a single week can easily show 15 ppm of
     movement that is not there — so a trend has to be either repeated across
     weeks or statistically clear of its own scatter before it is acted on. */
  out.slopeSE = (() => {
    if (!fit || maths.length < 3 || !isFinite(fit.rmse)) return null;
    const xs = maths.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  /* Three standard errors and three weeks: on weekly data a two-sigma test
     across a fortnight fires on noise often enough to matter. */
  /* Statistical clarity only earns a trend the right to act when the trend is
     large enough to be worth acting on. A tightly-measured 6 ppm a week is
     still 6 ppm a week, and section 27 says hold. */
  out.confirmedByFit = out.slopeSE != null && out.slopeSE > 0
    && maths.length >= 4
    && Math.abs(out.trendPerWeek) >= CA_TREND.small
    && Math.abs(out.trendPerDay) > out.slopeSE * 3 && spanDays >= 20;

  out.supplied = out.currentDose * effect;
  out.consumption = out.supplied - out.trendPerDay;
  out.maintenanceDose = out.consumption / effect;

  /* A reef takes up roughly half a ppm to a ppm and a half of magnesium a day.
     An apparent consumption far above that is not consumption — it is the
     level falling for some other reason, and the maintenance formula cannot
     tell the two apart. Capping it keeps the daily dose a maintenance figure
     and hands the rest to a correction, which is where it belongs. */
  /* A reef takes up around half a ppm to a ppm of magnesium a day; the top end
     of anything credible is about one. Above that the arithmetic is describing
     a level problem wearing consumption's clothes. */

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies — water changes with a richer salt will do it. The formula
     then produces a negative maintenance dose, which is not a thing anyone can
     pour, and the figure was being shown as "calculated maintenance −190 mL a
     day". Zero is the honest floor, with the situation named. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }
  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  out.anomaly = alkAnomaly(anomalyRows, alkFit(anomalyRows),
    Math.max(CA_TREND.meaningful * 2, (def.max - def.min) * 0.6));
  /* The reading is taken at face value. Flagging it is useful; refusing to
     calculate until it is repeated is not — the figures are the same either
     way, and the decision belongs to the person holding the test kit. */
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Worth a second test if anything about it felt off — otherwise the working below takes it as read.`;
  }

  const caStrength = strengthPlausible("calcium", settings);
  if (!caStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !caStrength.ok
      ? `The calcium strength in Setup is ${caStrength.value} ${caStrength.unit}, which is outside anything a real product delivers (${caStrength.lo}–${caStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A typical two-part calcium is around 0.36.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }

  /* Section 37: judge where calcium sits from the pattern, not from the last
     number alone. A single reading dropping to 445 on a tank that has held 470
     for a month is a test result, not a tank at 445 — and treating it as the
     latter is how the engine ended up adjusting a correct dose. */
  const fittedNow = (fit && maths.length >= 3)
    ? maths.reduce((a, r) => a + r.value, 0) / maths.length
      + fit.slope * (alkStamp(maths[maths.length - 1])
        - maths.reduce((a, r) => a + alkStamp(r), 0) / maths.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  const inRange = fittedNow >= def.min && fittedNow <= def.max;
  const above = fittedNow > def.max;
  const below = fittedNow < def.min;
  /* Sections 44 and 45: the same trend means different things depending on how
     close calcium already is to leaving the range. */
  const bandWidth = def.max - def.min;
  /* Close enough to the boundary that another week of the same movement would
     carry calcium out of range. 12% of the band puts 453 in a 450–500 range
     inside it and 462 comfortably outside it, which matches the protocol's own
     examples. And it only counts when the trend is heading toward that edge:
     490 falling is moving away from the top, not toward it. */
  const nearLower = inRange && (fittedNow - def.min) < bandWidth * 0.12;
  const nearUpper = inRange && (def.max - fittedNow) < bandWidth * 0.12;
  const headingDown = out.trendPerDay < 0, headingUp = out.trendPerDay > 0;
  out.nearEdge = (nearLower && headingDown) ? "lower"
    : (nearUpper && headingUp) ? "upper" : null;

  /* Sections 29, 30 and 56: verify a surprise before acting on it. */
  /* Calcium kits resolve to perhaps ±10 ppm, and four weekly points scatter
     widely around a fit. The floor has to sit above that scatter or ordinary
     noise gets reported as a testing error every other week. */
  const lastInterval = intervals[intervals.length - 1];
  const weekMove = lastInterval ? Math.abs(lastInterval.change) : 0;
  /* Sections 29 and 30: a large jump is suspect when it is out of character
     with the weeks around it. A steady 15 ppm a week for three weeks is a real
     trend; 2 ppm then 52 ppm is a reading to repeat. */
  const priorMoves = intervals.slice(0, -1).map((iv) => Math.abs(iv.change));
  /* Compared against the largest move the series has already made, not the
     median. A series alternating between two values has a median move of zero,
     which made every movement look exceptional. */
  const typicalMove = priorMoves.length ? Math.max(...priorMoves) : null;
  const outOfCharacter = typicalMove != null && weekMove > Math.max(CA_TREND.meaningful, typicalMove * 1.5);
  if (weekMove >= CA_TREND.meaningful && (intervals.length < 2 || outOfCharacter)) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is a large move for calcium in ${fmtAmount(lastInterval.days)} days. If calcium and alkalinity fell together it is usually precipitation rather than consumption, which a bigger dose will not fix.`;
  }

  /* Sections 5, 41 and 49: seven days on a new dose before judging it. */
  const caEmergency = lastChange
    && ((out.current.value < def.min && out.trendPerDay < 0) || (out.current.value > def.max && out.trendPerDay > 0))
    && Math.abs(out.trendPerWeek) >= CA_TREND.meaningful;

  if (!caEmergency && lastChange && out.daysOnDose != null && out.daysOnDose < CA_SETTLE_DAYS) {
    if (weekMove >= CA_TREND.meaningful) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `Calcium moved ${fmtAmount(weekMove)}${def.unit} since the dose changed, which is a lot this soon. Worth checking the dosing pump, the reservoir level and whether the intended dose is actually being delivered — but changing the dose again now would make the next reading impossible to interpret.`;
    }
    out.reason = `The calcium dose changed to ${fmtAmount(out.currentDose)} mL/day ${Math.round(out.daysOnDose)} days ago. Calcium moves slowly, so a full week on the new dose is needed before it means anything. Hold and measure at the next weekly test.`;
    out.nextCheck = `Measure calcium in about ${Math.max(1, Math.round(CA_SETTLE_DAYS - out.daysOnDose))} days.`;
    return out;
  }

  /* Sections 9, 27 and 48: hold unless the movement is credible — unless
     calcium is already outside the range and still moving away from it, where
     even a small persistent trend needs answering (section 24). */
  const caClearlyOut = above ? (fittedNow - def.max) > CA_TREND.stable
    : below ? (def.min - fittedNow) > CA_TREND.stable : false;
  const caRepeats = repeatedCorrections(corrections, "calcium", nowStamp);
  const caWorsening = caClearlyOut
    && (Math.abs(out.trendPerWeek) >= CA_TREND.stable || caRepeats >= 2)
    && ((below && out.trendPerDay <= 0) || (above && out.trendPerDay >= 0));
  if (out.band === "stable" && !caWorsening) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is within what the test itself can resolve. The objective is a stable range rather than an identical number each week, so this is exactly what you want.`;
    out.nextCheck = "Measure again at your next weekly test.";

    /* Sections 21 and 22: a matched dose holds calcium wherever it sits. */
    if (!inRange) {
      const mid = (def.min + def.max) / 2;
      const toMid = Math.abs(mid - out.current.value);
      const oneOff = Math.round((toMid / effect) * 10) / 10;
      /* A one-off correction can only ever ADD. There is no additive that
         lowers alkalinity, calcium or magnesium — coming down happens by
         dosing less and waiting, which the advice below already says. Offering
         a "correction" in that direction invited an action that does not
         exist. Also withheld when the strength figure makes the amount absurd,
         because printing the number invites someone to dose it. */
      out.targetCorrection = !above
        ? {
            direction: "up", toMid,
            days: Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key])),
            ppmToRaise: Math.round(toMid * 100) / 100,
            ppmPerDay: Math.round((toMid / Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key]))) * 100) / 100,
            oneOffMl: oneOff,
            perDayMl: Math.round((SAFE_DAILY_RISE[def.key] / effect) * 10) / 10,
            /* Whether quoting the maintenance bottle is sensible at all: a lift
               this size is usually done with a stronger mix or the dry salt. */
            viaMaintenance: dosePlausible(oneOff / 5, settings),
          }
        : null;

      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, ${above ? "above" : "below"} your range — a matched dose will keep it there indefinitely.`;
      const repeats = repeatedCorrections(corrections, "calcium", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected calcium ${repeats} times in the last couple of months and it keeps sagging back. That points to the daily dose being short rather than the level needing another lift — a salt mix below your target, fed in by weekly water changes, is the usual cause. Raising the daily dose by around ${fmtAmount(out.targetCorrection.perDayMl)} mL would carry it instead.`;
      }
      out.nextCheck = above
        ? `Let it fall: hold this dose, or ease it down slightly, and allow consumption to bring calcium back toward the range. Do not chase it with a bigger reduction.`
        : out.targetCorrection
        ? `Raising it is a separate one-off correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL spread over a few days — not a permanent increase, which would carry calcium past the range once it arrives. Keep the daily dose where it is.`
        : `Raising it needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }

  /* Section 43: a small movement waits for a second week, unless calcium is
     already close to leaving the range (sections 44 and 45). */
  if (out.band === "small" && !out.nearEdge
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is small for calcium and ${out.intervals < 2 ? "seen over only one interval" : "not consistent between intervals"}. At ${fmtVal(def, out.current.value)}${def.unit} it is comfortably inside your range, so there is time to confirm it.`;
    out.nextCheck = "If next week shows the same movement again, the trend is real and worth acting on.";
    return out;
  }

  /* Sections 7 and 48: 10–20 ppm a week is meaningful but not urgent, and one
     week of it is one measurement. Confirm it over a second week, or by the
     fit being clear of its own noise, unless calcium is close to leaving the
     range — where waiting another week costs more than acting early. */
  /* Section 58: the default is to hold unless there is credible evidence.
     While calcium is inside the range, "credible" means the movement repeated
     across weeks or the fit is clear of its own scatter — a single week is a
     single measurement whatever its size, and calcium is slow enough that
     waiting one more week costs almost nothing. */
  /* Applies to the 5–10 ppm band only. Section 48 is explicit that a 10–20 ppm
     weekly movement is actionable once confounding events are ruled out, so a
     wider gate than this would contradict the protocol rather than implement
     it. Noise beyond that is a kit problem, not a logic problem. */
  if (out.band === "small" && inRange && !out.nearEdge && !out.confirmedByFit
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which would matter if it holds — but ${out.intervals < 2 ? "it has been seen over a single week, and one week is one measurement" : "the weeks disagree with each other"}. At ${fmtVal(def, out.current.value)}${def.unit} calcium is inside your range, so there is room to confirm before acting. Calcium moves slowly enough that a week's patience costs very little, and acting on noise costs a fortnight.`;
    out.nextCheck = "Measure again next week. If the same movement repeats, the trend is real and the dose should change.";
    return out;
  }

  /* Sections 23 to 26: direction relative to target matters more than the
     trend alone. */
  const movingToTarget = (above && out.trendPerDay < 0) || (below && out.trendPerDay > 0);
  if (movingToTarget) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Calcium is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${out.trendPerDay < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week. That is the direction you want, so changing the dose now would work against it.`;
    out.nextCheck = `Reassess once calcium reaches ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`;
    return out;
  }

  /* Section 39 and 40: conservative sizing, because feedback is a week away. */
  const rawChange = out.maintenanceDose - out.currentDose;
  const mag = Math.abs(rawChange);
  const urgent = below || above || out.nearEdge != null
    || Math.abs(out.trendPerWeek) >= CA_TREND.meaningful;
  let applied;
  const caRescue = caEmergency || below || above;
  if (caRescue) applied = rawChange;
  else if (mag <= 1) applied = rawChange;
  else if (mag <= 3) applied = rawChange * 0.85;
  else applied = urgent ? rawChange * 0.6 : rawChange * 0.5;

  let next = Math.max(0, Math.round((out.currentDose + applied) * 10) / 10);

  /* The rate limit, applied last so it overrides everything above it including
     an emergency rescue. A tank that is genuinely low still must not be brought
     back faster than corals tolerate — the swing is the harm, not the level. */
  const band = safeDoseBand("alkalinity", out.maintenanceDose, effect);
  let clamped = next;
  if (band) {
    if (clamped > band.hi) clamped = Math.round(band.hi * 10) / 10;
    if (clamped < band.lo) clamped = Math.round(band.lo * 10) / 10;
  }
  if (Math.abs(clamped - next) > 0.05) {
    out.rateLimited = {
      wanted: next, allowed: clamped,
      perDay: SAFE_DAILY_RISE["alkalinity"], unit: def.unit,
      days: Math.max(1, Math.ceil(Math.abs((next - clamped) * effect) / SAFE_DAILY_RISE["alkalinity"])),
    };
    next = clamped;
  }

  if (!dosePlausible(next, settings)) {
    out.action = "implausible";
    out.reason = `The maths points to ${fmtAmount(next)} mL/day, which is not a real dose for a ${fmtAmount(settings.volumeL)} L tank. That means the solution strength in Setup is wrong rather than the tank being unusual — ${fmtAmount(out.effectPerMl)} ${def.unit} per mL would make this necessary, and a normal product is far stronger. Correct the strength and this will resolve itself.`;
    out.nextCheck = "Check the solution strength in Setup before dosing anything.";
    return out;
  }
  out.ok = true;
  out.recommendedDose = next;
  out.action = next > out.currentDose ? "increase" : next < out.currentDose ? "decrease" : "hold";
  out.staged = mag > 3;

  if (out.staged) {
    const steps = [];
    let at = out.currentDose, guard = 0;
    while (Math.abs(out.maintenanceDose - at) > 1 && guard++ < 5) {
      const remaining = out.maintenanceDose - at;
      at = Math.round((at + (Math.abs(remaining) > 3 ? remaining * (urgent ? 0.6 : 0.5) : remaining)) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) steps.push(Math.round(out.maintenanceDose * 10) / 10);
    out.plan = steps;
  }

  out.explanation =
    `Calcium is ${out.trendPerDay < 0 ? "falling" : "rising"} ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", in the same direction each week" : ""}`
    + `${out.nearEdge ? `, and at ${fmtVal(def, out.current.value)}${def.unit} it is already close to the ${out.nearEdge === "lower" ? "bottom" : "top"} of your range — which is why a smaller movement is being acted on than would be elsewhere` : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)}${def.unit} a day, so the tank is using about ${fmtAmount(out.consumption)}${def.unit} a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged ? `, which is a large change for calcium. Move part of the way and confirm over a week — feedback here is slow, so a wrong estimate costs a fortnight.` : `.`)
    + (out.narrowedWindow ? ` This reads the last fortnight rather than the full month, because the recent weeks are moving faster than the month as a whole — averaged over everything it would look like ${fmtAmount(Math.abs(out.fullWindowTrend))}${def.unit} a week, which would understate what is happening now.` : "");
  out.nextCheck = `Hold the new dose for a full week, then measure calcium again. Do not adjust again in between.`;
  return out;
}

/* --- Magnesium dosing assessment ---
 *
 * The most conservative of the three. Magnesium moves slowly, tests carry
 * meaningful uncertainty, and a weekly water change can account for a large
 * share of the apparent movement — so the default is to hold, and the bar for
 * acting is higher than for calcium.
 *
 * Everything learned building the alkalinity and calcium engines is carried
 * over, including the two faults that only appeared under simulation: the
 * anomaly threshold must be expressed in the parameter's own units, and the
 * tank's position relative to target must come from the fitted level rather
 * than the last reading, or one noisy result reads as a tank out of range.
 */

const MG_TREND = {
  stable: 10,       /* ppm/week — below this is test variation */
  small: 20,
  meaningful: 30,   /* at or above this, verify before acting */
};

const MG_SETTLE_DAYS = 7;

/* A recommendation is only as sound as the strength figure behind it.
 *
 * The first version of this tested the resulting DOSE against tank volume,
 * which coupled two unrelated things: a 45 L tank carrying heavy SPS demand
 * legitimately needs a dose that looks enormous per litre, and got flagged
 * despite being correctly configured. Testing the STRENGTH directly has no
 * such coupling — a figure outside what any real product can be is wrong
 * whatever the tank looks like.
 *
 * Ranges below are generous, covering weak ready-made solutions through to
 * concentrated Balling mixes, so only a genuine mistake falls outside. */
const STRENGTH_RANGE = {
  alkalinity: { lo: 0.01, hi: 0.40, unit: "dKH/mL/100L", field: "dkhPerMlPer100L" },
  calcium:    { lo: 0.05, hi: 2.00, unit: "ppm/mL/100L", field: "caPpmPerMlPer100L" },
  /* The floor here is deliberately far below the other two. Ready-made
     magnesium supplements are dilute — around 0.012 ppm/mL/100L at standard
     strength — so a range borrowed from the calcium part would reject a
     perfectly ordinary bottle. */
  magnesium:  { lo: 0.005, hi: 3.00, unit: "ppm/mL/100L", field: "mgPpmPerMlPer100L" },
};

function strengthPlausible(element, settings) {
  const r = STRENGTH_RANGE[element];
  if (!r) return { ok: true };
  const v = Number(settings && settings[r.field]);
  if (!isFinite(v) || v <= 0) return { ok: true };
  if (v >= r.lo && v <= r.hi) return { ok: true };
  return { ok: false, value: v, ...r };
}

/* A last backstop on the resulting dose, deliberately loose: two millilitres
   per litre per day is beyond any real system, so this only catches
   combinations the strength test somehow lets through. */
function dosePlausible(ml, settings) {
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(ml) || !isFinite(vol) || vol <= 0) return true;
  return ml <= vol * 2;
}

function mgEffectPerMl(settings) {
  const per100 = Number(settings && settings.mgPpmPerMlPer100L);
  const vol = Number(settings && settings.volumeL);
  if (!isFinite(per100) || !isFinite(vol) || vol <= 0 || per100 <= 0) return null;
  return (per100 * 100) / vol;
}

function solveMgEffect(readings, doseLog, waterChanges, settings, corrections) {
  const changes = (doseLog || [])
    .filter((d) => d.element === "magnesium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!changes.length) return { status: "nochanges" };

  const all = (readings || [])
    .filter((r) => r.param === "magnesium" && isFinite(r.value))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const disturbances = [...(waterChanges || []), ...(corrections || [])].map((x) => alkStamp(x));

  const bounds = [];
  for (let i = 0; i < changes.length; i++) {
    bounds.push({
      from: alkStamp(changes[i]),
      to: i + 1 < changes.length ? alkStamp(changes[i + 1]) : Infinity,
      dose: changes[i].ml,
    });
  }
  const priorDose = Number(settings && settings.magDoseMl);
  if (isFinite(priorDose) && priorDose !== changes[0].ml) {
    bounds.unshift({ from: -Infinity, to: alkStamp(changes[0]), dose: priorDose });
  }

  const periods = [];
  for (const b of bounds) {
    const rows = all.filter((r) => {
      const t = alkStamp(r);
      if (t < b.from || t >= b.to) return false;
      return !disturbances.some((d) => d > b.from && d <= t);
    });
    /* Magnesium needs three weeks before a slope means anything. */
    if (rows.length < 3) continue;
    const span = alkStamp(rows[rows.length - 1]) - alkStamp(rows[0]);
    if (span < 19) continue;
    const f = alkFit(rows);
    if (!f) continue;
    periods.push({ dose: b.dose, slope: f.slope, n: rows.length, span });
  }
  if (periods.length < 2) return { status: "needmore", periods: periods.length };

  const ests = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const dD = periods[i].dose - periods[j].dose;
      if (Math.abs(dD) < 1) continue;
      const k = (periods[i].slope - periods[j].slope) / dD;
      if (!isFinite(k) || k <= 0) continue;
      ests.push({ k, weight: Math.abs(dD) });
    }
  }
  if (!ests.length) return { status: "nospread", periods: periods.length };
  const wsum = ests.reduce((a, e) => a + e.weight, 0);
  const k = ests.reduce((a, e) => a + e.k * e.weight, 0) / wsum;
  const entered = mgEffectPerMl(settings);
  return {
    status: "ok", k, pairs: ests.length, periods: periods.length, entered,
    pctOff: entered ? ((k - entered) / entered) * 100 : null,
    suggestedPer100L: settings && settings.volumeL
      ? Math.round((k * settings.volumeL / 100) * 10000) / 10000 : null,
  };
}

function mgBandOf(perWeek) {
  const a = Math.abs(perWeek);
  if (a < MG_TREND.stable) return "stable";
  if (a < MG_TREND.small) return "small";
  if (a < MG_TREND.meaningful) return "meaningful";
  return "significant";
}

function assessMagnesium({ readings, doseLog = [], waterChanges = [], settings, def,
                           now = null, plan = null, corrections = [] }) {
  const nowStamp = now != null ? now : (dayNum(todayStr()) + minutesOf(nowTime()) / 1440);
  const out = {
    ok: false, reason: null, element: "magnesium",
    current: null, target: null, currentDose: null, daysOnDose: null,
    used: [], trendPerDay: null, trendPerWeek: null, band: null, consistent: null,
    supplied: null, consumption: null, maintenanceDose: null,
    recommendedDose: null, action: "hold", explanation: "", nextCheck: "",
    anomaly: null, events: [], effectPerMl: null, effectSolved: null,
    activePlan: null, stage: null, stages: null, planTarget: null, nextTestDue: null,
    targetCorrection: null, salinityShift: null,
  };

  const effect = mgEffectPerMl(settings);
  out.effectPerMl = effect;
  if (!effect) {
    out.reason = "Set your tank volume and magnesium solution strength in Setup before this can be calculated.";
    return out;
  }
  out.effectSolved = solveMgEffect(readings, doseLog, waterChanges, settings, corrections);

  /* Only recent history can affect the answer, so older readings are dropped
     before sorting rather than after. Without this the cost of an assessment
     grows with the whole log — someone three years in would pay for every
     reading they had ever taken, on every render. */
  const mgFloor = nowStamp - 400;
  const all = (readings || [])
    .filter((r) => r.param === "magnesium" && isFinite(r.value) && alkStamp(r) >= mgFloor)
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  if (!all.length) { out.reason = "No magnesium readings yet."; return out; }
  out.current = all[all.length - 1];
  out.target = { min: def.min, max: def.max };

  const changes = (doseLog || [])
    .filter((d) => d.element === "magnesium" && isFinite(d.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const lastChange = changes.length ? changes[changes.length - 1] : null;
  out.currentDose = lastChange ? lastChange.ml : Number(settings.magDoseMl);
  if (!isFinite(out.currentDose)) {
    out.reason = "Set your daily magnesium dose in Setup before this can be calculated.";
    return out;
  }

  const windowStart = lastChange ? alkStamp(lastChange) : -Infinity;
  out.daysOnDose = lastChange ? nowStamp - windowStart : null;

  if (plan && plan.target != null && plan.appliedDose != null) {
    out.activePlan = plan; out.planTarget = plan.target;
    out.stage = plan.stage; out.stages = plan.stages; out.nextTestDue = plan.nextTestAt || null;
  }

  /* Section 47: two weeks preferred for small trends, three to four for
     confirming stability — but only within the current dose period. */
  const horizon = nowStamp - 35;
  let used = all.filter((r) => alkStamp(r) >= windowStart && alkStamp(r) >= horizon);
  if (used.length < 3) used = all.filter((r) => alkStamp(r) >= windowStart).slice(-5);
  if (lastChange) {
    const anchor = all
      .filter((r) => alkStamp(r) < windowStart && (windowStart - alkStamp(r)) <= 1)
      .sort((a, b) => alkStamp(b) - alkStamp(a))[0];
    if (anchor && !used.includes(anchor)) used = [anchor, ...used];
  }
  out.used = used;

  /* Section 39: magnesium scales with salinity, so a salinity shift between
     tests can masquerade as consumption. Flagged rather than corrected for,
     because the reading is what it is — what changes is how to read it. */
  if (used.length >= 2) {
    const from = alkStamp(used[0]), to = alkStamp(used[used.length - 1]);
    const sal = (readings || [])
      .filter((r) => r.param === "salinity" && isFinite(r.value)
        && alkStamp(r) >= from - 1 && alkStamp(r) <= to + 1)
      .sort((a, b) => alkStamp(a) - alkStamp(b));
    if (sal.length >= 2) {
      const shift = sal[sal.length - 1].value - sal[0].value;
      if (Math.abs(shift) >= 0.6) {
        out.salinityShift = {
          shift,
          impliedPpm: out.current.value * (shift / (sal[0].value || 35)),
        };
      }
    }
  }



  /* Section 25: a manual correction is known exactly, so it is subtracted
     rather than used to throw the window away. */
  const corrList = (corrections || [])
    .filter((c) => c.element === "magnesium" && isFinite(c.ml))
    .sort((a, b) => alkStamp(a) - alkStamp(b));
  const CORRECTION_DAYS = 4;
  let maths = used;
  if (corrList.length && used.length) {
    const addedBy = (stamp) => corrList.reduce((sum, c) => {
      const t = alkStamp(c);
      if (stamp <= t) return sum;
      return sum + c.ml * effect * Math.min(1, (stamp - t) / CORRECTION_DAYS);
    }, 0);
    const anchor = addedBy(alkStamp(used[0]));
    maths = used.map((r) => ({ ...r, value: r.value - (addedBy(alkStamp(r)) - anchor) }));
    out.correctionAdjusted = true;
  }

  /* Kept before any narrowing: the anomaly test needs the wider context. */

  const anomalyRows = maths;

  const mgPick = pickTrendWindow(maths, 15, nowStamp, MG_TREND.small);
  if (mgPick.narrowed) {
    maths = mgPick.rows;
    out.narrowedWindow = true;
    out.fullWindowTrend = mgPick.fullSlope * 7;
  }

  if (maths.length < 2) {
    out.reason = lastChange
      ? "Only one magnesium reading since the dose changed. Hold and measure at the next weekly test."
      : "Two magnesium readings are needed to see a trend. Hold the current dose and test again next week.";
    out.nextCheck = "Measure magnesium at your next weekly test.";
    return out;
  }

  const spanDays = alkStamp(maths[maths.length - 1]) - alkStamp(maths[0]);
  if (spanDays <= 0) { out.reason = "Readings need to be on different days."; return out; }

  const fit = alkFit(maths);
  const intervals = alkIntervals(maths);
  out.trendPerDay = fit ? fit.slope : intervals[intervals.length - 1].perDay;
  out.trendPerWeek = out.trendPerDay * 7;
  out.band = mgBandOf(out.trendPerWeek);
  out.consistent = directionConsistent(intervals, CA_TREND.stable * 0.5);
  out.intervals = intervals.length;

  out.slopeSE = (() => {
    if (!fit || maths.length < 3 || !isFinite(fit.rmse)) return null;
    const xs = maths.map(alkStamp);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    if (!(sxx > 0)) return null;
    return fit.rmse / Math.sqrt(sxx);
  })();
  /* Statistical clarity only earns the right to act on a movement already
     large enough to be worth acting on. */
  out.confirmedByFit = out.slopeSE != null && out.slopeSE > 0
    && maths.length >= 4
    && Math.abs(out.trendPerWeek) >= MG_TREND.small
    && Math.abs(out.trendPerDay) > out.slopeSE * 3 && spanDays >= 20;

  out.supplied = out.currentDose * effect;
  out.consumption = out.supplied - out.trendPerDay;
  out.maintenanceDose = out.consumption / effect;

  /* Consumption can come out negative when the level is rising faster than the
     dose supplies — a richer salt arriving with water changes will do it. The
     formula then yields a negative maintenance dose, which is not a thing
     anyone can pour, so zero is the floor and the situation is named. */
  if (out.consumption < 0) {
    out.gaining = -out.consumption;
    out.consumption = 0;
    out.maintenanceDose = 0;
  }

  /* No cap on consumption itself. Capping it blocked the trend-following
     increases the protocol explicitly asks for — a magnesium falling 25 ppm a
     week needs a bigger maintenance dose, and that is the dose doing its job.
     What the daily dose must never do is lift a level, which is why the
     out-of-range rescue is absent from this engine. When the implied
     maintenance is a large multiple of what is currently dosed, that is said
     rather than silently applied. */
  /* Checked here, before any branch, because a wrong strength poisons every
     path — including the ones that return "hold" while still printing a
     maintenance figure of a hundred millilitres a day. */
  out.anomaly = alkAnomaly(anomalyRows, alkFit(anomalyRows),
    Math.max(MG_TREND.meaningful * 2, (def.max - def.min) * 0.6));
  if (out.anomaly) {
    out.caution = `This reading sits well away from the ones before it, which pointed to about ${fmtVal(def, out.anomaly.expected)}${def.unit}. Magnesium rarely moves that fast on its own, so salinity and the dosing reservoir are worth a glance — otherwise the working below takes it as read.`;
  }

  const mgStrength = strengthPlausible("magnesium", settings);
  if (!mgStrength.ok || !dosePlausible(out.maintenanceDose, settings)) {
    out.action = "implausible";
    out.reason = !mgStrength.ok
      ? `The magnesium strength in Setup is ${mgStrength.value} ${mgStrength.unit}, which is outside anything a real product delivers (${mgStrength.lo}–${mgStrength.hi}). Every millilitre figure here is derived from it, so they will all be wrong until it is corrected. A ready-made magnesium part is around 0.012, and a double-strength mix around 0.024.`
      : `The working points to ${fmtAmount(out.maintenanceDose)} mL/day, which is not a real dose for ${fmtAmount(settings.volumeL)} L. The strength figure is the likely cause.`;
    out.nextCheck = "Correct the solution strength in Setup, and these figures will make sense.";
    return out;
  }

  /* Section 48: position comes from the pattern, not the last number. */
  const fittedNow = (fit && maths.length >= 3)
    ? maths.reduce((a, r) => a + r.value, 0) / maths.length
      + fit.slope * (alkStamp(maths[maths.length - 1])
        - maths.reduce((a, r) => a + alkStamp(r), 0) / maths.length)
    : out.current.value;
  out.fittedNow = fittedNow;
  const inRange = fittedNow >= def.min && fittedNow <= def.max;
  const above = fittedNow > def.max;
  const below = fittedNow < def.min;

  const bandWidth = def.max - def.min;
  const nearLower = inRange && (fittedNow - def.min) < bandWidth * 0.12;
  const nearUpper = inRange && (def.max - fittedNow) < bandWidth * 0.12;
  out.nearEdge = (nearLower && out.trendPerDay < 0) ? "lower"
    : (nearUpper && out.trendPerDay > 0) ? "upper" : null;

  /* Sections 36 to 38: verify a surprise before acting on it. */
  const lastInterval = intervals[intervals.length - 1];
  const weekMove = lastInterval ? Math.abs(lastInterval.change) : 0;
  const priorMoves = intervals.slice(0, -1).map((iv) => Math.abs(iv.change));
  /* Compared against the largest move the series has already made, not the
     median. A series alternating between two values has a median move of zero,
     which made every movement look exceptional. */
  const typicalMove = priorMoves.length ? Math.max(...priorMoves) : null;
  const outOfCharacter = typicalMove != null && weekMove > Math.max(MG_TREND.meaningful, typicalMove * 1.5);
  if (weekMove >= MG_TREND.meaningful && (intervals.length < 2 || outOfCharacter)) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `That is more than magnesium usually moves in ${fmtAmount(lastInterval.days)} days — worth checking salinity and whether the solution was remixed at a different strength.`;
  }

  /* Sections 6, 21 and 52: a full week on a new dose before judging it. */
  const mgEmergency = lastChange
    && ((out.current.value < def.min && out.trendPerDay < 0) || (out.current.value > def.max && out.trendPerDay > 0))
    && Math.abs(out.trendPerWeek) >= MG_TREND.meaningful;

  if (!mgEmergency && lastChange && out.daysOnDose != null && out.daysOnDose < MG_SETTLE_DAYS) {
    if (weekMove >= MG_TREND.meaningful) {
      out.caution = (out.caution ? out.caution + " " : "")
        + `Magnesium moved ${fmtAmount(weekMove)}${def.unit} since the dose changed, which is more than it should this soon. Check salinity and the dosing reservoir — but a second dose change now would make the next reading impossible to read.`;
    }
    out.reason = `The magnesium dose changed to ${fmtAmount(out.currentDose)} mL/day ${Math.round(out.daysOnDose)} days ago. Magnesium moves slowly enough that a full week is the minimum before the new dose means anything. Hold and measure at the next weekly test.`;
    out.nextCheck = `Measure magnesium in about ${Math.max(1, Math.round(MG_SETTLE_DAYS - out.daysOnDose))} days.`;
    return out;
  }

  /* Sections 11 and 34: hold on anything inside test variation — but only
     while the tank is inside its range, or heading back into it. Below range
     and still falling, even slowly, is a leak that never gets fixed if a
     sub-threshold trend always returns "hold" (section 29). */
  const clearlyOut = above ? (fittedNow - def.max) > MG_TREND.stable
    : below ? (def.min - fittedNow) > MG_TREND.stable : false;
  const mgRepeats = repeatedCorrections(corrections, "magnesium", nowStamp);
  const worsening = clearlyOut
    && (Math.abs(out.trendPerWeek) >= MG_TREND.stable || mgRepeats >= 2)
    && ((below && out.trendPerDay <= 0) || (above && out.trendPerDay >= 0));
  if (out.band === "stable" && !worsening) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Magnesium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week, which is inside what the test can resolve. Stable magnesium in the right range is the goal, not an identical number each week.`;
    out.nextCheck = "Measure again at your next weekly test.";

    /* Sections 26 and 27: a matched dose holds magnesium where it sits. */
    if (!inRange) {
      const mid = (def.min + def.max) / 2;
      const toMid = Math.abs(mid - fittedNow);
      const oneOff = Math.round((toMid / effect) * 10) / 10;
      /* A one-off correction can only ever ADD. There is no additive that
         lowers alkalinity, calcium or magnesium — coming down happens by
         dosing less and waiting, which the advice below already says. Offering
         a "correction" in that direction invited an action that does not
         exist. Also withheld when the strength figure makes the amount absurd,
         because printing the number invites someone to dose it. */
      out.targetCorrection = !above
        ? {
            direction: "up", toMid,
            days: Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key])),
            ppmToRaise: Math.round(toMid * 100) / 100,
            ppmPerDay: Math.round((toMid / Math.max(2, Math.ceil(toMid / SAFE_DAILY_RISE[def.key]))) * 100) / 100,
            oneOffMl: oneOff,
            perDayMl: Math.round((SAFE_DAILY_RISE[def.key] / effect) * 10) / 10,
            /* Whether quoting the maintenance bottle is sensible at all: a lift
               this size is usually done with a stronger mix or the dry salt. */
            viaMaintenance: dosePlausible(oneOff / 5, settings),
          }
        : null;

      out.explanation += ` But it is holding at ${fmtVal(def, out.current.value)}${def.unit}, ${above ? "above" : "below"} your range — a dose that matches consumption will keep it there indefinitely.`;
      const repeats = repeatedCorrections(corrections, "magnesium", nowStamp);
      if (repeats >= 2 && out.targetCorrection) {
        out.caution = (out.caution ? out.caution + " " : "")
          + `You have corrected magnesium ${repeats} times in the last couple of months and it keeps sagging back. That is a sign the daily dose is short rather than the level needing another lift — most often a salt mix below your target feeding weekly water changes. Raising the daily dose by around ${fmtAmount(out.targetCorrection.perDayMl)} mL would carry it instead of correcting again.`;
      }
      out.nextCheck = above
        ? `Let it drift down: hold this dose, or ease it back slightly, and let consumption and water changes bring magnesium toward the range. Magnesium moderately high is rarely urgent.`
        : out.targetCorrection
        ? `Raising it is a separate correction of roughly ${fmtAmount(out.targetCorrection.oneOffMl)} mL of your maintenance solution — which is a lot of liquid, so most people mix a stronger magnesium solution or use the dry salt for this and keep the daily bottle for maintenance. Spread it over at least ${out.targetCorrection.days} days. Log it when you have added it and the rise will be treated as your doing rather than as the tank needing less.`
        : `Raising it needs a one-off correction rather than a bigger daily dose, but the amount cannot be worked out until the solution strength in Setup is right.`;
    }
    return out;
  }

  /* Sections 34, 58 and 65: 10–20 ppm a week waits for a second week. */
  if (out.band === "small" && inRange && !out.nearEdge && !out.confirmedByFit
      && (out.intervals < 2 || out.consistent === false)) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    out.explanation = `Magnesium moved ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week and ${out.intervals < 2 ? "that is a single week's movement" : "the weeks do not agree with each other"}. At ${fmtVal(def, out.current.value)}${def.unit} it is comfortably inside your range, and magnesium is slow enough that another week costs nothing.`;
    out.nextCheck = "Measure again next week. If the same movement repeats, it is a real trend and worth acting on.";
    return out;
  }

  /* Sections 31 to 33: moving toward target is the direction you want. */
  const startedBelow = maths[0].value < def.min;
  const startedAbove = maths[0].value > def.max;
  /* A tank that began the window outside the range and is heading back is
     mid-correction. Judging it only by where it has arrived treats a working
     recovery as a new problem, and escalates a dose that is already doing its
     job. */
  const recovering = (startedBelow && out.trendPerDay > 0) || (startedAbove && out.trendPerDay < 0);
  const movingToTarget = (above && out.trendPerDay < 0) || (below && out.trendPerDay > 0);
  if (movingToTarget || recovering) {
    out.ok = true; out.recommendedDose = out.currentDose; out.action = "hold";
    const wasLow = below || startedBelow;
    out.explanation = movingToTarget
      ? `Magnesium is ${above ? "above" : "below"} your range at ${fmtVal(def, out.current.value)}${def.unit} and moving ${out.trendPerDay < 0 ? "down" : "up"} toward it at ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week. That is the direction you want, so changing the dose now would work against it.`
      : `Magnesium started this period ${wasLow ? "below" : "above"} your range at ${fmtVal(def, maths[0].value)}${def.unit} and has been moving ${out.trendPerDay > 0 ? "up" : "down"} steadily to ${fmtVal(def, out.current.value)}${def.unit}. The correction is working — continue it rather than escalating, or magnesium will overshoot once it arrives.`;
    out.nextCheck = movingToTarget
      ? `Reassess once magnesium reaches ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}.`
      : `Keep measuring weekly. Once magnesium settles inside the range, work out the maintenance dose from readings taken there.`;
    return out;
  }

  /* Sections 17, 18 and 51: a large calculated change resting on a single
     weekly interval is checked before it is acted on. Doubling a magnesium
     dose because of one test is exactly the move the protocol warns against —
     unless magnesium is already outside the range, where waiting costs more
     than verifying. */
  const rawChange = out.maintenanceDose - out.currentDose;
  const mag = Math.abs(rawChange);
  if (mag > 3 && out.intervals < 2 && inRange && !out.nearEdge) {
    out.caution = (out.caution ? out.caution + " " : "")
      + `This rests on one weekly reading and points to a ${fmtAmount(mag)} mL change, so the staged step below is deliberately smaller than the full figure.`;
  }
  const urgent = below || above || out.nearEdge != null
    || Math.abs(out.trendPerWeek) >= MG_TREND.meaningful;
  let applied;
  /* No rescue path here, unlike alkalinity and calcium. Raising the daily dose
     to lift a low magnesium is exactly what sections 26 and 27 warn against,
     and with a dilute maintenance product it produces figures nobody would
     pour — a tank drifting down asked for 72 mL/day. Levels are moved by a
     separate correction; this dose only ever tracks consumption. */
  if (mag <= 1) applied = rawChange;
  else if (mag <= 3) applied = rawChange * 0.8;
  else applied = urgent ? rawChange * 0.55 : rawChange * 0.45;

  let next = Math.max(0, Math.round((out.currentDose + applied) * 10) / 10);

  /* The rate limit, applied last so it overrides everything above it including
     an emergency rescue. A tank that is genuinely low still must not be brought
     back faster than corals tolerate — the swing is the harm, not the level. */
  const band = safeDoseBand("alkalinity", out.maintenanceDose, effect);
  let clamped = next;
  if (band) {
    if (clamped > band.hi) clamped = Math.round(band.hi * 10) / 10;
    if (clamped < band.lo) clamped = Math.round(band.lo * 10) / 10;
  }
  if (Math.abs(clamped - next) > 0.05) {
    out.rateLimited = {
      wanted: next, allowed: clamped,
      perDay: SAFE_DAILY_RISE["alkalinity"], unit: def.unit,
      days: Math.max(1, Math.ceil(Math.abs((next - clamped) * effect) / SAFE_DAILY_RISE["alkalinity"])),
    };
    next = clamped;
  }

  if (!dosePlausible(next, settings)) {
    out.action = "implausible";
    out.reason = `The maths points to ${fmtAmount(next)} mL/day, which is not a real dose for a ${fmtAmount(settings.volumeL)} L tank. That means the solution strength in Setup is wrong rather than the tank being unusual — ${fmtAmount(out.effectPerMl)} ${def.unit} per mL would make this necessary, and a normal product is far stronger. Correct the strength and this will resolve itself.`;
    out.nextCheck = "Check the solution strength in Setup before dosing anything.";
    return out;
  }
  out.ok = true;
  out.recommendedDose = next;
  out.action = next > out.currentDose ? "increase" : next < out.currentDose ? "decrease" : "hold";
  out.staged = mag > 3;

  if (out.staged) {
    const steps = [];
    let at = out.currentDose, guard = 0;
    while (Math.abs(out.maintenanceDose - at) > 1 && guard++ < 5) {
      const remaining = out.maintenanceDose - at;
      at = Math.round((at + (Math.abs(remaining) > 3 ? remaining * (urgent ? 0.55 : 0.45) : remaining)) * 10) / 10;
      steps.push(at);
    }
    if (Math.abs(out.maintenanceDose - at) > 0.05) steps.push(Math.round(out.maintenanceDose * 10) / 10);
    out.plan = steps;
  }

  out.explanation =
    `Magnesium is ${out.trendPerDay < 0 ? "falling" : "rising"} ${fmtAmount(Math.abs(out.trendPerWeek))}${def.unit} a week across ${fmtAmount(spanDays)} days`
    + `${out.consistent ? ", in the same direction each week" : ""}`
    + `${out.nearEdge ? `, and at ${fmtVal(def, out.current.value)}${def.unit} it is close to the ${out.nearEdge === "lower" ? "bottom" : "top"} of your range — which is why a smaller movement is being acted on than would be elsewhere` : ""}. `
    + `At ${fmtAmount(out.currentDose)} mL/day you are adding ${fmtAmount(out.supplied)}${def.unit} a day, so the tank is using about ${fmtAmount(out.consumption)}${def.unit} a day. `
    + `Replacing that exactly would take ${fmtAmount(out.maintenanceDose)} mL/day`
    + (out.staged ? `, which is a large change to make on magnesium. Move part of the way and confirm over a week or two — magnesium is slow, so a wrong estimate is expensive to unwind.` : `.`)
    + (out.narrowedWindow ? ` This reads the last three weeks rather than the full five, because the recent weeks are moving faster than the period as a whole — averaged over everything it would look like ${fmtAmount(Math.abs(out.fullWindowTrend))}${def.unit} a week, which would understate what is happening now.` : "")
    + (out.maintenanceDose > out.currentDose * 3 && out.currentDose > 0
        ? ` That is more than three times what you dose now, which is a lot to ask of a maintenance solution — magnesium uptake is small, so a figure this size usually means something is pulling the level down rather than corals consuming it. Worth checking salinity and the salt mix before committing to the full amount; a one-off correction with a stronger solution is the usual route for closing a gap.`
        : "")
    + (out.salinityShift ? ` Note that salinity moved ${fmtAmount(Math.abs(out.salinityShift.shift))} ppt over this period, which alone accounts for roughly ${fmtAmount(Math.abs(out.salinityShift.impliedPpm))}${def.unit} of the movement — worth settling salinity before reading much into this.` : "");
  out.nextCheck = `Hold the new dose for a full week, then measure magnesium again. For a small change, two weeks gives a much clearer answer.`;
  return out;
}

/* --- Dosing state, in one place ---
 *
 * The dosing wizard knew whether a change was running, the dashboard did not,
 * and the tank summary never mentioned dosing at all. Someone could apply a
 * change, open the dashboard, and see nothing acknowledging it. This derives a
 * single description of where each element stands, and every screen reads it,
 * so they cannot tell different stories.
 *
 * The states, in the order they occur:
 *   idle       nothing to do, dose matches consumption
 *   suggested  a change is recommended but not yet made
 *   settling   a change was made and has not had time to show its effect
 *   due        enough time has passed but no reading has been taken since
 *   worked     readings since the change show it did what it should
 *   fell-short readings show the tank still moving the wrong way
 *   overshot   readings show it moved too far the other way
 *   blocked    the strength figure is wrong, so nothing can be judged
 */
function doseStatus(a, def, todayIso) {
  if (!a || !def) return null;
  const today = todayIso || todayStr();
  const label = def.label.toLowerCase();
  const settleDays = def.key === "alkalinity" ? 2 : 7;

  if (a.action === "implausible") {
    return { state: "blocked", tone: "#C4285B", short: "Check setup",
      headline: `${def.label} figures can't be trusted yet`,
      detail: `The solution strength in Setup is outside what a real product delivers, so every millilitre figure for ${label} is wrong until it is corrected.` };
  }

  const plan = a.activePlan;
  if (plan && plan.appliedAt) {
    const appliedOn = String(plan.appliedAt).slice(0, 10);
    const daysSince = daysBetween(appliedOn, today);
    const testOn = plan.nextTestAt;
    /* Readings taken since the change are what decide whether it worked. */
    const after = (a.used || []).filter((r) => r.date >= appliedOn);
    const tested = after.length >= 2 && daysSince >= settleDays;

    if (!tested && daysSince < settleDays) {
      return { state: "settling", tone: "#1D6FA5", short: "Change settling",
        headline: `${def.label} dose changed ${daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince} days ago`}`,
        detail: `You set ${fmtAmount(plan.appliedDose)} mL/day. It needs ${settleDays === 2 ? "about two days" : "a full week"} before a reading means anything, so hold it and test ${testOn ? fmtFriendly(testOn) : "when due"}.`,
        testOn, expected: plan.expected, stage: plan.stage, stages: plan.stages, target: plan.target };
    }
    if (!tested) {
      return { state: "due", tone: "#D98324", short: "Test to confirm",
        headline: `${def.label} needs a test to confirm the new dose`,
        detail: `${fmtAmount(plan.appliedDose)} mL/day has been running ${daysSince} days. Until you test, there is no way to tell whether it did what it should — and the next recommendation cannot be worked out either.`,
        testOn, stage: plan.stage, stages: plan.stages, target: plan.target };
    }

    /* Tested: did it work? Stable and in band is the answer we wanted. */
    const inBand = a.fittedNow != null
      ? (a.fittedNow >= def.min && a.fittedNow <= def.max)
      : (a.current && a.current.value >= def.min && a.current.value <= def.max);
    const steady = a.band === "stable";
    const more = plan.target != null && Math.abs(plan.target - plan.appliedDose) > 0.5;

    if (steady && inBand) {
      return { state: "worked", tone: "#0B7C86", short: "Change worked",
        headline: `${def.label} settled after the change`,
        detail: `${fmtAmount(plan.appliedDose)} mL/day is holding ${label} steady inside your range. ${more ? `The plan was heading for ${fmtAmount(plan.target)} mL/day, but the readings say this dose is already right — there is no need to go further.` : "Nothing more to do."}`,
        stage: plan.stage, stages: plan.stages, target: plan.target };
    }
    if (steady && !inBand) {
      return { state: "worked", tone: "#45605F", short: "Steady, off target",
        headline: `${def.label} is steady but not where you want it`,
        detail: `The new dose stopped the drift, which is what it was for. Holding at ${fmtVal(def, a.current.value)}${def.unit} means the level itself needs a separate correction — a bigger daily dose would only carry it past the range later.`,
        stage: plan.stage, stages: plan.stages };
    }
    if (a.action === "increase" || a.action === "decrease") {
      /* Fell short means the tank is still heading the way it was and the
         engine still wants more of the same. Anything else after a change —
         wanting to cut back while it climbs — means it went too far. */
      const same = (a.trendPerDay < 0 && a.action === "increase")
        || (a.trendPerDay > 0 && a.action === "increase");
      return same
        ? { state: "fell-short", tone: "#D98324", short: "Needs more",
            headline: `${def.label} is still moving after the change`,
            detail: `${fmtAmount(plan.appliedDose)} mL/day narrowed the gap but has not closed it — ${label} is still ${a.trendPerDay < 0 ? "falling" : "rising"}. ${a.recommendedDose != null ? `The next step is ${fmtAmount(a.recommendedDose)} mL/day.` : ""}`,
            recommended: a.recommendedDose, stage: plan.stage, stages: plan.stages }
        : { state: "overshot", tone: "#D98324", short: "Went too far",
            headline: `${def.label} has turned the other way`,
            detail: `${fmtAmount(plan.appliedDose)} mL/day moved ${label} past where it needed to be and it is now ${a.trendPerDay > 0 ? "rising" : "falling"}. ${a.recommendedDose != null ? `Easing back to ${fmtAmount(a.recommendedDose)} mL/day should settle it.` : ""}`,
            recommended: a.recommendedDose, stage: plan.stage, stages: plan.stages };
    }
  }

  if (a.action === "increase" || a.action === "decrease") {
    return { state: "suggested", tone: "#0B7C86",
      short: `${fmtAmount(a.currentDose)} \u2192 ${fmtAmount(a.recommendedDose)} mL`,
      headline: `${def.label} dose could change`,
      detail: `${label} is ${a.trendPerDay < 0 ? "falling" : "rising"} and the dose no longer matches what the tank uses. ${a.staged ? `Moving to ${fmtAmount(a.recommendedDose)} mL/day is the first step toward ${fmtAmount(a.maintenanceDose)}.` : `${fmtAmount(a.recommendedDose)} mL/day would match it.`}`,
      recommended: a.recommendedDose, staged: a.staged, target: a.maintenanceDose };
  }
  if (a.targetCorrection) {
    return { state: "suggested", tone: "#45605F", short: "Correction needed",
      headline: `${def.label} dose is right, the level is not`,
      detail: `The daily dose is matching what the tank uses, so ${label} is holding — but it is holding outside your range. That needs a one-off correction of about ${fmtAmount(a.targetCorrection.oneOffMl)} mL spread over ${a.targetCorrection.days} days, not a bigger daily dose.` };
  }
  if (!a.ok) return null;

  /* Steady is not the same as right. A tank sitting above its range with a
     matched dose has nothing to correct by dosing — you cannot add something
     to bring it down — but reporting that as "nothing to do" contradicted the
     explanation directly underneath it, which said the level was wrong. */
  /* The fitted level decides whether the tank counts as out of range, because
     it resists one noisy reading. What gets shown is always the measured
     value: quoting a fitted 1540 to someone whose kit read 1520 is telling
     them a number that does not exist. */
  const level = a.fittedNow != null ? a.fittedNow : (a.current ? a.current.value : null);
  const shown = a.current ? a.current.value : level;
  if (level != null && (level < def.min || level > def.max)) {
    const above = level > def.max;
    return { state: "off-target", tone: "#45605F",
      short: above ? "Steady, above range" : "Steady, below range",
      headline: `${def.label} is steady but ${above ? "above" : "below"} your range`,
      detail: above
        ? `The dose is matching what the tank uses, so ${label} is holding at ${fmtVal(def, shown)}${def.unit} rather than climbing. Nothing you can dose brings it down — easing the dose back slightly and letting consumption carry it toward the range is the way, and there is no hurry about it.`
        : `The dose is matching what the tank uses, so ${label} is holding at ${fmtVal(def, shown)}${def.unit} rather than falling further. Raising it is a separate correction rather than a bigger daily dose.` };
  }

  return { state: "idle", tone: "#45605F", short: "No change needed",
    headline: `${def.label} dose is matching consumption`,
    detail: `Nothing to do — keep testing on your usual schedule.` };
}

/* --- Shared findings layer ---
 *
 * Every analysis used to end at its own conclusion, so the calcium dose box
 * could recommend raising the dose while the ionic check simultaneously said
 * calcium was already disappearing faster than calcification explains. Each
 * analysis now emits findings into one pool, and any screen can ask what is
 * relevant to it. One place reasons; everywhere else reads.
 *
 * A finding carries:
 *   params    which parameters it concerns (for routing to cards and modals)
 *   severity  "info" | "watch" | "act"
 *   scope     "reading-accuracy" | "dosing" | "chemistry" | "nutrients" | "trace"
 *   title     short label for a badge
 *   detail    the full sentence, written to stand alone wherever it appears
 */
const DOSED_ELEMENTS = new Set(["alkalinity", "calcium", "magnesium"]);

/* What the hobby regards as safe, as distinct from whatever band you have set
   as your target.
   
   These matter because "outside your target" and "dangerous" are different
   claims, and the app was treating them as the same one. Alkalinity 7.5 on a
   target of 8.5–9.5 was reported as "a long way below range" at act severity —
   but 7.5 dKH is a perfectly ordinary alkalinity, and Randy Holmes-Farley's
   own guidance puts the workable range at roughly 7–11 dKH. Raising an alarm
   there trains people to ignore alarms.

   Outside your target but inside these bounds is worth knowing. Outside these
   is worth acting on. Ammonia is absent deliberately: any detectable reading
   is handled on its own terms, because there is no safe amount. */
const SAFE_BOUNDS = {
  alkalinity: { min: 6.5, max: 12 },   /* Randy: 7–11 workable; calcification stalls below ~6 */
  calcium:    { min: 350, max: 550 },
  magnesium:  { min: 1150, max: 1700 },
  nitrate:    { min: 0.5, max: 50 },   /* zero starves corals; high is ugly, not acute */
  phosphate:  { min: 0.01, max: 0.5 },
  ph:         { min: 7.7, max: 8.6 },
  salinity:   { min: 32, max: 38 },
  potassium:  { min: 330, max: 470 },
};

function buildFindings({ readings, icps, paramDefs, settings, doseLog, waterChanges, latestByParam, kitChanges = {}, corrections = [] }) {
  const out = [];
  const add = (f) => out.push(f);

  /* The dosing protocol's verdict for an element, or null when it cannot form
     one — no strength entered, too few readings. Only when it cannot does the
     generic trend detector below speak for that element. */
  const doseVerdictCache = {};
  const doseVerdict = (key) => {
    if (key in doseVerdictCache) return doseVerdictCache[key];
    let v = null;
    try {
      const def = paramDefs.find((d) => d.key === key);
      const fn = key === "alkalinity" ? assessAlkalinity
        : key === "calcium" ? assessCalcium
        : key === "magnesium" ? assessMagnesium : null;
      if (def && fn) {
        const a = fn({ readings, doseLog, waterChanges, corrections, settings, def });
        /* An unconfigured element returns "hold" with a reason asking for the
           strength — that is not a verdict, and treating it as one silenced
           the trend warning on a tank that had never been set up. Only a
           verdict the protocol could actually reach counts. */
        const usable = a && a.action
          && a.action !== "implausible" && a.action !== "blocked"
          && a.effectPerMl > 0 && a.currentDose != null;
        v = usable ? a.action : null;
      }
    } catch (e) { v = null; }
    doseVerdictCache[key] = v;
    return v;
  };

  /* --- Test kit accuracy, from paired ICP comparisons ---
     This is the most under-used knowledge in the app: a kit reading 222% high
     silently undermines every conclusion drawn from that parameter. */
  const cal = computeCalibration(readings, icps, paramDefs, 7, kitChanges);
  const kitOffsets = {};
  for (const r of cal.results) {
    const pct = r.meanPct;
    kitOffsets[r.def.key] = { pct, meanDiff: r.meanDiff, n: r.n, def: r.def };
    if (Math.abs(pct) < 5) continue;
    const severe = Math.abs(pct) >= 25;
    add({
      id: "kit-" + r.def.key,
      params: [r.def.key],
      scope: "reading-accuracy",
      severity: severe ? "act" : "watch",
      title: `kit reads ${pct > 0 ? "high" : "low"} ${Math.abs(pct).toFixed(0)}%`,
      detail: severe
        ? `Your ${r.def.label.toLowerCase()} kit read ${Math.abs(pct).toFixed(0)}% ${pct > 0 ? "higher" : "lower"} than the lab across ${r.n} paired comparison${r.n === 1 ? "" : "s"}. That's far beyond normal kit variation, so anything derived from these readings — targets, trends, dosing advice — is built on a number the lab disagrees with. Worth replacing the reagent before acting on it.`
        : `Your ${r.def.label.toLowerCase()} kit runs about ${Math.abs(pct).toFixed(0)}% ${pct > 0 ? "high" : "low"} against the lab. Small, but it shifts every figure derived from it in the same direction, so treat ${r.def.label.toLowerCase()} conclusions as carrying that offset.`,
    });
  }

  /* --- Ammonia ---
     Ammonia was displayed and never interpreted, so a tank at 0.4ppm produced
     no warning at all. It is the only parameter where a single reading is
     grounds for acting immediately, so it is checked first and can reach the
     highest severity. */
  const amDef = paramDefs.find((d) => d.key === "ammonia");
  const amLast = latestByParam && latestByParam.ammonia;
  if (amDef && amLast) {
    const v = amLast.value;
    const stale = daysBetween(amLast.date, todayStr()) > 3;
    if (v > amDef.max) {
      add({
        id: "ammonia-high", params: ["ammonia"], scope: "chemistry", severity: "act", value: v,
        title: "ammonia is dangerously high",
        detail: `${fmtVal(amDef, v)}${amDef.unit} on ${fmtDate(amLast.date)}. This is harmful to fish and corals now. Re-test to confirm, then look for a dead animal, an overfeed, or a filter that has been disturbed or replaced. A water change buys time while you find the cause.`,
      });
    } else if (v > (amDef.step || 0.01) / 2) {
      add({
        id: "ammonia-detected", params: ["ammonia"], scope: "chemistry", severity: "act", value: v,
        title: "ammonia is detectable",
        detail: `${fmtVal(amDef, v)}${amDef.unit} on ${fmtDate(amLast.date)}. An established tank should read zero — anything measurable means waste is being produced faster than the biology can process it. Worth re-testing today and checking for anything that has died or any recent change to the filtration.${stale ? " This reading is a few days old, so confirm it before acting." : ""}`,
      });
    }
  }

  /* --- Parameters a long way outside their range ---
     Nothing here could previously reach "act": a tank at 11.5 dKH with 45ppm
     nitrate produced only "watch" findings, so the app had no way to say that
     something mattered now rather than eventually. A full band-width outside
     is the threshold, which scales with whatever range you have set. */
  for (const def of paramDefs) {
    if (def.key === "ammonia") continue;          // handled above, on its own terms
    const last = latestByParam && latestByParam[def.key];
    if (!last) continue;
    const half = (def.max - def.min) / 2;
    if (!(half > 0)) continue;
    const over = last.value - def.max, under = def.min - last.value;
    const outBy = Math.max(over, under);
    if (outBy < half * 2) continue;               // two half-bands = a full band out

    const dir = over > 0 ? "above" : "below";
    /* A full band outside a narrow target can still be a perfectly ordinary
       reading. Only escalate when it is also outside what the hobby treats as
       safe; otherwise this is worth knowing, not worth alarm. */
    const safe = SAFE_BOUNDS[def.key];
    const unsafe = !safe || last.value < safe.min || last.value > safe.max;
    add({
      id: "far-out-" + def.key, params: [def.key], scope: "chemistry",
      severity: unsafe ? "act" : "watch",
      value: last.value,
      title: unsafe
        ? `${def.label.toLowerCase()} is a long way ${dir} range`
        : `${def.label.toLowerCase()} is well ${dir} your target`,
      detail: `${fmtVal(def, last.value)}${def.unit} against a target of ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}, measured ${fmtDate(last.date)}. Confirm it with a second test before making a large correction — a single reading this far out is as likely to be a test error as a real change. If it holds, correct it gradually: moving ${def.label.toLowerCase()} quickly is usually harder on livestock than the level itself.` + (unsafe ? "" : ` For what it is worth, ${fmtVal(def, last.value)}${def.unit} is still inside what the hobby treats as workable for ${def.label.toLowerCase()} — off your target rather than dangerous, so bring it back at a steady pace rather than in one move.`),
    });
  }

  /* A replaced kit clears the old warning, but nothing yet proves the new one
     is any better — which is worth stating rather than leaving silence. */
  for (const r of cal.replaced || []) {
    add({
      id: "kit-replaced-" + r.def.key,
      params: [r.def.key],
      scope: "reading-accuracy",
      severity: "info",
      title: `${r.def.label.toLowerCase()} kit replaced`,
      detail: `You recorded a new ${r.def.label.toLowerCase()} kit on ${fmtDate(r.since)}, so comparisons against earlier lab panels no longer apply and the previous offset has been cleared. The next ICP panel will check the new kit against the lab and, if they disagree again, say so.`,
    });
  }

  /* --- Ionic balance, routed to both elements it concerns --- */
  const bal = computeIonicBalance(readings, settings);
  /* Fired on 100% of tanks in testing, because any ratio outside the band
     counted however marginally. A finding that always appears carries no
     information, so it now needs to be meaningfully outside. */
  const ratioOff = bal && bal.band && isFinite(bal.ratio)
    ? (bal.ratio < bal.band[0] * 0.85 || bal.ratio > bal.band[1] * 1.15)
    : false;
  if (bal && bal.status === "ok" && bal.verdict !== "balanced" && ratioOff) {
    /* Route to whichever element is actually out of step. "ca-heavy" means
       calcium is the anomaly; "ca-light" points at alkalinity instead. The
       other element is named in the text, which is where it belongs. */
    const subject = bal.verdict === "ca-heavy" ? "calcium" : "alkalinity";
    add({
      id: "ionic",
      params: [subject],
      scope: "chemistry",
      severity: "watch",
      /* This finding is about the RATIO between calcium and alkalinity use, not
         about either one's direction. Titling it "falling" was read as a claim
         about the trend, and fired on tanks whose alkalinity was climbing. */
      title: bal.verdict === "ca-heavy"
        ? "calcium and alkalinity are out of step"
        : "alkalinity and calcium are out of step",
      detail: bal.note,
      ratio: bal.ratio, band: bal.band,
    });
  }

  const unverified = [];

  /* --- Dose strength confidence ---
     Millilitre recommendations rest on a strength figure. If that has never
     been checked against the tank's own response, the advice should say so. */
  for (const el of DOSE_ELEMENTS) {
    const c = calibrateDoseStrength(el.key, readings, doseLog, waterChanges, settings);
    if (!c) continue;
    if (c.status === "ok" && !c.enteredInside && !c.implausible) {
      add({
        id: "strength-" + el.key,
        params: [el.key],
        scope: "dosing",
        severity: "act",
        title: "dose strength looks wrong",
        detail: `Your own dose changes imply ${el.label.toLowerCase()} delivers ${c.median.toFixed(4)} ${el.strengthLabel}, not the ${c.entered} entered in Setup. Every millilitre figure for ${el.label.toLowerCase()} is scaled by that, so correct it before acting on any dose advice.`,
      });
    } else if (c.status === "nochanges" || c.status === "nodata") {
      const dosed = settings[el.doseField] > 0;
      const strengthVal = settings[el.strengthField];
      const strengthOk = typeof strengthVal === "number" && isFinite(strengthVal) && strengthVal > 0;
      if (dosed && !strengthOk) {
        /* Dosing with no usable strength means every millilitre figure for this
           element is meaningless, which matters more than verification. */
        add({
          id: "strength-missing-" + el.key,
          params: [el.key],
          scope: "dosing",
          severity: "act",
          title: "dose strength missing",
          detail: `You're dosing ${el.label.toLowerCase()} but Setup has no usable strength for it, so the app can't work out what those millilitres deliver. Enter how much 1 mL raises 100L and the consumption and dosing figures will start working.`,
        });
      } else if (dosed) {
        /* Collected and reported once below. Three separate findings saying the
           same sentence about three elements read as three problems. */
        unverified.push(el);
      }
    }
  }

  if (unverified.length) {
    const names = unverified.map((e) => e.label.toLowerCase());
    add({
      id: "strength-unverified",
      params: unverified.map((e) => e.key),
      scope: "dosing",
      severity: "info",
      title: unverified.length === 1
        ? `${names[0]} strength not yet confirmed`
        : "dose strengths not yet confirmed",
      detail: `The strength figures for ${joinList(names)} are entered and being used, but none has been checked against how your tank actually responds. Record a dose change of a millilitre or more and, after a few weeks of readings, the app can solve for the real figure. Until then every millilitre recommendation is only as good as those numbers.`,
    });
  }

  /* --- Physically implausible consumption ---
     If the numbers imply a tank consuming far more than any reef plausibly can,
     the inputs are wrong rather than the tank extraordinary. Almost all tanks
     sit between 0.1 and 1.0 dKH a day; heavily stocked SPS systems reach ~2.
     Anything beyond that points at a mis-entered dose or product strength —
     the same failure that can quietly inflate every downstream figure. */
  const consCheck = computeConsumption(readings, settings);
  if (!(settings.volumeL > 0)) {
    add({
      id: "no-volume",
      params: [],
      scope: "dosing",
      severity: "act",
      title: "tank volume not set",
      detail: `Every dosing and consumption figure divides by your tank volume, so without a sensible number in Setup none of them mean anything. Enter your net water volume — total system litres less rock and sand displacement, usually around 80-85% of the display figure.`,
    });
  }
  if (consCheck && consCheck.consumption != null &&
      isFinite(consCheck.consumption) && consCheck.consumption > 2) {
    add({
      id: "implausible-alk",
      params: ["alkalinity"],
      scope: "dosing",
      severity: "act",
      title: "consumption looks too high to be real",
      detail: `The figures imply your tank consumes ${consCheck.consumption.toFixed(1)} dKH a day. Almost every reef sits between 0.1 and 1.0, and even heavily stocked SPS systems rarely pass 2. That points at the dose or the product strength in Setup being wrong rather than the tank being remarkable — worth re-checking both, since every consumption, skeleton and dosing figure is scaled by them.`,
    });
  }
  const balCheck = computeIonicBalance(readings, settings);
  if (balCheck && balCheck.status === "ok" && isFinite(balCheck.caConsumed) && balCheck.caConsumed > 0) {
    const caPerDay = balCheck.caConsumed;
    if (caPerDay > 30) {
      add({
        id: "implausible-ca",
        params: ["calcium"],
        scope: "dosing",
        severity: "act",
        title: "calcium use looks too high to be real",
        detail: `The figures imply ${caPerDay.toFixed(0)} ppm of calcium consumed a day, which no reef sustains — it would pair with ${(caPerDay / 6.75).toFixed(1)} dKH of alkalinity. Check the calcium dose and strength in Setup before trusting any calcium figure.`,
      });
    }
  }

  /* --- Thin data ---
     A parameter tested rarely produces advice with wide error bars, and that
     should travel with the advice rather than being invisible. */
  const sparse = [];
  for (const def of paramDefs) {
    const rows = windowRows(readings, def.key, 60);
    if (rows.length < 2) continue;
    const span = Math.max(1, daysBetween(rows[0].date, rows[rows.length - 1].date));
    const gap = span / (rows.length - 1);
    const expected = Math.max(3, (def.freqDays || 7));
    if (gap > expected * 2 && rows.length >= 3) {
      sparse.push({ def, gap: Math.round(gap) });
    }
  }

  if (sparse.length) {
    add({
      id: "sparse",
      params: sparse.map((x) => x.def.key),
      scope: "reading-accuracy",
      severity: "info",
      title: sparse.length === 1
        ? `${sparse[0].def.label.toLowerCase()} is tested rarely`
        : `${sparse.length} parameters are tested rarely`,
      detail: `${joinList(sparse.map((x) => `${x.def.label.toLowerCase()} about every ${x.gap} days`))} over the last two months. Trends and dose advice for ${sparse.length === 1 ? "it" : "these"} rest on fewer points than the rest, so treat them as directional rather than precise.`,
    });
  }

  /* --- Heading out of range ---
     The most useful thing the app can say is that something will be a problem
     before it is one. A parameter still in band but travelling steadily toward
     the edge was previously invisible until it crossed. */
  for (const def of paramDefs) {
    if (def.key === "ammonia") continue;
    const last = latestByParam && latestByParam[def.key];
    if (!last) continue;
    const st = paramStatus(def, last.value);
    if (st !== "ok") continue;                      // already reported elsewhere

    /* Alkalinity, calcium and magnesium have their own dosing protocols. When
       one of those already wants a change it owns the message, and repeating
       it here would be the same advice twice in different words.

       When the protocol says hold, this finding still has something to add:
       the protocol reasons over a short window since the last dose change —
       three readings, in one real case — while this is a thirty-day
       regression. A tank falling 0.9 dKH across a month reads as "within
       normal test variation" over three readings, and suppressing this
       entirely made that silent. Both are kept, with the wording below
       adjusted so they cannot contradict each other. */
    const verdict = DOSED_ELEMENTS.has(def.key) ? doseVerdict(def.key) : null;
    if (verdict != null && verdict !== "hold") continue;

    const rows = windowRows(readings, def.key, 30);
    if (rows.length < 5) continue;
    const reg = regressionWithError(rows);
    if (!reg || !isFinite(reg.slope)) continue;

    /* The trend has to be real, not noise: the slope must exceed twice its own
       standard error before it is worth mentioning. */
    if (!(Math.abs(reg.slope) > (reg.se || 0) * 2)) continue;

    /* And it has to be large enough for the kit to see. Statistical
       significance is not the same as physical measurability: phosphate was
       being projected to leave its range in 34 days on a trend of 0.006 ppm a
       week, against a kit that resolves 0.02 ppm and readings that swing six
       times that between tests. The regression was confident about a movement
       nobody could have measured. */
    const noise = (STABILITY_RULES[def.key] || {}).noiseFloor || 0;
    if (noise && Math.abs(reg.slope) * 7 < noise / 2) continue;

    const edge = reg.slope > 0 ? def.max : def.min;
    const distance = Math.abs(edge - last.value);
    const days = distance / Math.abs(reg.slope);
    /* Arriving at the edge is the urgent end of this, not something to skip.
       A tank that fell 0.9 dKH over a month and is now sitting exactly on the
       band minimum computed "reaches the bottom in 0 days" and was dropped by
       a guard meant to suppress useless horizons. */
    if (days > 45) continue;                        // too far off to be useful
    const atEdge = days <= 2;

    add({
      id: "heading-out-" + def.key, params: [def.key], scope: "chemistry", severity: "watch",
      title: atEdge
        ? `${def.label.toLowerCase()} has drifted to the edge of your range`
        : `${def.label.toLowerCase()} is heading out of range`,
      detail: `${def.label} is ${fmtVal(def, last.value)}${def.unit} and moving ${reg.slope > 0 ? "up" : "down"} at about ${fmtAmount(Math.abs(reg.slope) * 7)}${def.unit} a week. `
        + (atEdge
          ? `That has taken it to the ${reg.slope > 0 ? "top" : "bottom"} of your range — still inside it, but with no margin left. `
          : `At that pace it reaches the ${reg.slope > 0 ? "top" : "bottom"} of your range in roughly ${Math.round(days)} days. `)
        + (verdict === "hold"
          /* The protocol has looked at the readings since your last dose change
             and found nothing to act on. Saying "correct this now" underneath
             that would be two answers to one question, so this says what it
             actually knows: the longer view disagrees with the shorter one. */
          ? `The dosing protocol looks only as far back as your last dose change and sees nothing to act on there, so no dose change is suggested yet — but the longer view is drifting. Worth another test or two to see which holds.`
          : `Correcting a drift this size now is a small adjustment; waiting until it is outside the band means a larger one, and large corrections are harder on livestock than the drift itself.`),
    });
  }

  /* --- pH read together with alkalinity ---
     Neither number alone identifies this, which is why it was never reported:
     high alkalinity with low pH is the signature of carbon dioxide building up
     indoors, and the fix is ventilation rather than anything dosed. */
  const phLast = latestByParam && latestByParam.ph;
  const alkLast = latestByParam && latestByParam.alkalinity;
  const phDef = paramDefs.find((d) => d.key === "ph");
  const alkDef = paramDefs.find((d) => d.key === "alkalinity");
  if (phLast && alkLast && phDef && alkDef
      && daysBetween(phLast.date, todayStr()) <= 30) {
    if (phLast.value < 7.9 && alkLast.value >= alkDef.min) {
      add({
        id: "co2-accumulation", params: ["ph", "alkalinity"], scope: "chemistry", severity: "watch",
        title: "pH is low while alkalinity is fine",
        detail: `pH ${fmtVal(phDef, phLast.value)} alongside alkalinity ${fmtVal(alkDef, alkLast.value)}${alkDef.unit}. Low pH with healthy alkalinity almost always means carbon dioxide in the room rather than anything wrong in the water — a closed house, a sealed cabinet, or poor gas exchange. Fresh air to the skimmer intake, or an open window, usually lifts it more than any additive will. Calcification slows at low pH, so alkalinity consumption often looks lower than it should while this persists.`,
      });
    } else if (phLast.value > 8.45) {
      add({
        id: "ph-high", params: ["ph"], scope: "chemistry", severity: "info",
        title: "pH is running high",
        detail: `pH ${fmtVal(phDef, phLast.value)}. Usually kalkwasser, a soda-ash-heavy two-part, or very strong aeration in a well-ventilated room. Not harmful in itself, but above about 8.5 the risk of precipitation rises, which shows up as alkalinity and calcium falling together for no apparent reason.`,
      });
    }
  }

  /* --- Alkalinity read against nutrients ---
     The strongest cross-parameter rule in the hobby, and one the app knew but
     never showed: this reasoning lived only in the prose assessment, which was
     replaced by the claim feed, so it stopped reaching anyone. Randy
     Holmes-Farley and the wider consensus both put it plainly — corals build
     skeleton from carbonate and tissue from nitrogen and phosphorus, so high
     alkalinity on lean nutrients lets skeleton outrun tissue and burns SPS
     tips. Neither number is wrong on its own, which is exactly why a
     per-parameter check cannot see it. */
  const alkR = latestByParam && latestByParam.alkalinity;
  const no3R = latestByParam && latestByParam.nitrate;
  const po4R = latestByParam && latestByParam.phosphate;
  const alkDef2 = paramDefs.find((d) => d.key === "alkalinity");
  if (alkR && no3R && po4R && alkDef2) {
    const lean = no3R.value < 3 || po4R.value < 0.03;
    const rich = no3R.value >= 5 && po4R.value >= 0.05;
    if (alkR.value >= 9 && lean) {
      add({
        id: "alk-vs-nutrients", params: ["alkalinity"], scope: "chemistry", severity: "watch",
        title: `alkalinity is high for nutrients this lean`,
        detail: `Alkalinity ${fmtVal(alkDef2, alkR.value)}dKH with nitrate ${fmtVal({ step: 0.1 }, no3R.value)}ppm and phosphate ${fmtVal({ step: 0.01 }, po4R.value)}ppm. That pairing is what burns SPS tips: there is carbonate to spare for skeleton but little nitrogen and phosphorus to build tissue with, so growth outruns the tissue covering it. Either feed a little more to bring nutrients up, or ease alkalinity down toward 8 — the two have to move together, and dropping alkalinity faster than 0.5dKH a day is its own risk.`,
      });
    } else if (alkR.value <= 7.5 && rich) {
      add({
        id: "alk-vs-nutrients", params: ["alkalinity"], scope: "chemistry", severity: "info",
        title: `alkalinity is low for nutrients this generous`,
        detail: `Alkalinity ${fmtVal(alkDef2, alkR.value)}dKH with nitrate ${fmtVal({ step: 0.1 }, no3R.value)}ppm and phosphate ${fmtVal({ step: 0.01 }, po4R.value)}ppm. Corals have plenty to build tissue with but less carbonate for skeleton, which usually shows as good colour and slow growth rather than anything harmful. Raising alkalinity gently would let growth catch up.`,
      });
    }
  }

  /* --- Salinity ---
     Every other parameter is measured per litre of water, so salinity drift
     shifts all of them at once. Worth saying only when it is genuinely off. */
  const salDef = paramDefs.find((d) => d.key === "salinity");
  const salLast = latestByParam && latestByParam.salinity;
  if (salDef && salLast && daysBetween(salLast.date, todayStr()) <= 21) {
    const off = salLast.value - 35;
    /* When salinity is already flagged as a long way out, this would be the
       second finding on the same screen saying the level is wrong. The acute
       one supersedes it — the skew it causes is named there instead, so the
       consequence is not lost. */
    const alreadyFlagged = out.some((f) => f.id === "far-out-salinity");
    if (Math.abs(off) >= 1.2 && !alreadyFlagged) {
      add({
        id: "salinity-off", params: ["salinity"], scope: "chemistry", severity: "watch",
        title: `salinity is ${off > 0 ? "high" : "low"} enough to skew other readings`,
        detail: `Salinity ${fmtVal(salDef, salLast.value)}${salDef.unit} against a normal 35${salDef.unit}. Everything dissolved in the water scales with this, so at ${fmtVal(salDef, salLast.value)} your other parameters read roughly ${Math.abs(off / 35 * 100).toFixed(0)}% ${off > 0 ? "higher" : "lower"} than they would at 35 — a difference that can look like a chemistry problem no amount of dosing will fix. Correct salinity first, then re-test.`,
      });
    }
  }

  /* --- Stability that has changed ---
     A tank that used to swing and now holds steady has achieved something, and
     one that is coming apart deserves warning before any single reading looks
     wrong. Comparing the recent window against the one before it says which,
     and neither was being reported. */
  for (const def of paramDefs) {
    const recent = windowRows(readings, def.key, 21);
    const older = readings
      .filter((r) => r.param === def.key
        && daysBetween(r.date, todayStr()) > 21
        && daysBetween(r.date, todayStr()) <= 63)
      .sort(byOldest);
    if (recent.length < 5 || older.length < 5) continue;

    const spread = (rows) => {
      const v = rows.map((r) => r.value).sort((a, b) => a - b);
      const q = (p) => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
      return q(0.9) - q(0.1);
    };
    const now = spread(recent), before = spread(older);
    if (!(before > 0)) continue;
    const noise = kitSigma(def) * 2;
    if (now < noise && before < noise) continue;      // both inside kit resolution

    if (now <= before * 0.55 && before - now > noise) {
      add({
        id: "settled-" + def.key, params: [def.key], scope: "chemistry", severity: "info",
        title: `${def.label.toLowerCase()} has settled down`,
        detail: `Over the last three weeks ${def.label.toLowerCase()} has moved within ${fmtVal(def, now)}${def.unit}, against ${fmtVal(def, before)}${def.unit} in the six weeks before that. Whatever changed — dosing, flow, export, or simply time — it is holding better than it was. Worth not changing anything else for a while.`,
      });
    } else if (now >= before * 1.9 && now - before > noise) {
      add({
        id: "destabilised-" + def.key, params: [def.key], scope: "chemistry", severity: "watch",
        title: `${def.label.toLowerCase()} has become less steady`,
        detail: `${def.label} now moves within ${fmtVal(def, now)}${def.unit} over three weeks, against ${fmtVal(def, before)}${def.unit} before that — it is swinging roughly ${(now / before).toFixed(1)}× more than it was. The level may still look fine, but something changed: a dose adjustment, a new addition, a skimmer or reactor behaving differently, or growth outpacing what you are replacing.`,
      });
    }
  }

  /* --- Nutrient ratio ---
     Nitrate and phosphate are consumed together by the same organisms in a
     roughly fixed proportion, so the ratio between them says something neither
     number says alone. This was computed for Insights and never surfaced as a
     finding, which is why a tank at 45ppm nitrate against 0.02ppm phosphate
     produced no comment on the mismatch. */
  const nr = computeNutrientRatio(readings);
  if (nr && nr.ratio != null && isFinite(nr.ratio)) {
    const no3 = latestByParam && latestByParam.nitrate;
    const po4 = latestByParam && latestByParam.phosphate;
    const bothLow = no3 && po4 && no3.value < 2 && po4.value < 0.02;

    if (bothLow) {
      add({
        id: "nutrient-starved", params: ["nitrate", "phosphate"], scope: "nutrients", severity: "watch",
        title: "both nutrients are close to zero",
        detail: `Nitrate ${fmtAmount(no3.value)}ppm and phosphate ${fmtAmount(po4.value)}ppm. Corals need some of both — stripping them together tends to show as pale tissue, slow growth and sometimes a cyanobacteria or dinoflagellate bloom moving in where nothing else can compete. Feeding more is usually the fix rather than dosing either one.`,
      });
    } else if (nr.ratio > 250) {
      add({
        id: "ratio-po4-limited", params: ["phosphate", "nitrate"], scope: "nutrients", severity: "watch",
        title: "phosphate is limiting relative to nitrate",
        detail: `Your ratio is about ${Math.round(nr.ratio)}:1 against the roughly 100:1 that balanced tanks sit near. Nitrate cannot be consumed without phosphate alongside it, so the usual sign of this is nitrate that will not come down however much you export. Raising phosphate a little often lets the nitrate fall on its own.`,
      });
    } else if (nr.ratio < 40) {
      add({
        id: "ratio-no3-limited", params: ["nitrate", "phosphate"], scope: "nutrients", severity: "watch",
        title: "nitrate is limiting relative to phosphate",
        detail: `Your ratio is about ${Math.round(nr.ratio)}:1 against the roughly 100:1 that balanced tanks sit near. With nitrate this low relative to phosphate, phosphate tends to accumulate because there is not enough nitrogen to consume it — and surplus phosphate is what algae use. Feeding more, or dosing nitrate, usually works better than adding more phosphate removal.`,
      });
    }
  }

  /* --- Nutrient equilibrium --- */
  for (const key of ["nitrate", "phosphate"]) {
    const n = computeNutrientProduction(key, readings, waterChanges, settings);
    if (!n || n.status !== "ok" || n.equilibrium == null) continue;
    const cur = latestByParam && latestByParam[key] ? latestByParam[key].value : null;
    if (cur == null) continue;
    add({
      id: "equilibrium-" + key,
      params: [key],
      scope: "nutrients",
      severity: "info",
      title: `${n.def.label.toLowerCase()} settles near ${fmtVal(n.def, n.equilibrium)}${n.def.unit}`,
      detail: `On your current water change routine alone, ${n.def.label.toLowerCase()} would settle at about ${fmtVal(n.def, n.equilibrium)}${n.def.unit}. You're at ${fmtVal(n.def, cur)}${n.def.unit}${cur < n.equilibrium * 0.85 ? `, which is below that — your other export is doing real work` : cur > n.equilibrium * 1.15 ? `, above where water changes alone would hold it` : `, essentially at that equilibrium`}.`,
      equilibrium: n.equilibrium, offsetPct: n.offsetPct,
    });
  }

  /* --- ICP findings, which nothing outside the ICP section used to see --- */
  if (icps && icps.length) {
    const latest = [...icps].sort(byNewest)[0];
    const els = Object.entries(latest.elements || {})
      .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
      .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }));
    const detected = els.filter((e) => e.st === "detected");
    const off = els.filter((e) => e.ref && (e.st === "high" || e.st === "low"));
    if (detected.length) {
      add({
        id: "icp-contaminant",
        params: [],
        scope: "trace",
        severity: "act",
        title: `${detected.length} contaminant${detected.length === 1 ? "" : "s"} detected`,
        detail: `Your ${fmtDate(latest.date)} panel detected ${joinList(detected.map((e) => e.n))}, which Triton targets at zero. Worth identifying what went into the tank recently and running fresh carbon.`,
      });
    }
    if (off.length) {
      add({
        id: "icp-offrange",
        params: off.map((e) => e.n).filter((n) => PARAM_DEFS.some((d) => d.key === n)),
        scope: "trace",
        severity: "watch",
        title: `${off.length} element${off.length === 1 ? "" : "s"} outside reference`,
        detail: `Your ${fmtDate(latest.date)} panel had ${joinList(off.map((e) => `${e.n} ${e.st}`))} against Triton's reference ranges.`,
      });
    }
  }

  return { findings: out, kitOffsets };
}

/* --- What changes if a corrected strength is applied ---
 *
 * Retyping a four-decimal number is exactly the kind of transcription that
 * produces a wrong figure in the first place, and applying one blind hides the
 * consequences. This works out the before and after so the change can be seen
 * before it is committed.
 */
function previewStrengthChange(key, newStrength, readings, waterChanges, settings, paramDefs) {
  const el = DOSE_ELEMENTS.find((e) => e.key === key);
  if (!el) return null;
  const before = { ...DEFAULT_SETTINGS, ...settings };
  /* Everything here is per-litre, and a nonsensical strength can't be previewed
     meaningfully either. Refuse rather than render Infinity at the user. */
  if (!(before.volumeL > 0)) return null;
  if (!(typeof newStrength === "number" && isFinite(newStrength) && newStrength > 0)) return null;
  const after = { ...before, [el.strengthField]: newStrength };
  const def = paramDefs.find((d) => d.key === key);

  const rows = [];
  const doseMl = before[el.doseField] || 0;
  const delivers = (st) => doseMl * st * (100 / before.volumeL);
  rows.push({
    label: "Your dose delivers",
    before: `${fmtAmount(delivers(before[el.strengthField]))} ${def ? def.unit : ""}/day`,
    after: `${fmtAmount(delivers(newStrength))} ${def ? def.unit : ""}/day`,
  });

  const cB = computeElementConsumption(key, readings, waterChanges, before);
  const cA = computeElementConsumption(key, readings, waterChanges, after);
  if (cB && cA && cB.status === "ok" && cA.status === "ok" && cB.reliable) {
    rows.push({
      label: "Consumption",
      before: `${fmtAmount(cB.perDay)} ${def ? def.unit : ""}/day`,
      after: `${fmtAmount(cA.perDay)} ${def ? def.unit : ""}/day`,
    });
  }

  const aB = computeDoseAdvice(readings, [], paramDefs, 30, before);
  const aA = computeDoseAdvice(readings, [], paramDefs, 30, after);
  const mlOf = (adv) => {
    const e = adv.advice[key];
    return e && e.calc && !e.calc.impossible ? `${e.calc.recommendedMl.toFixed(1)} mL/day` : null;
  };
  const mB = mlOf(aB), mA = mlOf(aA);
  if (mB || mA) rows.push({ label: "Suggested dose", before: mB || "—", after: mA || "—" });

  if (key === "calcium" || key === "alkalinity") {
    const bB = computeIonicBalance(readings, before);
    const bA = computeIonicBalance(readings, after);
    if (bB && bA && bB.status === "ok" && aA && bA.status === "ok") {
      rows.push({
        label: "Calcium/alkalinity ratio",
        before: `${bB.ratio.toFixed(1)} ppm per dKH`,
        after: `${bA.ratio.toFixed(1)} ppm per dKH`,
        good: bA.ratio >= bA.band[0] && bA.ratio <= bA.band[1],
      });
    }
  }

  /* Whether a different mixing concentration would be more practical. This is a
     convenience question, not a correction: the solution is whatever strength it
     is, and the app's job is to hold the right number for it. */
  const perDayNeed = (() => {
    const a = aA.advice[key];
    return a && a.calc && !a.calc.impossible ? a.calc.recommendedMl : doseMl;
  })();
  let remixNote = null;
  if (perDayNeed > 0 && perDayNeed < 0.5) {
    remixNote = `At ${perDayNeed.toFixed(2)} mL a day, most dosing pumps can't deliver this accurately — their smallest reliable dose is usually around 0.5 mL. Mixing the solution weaker would give you a larger, more repeatable daily volume.`;
  } else if (perDayNeed > 50) {
    remixNote = `At ${perDayNeed.toFixed(0)} mL a day you'll be refilling often, and that's a lot of water going into a ${before.volumeL}L system. Mixing the solution stronger would cut the volume — just remember to update the strength here when you do.`;
  }

  return { rows, remixNote, el, newStrength, oldStrength: before[el.strengthField] };
}

/* Findings relevant to one parameter, most serious first. */
function findingsFor(findings, key) {
  const rank = { act: 0, watch: 1, info: 2 };
  return (findings || [])
    .filter((f) => f.params && f.params.includes(key))
    .sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/* ---------------------------------- main app ---------------------------------- */

export default function ReefConsole() {
  const [tab, setTab] = useState("dashboard");
  /* Tapping "Log test" on a reminder should land on the entry form with the
     right parameter already chosen — otherwise you arrive on the Testing tab
     and have to find it yourself. */
  const [testPrefill, setTestPrefill] = useState(null);
  /* Lifted out of Dashboard: tapping a parameter should open its graph from
     anywhere, and two copies of the same modal would drift apart. */
  const [modalParam, setModalParam] = useState(null);
  const [logResult, setLogResult] = useState(null);
  const [icpResult, setIcpResult] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  /* The splash belongs to a launch, not to a render: it plays once per session
     and never again until the app is opened afresh. Gating it to home-screen
     launches meant it was invisible in a browser tab, which made it impossible
     to see at all unless installed — so it now plays wherever the app opens,
     and is skippable either way. */
  /* The app mounts once per page load, so plain state already means "once per
     launch". A sessionStorage flag was used to guard against replays, but it
     was never cleared — so after the first ever load the splash was suppressed
     for the entire life of that browser tab, which is why it stopped showing. */
  const [splash, setSplash] = useState(true);
  useEffect(() => { onToast(setToastMsg); }, []);
  const openTestFor = (paramKey) => { setTestPrefill({ paramKey, at: Date.now() }); setTab("log"); };

  /* Browsers restore the previous scroll position on reload, which drops you
     partway down the Dashboard with the heading out of view. */
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /* Returning to a tab left the heading clipped under the browser chrome.
     Two things cause it: the previous scroll position is retained, and mobile
     Chrome re-expands its URL bar as you reach the top, which shifts the layout
     after the scroll has already happened. A single scrollTo therefore lands in
     the wrong place. Reset across several frames so the last one runs after the
     toolbar has settled. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const toTop = () => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    toTop();
    const r1 = requestAnimationFrame(() => { toTop(); requestAnimationFrame(toTop); });
    const t1 = setTimeout(toTop, 80);
    const t2 = setTimeout(toTop, 250);
    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [tab]);
  const [loaded, setLoaded] = useState(false);
  const [readings, setReadings] = useState([]);
  const [icps, setIcps] = useState([]);
  const [customTasks, setCustomTasks] = useState([]);
  const [taskLog, setTaskLog] = useState([]);
  const [lighting, setLighting] = useState([]);
  const [customRanges, setCustomRanges] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [doseLog, setDoseLog] = useState([]);
  const [waterChanges, setWaterChanges] = useState([]);
  const [reminders, setReminders] = useState([]);
  /* When each test kit was last replaced, so a lab comparison is only weighed
     against the kit that actually produced it. */
  const [kitChanges, setKitChanges] = useState({});
  /* Findings the user has read and chosen not to act on, keyed by id and the
     exact wording — so if the situation worsens the wording changes and the
     finding comes back rather than staying hidden for good. */
  const [dismissed, setDismissed] = useState({});
  const [alkPlan, setAlkPlan] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [caPlan, setCaPlan] = useState(null);
  const [mgPlan, setMgPlan] = useState(null);
  const [doseResult, setDoseResult] = useState(null);
  const [storageMsg, setStorageMsg] = useState(null);

  // Merge any user-edited target ranges over the built-in defaults.
  const paramDefs = useMemo(() =>
    PARAM_DEFS.map((d) => customRanges[d.key]
      ? { ...d, min: customRanges[d.key].min, max: customRanges[d.key].max }
      : d),
  [customRanges]);

  const saveSettings = async (next) => {
    const merged = { ...DEFAULT_SETTINGS, ...next };
    setSettings(merged);
    await saveKey("tank-settings", merged);
  };
  const addDoseChange = async (row) => {
    const element = row.element || "alkalinity";
    const next = [{ id: uid(), ...row, element }, ...doseLog];
    setDoseLog(next); await saveKey("dose-log", next);
    const cfg = DOSE_ELEMENTS.find((e) => e.key === element);
    if (cfg) await saveSettings({ ...settings, [cfg.doseField]: row.ml });
  };
  const deleteDoseChange = async (id) => {
    const next = doseLog.filter((d) => d.id !== id);
    setDoseLog(next); await saveKey("dose-log", next);
  };
  const addWaterChange = async (row) => {
    const next = [{ id: uid(), ...row }, ...waterChanges];
    setWaterChanges(next); await saveKey("water-changes", next);
  };
  const deleteWaterChange = async (id) => {
    const next = waterChanges.filter((w) => w.id !== id);
    setWaterChanges(next); await saveKey("water-changes", next);
  };
  const saveRange = async (key, min, max) => {
    const next = { ...customRanges, [key]: { min, max } };
    setCustomRanges(next);
    await saveKey("custom-ranges", next);
  };
  const resetRange = async (key) => {
    const next = { ...customRanges };
    delete next[key];
    setCustomRanges(next);
    await saveKey("custom-ranges", next);
  };

  useEffect(() => { onStorageError((m) => setStorageMsg(m)); }, []);

  useEffect(() => {
    (async () => {
      const [r, i, ct, tl, lg, seeded, icpSeeded, wcSeeded, lightSeeded, strengthsFixed, rem, kc, dis, ap, corr, cap, mgp, cr, st, dl, wc] = await Promise.all([
        loadKey("readings", []),
        loadKey("icp-tests", []),
        loadKey("tasks-custom", []),
        loadKey("task-log", []),
        loadKey("lighting-log", []),
        loadKey("historical-seeded", false),
        loadKey("icp-seeded", false),
        loadKey("wc-seeded", false),
        loadKey("light-seeded", false),
        loadKey("strengths-fixed-v1", false),
        loadKey("reminders", null),
        loadKey("kit-changes", {}),
        loadKey("findings-dismissed", {}),
        loadKey("alk-plan", null),
        loadKey("corrections", []),
        loadKey("ca-plan", null),
        loadKey("mg-plan", null),
        loadKey("custom-ranges", {}),
        loadKey("tank-settings", DEFAULT_SETTINGS),
        loadKey("dose-log", []),
        loadKey("water-changes", []),
      ]);

      let finalReadings = r;
      if (!seeded) {
        const existing = new Set(r.map((row) => `${row.param}|${row.date}`));
        const additions = [];
        for (const [param, rows] of Object.entries(HISTORICAL_DATA)) {
          for (const row of rows) {
            const dedupeKey = `${param}|${row.date}`;
            if (!existing.has(dedupeKey)) {
              existing.add(dedupeKey);
              additions.push({ id: uid(), param, value: row.value, date: row.date, note: "" });
            }
          }
        }
        finalReadings = [...r, ...additions];
        await saveKey("readings", finalReadings);
        await saveKey("historical-seeded", true);
      }

      /* Seed the two Triton panels once. Matching by date means a panel already
         entered by hand is left alone rather than duplicated, and anything
         edited afterwards is never touched again. */
      let finalIcps = i;
      if (!icpSeeded) {
        const haveDates = new Set(i.map((t) => t.date));
        const newPanels = ICP_SEED.filter((t) => !haveDates.has(t.date))
          .map((t) => ({ ...t, elements: { ...t.elements } }));
        if (newPanels.length) {
          finalIcps = [...i, ...newPanels].sort(byNewest);
          await saveKey("icp-tests", finalIcps);
        }
        await saveKey("icp-seeded", true);
      }

      /* Weekly water changes, seeded once and matched on date so anything
         already logged by hand is left alone. */
      let finalWaterChanges = wc || [];
      if (!wcSeeded) {
        const have = new Set(finalWaterChanges.map((w) => w.date));
        const add = WATER_CHANGE_SEED
          .filter((d) => !have.has(d))
          .map((d) => ({ id: "wc-" + d, date: d, litres: WATER_CHANGE_LITRES, note: "" }));
        if (add.length) {
          finalWaterChanges = [...finalWaterChanges, ...add].sort(byNewest);
          await saveKey("water-changes", finalWaterChanges);
        }
        await saveKey("wc-seeded", true);
      }

      let finalLighting = lg || [];
      if (!lightSeeded) {
        const haveL = new Set(finalLighting.map((x) => x.date));
        const addL = LIGHTING_SEED.filter((x) => !haveL.has(x.date));
        if (addL.length) {
          finalLighting = [...finalLighting, ...addL].sort(byNewest);
          await saveKey("lighting-log", finalLighting);
        }
        await saveKey("light-seeded", true);
      }

      /* Product strengths are measured facts about the bottles, so fill them in
         where the user hasn't set their own. Doses are deliberately left alone. */
      let finalSettings = { ...DEFAULT_SETTINGS, ...(st || {}) };
      const seedFields = ["dkhPerMlPer100L", "caPpmPerMlPer100L", "mgPpmPerMlPer100L",
                          "dailyDoseMl", "calciumDoseMl", "magDoseMl"];
      const needsSeed = !st || seedFields.some((f) => st[f] == null);
      if (needsSeed) {
        for (const f of seedFields) {
          if (!st || st[f] == null) finalSettings[f] = DEFAULT_SETTINGS[f];
        }
        await saveKey("tank-settings", finalSettings);
      }

      /* One-off correction. The product strengths were originally entered from
         a label rather than derived from the mix, and the calcium figure had
         the 2x doubling applied twice — 0.72 instead of 0.3611. Since those
         values are already saved in browser storage, "fill in only if missing"
         would never reach them. This overwrites once, then never again. */
      if (!strengthsFixed) {
        finalSettings = {
          ...finalSettings,
          dkhPerMlPer100L: DEFAULT_SETTINGS.dkhPerMlPer100L,
          caPpmPerMlPer100L: DEFAULT_SETTINGS.caPpmPerMlPer100L,
        };
        await saveKey("tank-settings", finalSettings);
        await saveKey("strengths-fixed-v1", true);
      }

      /* Test reminders exist from the start rather than needing to be created —
         the app already knows which parameters exist. Only the schedule is the
         user's to set. */
      let finalReminders = rem;
      if (!finalReminders) {
        finalReminders = REMINDER_SEED.map((x) => ({ ...x }));
        await saveKey("reminders", finalReminders);
      } else {
        /* Add anything seeded since this install was created — husbandry
           reminders arrived after the test ones — without disturbing schedules
           already customised. */
        const have = new Set(finalReminders.map((x) => x.id));
        const missing = REMINDER_SEED.filter((x) => !have.has(x.id)).map((x) => ({ ...x }));
        if (missing.length) {
          finalReminders = [...finalReminders, ...missing];
          await saveKey("reminders", finalReminders);
        }
      }
      setReminders(finalReminders);
      setKitChanges(kc || {});
      setDismissed(dis || {});
      setAlkPlan(ap || null);
      setCorrections(corr || []);
      setCaPlan(cap || null);
      setMgPlan(mgp || null);

      setReadings(finalReadings); setIcps(finalIcps); setCustomTasks(ct); setTaskLog(tl);
      setLighting(finalLighting); setCustomRanges(cr || {}); setSettings(finalSettings);
      setDoseLog(dl || []); setWaterChanges(finalWaterChanges);
      setLoaded(true);
    })();
  }, []);

  /* A restore writes to storage directly, so mirror the merged result into
     state — otherwise the screen would keep showing the pre-restore data until
     the next reload. */
  const saveReminders = async (next) => {
    setReminders(next);
    await saveKey("reminders", next);
  };

  /* Recording a replacement retires every comparison made with the old kit. */
  const replaceKit = async (paramKey, date = todayStr()) => {
    const next = { ...kitChanges, [paramKey]: date };
    setKitChanges(next);
    await saveKey("kit-changes", next);
    const def = paramDefs.find((d) => d.key === paramKey);
    notify(`${def ? def.label : "Kit"} marked as replaced`);
  };
  const undoReplaceKit = async (paramKey) => {
    const next = { ...kitChanges };
    delete next[paramKey];
    setKitChanges(next);
    await saveKey("kit-changes", next);
    notify("Replacement removed");
  };

  const dismissFinding = async (f) => {
    const prev = dismissed[findingKey(f)];
    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
    const next = { ...dismissed,
      [findingKey(f)]: { at: todayStr(), sig: findingSignature(f), times } };
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify("Hidden — it'll return if this changes");
  };
  /* A claim is put away by its own key rather than a finding id, because most
     claims are not findings — a drift or a parked pair is assembled from the
     readings themselves. */
  const dismissNote = async (c) => {
    if (!c || !c.dismissKey) return;
    /* Key and signature are stored separately: the key identifies the claim
       for as long as it exists, the signature records the situation it was put
       away in. A claim is suppressed only while the two still agree, which is
       what makes the count stable and the return meaningful. */
    const prev = dismissed[c.dismissKey];
    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
    const next = {
      ...dismissed,
      [c.dismissKey]: {
        at: todayStr(),
        sig: c.dismissSignature != null ? String(c.dismissSignature) : "",
        /* How many times this has been put off. Kept in the entry because the
           key no longer changes between snoozes, so counting keys would always
           report one. */
        times,
      },
    };
    /* Shown once rather than in front of every snooze. */
    if (c.snoozeUntilTest) next["__snooze-explained"] = todayStr();
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify(c.snoozeUntilTest
      ? "Put off \u2014 back after your next test"
      : "Hidden \u2014 it'll return if this changes");
  };
  const restoreNotes = async () => {
    setDismissed({});
    await saveKey("findings-dismissed", {});
    notify("Hidden notes restored");
  };

  const restoreFinding = async (key) => {
    const next = { ...dismissed };
    delete next[key];
    setDismissed(next);
    await saveKey("findings-dismissed", next);
    notify("Note restored");
  };
  const restoreAllFindings = async () => {
    setDismissed({});
    await saveKey("findings-dismissed", {});
    notify("All notes restored");
  };

  /* Setting the dose from the assessment records it as a dose change, so the
     protocol restarts its window and will hold for 48 hours before advising
     again — exactly as it would if the change had been entered by hand. */
  /* Applying a dose does three things at once, which is what makes this a loop
     rather than a calculator: it records the change so the protocol restarts
     its window, it remembers where the staged correction is heading, and it
     pins the alkalinity test that will judge the new dose so it appears on the
     dashboard when it is actually due. */
  const applyAlkDose = (ml, meta = {}) => applyDoseChange("alkalinity", ml, meta);

  /* Adopting the solved strength updates the one number every dose figure
     depends on. */
  /* Calcium mirrors alkalinity exactly: apply a dose, remember the plan, pin
     the test that judges it — only on a weekly rhythm rather than a 48-hour
     one, because that is how fast calcium actually moves. */
  /* Recording a dose change, for any of the three. The date and time come from
     the sheet rather than "now", because when the doser actually changed is
     what the settling period is measured from — and people record it after the
     fact as often as at the moment. */
  const applyDoseChange = async (element, ml, meta = {}) => {
    const cfg = {
      alkalinity: { rem: "rem-alkalinity", key: "alk-plan", set: setAlkPlan, days: 2 },
      calcium:    { rem: "rem-calcium",    key: "ca-plan",  set: setCaPlan,  days: 7 },
      magnesium:  { rem: "rem-magnesium",  key: "mg-plan",  set: setMgPlan,  days: 7 },
    }[element];
    if (!cfg) return;

    const date = meta.date || todayStr();
    const time = meta.time || nowTime();
    await addDoseChange({ date, time, ml, element, note: "set from the dosing wizard" });

    const testOn = addDays(date, cfg.days);
    const nextPlan = {
      appliedDose: ml, appliedAt: `${date} ${time}`,
      target: meta.target != null ? meta.target : ml,
      stage: meta.stage || 1, stages: meta.stages || 1,
      nextTestAt: testOn, nextTestTime: time,
    };
    cfg.set(nextPlan);
    await saveKey(cfg.key, nextPlan);
    await saveReminders(reminders.map((r) => (r.id === cfg.rem
      ? { ...r, dueOverride: testOn, dueTime: time, dueReason: "dose", adjustDays: 0 } : r)));

    /* What this dose should do, so the next reading confirms it or doesn't.
       Uses the dose actually entered, not the one suggested. */
    const def = paramDefs.find((d) => d.key === element);
    const effect = meta.effectPerMl;
    const cons = meta.consumption;
    let perDay = null, expected = null;
    if (isFinite(effect) && isFinite(cons) && meta.currentValue != null) {
      perDay = ml * effect - cons;
      expected = meta.currentValue + perDay * cfg.days;
    }
    setDoseResult({
      at: Date.now(), def, from: meta.fromDose, to: ml, date, time,
      testOn, days: cfg.days, perDay, expected,
      staged: !!meta.staged, target: meta.target,
    });
  };

  const applyMgDose = (ml, meta = {}) => applyDoseChange("magnesium", ml, meta);
  const clearMgPlan = async () => {
    setMgPlan(null);
    await saveKey("mg-plan", null);
    await saveReminders(reminders.map((r) => (r.id === "rem-magnesium"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
    notify("Plan cleared");
  };
  const applyMgEffect = async (per100L) => {
    await saveSettings({ ...settings, mgPpmPerMlPer100L: per100L });
    notify(`Magnesium strength set to ${per100L} ppm/mL/100L`);
  };

  const applyCaDose = (ml, meta = {}) => applyDoseChange("calcium", ml, meta);
  const clearCaPlan = async () => {
    setCaPlan(null);
    await saveKey("ca-plan", null);
    await saveReminders(reminders.map((r) => (r.id === "rem-calcium"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
    notify("Plan cleared");
  };
  const applyCaEffect = async (per100L) => {
    await saveSettings({ ...settings, caPpmPerMlPer100L: per100L });
    notify(`Calcium strength set to ${per100L} ppm/mL/100L`);
  };

  const applyAlkEffect = async (per100L) => {
    await saveSettings({ ...settings, dkhPerMlPer100L: per100L });
    notify(`Alkalinity strength set to ${per100L} dKH/mL/100L`);
  };

  const logCorrection = async (ml, direction, element = "alkalinity") => {
    const entry = { id: uid(), date: todayStr(), time: nowTime(), element,
                    ml: direction === "down" ? -Math.abs(ml) : Math.abs(ml), direction };
    const next = [entry, ...corrections];
    setCorrections(next);
    await saveKey("corrections", next);
    /* The correction takes two to three days to deliver, so the test that
       judges it belongs after that, not tomorrow. */
    /* Calcium and magnesium take a week to show what a correction did;
       alkalinity a few days. */
    const testOn = addDays(todayStr(), element === "alkalinity" ? 3 : 7);
    const remId = element === "calcium" ? "rem-calcium"
      : element === "magnesium" ? "rem-magnesium" : "rem-alkalinity";
    const rem = reminders.map((r) => (r.id === remId
      ? { ...r, dueOverride: testOn, dueTime: nowTime(), dueReason: "correction", adjustDays: 0 } : r));
    await saveReminders(rem);
    notify(`${fmtAmount(Math.abs(ml))} mL correction logged · test ${fmtShort(testOn)}`);
  };

  const deleteCorrection = async (id) => {
    const next = corrections.filter((c) => c.id !== id);
    setCorrections(next);
    await saveKey("corrections", next);
  };

  const clearAlkPlan = async () => {
    setAlkPlan(null);
    await saveKey("alk-plan", null);
    const next = reminders.map((r) => (r.id === "rem-alkalinity"
      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r));
    await saveReminders(next);
    notify("Plan cleared");
  };

  const addReminder = async (r) => { await saveReminders([...reminders, r]); };
  const deleteReminder = async (id) => { await saveReminders(reminders.filter((r) => r.id !== id)); };

  const updateReminder = async (id, patch) => {
    await saveReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  /* Nudging shifts only the next occurrence. The one after it is scheduled from
     the actual completion, so this never permanently skews the rhythm. */
  /* Moving a task sets an explicit date rather than accumulating a relative
     offset. The old model nudged by N days, which meant the date you saw was
     the result of arithmetic you could not inspect, and editing a task that
     already had completion history did nothing at all — the due date was
     derived from the last completion and the offset was quietly ignored. */
  const setReminderDue = async (id, iso) => {
    if (!iso) return;
    await updateReminder(id, { dueOverride: iso, dueReason: "manual", adjustDays: 0 });
    const r = reminders.find((x) => x.id === id);
    notify(`${r ? r.label : "Task"} moved to ${fmtShort(iso)}`);
  };

  const setReminderInterval = async (id, days) => {
    if (!isFinite(days) || days < 1) return;
    /* Changing the rhythm also releases any one-off move, or the new interval
       would appear to do nothing until the pinned date passed. */
    await updateReminder(id, { intervalDays: days, dueOverride: null, dueReason: null });
    notify(`Now ${intervalLabel(days).toLowerCase()}`);
  };

  const skipReminder = async (id) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    const st = reminderState(r, taskLog, todayStr());
    /* Skipping moves to the next occurrence rather than marking it done, so
       the history stays honest about what was actually tested. */
    await updateReminder(id, { dueOverride: addDays(st.due, r.intervalDays), dueReason: "skipped", adjustDays: 0 });
    notify(`Skipped — next ${fmtShort(addDays(st.due, r.intervalDays))}`);
  };

  /* Kept for the existing +1 day controls. */
  const nudgeReminder = async (id, days) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    const st = reminderState(r, taskLog, todayStr());
    await setReminderDue(id, addDays(st.due, days));
  };

  const completeReminder = async (id, date = todayStr()) => {
    const entry = { id: uid(), taskId: id, date };
    const next = [entry, ...taskLog];
    setTaskLog(next);
    await saveKey("task-log", next);
    /* A completion supersedes any nudge — the next due date comes from here. */
    await updateReminder(id, { adjustDays: 0 });

    const rem = reminders.find((r) => r.id === id);
    if (rem) {
      const history = next.filter((l) => l.taskId === id)
        .map((l) => l.date).sort((a, b) => (a < b ? 1 : -1));
      setTaskResult({
        at: Date.now(), label: rem.label, date,
        intervalDays: rem.intervalDays,
        nextDue: addDays(date, rem.intervalDays),
        history,
      });
    }
  };

  const applyRestore = (merged) => {
    if (merged["readings"]) setReadings(merged["readings"]);
    if (merged["icp-tests"]) setIcps(merged["icp-tests"]);
    if (merged["water-changes"]) setWaterChanges(merged["water-changes"]);
    if (merged["dose-log"]) setDoseLog(merged["dose-log"]);
    if (merged["lighting-log"]) setLighting(merged["lighting-log"]);
    if (merged["task-log"]) setTaskLog(merged["task-log"]);
    if (merged["tasks-custom"]) setCustomTasks(merged["tasks-custom"]);
    if (merged["reminders"]) setReminders(merged["reminders"]);
    if (merged["tank-settings"]) setSettings(merged["tank-settings"]);
    if (merged["custom-ranges"]) setCustomRanges(merged["custom-ranges"]);
    if (merged["kit-changes"]) setKitChanges(merged["kit-changes"]);
    if (merged["findings-dismissed"]) setDismissed(merged["findings-dismissed"]);
  };

  /* Reminders replaced the old task list, so anything that used to look up a
     task name reads from there instead. Kept under the same name so the CSV
     export and due-list code didn't need rewriting. */
  const allTasks = useMemo(
    () => reminders.map((r) => ({ id: r.id, label: r.label, freqDays: r.intervalDays, builtin: r.builtin })),
    [reminders]);

  const latestByParam = useMemo(() => {
    const map = {};
    for (const def of paramDefs) {
      const rows = readings.filter((r) => r.param === def.key).sort(byNewest);
      map[def.key] = rows[0] || null;
    }
    return map;
  }, [readings, paramDefs]);

  const [remWindow, setRemWindow] = useState(14);
  const reminderView = useMemo(
    () => computeReminders(reminders, taskLog, todayStr(), remWindow),
    [reminders, taskLog, remWindow]);

  /* The reminder engine replaced this; nothing renders it any more. */
  const dueList = [];

  /* Husbandry events overlaid on parameter charts so cause and effect is visible. */
  /* Chart markers are limited to things that happen occasionally and could
     plausibly shift a trend. Water changes and recurring tasks are weekly, so
     marking them buried the chart under a picket fence of lines that carried
     no information. */
  /* One place reasons about cross-cutting conclusions; every screen reads from
     the same pool rather than re-deriving its own view. */
  const findingsData = useMemo(
    () => buildFindings({ readings, icps, paramDefs, settings, doseLog, waterChanges, latestByParam, kitChanges }),
    [readings, icps, paramDefs, settings, doseLog, waterChanges, latestByParam, kitChanges]);
  /* Dismissal happens after the engine, not inside it: the reasoning stays
     complete and only the presentation is filtered. */
  const findings = useMemo(
    () => findingsData.findings.filter((f) => !findingHidden(f, dismissed)),
    [findingsData, dismissed]);
  const mgAssessment = useMemo(() => {
    const d = paramDefs.find((x) => x.key === "magnesium");
    if (!d) return null;
    const a = assessMagnesium({ readings, doseLog, waterChanges, settings, def: d, plan: mgPlan, corrections });
    return a ? { ...a, def: d } : null;
  }, [readings, doseLog, waterChanges, settings, paramDefs, mgPlan, corrections]);

  const caAssessment = useMemo(() => {
    const d = paramDefs.find((x) => x.key === "calcium");
    if (!d) return null;
    const a = assessCalcium({ readings, doseLog, waterChanges, settings, def: d, plan: caPlan, corrections });
    return a ? { ...a, def: d } : null;
  }, [readings, doseLog, waterChanges, settings, paramDefs, caPlan, corrections]);

  const alkAssessment = useMemo(() => {
    const def = paramDefs.find((d) => d.key === "alkalinity");
    if (!def) return null;
    const a = assessAlkalinity({ readings, doseLog, waterChanges, settings, def, plan: alkPlan, corrections });
    return a ? { ...a, def } : null;
  }, [readings, doseLog, waterChanges, settings, paramDefs, alkPlan, corrections]);

  /* One derivation, read by the summary, the dashboard cards and the parameter
     modal — so no screen can describe the dosing differently from another. */
  const doseStates = useMemo(() => {
    const today = todayStr();
    return [
      { key: "alkalinity", a: alkAssessment },
      { key: "calcium", a: caAssessment },
      { key: "magnesium", a: mgAssessment },
    ].map(({ key, a }) => {
      const d = paramDefs.find((x) => x.key === key);
      if (!d || !a) return null;
      const st = doseStatus(a, d, today);
      return st ? { ...st, key, el: d.label.toLowerCase(), def: d } : null;
    }).filter(Boolean);
  }, [alkAssessment, caAssessment, mgAssessment, paramDefs]);

  const dismissedList = useMemo(
    () => findingsData.findings.filter((f) => findingHidden(f, dismissed)),
    [findingsData, dismissed]);

  const chartEvents = useMemo(() => {
    const ev = [];
    for (const l of lighting) {
      ev.push({ date: l.date, icon: "\u2600", color: "#B8860B", kind: "Lighting", text: l.note || "Lighting change" });
    }
    for (const d of doseLog) {
      const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
      ev.push({ date: d.date, icon: "\u25C6", color: "#0B7C86", kind: "Dose",
        param: d.element || "alkalinity",
        text: `${el ? el.label : "Dose"} set to ${d.ml} mL/day` });
    }
    return ev.sort(byOldest);
  }, [lighting, doseLog]);

  const alerts = useMemo(() => {
    return paramDefs.map((def) => ({ def, reading: latestByParam[def.key] }))
      .filter(({ def, reading }) => reading && paramStatus(def, reading.value) !== "ok" && paramStatus(def, reading.value) !== "unknown");
  }, [latestByParam, paramDefs]);

  /* ---------- mutators ---------- */
  const addReading = async (row) => {
    const next = [...readings, { id: uid(), ...row }];
    setReadings(next); await saveKey("readings", next);
    /* Recording the reading IS the completion — there is no second tick to
       remember, and the next one is scheduled from this date. */
    const completed = await completeLinkedReminders(row.param, row.date, "test");

    /* Hand back enough for the form to confirm what was saved and when the
       next one falls, so the outcome is visible without leaving the page. */
    const def = paramDefs.find((d) => d.key === row.param);
    const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === row.param);
    /* The previous reading lets the confirmation say something about movement
       rather than just repeating the number back. */
    const prior = readings.filter((r) => r.param === row.param)
      .sort(byNewest)[0];
    const out = {
      prev: prior ? prior.value : null,
      delta: prior ? row.value - prior.value : null,
      def, value: row.value, date: row.date,
      status: def ? paramStatus(def, row.value) : "unknown",
      nextDue: linked ? addDays(row.date, linked.intervalDays) : null,
      interval: linked ? linked.intervalDays : null,
      completed: completed && completed.length > 0,
      /* Identity for the confirmation popup: remounting on each reading is what
         stops the previous run's finished state painting for a frame. */
      at: Date.now(),
    };
    if (out.def) setLogResult(out);
    return out;
  };
  const editReading = async (id, patch) => {
    const next = readings.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setReadings(next); await saveKey("readings", next);
  };
  const deleteReading = async (id) => {
    const next = readings.filter((r) => r.id !== id);
    setReadings(next); await saveKey("readings", next);
  };
  const importHistorical = async () => {
    const existing = new Set(readings.map((r) => `${r.param}|${r.date}`));
    const additions = [];
    for (const [param, rows] of Object.entries(HISTORICAL_DATA)) {
      for (const row of rows) {
        const dedupeKey = `${param}|${row.date}`;
        if (!existing.has(dedupeKey)) {
          existing.add(dedupeKey);
          additions.push({ id: uid(), param, value: row.value, date: row.date, note: "" });
        }
      }
    }
    const next = [...readings, ...additions];
    setReadings(next); await saveKey("readings", next);
    return additions.length;
  };
  /* Shared by readings and ICP panels: mark any linked reminder done and clear
     a pending nudge, so the schedule follows what actually happened. */
  const completeLinkedReminders = async (paramKey, date, kind) => {
    const additions = autoCompletions(reminders, taskLog, paramKey, date, kind);
    if (!additions.length) return [];
    const nextLog = [...additions, ...taskLog];
    setTaskLog(nextLog);
    await saveKey("task-log", nextLog);
    const ids = new Set(additions.map((a) => a.taskId));
    const cleared = reminders.map((r) =>
      ids.has(r.id) && (r.adjustDays || r.dueOverride)
        ? { ...r, adjustDays: 0, dueOverride: null, dueTime: null, dueReason: null }
        : r);
    if (cleared.some((r, i) => r !== reminders[i])) await saveReminders(cleared);
    return additions;
  };

  const addIcp = async (row) => {
    const next = [...icps, { id: uid(), ...row }];
    setIcps(next);
    const ok = await saveKey("icp-tests", next);
    await completeLinkedReminders(null, row.date, "icp");
    /* The panel is the densest thing entered into the app; it deserves the same
       moment a single reading gets. `at` keys the popup so each one remounts. */
    setIcpResult({ ...row, at: Date.now(), priorPanels: icps });
    return ok;
  };
  const deleteIcp = async (id) => {
    const next = icps.filter((r) => r.id !== id);
    setIcps(next); await saveKey("icp-tests", next);
  };
  const addCustomTask = async (row) => {
    const next = [...customTasks, { id: uid(), builtin: false, ...row }];
    setCustomTasks(next); await saveKey("tasks-custom", next);
  };
  const deleteCustomTask = async (id) => {
    const next = customTasks.filter((t) => t.id !== id);
    setCustomTasks(next); await saveKey("tasks-custom", next);
    const nextLog = taskLog.filter((l) => l.taskId !== id);
    setTaskLog(nextLog); await saveKey("task-log", nextLog);
  };
  const markTaskDone = async (taskId, date) => {
    const next = [...taskLog, { id: uid(), taskId, date }];
    setTaskLog(next); await saveKey("task-log", next);
  };
  const addLighting = async (row) => {
    const next = [{ id: uid(), ...row }, ...lighting];
    setLighting(next); await saveKey("lighting-log", next);
  };
  const deleteLighting = async (id) => {
    const next = lighting.filter((l) => l.id !== id);
    setLighting(next); await saveKey("lighting-log", next);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center font-body">
        <div className="flex items-center gap-3 text-teal-brand font-bold text-sm">
          <Waves className="animate-pulse" size={20} /> loading reef console…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-ink font-body">
      <style>{`
        .font-display { font-family: 'Avenir Next', 'Avenir', 'Futura', 'Trebuchet MS', -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em; font-weight: 800; }
        .font-body { font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .bg-app { background-color: #F3F7F6; }
        .border-app { border-color: #E3ECEA; }
        .text-ink { color: #08191D; }
        .text-ink2 { color: #45605F; }
        .text-teal-brand { color: #0B7C86; }
        .bg-teal-brand { background-color: #0B7C86; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C7D6D3; border-radius: 4px; }
        /* iOS gives date/time inputs a large intrinsic width that ignores the
           grid column, which pushed neighbouring fields past the card edge.
           Force them to size from their container instead. */
        input[type="date"] {
          -webkit-appearance: none;
          appearance: none;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          text-align: left;
        }
        input, select, textarea { min-width: 0; max-width: 100%; box-sizing: border-box; }
        select { -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%2345605F'%20stroke-width%3D'3'%3E%3Cpath%20d%3D'M6%209l6%206%206-6'%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat; background-position: right 10px center; background-size: 14px;
          padding-right: 32px;
        }
      `}</style>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-app px-4 py-6 bg-white">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-brand flex items-center justify-center shadow-sm">
              <Waves size={17} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm text-ink leading-tight">Dan's Tank</div>
              <div className="text-[10px] text-ink2 font-bold">77L reef · Sydney</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${active ? "bg-teal-50 text-teal-brand" : "text-ink2 hover:text-ink hover:bg-app"}`}>
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto px-3 py-3 rounded-lg bg-app border border-app">
            <div className="text-[10px] text-teal-brand uppercase tracking-wide font-extrabold mb-1">Target profile</div>
            <div className="text-xs text-ink font-bold leading-relaxed">34–36 ppt · 8.5–9.5 dKH<br/>Ca 450–500 · Mg 1450–1500</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 md:px-8 max-w-6xl"
          style={{
            /* The safe-area inset is what actually protects the heading — on a
               notched phone or an installed PWA it is the difference between a
               readable title and one under the status bar, and it is zero on
               desktop where nothing overlaps. The 2.5rem that used to sit on
               top of it was defensive padding against mobile Chrome's URL bar,
               but browser chrome sits above the viewport rather than over it,
               so all it bought was a screenful of white space above every
               heading. One rem is enough to keep the title off the edge. */
            paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
          }}>
          {storageMsg && (
            <div className="mb-4 rounded-xl p-3 border-2" style={{ background: "#C4285B12", borderColor: "#C4285B55" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" color="#C4285B" />
                  <p className="text-[13px] font-bold text-ink leading-relaxed">{storageMsg}</p>
                </div>
                <button aria-label="Dismiss" onClick={() => setStorageMsg(null)} className="text-ink2 shrink-0 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
              </div>
            </div>
          )}

          <header className="md:hidden flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-brand flex items-center justify-center">
              <Waves size={16} className="text-white" />
            </div>
            <div className="font-display text-ink">Dan's Tank</div>
          </header>

          <TabErrorBoundary tabKey={tab}>
          {tab === "dashboard" && (
            <Dashboard {...{ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
              customRanges, chartEvents, settings, doseLog, waterChanges, findings, icps,
              reminderView, remWindow, setRemWindow, doseStates }}
              onOpenTest={openTestFor}
              onCompleteReminder={completeReminder}
              onNudgeReminder={nudgeReminder}
              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
              onSkipReminder={skipReminder} onUpdateReminder={updateReminder}
              onAddReading={addReading} reminders={reminders} taskLog={taskLog}
              onGoTab={(t) => setTab(t)}
              allFindings={findingsData.findings}
              dismissedNotes={dismissed}
              onDismissNote={dismissNote} onRestoreNotes={restoreNotes}
              onOpenParam={setModalParam} />
          )}
          {tab === "log" && (
            <WaterLog readings={readings} onAdd={addReading} onDelete={deleteReading}
              onImportHistorical={importHistorical} paramDefs={paramDefs} chartEvents={chartEvents}
              icps={icps} onAddIcp={addIcp} onDeleteIcp={deleteIcp} onEdit={editReading} prefill={testPrefill}
              onOpenParam={setModalParam} reminders={reminders} reminderView={reminderView} />
          )}
          {tab === "dosing" && (
            <DosingWizard paramDefs={paramDefs}
              alkAssessment={alkAssessment} caAssessment={caAssessment} mgAssessment={mgAssessment}
              findings={findings} onDismissFinding={dismissFinding}
              onApplyAlkDose={applyAlkDose} onApplyCaDose={applyCaDose} onApplyMgDose={applyMgDose}
              onClearAlkPlan={clearAlkPlan} onClearCaPlan={clearCaPlan} onClearMgPlan={clearMgPlan}
              onLogCorrection={logCorrection}
              onApplyEffect={applyAlkEffect} onApplyCaEffect={applyCaEffect} onApplyMgEffect={applyMgEffect} />
          )}
          {tab === "insights" && (
            <Insights readings={readings} icps={icps} paramDefs={paramDefs}
              settings={settings} latestByParam={latestByParam}
              doseLog={doseLog} waterChanges={waterChanges} lighting={lighting} findings={findings}
              onSaveSettings={saveSettings} onSaveRange={saveRange}
              kitChanges={kitChanges} onReplaceKit={replaceKit} onUndoReplaceKit={undoReplaceKit}
              onDismissFinding={dismissFinding} onApplyAlkDose={applyAlkDose}
              alkPlan={alkPlan} onClearAlkPlan={clearAlkPlan}
              corrections={corrections} onLogCorrection={logCorrection}
              onApplyEffect={applyAlkEffect}
              onApplyCaDose={applyCaDose} onApplyCaEffect={applyCaEffect}
              caPlan={caPlan} onClearCaPlan={clearCaPlan}
              onApplyMgDose={applyMgDose} onApplyMgEffect={applyMgEffect}
              mgPlan={mgPlan} onClearMgPlan={clearMgPlan} />
          )}
          {tab === "tasks" && (
            <Tasks allTasks={allTasks} taskLog={taskLog} onAddCustom={addCustomTask}
              onDeleteCustom={deleteCustomTask} onMarkDone={completeReminder}
              onAddWaterChange={addWaterChange} waterChanges={waterChanges}
              settings={settings} latestByParam={latestByParam}
              paramDefs={paramDefs} onDeleteWaterChange={deleteWaterChange}
              reminders={reminders} reminderView={reminderView} onUpdateReminder={updateReminder}
              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
              onSkipReminder={skipReminder}
              onNudgeReminder={nudgeReminder} onAddReminder={addReminder}
              onDeleteReminder={deleteReminder} onOpenTest={openTestFor} />
          )}
          {tab === "setup" && (
            <Setup settings={settings} onSaveSettings={saveSettings} paramDefs={paramDefs}
              latestByParam={latestByParam} readings={readings}
              doseLog={doseLog} onAddDoseChange={addDoseChange} onDeleteDoseChange={deleteDoseChange}
              waterChanges={waterChanges} icps={icps} lighting={lighting}
              taskLog={taskLog} allTasks={allTasks}
              onAddLighting={addLighting} onDeleteLighting={deleteLighting}
              customTasks={customTasks} onRestored={applyRestore}
              onPlayIntro={() => setSplash(true)}
              dismissedList={dismissedList} onRestoreFinding={restoreFinding}
              onRestoreAllFindings={restoreAllFindings} />
          )}
          </TabErrorBoundary>

          <DoseChangePopup result={doseResult} onClose={() => setDoseResult(null)} />
          <LogResultPopup key={logResult ? logResult.at : "none"} result={logResult}
            onClose={() => setLogResult(null)} readings={readings} />
          <IcpResultPopup key={icpResult ? "icp" + icpResult.at : "icpnone"} result={icpResult}
            onClose={() => setIcpResult(null)} icps={icpResult ? icpResult.priorPanels : []} />
          <TaskDonePopup key={taskResult ? "task" + taskResult.at : "tasknone"} result={taskResult}
            onClose={() => setTaskResult(null)} />
          <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
          {splash && <LaunchSplash onDone={() => setSplash(false)} />}

          {modalParam && (
            <ParamHistoryModal def={paramDefs.find((d) => d.key === modalParam)} readings={readings}
              onClose={() => setModalParam(null)} onSaveRange={saveRange} onResetRange={resetRange}
              isCustom={!!customRanges[modalParam]} chartEvents={chartEvents} settings={settings}
              doseLog={doseLog} paramDefs={paramDefs} waterChanges={waterChanges} findings={findings}
              onAddReading={addReading} reminders={reminders} onDismissFinding={dismissFinding}
              dose={(doseStates || []).find((d) => d.key === modalParam) || null}
              onGoDosing={() => { setModalParam(null); setTab("dosing"); }} />
          )}
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-app flex justify-around py-2 z-20 shadow-[0_-1px_6px_rgba(15,40,45,0.06)]"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-lg active:bg-app">
              <Icon size={18} className={active ? "text-teal-brand" : "text-ink2"} />
              <span className={`text-[9px] font-bold ${active ? "text-teal-brand" : "text-ink2"}`}>{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------------------------- Dashboard ---------------------------------- */

function Dashboard({ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
  customRanges, chartEvents, settings, doseLog, waterChanges, findings = [], icps = [],
  reminderView, onOpenParam, onOpenTest, onCompleteReminder, onNudgeReminder,
  remWindow = 14, setRemWindow = () => {},
  onSetReminderDue, onSetReminderInterval, onSkipReminder, onUpdateReminder,
  onGoTab, onDismissNote, onRestoreNotes, dismissedNotes = {}, allFindings = null,
  onAddReading = null, reminders = [], taskLog = [], doseStates = [] }) {
  const overview = useMemo(
    () => buildOverview(readings, latestByParam, paramDefs, findings, doseStates),
    [readings, latestByParam, paramDefs, findings, doseStates]);

  const briefing = useMemo(
    () => buildBriefing(readings, latestByParam, paramDefs,
      allFindings || findings, doseStates, { dismissed: dismissedNotes }),
    [readings, latestByParam, paramDefs, allFindings, findings, doseStates, dismissedNotes]);

  /* How many of the claims this tank would produce are currently put away.
     Recomputed from the live data rather than counted from storage, so a note
     whose numbers have moved on is not reported as still hidden. */
  /* Three snoozes of the same dose suggestion says the target is wrong rather
     than the advice. Counted from the stored keys, which carry the parameter. */
  const snoozeHint = useMemo(() => {
    return Object.entries(dismissedNotes || {}).some(([k, e]) =>
      k.startsWith("dose|") && e && typeof e === "object" && (e.times || 0) >= 3);
  }, [dismissedNotes]);

  /* Reported by the engine that did the hiding, rather than recomputed here
     from a differently-built list — the two disagreed whenever putting one
     claim away changed what another claim said. */
  const hiddenNotes = briefing.hiddenCount || 0;

  const scoreEx = useMemo(
    () => explainScore(readings, latestByParam, paramDefs, overview.score),
    [readings, latestByParam, paramDefs, overview.score]);

  /* A claim knows where it can be acted on; this is the only place that knows
     how to get there. */
  const goTo = (dest) => {
    if (!dest) return;
    if (dest.tab === "param") onOpenParam(dest.key);
    else if (onGoTab) onGoTab(dest.tab, dest.key);
  };

  /* The last 30 days of each parameter, so the gauge can show where it has been
     rather than only where it is. */
  const [calOpen, setCalOpen] = useState(false);
  const [snoozing, setSnoozing] = useState(null);

  /* How many times this parameter's suggestion has already been put off. */
  const snoozeCountFor = (key) => {
    const e = (dismissedNotes || {})[`dose|${key}`];
    return e && typeof e === "object" && e.times ? e.times : 0;
  };

  /* The sheet appears the first time, and again once putting this off has
     become a habit. Everywhere else the snooze is immediate — a dialog in
     front of a cheap, reversible action only teaches people to dismiss
     dialogs without reading them. */
  const requestDismiss = (c) => {
    const explained = !!(dismissedNotes || {})["__snooze-explained"];
    const el = c.dismissKey && c.dismissKey.startsWith("dose|") ? c.dismissKey.split("|")[1] : null;
    const count = el ? snoozeCountFor(el) : 0;
    if (c.snoozeUntilTest && (!explained || count >= 2)) setSnoozing({ claim: c, count, el });
    else onDismissNote(c);
  };

  /* A short tail per parameter for the card sparklines — computed once here
     rather than filtering the whole log inside each of eight cards. */
  const sparkRowsByParam = useMemo(() => {
    const m = {};
    for (const d of paramDefs) {
      m[d.key] = readings.filter((r) => r.param === d.key).sort(byOldest).slice(-14);
    }
    return m;
  }, [readings, paramDefs]);

  const recentRangeByParam = useMemo(() => {
    const out = {};
    for (const def of paramDefs) {
      const rows = windowRows(readings, def.key, 30);
      if (rows.length < 2) { out[def.key] = null; continue; }
      const vals = rows.map((r) => r.value);
      out[def.key] = { lo: Math.min(...vals), hi: Math.max(...vals), n: vals.length };
    }
    return out;
  }, [readings, paramDefs]);

  const stabilityByParam = useMemo(() => {
    const map = {};
    for (const def of paramDefs) map[def.key] = computeStability(def, readings);
    return map;
  }, [readings, paramDefs]);
  /* The same reschedule sheet the Tasks tab uses, so a task seen on the
     dashboard calendar can be moved without navigating away. */
  const [sheetId, setSheetId] = useState(null);
  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;

  return (
    <div>
      <SectionTitle eyebrow="Reef status" title="Dashboard" />

      <OverviewCard overview={overview} scoreEx={scoreEx} onOpenParam={onOpenParam}
        claims={briefing} readings={readings} paramDefs={paramDefs} onGoTo={goTo}
        onDismissNote={requestDismiss} hiddenCount={hiddenNotes} onRestoreNotes={onRestoreNotes}
        snoozeHint={snoozeHint} />

      {/* Directly after the assessment: only what needs doing now. */}
      <TodayPanel view={reminderView} onOpenTest={onOpenTest}
        onComplete={onCompleteReminder} onNudge={onNudgeReminder} onPickTask={setSheetId}
        paramDefs={paramDefs} onAddReading={onAddReading} />

      {alerts.length > 0 && (
        <Card className="p-4 mb-6 border-rose-300">
          <div className="flex items-center gap-2 mb-2 text-rose-800 text-sm font-extrabold">
            <AlertTriangle size={16} /> Out of range
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map(({ def, reading }) => (
              <span key={def.key} className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                {def.label}: {reading.value}{def.unit} ({paramStatus(def, reading.value)})
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Cards vary in height — some have a findings badge, some have no data at
          all — so the grid items stretch and each card fills its cell. The date
          is pushed to the bottom so it sits on one line across the row rather
          than floating wherever the content above happens to end. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8 items-stretch">
        {paramDefs.map((def) => {
          const reading = latestByParam[def.key];
          return (
            <ParamCard key={def.key} def={def} reading={reading}
              recent={recentRangeByParam[def.key]}
              stab={stabilityByParam[def.key]}
              findings={findingsFor(findings, def.key)}
              rows={sparkRowsByParam[def.key]}
              dose={(doseStates || []).find((d) => d.key === def.key) || null}
              onLog={onOpenTest}
              onOpen={() => onOpenParam(def.key)} />
          );
        })}
      </div>

      <SectionTitle eyebrow="Schedule" title="Reminders" />
      <RemindersPanel view={reminderView} windowDays={remWindow} setWindowDays={setRemWindow}
        onOpenTest={onOpenTest} onComplete={onCompleteReminder} onNudge={onNudgeReminder}
        onOpenCalendar={() => setCalOpen(true)} />

      {calOpen && (
        <CalendarModal taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
          onPickTask={setSheetId}
          onClose={() => setCalOpen(false)} />
      )}

      {snoozing && (
        <SnoozeSheet
          claim={snoozing.claim.claim}
          param={snoozing.el || "this"}
          count={snoozing.count}
          onCancel={() => setSnoozing(null)}
          onConfirm={() => { onDismissNote(snoozing.claim); setSnoozing(null); }}
          onOpenTargets={snoozing.el ? () => { setSnoozing(null); onOpenParam(snoozing.el); } : null} />
      )}

      {sheetRem && (
        <ReminderSheet rem={sheetRem} state={sheetState} onClose={() => setSheetId(null)}
          onSetDue={(id, d) => { onSetReminderDue(id, d); setSheetId(null); }}
          onSetInterval={(id, n) => { onSetReminderInterval(id, n); setSheetId(null); }}
          onComplete={(id) => { onCompleteReminder(id); setSheetId(null); }}
          onSkip={(id) => { onSkipReminder(id); setSheetId(null); }}
          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); setSheetId(null); }} />
      )}

    </div>
  );
}

function ParamHistoryModal({ def, readings, onClose, onSaveRange, onResetRange, isCustom, chartEvents = [], settings = DEFAULT_SETTINGS, doseLog = [], paramDefs = [], waterChanges = [], findings = [], onAddReading = null, reminders = [], onDismissFinding = null, dose = null, onGoDosing = null }) {
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal] = useState(String(def.min));
  const [maxVal, setMaxVal] = useState(String(def.max));
  const [rangeMsg, setRangeMsg] = useState("");

  useEffect(() => { setMinVal(String(def.min)); setMaxVal(String(def.max)); }, [def.min, def.max]);

  const commitRange = async () => {
    const lo = parseFloat(minVal), hi = parseFloat(maxVal);
    if (isNaN(lo) || isNaN(hi)) { setRangeMsg("Enter two numbers."); return; }
    if (lo >= hi) { setRangeMsg("Minimum must be below maximum."); return; }
    await onSaveRange(def.key, lo, hi);
    setRangeMsg("Target range updated.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const revert = async () => {
    await onResetRange(def.key);
    setRangeMsg("Reverted to default range.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const [winDays, setWinDays] = useState(null);

  const allRows = useMemo(() =>
    readings.filter((r) => r.param === def.key).sort(byOldest),
  [readings, def.key]);

  /* Frequently-tested parameters get a 7-day view instead of 180d — alkalinity
     is often tested several times a week, and "All" still covers the long view.
     Keeping four buttons means the strip layout never changes. */
  const WINDOWS = (def.freqDays && def.freqDays <= 3)
    ? [[7, "7d"], [30, "30d"], [90, "90d"], [99999, "All"]]
    : [[30, "30d"], [90, "90d"], [180, "180d"], [99999, "All"]];

  /* One engine, one verdict per window. Showing every window at once means
     "tight recently, wide historically" reads as a single coherent story
     rather than two boxes appearing to disagree. */
  const windowStats = useMemo(
    () => WINDOWS.map(([d, label]) => ({
      days: d, label,
      c: computeControl(def, readings, d >= 99999 ? 100000 : d),
    })),
    [def, readings]);

  /* Open on the shortest window that has enough readings to judge. Testing
     cadence changes over time, so a fixed default can land on an empty view. */
  const defaultWin = useMemo(() => {
    const usable = windowStats.find((w) => w.c);
    return usable ? usable.days : WINDOWS[1][0];
  }, [windowStats]);

  /* Collapsed by default so changing the window shows the bars and the chart
     react, rather than pushing them below prose you've already read. */
  const [detailOpen, setDetailOpen] = useState(false);
  const activeWin = winDays == null ? defaultWin : winDays;
  const winLabel = activeWin >= 99999 ? "your whole log"
    : activeWin === 7 ? "the last 7 days"
    : `the last ${activeWin} days`;

  useEffect(() => { setWinDays(null); }, [def.key]);

  // Everything below is scoped to the selected window so the stats, the chart
  // and the verdict all describe the same slice of time.
  const rows = useMemo(() => {
    if (activeWin >= 99999) return allRows;
    const cutoff = addDaysFromToday(-activeWin);
    return allRows.filter((r) => r.date >= cutoff);
  }, [allRows, activeWin]);


  const control = useMemo(
    () => computeControl(def, readings, activeWin >= 99999 ? 100000 : activeWin),
    [def, readings, activeWin]);

  const rates = useMemo(
    () => computeRates(def, readings, activeWin >= 99999 ? 100000 : activeWin),
    [def, readings, activeWin]);

  const consumption = useMemo(
    () => (def.key === "alkalinity" ? computeConsumption(readings, settings) : null),
    [def.key, readings, settings]);

  const elementUse = useMemo(
    () => (CONSUMPTION_RULES[def.key]
      ? computeElementConsumption(def.key, readings, waterChanges, settings)
      : null),
    [def.key, readings, waterChanges, settings]);

  const doseAdvice = useMemo(
    () => (DOSE_ADVICE_RULES[def.key]
      ? computeDoseAdvice(readings, doseLog, paramDefs.length ? paramDefs : [def],
          activeWin >= 99999 ? 100000 : activeWin, settings)
      : null),
    [def, readings, doseLog, paramDefs, settings, activeWin]);

  /* Dose markers are tagged with their element, so a calcium doser change
     doesn't clutter the alkalinity chart. Untagged events (water changes,
     lighting, ICP) remain relevant to every parameter. */
  const relevantEvents = useMemo(
    () => chartEvents.filter((ev) => !ev.param || ev.param === def.key),
    [chartEvents, def.key]);

  /* When a day holds more than one reading, label by time so the two points
     are distinguishable rather than both reading "10 Aug". */
  const perDay = {};
  for (const r of rows) perDay[r.date] = (perDay[r.date] || 0) + 1;
  const chartData = rows.map((r) => ({
    label: perDay[r.date] > 1 && fmtTime(r.time) ? `${fmtShort(r.date)} ${fmtTime(r.time)}` : fmtShort(r.date),
    value: r.value, date: r.date, time: r.time,
  }));
  const values = rows.map((r) => r.value);
  const latest = rows[rows.length - 1];
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <Card className="p-5 max-h-[85vh] overflow-y-auto">
          {/* Whatever the dosing wizard currently believes about this element,
              said here too — the dashboard was previously silent about a change
              the user had made minutes earlier. */}
          {dose && dose.state !== "idle" && (
            <div className="rounded-xl p-3 mb-4"
              style={{ background: dose.tone + "10", border: `1px solid ${dose.tone}33` }}>
              <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1"
                style={{ color: dose.tone }}>
                {dose.state === "settling" ? "Dose change settling"
                  : dose.state === "due" ? "Waiting on a test"
                  : dose.state === "worked" ? "Dose change complete"
                  : dose.state === "fell-short" ? "Change didn't go far enough"
                  : dose.state === "overshot" ? "Change went too far"
                  : dose.state === "blocked" ? "Setup problem"
                  /* Steady-but-out-of-range is not a dose suggestion; labelling
                     it as one contradicted the text underneath, which says the
                     dose is right and the level is not. */
                  : dose.state === "off-target" ? "Level, not dose"
                  : "Dose suggestion"}
                {dose.stages > 1 ? ` · step ${dose.stage} of ${dose.stages}` : ""}
              </div>
              <div className="text-[13px] font-black text-ink mb-1">{dose.headline}</div>
              <p className="text-[12px] text-ink font-medium leading-relaxed">{dose.detail}</p>
              {dose.testOn && (
                <p className="text-[12px] font-black mt-1.5" style={{ color: dose.tone }}>
                  Next {def.label.toLowerCase()} test {fmtFriendly(dose.testOn)}
                  {dose.expected != null ? ` — expect around ${fmtVal(def, dose.expected)}${def.unit}` : ""}
                </p>
              )}
              {onGoDosing && (
                <button onClick={onGoDosing}
                  className="mt-2 text-[11px] font-extrabold" style={{ color: dose.tone }}>
                  Open the dosing wizard →
                </button>
              )}
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
              <h2 className="text-2xl font-display text-ink">{def.label}</h2>
              <div className="text-[11px] text-ink2 font-bold mt-0.5">
                target {def.min}–{def.max}{def.unit} · {rows.length} of {allRows.length} readings
                {isCustom && <span className="ml-1 text-teal-brand">· custom</span>}
              </div>
              <button onClick={() => setEditing((v) => !v)} className="mt-1.5 text-[11px] font-extrabold text-teal-brand flex items-center gap-1">
                <Settings2 size={12} /> {editing ? "Cancel" : "Edit target range"}
              </button>
            </div>
            <button aria-label="Close" onClick={onClose} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={22} /></button>
          </div>

          {editing && (
            <div className="rounded-xl bg-app border border-app p-3 mb-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Set target range ({def.unit || "value"})</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Minimum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={minVal} onChange={(e) => setMinVal(e.target.value)} className={inputCls} />
                </label>
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Maximum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={maxVal} onChange={(e) => setMaxVal(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Btn onClick={commitRange} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span></Btn>
                {isCustom && <Btn variant="ghost" onClick={revert} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Default</span></Btn>}
              </div>
              <p className="text-[11px] text-ink2 font-medium mt-2">
                Changing this updates the in-range check, the dashboard gauge, and the shaded band on the chart. Stability scoring is unaffected — it measures how fast values move, not where they sit.
              </p>
            </div>
          )}

          {rangeMsg && <div className="text-[11px] font-extrabold text-teal-brand mb-3">{rangeMsg}</div>}

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold text-ink2 mb-1.5">
              Movement by period · tap to view
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {windowStats.map(({ days, label, c }) => {
                const active = activeWin === days;
                const dot = c ? c.consistencyColor : "#C7D6D3";
                return (
                  <button key={label} onClick={() => setWinDays(days)}
                    className={`text-left px-2.5 py-2 rounded-xl border-2 transition-colors ${
                      active ? "border-teal-brand bg-teal-50" : "border-app bg-white"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                      <span className={`text-[11px] font-extrabold ${active ? "text-teal-brand" : "text-ink"}`}>{label}</span>
                    </div>
                    <div className="text-[11px] font-bold text-ink mt-0.5 truncate">
                      {c ? c.metricLabel : "no data"}
                    </div>
                    <div className="text-[10px] font-semibold text-ink2">
                      {c ? `${c.pct}% in target` : "\u2014"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-ink2 font-semibold text-sm">No readings for {def.label.toLowerCase()} in this window</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Latest</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{latest.value}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Min</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, min)}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Max</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, max)}{def.unit}</div>
                </div>
                <div className="text-center min-w-0">
                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Median</div>
                  <div className="text-lg font-black text-ink mt-0.5 truncate">
                    {fmtVal(def, control ? control.p50 : avg)}{def.unit}
                  </div>
                </div>
              </div>

              {control && (
                <div className="rounded-xl p-3 mb-4" style={{ background: control.tone + "12", border: `1px solid ${control.tone}40` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: control.tone }}>
                      {control.headline}
                    </span>
                    <span className="text-[12px] font-black text-ink">
                      usually {fmtVal(def, control.p05)}–{fmtVal(def, control.p95)}{def.unit}
                    </span>
                  </div>

                  {/* Where testing is frequent enough, the rate measures replace the
                      spread row — a spread cannot tell a slow climb from a bounce. */}
                  {rates && rates.daily ? (
                    <>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Day to day</span>
                        <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${(rates.daily.grade === "good" ? 1 : rates.daily.grade === "ok" ? 0.55 : 0.2) * 100}%`,
                                     background: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#D98324" : "#C4285B" }} />
                        </div>
                        <span className="text-[10px] font-bold w-24 text-right shrink-0"
                          style={{ color: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#D98324" : "#C4285B" }}>
                          {rates.daily.value.toFixed(rates.rr.dp)} {rates.rr.unit}/day
                        </span>
                      </div>
                      {rates.weekly && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Weekly drift</span>
                          <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${(rates.weekly.grade === "good" ? 1 : rates.weekly.grade === "ok" ? 0.55 : 0.2) * 100}%`,
                                       background: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#D98324" : "#C4285B" }} />
                          </div>
                          <span className="text-[10px] font-bold w-24 text-right shrink-0"
                            style={{ color: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#D98324" : "#C4285B" }}>
                            {rates.weekly.value > 0 ? "+" : ""}{rates.weekly.value.toFixed(rates.rr.dp)} {rates.rr.unit}/wk
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
                      <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${control.consistencyScore * 100}%`, background: control.consistencyColor }} />
                      </div>
                      <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: control.consistencyColor }}>{control.metricLabel || control.consistency}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In target</span>
                    <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${control.pct}%`, background: control.pct >= 85 ? "#0B7C86" : control.consistency === "tight" ? "#1D6FA5" : "#D98324" }} />
                    </div>
                    <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{control.pct}%</span>
                  </div>
                  <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
                    {control.inRange} of {control.rows} in target{control.below > 0 && ` · ${control.below} below`}{control.above > 0 && ` · ${control.above} above`}
                  </div>


                  {/* The verdict and the bars stay visible; the explanation
                      folds away. Changing the window should show the bars and
                      the chart react, not push them off screen behind three
                      paragraphs you have already read. */}
                  <button onClick={() => setDetailOpen((v) => !v)}
                    className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t"
                    style={{ borderColor: control.tone + "26" }}>
                    <span className="text-[11px] font-extrabold" style={{ color: control.tone }}>
                      {detailOpen ? "Hide detail" : "What this means"}
                    </span>
                    {detailOpen
                      ? <ChevronUp size={12} style={{ color: control.tone }} />
                      : <ChevronDown size={12} style={{ color: control.tone }} />}
                  </button>

                  {detailOpen && (<>
                  {/* One box, both stories: where it sits, and how it is moving. */}
                  <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                    {rates && rates.daily ? rateNarrative(def, rates, winLabel) : control.note}
                    {(!rates || !rates.daily) && control.pattern && control.pattern !== "flat" &&
                      ` Across these ${control.rows} readings it is ${control.pattern}.`}
                    {control.atResolution && ` Every step was within what a ${def.label.toLowerCase()} kit can resolve, so some of this may be reading resolution rather than real movement.`}
                  </p>

                  {rates && rates.daily && (
                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                      {(() => {
                        const band = `${fmtVal(def, def.min)}\u2013${fmtVal(def, def.max)}${def.unit}`;
                        const outside = control.below + control.above;
                        const side = control.above > control.below ? "above" : "below";
                        if (!control.medianInside) {
                          return `As for where it sits, the typical reading is ${fmtVal(def, control.gap)}${def.unit} ${control.bias === "high" ? "above" : "below"} your ${band} target — so it's being held steadily, just not at the level you asked for.`;
                        }
                        if (control.pct >= 90) {
                          return `As for where it sits, that's right where you want it — ${control.inRange} of ${control.rows} readings landed inside ${band}.`;
                        }
                        if (control.pct >= 70) {
                          return `As for where it sits, the typical reading is inside ${band}, though ${outside} of ${control.rows} strayed ${side} it. Nothing dramatic, but it spends real time outside the band rather than the occasional trip.`;
                        }
                        return `As for where it sits, that's marginal — only ${control.inRange} of ${control.rows} readings landed inside ${band}, with ${outside} ${side} it. The middle of the range is inside your band, so the issue is how widely it swings rather than where it's centred.`;
                      })()}
                    </p>
                  )}

                  {control.contextNote && (
                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2 pt-2 border-t"
                       style={{ borderColor: control.tone + "33" }}>
                      {control.contextNote}
                    </p>
                  )}

                  {rates && rates.daily && (
                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
                      Guides: under {rates.rr.dailyGood} {rates.rr.unit} a day, and under {rates.rr.weeklyGood} {rates.rr.unit} of drift across a week.
                    </p>
                  )}
                  </>)}

                  {control.suggestWorth && onSaveRange && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-ink min-w-0">
                        Retarget to {fmtVal(def, control.suggested.min)}–{fmtVal(def, control.suggested.max)}{def.unit}?
                      </span>
                      <button onClick={() => onSaveRange(def.key, control.suggested.min, control.suggested.max)}
                        className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 shrink-0 bg-white"
                        style={{ color: control.tone, borderColor: control.tone + "66" }}>
                        Use this
                      </button>
                    </div>
                  )}
                </div>
              )}


              {/* Logging sits between the verdict and the chart: you read where
                  it stands, record the new reading, and see it land. */}
              {onAddReading && (
                <QuickLog def={def} onAdd={onAddReading} settings={settings} reminders={reminders} />
              )}

              {/* Chart first: the stability summary above sets up what the
                  line shows, and the callouts below interpret it. Reading a
                  verdict before seeing the data it came from was backwards. */}
              <ZoomableLineChart data={chartData} color={def.color} targetMin={def.min} targetMax={def.max} height={280} events={relevantEvents} />

              {(() => {
                const fs = findingsFor(findings, def.key);
                if (!fs.length) return null;
                return (
                  <div className="mb-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                      Worth knowing about {def.label.toLowerCase()}
                    </div>
                    <FindingList items={fs} onDismiss={onDismissFinding} />
                  </div>
                );
              })()}

              {/* The generic dose box that used to sit here has been removed.
                  It ran a different engine from the banner at the top of this
                  modal — a 30-day window against the protocol's own — and the
                  two disagreed outright: a tank steady but below range read
                  "Correction needed" at the top and "Dose looks right" here.
                  The banner says everything this did and reconciles with the
                  Dosing Wizard, so one voice is left rather than two. */}

              {elementUse && (
                <div className="rounded-xl p-3 mb-4" style={{ background: "#0B7C8610", border: "1px solid #0B7C8640" }}>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand mb-2">
                    Consumption & dosing
                  </div>

                  {elementUse.status !== "ok" ? (
                    <p className="text-[12px] text-ink font-medium leading-relaxed">
                      {elementUse.status === "tooshort"
                        ? `${def.label} moves slowly, so this needs at least ${elementUse.minDays} days of readings before a consumption figure means anything. You've got ${elementUse.spanDays} days so far.`
                        : `Log a few more ${def.label.toLowerCase()} tests and this will work out what the tank is actually using.`}
                    </p>
                  ) : !elementUse.doseConfigured ? (
                    <>
                      <p className="text-[12px] text-ink font-medium leading-relaxed">
                        Over the last {elementUse.spanDays} days your {def.label.toLowerCase()} has {Math.abs(elementUse.netChange) < (STABILITY_RULES[def.key]?.noiseFloor || 0)
                          ? "barely moved"
                          : elementUse.netChange > 0
                          ? `risen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`
                          : `fallen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}
                        {elementUse.wcCount > 0 && `, across ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"}`}.
                      </p>
                      <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1.5">
                        Enter how much {def.label.toLowerCase()} you dose each day, in Insights under Tank &amp; dosing setup, and this will turn that into an actual consumption rate.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-center min-w-0">
                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Dosing</div>
                          <div className="text-sm font-black text-ink mt-0.5 truncate">{fmtAmount(elementUse.dosePerDay)}{def.unit}/day</div>
                        </div>
                        <div className="text-center min-w-0">
                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Water changes</div>
                          <div className="text-sm font-black text-ink mt-0.5 truncate">
                            {elementUse.wcContribution >= 0 ? "+" : ""}{fmtAmount(elementUse.wcContribution)}{def.unit}
                          </div>
                        </div>
                        <div className="text-center min-w-0">
                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Consuming</div>
                          <div className="text-sm font-black mt-0.5 truncate" style={{ color: elementUse.reliable ? "#0B7C86" : "#45605F" }}>
                            {elementUse.reliable ? `${fmtAmount(elementUse.perDay)}${def.unit}/day` : "too small"}
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-ink font-medium leading-relaxed">
                        Across {elementUse.spanDays} days you dosed about {fmtAmount(elementUse.dosed)}{def.unit} in total
                        {elementUse.wcCount > 0
                          ? `, and ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"} ${elementUse.wcContribution >= 0 ? "added roughly" : "removed roughly"} another ${fmtAmount(Math.abs(elementUse.wcContribution))}${def.unit}`
                          : ``}
                        , while the tank itself {Math.abs(elementUse.netChange) < 0.005 ? "held level" : elementUse.netChange > 0 ? `rose ${fmtAmount(elementUse.netChange)}${def.unit}` : `fell ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}.
                        {" "}
                        {elementUse.reliable
                          ? `That leaves about ${fmtAmount(elementUse.perDay)}${def.unit} a day being consumed.`
                          : `The leftover is smaller than your test kit can reliably resolve, so there's no trustworthy consumption figure yet — ${def.label.toLowerCase()} demand is genuinely small at this scale.`}
                        {elementUse.sparse && ` Bear in mind your readings here average ${Math.round(elementUse.avgGap)} days apart, so this is an average across long gaps rather than a close measurement.`}
                      </p>

                      {elementUse.reliable && elementUse.perDay < 0 && (
                        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">
                          The figure came out negative, which means more is going in than the tank uses — worth easing the dose back, or it will keep climbing.
                        </p>
                      )}

                    </>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}


/* ---------------------------------- Dosing Wizard ---------------------------------- */

/* A card per element, showing the verdict before it is opened. The three sit
   side by side so the question "does anything need doing?" is answered by
   glancing at the colours, not by reading three assessments. */
function DoseElementCard({ def, a, open, onToggle }) {
  const Icon = PARAM_ICON[def.key] || Beaker;
  const act = a ? a.action : null;
  const tone = act === "implausible" ? "#C4285B"
    : act === "increase" || act === "decrease" ? "#0B7C86"
    : act === "hold" ? "#45605F" : "#8AA0A0";
  const arrow = act === "increase" ? "\u2191" : act === "decrease" ? "\u2193" : null;

  const headline = !a ? "Set up"
    : act === "implausible" ? "Check setup"
    : act === "increase" || act === "decrease"
    ? `${fmtAmount(a.currentDose)} \u2192 ${fmtAmount(a.recommendedDose)}`
    : "No change";
  const sub = !a ? "needs volume and strength"
    : act === "implausible" ? "strength looks wrong"
    : act === "increase" || act === "decrease"
    ? (a.staged ? "staged step" : "mL/day")
    : a.ok ? "dose matches use" : "more readings needed";

  /* A miniature of where the parameter sits in its band, so the card carries
     the situation as well as the verdict. */
  const pos = a && a.current && def.max > def.min
    ? Math.max(0, Math.min(1, (a.current.value - def.min) / (def.max - def.min)))
    : null;

  return (
    <button onClick={onToggle} className="w-full text-left">
      <Card className="p-3 h-full flex flex-col overflow-hidden transition-all"
        style={{ borderColor: open ? tone + "66" : undefined,
                 boxShadow: open ? `0 0 0 2px ${tone}22` : undefined }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "22" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[11px] font-black text-ink truncate flex-1 min-w-0">{def.label}</span>
          {open ? <ChevronUp size={13} className="text-ink2 shrink-0" />
                : <ChevronDown size={13} className="text-ink2 shrink-0" />}
        </div>

        <div className="flex items-baseline gap-1">
          {arrow && <span className="text-[13px] font-black" style={{ color: tone }}>{arrow}</span>}
          <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
            {headline}
          </span>
        </div>
        <div className="text-[9px] font-bold text-ink2 mt-0.5 truncate">{sub}</div>

        {pos != null && (
          <div className="mt-2">
            <div className="h-1 rounded-full relative" style={{ background: "#E9EFEE" }}>
              <div className="absolute rounded-full" style={{ left: 0, right: 0, top: 0, height: 4,
                background: def.color + "33" }} />
              <div className="absolute rounded-full"
                style={{ left: `${pos * 100}%`, top: -2, width: 4, height: 8,
                         background: STATUS_COLOR[paramStatus(def, a.current.value)] || def.color,
                         transform: "translateX(-50%)" }} />
            </div>
            <div className="text-[9px] font-bold text-ink2 mt-1 truncate">
              {fmtVal(def, a.current.value)}{def.unit}
            </div>
          </div>
        )}

        {a && a.activePlan && (
          <div className="mt-1.5 rounded px-1.5 py-0.5 inline-block"
            style={{ background: "#0B7C8618" }}>
            <span className="text-[8px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
              in progress
            </span>
          </div>
        )}
      </Card>
    </button>
  );
}

function DosingWizard({ paramDefs, alkAssessment, caAssessment, mgAssessment, findings = [],
  onDismissFinding, onApplyAlkDose, onApplyCaDose, onApplyMgDose,
  onClearAlkPlan, onClearCaPlan, onClearMgPlan,
  onLogCorrection, onApplyEffect, onApplyCaEffect, onApplyMgEffect }) {

  const items = [
    { key: "alkalinity", a: alkAssessment, apply: onApplyAlkDose, clear: onClearAlkPlan, effect: onApplyEffect },
    { key: "calcium", a: caAssessment, apply: onApplyCaDose, clear: onClearCaPlan, effect: onApplyCaEffect },
    { key: "magnesium", a: mgAssessment, apply: onApplyMgDose, clear: onClearMgPlan, effect: onApplyMgEffect },
  ];

  /* Opens on whichever element actually wants attention, so the common case
     needs no navigation at all. */
  const firstNeeding = items.find((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease"));
  const [openKey, setOpenKey] = useState(firstNeeding ? firstNeeding.key : null);

  const needing = items.filter((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease")).length;
  const active = items.find((x) => x.key === openKey);
  const activeDef = active ? paramDefs.find((d) => d.key === active.key) : null;

  return (
    <div>
      <SectionTitle eyebrow="Two-part" title="Dosing Wizard" />

      <div className="rounded-2xl p-3.5 mb-4"
        style={{ background: needing ? "#0B7C860F" : "#F3F7F6",
                 border: `1px solid ${needing ? "#0B7C8633" : "#E3ECEA"}` }}>
        <p className="text-[13px] text-ink font-medium leading-relaxed">
          {needing
            ? `${needing === 1 ? "One element looks" : `${needing} elements look`} like the dose no longer matches what the tank is using. Tap one below for the working — you set the amount yourself.`
            : "Every dose is currently matching what the tank uses. Nothing needs changing."}
        </p>
        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
          Each element is judged only on readings taken since its own dose last changed. Change one thing
          at a time, and give it the time stated before judging it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 items-stretch">
        {items.map(({ key, a }) => {
          const def = paramDefs.find((d) => d.key === key);
          if (!def) return null;
          return (
            <DoseElementCard key={key} def={def} a={a} open={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)} />
          );
        })}
      </div>

      {active && activeDef && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeDef.color }} />
            <span className="text-[15px] font-black text-ink flex-1">{activeDef.label}</span>
            <button onClick={() => setOpenKey(null)} aria-label="Close"
              className="text-ink2 p-1 -m-1"><X size={16} /></button>
          </div>
          {active.a ? (
            <AlkAssessmentBlock a={active.a} def={activeDef} onApplyDose={active.apply}
              onClearPlan={active.clear}
              onLogCorrection={onLogCorrection ? ((ml, dir) => onLogCorrection(ml, dir, active.key)) : null}
              onApplyEffect={active.effect} />
          ) : (
            <p className="text-[13px] text-ink2 font-medium leading-relaxed">
              Set your tank volume, this element's daily dose and its solution strength in Setup, and log a
              few readings — the assessment will appear here.
            </p>
          )}
          {findingsFor(findings, active.key).length > 0 && (
            <div className="mt-3">
              <FindingList items={findingsFor(findings, active.key)} compact onDismiss={onDismissFinding} />
            </div>
          )}
        </Card>
      )}

      {!active && (
        <p className="text-[12px] text-ink2 font-medium leading-relaxed text-center px-6">
          Tap any of the three above to see how its figure was reached.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------- Insights ---------------------------------- */

/* Collapsible by default in Insights: six long analysis blocks stacked open
   made the tab a very long scroll, and you generally want one of them rather
   than all of them. `summary` shows the headline finding while collapsed so
   the list is still scannable without opening anything. */
function InfoBlock({ icon: Icon, eyebrow, title, tone = "#0B7C86", children,
  collapsible = false, defaultOpen = false, summary = null }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone + "18" }}>
            <Icon size={15} style={{ color: tone }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold" style={{ color: tone }}>{eyebrow}</div>
            <div className="text-base font-black text-ink leading-tight">{title}</div>
          </div>
        </div>
        {children}
      </Card>
    );
  }

  return (
    <Card className="mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 text-left active:bg-app">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tone + "18" }}>
          <Icon size={15} style={{ color: tone }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold" style={{ color: tone }}>{eyebrow}</div>
          <div className="text-base font-black text-ink leading-tight">{title}</div>
          {!open && summary && (
            <div className="text-[11px] text-ink2 font-semibold mt-0.5 truncate">{summary}</div>
          )}
        </div>
        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: open ? tone + "18" : "transparent" }}>
          {open ? <ChevronUp size={16} style={{ color: tone }} /> : <ChevronDown size={16} className="text-ink2" />}
        </div>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="text-center min-w-0">
      <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">{label}</div>
      <div className="text-base font-black mt-0.5 truncate" style={{ color: tone || "#08191D" }}>{value}</div>
    </div>
  );
}

function Insights({ readings, icps, paramDefs, settings, latestByParam,
  doseLog = [], waterChanges = [], lighting = [], findings = [], onSaveSettings,
  onSaveRange, kitChanges = {}, onReplaceKit, onUndoReplaceKit, onDismissFinding,
  onApplyAlkDose, onLogCorrection, onApplyEffect, alkPlan = null, onClearAlkPlan, corrections = [],
  onApplyCaDose, onApplyCaEffect, caPlan = null, onClearCaPlan,
  onApplyMgDose, onApplyMgEffect, mgPlan = null, onClearMgPlan }) {

  const consumption = useMemo(() => computeConsumption(readings, settings), [readings, settings]);
  const balance = useMemo(() => computeIonicBalance(readings, settings), [readings, settings]);
  const nutrients = useMemo(() => computeNutrientRatio(readings), [readings]);
  /* Same replacement dates the findings layer uses, or this panel would keep
     showing an offset the rest of the app had already retired. */
  /* The alkalinity protocol assessment — computed here so the dose row and its
     detail read from one result rather than two engines. */
  const calibration = useMemo(
    () => computeCalibration(readings, icps, paramDefs, 7, kitChanges),
    [readings, icps, paramDefs, kitChanges]);
  const calResults = calibration.results;
  const calDiag = calibration.diagnostics;
  const [calOpen, setCalOpen] = useState(null);
  const [applyOpen, setApplyOpen] = useState(null);
  const [appliedMsg, setAppliedMsg] = useState(null);
  const icpTrends = useMemo(() => computeIcpTrends(icps), [icps]);
  const saltRows = useMemo(() => computeSaltComparison(latestByParam || {}, paramDefs), [latestByParam, paramDefs]);
  const doseAdvice = useMemo(() => computeDoseAdvice(readings, doseLog, paramDefs, 30, settings), [readings, doseLog, paramDefs, settings]);

  const demandSeries = useMemo(
    () => ["alkalinity", "calcium"]
      .map((k) => computeDemandSeries(k, readings, waterChanges, settings))
      .filter((d) => d && d.status === "ok"),
    [readings, waterChanges, settings]);

  const skeleton = useMemo(
    () => (consumption && consumption.consumption != null
      ? computeSkeletonMass(consumption.consumption, settings.volumeL || 77) : null),
    [consumption, settings.volumeL]);

  const nutrientProd = useMemo(
    () => ["nitrate", "phosphate"].map((k) => computeNutrientProduction(k, readings, waterChanges, settings)).filter(Boolean),
    [readings, waterChanges, settings]);

  const calibrations = useMemo(
    () => DOSE_ELEMENTS.map((e) => calibrateDoseStrength(e.key, readings, doseLog, waterChanges, settings)).filter(Boolean),
    [readings, doseLog, waterChanges, settings]);



  const [tirDays, setTirDays] = useState(90);
  const control = useMemo(
    () => paramDefs.map((def) => ({ def, c: computeControl(def, readings, tirDays) })).filter((x) => x.c),
    [paramDefs, readings, tirDays]);

  return (
    <div>
      <SectionTitle eyebrow="Derived analysis" title="Insights" />

      {/* --- 1. Consumption --- */}
      {/* --- Coral demand over time ---
          Deliberately NOT a dosing verdict. That call belongs to "Should you
          adjust?", which uses a short window; this is the long view of how much
          the tank consumes and whether that demand is growing. Both were
          previously giving verdicts on different windows, which read as a
          contradiction. */}
      <InfoBlock icon={Activity} eyebrow="Coral demand" title="How much your tank uses"
        collapsible
        summary={consumption && consumption.consumption != null
          ? `${consumption.consumption.toFixed(2)} dKH/day of carbonate going into skeleton`
          : "Enter your alkalinity dose to see demand"}>
        {!consumption ? (
          <p className="text-[13px] text-ink2 font-medium">Log at least three alkalinity readings in the past 30 days and this will start tracking your tank's demand.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Stat label="Dose delivers" value={consumption.dosePerDayDkh != null ? `${consumption.dosePerDayDkh.toFixed(2)} dKH/day` : "—"} />
              <Stat label="Corals consume (30d)" value={consumption.consumption != null ? `${consumption.consumption.toFixed(2)} dKH/day` : "—"} tone="#0B7C86" />
            </div>
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              {consumption.consumption != null
                ? `Averaged over the last 30 days, your corals are drawing about ${consumption.consumption.toFixed(2)} dKH a day out of the water — that's the demand your dosing has to meet, and it's the number that grows as corals grow.`
                : `Enter your daily dose in Setup and this will work out how much the corals are actually drawing down.`}
              {consumption.consumption != null && consumption.settings.volumeL &&
                ` Across ${consumption.settings.volumeL}L that's roughly ${(consumption.consumption * consumption.settings.volumeL / 100).toFixed(2)} dKH-litres of carbonate going into skeleton every day.`}
            </p>

            {consumption.demandTrend && (
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-2">
                <span className="font-black">Demand trend: </span>
                {consumption.demandTrend.direction === "rising"
                  ? `Consumption is climbing (up ${Math.abs(consumption.demandTrend.change).toFixed(3)} dKH/day across the window). That's usually coral growth, and it means your dose will need to keep creeping up to match.`
                  : consumption.demandTrend.direction === "falling"
                  ? `Consumption is falling (down ${Math.abs(consumption.demandTrend.change).toFixed(3)} dKH/day). Worth investigating — declining demand can mean corals have stopped growing, lost tissue, or that something is inhibiting calcification. Check coral appearance and magnesium.`
                  : `Consumption is steady, which suggests a mature tank with stable coral biomass.`}
              </p>
            )}

            {/* Demand over time, one chart per element the data can support. */}
            {demandSeries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
                  Demand over time
                </div>
                <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
                  Each point is consumption worked out across a rolling window, with dosing and
                  water changes accounted for. The shaded band is the uncertainty on each estimate —
                  movement inside it isn't a real change.
                </p>

                {demandSeries.map((d) => {
                  const dv = d.points.flatMap((p) => [p.lo, p.hi, p.demand]);
                  const ax = niceAxis(Math.min(...dv), Math.max(...dv));
                  return (
                    <div key={d.key} className="mb-4">
                      <div className="text-[13px] font-black text-ink mb-1.5">{d.el.label}</div>
                      {/* The same two figures alkalinity gets at the top of this
                          section, shown per element so calcium isn't left as a
                          bare chart without its context. */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Stat label="Dose delivers" value={`${fmtAmount(d.perDay)} ${d.unit}/day`} />
                        <Stat label={`Corals consume (${d.windowDays}d)`} value={`${fmtAmount(d.mean)} ${d.unit}/day`} tone="#0B7C86" />
                      </div>
                      <div style={{ height: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={d.points} margin={{ top: 5, right: 10, left: -6, bottom: 0 }}>
                            <CartesianGrid stroke="#E3ECEA" strokeDasharray="3 3" />
                            <XAxis dataKey="label" stroke="#5C7876" fontSize={10} fontWeight={600} minTickGap={20} />
                            <YAxis stroke="#5C7876" fontSize={10} fontWeight={600}
                              domain={ax.domain} ticks={ax.ticks} tickFormatter={ax.format} width={46} />
                            <Tooltip
                              contentStyle={{ background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10, fontSize: 12, fontWeight: 700 }}
                              formatter={(v, name) => [ax.formatValue(v), name === "demand" ? `${d.unit}/day` : name]} />
                            <Line type="monotone" dataKey="hi" stroke="#0B7C86" strokeWidth={1}
                              strokeOpacity={0.3} dot={false} strokeDasharray="3 3" name="upper" />
                            <Line type="monotone" dataKey="lo" stroke="#0B7C86" strokeWidth={1}
                              strokeOpacity={0.3} dot={false} strokeDasharray="3 3" name="lower" />
                            <Line type="monotone" dataKey="demand" stroke="#0B7C86" strokeWidth={2.5}
                              dot={{ r: 3 }} name="demand" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
                        {d.direction === "rising"
                          ? `Demand is climbing — up ${fmtAmount(Math.abs(d.change))} ${d.unit}/day across the period, which is more than the uncertainty can explain. That's usually corals growing, and it means the dose needs to keep pace.`
                          : d.direction === "falling"
                          ? `Demand is falling — down ${fmtAmount(Math.abs(d.change))} ${d.unit}/day, beyond what noise explains. Worth checking coral appearance: declining demand can mean growth has stalled or tissue has been lost.`
                          : `Demand has held steady across the period. Movement in the line is within the uncertainty band, so it reflects testing scatter rather than the tank changing.`}
                      </p>
                    </div>
                  );
                })}

                <p className="text-[11px] text-ink2 font-medium leading-relaxed">
                  Magnesium isn't charted here on purpose. Its consumption is roughly a tenth of
                  calcium's, while the test kit resolves to about ±15 ppm and each water change moves
                  it far more than a day's demand — the estimate swings from negative to positive
                  between windows, so a chart would show noise rather than your tank.
                </p>
              </div>
            )}

          </>
        )}
        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
          Worked out across the last 30 days. The Dosing Wizard uses a much shorter window, so its figure will differ whenever demand has shifted recently — that's the point of having both.
        </p>
      </InfoBlock>

      {/* --- 5. Control quality --- */}
      <InfoBlock icon={Gauge} eyebrow={`Last ${tirDays} days`} title="Control & alignment" tone="#1D6FA5"
        collapsible
        summary={(() => {
          if (!control.length) return "Needs more readings";
          const tight = control.filter((x) => x.c.consistency === "tight").length;
          const loose = control.filter((x) => x.c.consistency === "loose").length;
          return loose ? `${loose} parameter${loose === 1 ? "" : "s"} moving more than ideal`
            : `${tight} of ${control.length} parameters tightly held`;
        })()}>
        <div className="flex gap-1.5 mb-3">
          {[30, 90, 180].map((d) => (
            <button key={d} onClick={() => setTirDays(d)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 transition-colors ${
                tirDays === d ? "border-[#1D6FA5] text-[#1D6FA5] bg-[#1D6FA512]" : "border-app text-ink2"}`}>
              {d}d
            </button>
          ))}
        </div>

        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
          Two separate questions: how tightly does each parameter hold its own band, and does that band line up with your target? A tank can be perfectly steady and still show a low in-range score if the target is set somewhere it never goes.
        </p>

        {!control.length ? (
          <p className="text-[13px] text-ink2 font-medium">Not enough readings in this window yet.</p>
        ) : (
          <div className="space-y-4">
            {control.map(({ def, c }) => (
              <div key={def.key}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <div className="text-[14px] font-black text-ink">{def.label}</div>
                    <div className="text-[11px] font-extrabold" style={{ color: c.tone }}>{c.headline}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-black text-ink">
                      {fmtVal(def, c.p05)}–{fmtVal(def, c.p95)}{def.unit}
                    </div>
                    <div className="text-[10px] text-ink2 font-bold">usual range</div>
                  </div>
                </div>

                {/* Consistency: how tight the tank's own band is */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
                  <div className="h-2 rounded-full bg-app overflow-hidden flex-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.consistencyScore * 100}%`, background: c.consistencyColor }} />
                  </div>
                  <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: c.consistencyColor }}>{c.metricLabel || c.consistency}</span>
                </div>

                {/* Alignment: how much of that band sits inside the target */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In target</span>
                  <div className="h-2 rounded-full bg-app overflow-hidden flex-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct}%`, background: c.pct >= 85 ? "#0B7C86" : c.consistency === "tight" ? "#1D6FA5" : "#D98324" }} />
                  </div>
                  <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{c.pct}%</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
                  {c.inRange} of {c.rows} in target{c.below > 0 && ` · ${c.below} below`}{c.above > 0 && ` · ${c.above} above`}
                </div>

                <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">{c.note}</p>
                {c.contextNote && (
                  <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1.5">{c.contextNote}</p>
                )}

                {c.suggestWorth && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: "#1D6FA512" }}>
                    <div className="text-[12px] font-bold text-ink min-w-0">
                      Your tank actually runs {fmtVal(def, c.suggested.min)}–{fmtVal(def, c.suggested.max)}{def.unit}
                      <span className="text-ink2 font-semibold"> (target is {def.min}–{def.max}{def.unit})</span>
                    </div>
                    <button onClick={() => onSaveRange(def.key, c.suggested.min, c.suggested.max)}
                      className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 shrink-0"
                      style={{ color: "#1D6FA5", borderColor: "#1D6FA555" }}>
                      Use this
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
          A low in-target score with tight consistency is not a husbandry problem — it means the target needs moving. Only a loose spread genuinely indicates instability, because that is the swing corals actually feel.
        </p>
      </InfoBlock>

      {/* --- 2. Ionic balance --- */}
      <InfoBlock icon={Scale} eyebrow="Chemistry" title="Calcium & alkalinity balance" tone="#7B4FCB"
        collapsible
        summary={!balance ? "Needs more readings"
          : balance.status !== "ok" ? "Needs your dosing figures"
          : balance.verdict === "balanced" ? `Consumed in proportion (${balance.ratio.toFixed(1)} ppm per dKH)`
          : `${balance.ratio.toFixed(1)} ppm per dKH — outside the ${balance.band[0]}–${balance.band[1]} expected`}>
        {!balance ? (
          <p className="text-[13px] text-ink2 font-medium">Needs at least two alkalinity and two calcium readings in the past 60 days.</p>
        ) : balance.status !== "ok" ? (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed">{balance.note}</p>
            {balance.mgNote && (
              <p className="text-[13px] font-medium leading-relaxed mt-3 pt-3 border-t border-app"
                 style={{ color: balance.mgNote.ok ? "#08191D" : "#8A5A00" }}>{balance.mgNote.text}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Corals build skeleton from calcium and carbonate together, so calcification
              consumes both in a fixed proportion — roughly {balance.band[0]}–{balance.band[1]} ppm
              of calcium for every 1 dKH of alkalinity. If your tank consumes them in that
              proportion, coral growth explains the whole picture. If it doesn't, something
              else is at work.
            </p>

            <div className="rounded-xl p-3 mb-3 bg-app border border-app">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                What your tank consumes each day
              </div>
              <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
                Consumption is what you dose minus whatever the level drifted — measured over the last 60 days.
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink2">Alkalinity consumed</span>
                  <span className="text-[13px] font-black text-ink">{balance.alkConsumed.toFixed(2)} dKH/day</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  dosing {fmtAmount(balance.alkDose)} − drift {balance.alkSlope >= 0 ? "+" : ""}{fmtAmount(balance.alkSlope)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                  <span className="text-[12px] font-bold text-ink2">Calcium consumed</span>
                  <span className="text-[13px] font-black text-ink">{balance.caConsumed.toFixed(1)} ppm/day</span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  dosing {fmtAmount(balance.caDose)} − drift {balance.caSlope >= 0 ? "+" : ""}{fmtAmount(balance.caSlope)}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                  <span className="text-[12px] font-bold text-ink2">That's a ratio of</span>
                  <span className="text-[15px] font-black"
                    style={{ color: balance.verdict === "balanced" ? "#0B7C86" : "#D98324" }}>
                    {balance.ratio.toFixed(1)} ppm per dKH
                  </span>
                </div>
                <div className="text-[10px] text-ink2 font-semibold text-right -mt-1">
                  calcification produces {balance.band[0]}–{balance.band[1]}
                </div>
              </div>
            </div>

            <p className="text-[13px] text-ink font-medium leading-relaxed">{balance.note}</p>

            {balance.mgNote && (
              <p className="text-[13px] font-medium leading-relaxed mt-3 pt-3 border-t border-app"
                 style={{ color: balance.mgNote.ok ? "#08191D" : "#8A5A00" }}>{balance.mgNote.text}</p>
            )}

            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
              The band is a range rather than a single figure because magnesium substitutes for
              calcium in coral skeleton, which varies by species. A few other processes shift it
              too — a sulphur denitrator, or nitrate rising or falling sharply, both consume
              alkalinity without touching calcium.
            </p>
          </>
        )}
      </InfoBlock>

      {/* --- Calcium carbonate deposited --- */}
      {skeleton && (
        <InfoBlock icon={Scale} eyebrow="Growth" title="Skeleton laid down" tone="#0B7C86"
          collapsible
          summary={`about ${skeleton.gPerMonth.toFixed(0)} g of calcium carbonate a month`}>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
            Every dKH of alkalinity your tank consumes becomes calcium carbonate. Converting
            your {fmtAmount(consumption.consumption)} dKH a day across {settings.volumeL || 77}L
            gives the mass actually being deposited.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Stat label="Per week" value={`${skeleton.gPerWeek.toFixed(1)} g`} />
            <Stat label="Per month" value={`${skeleton.gPerMonth.toFixed(0)} g`} tone="#0B7C86" />
            <Stat label="Per year" value={`${skeleton.kgPerYear.toFixed(2)} kg`} />
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            That's roughly {skeleton.cm3PerMonth.toFixed(1)} cm³ of new aragonite a month. Watch this
            figure over time rather than in isolation — it should creep upward as colonies grow, and
            a sustained fall means something has stopped calcifying.
          </p>
          <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
            This is all calcium carbonate laid down, not coral alone — coralline algae, snails and
            clams, and some abiotic precipitation on heaters and pumps are included. A little
            alkalinity also goes to nitrogen cycling and magnesium incorporation, so treat it as a
            close proxy for growth rather than an exact measurement of it.
          </p>
        </InfoBlock>
      )}

      {/* --- Nutrient production --- */}
      <InfoBlock icon={Droplets} eyebrow="Nutrients" title="What your tank generates" tone="#2E8B57"
        collapsible
        summary={(() => {
          const ok = nutrientProd.filter((n) => n.status === "ok");
          if (!ok.length) return "Log a water change to measure this";
          const weak = ok.filter((n) => n.offsetPct != null && n.offsetPct < 70);
          return weak.length
            ? `water changes only partly offset ${joinList(weak.map((n) => n.def.label.toLowerCase()))}`
            : "water changes are keeping pace with production";
        })()}>

        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          Nitrate and phosphate aren't dosed — your tank makes them, from food, fish waste and
          decomposition. They only leave when you remove them. So if you know how much a water
          change took out, and how much the level moved anyway, you can work backwards to how fast
          the tank is producing them.
        </p>

        {nutrientProd.every((n) => n.status !== "ok") ? (
          <div className="rounded-xl p-3 bg-app border border-app">
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              {nutrientProd.some((n) => n.status === "nowaterchanges")
                ? `This needs at least one logged water change to work. Without knowing what came out, a steady nitrate level could mean your tank produces nothing, or that it produces plenty and your export removes exactly as much — the two look identical. Log your water changes in Tasks and this fills in after a few weeks.`
                : `Log a few more nitrate and phosphate readings and this will start measuring what your tank produces.`}
            </p>
            {nutrientProd.filter((n) => n.status === "nowaterchanges").map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-app">
                <span className="text-[12px] font-bold text-ink2">{n.def.label} over the last {n.spanDays} days</span>
                <span className="text-[12px] font-black text-ink">
                  {fmtVal(n.def, n.cStart)} → {fmtVal(n.def, n.cEnd)}{n.def.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {nutrientProd.filter((n) => n.status === "ok").map((n) => {
                const weak = n.offsetPct != null && n.offsetPct < 70;
                return (
                  <div key={n.key} className="rounded-xl p-3 bg-app border border-app">
                    <div className="text-[13px] font-black text-ink mb-2">{n.def.label}</div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-ink2">Your tank produces</span>
                        <span className="text-[13px] font-black text-ink">{fmtAmount(n.perWeek)}{n.def.unit} a week</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold text-ink2">Your water changes take out</span>
                        <span className="text-[13px] font-black text-ink">{fmtAmount(n.weeklyExport)}{n.def.unit} a week</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                        <span className="text-[12px] font-bold text-ink2">Which covers</span>
                        <span className="text-[14px] font-black" style={{ color: weak ? "#D98324" : "#0B7C86" }}>
                          {n.offsetPct != null ? `${n.offsetPct.toFixed(0)}%` : "—"}
                        </span>
                      </div>
                      {/* Always shown: where it settles if nothing else changes. */}
                      {n.equilibrium != null && (
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-app">
                          <span className="text-[12px] font-bold text-ink2">Settles at, on water changes alone</span>
                          <span className="text-[13px] font-black text-ink">{fmtVal(n.def, n.equilibrium)}{n.def.unit}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                      {n.netConsumer
                        ? `Your tank is removing ${n.def.label.toLowerCase()} faster than it generates it — export is winning. There's no settling point to quote while that holds: the level will keep falling until production and export meet, or until you ease off the export.`
                        : n.offsetPct != null && n.offsetPct >= 90
                        ? `Your water changes remove almost exactly what the tank makes, which is why ${n.def.label.toLowerCase()} sits still without you doing anything else.`
                        : n.offsetPct != null && n.offsetPct >= 70
                        ? `Water changes carry most of the load, and whatever else you run — skimmer, carbon, macroalgae — handles the remainder.`
                        : `Water changes only remove ${n.offsetPct != null ? n.offsetPct.toFixed(0) : "some"}% of what the tank makes, so something else must be taking the rest.`}
                      {n.equilibrium != null && n.cEnd < n.equilibrium * 0.85 &&
                        ` You're sitting below that settling point at ${fmtVal(n.def, n.cEnd)}${n.def.unit}, which means your other export is doing real work — if it stopped, this would climb.`}
                    </p>

                    {/* What size change would hold a chosen level — the actionable bit. */}
                    {(n.holdAtTarget || n.holdAtMid) && (
                      <div className="mt-2 pt-2 border-t border-app">
                        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                          Water change needed to hold a level
                        </div>
                        <div className="space-y-1">
                          {n.holdAtMid && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-bold text-ink2">
                                mid-range, {fmtVal(n.def, (n.def.min + n.def.max) / 2)}{n.def.unit}
                              </span>
                              <span className="text-[12px] font-black text-ink">{n.holdAtMid.toFixed(0)}L a week</span>
                            </div>
                          )}
                          {n.holdAtTarget && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-bold text-ink2">
                                top of your band, {fmtVal(n.def, n.def.max)}{n.def.unit}
                              </span>
                              <span className="text-[12px] font-black text-ink">{n.holdAtTarget.toFixed(0)}L a week</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-ink2">you currently do</span>
                            <span className="text-[12px] font-black text-teal-brand">{n.currentLitres.toFixed(0)}L a week</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">
                          {n.holdAtMid && n.currentLitres < n.holdAtMid * 0.9
                            ? `Holding ${n.def.label.toLowerCase()} mid-band on water changes alone would take ${n.holdAtMid.toFixed(0)}L a week — noticeably more than you do now. Anything below that has to come from other export.`
                            : n.holdAtMid && n.currentLitres > n.holdAtMid * 1.15
                            ? `Your current routine is more than enough to hold ${n.def.label.toLowerCase()} mid-band on water changes alone.`
                            : `Your current routine is about the right size to hold ${n.def.label.toLowerCase()} where it is.`}
                        </p>
                      </div>
                    )}

                    {n.halfLifeDays && (
                      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                        Changes to your routine take time to show: at this volume and frequency a
                        deviation halves every {n.halfLifeDays.toFixed(0)} days, so expect
                        roughly {(n.halfLifeDays * 3 / 7).toFixed(0)} weeks before a new level settles.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {(() => {
              const ok = nutrientProd.filter((n) => n.status === "ok");
              if (ok.length < 2) return null;
              const [a, b] = ok;
              if (a.offsetPct == null || b.offsetPct == null) return null;
              const gap = Math.abs(a.offsetPct - b.offsetPct);
              if (gap < 20) return null;
              const better = a.offsetPct > b.offsetPct ? a : b;
              const worse = a.offsetPct > b.offsetPct ? b : a;
              return (
                <p className="text-[13px] text-ink font-medium leading-relaxed mt-3">
                  Worth noticing the difference between them: water changes cover {better.offsetPct.toFixed(0)}% of
                  your {better.def.label.toLowerCase()} but only {worse.offsetPct.toFixed(0)}% of
                  your {worse.def.label.toLowerCase()}. That asymmetry is usually why one of them creeps
                  up while the other holds steady, and it's the reason nutrient ratios drift over time
                  even when nothing about your routine has changed.
                </p>
              );
            })()}
          </>
        )}

        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
          A water change removes a proportion of what's in the water, not a fixed amount — take out
          13% of the volume and you take out 13% of the nitrate. That's why the figure depends on
          the level at the time. This also measures production net of any other export you run, so
          adding carbon or a skimmer lowers the number even though the tank makes the same amount.
        </p>
      </InfoBlock>

      {/* --- 3. Nutrient ratio --- */}
      <InfoBlock icon={Target} eyebrow="Nutrients" title="Nitrate to phosphate ratio" tone="#2E8B57"
        collapsible
        summary={nutrients ? `${nutrients.ratio.toFixed(0)}:1 — ${nutrients.verdict}` : "Needs a nitrate and phosphate reading"}>
        {!nutrients ? (
          <p className="text-[13px] text-ink2 font-medium">Log both nitrate and phosphate to see how they balance against each other.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Nitrate" value={`${nutrients.no3} ppm`} />
              <Stat label="Phosphate" value={`${nutrients.po4} ppm`} />
              <Stat label="Ratio" value={`${nutrients.ratio.toFixed(0)}:1`}
                tone={nutrients.verdict === "balanced" ? "#0B7C86" : "#D98324"} />
            </div>
            <p className="text-[13px] text-ink font-medium leading-relaxed">{nutrients.note}</p>
          </>
        )}
      </InfoBlock>

      {/* --- Self-calibrating dose strength --- */}
      <InfoBlock icon={Calculator} eyebrow="Accuracy" title="Is your dose strength right?" tone="#D9631F"
        collapsible
        summary={(() => {
          const ok = calibrations.filter((c) => c.status === "ok");
          const off = ok.filter((c) => !c.enteredInside && !c.implausible);
          return off.length ? `${joinList(off.map((c) => c.cfg.label.toLowerCase()))} may be entered wrong`
            : ok.length ? `${ok.length} confirmed against your own data`
            : "Needs a logged dose change to check";
        })()}>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
            Every time you change a dose you run an experiment. If demand held steady across the
            change, the strength of your product is the only unknown left — so it can be solved for,
            and checked against what you entered.
          </p>
          {/* Two boxes were answering this question from two engines with
              different data requirements, so this one could report "nothing to
              check yet" while the Dosing Wizard had already solved it. The
              Wizard's answer is the one that feeds every millilitre figure, so
              it is the one to act on; this section stays for the longer
              explanation and the per-element detail. */}
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
            The Dosing Wizard runs the same check against each element's own dosing periods and is
            where you can adopt a solved figure. If the two ever read differently, follow the
            Wizard — its result is what the dose recommendations are built on.
          </p>
          {appliedMsg && (
          <div className="mb-3 rounded-lg p-2.5 flex items-start gap-2" style={{ background: "#0B7C8615" }}>
            <Check size={15} color="#0B7C86" className="shrink-0 mt-0.5" />
            <p className="text-[12px] font-bold text-ink leading-relaxed">{appliedMsg}</p>
          </div>
        )}

        {calibrations.every((c) => c.status === "nochanges") && (
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              Nothing to check yet — this needs at least one recorded dose change with a few weeks
              of readings either side. Next time you adjust a doser, record it in Setup and this
              will tell you whether the level responded by as much as your entered strength predicts.
              It's the most direct way to catch a wrong figure, since it uses your own tank rather
              than the bottle's label.
            </p>
          )}
          <div className="space-y-2">
            {calibrations.map((c) => {
              if (c.status === "ok") {
                const bad = !c.enteredInside && !c.implausible;
                return (
                  <div key={c.key} className="rounded-xl p-3" style={{ background: bad ? "#D9631F12" : "#0B7C8610" }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-black text-ink">{c.cfg.label}</span>
                      <span className="text-[12px] font-black" style={{ color: bad ? "#D9631F" : "#0B7C86" }}>
                        {bad ? "looks wrong" : c.implausible ? "inconclusive" : "confirmed"}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink2 font-semibold mb-1.5">
                      You entered {c.entered} · your data implies {c.median.toFixed(4)} ({c.range.lo.toFixed(4)}–{c.range.hi.toFixed(4)}) {c.cfg.strengthLabel}
                    </div>
                    <p className="text-[12px] text-ink font-medium leading-relaxed">
                      {c.implausible
                        ? `The estimate is ${c.ratio.toFixed(1)}x your entered figure, which is too far apart to trust — demand almost certainly shifted across the dose change rather than the number being wrong. Worth re-checking after another change.`
                        : bad
                        ? `Across ${c.estimates.length} dose change${c.estimates.length === 1 ? "" : "s"}, your tank responded as though 1 mL delivers ${c.median.toFixed(4)} ${c.cfg.strengthLabel}, not the ${c.entered} entered here. Note this doesn't mean re-mixing anything — your solution is whatever strength you made it, and this is measuring what it actually delivers. It's the figure in Setup that needs correcting.`
                        : `Across ${c.estimates.length} dose change${c.estimates.length === 1 ? "" : "s"}, the tank responded consistently with the ${c.entered} you entered. That figure is now measured rather than assumed, so the millilitre advice built on it is on solid ground.`}
                    </p>

                    {bad && (() => {
                      const pv = previewStrengthChange(c.key, +c.median.toFixed(4), readings, waterChanges, settings, paramDefs);
                      if (!pv) return null;
                      const open = applyOpen === c.key;
                      return (
                        <div className="mt-2">
                          <button onClick={() => setApplyOpen(open ? null : c.key)}
                            className="w-full rounded-lg px-3 py-2 text-left border-2 active:opacity-80"
                            style={{ borderColor: "#D9631F", background: "#fff" }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-black" style={{ color: "#D9631F" }}>
                                {open ? "Hide what this changes" : `See what changing it to ${c.median.toFixed(4)} does`}
                              </span>
                              {open ? <ChevronUp size={14} color="#D9631F" /> : <ChevronDown size={14} color="#D9631F" />}
                            </div>
                          </button>

                          {open && (
                            <div className="mt-2 rounded-lg border border-app bg-white p-3">
                              <div className="grid grid-cols-3 gap-1 mb-1 text-[10px] font-extrabold uppercase tracking-wide text-ink2">
                                <span />
                                <span className="text-right">now</span>
                                <span className="text-right">after</span>
                              </div>
                              {pv.rows.map((r, i) => (
                                <div key={i} className="grid grid-cols-3 gap-1 py-1 border-t border-app items-baseline">
                                  <span className="text-[11px] font-bold text-ink2">{r.label}</span>
                                  <span className="text-[12px] font-black text-ink2 text-right">{r.before}</span>
                                  <span className="text-[12px] font-black text-right"
                                    style={{ color: r.good === false ? "#D98324" : "#0B7C86" }}>{r.after}</span>
                                </div>
                              ))}

                              {pv.remixNote && (
                                <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2 pt-2 border-t border-app">
                                  {pv.remixNote}
                                </p>
                              )}

                              <Btn onClick={async () => {
                                await onSaveSettings({ ...settings, [pv.el.strengthField]: pv.newStrength });
                                setApplyOpen(null);
                                setAppliedMsg(`${pv.el.label} strength updated to ${pv.newStrength}. Everything below has recalculated.`);
                                setTimeout(() => setAppliedMsg(null), 6000);
                              }} className="w-full mt-3">
                                <span className="flex items-center justify-center gap-1.5">
                                  <Check size={14} /> Use {pv.newStrength} instead of {pv.oldStrength}
                                </span>
                              </Btn>
                              <p className="text-[10px] text-ink2 font-medium mt-1.5 text-center">
                                Your readings aren't touched — only the strength figure in Setup, which you can change back at any time.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              }
              if (c.status === "nodata" && c.skipped.length) {
                return (
                  <div key={c.key} className="rounded-xl p-3 bg-app">
                    <div className="text-[13px] font-black text-ink mb-1">{c.cfg.label}</div>
                    <p className="text-[12px] text-ink2 font-medium leading-relaxed">
                      Can't check this yet: {c.skipped[c.skipped.length - 1].why}.
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-3">
            This assumes your corals' demand didn't change over the three weeks either side of a
            dose change. That holds most of the time but not always, so a single odd result means
            less than a consistent one across several changes.
          </p>
      </InfoBlock>

      {/* --- 4. ICP calibration --- */}
      <InfoBlock icon={Beaker} eyebrow="Accuracy" title="Test kit calibration" tone="#D9631F"
        collapsible
        summary={calResults.length
          ? (() => {
              const off = calResults.filter((r) => Math.abs(r.meanPct) >= 5);
              return off.length ? `${off.map((r) => r.def.label.toLowerCase()).join(", ")} off by more than 5%`
                : `${calResults.length} kit${calResults.length === 1 ? "" : "s"} agree with the lab`;
            })()
          : "No paired lab comparisons yet"}>
        {!calResults.length ? (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            {calDiag.length
              ? `Your ICP panels include ${calDiag.map((d) => d.def.label.toLowerCase()).join(", ")}, but there's no hobby test within 7 days of a panel to compare against. Test those parameters close to your next ICP sample and this will fill in.`
              : `Log an ICP result and take your own tests within a week of it, and this will show how your kits compare against the lab.`}
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Comparing your own tests against lab ICP results taken within 7 days of each other. Tap a row to see the individual pairs.
            </p>
            <div className="space-y-2">
              {calResults.map((r) => {
                const open = calOpen === r.def.key;
                const off = Math.abs(r.meanPct) >= 5;
                const tone = off ? "#D9631F" : "#0B7C86";
                return (
                  <div key={r.def.key} className="rounded-xl overflow-hidden" style={{ background: "#F3F7F6" }}>
                    <button onClick={() => setCalOpen(open ? null : r.def.key)}
                      className="w-full flex items-center justify-between gap-2 p-3 text-left active:bg-app">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-black text-ink">{r.def.label}</span>
                          {open ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
                        </div>
                        <div className="text-[11px] text-ink2 font-semibold">
                          {r.n} paired comparison{r.n === 1 ? "" : "s"}
                          {r.converted && ` · lab ${r.converted.from} converted ×${r.converted.factor}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-black" style={{ color: tone }}>
                          {r.meanDiff > 0 ? "+" : ""}{Math.abs(r.meanDiff) < 1 ? r.meanDiff.toFixed(3) : r.meanDiff.toFixed(0)}{r.def.unit}
                        </div>
                        <div className="text-[11px] font-bold text-ink2">
                          reads {r.meanPct >= 0 ? "high" : "low"} {Math.abs(r.meanPct).toFixed(0)}%
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="px-3 pb-3">
                        <div className="rounded-lg bg-white border border-app divide-y divide-app">
                          {r.pairs.map((p, i) => (
                            <div key={i} className="p-2.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">
                                  Panel {fmtDate(p.date)}
                                </span>
                                <span className="text-[11px] font-bold" style={{ color: Math.abs(p.diff) > Math.abs(p.lab) * 0.05 ? "#D9631F" : "#0B7C86" }}>
                                  {p.diff > 0 ? "+" : ""}{Math.abs(p.diff) < 1 ? p.diff.toFixed(3) : p.diff.toFixed(0)}{r.def.unit}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-md p-2" style={{ background: "#0B7C860D" }}>
                                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Your test</div>
                                  <div className="text-[15px] font-black text-ink">{p.kit}{r.def.unit}</div>
                                  <div className="text-[10px] text-ink2 font-semibold">
                                    {p.gap === 0 ? "same day" : `${p.gap} day${p.gap === 1 ? "" : "s"} ${"from the panel"}`}
                                  </div>
                                </div>
                                <div className="rounded-md p-2" style={{ background: "#D9631F0D" }}>
                                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Triton lab</div>
                                  <div className="text-[15px] font-black text-ink">
                                    {Math.abs(p.lab) < 1 ? p.lab.toFixed(3) : p.lab.toFixed(0)}{r.def.unit}
                                  </div>
                                  <div className="text-[10px] text-ink2 font-semibold">
                                    {p.converted ? `from ${p.converted.raw} ${p.converted.from}` : "as reported"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Replacing the reagent is the actual fix for a kit
                            that disagrees with the lab, and nothing offered a
                            way to record it — so the warning stayed forever
                            however many kits you went through. */}
                        <div className="mt-3 rounded-lg p-3" style={{ background: "#fff", border: "1px solid #E3ECEA" }}>
                          <div className="text-[12px] font-black text-ink mb-1">Started a new kit?</div>
                          <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
                            If these comparisons were made with a kit or reagent you're no longer using,
                            record that here and they'll be retired — a new kit has to be measured against
                            the lab on its own terms. This doesn't assume anything was wrong with the old
                            one; if you're happy with the reading as it is, hide the note instead.
                          </p>
                          <Btn variant="ghost" className="w-full"
                            onClick={() => onReplaceKit && onReplaceKit(r.def.key)}>
                            <span className="flex items-center justify-center gap-1.5">
                              <RotateCcw size={13} /> New {r.def.label.toLowerCase()} kit from today
                            </span>
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Kits already marked as replaced, with a way back if mistaken. */}
            {Object.keys(kitChanges || {}).length > 0 && (
              <div className="mt-3 pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                  Kits you've replaced
                </div>
                {Object.entries(kitChanges).map(([key, date]) => {
                  const d = paramDefs.find((x) => x.key === key);
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-[12px] font-bold text-ink">
                        {d ? d.label : key} · {fmtDate(date)}
                      </span>
                      <button onClick={() => onUndoReplaceKit && onUndoReplaceKit(key)}
                        className="text-[11px] font-extrabold text-teal-brand">Undo</button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
              A consistent offset above about 5% is worth knowing — it means your target should be adjusted to match your kit, rather than chasing a number your kit cannot actually read. Small differences are normal and reflect reagent age and endpoint judgement.
            </p>
            {(() => {
              /* An offset here changes how much every other section's conclusions
                 about that parameter are worth, so say where it lands. */
              const off = findings.filter((f) => f.scope === "reading-accuracy" && f.severity !== "info");
              if (!off.length) return null;
              return (
                <div className="mt-3 pt-3 border-t border-app">
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                    What this affects elsewhere
                  </div>
                  <p className="text-[12px] text-ink font-medium leading-relaxed">
                    {joinList(off.map((f) => f.params[0]))} {off.length === 1 ? "carries" : "carry"} this
                    offset into every figure derived from {off.length === 1 ? "it" : "them"} — target
                    comparisons, trend verdicts, consumption and dose advice. Those sections now flag
                    it, but nothing is silently corrected: your recorded readings stay exactly as you
                    entered them.
                  </p>
                </div>
              );
            })()}
            {calDiag.length > 0 && (
              <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                No pairing yet for {calDiag.map((d) => d.def.label.toLowerCase()).join(", ")} — nearest hobby test was too far from a panel.
              </p>
            )}
          </>
        )}
      </InfoBlock>

      {/* --- 7. ICP trace elements --- */}
      <InfoBlock icon={Beaker} eyebrow="Trace elements" title="ICP element review" tone="#7B4FCB"
        collapsible
        summary={(() => {
          if (!icps.length) return "No ICP panels logged";
          const latest = [...icps].sort(byNewest)[0];
          const es = Object.entries(latest.elements || {}).map(([n, v]) => ({ ref: icpRef(n), st: icpStatus(icpRef(n), v) }));
          const flagged = es.filter((e) => e.ref && e.st !== "ok").length;
          const known = es.filter((e) => e.ref).length;
          return flagged ? `${flagged} of ${known} elements outside reference` : `All ${known} elements inside reference`;
        })()}>
        {!icps.length ? (
          <p className="text-[13px] text-ink2 font-medium">
            Log an ICP result with element values and this will check each one against reference ranges, then track which elements are accumulating or depleting between tests.
          </p>
        ) : (
          <>
            {(() => {
              const latest = [...icps].sort(byNewest)[0];
              const entries = Object.entries(latest.elements || {})
                .map(([n, v]) => ({ n, v, ref: icpRef(n) }))
                .map((e) => ({ ...e, st: icpStatus(e.ref, e.v) }))
                .map((e) => ({ ...e, group: icpGroupOf(e.n) }))
                .sort((a, b) => {
                  /* A detected contaminant outranks everything; then anything
                     outside its band; then the rest. */
                  const rank = (x) => (x.st === "detected" ? 0
                    : x.ref && x.ref.toxic && x.st === "high" ? 0
                    : x.st === "high" || x.st === "low" ? 1 : 2);
                  return rank(a) - rank(b);
                });
              const flagged = entries.filter((e) => e.st === "high" || e.st === "low" || e.st === "detected");
              const inRange = entries.filter((e) => e.ref && e.st === "ok");
              return (
                <>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                    Latest panel · {fmtDate(latest.date)}
                  </div>
                  <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
                    {inRange.length} of {inRange.length + flagged.length} elements measured against a Triton reference came back inside it
                    {flagged.length === 0
                      ? ". That's a clean panel."
                      : `, and ${flagged.length} ${flagged.length === 1 ? "is" : "are"} outside:`}
                  </p>
                  {flagged.length === 0 ? null : (
                    <div className="space-y-2 mb-3">
                      {flagged.map((e) => {
                        const tone = e.st === "detected" ? "#C4285B"
                          : e.ref && e.ref.toxic && e.st === "high" ? "#C4285B"
                          : e.st === "high" ? "#D98324" : "#1D6FA5";
                        return (
                          <div key={e.n} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: tone + "12" }}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-black text-ink capitalize">{e.n}</span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                  style={{ background: e.group === "contaminant" ? "#C4285B18" : "#45605F14",
                                           color: e.group === "contaminant" ? "#C4285B" : "#45605F" }}>
                                  {e.group === "contaminant" ? "contaminant" : e.group === "macro" ? "macro" : e.group === "nutrient" ? "nutrient" : "trace"}
                                </span>
                              </div>
                              <div className="text-[11px] text-ink2 font-semibold">
                                {e.ref.hi === 0
                                  ? `Triton target: zero`
                                  : e.ref.derived
                                  ? `Triton setpoint ${e.ref.setpoint} ${e.ref.unit} (±10%)`
                                  : `Triton range ${e.ref.lo}–${e.ref.hi} ${e.ref.unit}`}

                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[13px] font-black" style={{ color: tone }}>{e.v}</div>
                              <div className="text-[10px] font-extrabold uppercase" style={{ color: tone }}>{e.st}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {entries.filter((e) => !e.ref).length > 0 && (
                    <p className="text-[11px] text-ink2 font-medium mb-3">
                      No reference range on file for: {entries.filter((e) => !e.ref).map((e) => e.n).join(", ")}.
                    </p>
                  )}
                </>
              );
            })()}

            {icpTrends.length > 0 && (
              <div className="pt-3 border-t border-app">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                  Movement across {icps.length} panels
                </div>
                <div className="space-y-1.5">
                  {icpTrends.filter((t) => t.direction !== "steady").slice(0, 10).map((t) => {
                    const tone = t.direction === "accumulating" ? "#D98324" : "#1D6FA5";
                    return (
                      <div key={t.name} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-ink capitalize min-w-0 truncate">{t.name}</span>
                        <span className="text-[11px] font-extrabold shrink-0" style={{ color: tone }}>
                          {t.first} → {t.last} ({t.pctChange > 0 ? "+" : ""}{t.pctChange.toFixed(0)}%) {t.direction}
                        </span>
                      </div>
                    );
                  })}
                  {icpTrends.every((t) => t.direction === "steady") && (
                    <p className="text-[13px] text-ink font-medium">All tracked elements are holding steady between panels.</p>
                  )}
                </div>
                <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-2">
                  Elements that climb steadily between panels usually enter through salt mix, additives or equipment; ones that fall are being consumed by corals or stripped by filtration. Direction matters more than any single panel.
                </p>
              </div>
            )}
          </>
        )}
      </InfoBlock>

      {/* --- 8. Salt baseline comparison --- */}
      <InfoBlock icon={Waves} eyebrow={SALT_MIX.name} title="Tank vs fresh saltwater" tone="#1D6FA5"
        collapsible
        summary={(() => {
          if (!saltRows.length) return "Needs current readings";
          const drifted = saltRows.filter((r) => r.pct != null && Math.abs(r.pct) > 10).length;
          return drifted ? `${drifted} parameter${drifted === 1 ? "" : "s"} more than 10% off the fresh mix`
            : "Tank close to freshly mixed saltwater";
        })()}>
        {!saltRows.length ? (
          <p className="text-[13px] text-ink2 font-medium">Log some readings and this will compare your tank against freshly mixed {SALT_MIX.name}.</p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              Comparing your latest readings against {SALT_MIX.name} mixed to {SALT_MIX.salinity} ppt. A positive number means your system is running above fresh mix — either you're dosing it, or it's accumulating.
            </p>
            <div className="space-y-2">
              {saltRows.map(({ def, base, current, delta, pct }) => {
                const big = pct != null && Math.abs(pct) > 10;
                const tone = !big ? "#0B7C86" : delta > 0 ? "#D98324" : "#1D6FA5";
                return (
                  <div key={def.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-app">
                    <div className="min-w-0">
                      <div className="text-[13px] font-black text-ink">{def.label}</div>
                      <div className="text-[11px] text-ink2 font-semibold">fresh mix {base}{def.unit} · tank {current}{def.unit}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-black" style={{ color: tone }}>
                        {delta > 0 ? "+" : ""}{Math.abs(delta) < 1 ? delta.toFixed(2) : delta.toFixed(0)}{def.unit}
                      </div>
                      {pct != null && <div className="text-[10px] text-ink2 font-bold">{pct > 0 ? "+" : ""}{pct.toFixed(0)}%</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
              Note that {SALT_MIX.name} is nitrate and phosphate free, so any nutrients you measure are entirely generated by the tank — feeding and livestock — rather than carried in by water changes.
            </p>
          </>
        )}
      </InfoBlock>

    </div>
  );
}

/* ---------------------------------- Setup ---------------------------------- */

function Setup({ settings, onSaveSettings, paramDefs, latestByParam, readings,
  doseLog = [], onAddDoseChange, onDeleteDoseChange,
  waterChanges = [], icps = [], lighting = [], taskLog = [], allTasks = [],
  onAddLighting, onDeleteLighting, onRestored, onPlayIntro,
  onRestoreFinding, onRestoreAllFindings,
  customTasks = [], dismissedList = [] }) {

  const [vol, setVol] = useState(String(settings.volumeL ?? 77));
  const [backupAt, setBackupAt] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [pending, setPending] = useState(null);
  const [persistState, setPersistState] = useState(null);

  /* Ask for durable storage on arrival, and find out when the last backup was,
     so the reminder can be honest rather than nagging on every visit. */
  useEffect(() => {
    let live = true;
    (async () => {
      const p = await requestPersistence();
      if (live) setPersistState(p);
      const last = await loadKey("last-backup", null);
      if (live) setBackupAt(last);
    })();
    return () => { live = false; };
  }, []);

  const backupAge = backupAt ? daysBetween(backupAt.slice(0, 10), todayStr()) : null;
  const [elemKey, setElemKey] = useState("alkalinity");
  const elem = DOSE_ELEMENTS.find((e) => e.key === elemKey) || DOSE_ELEMENTS[0];
  const [elemDose, setElemDose] = useState("");
  const [elemStrength, setElemStrength] = useState("");
  const [showStrength, setShowStrength] = useState(false);
  const [showSigma, setShowSigma] = useState(false);
  const [sigmaVal, setSigmaVal] = useState("");
  const [saveMsg, setSaveMsg] = useState(null);
  /* Doses are often adjusted a few days before you get round to logging it,
     so the change date is editable rather than assumed to be today. */
  const [doseDate, setDoseDate] = useState(todayStr());

  useEffect(() => {
    setVol(String(settings.volumeL ?? 77));
    setElemDose(String(settings[elem.doseField] ?? 0));
    setElemStrength(String(settings[elem.strengthField] ?? elem.defaultStrength));
    setSigmaVal(String(kitSigma(elem.key, settings)));
    setSaveMsg(null);
  }, [settings, elemKey]);

  const currentDose = settings[elem.doseField] ?? 0;
  const doseNum = parseFloat(elemDose);
  const strengthNum = parseFloat(elemStrength) || 0;
  const doseChanged = !isNaN(doseNum) && doseNum !== currentDose;
  const perDayDelivered = currentDose * strengthNum * (100 / (parseFloat(vol) || 77));

  const saveVolume = async () => {
    await onSaveSettings({ ...settings, volumeL: parseFloat(vol) || 77 });
    setSaveMsg("Tank volume saved.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  /* Changing the dose is itself the event, so one action updates the setting
     and appends to that element's history. No separate "record change" step. */
  const saveDose = async () => {
    if (isNaN(doseNum)) return;
    await onAddDoseChange({ date: doseDate, ml: doseNum, element: elemKey, note: "" });
    setSaveMsg(`${elem.label} dose set to ${doseNum} mL/day, recorded for ${fmtDate(doseDate)}.`);
    setDoseDate(todayStr());
    setTimeout(() => setSaveMsg(null), 3500);
  };

  const saveSigma = async () => {
    const v = parseFloat(sigmaVal);
    if (!(v > 0)) return;
    await onSaveSettings({ ...settings, kitSigma: { ...(settings.kitSigma || {}), [elem.key]: v } });
    setSaveMsg("Kit precision saved.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const saveStrength = async () => {
    await onSaveSettings({ ...settings, [elem.strengthField]: strengthNum || elem.defaultStrength });
    setSaveMsg("Product strength saved.");
    setTimeout(() => setSaveMsg(null), 2500);
  };

  const elemLog = useMemo(
    () => doseLog.filter((d) => (d.element || "alkalinity") === elemKey)
      .sort(byNewest),
    [doseLog, elemKey]);

  // Correction calculator state
  const correctable = paramDefs.filter((d) => CORRECTIONS[d.key]);
  const [calcParam, setCalcParam] = useState(correctable[0] ? correctable[0].key : "alkalinity");
  const [calcTarget, setCalcTarget] = useState("");
  const calcDef = paramDefs.find((d) => d.key === calcParam) || correctable[0];
  const calcCurrent = latestByParam && latestByParam[calcParam] ? latestByParam[calcParam].value : null;
  const correction = useMemo(
    () => computeCorrection(calcParam, calcCurrent, parseFloat(calcTarget), settings.volumeL || 77),
    [calcParam, calcCurrent, calcTarget, settings.volumeL]);

  // Lighting log state
  const [lightDate, setLightDate] = useState(todayStr());
  const [lightNote, setLightNote] = useState("");
  const submitLighting = async (e) => {
    e.preventDefault();
    if (!lightNote.trim()) return;
    await onAddLighting({ date: lightDate, note: lightNote.trim() });
    setLightNote("");
  };

  return (
    <div>
      <SectionTitle eyebrow="Configuration" title="Setup" />

      {/* --- Tank & dosing setup --- */}
      <Card className="p-4 mb-4">
        <div className="text-sm font-black text-ink mb-1">Tank</div>
        <Field label="Volume (L)">
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" step="1" value={vol} onChange={(e) => setVol(e.target.value)} className={inputCls} />
            <Btn onClick={saveVolume} className="shrink-0">
              <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
            </Btn>
          </div>
        </Field>
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-sm font-black text-ink mb-3">Dosing</div>

        <Field label="Element">
          <select value={elemKey} onChange={(e) => setElemKey(e.target.value)} className={inputCls}>
            {DOSE_ELEMENTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
        </Field>

        {/* One field for the dose. Changing it IS the event — it records itself
            with today's date, so there's no second "new rate" box to fill in. */}
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Dose (mL/day)`}>
              <input type="number" step="0.1" inputMode="decimal" value={elemDose}
                onChange={(e) => setElemDose(e.target.value)} className={inputCls}
                placeholder="0 if not dosed" />
            </Field>
            <Field label="Date changed">
              <input type="date" value={doseDate} onChange={(e) => setDoseDate(e.target.value)}
                className={inputCls} max={todayStr()} />
            </Field>
          </div>
          <div className="mt-2">
            <Btn onClick={saveDose} disabled={!doseChanged} className="w-full sm:w-auto">
              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save dose change</span>
            </Btn>
          </div>
          {doseChanged && (
            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
              Records a change on {fmtDate(doseDate)}{currentDose > 0 ? `, from ${currentDose} to ${elemDose} mL/day` : `, starting at ${elemDose} mL/day`}.
            </p>
          )}
          {!doseChanged && currentDose > 0 && strengthNum > 0 && (
            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
              Delivering about {fmtAmount(perDayDelivered)} {elem.unit} per day to {vol}L.
            </p>
          )}
          {saveMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-1.5">{saveMsg}</p>}
        </div>

        {/* Strength is set once per product, so it stays tucked away. */}
        <button onClick={() => setShowStrength((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
            Product strength: <span className="text-ink font-black">{elemStrength} {elem.strengthLabel}</span>
          </span>
          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
            {showStrength ? "Close" : "Change"} {showStrength ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {showStrength && (
          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
            <Field label={`Strength (${elem.strengthLabel})`}>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" step={elem.strengthStep} value={elemStrength}
                  onChange={(e) => setElemStrength(e.target.value)} className={inputCls} />
                <Btn onClick={saveStrength} className="shrink-0">
                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
                </Btn>
              </div>
            </Field>
            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">{elem.hint}</p>
          </div>
        )}

        {/* Kit precision drives the testing-cadence advice */}
        <button onClick={() => setShowSigma((v) => !v)}
          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
            Test kit precision: <span className="text-ink font-black">±{kitSigma(elem.key, settings)} {elem.unit}</span>
          </span>
          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
            {showSigma ? "Close" : "Change"} {showSigma ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </button>
        {showSigma && (
          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
            <Field label={`Repeat-test spread (${elem.unit})`}>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" step="0.001" value={sigmaVal}
                  onChange={(e) => setSigmaVal(e.target.value)} className={inputCls} />
                <Btn onClick={saveSigma} className="shrink-0">
                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
                </Btn>
              </div>
            </Field>
            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">
              How much your readings vary when you test the same water twice — not how much the tank
              varies. Titration kits are typically about one drop's worth; digital checkers quote a
              figure on the box. This drives the testing-frequency advice in Insights.
            </p>
          </div>
        )}

        {/* This element's change history */}
        {elemLog.length > 0 && (
          <div className="mt-3 pt-3 border-t border-app">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
              {elem.label} changes
            </div>
            <div className="divide-y divide-app">
              {elemLog.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2">
                  <span className="text-[13px] font-bold text-ink">{d.ml} mL/day</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-ink2 font-semibold">{fmtShort(d.date)}</span>
                    <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* --- Full dosing history across all elements --- */}
      {doseLog.length > 0 && (
        <InfoBlock icon={Activity} eyebrow="History" title="Doser changes" tone="#45605F"
          collapsible
          summary={doseLog.length
            ? `${doseLog.length} change${doseLog.length === 1 ? "" : "s"} recorded`
            : "Nothing recorded yet"}>
          <div className="divide-y divide-app">
            {[...doseLog].sort(byNewest).map((d) => {
              const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
              const prior = [...doseLog]
                .filter((x) => (x.element || "alkalinity") === (d.element || "alkalinity") && x.date < d.date)
                .sort(byNewest)[0];
              const delta = prior ? d.ml - prior.ml : null;
              return (
                <div key={d.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-black text-ink">
                      {el ? el.label : "Alkalinity"} → {d.ml} mL/day
                    </div>
                    <div className="text-[11px] text-ink2 font-semibold">
                      {fmtDate(d.date)}
                      {delta != null && delta !== 0 && (
                        <span style={{ color: delta > 0 ? "#0B7C86" : "#D98324" }}>
                          {" · "}{delta > 0 ? "up" : "down"} {Math.abs(delta).toFixed(1)} mL from {prior.ml}
                        </span>
                      )}
                      {prior == null && " · first recorded"}
                    </div>
                  </div>
                  <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
            Every change here also appears as a marker on that element's own chart, so you can see what each adjustment actually did.
          </p>
        </InfoBlock>
      )}

      {/* --- 9. Correction calculator --- */}
      <InfoBlock icon={Calculator} eyebrow="Actions" title="Correction calculator" tone="#D9631F"
        collapsible
        summary="Work out a one-off dose to move a parameter">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Parameter">
            <select value={calcParam} onChange={(e) => { setCalcParam(e.target.value); setCalcTarget(""); }} className={inputCls}>
              {correctable.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </Field>
          <Field label={`Target${calcDef && calcDef.unit ? ` (${calcDef.unit})` : ""}`}>
            <input type="number" inputMode="decimal" step={calcDef ? calcDef.step : 0.1} value={calcTarget}
              onChange={(e) => setCalcTarget(e.target.value)} className={inputCls}
              placeholder={calcDef ? `${calcDef.min}–${calcDef.max}` : ""} />
          </Field>
        </div>
        {calcCurrent == null ? (
          <p className="text-[13px] text-ink2 font-medium">No current reading logged for {calcDef ? calcDef.label.toLowerCase() : "this parameter"} — log one first.</p>
        ) : !correction ? (
          <p className="text-[13px] text-ink2 font-medium">
            Currently {calcCurrent}{calcDef.unit}. Enter a target to see what it takes to get there in {settings.volumeL || 77}L.
          </p>
        ) : !correction.raising ? (
          <div className="rounded-xl p-3" style={{ background: "#1D6FA512", border: "1px solid #1D6FA540" }}>
            <p className="text-[13px] text-ink font-medium leading-relaxed">
              You're aiming to <strong>lower</strong> {calcDef.label.toLowerCase()} from {calcCurrent} to {correction.delta + calcCurrent}{calcDef.unit}. There's no additive for this — the safe route is dilution through water changes, or simply reducing dosing and letting consumption pull it down. Use the water change model below to see how much each change would move it.
            </p>
          </div>
        ) : (
          <div className="rounded-xl p-3" style={{ background: "#D9631F12", border: "1px solid #D9631F40" }}>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
              Raising {calcDef.label.toLowerCase()} by {correction.delta.toFixed(correction.delta < 1 ? 2 : 0)}{correction.unit} in {settings.volumeL || 77}L.
              {correction.days > 1
                ? ` That exceeds the safe change of ${correction.maxPerDay}${correction.unit} per day, so spread it over ${correction.days} days.`
                : " That's within a safe single-day change."}
            </p>
            <div className="space-y-2">
              {correction.products.map((p) => (
                <div key={p.name} className="p-2 rounded-lg bg-white">
                  <div className="text-[13px] font-black text-ink">{p.name}</div>
                  <div className="text-[13px] font-bold" style={{ color: "#D9631F" }}>
                    {fmtDoseMass(p.totalG)} total
                    {correction.days > 1 && ` · ${fmtDoseMass(p.perDayG)}/day for ${correction.days} days`}
                  </div>
                  <div className="text-[11px] text-ink2 font-semibold mt-0.5">{p.note}</div>
                </div>
              ))}
              {correction.tiny && (
                <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                  These amounts are below what a kitchen scale weighs accurately. Rather than measuring the powder directly, dissolve a larger known weight into a litre of RODI and dose a measured fraction of that solution.
                </p>
              )}
            </div>
            <p className="text-[11px] text-ink2 font-medium mt-2">
              Dissolve in RODI before adding, and add to high flow. Re-test before dosing again rather than stacking doses on an assumption.
            </p>
          </div>
        )}
      </InfoBlock>


      {/* --- Lighting log --- */}
      <InfoBlock icon={SunMedium} eyebrow="AI Blade" title="Lighting changes" tone="#B8860B"
        collapsible
        summary={lighting.length
          ? `${lighting.length} change${lighting.length === 1 ? "" : "s"} · last ${fmtShort(lighting[0].date)}`
          : "Nothing recorded yet"}>
        <form onSubmit={submitLighting} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <Field label="Date">
            <input type="date" value={lightDate} onChange={(e) => setLightDate(e.target.value)} className={inputCls} max={todayStr()} />
          </Field>
          <Field label="What changed" className="sm:col-span-3">
            <input type="text" value={lightNote} onChange={(e) => setLightNote(e.target.value)} className={inputCls}
              placeholder="e.g. bumped blue channel to 80%" />
          </Field>
          <div className="sm:col-span-4">
            <Btn type="submit" className="w-full sm:w-auto">
              <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Log change</span>
            </Btn>
          </div>
        </form>
        {lighting.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium">No lighting changes logged yet.</p>
        ) : (
          <div className="divide-y divide-app">
            {lighting.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-ink2 font-bold">{fmtDate(l.date)}</div>
                  <div className="text-[13px] font-semibold text-ink">{l.note}</div>
                </div>
                <DeleteButton onDelete={() => onDeleteLighting(l.id)} />
              </div>
            ))}
          </div>
        )}
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
          Each change drops a marker on every parameter chart, so you can see whether a lighting tweak moved your alkalinity demand.
        </p>
      </InfoBlock>

      {/* --- 11. Backup and export --- */}
      {/* Anything hidden has to be findable again, or dismissing becomes its own
          trap — a note you can never get back. */}
      <InfoBlock icon={CheckCircle2} eyebrow="Acknowledged" title="Hidden notes" tone="#45605F"
        collapsible
        summary={dismissedList.length
          ? `${dismissedList.length} note${dismissedList.length === 1 ? "" : "s"} hidden`
          : "Nothing hidden"}>
        {dismissedList.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            Notes you hide will be listed here. They come back on their own if the situation changes —
            hiding one only silences the version you read.
          </p>
        ) : (
          <>
            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
              These are hidden from the rest of the app. Each will return by itself if the underlying
              numbers move enough to change what it says.
            </p>
            <div className="space-y-2">
              {dismissedList.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-2 rounded-lg p-2.5 bg-app">
                  <div className="min-w-0">
                    <div className="text-[12px] font-black text-ink">{f.title}</div>
                    <div className="text-[11px] text-ink2 font-medium">
                      {(f.params || []).join(", ") || f.scope}
                    </div>
                  </div>
                  <button onClick={() => onRestoreFinding(findingKey(f))}
                    className="shrink-0 text-[11px] font-extrabold text-teal-brand">Show again</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" className="w-full mt-3" onClick={onRestoreAllFindings}>
              <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Show all again</span>
            </Btn>
          </>
        )}
      </InfoBlock>

      <InfoBlock icon={Waves} eyebrow="Fun" title="Opening animation" tone="#0B7C86"
        collapsible
        summary="Watch the reef intro again">
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          This plays once each time the app is opened. Tap below to watch it now.
        </p>
        <Btn className="w-full" onClick={onPlayIntro}>
          <span className="flex items-center justify-center gap-1.5"><Waves size={14} /> Play intro</span>
        </Btn>
      </InfoBlock>

      <InfoBlock icon={Download} eyebrow="Your data" title="Backup & export" tone="#45605F"
        collapsible
        defaultOpen={backupAge == null || backupAge > 14}
        summary={backupAge == null ? "No backup saved yet"
          : backupAge > 14 ? `Last backup ${backupAge} days ago`
          : `Backed up ${backupAge === 0 ? "today" : `${backupAge}d ago`} · ${readings.length} readings`}>
        <div className="rounded-xl p-3 mb-3" style={{ background: backupAge == null || backupAge > 14 ? "#D9832415" : "#0B7C8612" }}>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            {backupAge == null
              ? `You haven't saved a backup yet. Browser storage isn't permanent — clearing Safari, or not opening the app for a week, can erase everything. A backup file is the only copy that survives that.`
              : backupAge > 14
              ? `Your last backup was ${backupAge} days ago. Worth saving a fresh one.`
              : `Last backup ${backupAge === 0 ? "today" : backupAge === 1 ? "yesterday" : `${backupAge} days ago`}.`}
          </p>
          {persistState && (
            <p className="text-[11px] text-ink2 font-medium mt-1.5">
              {persistState.granted
                ? "This browser has agreed to keep your data rather than evicting it automatically."
                : persistState.supported
                ? "This browser wouldn't guarantee your data against automatic eviction, which makes backups more important."
                : "This browser can't guarantee your data against automatic eviction, which makes backups more important."}
            </p>
          )}
        </div>

        <Btn className="w-full mb-2" onClick={async () => {
          const b = await buildBackup();
          downloadJson(b, `dans-tank-backup-${todayStr()}.json`);
          await saveKey("last-backup", b.createdAt);
          setBackupAt(b.createdAt);
          setRestoreMsg("Backup saved. Keep it somewhere that isn't this phone — Files, iCloud Drive, or emailed to yourself.");
          setTimeout(() => setRestoreMsg(null), 8000);
        }}>
          <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save backup file</span>
        </Btn>

        <label className="block">
          <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-app px-4 py-2.5 text-[13px] font-extrabold text-ink2 cursor-pointer active:bg-app">
            <Upload size={14} /> Restore from a backup
          </span>
          <input type="file" accept=".json,application/json" className="hidden"
            onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text());
                const info = inspectBackup(parsed, {
                  "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
                  "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
                  "tasks-custom": customTasks,
                });
                if (!info.ok) { setRestoreMsg(info.reason); return; }
                setPending({ parsed, info });
                setRestoreMsg(null);
              } catch (err) {
                setRestoreMsg("That file couldn't be read as a backup.");
              }
            }} />
        </label>

        {pending && (
          <div className="mt-3 rounded-xl border-2 p-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
              Backup from {pending.info.createdAt ? fmtDate(pending.info.createdAt.slice(0, 10)) : "an unknown date"}
            </div>
            <div className="space-y-1 mb-2">
              {pending.info.summary.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-ink2">{BACKUP_LABELS[row.key] || row.key}</span>
                  <span className="text-[12px] font-black text-ink">
                    {row.total} in file · <span style={{ color: row.fresh ? "#0B7C86" : "#8AA0A0" }}>{row.fresh} new</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
              Restoring adds anything missing and leaves what you already have alone, so nothing is
              overwritten or duplicated. Running the same file twice changes nothing the second time.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="ghost" onClick={() => setPending(null)}>Cancel</Btn>
              <Btn onClick={async () => {
                const merged = await restoreBackup(pending.parsed, {
                  "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
                  "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
                  "tasks-custom": customTasks,
                }, true);
                onRestored(merged);
                const added = pending.info.summary.reduce((a, r) => a + r.fresh, 0);
                setPending(null);
                setRestoreMsg(added ? `Restored — ${added} entries added.` : "Nothing new to add; your data already matched that file.");
                setTimeout(() => setRestoreMsg(null), 8000);
              }}>Restore</Btn>
            </div>
          </div>
        )}

        {restoreMsg && (
          <p className="text-[12px] font-bold text-ink mt-2 leading-relaxed">{restoreMsg}</p>
        )}

        <div className="mt-4 pt-3 border-t border-app">
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
            The CSV below is for reading — open it in a spreadsheet or share it. It can't be
            restored from, because it flattens ICP panels into rows and doesn't include your settings.
          </p>
          <Btn variant="ghost" className="w-full sm:w-auto"
            onClick={() => downloadCsv(
              buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks }),
              `dans-tank-${todayStr()}.csv`)}>
            <span className="flex items-center justify-center gap-1.5"><Download size={14} /> Download CSV</span>
          </Btn>
        </div>

        <p className="text-[11px] text-ink2 font-medium mt-3">
          {readings.length} readings · {icps.length} ICP panels · {waterChanges.length} water changes · {doseLog.length} dose changes
        </p>
      </InfoBlock>
    </div>
  );
}

/* ---------------------------------- Water Log ---------------------------------- */

/* The two halves of Testing are equally important, so the switcher is a pair
   of full-width cards rather than small pills — the ICP side was easy to miss
   entirely when it was a 12px text button. */
function TestModeSwitch({ mode, setMode, testCount, icpCount }) {
  const items = [
    { id: "tests", label: "My tests", sub: testCount === 1 ? "1 reading" : `${testCount} readings`, Icon: FlaskConical },
    { id: "icp", label: "ICP panels", sub: icpCount === 1 ? "1 panel" : `${icpCount} panels`, Icon: FileBarChart2 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map(({ id, label, sub, Icon }) => {
        const on = mode === id;
        return (
          <button key={id} onClick={() => setMode(id)}
            className="rounded-2xl border-2 px-3 py-3 text-left transition-all"
            style={{
              borderColor: on ? "#0B7C86" : "#E3ECEA",
              background: on ? "#0B7C8612" : "#fff",
              boxShadow: on ? "0 2px 10px rgba(11,124,134,0.13)" : "none",
            }}>
            <div className="flex items-center gap-2 mb-0.5">
              <Icon size={17} color={on ? "#0B7C86" : "#45605F"} />
              <span className="text-[14px] font-black" style={{ color: on ? "#0B7C86" : "#08191D" }}>{label}</span>
            </div>
            <div className="text-[11px] font-bold" style={{ color: on ? "#0B7C86" : "#45605F" }}>{sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function WaterLog({ readings, onAdd, onDelete, onImportHistorical, paramDefs, chartEvents = [],
  icps = [], onAddIcp, onDeleteIcp, onEdit, prefill = null, onOpenParam,
  reminders = [], reminderView = null }) {
  const [mode, setMode] = useState("tests");
  const [importMsg, setImportMsg] = useState(null);
  const [importing, setImporting] = useState(false);
  const [allGraphs, setAllGraphs] = useState(false);
  const [histParam, setHistParam] = useState(PARAM_DEFS[0].key);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editDate, setEditDate] = useState(todayStr());
  const [editTime, setEditTime] = useState("");

  /* Arriving from a reminder just needs the tests view; every parameter is
     listed there now, so there is nothing to pre-select. `at` is a timestamp
     rather than a flag so tapping the same reminder twice still works. */
  useEffect(() => {
    if (!prefill || !prefill.paramKey) return;
    setMode("tests");
  }, [prefill && prefill.at]);

  const runImport = async () => {
    setImporting(true);
    try {
      const count = await onImportHistorical();
      setImportMsg(count > 0 ? `Imported ${count} historical readings.` : "Already up to date.");
    } finally {
      setImporting(false);
    }
  };


  const histDef = paramDefs.find((d) => d.key === histParam) || paramDefs[0];
  const histRows = useMemo(() => readings
    .filter((r) => r.param === histParam)
    .sort(byNewest)
    .slice(0, 40),
  [readings, histParam]);

  if (mode === "icp") {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-display text-ink mb-3">Water Test Lab</h2>
        </div>
        <TestModeSwitch mode={mode} setMode={setMode} testCount={readings.length} icpCount={icps.length} />
        <IcpPanel icps={icps} onAdd={onAddIcp} onDelete={onDeleteIcp} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="text-2xl font-display text-ink">Water Test Lab</h2>
          {/* Every chart in one scroll, for when you want the whole picture
              rather than one parameter's detail. */}
          <button onClick={() => setAllGraphs(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-[11px] font-extrabold"
            style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
            <Activity size={13} /> All graphs
          </button>
        </div>
        <TestModeSwitch mode={mode} setMode={setMode} testCount={readings.length} icpCount={icps.length} />
        <Btn variant="ghost" onClick={runImport} disabled={importing} className="w-full sm:w-auto">
          <span className="flex items-center justify-center gap-1.5"><Upload size={14} /> {importing ? "Importing…" : "Import historical data"}</span>
        </Btn>
        {importMsg && <div className="text-[11px] font-bold text-teal-brand mt-1.5">{importMsg}</div>}
      </div>

      <TestLab paramDefs={paramDefs} readings={readings} onAdd={onAdd}
        onOpenParam={onOpenParam} reminders={reminders} reminderView={reminderView} />

      {allGraphs && (
        <AllGraphsModal paramDefs={paramDefs} readings={readings} chartEvents={chartEvents}
          onClose={() => setAllGraphs(false)} onOpenParam={onOpenParam} />
      )}


      {/* Filtered to one parameter: a single mixed list was hard to scan, and
          correcting a mis-typed reading meant hunting through everything. */}
      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
          <h2 className="text-2xl font-display text-ink">Past readings</h2>
        </div>
        <select value={histParam} onChange={(e) => setHistParam(e.target.value)}
          className="rounded-lg border border-app bg-white px-2.5 py-2 text-[13px] font-bold text-ink max-w-[50%]">
          {paramDefs.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
      </div>

      <Card className="divide-y divide-app">
        {histRows.length === 0 && (
          <div className="px-4 py-6 text-center text-ink2 font-semibold text-sm">
            No {histDef.label.toLowerCase()} readings yet
          </div>
        )}
        {histRows.map((r) => {
          const editing = editId === r.id;
          return (
            <div key={r.id} className="px-4 py-3"
              style={editing ? { background: "#F3F7F6" } : undefined}>
              {editing ? (
                /* Four fields and two buttons on one line left every control
                   too narrow to use. Stacked instead: value on its own row,
                   date and time sharing the next, buttons last. */
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
                    Editing this reading
                  </div>
                  <Field label={`Value (${histDef.unit || ""})`}>
                    <input type="number" inputMode="decimal" step={histDef.step} value={editVal}
                      onChange={(e) => setEditVal(e.target.value)} className={inputCls} autoFocus />
                  </Field>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Field label="Date">
                      <input type="date" value={editDate} max={todayStr()}
                        onChange={(e) => setEditDate(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Time">
                      {/* Editable on old readings too, so a batch entered from
                          paper can be placed at the hour it was actually taken. */}
                      <input type="time" value={editTime}
                        onChange={(e) => setEditTime(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Btn variant="ghost" onClick={() => setEditId(null)}>Cancel</Btn>
                    <Btn onClick={async () => {
                      const v = parseFloat(editVal);
                      if (isFinite(v)) {
                        await onEdit(r.id, { value: v, date: editDate, time: editTime || undefined });
                        notify("Reading updated");
                      }
                      setEditId(null);
                    }}>
                      <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Save</span>
                    </Btn>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button className="min-w-0 text-left flex-1"
                    onClick={() => { setEditId(r.id); setEditVal(String(r.value)); setEditDate(r.date); setEditTime(r.time || ""); }}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-ink">{fmtVal(histDef, r.value)}{histDef.unit}</span>
                      <span className="text-[11px] text-ink2 font-semibold">
                        {fmtDate(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
                      </span>
                    </div>
                    {r.note && <div className="text-[11px] text-ink2 mt-0.5">{r.note}</div>}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={paramStatus(histDef, r.value)} />
                    <DeleteButton onDelete={() => onDelete(r.id)} confirmMessage="Reading removed" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
      {histRows.length > 0 && (
        <p className="text-[11px] text-ink2 font-medium mt-2">Tap a reading to correct its value or date.</p>
      )}
    </div>
  );
}

/* ---------------------------------- ICP Panel ---------------------------------- */

function IcpPanel({ icps, onAdd, onDelete }) {
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{ name: "", value: "" }]);
  const [imgData, setImgData] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const elementNames = useMemo(() => {
    const set = new Set();
    icps.forEach((t) => Object.keys(t.elements || {}).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [icps]);

  /* Same elements, ordered the way you'd actually look for them: the ones you
     manage first, contaminants last. */
  const groupedElements = useMemo(() => {
    const remaining = new Set(elementNames);
    const out = [];
    for (const g of ICP_GROUPS) {
      const found = g.members.filter((m) => remaining.has(m));
      found.forEach((m) => remaining.delete(m));
      if (found.length) out.push({ label: g.label, items: found });
    }
    if (remaining.size) out.push({ label: "Other", items: Array.from(remaining).sort() });
    return out;
  }, [elementNames]);
  const [graphEl, setGraphEl] = useState("");
  useEffect(() => {
    if (graphEl || !groupedElements.length) return;
    /* Open on something worth looking at rather than the first contaminant
       alphabetically. */
    setGraphEl(groupedElements[0].items[0]);
  }, [groupedElements]);

  const updateRow = (i, field, val) => {
    const next = [...rows]; next[i] = { ...next[i], [field]: val }; setRows(next);
  };
  const addRow = () => setRows([...rows, { name: "", value: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const [fileErr, setFileErr] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setFileErr(null);
    try {
      const data = await compressImage(file);
      setImgData(data);
    } catch (err) {
      setFileErr(err.message || "Could not read that image.");
      setImgData(null);
    } finally { setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const elements = {};
    rows.forEach((r) => { if (r.name.trim() && r.value !== "") elements[r.name.trim()] = parseFloat(r.value); });
    if (Object.keys(elements).length === 0) {
      setSaveMsg("Add at least one element name and value before saving.");
      return;
    }
    const ok = await onAdd({ date, note: note.trim(), elements, image: imgData });
    if (ok === false) {
      setSaveMsg("Could not save — see the message at the top of the screen.");
      return;
    }
    setSaveMsg(`Saved ${Object.keys(elements).length} element${Object.keys(elements).length === 1 ? "" : "s"} for ${fmtDate(date)}.`);
    setTimeout(() => setSaveMsg(null), 4000);
    setRows([{ name: "", value: "" }]); setNote(""); setImgData(null); setFileErr(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const graphData = useMemo(() => {
    return icps.filter((t) => t.elements && t.elements[graphEl] != null)
      .sort(byOldest)
      .map((t) => ({ label: fmtShort(t.date), value: t.elements[graphEl], date: t.date }));
  }, [icps, graphEl]);

  const sortedIcps = useMemo(() => [...icps].sort(byNewest), [icps]);

  return (
    <div>
      <SectionTitle eyebrow="Every 6 weeks" title="ICP Panel" />

      <Card className="p-4 mb-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Test date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} max={todayStr()} /></Field>
            <Field label="Note (optional)"><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Triton, after WC" /></Field>
          </div>

          <div>
            <span className="block text-xs font-bold text-ink2 mb-1.5">Elements</span>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Element, e.g. Iodine" className={inputCls} />
                  </div>
                  <div className="w-24 shrink-0">
                    <input type="number" inputMode="decimal" step="any" value={r.value} onChange={(e) => updateRow(i, "value", e.target.value)} placeholder="value" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove element"
                    className="text-ink2 hover:text-rose-700 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-2 text-xs font-bold text-teal-brand flex items-center gap-1"><Plus size={12} /> Add element</button>
          </div>

          <div>
            <span className="block text-xs font-bold text-ink2 mb-1.5">Report photo (optional)</span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-app text-sm font-bold text-ink hover:border-teal-brand">
                  <Upload size={14} /> {busy ? "processing…" : "Choose file"}
                </span>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
              {imgData && <img src={imgData} alt="preview" className="h-12 w-12 object-cover rounded-md border border-app" />}
            </div>
          </div>

          {fileErr && <p className="text-[12px] font-bold text-rose-700">{fileErr}</p>}
          {saveMsg && <p className="text-[12px] font-bold text-teal-brand">{saveMsg}</p>}
          <Btn type="submit"><span className="flex items-center gap-1.5"><Plus size={14} /> Save ICP result</span></Btn>
        </form>
      </Card>

      {elementNames.length > 0 && (
        <>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">Trend</div>
            <h2 className="text-2xl font-display text-ink mb-3">Element graph</h2>
            <div className="w-full sm:w-52">
              <select value={graphEl} onChange={(e) => setGraphEl(e.target.value)} className={inputCls}>
                {groupedElements.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((n) => <option key={n} value={n}>{n}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <Card className="p-4 mb-8">
            {(() => {
              const gRef = icpRef(graphEl);
              return (
                <>
                  <ZoomableLineChart data={graphData} color="#D9631F" height={240}
                    targetMin={gRef ? gRef.lo : null} targetMax={gRef ? gRef.hi : null} />
                  {gRef && (
                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                      {gRef.derived
                        ? `Shaded band is Triton's setpoint of ${gRef.setpoint} ${gRef.unit} give or take 10% — Triton publishes a single target for this element rather than a range.`
                        : gRef.hi === 0
                        ? `Triton's target for ${graphEl} is zero, so the band sits on the axis — anything measurable is a detection.`
                        : `Shaded band is Triton's published range, ${gRef.lo}–${gRef.hi} ${gRef.unit}.`}
                    </p>
                  )}
                  {!gRef && (
                    <p className="text-[11px] text-ink2 font-medium mt-2">No published reference range held for {graphEl}.</p>
                  )}
                </>
              );
            })()}
          </Card>
        </>
      )}

      <SectionTitle eyebrow="History" title="Past results" />
      <div className="space-y-3">
        {sortedIcps.length === 0 && <Card className="px-4 py-6 text-center text-ink2 font-semibold text-sm">No ICP results logged yet</Card>}
        {sortedIcps.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-black text-ink">{fmtDate(t.date)}</div>
                {t.note && <div className="text-[11px] text-ink2 font-semibold">{t.note}</div>}
              </div>
              <DeleteButton onDelete={() => onDelete(t.id)} />
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(t.elements || {}).map(([k, v]) => (
                <span key={k} className="text-[11px] font-bold px-2 py-1 rounded-md bg-app border border-app text-ink">{k}: {v}</span>
              ))}
            </div>
            {t.image && <img src={t.image} alt="ICP report" className="mt-2 max-h-48 rounded-lg border border-app" />}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Tasks ---------------------------------- */

function Tasks({ allTasks, taskLog, onAddCustom, onDeleteCustom, onMarkDone,
  onAddWaterChange, onSetReminderDue, onSetReminderInterval, onSkipReminder,
  onDeleteWaterChange, onUpdateReminder, onNudgeReminder, onAddReminder, onDeleteReminder,
  waterChanges = [], settings = DEFAULT_SETTINGS,
  latestByParam = {}, paramDefs = [], reminders = [], reminderView = null,
  onOpenTest = () => {} }) {
  const [newUnit, setNewUnit] = useState("days");
  const [newStart, setNewStart] = useState(todayStr());
  const [wcOpen, setWcOpen] = useState(false);
  const [wcLitres, setWcLitres] = useState(String(settings.waterChangeL ?? 10));
  const [wcResult, setWcResult] = useState(null);

  const preview = useMemo(() => {
    const L = parseFloat(wcLitres);
    if (!L || L <= 0) return null;
    return predictAfterChange(latestByParam, paramDefs, settings.volumeL || 77, L);
  }, [wcLitres, latestByParam, paramDefs, settings.volumeL]);

  const confirmWaterChange = async () => {
    const L = parseFloat(wcLitres);
    if (!L || L <= 0) return;
    await onAddWaterChange({ date: todayStr(), litres: L, note: "" });
    await onMarkDone("waterchange", todayStr());
    setWcResult(predictAfterChange(latestByParam, paramDefs, settings.volumeL || 77, L));
    setWcOpen(false);
  };

  const [label, setLabel] = useState("");
  const [freq, setFreq] = useState(14);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = label.trim();
    if (!name) return;
    /* Custom entries are reminders like any other, so they get the same
       scheduling, snoozing and calendar history. */
    const n = Math.max(1, parseInt(freq, 10) || 7);
    await onAddReminder({
      id: uid(), label: name, paramKey: null, kind: "task",
      intervalDays: newUnit === "weeks" ? n * 7 : n,
      startDate: newStart || todayStr(), enabled: true, builtin: false,
    });
    setLabel(""); setFreq(14); setNewUnit("days"); setNewStart(todayStr());
  };

  /* One sheet, shared by the calendar below and the reminder list above, so a
     task can be moved from wherever you happen to be looking at it. */
  const [sheetId, setSheetId] = useState(null);
  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;
  const closeSheet = () => setSheetId(null);
  const onPickTask = (id) => setSheetId(id);

  return (
    <div>
      <SectionTitle eyebrow="Schedule" title="Reminders" />

      {/* Result of the change just logged */}
      {wcResult && (
        <Card className="p-4 mb-4" style={{ borderColor: "#0B7C8666" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand">
              Water change logged
            </div>
            <button aria-label="Dismiss" onClick={() => setWcResult(null)} className="text-ink2 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
            That replaced {wcResult.pct.toFixed(1)}% of your water. Here's roughly where your levels should sit now — worth testing to confirm rather than taking these as read.
          </p>
          <div className="space-y-1.5">
            {wcResult.rows.map(({ def, before, after, delta }) => (
              <div key={def.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-app">
                <span className="text-[13px] font-black text-ink min-w-0 truncate">{def.label}</span>
                <span className="text-[12px] font-bold text-ink2 shrink-0">
                  {fmtVal(def, before)} → <span className="text-ink font-black">{fmtVal(def, after)}{def.unit}</span>
                  {Math.abs(delta) >= 0.005 && (
                    <span className="ml-1" style={{ color: delta > 0 ? "#D98324" : "#1D6FA5" }}>
                      ({delta > 0 ? "+" : ""}{fmtVal(def, delta)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Water change volume prompt */}
      {wcOpen && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[14px] font-black text-ink">How much did you change?</span>
            <button aria-label="Close" onClick={() => setWcOpen(false)} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={20} /></button>
          </div>
          <Field label="Litres">
            <input type="number" inputMode="decimal" min="0" step="0.5" value={wcLitres}
              onChange={(e) => setWcLitres(e.target.value)} className={inputCls} />
          </Field>
          {wcPreview && (
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1 mb-2">
              {wcPreview.pct.toFixed(1)}% of your {settings.volumeL || 77}L system.
            </p>
          )}
          <Btn className="w-full" onClick={logWaterChange}>
            <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Log water change</span>
          </Btn>
        </Card>
      )}

      {/* One list, one set of controls. Tests and husbandry used to be separate
          sections with different capabilities, so the same concept behaved
          differently depending on where you found it. */}
      <Card className="p-4 mb-4">
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          Everything here repeats on a schedule you set. Tap one to change how often it repeats,
          when it starts, or to nudge the next occurrence. Tests complete themselves when you log
          that reading; the rest you tick off.
        </p>

        {REMINDER_GROUPS.map((g) => {
          const list = reminders.filter((r) => g.kinds.includes(r.kind));
          if (!list.length) return null;
          return (
            <div key={g.id} className="mb-4 last:mb-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                {g.label}
              </div>
              <div className="space-y-2">
                {list.map((r) => (
                  <ReminderRow key={r.id} rem={r}
                    state={reminderView && reminderView.states.find((x) => x.rem.id === r.id)}
                    onReschedule={() => onPickTask(r.id)}
                    onComplete={r.kind === "water" ? () => setWcOpen(true)
                      : r.kind === "test" && r.paramKey ? () => onOpenTest(r.paramKey)
                      : () => onMarkDone(r.id)}
                    completeLabel={r.kind === "water" ? "Log change" : r.kind === "test" ? "Log test" : "Mark done"} />
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* The add form uses the same fields as editing, so what you fill in
          matches what you'll see afterwards. */}
      <Card className="p-4 mb-8">
        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Add a reminder</div>
        <Field label="Name">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            className={inputCls} placeholder="e.g. Clean filter sock" />
        </Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Repeat every">
            <div className="flex gap-1.5">
              <input type="number" inputMode="decimal" min="1" value={freq} onChange={(e) => setFreq(e.target.value)} className={inputCls} />
              <select className={inputCls} value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
              </select>
            </div>
          </Field>
          <Field label="Starting from">
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Btn onClick={submit} className="w-full mt-3">
          <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Add reminder</span>
        </Btn>
      </Card>

      {/* The calendar replaces a list of recent water changes: it shows every
          completed task, not one kind, and gives the month at a glance. */}
      <SectionTitle eyebrow="History" title="Done & coming up" />
      <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
        onPickTask={onPickTask} />

      {sheetRem && (
        <ReminderSheet rem={sheetRem} state={sheetState} onClose={closeSheet}
          onSetDue={(id, d) => { onSetReminderDue(id, d); closeSheet(); }}
          onSetInterval={(id, n) => { onSetReminderInterval(id, n); closeSheet(); }}
          onComplete={(id) => { onComplete(id); closeSheet(); }}
          onSkip={(id) => { onSkipReminder(id); closeSheet(); }}
          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); closeSheet(); }}
          onDelete={(id) => { onDeleteReminder(id); closeSheet(); }} />
      )}

    </div>
  );
}

