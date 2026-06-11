import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import { useStore } from '../store/useStore.js';
import type { ChatMessage, FeedItem } from '../lib/types.js';

const EMOJIS = ['🚀', '🔥', '💎', '😎', '😱', '🍀', '💰', '🌉', '👀', '🎉'];

export default function SocialPanel() {
  const [tab, setTab] = useState<'chat' | 'wins' | 'board'>('chat');
  return (
    <div className="glass-panel flex h-full min-h-0 flex-col p-3">
      <div className="mb-2 flex rounded-lg bg-black/30 p-1 text-sm">
        {(['chat', 'wins', 'board'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 font-display capitalize transition ${tab === t ? 'bg-neon-purple/40 text-white' : 'text-white/50'}`}
          >
            {t === 'wins' ? 'Recent' : t === 'board' ? 'Leaders' : 'Chat'}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'chat' && <Chat />}
        {tab === 'wins' && <RecentWins />}
        {tab === 'board' && <Leaderboards />}
      </div>
    </div>
  );
}

function Chat() {
  const { user } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getSocket();
    const onHistory = (m: ChatMessage[]) => setMessages(m);
    const onMessage = (m: ChatMessage) => setMessages((prev) => [...prev.slice(-80), m]);
    const onErr = (e: { error: string }) => {
      setError(e.error);
      setTimeout(() => setError(''), 2500);
    };
    s.on('chat:history', onHistory);
    s.on('chat:message', onMessage);
    s.on('chat:error', onErr);
    return () => {
      s.off('chat:history', onHistory);
      s.off('chat:message', onMessage);
      s.off('chat:error', onErr);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    getSocket().emit('chat:send', { body });
    setText('');
    setShowEmoji(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-display text-neon-cyan">{m.username}</span>
            <span className="ml-2 break-words text-white/80">{m.body}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && <div className="py-1 text-xs text-neon-pink">{error}</div>}
      {showEmoji && (
        <div className="my-1 flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText((t) => t + e)} className="rounded p-1 text-lg hover:bg-white/10">
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1">
        <button onClick={() => setShowEmoji((v) => !v)} className="px-2 text-lg" title="Emoji">
          🙂
        </button>
        <input
          value={text}
          maxLength={240}
          disabled={!user}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={user ? 'Type a message…' : 'Log in to chat'}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
        />
        <button onClick={send} disabled={!user} className="btn bg-neon-purple/50 px-3 py-2 text-sm text-white">
          ➤
        </button>
      </div>
    </div>
  );
}

function RecentWins() {
  const [items, setItems] = useState<FeedItem[]>([]);
  useEffect(() => {
    api.leaderboards().then((d) => setItems(d.recent)).catch(() => {});
    const s = getSocket();
    const onResult = (r: FeedItem) => setItems((prev) => [r, ...prev].slice(0, 30));
    s.on('round:result', onResult);
    return () => {
      s.off('round:result', onResult);
    };
  }, []);
  return (
    <div className="scroll-thin h-full space-y-1 overflow-y-auto pr-1 text-sm">
      {items.map((r, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1.5">
          <span className="font-display text-white/80">{r.username}</span>
          <span className="text-white/40">€{r.bet.toFixed(2)}</span>
          <span className={r.status === 'cashed_out' ? 'text-neon-green' : 'text-neon-pink'}>
            {r.status === 'cashed_out' ? `${r.multiplier.toFixed(2)}×` : 'bust'}
          </span>
          <span className={r.status === 'cashed_out' ? 'text-neon-green' : 'text-white/30'}>€{r.payout.toFixed(2)}</span>
        </div>
      ))}
      {!items.length && <p className="py-6 text-center text-white/40">No rounds yet — be the first!</p>}
    </div>
  );
}

function Leaderboards() {
  const [data, setData] = useState<{ topWins: FeedItem[]; topMultipliers: FeedItem[] }>({ topWins: [], topMultipliers: [] });
  useEffect(() => {
    const load = () => api.leaderboards().then((d) => setData({ topWins: d.topWins, topMultipliers: d.topMultipliers })).catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="scroll-thin h-full space-y-3 overflow-y-auto pr-1 text-sm">
      <Board title="Biggest wins today" rows={data.topWins} render={(r) => `€${r.payout.toFixed(2)}`} accent="text-neon-green" />
      <Board title="Highest multiplier today" rows={data.topMultipliers} render={(r) => `${r.multiplier.toFixed(2)}×`} accent="text-neon-cyan" />
    </div>
  );
}

function Board({ title, rows, render, accent }: { title: string; rows: FeedItem[]; render: (r: FeedItem) => string; accent: string }) {
  return (
    <div>
      <h4 className="mb-1 font-display text-xs uppercase tracking-widest text-white/40">{title}</h4>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-black/20 px-2 py-1.5">
          <span className="text-white/40">#{i + 1}</span>
          <span className="flex-1 px-2 font-display text-white/80">{r.username}</span>
          <span className={accent}>{render(r)}</span>
        </div>
      ))}
      {!rows.length && <p className="py-3 text-center text-white/30">No data yet</p>}
    </div>
  );
}
