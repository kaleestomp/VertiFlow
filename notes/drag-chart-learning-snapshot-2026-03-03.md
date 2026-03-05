# Drag Chart Learning Snapshot (2026-03-03)

## What we built

- Converted ECharts drag examples into React components.
- Added a dedicated demo page and route for testing drag behavior.
- Built `DragLinePointsExample` using native ECharts `graphic` drag handlers.

## Key implementation decisions

- Used `chartRef` to access the live ECharts instance (`getEchartsInstance()`), then called imperative APIs:
  - `convertToPixel`
  - `convertFromPixel`
  - `setOption`
  - `dispatchAction`
- Used `dataRef` (not React state) for high-frequency drag updates to avoid per-frame React re-renders.
- Kept tooltip behavior and zoom/resize sync through event handlers.

## Why responsiveness improved

Original less-responsive version updated React state on each drag frame.
That forced React re-renders + option recalculation repeatedly.

The improved version:
- updates `dataRef.current` directly in `ondrag`
- pushes updates to chart imperatively via `chart.setOption(...)`

This matches the spirit of the native ECharts demo and feels much smoother.

## Major concepts learned

### `useRef` in this context

- `chartRef.current` stores a handle to the chart component instance.
- `dataRef.current` stores mutable point data (`[[x, y], ...]`).
- Updating `ref.current` does **not** trigger React re-render.

### `useCallback` dependencies

- Dependencies in `useCallback` / `useEffect` are for closure correctness and lifecycle consistency.
- They are not "triggers" in the same sense as event emissions.
- Omitting dependencies can cause stale closures and subtle bugs.

### Event flow for drag

1. ECharts `graphic` circle receives pointer drag (`draggable: true`).
2. `ondrag` callback fires continuously.
3. Pixel position (`this.x`, `this.y`) converted to data coords via `convertFromPixel`.
4. Data updated (`dataRef.current[dataIndex] = nextPoint`).
5. Series updated via `chart.setOption({ series: [...] })`.
6. Overlay positions re-synced on zoom/resize with `updatePosition`.

### Optional chaining

- `chartRef.current?.getEchartsInstance?.()` safely calls method only if each step exists.
- Prevents null/undefined runtime errors.

### `useEffect` cleanup

- Cleanup must be returned from `useEffect`.
- React runs cleanup:
  - before effect re-runs
  - on component unmount
- If cleanup calls were in effect body, they’d run immediately and break setup.

### `setTimeout(..., 0)`

- Schedules async execution on a later event-loop turn, not immediately.
- Used to defer `updatePosition()` until chart/layout is ready.
- `timerId` is a handle for cancellation via `clearTimeout(timerId)`.

### Handle terminology

A "handle" is a reference/token used to manage something later.
Examples:
- timeout handle (`timerId`)
- event listener callback references
- refs to instances (`chartRef`)

## Clarifications we settled

- `dataRef.current` is an array of points and can be mapped.
- `getEchartsInstance()` belongs to `chartRef.current`, not `dataRef.current`.
- Defining a function like `const handleUpdate = () => ...` does not execute it.
- `setTimeout(() => ..., 0)` does schedule execution.
- `useRef` and `useState` both persist values across renders, but only `useState` triggers re-render.

## Current practical pattern recommendation

For drag-heavy charts:
- Keep drag-time data in `useRef`
- Use imperative chart updates in drag handlers
- If external React UI needs live values, sync from ref to state on `ondragend` or throttled intervals

---

If you want, add your own notes below as you continue experimenting.
