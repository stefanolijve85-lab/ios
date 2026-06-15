import { PUBLISHER } from '@/brand';
import Hub from '@/components/Hub';

// xitgames.com → the hub (list of all games). Individual games live at /<game>.
export const metadata = {
  title: `${PUBLISHER} — Provably fair crash games`,
  description: `Play the ${PUBLISHER} crash games. Provably fair, 97% RTP.`,
};

export default function Page() {
  return <Hub />;
}
