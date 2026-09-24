import type { SVGProps } from 'react'

/** Icone originali per le categorie senza equivalente in lucide. Stile: tratto 2px, angoli arrotondati. */
function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

export function FeedingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M12 2.8c3 3.6 6 7.1 6 10.6a6 6 0 0 1-12 0c0-3.5 3-7 6-10.6Z" />
      <path d="M9.4 14.6a2.8 2.8 0 0 0 2.6 2.2" />
    </Svg>
  )
}

export function DiaperIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M3 6.5h18V9c0 5.5-4 10-9 10S3 14.5 3 9V6.5Z" />
      <path d="M3.4 11H7a5 5 0 0 1 5 5v3M20.6 11H17a5 5 0 0 0-5 5" />
    </Svg>
  )
}

export function BottleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M10.5 5.5c0-1.7.7-3 1.5-3s1.5 1.3 1.5 3" />
      <rect x="8" y="5.5" width="8" height="3" rx="1" />
      <path d="M9 8.5v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-11" />
      <path d="M9 13h2.5M9 16.5h2.5" />
    </Svg>
  )
}

export function PumpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M4 3.5h10l-3 5H7Z" />
      <path d="M9 8.5v2" />
      <rect x="6" y="10.5" width="6" height="10.5" rx="2" />
      <path d="M14 5.5h3a2.5 2.5 0 0 1 2.5 2.5v5" />
      <path d="M17.5 13h4" />
    </Svg>
  )
}

export function StoolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M6 20h12a2.8 2.8 0 0 0 .6-5.5 2.8 2.8 0 0 0-2.1-4.3 2.6 2.6 0 0 0-2.4-3.3c.2-1.4-.5-2.7-1.8-3.4.1 1.5-1 2.4-2.6 3a2.8 2.8 0 0 0-1.4 5 2.8 2.8 0 0 0-2.4 3.2A2.8 2.8 0 0 0 6 20Z" />
    </Svg>
  )
}
