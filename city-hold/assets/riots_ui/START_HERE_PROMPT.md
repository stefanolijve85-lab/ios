# RIOTS — implementeer het nieuwe menu

Werk in de bestaande speelbare game. Bekijk alle vier PNG's in references op volledige resolutie voordat je begint. De visuals zijn het ontwerpreferentiepunt; bouw geen generiek nieuw menu. Voer de wijzigingen uit en controleer ze visueel.

## Naam en bestaande gegevens

De nieuwe zichtbare titel is RIOTS. Vervang CITY HOLD en LOOTING & RIOTING in spelersteksten, documenttitel en relevante appmetadata. Behoud bestaande technische savekeys, identifiers, voortgang en assetpaden of migreer ze veilig. Hernoem geen bestanden blind. Cover 01 is voor splash/promotie; menu 02 is het startscherm. Geen extra splashklik noodzakelijk.

## Schermvolgorde

Startmenu → Spelen → Kies je stad → Verder → Kies je kant → Start missie → bestaande voorbereidingsfase en game.

Menu: RIOTS, oranje onderstreping, Elke straat telt., grote SPELEN-knop, secundair VOORTGANG en INSTELLINGEN. Geen stadskeuze of zijkeuze op dit scherm. Geen 3D-assets, debugknoppen, uitleg over procedurele modellen, researchcounter of resetknop.

Stadskeuze: zes kaarten in deze volgorde: Parijs, Amsterdam, Londen, Milaan, Berlijn, São Paulo. Geselecteerde stad als groot hero-beeld, stads-/landnaam, werkelijke beschikbaarheid en VERDER. Gebruik bestaande unlockregels en voortgang; slotjes in de mockup zijn alleen voorbeeldstatus. Een vergrendelde kaart mag informatie tonen, maar mag geen missie starten. Toon concrete vrijspeelvoorwaarde als tekst. Bewaar selectie bij teruggaan.

Kies je kant: gelijkwaardige kaarten VERDEDIGEN en PLUNDEREN. Beschrijving verdediging: Bescherm winkels en houd de straat veilig. Beschrijving plunderen: Verzamel buit en bereik de uitgang. Geselecteerde kaart oranje kader; onderaan gekozen stad, bestaand missiedoel, moeilijkheid en START MISSIE. Missiedoel verandert met speelzijde. De referentie toont Normaal/Moeilijk/Expert als ontwerpvoorbeeld: koppel alleen aan werkelijk ondersteunde moeilijkheden, maak geen schijnknoppen zonder functie.

VOORTGANG opent bestaande upgrades/onderzoek en campagnevoortgang in dezelfde stijl. INSTELLINGEN bevat geluid, taal en ondersteunde grafische opties. Voortgang wissen alleen diep in Instellingen met expliciete bevestiging. TERUG is zichtbaar op vervolgschermen; Escape/keyboard back en touch werken zonder onverwacht starten.

## Visuele overeenkomst

02,03,04 zijn volledige rastermockups met ingebakken tekst en knoppen. Gebruik ze NIET als één achtergrond met onzichtbare klikvlakken, en leg geen tweede tekstlaag over ingebakken labels. Bouw echte semantische UI-elementen, plaats artwork, logo, gradients en tekst apart. Gebruik bestaande losse stads-/personagebeelden als artwork waar passend. Nieuwe tekstloze achtergronden en losse kaartbeelden zijn nog niet in deze levering opgenomen; maak geschikte afgeleide crops zonder ingebakken UI of gebruik bestaande losse assets. Als een passend achtergrondbeeld ontbreekt, meld dit concreet; claim geen exacte beeldmatch met ander artwork.

Behoud compositie, ruimteverdeling, beeldhiërarchie, kleur en lettervorm zo dicht mogelijk bij de referenties. Geen extra panelen of decoratie bedenken. Maak de straat zichtbaar en houd donkere gradient alleen waar contrast nodig is. Off-white titel met verweerde afwerking; oranje korte lijn, amber primaire knoppen, donkere tekst op knoppen. Gebruik een lokale gelicentieerde condensed displayfont wanneer beschikbaar; vermeld font-substitutie. De exacte gegenereerde lettervorm heeft geen meegeleverd fontbestand. Gebruik tekstlabels als echte tekst voor vertalen, focus en mobiel.

## Layout en responsive

Desktop referentie circa 1672 x 941. Gebruik verhoudingen, niet één vaste volledige screenshotbreedte. Linker menuzone ongeveer 36%; linkermarge 5%; grote titel bovenin; SPELEN rond middenhoogte; twee secundaire acties eronder. Stadselectie: hero vult bovenste circa 70%; zes kaarten in onderste band. Zijkeuze: twee kaarten naast elkaar, missiebar onderaan. Houd doelen/labels buiten drukke achtergrondstukken.

Mobiel portret: achtergrond cover-crop, titel en menu met veilige marges; stadkaarten horizontaal swipebaar met zichtbare selectie, VERDER bereikbaar zonder browserbalk-overlap. Zijkeuzekaarten onder elkaar met compacte missiebar. Landscape mobiel: twee kolommen waar ruimte is. Geen afgeknipte knoppen of horizontale paginascroll. Minimaal 44 CSS px interactiehoogte en duidelijke focus/selected/disabled states. Lettergrootte met clamp, safe-area insets respecteren. Tekst blijft leesbaar en de titel nooit buiten scherm.

## Uitvoering en acceptatie

1. Bekijk huidige code, instructies en assets. Gebruik bestaande framework/renderer; behoud gamegegevens.
2. Bouw menu-componenten en state-overgangen met duidelijke terugnavigatie. Onderscheid UI-state van gespeelde campagnegegevens.
3. Verbind alle knoppen echt. START MISSIE gebruikt exact gekozen stad, kant en ondersteunde moeilijkheid. Geen game-loop of 3D-scene laten draaien onder statische menu's als dat onnodig belast.
4. Vergelijk screenshots op referentieverhouding en op 390x844, 844x390 en 1440x900. Controleer titel, marges, CTA en kaartformaten; corrigeer verschillen en vermeld resterende afwijkingen. Screenshotcontrole is nodig om visuele overeenkomst te beoordelen.
5. Controleer bestaande tests, stadsvergrendeling, upgrades, back, instellingenpersist, save/reload en pc/touch. Voeg geen claim toe van apparaat-tests die niet zijn uitgevoerd.
6. Lever de aangepaste lokaal startbare game met samenvatting, screenshots en concrete beperkingen op. Stop niet bij alleen een plan.

De beeldreferenties tonen een visuele richting voor menu en cover, geen belofte dat de 3D-gameplay dezelfde renderkwaliteit heeft. De bestaande huidige gamebron is hier niet beschikbaar in dit pakket en niet gewijzigd. Geen pixel-perfect garantie zonder implementatie en vergelijking.
