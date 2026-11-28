// Norwegian (bokmål) texts of the About dialog (index.html), keyed like i18n-nb.ts.
// Kept apart from the start-up language file: they load when About is first
// opened (about.ts), as most visitors never open it.

export const NORWEGIAN_ABOUT: Record<string, string> = {
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Trykk hvor som helst på verdenskartet, søk etter et sted eller bruk posisjonen din for å se været der: nå, de neste 24 timene og 7 dagene, med luftkvalitet, UV, nedbørsradar og farevarsler.',
  'Where the data comes from': 'Hvor dataene kommer fra',
  Privacy: 'Personvern',
  'Use at your own risk': 'Bruk på eget ansvar',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Værvarsler kan slå feil, og data kan være forsinket eller mangle. Ikke stol på denne appen alene når sikkerheten står på spill, for eksempel på sjøen, på fjellet eller i farlig vær. Følg de offisielle farevarslene fra den nasjonale værtjenesten.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Luftkvalitet, pollen og UV er generell informasjon, ikke medisinske råd.',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Sjansen for nordlys er et modellanslag for omtrent den neste timen, og nordlyset kan endre seg på få minutter. Stjernekikking, gyllen time og de andre tidene for himmelen beregnes fra sola, månen og skyvarselet og er omtrentlige.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Den atmosfæriske korreksjonen for oppmålingsinstrumenter og luftverdiene (forurensning, CO₂, metan) er modellanslag, ikke målinger. Ikke bruk dem der nøyaktighet er viktig uten å måle på stedet.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Appen er gratis og leveres som den er, uten noen garanti. Så langt loven tillater det, tas det ikke ansvar for tap som følge av bruken.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Appen har ingen tilknytning til dataleverandørene eller instrumentprodusentene ovenfor og er ikke godkjent av dem.',
  'html:sources-weather':
    '<strong>Vær, UV, snø og hav, og ballongens vinder:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Stedssøk og værsymbolenes byer:</strong> Open-Meteo, stedsnavn fra <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Navn på steder du trykker på:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-bidragsytere</a> (ODbL)',
  'html:sources-air':
    '<strong>Luftkvalitet, pollen og klimagasser:</strong> Copernicus Atmosphere Monitoring Service, via Open-Meteo',
  'html:sources-history':
    '<strong>Været en tidligere dag:</strong> ERA5 fra Copernicus klimatjeneste, via <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-aurora':
    '<strong>Nordlys:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-modellen, public domain)',
  'html:sources-edm':
    '<strong>Atmosfærisk korreksjon (EDM):</strong> beregnes i appen med formelen Leica Geosystems publiserer i brukerhåndbøkene for totalstasjoner (f.eks. brukerhåndboken for TS13, Technical Data → Formulas; synlig rød laser, 658 nm), fra varselets temperatur, lufttrykk ved bakken og luftfuktighet. 0 ppm = 1013,25 hPa, 12 °C, 60 % luftfuktighet. Andre fabrikater og lasere bruker litt andre formler, som regel innenfor noen få ppm.',
  'html:sources-elevation':
    '<strong>Høyde over havet:</strong> fra høydemodellen Copernicus DEM (rutenett på 90 m), via Open-Meteo; i bratt terreng kan den avvike med flere titalls meter.',
  'html:sources-fishing':
    '<strong>Fisketider:</strong> regnes ut i appen fra månens posisjon (solunarperioder, som i fiskekalendere): en gammel tradisjon, ikke en prognose for hvordan fisken biter.',
  'html:sources-ev':
    '<strong>Elbilens rekkevidde i kulde:</strong> typiske tall fra publiserte vintertester og flåtedata (NAFs El Prix-vintertester, AAA, Geotab) etter temperaturen nå; ikke noen bestemt bil.',
  'html:sources-map':
    '<strong>Kart:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-bidragsytere</a>, vist med <a href="https://leafletjs.com/">Leaflet</a>',
  'html:sources-radar':
    '<strong>Nedbørsradar:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> i Nord-Amerika (Open Government Licence – Canada) og <a href="https://www.rainviewer.com/">RainViewer</a> ellers',
  'html:sources-warnings':
    '<strong>Farevarsler:</strong> Environment and Climate Change Canada, USAs National Weather Service, Meteorologisk institutt (MET Norway, CC BY 4.0), SMHI (CC BY 4.0) og Finlands meteorologiske institutt (CC BY 4.0), for Canada, USA, Norge, Sverige og Finland. Finlands varsler kommer via nettstedets egen server, fordi nettlesere ikke kan lese varselstrømmen til Finlands meteorologiske institutt direkte; posisjonen din sendes ikke dit (appen sjekker selv hvilke varsler som gjelder stedet)',
  'html:sources-roads':
    '<strong>Føreforhold i Finland:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), hovedveien nærmest stedet; hentes for hele landet, så ingen posisjon sendes',
  'html:privacy-tracking':
    'Ingen konto, ingen informasjonskapsler og ingen sporing. Besøk telles anonymt med Cloudflare Web Analytics, uten informasjonskapsler eller noe som identifiserer deg.',
  'html:privacy-saved':
    'Favorittene dine, startstedet (avrundet til omtrent 1 km), valgene av enheter, lyst eller mørkt utseende og farger, språk, innstillingene for nedbørsradaren og værsymbolene, hvilke deler du har skjult, quizresultatene dine (dagens resultat, rekke og beste) og ballongens navn og beste flytur og dine beste driftpoeng og lydvalget ditt lagres bare i denne nettleseren, på denne enheten. Det samme gjør værreisen din: poeng, merker og hvilke områder (omtrent 50 km), land og verdensdeler du har sett på. Det samme gjør været for de tre siste stedene du så på (avrundet til omtrent 1 km), slik at det kan vises uten nettforbindelse, og i to timer været i byene værsymbolene viste.',
  'html:privacy-sent':
    'For å vise været sendes koordinatene for stedet du velger til værtjenestene ovenfor, og for et sted du trykker på også til OpenStreetMaps Nominatim, for navnet. For Været en bestemt dag sendes også dagen du velger til Open-Meteo, og den lagres ikke. Som for alle nettsteder ser de, kartjenesten og Cloudflare (som er vert for nettstedet) IP-adressen din.',
  'html:privacy-location':
    'Posisjonen din brukes bare når du trykker på Min posisjon. Den lagres bare hvis du gjør stedet til startsted, og sammen med været der (ovenfor), avrundet til omtrent 1 km.',
  'html:privacy-address':
    'Adressen til siden viser stedet du ser på (avrundet til omtrent 1 km), slik at den kan lagres som bokmerke eller deles. Den blir i nettleseren din med mindre du deler lenken.',
  'html:fun-disclaimer':
    'Værunnskyldninger, småprat og haiku er for moro skyld. De bygger på værmeldingen for stedet; resultatet kan ikke garanteres. Vi tar ikke ansvar hvis sjefen ikke godtar unnskyldningen, samtalen dør etter én setning, eller katten din er uenig.',
};
