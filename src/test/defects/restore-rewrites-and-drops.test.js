/* TW-033 (.agent/items/, 2026-08-14 consistency sweep) — a restore
 * rewrites and drops data while its own screen says it did neither.
 *
 * Three consequences of one root cause in src/lib/backup.jsx:
 *
 *   1. `restoreBackup` wrote the file's `custom-ranges` over the device's
 *      unconditionally — not merged, and not even gated by the `applySettings`
 *      flag that guards `tank-settings` three lines above it. Every band a
 *      reading is classified against is computed live from those ranges, so a
 *      restore silently reclassified the whole log, including readings logged
 *      after the snapshot was taken, against whatever targets were set on the
 *      snapshot's day.
 *
 *      Owner decision (2026-08-15): when a backup's targets differ from the
 *      device's, show both and let the user choose. Do not restore them
 *      silently either way — so the merge refuses to run at all rather than
 *      pick a side on its own.
 *
 *   2. The natural keys omitted the time of day — `param|date` for readings,
 *      `element|date` for dose changes. Two alkalinity tests on one morning
 *      and one evening collided, and the second was dropped.
 *
 *   3. `inspectBackup` counted rows it had read, not rows the restore would
 *      keep: it deduped the incoming file against current state only, never
 *      against itself. So the preview promised entries the restore then threw
 *      away, and the difference vanished without a word.
 *
 * In plain terms: use the undo feature to get a few lost tests back and the
 * app could quietly relabel months of history against an old target, throw
 * away one of two tests you did on the same day, and tell you on the way in
 * that both were coming back.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { inspectBackup, restoreBackup } from '../../lib/backup.jsx'
import { loadKey, saveKey } from '../../lib/storage.js'

const file = (data) => ({ format: 'dans-tank-backup', version: 1, createdAt: '2026-08-10T09:00:00.000Z', data })

/* Two alkalinity tests on one day: before the first dose and after the
   evening one. A real pattern — it is exactly how you find out what a dose
   did — and the shape that collided. */
const TWO_SAME_DAY = [
  { id: 'r1', param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.4 },
  { id: 'r2', param: 'alkalinity', date: '2026-08-10', time: '18:00', value: 8.1 },
]

const TWO_DOSES_SAME_DAY = [
  { id: 'd1', element: 'alkalinity', date: '2026-08-10', time: '09:00', ml: 9 },
  { id: 'd2', element: 'alkalinity', date: '2026-08-10', time: '21:00', ml: 10.5 },
]

beforeEach(() => {
  window.localStorage.clear()
  delete window.storage
})

describe('a restore never silently changes the targets history is judged against', () => {
  it('reports both values when the file and the device disagree', async () => {
    await saveKey('custom-ranges', { alkalinity: { min: 8.0, max: 9.0 } })

    const info = inspectBackup(file({ 'custom-ranges': { alkalinity: { min: 7.0, max: 8.0 } } }),
      {}, { alkalinity: { min: 8.0, max: 9.0 } })

    expect(info.ok).toBe(true)
    expect(info.rangeConflicts).toEqual([
      { param: 'alkalinity', device: { min: 8.0, max: 9.0 }, file: { min: 7.0, max: 8.0 } },
    ])
  })

  it('counts a target the file has and the device does not as a disagreement', () => {
    const info = inspectBackup(file({ 'custom-ranges': { phosphate: { min: 0.05, max: 0.12 } } }), {}, {})

    expect(info.rangeConflicts).toEqual([
      { param: 'phosphate', device: null, file: { min: 0.05, max: 0.12 } },
    ])
  })

  it('says nothing to ask about when the two agree', () => {
    const ranges = { alkalinity: { min: 8.0, max: 9.0 } }
    const info = inspectBackup(file({ 'custom-ranges': ranges }), {}, { ...ranges })

    expect(info.rangeConflicts).toEqual([])
  })

  it('refuses to restore at all rather than choose a side on its own', async () => {
    await saveKey('custom-ranges', { alkalinity: { min: 8.0, max: 9.0 } })

    await expect(restoreBackup(
      file({ 'custom-ranges': { alkalinity: { min: 7.0, max: 8.0 } }, readings: TWO_SAME_DAY }),
      {}, true,
    )).rejects.toThrow(/target/i)

    // And it refused before writing anything, not halfway through.
    expect(await loadKey('custom-ranges', null)).toEqual({ alkalinity: { min: 8.0, max: 9.0 } })
    expect(await loadKey('readings', null)).toBe(null)
  })

  it('keeps this device\'s targets when that is what was chosen', async () => {
    await saveKey('custom-ranges', { alkalinity: { min: 8.0, max: 9.0 } })

    await restoreBackup(file({ 'custom-ranges': { alkalinity: { min: 7.0, max: 8.0 } } }),
      {}, true, { ranges: 'keep' })

    expect(await loadKey('custom-ranges', null)).toEqual({ alkalinity: { min: 8.0, max: 9.0 } })
  })

  it('takes the backup\'s targets when that is what was chosen', async () => {
    await saveKey('custom-ranges', { alkalinity: { min: 8.0, max: 9.0 } })

    const merged = await restoreBackup(file({ 'custom-ranges': { alkalinity: { min: 7.0, max: 8.0 } } }),
      {}, true, { ranges: 'file' })

    expect(await loadKey('custom-ranges', null)).toEqual({ alkalinity: { min: 7.0, max: 8.0 } })
    expect(merged['custom-ranges']).toEqual({ alkalinity: { min: 7.0, max: 8.0 } })
  })

  /* Absence is the migration case, and it has three shapes — no member at
     all, an explicit null, and the empty map `loadKey` hands back. None of
     them is a statement about targets, so none of them may cost the user a
     question or a band. */
  it.each([
    ['no member at all', {}],
    ['an explicit null', { 'custom-ranges': null }],
    ['an empty map', { 'custom-ranges': {} }],
  ])('needs no choice, and asks for none, when the file carries %s', async (_label, ranges) => {
    await saveKey('custom-ranges', { alkalinity: { min: 8.0, max: 9.0 } })

    await restoreBackup(file({ readings: TWO_SAME_DAY, ...ranges }), {}, true)

    expect(await loadKey('custom-ranges', null)).toEqual({ alkalinity: { min: 8.0, max: 9.0 } })
  })
})

describe('two entries on one day both survive a restore', () => {
  it('keeps a morning and an evening reading of the same parameter', async () => {
    const merged = await restoreBackup(file({ readings: TWO_SAME_DAY }), { readings: [] }, false)

    expect(merged.readings).toHaveLength(2)
    expect(merged.readings.map((r) => r.value).sort()).toEqual([7.4, 8.1])
  })

  it('keeps two dose changes made on the same day', async () => {
    const merged = await restoreBackup(file({ 'dose-log': TWO_DOSES_SAME_DAY }), { 'dose-log': [] }, false)

    expect(merged['dose-log']).toHaveLength(2)
    expect(merged['dose-log'].map((d) => d.ml).sort()).toEqual([10.5, 9])
  })

  it('still adds nothing the second time the same file is restored', async () => {
    const f = file({ readings: TWO_SAME_DAY, 'dose-log': TWO_DOSES_SAME_DAY })

    const once = await restoreBackup(f, { readings: [], 'dose-log': [] }, false)
    const twice = await restoreBackup(f, once, false)

    expect(twice.readings).toHaveLength(2)
    expect(twice['dose-log']).toHaveLength(2)
  })

  it('does not add a second copy of a reading that has no time recorded', async () => {
    const older = [{ id: 'r0', param: 'alkalinity', date: '2026-08-09', value: 7.9 }]

    const merged = await restoreBackup(file({ readings: older }), { readings: [...older] }, false)

    expect(merged.readings).toHaveLength(1)
  })
})

describe('the preview counts what the restore will keep, not what it read', () => {
  it('does not count the same day twice when the file holds a duplicate', async () => {
    const dupe = [
      { id: 'a', param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.4 },
      { id: 'b', param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.4 },
    ]
    const f = file({ readings: dupe })

    const info = inspectBackup(f, { readings: [] }, {})
    const merged = await restoreBackup(f, { readings: [] }, false)

    const row = info.summary.find((s) => s.key === 'readings')
    expect(row.fresh).toBe(1)
    expect(merged.readings).toHaveLength(row.fresh)
  })

  it('agrees with the restore about every list in a mixed file', async () => {
    const f = file({
      readings: [
        ...TWO_SAME_DAY,
        { id: 'r1again', param: 'alkalinity', date: '2026-08-10', time: '08:00', value: 7.4 },
      ],
      'dose-log': [...TWO_DOSES_SAME_DAY, { id: 'd1again', element: 'alkalinity', date: '2026-08-10', time: '09:00', ml: 9 }],
      'water-changes': [{ id: 'w1', date: '2026-08-09', litres: 10 }],
    })
    const current = { readings: [TWO_SAME_DAY[0]], 'dose-log': [], 'water-changes': [] }

    const info = inspectBackup(f, current, {})
    const merged = await restoreBackup(f, current, false)

    for (const row of info.summary) {
      const before = (current[row.key] || []).length
      expect(merged[row.key].length - before).toBe(row.fresh)
    }
  })
})
