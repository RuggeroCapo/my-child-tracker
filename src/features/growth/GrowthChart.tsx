import { useMemo } from 'react'
import type { ReferenceCurve } from '@/domain/growth/percentile'
import { formatNumber } from '@/lib/units'

export interface ChartPoint {
  x: number
  y: number
}

const W = 340
const H = 230
const PAD = { top: 12, right: 34, bottom: 30, left: 36 }

function niceStep(range: number, target = 5) {
  const raw = range / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pow
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
}: {
  points: ChartPoint[]
  curves?: ReferenceCurve[]
  xMax: number
  xLabel: string
  unit: string
  color?: string
}) {
  const layout = useMemo(() => {
    const ys: number[] = points.map((p) => p.y)
    for (const c of curves ?? []) for (const p of c.points) if (p.month <= xMax) ys.push(p.value)
    let yMin = Math.min(...ys)
    let yMax = Math.max(...ys)
    if (!Number.isFinite(yMin)) {
      yMin = 0
      yMax = 1
    }
    const span = yMax - yMin || Math.max(1, yMax * 0.1)
    yMin -= span * 0.06
    yMax += span * 0.06
    const step = niceStep(yMax - yMin)
    const yTicks: number[] = []
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) yTicks.push(Number(v.toFixed(6)))
    const xStep = xMax <= 3 ? 0.5 : xMax <= 8 ? 1 : xMax <= 16 ? 2 : 4
    const xTicks: number[] = []
    for (let v = 0; v <= xMax + 1e-9; v += xStep) xTicks.push(Number(v.toFixed(2)))
    const sx = (x: number) => PAD.left + (x / xMax) * (W - PAD.left - PAD.right)
    const sy = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom)
    return { sx, sy, yTicks, xTicks }
  }, [points, curves, xMax])

  const { sx, sy, yTicks, xTicks } = layout
  const path = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')
  const curve = (p: number) => curves?.find((c) => c.percentile === p)?.points.filter((q) => q.month <= xMax + 1e-9).map((q) => ({ x: q.month, y: q.value })) ?? []
  const band = (lo: number, hi: number) => {
    const a = curve(lo)
    const b = curve(hi)
    if (!a.length || !b.length) return ''
    return `${path(a)}${[...b].reverse().map((p) => `L${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('')}Z`
  }
  const series = [...points].sort((a, b) => a.x - b.x)

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Grafico: ${points.length} misurazioni${curves ? ' sovrapposte alle curve percentili OMS' : ''}`}
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={sy(t)} y2={sy(t)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.left - 6} y={sy(t) + 3.5} textAnchor="end" className="fill-ink-3 text-[10px]">
              {formatNumber(t, 1)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={sx(t)} y={H - PAD.bottom + 14} textAnchor="middle" className="fill-ink-3 text-[10px]">
            {formatNumber(t, 1)}
          </text>
        ))}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 3} textAnchor="middle" className="fill-ink-3 text-[10px]">
          {xLabel}
        </text>
        <text x={4} y={PAD.top - 2} className="fill-ink-3 text-[10px]">
          {unit}
        </text>

        {curves && (
          <g>
            <path d={band(3, 97)} fill={color} opacity={0.08} />
            <path d={band(15, 85)} fill={color} opacity={0.1} />
            {curves.map((c) => {
              const pts = curve(c.percentile)
              const last = pts[pts.length - 1]
              return (
                <g key={c.percentile}>
                  <path
                    d={path(pts)}
                    fill="none"
                    stroke={color}
                    strokeOpacity={c.percentile === 50 ? 0.55 : 0.3}
                    strokeWidth={c.percentile === 50 ? 1.5 : 1}
                    strokeDasharray={c.percentile === 50 ? undefined : '4 3'}
                  />
                  {last && (
                    <text x={sx(last.x) + 4} y={sy(last.y) + 3} className="fill-ink-3 text-[9px]">
                      {c.percentile}°
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )}

        {series.length > 1 && <path d={path(series)} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />}
        {series.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={color} className="stroke-surface" strokeWidth={2} />
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-ink-2">
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
      </figcaption>
    </figure>
  )
}
