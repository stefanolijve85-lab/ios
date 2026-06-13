// Lightweight crowd simulation: live chat + live activity feed.
// Keeps the room feeling busy 24/7 without a real userbase (demo phase).

const NAMES = [
  'Mike', 'Emma', 'Rex', 'Sofia', 'Alex', 'Milo', 'Luna', 'Kai', 'Nora',
  'Leo', 'Mia', 'Finn', 'Zara', 'Omar', 'Ivy', 'Hugo', 'Aria', 'Theo',
  'Ruby', 'Max', 'Lena', 'Cleo', 'Dex', 'Vera', 'Jax', 'Nina', 'Cole',
];

const CHAT_IDLE = [
  'who is in this round?',
  'last one stole everything 😭',
  'feeling lucky tonight',
  'small bet this time',
  'going big 🚀',
  'lets gooo',
  'i never learn lol',
  'one more round',
];
const CHAT_RUNNING = [
  'hold... hold...',
  'stashing soon 😎',
  'no way i take this yet',
  '10x incoming 🚨',
  'GET OUT NOW',
  'just a little more 👀',
  'my heart cant take this',
  'greedy mode on',
  'cashing 💰',
];
const CHAT_CRASH = [
  'STOLE EVERYTHING 😭',
  'knew it 🤦',
  'too greedy again',
  'lmao called it',
  'rip everyone holding',
  'should have stashed 💀',
];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
let uid = 1;

class Bots {
  constructor() {
    this.lastActivity = 0;
  }

  chat(phase, m) {
    if (Math.random() > 0.55) return null;
    let pool = CHAT_IDLE;
    if (phase === 'running') pool = CHAT_RUNNING;
    else if (phase === 'crashed') pool = CHAT_CRASH;
    const name = rand(NAMES);
    let text = rand(pool);
    if (phase === 'running' && Math.random() < 0.35) {
      text = `stashing at €${Math.round(50 + m * (80 + Math.random() * 400))} 😎`;
    }
    return { id: uid++, name, text, ts: Date.now() };
  }

  activity(phase, m) {
    const now = Date.now();
    if (now - this.lastActivity < 700) return null;
    if (Math.random() > 0.6) return null;
    this.lastActivity = now;
    const name = rand(NAMES);

    if (phase === 'crashed' && Math.random() < 0.55) {
      return { kind: 'lost', name, amount: Math.round(50 + Math.random() * 1500), ts: now };
    }
    if (phase === 'running') {
      const mult = Math.max(1.1, Math.round(m * (0.4 + Math.random() * 0.9) * 100) / 100);
      return {
        kind: 'stash',
        name,
        amount: Math.round((50 + Math.random() * 2000) * mult) / 1,
        multiplier: mult,
        ts: now,
      };
    }
    // betting phase: occasional "waited too long" memory or a stash recap
    if (Math.random() < 0.4) {
      return { kind: 'lost', name, amount: Math.round(50 + Math.random() * 800), ts: now };
    }
    return {
      kind: 'stash',
      name,
      amount: Math.round(100 + Math.random() * 5000),
      multiplier: Math.round((1.2 + Math.random() * 6) * 100) / 100,
      ts: now,
    };
  }
}

module.exports = { Bots, NAMES };
