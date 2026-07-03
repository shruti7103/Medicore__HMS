import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api, unwrap } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { wsService } from '../../lib/websocket';

interface Message {
  id?: number;
  senderId: number;
  receiverId: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt?: string;
}

export default function MessagingCenter() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Message[]>([]);
  const [history, setHistory] = useState<Message[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications/messages/threads').then(r => setThreads(unwrap(r))).catch(() => {});
    
    wsService.subscribe(`/topic/messages/${user.id}`, (msg) => {
        if (msg.senderId === activePartnerId || msg.receiverId === activePartnerId) {
            setHistory(prev => [...prev, msg]);
        }
        api.get('/notifications/messages/threads').then(r => setThreads(unwrap(r))).catch(() => {});
    });
  }, [user, activePartnerId]);

  useEffect(() => {
    if (activePartnerId) {
      api.get(`/notifications/messages/history?otherUserId=${activePartnerId}`).then(r => setHistory(unwrap(r))).catch(() => {});
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const send = async () => {
    if (!input.trim() || !activePartnerId || !user) return;
    const msg = {
      receiverId: activePartnerId,
      senderName: user.name,
      content: input
    };
    try {
      const res = await api.post('/notifications/messages', msg);
      setHistory(prev => [...prev, unwrap(res)]);
      setInput('');
      api.get('/notifications/messages/threads').then(r => setThreads(unwrap(r))).catch(() => {});
    } catch {}
  };

  return (
    <DashboardLayout title="Messages" links={[{ to: '/messages', label: 'Inbox' }]}>
      <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        <div className="w-80 border-r border-[var(--color-border)] flex flex-col">
            <div className="p-4 border-b border-[var(--color-border)] font-bold text-lg">
                Conversations
            </div>
            <div className="flex-1 overflow-y-auto">
                {threads.map((t, idx) => {
                    const otherId = t.senderId === user?.id ? t.receiverId : t.senderId;
                    const otherName = t.senderId === user?.id ? "Recipient "+otherId : t.senderName;
                    return (
                        <div key={idx} onClick={() => setActivePartnerId(otherId)} 
                             className={`p-4 border-b border-[var(--color-border)] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${activePartnerId === otherId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                            <p className="font-semibold">{otherName}</p>
                            <p className="text-sm text-gray-500 truncate">{t.content}</p>
                        </div>
                    );
                })}
                {threads.length === 0 && <p className="p-4 text-gray-500">No conversations</p>}
            </div>
        </div>
        <div className="flex-1 flex flex-col">
            {activePartnerId ? (
                <>
                    <div className="p-4 border-b border-[var(--color-border)] font-bold text-lg">
                        Chat with User {activePartnerId}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {history.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-gray-500">{msg.senderName}</span>
                                <div className={`p-3 rounded-xl max-w-md ${msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
                        <input className="input-field flex-1" value={input} onChange={e => setInput(e.target.value)} 
                               onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." />
                        <button className="btn-primary" onClick={send}>Send</button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a conversation to start messaging
                </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
