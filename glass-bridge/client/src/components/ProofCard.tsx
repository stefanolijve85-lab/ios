import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore.js';

/** Shows the revealed seeds after a round so players can audit immediately. */
export default function ProofCard() {
  const { lastReveal, user } = useStore();
  if (!lastReveal) {
    return (
      <div className="glass-panel p-4 text-sm text-white/50">
        <h3 className="mb-1 font-display text-white/70">Provably Fair</h3>
        Your client seed: <span className="text-neon-cyan">{user?.clientSeed ?? '—'}</span> · next nonce{' '}
        <span className="text-neon-cyan">{user?.nonce ?? '—'}</span>. The server seed hash is committed before every round.
      </div>
    );
  }
  return (
    <div className="glass-panel space-y-1 p-4 text-xs">
      <h3 className="mb-1 font-display text-sm text-white/70">Round proof</h3>
      <Row label="Server seed" value={lastReveal.serverSeed} />
      <Row label="Server seed hash" value={lastReveal.serverSeedHash} />
      <Row label="Client seed" value={lastReveal.clientSeed} />
      <Row label="Nonce" value={String(lastReveal.nonce)} />
      <Link
        to={`/verify?serverSeed=${lastReveal.serverSeed}&clientSeed=${lastReveal.clientSeed}&nonce=${lastReveal.nonce}`}
        className="mt-1 inline-block text-neon-cyan hover:underline"
      >
        Verify this round →
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className="truncate font-mono text-white/70" title={value}>
        {value}
      </span>
    </div>
  );
}
