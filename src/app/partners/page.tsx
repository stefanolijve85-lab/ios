import { PUBLISHER } from '@/brand';
import Partners from '@/components/Partners';

export const metadata = {
  title: `${PUBLISHER} — Crash games for operators & aggregators`,
  description: `Plug-and-play provably-fair crash games. One certified engine, multiple branded titles, 97% RTP. Integrate ${PUBLISHER}.`,
};

export default function PartnersPage() {
  return <Partners />;
}
