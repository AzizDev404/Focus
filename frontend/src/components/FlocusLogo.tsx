/**
 * Focus wordmark — inline SVG.
 * "focus" title + wide-spaced "by tsukiyomi" subtitle, same colour.
 */
export function FlocusLogo() {
  return (
    <svg
      className="logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 380 160"
      width={380}
      height={160}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      role="img"
      aria-label="focus by tsukiyomi"
    >
      <text
        x="190"
        y="110"
        textAnchor="middle"
        fontFamily="'Degular Bold', 'Inter', system-ui, sans-serif"
        fontWeight={700}
        fontSize={110}
        letterSpacing="-0.02em"
        fill="#f5f5f7"
      >
        focus
      </text>

      <text
        x="190"
        y="146"
        textAnchor="middle"
        fontFamily="'Degular Semibold', 'Inter', system-ui, sans-serif"
        fontWeight={600}
        fontSize={18}
        letterSpacing="0.42em"
        fill="#f5f5f7"
      >
        by tsukiyomi
      </text>
    </svg>
  )
}
