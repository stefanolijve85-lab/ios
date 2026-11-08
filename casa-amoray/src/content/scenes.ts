/**
 * STORYBOARD VAN DE HOMEPAGE — één bron van waarheid voor de scrollytelling.
 *
 * Definitieve Higgsfield-beelden vervangen?
 *   1. Exporteer de clip (staand 9:16 voor mobiel, liggend 16:9 voor desktop).
 *   2. Draai:  npm run frames -- <video.mp4> <scene-id> mobile
 *              npm run frames -- <video.mp4> <scene-id> desktop
 *      Dit schrijft de frames naar /public/media/scenes/<scene-id>/<variant>/
 *      en werkt src/content/media-manifest.json bij.
 *   3. Zet de scène hieronder op `media: { kind: "sequence", id: "<scene-id>" }`.
 * Er hoeft verder geen code te veranderen. Zie docs/STORYBOARD-HIGGSFIELD.md.
 */
import manifest from "./media-manifest.json";

/** `v` = versie voor cache-busting; wordt door scripts/video-to-frames.sh gezet. */
export type SequenceVariant = { frames: number; path: string; width: number; height: number; v?: number };
/** Ontbreekt één variant, dan wordt de andere gebruikt (bijgesneden). */
export type SequenceEntry = { mobile?: SequenceVariant; desktop?: SequenceVariant; placeholder?: boolean };

export const frameUrl = (v: SequenceVariant, i: number) =>
  `${v.path}/f_${String(i + 1).padStart(4, "0")}.webp${v.v ? `?v=${v.v}` : ""}`;

export type SceneMedia =
  | { kind: "sequence"; id: keyof typeof manifest | string }
  | {
      kind: "still";
      mobile: string;
      desktop: string;
      /** Scrollgestuurde camerabeweging over de still (tijdelijk, tot er een beeldreeks is). */
      motion: "push" | "drift" | "settle";
      /** Focuspunt voor de push-in, in % van het beeld. */
      focus?: [number, number];
    };

export type Scene = {
  id: string;
  /** Korte hoofdstuknaam, getoond boven de tekst. */
  label: string;
  /** Hoeveel schermhoogtes deze scène 'duurt' tijdens het scrollen. */
  length: number;
  heading: string;
  body?: string;
  /** Extra regel onder de body, bv. een link naar behandelingen. */
  link?: { label: string; href: string };
  media: SceneMedia;
  alt: string;
  /** Uitleg voor het team zolang er tijdelijk beeld staat. */
  placeholder?: string;
};

export const sequences = manifest as Record<string, SequenceEntry>;

const still = (name: string, motion: "push" | "drift" | "settle", focus?: [number, number]): SceneMedia => ({
  kind: "still",
  mobile: `/media/stills/${name}-mobile.webp`,
  desktop: `/media/stills/${name}-desktop.webp`,
  motion,
  focus,
});

/** Scène 1 (De uitnodiging) is de hero en staat los in Hero.tsx. */
export const heroMedia = still("lounge", "settle");
export const heroAlt =
  "De ontvangsthoek van Casa Amoray met twee groene fauteuils, een klein tafeltje en warm, zacht licht.";

/** Scènes 2 t/m 6: de filmische klantreis. */
export const scenes: Scene[] = [
  {
    id: "binnenkomst",
    label: "Binnenkomst",
    length: 2.6,
    heading: "Laat de drukte van de dag achter je.",
    media: { kind: "sequence", id: "binnenkomst" },
    alt: "De camera beweegt langzaam de salon in, langs de ontvangsthoek naar de massageruimte.",
    placeholder: "Tijdelijke beeldreeks, gemaakt van de salon-mock-up. Wordt vervangen door Higgsfield-clip 02.",
  },
  {
    id: "welkom",
    label: "Het welkom",
    length: 2.2,
    heading: "Hier draait het even helemaal om jou.",
    body: "Je wordt persoonlijk ontvangen met een kopje thee en een rustig moment om je wensen te bespreken.",
    media: still("welkom", "push", [32, 62]),
    alt: "Twee comfortabele fauteuils en een klein tafeltje in de ontvangsthoek, klaar voor een kopje thee.",
    placeholder: "Hier komt Winnie die thee inschenkt (clip 03). Pas maken mét echte referentiefoto van Winnie.",
  },
  {
    id: "ruimte",
    label: "De massageruimte",
    length: 2.2,
    heading: "Ontspan. Laat los. Geniet.",
    body: "Een rustige ruimte met zachte handdoeken, massageolie en gedempt licht.",
    media: still("ruimte", "drift", [50, 55]),
    alt: "Massageolie, opgerolde handdoeken, een kaars en takjes groen op een houten blad.",
    placeholder: "Tijdelijke still. Wordt clip 04: camera glijdt naar de massagetafel.",
  },
  {
    id: "behandeling",
    label: "De behandeling",
    length: 2.4,
    heading: "Een behandeling afgestemd op jouw wensen.",
    body: "Of je nu net moeder bent geworden of gewoon even toe bent aan rust: je kiest voor een postpartummassage of een ontspanningsmassage.",
    link: { label: "Bekijk de behandelingen", href: "#behandelingen" },
    media: still("behandeling", "push", [55, 45]),
    alt: "Een rustige, professionele voetmassage met massageolie bij kaarslicht.",
    placeholder: "Tijdelijke still. Wordt clip 05: rustige massagebewegingen, handen goed in beeld.",
  },
  {
    id: "nagevoel",
    label: "Na afloop",
    length: 2.2,
    heading: "Neem dat ontspannen gevoel mee naar huis.",
    media: still("nagevoel", "settle", [60, 45]),
    alt: "Een ontspannen vrouw ligt onder een zachte handdoek op de massagetafel, met een warm kompres over haar ogen.",
    placeholder: "Tijdelijke still. Wordt clip 06: rustig nagenieten, camera komt tot stilstand.",
  },
];
