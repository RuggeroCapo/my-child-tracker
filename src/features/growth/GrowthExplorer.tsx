import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { formatPercentile, lmsAt, percentileOf, referenceCurves, REFERENCE_PERCENTILES, valueAtPercentile, WHO_MAX_MONTHS } from '@/domain/growth/percentile'
import type { Baby, EventOf, MeasurementMetric } from '@/domain/types'
import { ageInMonths, formatAge, formatShortDate } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { chartScales, fitView, GrowthChartLayers, GrowthLegend, type ChartPadding, type ChartView } from './GrowthChart'
import { METRIC_COLOR, METRIC_TABS, useGrowthData } from './growthData'

const PAD: ChartPadding = { top: 16, right: 30, bottom: 32, left: 44 }
/** Ingrandimento massimo: mezzo mese in orizzontale, 1/30 dell'intervallo in verticale. */
const MIN_SPAN_X = 0.5
const MIN_SPAN_Y_RATIO = 1 / 30
/** Raggio (px) entro cui un tocco seleziona una misura. */
const HIT_RADIUS = 24
const TAP_SLOP = 6
const DOUBLE_TAP_MS = 300

type Probe = { kind: 'point'; index: number } | { kind: 'age'; x: number } | null

type Gesture =
  | { kind: 'pan'; id: number; x: number; y: number; view0: ChartView; moved: boolean }
  | { kind: 'pinch'; view0: ChartView; dist0: number; fx: number; fy: number }

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Grafico di crescita a schermo intero: schede per metrica, zoom (pizzico, rotella, doppio tocco, pulsanti) e dettagli al tocco. */
export function GrowthExplorer({
  open,
  onClose,
  baby,
  measurements,
  metric,
  onMetricChange,
}: {
  open: boolean
  onClose: () => void
  baby: Baby
  measurements: EventOf<'measurement'>[]
  metric: MeasurementMetric
  onMetricChange: (m: MeasurementMetric) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Curve di crescita" className="sm:max-w-3xl">
      <div className="space-y-3">
        <Segmented<MeasurementMetric> ariaLabel="Curva" value={metric} onChange={onMetricChange} options={METRIC_TABS} />
        {/* key: cambiando scheda zoom e selezione ripartono da capo. */}
        <ExplorerChart key={metric} baby={baby} measurements={measurements} metric={metric} />
      </div>
    </Sheet>
  )
}

function ExplorerChart({ baby, measurements, metric }: { baby: Baby; measurements: EventOf<'measurement'>[]; metric: MeasurementMetric }) {
  const { series: allSeries, xMax, points: pagePoints, lastAge, unit } = useGrowthData(baby, measurements, metric)
  const color = METRIC_COLOR[metric]
  const clipId = useId().replace(/:/g, '')

  // Qui le curve coprono sempre tutti i 24 mesi OMS: si può scorrere oltre la finestra della pagina.
  const curves = useMemo(() => (baby.sex ? referenceCurves(baby.sex, metric, WHO_MAX_MONTHS) : undefined), [baby.sex, metric])
  // Stesso indice in `series` e `points`: le misure prima della nascita restano fuori da entrambe.
  const series = useMemo(() => allSeries.filter((p) => ageInMonths(baby.birth_date, p.date) >= 0), [allSeries, baby.birth_date])
  const points = useMemo(() => series.map((p) => ({ x: ageInMonths(baby.birth_date, p.date), y: p.value })), [series, baby.birth_date])
  const initial = useMemo(() => fitView(pagePoints, curves, xMax), [pagePoints, curves, xMax])
  const full = useMemo(() => {
    const domainX = Math.max(xMax, curves ? WHO_MAX_MONTHS : 0, Math.ceil(lastAge + 1))
    return fitView(points, curves, domainX)
  }, [points, curves, xMax, lastAge])
  const minSpanY = (full.y1 - full.y0) * MIN_SPAN_Y_RATIO

  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState(initial)
  const viewRef = useRef(view)
  const [probe, setProbe] = useState<Probe>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const anim = useRef(0)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const clamp = useCallback(
    (v: ChartView): ChartView => {
      const spanX = Math.min(Math.max(v.x1 - v.x0, MIN_SPAN_X), full.x1 - full.x0)
      const spanY = Math.min(Math.max(v.y1 - v.y0, minSpanY), full.y1 - full.y0)
      const x0 = Math.min(Math.max(v.x0, full.x0), full.x1 - spanX)
      const y0 = Math.min(Math.max(v.y0, full.y0), full.y1 - spanY)
      return { x0, x1: x0 + spanX, y0, y1: y0 + spanY }
    },
    [full, minSpanY],
  )

  const apply = useCallback(
    (v: ChartView) => {
      const next = clamp(v)
      viewRef.current = next
      setView(next)
    },
    [clamp],
  )

  const animateTo = useCallback(
    (target: ChartView) => {
      cancelAnimationFrame(anim.current)
      const to = clamp(target)
      const from = viewRef.current
      if (reduceMotion()) return apply(to)
      const t0 = performance.now()
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 260)
        const e = 1 - Math.pow(1 - k, 3)
        apply({
          x0: from.x0 + (to.x0 - from.x0) * e,
          x1: from.x1 + (to.x1 - from.x1) * e,
          y0: from.y0 + (to.y0 - from.y0) * e,
          y1: from.y1 + (to.y1 - from.y1) * e,
        })
        if (k < 1) anim.current = requestAnimationFrame(step)
      }
      anim.current = requestAnimationFrame(step)
    },
    [apply, clamp],
  )

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  const plotW = size.w - PAD.left - PAD.right
  const plotH = size.h - PAD.top - PAD.bottom

  /** Da pixel (relativi al riquadro) a unità dei dati, per una data vista. */
  const toData = useCallback(
    (v: ChartView, px: number, py: number) => ({
      x: v.x0 + ((px - PAD.left) / plotW) * (v.x1 - v.x0),
      y: v.y1 - ((py - PAD.top) / plotH) * (v.y1 - v.y0),
    }),
    [plotW, plotH],
  )

  /** Fattore di zoom (<1 ingrandisce) limitato così che nessun asse superi l'ingrandimento massimo. */
  const limitFactor = useCallback(
    (v: ChartView, f: number) => Math.max(f, Math.min(1, Math.max(MIN_SPAN_X / (v.x1 - v.x0), minSpanY / (v.y1 - v.y0)))),
    [minSpanY],
  )

  const zoomAround = useCallback(
    (v: ChartView, factor: number, fx: number, fy: number): ChartView => {
      const f = limitFactor(v, factor)
      return { x0: fx - (fx - v.x0) * f, x1: fx + (v.x1 - fx) * f, y0: fy - (fy - v.y0) * f, y1: fy + (v.y1 - fy) * f }
    },
    [limitFactor],
  )

  const zoomCenter = (factor: number) => {
    const v = viewRef.current
    animateTo(zoomAround(v, factor, (v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2))
  }

  // La rotella va ascoltata non passiva per bloccare lo scroll della pagina.
  useEffect(() => {
    const el = box.current
    if (!el || plotW <= 0) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelAnimationFrame(anim.current)
      const rect = el.getBoundingClientRect()
      const v = viewRef.current
      const scale = e.deltaMode === 1 ? 16 : 1
      if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const dx = (e.deltaX * scale * (v.x1 - v.x0)) / plotW
        apply({ ...v, x0: v.x0 + dx, x1: v.x1 + dx })
        return
      }
      const f = toData(v, e.clientX - rect.left, e.clientY - rect.top)
      apply(zoomAround(v, Math.exp(e.deltaY * scale * (e.ctrlKey ? 0.01 : 0.002)), f.x, f.y))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [apply, toData, zoomAround, plotW])

  const local = (e: PointerEvent) => {
    const rect = box.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startPan(id: number, p: { x: number; y: number }, moved: boolean) {
    gesture.current = { kind: 'pan', id, x: p.x, y: p.y, view0: viewRef.current, moved }
  }

  function startPinch() {
    const [a, b] = [...pointers.current.values()]
    const f = toData(viewRef.current, (a.x + b.x) / 2, (a.y + b.y) / 2)
    gesture.current = { kind: 'pinch', view0: viewRef.current, dist0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), fx: f.x, fy: f.y }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    cancelAnimationFrame(anim.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) startPan(e.pointerId, p, false)
    else if (pointers.current.size === 2) startPinch()
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    const g = gesture.current
    if (!g) return
    if (g.kind === 'pan' && g.id === e.pointerId) {
      const dx = p.x - g.x
      const dy = p.y - g.y
      if (!g.moved && Math.hypot(dx, dy) < TAP_SLOP) return
      g.moved = true
      const v = g.view0
      const mx = (dx / plotW) * (v.x1 - v.x0)
      const my = (dy / plotH) * (v.y1 - v.y0)
      apply({ x0: v.x0 - mx, x1: v.x1 - mx, y0: v.y0 + my, y1: v.y1 + my })
    } else if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const v = g.view0
      const f = limitFactor(v, g.dist0 / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)))
      const spanX = (v.x1 - v.x0) * f
      const spanY = (v.y1 - v.y0) * f
      // Il punto dei dati che stava fra le dita resta fra le dita.
      const x0 = g.fx - (((a.x + b.x) / 2 - PAD.left) / plotW) * spanX
      const y1 = g.fy + (((a.y + b.y) / 2 - PAD.top) / plotH) * spanY
      apply({ x0, x1: x0 + spanX, y0: y1 - spanY, y1 })
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (pointers.current.size === 1) {
      // Da pizzico a trascinamento con il dito rimasto, senza scatti.
      const [[id, q]] = [...pointers.current.entries()]
      startPan(id, q, true)
      return
    }
    gesture.current = null
    if (e.type === 'pointercancel' || !g || g.kind !== 'pan' || g.moved) return
    const last = lastTap.current
    if (last && e.timeStamp - last.t < DOUBLE_TAP_MS && Math.hypot(p.x - last.x, p.y - last.y) < HIT_RADIUS) {
      lastTap.current = null
      const v = viewRef.current
      const atMax = limitFactor(v, 0.5) >= 0.99
      if (atMax) animateTo(initial)
      else {
        const f = toData(v, p.x, p.y)
        animateTo(zoomAround(v, 0.5, f.x, f.y))
      }
      return
    }
    lastTap.current = { t: e.timeStamp, x: p.x, y: p.y }
    tap(p.x, p.y)
  }

  function tap(px: number, py: number) {
    const { sx, sy } = chartScales(viewRef.current, size.w, size.h, PAD)
    let best = -1
    let bestD = HIT_RADIUS
    points.forEach((q, i) => {
      const d = Math.hypot(sx(q.x) - px, sy(q.y) - py)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    if (best >= 0) return setProbe({ kind: 'point', index: best })
    const inside = px >= PAD.left && px <= size.w - PAD.right && py >= PAD.top && py <= size.h - PAD.bottom
    const x = toData(viewRef.current, px, py).x
    setProbe(inside && curves && x >= 0 && x <= WHO_MAX_MONTHS ? { kind: 'age', x } : null)
  }

  /** Seleziona una misura e, se è fuori dalla vista, la riporta al centro. */
  function selectPoint(index: number) {
    setProbe({ kind: 'point', index })
    const q = points[index]
    const v = viewRef.current
    if (q.x < v.x0 || q.x > v.x1 || q.y < v.y0 || q.y > v.y1) {
      const hx = (v.x1 - v.x0) / 2
      const hy = (v.y1 - v.y0) / 2
      animateTo({ x0: q.x - hx, x1: q.x + hx, y0: q.y - hy, y1: q.y + hy })
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const v = viewRef.current
    const px = (v.x1 - v.x0) * 0.1
    const py = (v.y1 - v.y0) * 0.1
    const moves: Record<string, [number, number]> = { ArrowLeft: [-px, 0], ArrowRight: [px, 0], ArrowUp: [0, py], ArrowDown: [0, -py] }
    if (moves[e.key]) {
      const [dx, dy] = moves[e.key]
      apply({ x0: v.x0 + dx, x1: v.x1 + dx, y0: v.y0 + dy, y1: v.y1 + dy })
    } else if (e.key === '+' || e.key === '=') zoomCenter(1 / 1.5)
    else if (e.key === '-') zoomCenter(1.5)
    else if (e.key === '0') animateTo(initial)
    else return
    e.preventDefault()
  }

  const zoomed = Math.abs(view.x1 - view.x0 - (initial.x1 - initial.x0)) > 1e-3 || Math.abs(view.x0 - initial.x0) > 1e-3 || Math.abs(view.y0 - initial.y0) > 1e-3
  const canZoomIn = limitFactor(view, 0.99) < 1
  const canZoomOut = view.x1 - view.x0 < full.x1 - full.x0 - 1e-6 || view.y1 - view.y0 < full.y1 - full.y0 - 1e-6
  const scales = size.w ? chartScales(view, size.w, size.h, PAD) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-3 tabular">
          {formatNumber(view.x0, 1)}–{formatNumber(view.x1, 1)} mesi
        </p>
        <div className="flex gap-1.5">
          <ZoomButton label="Riduci" onClick={() => zoomCenter(1.5)} disabled={!canZoomOut}>
            <Minus className="size-5" />
          </ZoomButton>
          <ZoomButton label="Ingrandisci" onClick={() => zoomCenter(1 / 1.5)} disabled={!canZoomIn}>
            <Plus className="size-5" />
          </ZoomButton>
          <ZoomButton label="Ripristina vista" onClick={() => animateTo(initial)} disabled={!zoomed}>
            <RotateCcw className="size-4.5" />
          </ZoomButton>
        </div>
      </div>
      <div
        ref={box}
        tabIndex={0}
        role="application"
        aria-roledescription="grafico interattivo"
        aria-label={`Curva di ${METRIC_TABS.find((t) => t.value === metric)!.label.toLowerCase()}: ${points.length} misurazioni. Frecce per spostarsi, più e meno per lo zoom, zero per ripristinare.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative h-[clamp(240px,52dvh,520px)] cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-surface-2/60 outline-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
      >
        {scales && (
          <svg viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} className="block" aria-hidden>
            <GrowthChartLayers
              points={points}
              curves={curves}
              view={view}
              width={size.w}
              height={size.h}
              pad={PAD}
              xLabel="Età (mesi)"
              unit={unit}
              color={color}
              clipId={clipId}
              highlight={probe?.kind === 'point' ? probe.index : null}
            >
              {probe?.kind === 'age' && (
                <g>
                  <line x1={scales.sx(probe.x)} x2={scales.sx(probe.x)} y1={PAD.top} y2={size.h - PAD.bottom} stroke={color} strokeOpacity={0.6} strokeDasharray="3 3" />
                  {curves?.map((c) => {
                    const lms = lmsAt(baby.sex!, metric, probe.x)
                    if (!lms) return null
                    return <circle key={c.percentile} cx={scales.sx(probe.x)} cy={scales.sy(valueAtPercentile(lms, c.percentile))} r={3} fill={color} className="stroke-surface" strokeWidth={1.5} />
                  })}
                </g>
              )}
            </GrowthChartLayers>
          </svg>
        )}
      </div>

      <ProbeDetails
        baby={baby}
        metric={metric}
        unit={unit}
        probe={probe}
        series={series}
        points={points}
        onSelect={selectPoint}
      />
      <GrowthLegend color={color} curves={!!curves} />
    </div>
  )
}

function ZoomButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-ink transition-[opacity,transform] duration-150 ease-out-quart active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function ProbeDetails({
  baby,
  metric,
  unit,
  probe,
  series,
  points,
  onSelect,
}: {
  baby: Baby
  metric: MeasurementMetric
  unit: string
  probe: Probe
  series: { date: Date; value: number }[]
  points: { x: number; y: number }[]
  onSelect: (index: number) => void
}) {
  const digits = metric === 'weight' ? 3 : 1

  if (probe?.kind === 'point') {
    const i = probe.index
    const cur = series[i]
    const prev = i > 0 ? series[i - 1] : null
    const pct = baby.sex ? percentileOf(baby.sex, metric, points[i].x, cur.value) : null
    const days = prev ? (cur.date.getTime() - prev.date.getTime()) / 86_400_000 : 0
    const delta = prev ? cur.value - prev.value : null
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-2" aria-live="polite">
        <StepButton label="Misura precedente" onClick={() => onSelect(i - 1)} disabled={i === 0}>
          <ChevronLeft className="size-5" />
        </StepButton>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs text-ink-3">
            {formatShortDate(cur.date)} · {formatAge(baby.birth_date, cur.date)}
          </p>
          <p className="text-xl font-semibold tabular">
            {formatNumber(cur.value, digits)} <span className="text-sm text-ink-2">{unit}</span>
            {pct !== null && <span className="ml-2 text-sm font-medium text-ink-2">· {formatPercentile(pct)} percentile</span>}
          </p>
          {delta !== null && (
            <p className="text-xs text-ink-2 tabular">
              {delta >= 0 ? '+' : '−'}
              {formatNumber(Math.abs(metric === 'weight' ? delta * 1000 : delta), metric === 'weight' ? 0 : 1)} {metric === 'weight' ? 'g' : 'cm'} in{' '}
              {Math.round(days)} {Math.round(days) === 1 ? 'giorno' : 'giorni'}
              {metric === 'weight' && days >= 1 && <> · ≈ {formatNumber((delta * 1000) / days, 0)} g/giorno</>}
            </p>
          )}
        </div>
        <StepButton label="Misura successiva" onClick={() => onSelect(i + 1)} disabled={i === series.length - 1}>
          <ChevronRight className="size-5" />
        </StepButton>
      </div>
    )
  }

  if (probe?.kind === 'age' && baby.sex) {
    const lms = lmsAt(baby.sex, metric, probe.x)
    return (
      <div className="space-y-1.5 rounded-2xl bg-surface-2 p-3" aria-live="polite">
        <p className="text-xs text-ink-3">Riferimento OMS a {formatNumber(probe.x, 1)} mesi</p>
        <div className="grid grid-cols-5 gap-1 text-center">
          {REFERENCE_PERCENTILES.map((p) => (
            <div key={p}>
              <p className="text-[11px] text-ink-3">{p}°</p>
              <p className={clsx('text-sm tabular', p === 50 ? 'font-semibold' : 'font-medium text-ink-2')}>
                {lms ? formatNumber(valueAtPercentile(lms, p), metric === 'weight' ? 2 : 1) : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <p className="rounded-2xl bg-surface-2 px-3 py-2.5 text-center text-xs text-ink-2">
      {points.length ? 'Tocca una misura per i dettagli, o un punto del grafico per i valori OMS. ' : ''}
      Pizzica o usa la rotella per ingrandire, trascina per spostarti, doppio tocco per zoomare.
    </p>
  )
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-[color,background-color,transform] duration-150 ease-out-quart hover:bg-surface hover:text-ink active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  )
}
