import { Hero } from "@/components/home/Hero";
import { Wandeling } from "@/components/home/Wandeling";
import { Assortiment } from "@/components/home/Assortiment";
import { KaasBeleving } from "@/components/home/KaasBeleving";
import { Borrel } from "@/components/home/Borrel";
import { Cadeau } from "@/components/home/Cadeau";
import { MaakKennis } from "@/components/home/MaakKennis";
import { GalerijSectie } from "@/components/Galerij";
import { Langskomen } from "@/components/Langskomen";
import { Ribbon } from "@/components/Ribbon";

export default function Home() {
  return (
    <>
      <Hero />
      <Wandeling />
      <Assortiment />
      <Ribbon />
      <KaasBeleving />
      <Borrel />
      <Cadeau />
      <MaakKennis />
      <GalerijSectie />
      <Langskomen />
    </>
  );
}
