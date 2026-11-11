import { useCallback, useEffect, useState } from 'react'
import { getTodayHKT, msUntilNextHKTMidnight } from '../lib/dates.js'
import ClassGuide from './ClassGuide.jsx'
import CalendarPopover from './CalendarPopover.jsx'
import AccountMenu from './AccountMenu.jsx'

// "2026-11-11" -> "Wednesday 11 November". The date string is already the HKT
// day, so it is formatted as a UTC date to avoid any local-zone shift.
function formatLongDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

// Today in HKT, refreshed at HKT midnight so the header never shows yesterday.
function useTodayHKT() {
  const [today, setToday] = useState(getTodayHKT)
  useEffect(() => {
    const id = setTimeout(() => setToday(getTodayHKT()), msUntilNextHKTMidnight() + 1000)
    return () => clearTimeout(id)
  }, [today])
  return today
}

// Sticky top bar: brand + today's date, then Classes and Calendar (one click
// away) and the avatar's account menu. Only one popover is open at a time.
export default function Header() {
  const today = useTodayHKT()
  const [openPop, setOpenPop] = useState(null) // 'classes' | 'calendar' | 'account' | null

  const close = useCallback(() => setOpenPop(null), [])
  const toggle = (key) => () => setOpenPop((cur) => (cur === key ? null : key))

  return (
    <header className="topbar">
      <div className="brand">
        <h1 className="brand-name">
          <span className="brand-mark" aria-hidden="true" />
          School Tasks
        </h1>
        <span className="brand-date">{formatLongDate(today)}</span>
      </div>
      <div className="tools">
        <ClassGuide
          open={openPop === 'classes'}
          onToggle={toggle('classes')}
          onClose={close}
        />
        <CalendarPopover
          open={openPop === 'calendar'}
          onToggle={toggle('calendar')}
          onClose={close}
        />
        <AccountMenu
          open={openPop === 'account'}
          onToggle={toggle('account')}
          onClose={close}
        />
      </div>
    </header>
  )
}
