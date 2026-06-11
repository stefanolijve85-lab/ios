import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import { useStore } from '../store/useStore.js';
import type { ChatMessage, FeedItem } from '../lib/types.js';

const EMOJIS = ['🚀', '🔥', '💎', '😎', '😱', '🍀', '💰', '🌉', '👀', '🎉'];
const COLORS = ['#a855f7', '#27e0ff', '#27f5a3', '#ff4fd8', '#3b6bff', '#ffb020'];
const avatarColor = (name: string) => COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export default function SocialPanel() {
  const [right, setRight] = useState<'wins' | 'board'>('wins');

  return (
    <div className="px-3 pt-3">
      {/* tabs */}
      <div className="flex gap-5 border-b border-white/10 px-1 text-sm font-display">
        <Tab label="CHAT" active onClick={() => {}} />
        <Tab label="RECENT WINS" active={right === 'wins'} onClick={() => setRight('wins')} />
        <Tab label="LEADERBOARD" active={right === 'board'} onClick={() => setRight('board')} />
      </div>

      {/* two columns: chat (left) + recent wins / leaderboard (right) */}
      <div className="grid grid-cols-2 gap-3 pt-3">
        <Chat />
        {right === 'wins' ? <RecentWins /> : <Leaderboards />}
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-2 tracking-wide transition ${active ? 'text-white' : 'text-white/40'}`}
    >
      {label}
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-neon-purple" />}
    </button>
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
    const onErr = (e: { error: string }) => { setError(e.error); setTimeout(() => setError(''), 2500); };
    s.on('chat:history', onHistory);
    s.on('chat:message', onMessage);
    s.on('chat:error', onErr);
    return () => { s.off('chat:history', onHistory); s.off('chat:message', onMessage); s.off('chat:error', onErr); };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    getSocket().emit('chat:send', { body });
    setText('');
    setShowEmoji(false);
  }

  return (
    <div className="flex h-56 min-h-0 flex-col">
      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-black" style={{ background: avatarColor(m.username) }}>
              {m.username[0].toUpperCase()}
            </span>
            <div className="min-w-0">
              <span className="font-display text-white/80" style={{ color: avatarColor(m.username) }}>{m.username}</span>
              <span className="ml-1.5 break-words text-white/70">{m.body}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && <div className="py-1 text-[10px] text-neon-pink">{error}</div>}
      {showEmoji && (
        <div className="my-1 flex flex-wrap gap-0.5">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText((t) => t + e)} className="rounded p-0.5 text-base hover:bg-white/10">{e}</button>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1">
        <button onClick={() => setShowEmoji((v) => !v)} className="text-base" title="Emoji">🙂</button>
        <input
          value={text} maxLength={240} disabled={!user}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={user ? 'Type a message…' : 'Log in to chat'}
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs outline-none"
        />
        <button onClick={send} disabled={!user} className="text-neon-purple" title="Send">➤</button>
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
    return () => { s.off('round:result', onResult); };
  }, []);
  return (
    <div className="scroll-thin h-56 space-y-1 overflow-y-auto pr-1 text-[11px]">
      {items.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-1 rounded-lg bg-black/25 px-2 py-1">
          <span className="flex items-center gap-1 truncate font-display text-white/75">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: avatarColor(r.username) }} />
            {r.username}
          </span>
          <span className="text-white/40">€{r.bet.toFixed(0)}</span>
          <span className={r.status === 'cashed_out' ? 'text-neon-cyan' : 'text-neon-pink'}>{r.status === 'cashed_out' ? `${r.multiplier.toFixed(2)}×` : '—'}</span>
          <span className={`w-12 text-right ${r.status === 'cashed_out' ? 'text-neon-green' : 'text-white/25'}`}>€{r.payout.toFixed(2)}</span>
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
    <div className="scroll-thin h-56 space-y-2 overflow-y-auto pr-1 text-[11px]">
      <h4 className="font-display text-[10px] uppercase tracking-widest text-white/40">Biggest wins today</h4>
      {data.topWins.map((r, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-2 py-1">
          <span className="text-white/40">#{i + 1}</span>
          <span className="flex-1 truncate px-2 font-display text-white/75">{r.username}</span>
          <span className="text-neon-green">€{r.payout.toFixed(2)}</span>
        </div>
      ))}
      <h4 className="pt-1 font-display text-[10px] uppercase tracking-widest text-white/40">Highest multiplier</h4>
      {data.topMultipliers.map((r, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-black/25 px-2 py-1">
          <span className="text-white/40">#{i + 1}</span>
          <span className="flex-1 truncate px-2 font-display text-white/75">{r.username}</span>
          <span className="text-neon-cyan">{r.multiplier.toFixed(2)}×</span>
        </div>
      ))}
      {!data.topWins.length && <p className="py-6 text-center text-white/40">No data yet</p>}
    </div>
  );
}
