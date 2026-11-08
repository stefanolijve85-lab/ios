import { showPlaceholderLabels } from "@/content/site";

/**
 * Zichtbaar label voor tijdelijke inhoud (beeld of tekst die nog vervangen
 * moet worden). Verdwijnt als `showPlaceholderLabels` uit staat.
 */
export function Placeholder({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  if (!showPlaceholderLabels) return null;
  return (
    <p className={`placeholder ${className}`}>
      <strong>Tijdelijk</strong>
      {children ? <span> · {children}</span> : null}
    </p>
  );
}
