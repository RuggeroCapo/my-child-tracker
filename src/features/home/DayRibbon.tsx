import clsx from 'clsx'
import type { BabyEvent, EventKind } from '@/domain/types'
import { startOfDay } from '@/lib/time'
import { KIND_META } from '../kinds'

const DAY_MS = 86_400_000

const LANES: { label: string; kinds: EventKind[]; always?: boolean }[] = [
  { label: 'Pasti', kinds: ['breastfeeding', 'bottle'], always: true },
  { label: 'Cambi', kinds: ['diaper'], always: true },
  { label: 'Tiralatte', kinds: ['pumping'] },
  { label: 'Altro', kinds: ['medication', 'vaccination', 'measurement', 'bath'] },
]

/** Il ritmo della giornata su una riga di 24 ore: i buchi tra i pasti si vedono a colpo d'occhio. */
export function DayRibbon({ events, now }: { events: BabyEvent[]; now: number }) {
  const day0 = startOfDay(new Date(now)).getTime()
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - day0) / DAY_MS) * 100))
  const nowPct = pct(now)
  const lanes = LANES.filter((l) => l.always || events.some((e) => l.kinds.includes(e.kind)))

  return (
    <div aria-hidden className="select-none">
      <div className="relative space-y-1.5">
        {lanes.map((lane) => (
          <div key={lane.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[11px] font-medium text-ink-3">{lane.label}</span>
            <div className="relative h-4 flex-1">
              <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
              <div className="absolute inset-y-0 left-0 top-1/2 h-px bg-ink-3/50" style={{ width: `${nowPct}%` }} />
              {events
                .filter((e) => lane.kinds.includes(e.kind))
                .map((e) => {
                  const start = Date.parse(e.started_at)
                  const end = e.ended_at ? Date.parse(e.ended_at) : isSession(e.kind) ? now : start
                  const left = pct(start)
                  const width = pct(end) - left
                  const solid = KIND_META[e.kind].solid
                  return width > 0.8 ? (
                    <span
                      key={e.id}
                      className={clsx('absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full ring-2 ring-bg', solid)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  ) : (
                    <span
                      key={e.id}
                      className={clsx('absolute top-1/2 size-2.5 -translate-1/2 rounded-full ring-2 ring-bg', solid)}
                      style={{ left: `${left}%` }}
                    />
                  )
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-3">
        <span className="w-16 shrink-0" />
        <div className="relative h-4 flex-1 text-[10px] font-medium text-ink-3 tabular">
          {[0, 6, 12, 18].filter((h) => Math.abs((h / 24) * 100 - nowPct) > 6).map((h) => (
            <span key={h} className="absolute" style={{ left: `${(h / 24) * 100}%` }}>
              {String(h).padStart(2, '0')}
            </span>
          ))}
          <span className="absolute -translate-x-1/2 font-semibold text-rose-ink" style={{ left: `${nowPct}%` }}>
            ora
          </span>
        </div>
      </div>
    </div>
  )
}

function isSession(kind: EventKind) {
  return kind === 'breastfeeding' || kind === 'pumping'
}
