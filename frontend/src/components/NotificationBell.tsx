import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api, unwrap } from '../lib/api';
import type { Notification } from '../types';
import { wsService } from '../lib/websocket';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = () => {
    api.get('/notifications/unread-count').then(r => setCount(unwrap<{count:number}>(r).count)).catch(() => {});
    api.get('/notifications').then(r => setItems(unwrap<Notification[]>(r).slice(0, 8))).catch(() => {});
  };
  useEffect(() => { 
    load(); 
    if (user) {
        const handleNotif = (msg: any) => {
            setItems(prev => [msg, ...prev]);
            setCount(c => c + 1);
        };
        wsService.subscribe(`/topic/user/${user.id}`, handleNotif);
        return () => {
            wsService.unsubscribe(`/topic/user/${user.id}`, handleNotif);
        };
    }
  }, [user]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="btn-secondary relative p-2">
        <Bell className="h-4 w-4" />
        {count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border p-2 shadow-lg" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {items.length === 0 && <p className="p-2 text-sm" style={{ color: 'var(--color-muted)' }}>No notifications</p>}
          {items.map(n => (
            <div key={n.id} className="border-b p-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-medium">{n.title}</p><p style={{ color: 'var(--color-muted)' }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
