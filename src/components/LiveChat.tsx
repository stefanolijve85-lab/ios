'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 50% 38%)`;
}
function hhmm(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function LiveChat() {
  const { chat, sendChat, state } = useGame();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendChat(t);
    setText('');
  };

  return (
    <div className="panel">
      <h3>
        LIVE CHAT <span className="count">👥 {(state?.online ?? 0).toLocaleString('en-US')}</span>
      </h3>
      <div className="chat-list" ref={listRef}>
        {chat.map((m) => (
          <div key={m.id} className={`msg${m.self ? ' self' : ''}`}>
            <div className="msg-ava" style={{ background: m.self ? 'var(--green-deep)' : avatarColor(m.name) }}>
              {m.name[0]}
            </div>
            <div className="msg-body">
              <div className="msg-top">
                <span className="who">{m.name}</span>
                <span className="msg-time">{hhmm(m.ts)}</span>
              </div>
              <div className="txt">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={text}
          maxLength={120}
          placeholder="Type a message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} aria-label="Send">➤</button>
      </div>
    </div>
  );
}
