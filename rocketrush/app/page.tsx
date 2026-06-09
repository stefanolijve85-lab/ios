'use client';

import { useEffect } from 'react';
import { startGame } from './game-engine';

/**
 * RocketRush — main game screen.
 * The high-frequency game loop (60fps multiplier, canvas) runs imperatively
 * in the engine via direct DOM updates — the React tree is rendered once and
 * never re-renders, which is exactly what keeps it at 60 FPS on mobile.
 */
export default function Page() {
  useEffect(() => startGame(), []);

  return (
    <div className="app">
      {/* ===================== HEADER ===================== */}
      <header>
        <div className="logo">
          <span className="mark">🚀</span>
          <span className="full"><b>Rocket</b><span className="rush">Rush</span></span>
        </div>
        <div className="pill-online"><span className="dot" /><span className="tnum" id="online">0</span>&nbsp;online</div>
        <div className="spacer" />
        <div className="balance"><small>Balance</small><b className="tnum">€<span id="balance">1000.00</span></b></div>
        <button className="iconbtn" id="btnSound" title="Sound">🔊</button>
        <button className="iconbtn" id="btnSettings" title="Settings">⚙️</button>
        <select className="lang" id="lang" title="Language" defaultValue="en">
          <option value="en">EN</option><option value="nl">NL</option><option value="de">DE</option>
          <option value="es">ES</option><option value="pt">PT</option><option value="tr">TR</option>
        </select>
      </header>

      {/* ===================== MIDDLE ===================== */}
      <div className="grid">
        {/* LEFT: WINNERS */}
        <div className="panel side" id="paneWinners">
          <h3>🏆 Recent Winners</h3>
          <div className="winners" id="winners" />
        </div>

        {/* CENTER: STAGE */}
        <div className="stage">
          <canvas id="sky" />
          <div className="provably-badge" id="badgeFair"><span className="shield">🛡️</span> Provably Fair</div>
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
          <div className="history" id="history" />
        </div>

        {/* RIGHT: CHAT */}
        <div className="panel side" id="paneChat">
          <h3>💬 Live Chat</h3>
          <div className="chat-body" id="chat" />
          <div className="chat-input">
            <input id="chatInput" maxLength={120} placeholder="Say something…" />
            <button id="chatSend">➤</button>
          </div>
        </div>
      </div>

      {/* MOBILE TABS */}
      <div className="mobile-tabs">
        <button className="mtab active" data-pane="game">🚀 Game</button>
        <button className="mtab" data-pane="paneWinners">🏆 Winners</button>
        <button className="mtab" data-pane="paneChat">💬 Chat</button>
      </div>

      {/* ===================== CONTROLS ===================== */}
      <div className="controls">
        <div className="ctl">
          <label>Bet Amount</label>
          <div className="stepper">
            <button data-bet="-">−</button>
            <div className="val tnum">€<span id="betVal">100</span></div>
            <button data-bet="+">+</button>
          </div>
          <div className="quick">
            <button data-betq="0.5">½</button>
            <button data-betq="2">2×</button>
            <button data-betq="max">MAX</button>
          </div>
        </div>
        <div className="ctl">
          <label>Auto Cashout</label>
          <div className="stepper">
            <button data-auto="-">−</button>
            <div className="val tnum"><span id="autoVal">2.00</span>x</div>
            <button data-auto="+">+</button>
          </div>
          <div className="quick">
            <button data-autoq="off">OFF</button>
            <button data-autoq="2">2x</button>
            <button data-autoq="10">10x</button>
          </div>
        </div>
        <button className="action waiting" id="action" disabled>
          <span id="actionMain">WAITING…</span>
          <small id="actionSub" />
        </button>
      </div>

      {/* ===================== SETTINGS MODAL ===================== */}
      <div className="modal-bg" id="settingsModal">
        <div className="modal">
          <h2>Settings</h2>
          <p className="sub">Keep it simple. Play responsibly.</p>
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
