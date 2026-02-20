import {
    LayoutDashboard,
    Calendar,
    PlusCircle,
    Users,
    User,
    Wallet,
} from 'lucide-react';

export const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/artists', label: 'Book Artist', icon: PlusCircle },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/profile', label: 'Profile', icon: User },
];
