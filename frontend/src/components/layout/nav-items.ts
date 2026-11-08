import { LayoutDashboard, Settings, Users } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const
