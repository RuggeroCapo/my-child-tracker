import clsx from 'clsx'
import { Maximize2 } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import type { ReferenceCurve } from '@/domain/growth/percentile'
import { formatNumber } from '@/lib/units'

export interface ChartPoint {
  x: number
  y: number
}

/** Porzione visibile del grafico, in unità dei dati (mesi × unità di misura). */
export interface ChartView {
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface ChartPadding {
  top: number
  right: number
  bottom: number
  left: number
}

const W = 340
const H = 230
const PAD: ChartPadding = { top: 12, right: 34, bottom: 30, left: 36 }

function niceStep(range: number, target = 5) {
  const raw = range / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pow
}

function monthStep(span: number) {
  return span <= 1 ? 0.25 : span <= 3 ? 0.5 : span <= 8 ? 1 : span <= 16 ? 2 : 4
}

/** Riquadro che contiene misure e curve fino a `xMax`, con un po' di respiro sopra e sotto. */
export function fitView(points: ChartPoint[], curves: ReferenceCurve[] | undefined, xMax: number): ChartView {
  const ys: number[] = points.map((p) => p.y)
  for (const c of curves ?? []) for (const p of c.points) if (p.month <= xMax) ys.push(p.value)
  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  if (!Number.isFinite(yMin)) {
    yMin = 0
    yMax = 1
  }
  const span = yMax - yMin || Math.max(1, yMax * 0.1)
  return { x0: 0, x1: xMax, y0: yMin - span * 0.06, y1: yMax + span * 0.06 }
}

export function chartScales(view: ChartView, width: number, height: number, pad: ChartPadding) {
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  return {
    plotW,
    plotH,
    sx: (x: number) => pad.left + ((x - view.x0) / (view.x1 - view.x0)) * plotW,
    sy: (y: number) => pad.top + (1 - (y - view.y0) / (view.y1 - view.y0)) * plotH,
  }
}

/**
 * Strati del grafico di crescita: griglia, assi, curve OMS e misure. Disegna la porzione `view`
 * dentro un'area `width × height` (unità del viewBox). Con `clipId` curve e misure non escono
 * dall'area del grafico, utile quando si ingrandisce.
 */
export function GrowthChartLayers({
  points,
  curves,
  view,
  width,
  height,
  pad,
  xLabel,
  unit,
  color,
  clipId,
  highlight,
  children,
}: {
  points: ChartPoint[]
  curves?: ReferenceCurve[]
  view: ChartView
  width: number
  height: number
  pad: ChartPadding
  xLabel: string
  unit: string
  color: string
  clipId?: string
  highlight?: number | null
  children?: ReactNode
}) {
  const { sx, sy } = chartScales(view, width, height, pad)
  const yStep = niceStep(view.y1 - view.y0)
  const yTicks: number[] = []
  for (let v = Math.ceil(view.y0 / yStep) * yStep; v <= view.y1 + 1e-9; v += yStep) yTicks.push(Number(v.toFixed(6)))
  const xStep = monthStep(view.x1 - view.x0)
  const xTicks: number[] = []
  for (let v = Math.ceil(view.x0 / xStep - 1e-9) * xStep; v <= view.x1 + 1e-9; v += xStep) xTicks.push(Number(v.toFixed(2)))
  const yDigits = yStep < 0.1 ? 2 : 1

  const path = (pts: ChartPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')
  const curve = (p: number) => curves?.find((c) => c.percentile === p)?.points.map((q) => ({ x: q.month, y: q.value })) ?? []
  const band = (lo: number, hi: number) => {
    const a = curve(lo)
    const b = curve(hi)
    if (!a.length || !b.length) return ''
    return `${path(a)}${[...b].reverse().map((p) => `L${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')}Z`
  }
  const series = [...points].sort((a, b) => a.x - b.x)
  const right = width - pad.right
  const bottom = height - pad.bottom
  const clip = clipId ? `url(#${clipId})` : undefined

  return (
    <>
      {clipId && (
        <defs>
          <clipPath id={clipId}>
            {/* Qualche pixel in più: i punti sul bordo restano interi. */}
            <rect x={pad.left - 6} y={pad.top - 6} width={right - pad.left + 12} height={bottom - pad.top + 12} />
          </clipPath>
        </defs>
      )}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={pad.left} x2={right} y1={sy(t)} y2={sy(t)} className="stroke-line" strokeWidth={1} />
          <text x={pad.left - 6} y={sy(t) + 3.5} textAnchor="end" className="fill-ink-3 text-[10px] tabular">
            {formatNumber(t, yDigits)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={sx(t)} y={bottom + 14} textAnchor="middle" className="fill-ink-3 text-[10px] tabular">
          {formatNumber(t, 2)}
        </text>
      ))}
      <text x={(pad.left + right) / 2} y={height - 3} textAnchor="middle" className="fill-ink-3 text-[10px]">
        {xLabel}
      </text>
      <text x={4} y={pad.top - 2} className="fill-ink-3 text-[10px]">
        {unit}
      </text>

      <g clipPath={clip}>
        {curves && (
          <g>
            <path d={band(3, 97)} fill={color} opacity={0.08} />
            <path d={band(15, 85)} fill={color} opacity={0.1} />
            {curves.map((c) => (
              <path
                key={c.percentile}
                d={path(curve(c.percentile))}
                fill="none"
                stroke={color}
                strokeOpacity={c.percentile === 50 ? 0.55 : 0.3}
                strokeWidth={c.percentile === 50 ? 1.5 : 1}
                strokeDasharray={c.percentile === 50 ? undefined : '4 3'}
              />
            ))}
          </g>
        )}
        {children}
        {series.length > 1 && <path d={path(series)} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />}
        {points.map((p, i) => (
          <g key={i}>
            {highlight === i && <circle cx={sx(p.x)} cy={sy(p.y)} r={10} fill={color} opacity={0.22} />}
            <circle cx={sx(p.x)} cy={sy(p.y)} r={highlight === i ? 6 : 4.5} fill={color} className="stroke-surface" strokeWidth={2} />
          </g>
        ))}
      </g>

      {/* Etichette dei percentili al bordo destro, all'altezza in cui ogni curva esce dalla vista. */}
      {curves?.map((c) => {
        const pts = curve(c.percentile).filter((q) => q.x <= view.x1 + 1e-9)
        const last = pts[pts.length - 1]
        if (!last || last.x < view.x0 || last.y < view.y0 || last.y > view.y1) return null
        return (
          <text key={c.percentile} x={sx(last.x) + 4} y={sy(last.y) + 3} className="fill-ink-3 text-[9px]">
            {c.percentile}°
          </text>
        )
      })}
    </>
  )
}

export function GrowthLegend({ color, curves }: { color: string; curves: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-ink-2">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: color }} /> Misura registrata
      </span>
      {curves && (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ background: color, opacity: 0.55 }} /> Mediana OMS (50°)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: color, opacity: 0.18 }} /> Curve di riferimento 3°–97°
          </span>
        </>
      )}
    </div>
  )
}

/**
 * Grafico di crescita in SVG. Distingue visivamente:
 * - le misure registrate (punti pieni collegati);
 * - le curve percentili OMS di riferimento (linee sottili + fascia 3°–97°).
 */
export function GrowthChart({
  points,
  curves,
  xMax,
  xLabel,
  unit,
  color = 'var(--color-diaper)',
  onExpand,
}: {
  points: ChartPoint[]
  curves?: ReferenceCurve[]
  xMax: number
  xLabel: string
  unit: string
  color?: string
  /** Se presente, il grafico si apre a schermo intero toccandolo o con il pulsante accanto alla legenda. */
  onExpand?: () => void
}) {
  const view = useMemo(() => fitView(points, curves, xMax), [points, curves, xMax])
  const visibleCurves = useMemo(
    () => curves?.map((c) => ({ ...c, points: c.points.filter((q) => q.month <= xMax + 1e-9) })),
    [curves, xMax],
  )

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={clsx('w-full', onExpand && 'cursor-zoom-in')}
        onClick={onExpand}
        role="img"
        aria-label={`Grafico: ${points.length} misurazioni${curves ? ' sovrapposte alle curve percentili OMS' : ''}`}
      >
        <GrowthChartLayers
          points={points}
          curves={visibleCurves}
          view={view}
          width={W}
          height={H}
          pad={PAD}
          xLabel={xLabel}
          unit={unit}
          color={color}
        />
      </svg>
      <figcaption className="flex items-start justify-between gap-2">
        <GrowthLegend color={color} curves={!!curves} />
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label="Ingrandisci il grafico"
            className="-mt-2 -mr-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-semibold text-ink-2 transition-[color,transform] duration-150 ease-out-quart hover:text-ink active:scale-95"
          >
            <Maximize2 className="size-3.5" /> Espandi
          </button>
        )}
      </figcaption>
    </figure>
  )
}
