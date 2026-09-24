export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8FA6" />
          <stop offset="1" stopColor="#FF6B8B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-g)" />
      <path
        d="M32 47c-1 0-12-7.2-14.6-13.3C15.3 28.8 18 23 23.6 23c3.4 0 5.6 2 6.9 4 .7 1 2.3 1 3 0 1.3-2 3.5-4 6.9-4 5.6 0 8.3 5.8 6.2 10.7C44 39.8 33 47 32 47Z"
        fill="#fff"
      />
      <circle cx="32" cy="35" r="3.2" fill="#FF6B8B" opacity=".35" />
    </svg>
  )
}
