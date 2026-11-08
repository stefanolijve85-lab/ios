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

/**
 * Eén sleutelpositie van de camera over een still.
 * `at` = voortgang in de scène (0..1), `scale` = inzoom (1 = hele beeld),
 * `x`/`y` = verschuiving in % van het beeld (negatief = naar links/boven).
 * Let op: |x| en |y| mogen niet groter zijn dan (scale - 1) * 50, anders zie je de rand.
 */
export type CameraKey = { at: number; scale: number; x?: number; y?: number };

export type StillMedia = {
  kind: "still";
  mobile: string;
  desktop: string;
  /** Scrollgestuurd camerapad over de still (tijdelijk, tot er een beeldreeks is). */
  camera?: CameraKey[];
  /** Punt waar de camera naartoe zoomt, in % van het beeld. */
  origin?: [number, number];
};

export type SceneMedia =
  | {
      kind: "sequence";
      id: keyof typeof manifest | string;
      /**
       * Voor brede schermen zolang er alleen een staande (mobiele) beeldreeks is:
       * dan wordt deze still met camerapad getoond in plaats van de video op te rekken.
       */
      landscape?: StillMedia;
      /** Welk frame als stilstaand beeld dient (statische weergave); standaard het eerste. */
      posterFrame?: number;
    }
  | {
      kind: "still";
      mobile: string;
      desktop: string;
      /** Scrollgestuurd camerapad over de still (tijdelijk, tot er een beeldreeks is). */
      camera?: CameraKey[];
      /** Punt waar de camera naartoe zoomt, in % van het beeld. */
      origin?: [number, number];
    };

/**
 * Hoeveel schermhoogte twee opeenvolgende scènes overlappen. In die zone
 * staan beide stil en vloeit de volgende scène over de vorige heen (dissolve).
 * Moet overeenkomen met --overlap in globals.css.
 */
export const OVERLAP = 0.2; // kort: geen lang dubbelbeeld tijdens het scrollen

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
  /** Vaste, zichtbare vermelding bij AI-beelden van echte personen (EU AI-verordening, art. 50). */
  aiNote?: string;
  /**
   * Schermvullend achter de menubalk, precies zoals de hero-foto. Voor de eerste scène:
   * dan ligt frame 1 exact over de foto en lijkt de foto vanzelf in beweging te komen.
   */
  fullBleed?: boolean;
};

export const sequences = manifest as Record<string, SequenceEntry>;

const still = (name: string, camera?: CameraKey[], origin?: [number, number]) =>
  ({
    kind: "still",
    mobile: `/media/stills/${name}-mobile.webp`,
    desktop: `/media/stills/${name}-desktop.webp`,
    camera,
    origin,
  }) as StillMedia;

/**
 * Scène 1 (De uitnodiging) is de hero en staat los in Hero.tsx.
 * Dit beeld is identiek aan frame 1 van 'binnenkomst', zodat de overgang naadloos is.
 */
export const heroMedia = still("lounge");
export const heroAlt =
  "De ontvangsthoek van Casa Amoray met twee groene fauteuils, een klein tafeltje en warm, zacht licht.";

/**
 * Scènes 2 t/m 6: de filmische klantreis.
 * Mobiel: Higgsfield-clips (Seedance 2.0 Mini, 9:16, 4 s) als beeldreeks.
 * Desktop: zolang er geen 16:9-clips zijn, de still met camerapad (`landscape`).
 */
export const scenes: Scene[] = [
  {
    id: "binnenkomst",
    label: "Binnenkomst",
    fullBleed: true,
    length: 3.2,
    heading: "Laat de drukte van de dag achter je.",
    media: {
      kind: "sequence",
      id: "binnenkomst",
      landscape: still(
        "lounge",
        [
          { at: 0, scale: 1.0 },
          { at: 1, scale: 1.5 },
        ],
        [82, 45],
      ),
    },
    alt: "De camera beweegt langzaam de salon in, langs de ontvangsthoek naar de massagetafel.",
  },
  {
    id: "welkom",
    label: "Het welkom",
    length: 3.1,
    heading: "Hier draait het even helemaal om jou.",
    body: "Je wordt persoonlijk ontvangen met een kopje thee en een rustig moment om je wensen te bespreken.",
    media: {
      kind: "sequence",
      id: "welkom",
      posterFrame: 95, // laatste frame: Winnie lacht je toe
      landscape: still(
        "welkom",
        [
          { at: 0, scale: 1.06, x: 2.5 },
          { at: 1, scale: 1.38, x: -3, y: -2 },
        ],
        [32, 62],
      ),
    },
    alt: "Winnie schenkt in de ontvangsthoek een kopje thee in en lacht je vriendelijk toe.",
    aiNote: "Beeld gemaakt met AI, op basis van een foto van Winnie.",
  },
  {
    id: "ruimte",
    label: "De massageruimte",
    length: 2.9,
    heading: "Ontspan. Laat los. Geniet.",
    body: "Een rustige ruimte met zachte handdoeken, massageolie en gedempt licht.",
    media: {
      kind: "sequence",
      id: "ruimte",
      landscape: still(
        "ruimte",
        [
          { at: 0, scale: 1.2, x: 6 },
          { at: 1, scale: 1.26, x: -6, y: -1 },
        ],
        [50, 55],
      ),
    },
    alt: "Massageolie, opgerolde handdoeken, een kaars en takjes groen op een houten blad.",
  },
  {
    id: "behandeling",
    label: "De behandeling",
    length: 3.1,
    heading: "Een behandeling afgestemd op jouw wensen.",
    body: "Of je nu net moeder bent geworden of gewoon even toe bent aan rust: je kiest voor een postpartummassage of een ontspanningsmassage.",
    link: { label: "Bekijk de behandelingen", href: "#behandelingen" },
    media: {
      kind: "sequence",
      id: "behandeling",
      landscape: still(
        "behandeling",
        [
          { at: 0, scale: 1.04 },
          { at: 1, scale: 1.32, x: -1.5, y: 1.5 },
        ],
        [55, 45],
      ),
    },
    alt: "Een rustige, professionele voetmassage met massageolie bij kaarslicht.",
  },
  {
    id: "nagevoel",
    label: "Na afloop",
    length: 3.4,
    heading: "Neem dat ontspannen gevoel mee naar huis.",
    media: {
      kind: "sequence",
      id: "nagevoel",
      landscape: still(
        "nagevoel",
        [
          { at: 0, scale: 1.3, y: 2 },
          { at: 0.6, scale: 1.06 },
          { at: 1, scale: 1.02 },
        ],
        [60, 45],
      ),
    },
    alt: "Een ontspannen vrouw ligt onder een zachte handdoek op de massagetafel, met een warm kompres over haar ogen.",
  },
];
