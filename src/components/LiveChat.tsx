'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';

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
        LIVE CHAT 💬 <span className="count">👥 {(state?.online ?? 0).toLocaleString('en-US')}</span>
      </h3>
      <div className="chat-list" ref={listRef}>
        {chat.map((m) => (
          <div key={m.id} className={`msg${m.self ? ' self' : ''}`}>
            <span className="who">{m.name}:</span>
            <span className="txt">{m.text}</span>
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
