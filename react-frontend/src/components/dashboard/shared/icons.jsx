// Stroke-based icon set (matches the login page's icon style: 24x24, currentColor,
// 1.8 stroke) so nav chrome and auth screens read as one consistent visual system.

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}

export function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h4" strokeLinecap="round" />
    </svg>
  )
}

export function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M6 3.5h12v17l-2.2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 20.5Z"
        strokeLinejoin="round"
      />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PiggyBankIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 13c0-3.5 2.9-6 6.8-6 2 0 3.6.6 4.7 1.6l2.5-.7-.6 2.3c.7.9 1.1 2 1.1 3.1 0 3.3-3.4 5.7-7.7 5.7S4 16.6 4 13Z"
        strokeLinejoin="round"
      />
      <path d="M8.5 17.5 8 20M15 17.5l.5 2.5" strokeLinecap="round" />
      <path d="M9.5 11h.01" strokeLinecap="round" />
      <path d="M4 12.5 2 12" strokeLinecap="round" />
    </svg>
  )
}

export function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h11a2 2 0 0 1 2 2v.5" strokeLinecap="round" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M15.5 14a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5 22 20.5H2Z" strokeLinejoin="round" />
      <path d="M12 9.5v5" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Account Nickname -> icon component, shared by AccountCard and AccountLayout
// so the same account always shows the same icon everywhere it appears.
export const NICKNAME_ICONS = {
  Bills: ReceiptIcon,
  Household: HomeIcon,
  Savings: PiggyBankIcon,
  Everyday: WalletIcon,
  Emergency: AlertIcon,
}

export function AccountNicknameIcon({ nickname }) {
  const Icon = NICKNAME_ICONS[nickname] || WalletIcon
  return <Icon />
}
