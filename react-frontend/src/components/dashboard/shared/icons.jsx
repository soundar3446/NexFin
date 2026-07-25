// Stroke-based icon set (matches the login page's icon style: 24x24, currentColor,
// 1.8 stroke) so nav chrome and auth screens read as one consistent visual system.

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  )
}

export function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 5.2A10.6 10.6 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.2 2.5-2.3 3.7M6.5 6.6C4.4 8 2.9 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
        strokeLinecap="round"
      />
      <path d="M9.9 10a2.5 2.5 0 0 0 3.6 3.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

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

export function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18h7.2a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="21" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function UtensilsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3v7a2 2 0 0 0 4 0V3M9 3v18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3c-1.2 1.2-2 3-2 5s.8 3.8 2 5v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M4 16v-3.5L6 7.5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 7.5l2 5V16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 16h16v2.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17M8.5 17.5v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2.5" />
      <circle cx="7.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 3 5 13.5h6L11 21l8-10.5h-6Z" strokeLinejoin="round" />
    </svg>
  )
}

export function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l1 12.5H5Z" strokeLinejoin="round" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" strokeLinecap="round" />
    </svg>
  )
}

export function FilmIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M8 4.5v15M16 4.5v15M3.5 9h4.5M16 9h4.5M3.5 15h4.5M16 15h4.5" />
    </svg>
  )
}

export function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7.5h12.5A3.5 3.5 0 0 1 20 11v1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4 4 7.5 8 11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16.5H7.5A3.5 3.5 0 0 1 4 13v-1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20l4-3.5-4-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 20s-7.5-4.6-9.8-9.3C.7 7.2 2.4 4 5.7 4c1.9 0 3.3 1 4.3 2.4C11 5 12.4 4 14.3 4c3.3 0 5 3.2 3.5 6.7C15.5 15.4 12 20 12 20Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="m10.5 15-6 1.5 1.5-3 12-9c1-.8 2.3.5 1.5 1.5l-9 12-3 1.5 1.5-3Z"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6Z" strokeLinejoin="round" />
      <path d="M9.2 12l2 2 3.6-3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GraduationCapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 8.5 12 4l10 4.5-10 4.5-10-4.5Z" strokeLinejoin="round" />
      <path d="M6 10.5v4.3c0 1.4 2.7 2.7 6 2.7s6-1.3 6-2.7v-4.3" strokeLinecap="round" />
      <path d="M21 9v6" strokeLinecap="round" />
    </svg>
  )
}

export function BanknoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 8v.01M18 16v.01" strokeLinecap="round" />
    </svg>
  )
}

export function PercentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 6 6 18" strokeLinecap="round" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </svg>
  )
}

export function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" strokeLinecap="round" />
      <path d="M3 12.5h18" />
    </svg>
  )
}

export function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 16.5 9.5 10l4 4L21 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 6.5H21v5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8.5h10.5a5 5 0 0 1 0 10H9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4.5 4 8.5l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Category name -> icon component, shared everywhere a transaction shows a
// category (transaction rows across Overview/Transactions/Account pages).
export const CATEGORY_ICONS = {
  Groceries: CartIcon,
  'Dining & Restaurants': UtensilsIcon,
  Transport: CarIcon,
  'Utilities & Bills': BoltIcon,
  'Rent & Mortgage': HomeIcon,
  Shopping: BagIcon,
  'Entertainment & Leisure': FilmIcon,
  Subscriptions: RepeatIcon,
  'Health & Fitness': HeartIcon,
  Travel: PlaneIcon,
  Insurance: ShieldIcon,
  Education: GraduationCapIcon,
  'Cash Withdrawal': BanknoteIcon,
  'Fees & Charges': PercentIcon,
  'Other Expense': ReceiptIcon,
  Salary: BriefcaseIcon,
  'Interest & Investment Income': TrendingUpIcon,
  Refunds: UndoIcon,
  'Transfers In': RepeatIcon,
  'Other Income': WalletIcon,
  Transfers: RepeatIcon,
}

export function CategoryIcon({ category }) {
  const Icon = CATEGORY_ICONS[category] || ReceiptIcon
  return <Icon />
}
