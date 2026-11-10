import Image from "next/image";
import { foto as vind } from "@/content/fotos";

type Props = {
  bestand: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  focus?: string;
  /** Vul de ouder (die position:relative moet hebben) */
  fill?: boolean;
  alt?: string;
  /** Inzoomen op een detail (bijv. 2 = 2x), vanuit het focuspunt */
  zoom?: number;
};

/** Toont een foto uit het fotomanifest met juiste alt-tekst, blur en formaten. */
export function Foto({ bestand, sizes, className = "", imgClassName = "", priority, focus, fill = true, alt, zoom }: Props) {
  const f = vind(bestand);
  const common = {
    alt: alt ?? f.alt,
    sizes,
    priority,
    placeholder: f.blurDataURL ? ("blur" as const) : ("empty" as const),
    blurDataURL: f.blurDataURL,
    style: {
      objectPosition: focus ?? f.focus ?? "50% 50%",
      ...(zoom ? { transform: `scale(${zoom})`, transformOrigin: focus ?? f.focus ?? "50% 50%" } : {}),
    },
  };
  if (fill) {
    return (
      <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}overflow-hidden ${className}`}>
        <Image src={f.src} fill className={`object-cover ${imgClassName}`} {...common} />
      </div>
    );
  }
  return (
    <Image src={f.src} width={f.width} height={f.height} className={`h-auto w-full ${imgClassName} ${className}`} {...common} />
  );
}
