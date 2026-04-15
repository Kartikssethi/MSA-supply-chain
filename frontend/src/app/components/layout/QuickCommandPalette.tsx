import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LayoutDashboard, Truck, Users, Route, Map, Wrench, LogOut, Radar, ClipboardCheck } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../ui/command';
import { signOut } from '../../utils/auth';

type QuickCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const pages = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'G D' },
  { label: 'Vehicles', path: '/vehicles', icon: Truck, shortcut: 'G V' },
  { label: 'Drivers', path: '/drivers', icon: Users, shortcut: 'G R' },
  { label: 'Trips', path: '/trips', icon: Route, shortcut: 'G T' },
  { label: 'Tracking', path: '/tracking', icon: Map, shortcut: 'G K' },
  { label: 'Dispatch', path: '/dispatch', icon: ClipboardCheck, shortcut: 'G P' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, shortcut: 'G M' },
  { label: 'Operations', path: '/operations', icon: Radar, shortcut: 'G O' },
];

export const QuickCommandPalette = ({ open, onOpenChange }: QuickCommandPaletteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (!isShortcut) return;

      event.preventDefault();
      onOpenChange(!open);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const onNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const onSignOut = () => {
    signOut();
    navigate('/auth');
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages and quick actions..." />
      <CommandList>
        <CommandEmpty>No matching command found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {pages.map((page) => (
            <CommandItem key={page.path} onSelect={() => onNavigate(page.path)}>
              <page.icon className="h-4 w-4" />
              <span>{page.label}</span>
              <CommandShortcut>{page.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={onSignOut}>
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
