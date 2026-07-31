import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';

export const metadata: Metadata = { title: 'Community guidelines' };

const principles = [
  { icon: 'users', title: 'Lawful participation', body: 'Civitas exists to promote lawful civic engagement. Do not use it to organize or incite unlawful activity.' },
  { icon: 'heart', title: 'Respectful discussion', body: 'Debate ideas, not people. Disagreement is welcome; harassment, threats and dehumanizing language are not.' },
  { icon: 'globe', title: 'Freedom of expression', body: 'You may discuss and debate migration, integration, public safety and public policy within the law.' },
  { icon: 'shield', title: 'No harm', body: 'Never encourage violence, harassment or discrimination against any person or group.' },
  { icon: 'flag', title: 'Truthfulness', body: 'Cite sources for factual claims. Fact-check labels and corrections keep the record honest.' },
  { icon: 'check', title: 'Transparency', body: 'Moderation is logged and every decision can be appealed. Rules apply equally to everyone.' },
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="card mb-6 overflow-hidden">
        <div className="bg-brand-gradient p-6 text-white">
          <h1 className="text-2xl font-bold">Community guidelines</h1>
          <p className="mt-1 text-white/90">The shared commitments that make Civitas a place where everyone can take part.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {principles.map((p) => (
          <div key={p.title} className="card flex items-start gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-soft">
              <Icon name={p.icon as Parameters<typeof Icon>[0]['name']} size={20} />
            </span>
            <div>
              <h2 className="font-semibold">{p.title}</h2>
              <p className="text-sm text-muted">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5 text-sm text-muted">
        <p className="mb-2 font-semibold text-fg">Reporting & appeals</p>
        <p>
          If you see something that breaks these guidelines, use the report action on any post, comment or profile. A
          human moderator reviews every report, and anyone affected by a moderation decision can appeal it. AI tools
          may assist moderators, but they never replace human judgment.
        </p>
      </div>
    </div>
  );
}
