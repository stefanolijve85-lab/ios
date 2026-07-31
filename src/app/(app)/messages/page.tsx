'use client';

import { useMemo, useState } from 'react';
import { listConversations, conversationMessages, getUser, currentUserId } from '@/lib/db';
import { useApp } from '@/context/AppProvider';
import { Avatar } from '@/components/ui/Primitives';
import { Icon } from '@/components/ui/Icon';
import { timeAgo } from '@/lib/format';
import type { Message } from '@/lib/types';

const CONVOS = listConversations();

function titleFor(participantIds: string[], groupTitle?: string) {
  if (groupTitle) return groupTitle;
  const other = participantIds.find((id) => id !== currentUserId);
  return other ? getUser(other)?.name ?? 'Conversation' : 'Conversation';
}
function avatarFor(participantIds: string[]) {
  const other = participantIds.find((id) => id !== currentUserId);
  return other ? getUser(other)?.avatar ?? '' : '';
}

export default function MessagesPage() {
  const { user } = useApp();
  const [activeId, setActiveId] = useState(CONVOS[0]?.id ?? '');
  const [drafts, setDrafts] = useState<Record<string, Message[]>>({});
  const [text, setText] = useState('');

  const active = CONVOS.find((c) => c.id === activeId);
  const messages = useMemo(() => {
    const base = active ? conversationMessages(active.id) : [];
    return [...base, ...(drafts[activeId] ?? [])];
  }, [active, drafts, activeId]);

  const send = () => {
    if (!text.trim() || !active) return;
    const msg: Message = {
      id: `local_${Date.now()}`,
      conversationId: active.id,
      senderId: user.id,
      body: text.trim(),
      kind: 'text',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    setDrafts((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), msg] }));
    setText('');
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Messages</h1>

      <div className="grid h-[70vh] grid-cols-1 gap-4 sm:grid-cols-[300px_minmax(0,1fr)]">
        {/* conversation list */}
        <div className={`card flex-col overflow-y-auto p-2 ${active ? 'hidden sm:flex' : 'flex'}`}>
          {CONVOS.map((c) => {
            const last = conversationMessages(c.id).slice(-1)[0];
            const on = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex items-center gap-3 rounded-xl p-2.5 text-left transition ${
                  on ? 'bg-elevated' : 'hover:bg-elevated/60'
                }`}
              >
                {c.kind === 'group' ? (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/15 text-brand-soft">
                    <Icon name="users" size={20} />
                  </span>
                ) : (
                  <Avatar src={avatarFor(c.participantIds)} name={titleFor(c.participantIds)} size={44} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{titleFor(c.participantIds, c.title)}</p>
                    {last && <span className="text-[10px] text-muted">{timeAgo(last.createdAt)}</span>}
                  </div>
                  <p className="truncate text-xs text-muted">{last?.body}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* chat pane */}
        <div className={`card flex-col ${active ? 'flex' : 'hidden sm:flex'}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-border/50 p-3">
                <button className="btn-ghost !p-2 sm:hidden" onClick={() => setActiveId('')} aria-label="Back">
                  <Icon name="chevron" size={18} className="rotate-180" />
                </button>
                {active.kind === 'group' ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-brand-soft">
                    <Icon name="users" size={17} />
                  </span>
                ) : (
                  <Avatar src={avatarFor(active.participantIds)} name={titleFor(active.participantIds)} size={36} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{titleFor(active.participantIds, active.title)}</p>
                  <p className="flex items-center gap-1 text-xs text-success">
                    <Icon name="lock" size={11} /> End-to-end encrypted
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.senderId === user.id;
                  const sender = getUser(m.senderId);
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      {!mine && sender && <Avatar src={sender.avatar} name={sender.name} size={26} />}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine ? 'rounded-br-md bg-brand-gradient text-white' : 'rounded-bl-md bg-elevated'
                        }`}
                      >
                        {active.kind === 'group' && !mine && sender && (
                          <p className="mb-0.5 text-[10px] font-semibold text-brand-soft">{sender.name}</p>
                        )}
                        {m.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-border/50 p-3">
                <button className="btn-ghost !p-2" aria-label="Attach image">
                  <Icon name="image" size={18} />
                </button>
                <button className="btn-ghost !p-2" aria-label="Voice note">
                  <Icon name="mic" size={18} />
                </button>
                <input
                  className="input"
                  placeholder="Message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                />
                <button className="btn-primary !px-3" onClick={send} disabled={!text.trim()} aria-label="Send">
                  <Icon name="send" size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-muted">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
