export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="#f4617f" />
      <path
        d="M32 47c-1 0-12-7.2-14.6-13.3C15.3 28.8 18 23 23.6 23c3.4 0 5.6 2 6.9 4 .7 1 2.3 1 3 0 1.3-2 3.5-4 6.9-4 5.6 0 8.3 5.8 6.2 10.7C44 39.8 33 47 32 47Z"
        fill="#fff8f5"
      />
      <circle cx="32" cy="35" r="3.2" fill="#f4617f" opacity=".35" />
    </svg>
  )
}
