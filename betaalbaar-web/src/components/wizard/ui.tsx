"use client";
import { useId } from "react";

type Opt = { id: string; label: string; hint?: string };

/** Keuzekaarten op basis van echte radio's/checkboxes: met toetsenbord en schermlezer bedienbaar. */
export function Choice({ legend, options, value, onChange, wide, render, example }: {
  legend: string; options: Opt[]; value: string; onChange: (v: string) => void; wide?: boolean;
  render?: (o: Opt) => React.ReactNode; example?: string;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className={`cards${wide ? " wide" : ""}`}>
        {options.map((o) => (
          <label className="card" key={o.id}>
            <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span className="card-body">{render?.(o)}<b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
          </label>
        ))}
      </div>
      {example && <p className="example">{example}</p>}
    </fieldset>
  );
}

export function Multi({ legend, options, values, onToggle, max, wide, render, note }: {
  legend: string; options: Opt[]; values: string[]; onToggle: (id: string) => void; max?: number; wide?: boolean;
  render?: (o: Opt) => React.ReactNode; note?: string;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className={`cards${wide ? " wide" : ""}`}>
        {options.map((o) => {
          const on = values.includes(o.id);
          return (
            <label className="card" key={o.id}>
              <input type="checkbox" checked={on} disabled={!on && max !== undefined && values.length >= max} onChange={() => onToggle(o.id)} />
              <span className="card-body">{render?.(o)}<b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
            </label>
          );
        })}
      </div>
      {note && <p className="small muted" style={{ marginTop: 8 }}>{note}</p>}
    </fieldset>
  );
}

export function Text({ label, value, onChange, example, type = "text", multiline, error, autoComplete, optional }: {
  label: string; value: string; onChange: (v: string) => void; example?: string; type?: string; multiline?: boolean;
  error?: string; autoComplete?: string; optional?: boolean;
}) {
  const id = useId();
  const describe = [example ? `${id}-ex` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, value, "aria-describedby": describe, "aria-invalid": error ? true : undefined, autoComplete };
  return (
    <div className="field">
      <label htmlFor={id}>{label}{optional && <span className="muted" style={{ fontWeight: 400 }}> (optioneel)</span>}</label>
      {multiline
        ? <textarea {...common} onChange={(e) => onChange(e.target.value)} />
        : <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />}
      {example && <p className="example" id={`${id}-ex`}>{example}</p>}
      {error && <p className="err" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

/** Zes verschillende opbouwen, zodat de kaarten echt andere ontwerpstijlen tonen. */
export function StyleThumb({ id }: { id: string }) {
  const inner: Record<string, React.ReactNode> = {
    strak: <><b>Bedrijf</b><span className="l" /><span className="g"><i /><i /><i /></span></>,
    warm: <><span className="c" /><span><b>Welkom</b>bij ons<span className="p" style={{ display: "block" }} /></span></>,
    luxe: <><span>sinds altijd</span><b>Maison</b><span className="l" /></>,
    fris: <><b>Hallo!</b><span className="r"><i /><i /></span><span className="p" /></>,
    stoer: <><b>Wij bouwen</b><span className="s" /></>,
    speels: <><b>Hoi!</b><span className="a" /><span className="b" /><span className="c" /></>,
  };
  return <span className={`sty sty-${id}`} aria-hidden="true">{inner[id]}</span>;
}
