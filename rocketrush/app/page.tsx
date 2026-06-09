'use client';

import { useEffect } from 'react';
import { startGame } from './game-engine';

/**
 * RocketRush — main game screen (mobile-first, matches the product mockup).
 * The 60fps loop runs imperatively in the engine; this tree renders once.
 */
export default function Page() {
  useEffect(() => startGame(), []);

  return (
    <div className="app">
      {/* ===================== HEADER ===================== */}
      <div className="topbar">
        <button className="hambtn" id="btnSettings" title="Menu">☰</button>
        <div className="logo"><span className="a">Rocket</span><span className="rk">🚀</span><span className="b">Rush</span></div>
        <button className="iconbtn" id="btnSound" title="Sound">🔊</button>
      </div>

      {/* ===================== ONLINE + BALANCE ===================== */}
      <div className="online-row">
        <div className="online-pill">🌍 <span className="tnum" id="online">0</span> players online</div>
        <div className="balance-chip tnum">€<span id="balance">1000.00</span></div>
      </div>

      {/* ===================== STAGE ===================== */}
      <div className="stage">
        <div className="planet p1" />
        <div className="planet p2" />
        <div className="planet p3" />
        <canvas id="sky" />
        <div className="you-won" id="youWon" />
        <div className="stage-overlay">
          <div id="centerMain">
            <div className="multiplier tnum" id="mult">1.00x</div>
            <div className="status-line" id="status">Connecting…</div>
          </div>
          <div className="countdown-wrap" id="countWrap" style={{ display: 'none' }}>
            <div className="status-line">Next round in</div>
            <div className="count-num tnum" id="countNum">5</div>
            <div className="count-bar"><i id="countBar" /></div>
          </div>
        </div>
        <div className="provably-badge" id="badgeFair"><span className="shield">🛡️</span> Provably Fair</div>
      </div>

      {/* ===================== HISTORY PILLS ===================== */}
      <div className="history" id="history" />

      {/* ===================== CONTROLS ===================== */}
      <div className="controls">
        <div className="ctl-labels"><span>Bet Amount</span><span>Auto Cash Out</span></div>
        <div className="ctl-row">
          <div className="stepper">
            <button data-bet="-">−</button>
            <div className="val tnum">€<span id="betVal">100</span></div>
            <button data-bet="+">+</button>
          </div>
          <div className="stepper">
            <button data-auto="-">−</button>
            <div className="val tnum"><span id="autoVal">2.00</span>x</div>
            <button data-auto="+">+</button>
          </div>
        </div>
        <div className="chips">
          <button className="chip" data-betset="10">10</button>
          <button className="chip" data-betset="25">25</button>
          <button className="chip" data-betset="50">50</button>
          <button className="chip active" data-betset="100">100</button>
          <button className="chip" data-betset="500">500</button>
        </div>
        <button className="action waiting" id="action" disabled>
          <span id="actionMain">WAITING…</span>
          <small id="actionSub" />
        </button>
      </div>

      {/* ===================== PANELS ===================== */}
      <div className="panels">
        <div className="panel">
          <div className="panel-h">Recent Winners <span className="live">● Live</span></div>
          <div className="winners" id="winners" />
        </div>
        <div className="panel">
          <div className="panel-h">Chat <span className="live ghost">● <span className="tnum">1,245</span></span></div>
          <div className="chat-body" id="chat" />
          <div className="chat-input">
            <input id="chatInput" maxLength={120} placeholder="Type a message…" />
            <button id="chatSend">➤</button>
          </div>
        </div>
      </div>

      {/* ===================== BOTTOM NAV ===================== */}
      <nav className="bottom-nav">
        <button className="nav-item active" data-nav="game"><i>🚀</i><span>Game</span></button>
        <button className="nav-item" data-nav="history"><i>🕘</i><span>History</span></button>
        <button className="nav-fab" data-nav="bet">+</button>
        <button className="nav-item" data-nav="stats"><i>📊</i><span>Stats</span></button>
        <button className="nav-item" data-nav="menu"><i>☰</i><span>Menu</span></button>
      </nav>

      {/* ===================== HISTORY SCREEN ===================== */}
      <div className="screen" id="screenHistory">
        <div className="screen-head">
          <button className="back" data-screen-close>‹</button>
          <h2>History</h2>
        </div>
        <div className="screen-body">
          <div className="sec-title">My Bets</div>
          <div id="histBets" />
          <div className="sec-title">Recent Rounds — tap to verify</div>
          <div id="histRounds" />
        </div>
      </div>

      {/* ===================== STATS SCREEN ===================== */}
      <div className="screen" id="screenStats">
        <div className="screen-head">
          <button className="back" data-screen-close>‹</button>
          <h2>Stats</h2>
        </div>
        <div className="screen-body">
          <div className="stat-grid" id="statGrid" />
        </div>
      </div>

      {/* ===================== SETTINGS MODAL ===================== */}
      <div className="modal-bg" id="settingsModal">
        <div className="modal">
          <h2>Settings</h2>
          <p className="sub">Keep it simple. Play responsibly.</p>
          <div className="field">
            <label>Language</label>
            <select id="lang" defaultValue="en">
              <option value="en">English</option><option value="nl">Nederlands</option><option value="de">Deutsch</option>
              <option value="es">Español</option><option value="pt">Português</option><option value="tr">Türkçe</option>
            </select>
          </div>
          <div className="toggle-row">
            <div className="t"><b>Sound effects</b><small>Launch, cash out & crash sounds</small></div>
            <div className="sw on" id="swSound"><i /></div>
          </div>
          <div className="toggle-row">
            <div className="t"><b>Low bandwidth mode</b><small>Fewer stars & particles for slow networks</small></div>
            <div className="sw" id="swLow"><i /></div>
          </div>
          <div className="toggle-row">
            <div className="t"><b>Reality check</b><small>Remind me how long I&apos;ve been playing</small></div>
            <div className="sw on" id="swReality"><i /></div>
          </div>
          <div className="toggle-row">
            <div className="t"><b>Session limit</b><small>Auto-pause after a set time (responsible gaming)</small></div>
            <div className="sw" id="swSession"><i /></div>
          </div>
          <button className="closebtn" data-close>Done</button>
        </div>
      </div>

      {/* ===================== PROVABLY FAIR MODAL ===================== */}
      <div className="modal-bg" id="fairModal">
        <div className="modal">
          <h2>🛡️ Provably Fair</h2>
          <p className="sub">Every crash point is determined <b>before</b> the round by a hashed server seed. Verify it yourself — the result cannot be changed mid-round.</p>

          <div className="field">
            <label>Server Seed (hashed — shown before round)</label>
            <div className="v" id="fSeedHash">—</div>
          </div>
          <div className="field">
            <label>Server Seed (revealed — previous round)</label>
            <div className="v" id="fSeedReveal">—</div>
          </div>
          <div className="field">
            <label>Your Client Seed (editable)</label>
            <input id="fClientSeed" />
          </div>
          <div className="field">
            <label>Nonce (round #)</label>
            <div className="v tnum" id="fNonce">—</div>
          </div>

          <div style={{ margin: '18px 0 8px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--muted)', fontWeight: 700 }}>Verify last round</div>
          <div className="verify-row"><span className="k">HMAC-SHA256(server, client:nonce)</span></div>
          <div className="field"><div className="v" id="fHmac">—</div></div>
          <div className="verify-row"><span className="k">Computed crash point</span><span className="x" id="fComputed">—</span></div>
          <div className="verify-row"><span className="k">Actual crash point</span><span className="x" id="fActual">—</span></div>
          <div className="verify-row"><span className="k">Result</span><span className="x" id="fMatch">—</span></div>

          <button className="closebtn" data-close>Close</button>
        </div>
      </div>
    </div>
  );
}
