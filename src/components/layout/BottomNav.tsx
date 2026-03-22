import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, TrendingUp, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/nutrition', icon: UtensilsCrossed, label: 'Log' },
  { to: '/daily-detail', icon: TrendingUp, label: 'Progress' },
  { to: '/settings', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <Icon size={22} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
