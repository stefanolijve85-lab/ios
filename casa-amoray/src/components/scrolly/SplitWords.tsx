/**
 * Splitst een kop in woorden voor een rustige woord-voor-woord-onthulling.
 * De tekst blijft gewone, doorlopende tekst voor schermlezers en zoekmachines.
 */
export function SplitWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="word">
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}
