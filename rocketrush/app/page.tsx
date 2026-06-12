'use client';

import { useEffect } from 'react';
import { startGame } from './game-engine';

/**
 * Liftoff X — main game screen (mobile-first, matches the product mockup).
 * The 60fps loop runs imperatively in the engine; this tree renders once.
 */
export default function Page() {
  useEffect(() => startGame(), []);

  return (
    <div className="app">
      {/* ===================== HEADER ===================== */}
      <div className="topbar">
        <button className="hambtn" id="btnMenu" title="Menu">☰</button>
        <img className="logo-img" src="/liftoffx.png" alt="Liftoff X" />
        <div className="balance-chip tnum" id="balanceChip">€<span id="balance">1000.00</span></div>
      </div>

      {/* dropdown menu under the ☰ (replaces the bottom nav) */}
      <div className="menu-backdrop" id="menuBackdrop" />
      <div className="menu-dropdown" id="menuDropdown">
        <button className="menu-item" data-menu="sound"><span className="mi-ic">🔊</span> Sound<span className="mi-sw" id="menuSoundSw"><i /></span></button>
        <button className="menu-item" data-menu="account"><span className="mi-ic">👤</span> <span id="menuAcct">Account</span></button>
        <button className="menu-item" data-menu="history"><span className="mi-ic">🕘</span> My Bets &amp; History</button>
        <button className="menu-item" data-menu="stats"><span className="mi-ic">📊</span> Statistics</button>
        <button className="menu-item" data-menu="leaderboard"><span className="mi-ic">🏆</span> Leaderboard</button>
        <button className="menu-item" data-menu="fair"><span className="mi-ic">🛡️</span> Provably Fair</button>
        <button className="menu-item" data-menu="settings"><span className="mi-ic">⚙️</span> Settings</button>
      </div>

      {/* ===================== STAGE ===================== */}
      <div className="stage">
        <div className="planet p2" />
        <div className="planet p3" />
        <canvas id="sky" />
        <div className="you-won" id="youWon" />
        {/* one clear centered pop-up with the round's winnings, shown when the round ends */}
        <div className="win-pop" id="winPop">
          <button className="wp-x" id="wpClose">✕</button>
          <div className="wp-title">YOUR TOTAL WIN</div>
          <div className="wp-amt" id="wpAmt">+€0.00</div>
        </div>
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
        <div className="stage-players" id="stagePlayers">👥 0</div>
      </div>

      {/* ===================== HISTORY PILLS ===================== */}
      <div className="history" id="history" />

      {/* ===================== CONTROLS — two bets per round ===================== */}
      <div className="controls dual">
        {[0, 1].map((i) => (
          <div className="betpanel" key={i}>
            <div className="bp-label">Bet {i + 1}</div>
            <div className="stepper sm">
              <button data-bet="-" data-slot={i}>−</button>
              <div className="val tnum">€<span id={`betVal${i}`}>100</span></div>
              <button data-bet="+" data-slot={i}>+</button>
            </div>
            <div className="bp-auto">
              <span className="bp-auto-l">Auto</span>
              <button data-auto="-" data-slot={i}>−</button>
              <span className="bp-auto-v" id={`autoVal${i}`}>OFF</span>
              <button data-auto="+" data-slot={i}>+</button>
            </div>
            <button className="action waiting" id={`action${i}`} data-slot={i} disabled>
              <span id={`actionMain${i}`}>WAITING…</span>
              <small id={`actionSub${i}`} />
            </button>
          </div>
        ))}
      </div>

      {/* ===================== PANELS ===================== */}
      <div className="panels">
        <div className="panel">
          <div className="panel-h">⚡ Live Activity <span className="live">● Live</span></div>
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

      {/* provably-fair badge at the bottom of the game (off the main stage) */}
      <button className="fair-foot" id="badgeFair"><span className="shield">🛡️</span> Provably Fair · tap to verify</button>

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
          <div className="sec-title">Recent transactions</div>
          <div id="statTx" />
        </div>
      </div>

      {/* ===================== LEADERBOARD SCREEN ===================== */}
      <div className="screen" id="screenLeaderboard">
        <div className="screen-head">
          <button className="back" data-screen-close>‹</button>
          <h2>🏆 Leaderboard</h2>
        </div>
        <div className="screen-body">
          <div className="lb-tabs">
            <button className="lbtab active" data-when="today">Today</button>
            <button className="lbtab" data-when="all">All-time</button>
          </div>
          <div className="sec-title">💰 Top Wins</div>
          <div id="lbWins" />
          <div className="sec-title">🚀 Top Multipliers</div>
          <div id="lbMult" />
        </div>
      </div>

      {/* ===================== PUBLIC PROFILE MODAL ===================== */}
      <div className="modal-bg" id="profileModal">
        <div className="modal">
          <div className="profile-head">
            <div className="avatar" id="prAvatar">R</div>
            <div><div className="pf-name" id="prName">—</div><div className="pf-email" id="prJoin">—</div></div>
          </div>
          <div className="stat-grid" id="prStats" style={{ marginTop: 16 }} />
          <button className="closebtn" data-close style={{ marginTop: 14 }}>Close</button>
        </div>
      </div>

      {/* ===================== SETTINGS MODAL ===================== */}
      <div className="modal-bg" id="settingsModal">
        <div className="modal">
          <h2>Settings</h2>
          <p className="sub">Keep it simple. Play responsibly.</p>
          <button className="closebtn" id="btnAccount" style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>👤 <span id="acctLabel">Account</span></button>
          <div className="field">
            <label>Language</label>
            <select id="lang" defaultValue="en">
              <option value="en">English</option><option value="nl">Nederlands</option><option value="de">Deutsch</option>
              <option value="es">Español</option><option value="pt">Português</option><option value="tr">Türkçe</option>
            </select>
          </div>
          <div className="toggle-row">
            <div className="t"><b>Audio</b><small>Countdown voice, flight music & sound effects</small></div>
            <div className="sw on" id="swSound"><i /></div>
          </div>
          <div id="volRows" className="vol-rows">
            <div className="vol-row">
              <label htmlFor="volVoice">🗣️ Voice<span className="vol-val" id="volVoiceVal">95%</span></label>
              <input type="range" id="volVoice" min="0" max="100" defaultValue="95" />
            </div>
            <div className="vol-row">
              <label htmlFor="volFx">💥 Soundeffects<span className="vol-val" id="volFxVal">85%</span></label>
              <input type="range" id="volFx" min="0" max="100" defaultValue="85" />
            </div>
            <div className="vol-row">
              <label htmlFor="volMusic">🎵 Music<span className="vol-val" id="volMusicVal">70%</span></label>
              <input type="range" id="volMusic" min="0" max="100" defaultValue="70" />
            </div>
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
          <button className="closebtn" id="btnTestCredit" style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.4)', color: 'var(--success)', marginTop: 14 }}>💰 Test credit · €1,000,000</button>
          <button className="closebtn" id="btnReset" style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.4)', color: 'var(--danger)', marginTop: 10 }}>Reset balance to €1,000</button>
          <button className="closebtn" data-close>Done</button>
        </div>
      </div>

      {/* ===================== ACCOUNT MODAL ===================== */}
      <div className="modal-bg" id="accountModal">
        <div className="modal">
          <h2 id="acctTitle">Account</h2>
          <p className="sub" id="acctNote" />

          {/* logged out — login / register */}
          <div id="authView">
            <div className="auth-tabs">
              <button className="atab active" data-auth="login">Log in</button>
              <button className="atab" data-auth="register">Register</button>
            </div>
            <div className="field" id="fldUser" style={{ display: 'none' }}>
              <label>Username</label>
              <input id="auUser" placeholder="rocketpilot" autoComplete="username" />
            </div>
            <div className="field">
              <label>Email</label>
              <input id="auEmail" type="email" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input id="auPass" type="password" placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="auth-msg" id="auMsg" />
            <button className="closebtn" id="auSubmit" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', color: '#1a0f00' }}>Log in</button>
            <button className="linkbtn" id="auForgot">Forgot password?</button>
          </div>

          {/* logged in — profile + demo wallet */}
          <div id="profileView" style={{ display: 'none' }}>
            <div className="profile-head">
              <div className="avatar" id="pfAvatar">R</div>
              <div><div className="pf-name" id="pfName">—</div><div className="pf-email" id="pfEmail">—</div></div>
            </div>
            <div className="stat-grid" style={{ marginTop: 14 }}>
              <div className="stat-card"><div className="v" id="pfBalance">€0.00</div><div className="l">Balance</div></div>
              <div className="stat-card"><div className="v" id="pfProfit">€0.00</div><div className="l">Net Profit</div></div>
            </div>
            <div className="sec-title">Transaction history</div>
            <div id="pfTx" />
            <button className="closebtn" id="auLogout" style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.4)', color: 'var(--danger)', marginTop: 6 }}>Log out</button>
          </div>

          <button className="closebtn" data-close>Close</button>
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
