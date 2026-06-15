import { PUBLISHER } from '@/brand';
import Hub from '@/components/Hub';

// alias of the root hub, so old /games links keep working
export const metadata = {
  title: `${PUBLISHER} — Provably fair crash games`,
  description: `Play the ${PUBLISHER} crash games. Provably fair, 97% RTP.`,
};

export default function GamesHub() {
  return <Hub />;
}
