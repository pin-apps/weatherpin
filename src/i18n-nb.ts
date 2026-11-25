// Norwegian (bokmål) texts, keyed by the English text (see i18n.ts).
// {placeholders} stay as they are. A "context|" in front of a key tells
// apart English words that need different translations.
// scripts/check-i18n.mjs checks that every text in the app is here.
//
// Weather words follow MET Norway's usage on Yr (klarvær, lettskyet,
// delvis skyet, skyet, yr, byger…), UV levels too (lav, moderat, høy…).
// "Meteorologisk institutt" means MET Norway in Norwegian, so Finland's
// institute is "Finlands meteorologiske institutt".

export const NORWEGIAN: Record<string, string> = {
  // ── Page (index.html) ───────────────────────────────────────────────────
  'World map. Click or tap a point to see the weather there. With the keyboard, pan with the arrow keys and press Enter for the weather at the centre.':
    'Verdenskart. Klikk eller trykk på et sted for å se været der. Med tastaturet flytter du kartet med piltastene og trykker Enter for været midt på kartet.',
  'Weatherpin – weather anywhere on the world map':
    'Weatherpin – været hvor som helst på verdenskartet',
  'Search for a place': 'Søk etter et sted',
  'Random place': 'Tilfeldig sted',
  'Edit favourites': 'Rediger favoritter',
  'Weather at my location': 'Været der jeg er',
  'Rain radar': 'Nedbørsradar',
  'Weather details': 'Værdetaljer',
  Weather: 'Vær',
  'Start place': 'Startsted',
  Favourite: 'Favoritt',
  'Close weather panel': 'Lukk værvisningen',
  'Share this place': 'Del dette stedet',
  'Share as a picture': 'Del som bilde',
  'Greetings from': 'Hilsen fra',
  'Today {temps}': 'I dag {temps}',
  'Today {temps} · rain {percent}': 'I dag {temps} · regn {percent}',
  Tomorrow: 'I morgen',
  'Picture saved': 'Bildet er lagret',
  "Couldn't make the picture": 'Kunne ikke lage bildet',
  'Start here': 'Start her',
  'The app will open here.': 'Appen åpnes her fra nå av.',
  'The app will open at the world map.': 'Appen åpnes ved verdenskartet fra nå av.',
  'More actions': 'Flere handlinger',
  'Weather data by Open-Meteo.com': 'Værdata fra Open-Meteo.com',
  'About Weatherpin': 'Om Weatherpin',
  Close: 'Lukk',
  Settings: 'Innstillinger',
  Temperature: 'Temperatur',
  Appearance: 'Utseende',
  Automatic: 'Automatisk',
  Light: 'Lyst',
  Dark: 'Mørkt',
  "Automatic follows your device's setting.": 'Automatisk følger innstillingen på enheten.',
  'Remove start place': 'Fjern startstedet',
  'The app opens at {place}.': 'Appen åpnes ved {place}.',
  'The app opens at the world map. To change it, open a place and choose Start here in its ⋯ menu.':
    'Appen åpnes ved verdenskartet. Du endrer det ved å åpne et sted og velge Start her i ⋯-menyen.',
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Trykk hvor som helst på verdenskartet, søk etter et sted eller bruk posisjonen din for å se været der: nå, de neste 24 timene og 7 dagene, med luftkvalitet, UV, nedbørsradar og farevarsler.',
  'Where the data comes from': 'Hvor dataene kommer fra',
  Privacy: 'Personvern',
  // The sauna easter egg (sauna.ts).
  Sauna: 'Badstue',
  'Saunalahti, Finland': 'Saunalahti, Finland',
  'Löyly incoming': 'Vann på steinene',
  'Humidity rising': 'Fuktigheten stiger',
  'Wind: none (close the door!)': 'Vind: ingen (lukk døra!)',
  'After the sauna: the sea is right there': 'Etter badstua: havet er rett ved',
  'After the sauna: the sea is {temperature}': 'Etter badstua: havet er {temperature}',
  // The Santa easter egg (santa.ts).
  "Santa's workshop": 'Nissens verksted',
  "Santa's workshop, Rovaniemi": 'Nissens verksted, Rovaniemi',
  'Rovaniemi, Finland': 'Rovaniemi, Finland',
  'Sleigh flying conditions: excellent': 'Flyforhold for sleden: utmerket',
  'Sleigh flying conditions: bumpy, hold on to the presents':
    'Flyforhold for sleden: humpete, hold godt i gavene',
  'Sleigh flying conditions: stormy, reindeer on standby':
    'Flyforhold for sleden: storm, reinsdyrene står i beredskap',
  'Reindeer visibility: good': 'Sikt for reinsdyrene: god',
  'Reindeer visibility: snowy': 'Sikt for reinsdyrene: snøvær',
  'Reindeer visibility: foggy, follow the bright red nose':
    'Sikt for reinsdyrene: tåke, følg den lysende røde nesen',
  'The elves are resting: merry Christmas!': 'Nissene hviler: god jul!',
  'Elves: busy, {count} day to Christmas Eve': 'Nissene: travle, {count} dag til julaften',
  'Elves: busy, {count} days to Christmas Eve': 'Nissene: travle, {count} dager til julaften',
  'Use at your own risk': 'Bruk på eget ansvar',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Værvarsler kan slå feil, og data kan være forsinket eller mangle. Ikke stol på denne appen alene når sikkerheten står på spill, for eksempel på sjøen, på fjellet eller i farlig vær. Følg de offisielle farevarslene fra den nasjonale værtjenesten.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Luftkvalitet, pollen og UV er generell informasjon, ikke medisinske råd.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Appen er gratis og leveres som den er, uten noen garanti. Så langt loven tillater det, tas det ikke ansvar for tap som følge av bruken.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Appen har ingen tilknytning til dataleverandørene eller instrumentprodusentene ovenfor og er ikke godkjent av dem.',
  Language: 'Språk',
  'Clear saved data': 'Slett lagrede data',
  Done: 'Ferdig',
  'Tap a name to rename the place. ↑ and ↓ change the order.':
    'Trykk på et navn for å gi stedet nytt navn. ↑ og ↓ endrer rekkefølgen.',
  'No favourites. Tap ☆ in the weather panel to save a place.':
    'Ingen favoritter. Trykk på ☆ i værvisningen for å lagre et sted.',
  Undo: 'Angre',

  'html:sources-weather':
    '<strong>Vær, UV, snø og hav:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Stedssøk:</strong> Open-Meteo, stedsnavn fra <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Navn på steder du trykker på:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-bidragsytere</a> (ODbL)',
  'html:sources-air':
    '<strong>Luftkvalitet, pollen og klimagasser:</strong> Copernicus Atmosphere Monitoring Service, via Open-Meteo',
  'html:sources-history':
    '<strong>Været en tidligere dag:</strong> ERA5 fra Copernicus klimatjeneste, via <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-map':
    '<strong>Kart:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-bidragsytere</a>, vist med <a href="https://leafletjs.com/">Leaflet</a>',
  'html:sources-radar':
    '<strong>Nedbørsradar:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> i Nord-Amerika (Open Government Licence – Canada) og <a href="https://www.rainviewer.com/">RainViewer</a> ellers',
  'html:sources-warnings':
    '<strong>Farevarsler:</strong> Environment and Climate Change Canada, USAs National Weather Service, Meteorologisk institutt (MET Norway, CC BY 4.0), SMHI (CC BY 4.0) og Finlands meteorologiske institutt (CC BY 4.0), for Canada, USA, Norge, Sverige og Finland. Finlands varsler kommer via nettstedets egen server, fordi nettlesere ikke kan lese varselstrømmen til Finlands meteorologiske institutt direkte; posisjonen din sendes ikke dit (appen sjekker selv hvilke varsler som gjelder stedet)',
  'html:privacy-tracking':
    'Ingen konto, ingen informasjonskapsler og ingen sporing. Besøk telles anonymt med Cloudflare Web Analytics, uten informasjonskapsler eller noe som identifiserer deg.',
  'html:privacy-saved':
    'Favorittene dine, startstedet (avrundet til omtrent 1 km), valgene av enheter, lyst eller mørkt utseende, språk, innstillingen for nedbørsradaren, hvilke deler du har skjult og quizresultatene dine (dagens resultat, rekke og beste) lagres bare i denne nettleseren, på denne enheten. Det samme gjør været for de tre siste stedene du så på (avrundet til omtrent 1 km), slik at det kan vises uten nettforbindelse.',
  'html:privacy-sent':
    'For å vise været sendes koordinatene for stedet du velger til værtjenestene ovenfor, og for et sted du trykker på også til OpenStreetMaps Nominatim, for navnet. For Været en bestemt dag sendes også dagen du velger til Open-Meteo, og den lagres ikke. Som for alle nettsteder ser de, kartjenesten og Cloudflare (som er vert for nettstedet) IP-adressen din.',
  'html:privacy-location':
    'Posisjonen din brukes bare når du trykker på Min posisjon. Den lagres bare hvis du gjør stedet til startsted, og sammen med været der (ovenfor), avrundet til omtrent 1 km.',
  'html:privacy-address':
    'Adressen til siden viser stedet du ser på (avrundet til omtrent 1 km), slik at den kan lagres som bokmerke eller deles. Den blir i nettleseren din med mindre du deler lenken.',

  // ── Map, search, location ───────────────────────────────────────────────
  About: 'Om',
  'Zoom in': 'Zoom inn',
  'Zoom out': 'Zoom ut',
  Favourites: 'Favoritter',
  Places: 'Steder',
  'No places found.': 'Fant ingen steder.',
  'Something went wrong searching.': 'Noe gikk galt med søket.',
  '{count} place found. Use the arrow keys to choose.': 'Fant {count} sted. Velg med piltastene.',
  '{count} places found. Use the arrow keys to choose.':
    'Fant {count} steder. Velg med piltastene.',
  '{count} favourite. Use the arrow keys to choose.': '{count} favoritt. Velg med piltastene.',
  '{count} favourites. Use the arrow keys to choose.': '{count} favoritter. Velg med piltastene.',
  'Could not reach the place search. Check your connection.':
    'Fikk ikke kontakt med stedssøket. Sjekk nettforbindelsen.',
  'Finding your location…': 'Finner posisjonen din…',
  'Your location could not be determined.': 'Kunne ikke finne posisjonen din.',
  'Your location could not be determined right now.': 'Kunne ikke finne posisjonen din akkurat nå.',
  "Location access is blocked. Allow it in your browser's site settings and try again.":
    'Tilgang til posisjon er blokkert. Tillat den i nettleserens innstillinger for nettstedet og prøv igjen.',
  'Finding your location took too long. Please try again.':
    'Det tok for lang tid å finne posisjonen din. Prøv igjen.',
  'Your location is only available over a secure (https) connection.':
    'Posisjonen din er bare tilgjengelig over en sikker (https) forbindelse.',
  'This browser cannot share your location.': 'Denne nettleseren kan ikke dele posisjonen din.',
  'Hide rain radar': 'Skjul nedbørsradaren',
  'Show rain radar': 'Vis nedbørsradaren',
  'Snow radar': 'Snøradar',
  Radar: 'Radar',
  'Rain radar is unavailable right now. Try again later.':
    'Nedbørsradaren er ikke tilgjengelig akkurat nå. Prøv igjen senere.',

  // ── Weather panel ───────────────────────────────────────────────────────
  'Loading…': 'Laster…',
  'Loading weather…': 'Laster været…',
  'Weather unavailable': 'Været er ikke tilgjengelig',
  'Try again': 'Prøv igjen',
  'Something went wrong loading the weather.': 'Noe gikk galt da været skulle lastes.',
  'Could not reach the weather service. Check your connection.':
    'Fikk ikke kontakt med værtjenesten. Sjekk nettforbindelsen.',
  'The weather service returned unexpected data.': 'Værtjenesten svarte med uventede data.',
  'Remove from favourites': 'Fjern fra favoritter',
  'Save as favourite': 'Lagre som favoritt',
  'Removed from favourites.': 'Fjernet fra favoritter.',
  'Saved to favourites.': 'Lagret som favoritt.',
  'You have {count} favourites. Remove one to save another.':
    'Du har {count} favoritter. Fjern en for å lagre en ny.',
  'Could not save: this browser is blocking storage.':
    'Kunne ikke lagre: nettleseren blokkerer lagring.',
  'Link copied': 'Lenken er kopiert',
  'Weather in {place}': 'Været i {place}',
  'Weather here': 'Været her',
  'The app opens here. Press to open at the world map instead.':
    'Appen åpnes her. Trykk for å åpne ved verdenskartet i stedet.',
  'Open the app at this place next time': 'Åpne appen ved dette stedet neste gang',

  // Now
  'Current weather': 'Været nå',
  'Feels like {temp}': 'Føles som {temp}',
  'Updated {time}': 'Oppdatert {time}',
  'No connection · weather from {time}': 'Ingen nettforbindelse · været fra {time}',
  'Rain starting around {time}': 'Regn fra rundt kl. {time}',
  'Rain stopping around {time}': 'Regnet gir seg rundt kl. {time}',
  'Snow starting around {time}': 'Snø fra rundt kl. {time}',
  'Snow stopping around {time}': 'Snøen gir seg rundt kl. {time}',
  // What to wear (weather/wear.ts)
  'What to wear:': 'Hva du bør ha på deg:',
  'Winter gear: hat and mittens': 'Vinterklær: lue og votter',
  'Warm coat': 'Varm jakke',
  Jacket: 'Jakke',
  'Light jacket or sweater': 'Tynn jakke eller genser',
  'T-shirt': 'T-skjorte',
  'Shorts weather': 'Shortsvær',
  'waterproof boots': 'vanntette sko',
  'a hood (too windy for an umbrella)': 'hette (for mye vind for paraply)',
  umbrella: 'paraply',
  'something windproof': 'noe vindtett',
  'sunglasses and sunscreen': 'solbriller og solkrem',
  Wind: 'Vind',
  'gusts {speed}': 'vindkast {speed}',
  Precipitation: 'Nedbør',
  '{amount} snow': '{amount} snø',
  'UV index': 'UV-indeks',
  "today's max {value} {level} around {time}": 'i dag høyest {value} {level} rundt kl. {time}',
  'around {time}': 'rundt kl. {time}',
  'Sun protection {hours}': 'Solbeskyttelse {hours}',
  'Air quality': 'Luftkvalitet',

  // Hours and days
  'Next 24 hours': 'Neste 24 timer',
  Now: 'Nå',
  'Chance of precipitation': 'Sannsynlighet for nedbør',
  '7 days': '7 dager',
  Today: 'I dag',
  'temperature|Low': 'Laveste',
  'temperature|high': 'høyeste',
  Snow: 'Snø',
  'UV index {value}, {level}': 'UV-indeks {value}, {level}',
  'Hours on {day}': 'Timer: {day}',
  'No hourly forecast for this day.': 'Ingen timevarsel for denne dagen.',
  'Temperature from {low} to {high}, warmest around {time}.':
    'Temperatur fra {low} til {high}, varmest rundt kl. {time}.',
  'Precipitation {amount} in total, most around {time}.':
    'Nedbør {amount} totalt, mest rundt kl. {time}.',
  'No precipitation.': 'Ingen nedbør.',

  // Sea
  Sea: 'Hav',
  Waves: 'Bølger',
  'every {seconds} s': 'periode {seconds} s',
  Swell: 'Dønning',
  'Highest in 24 h': 'Høyest innen 24 t',
  '{height} around {time}': '{height} rundt kl. {time}',
  'Sea temperature': 'Sjøtemperatur',

  // Air quality and pollen
  'Loading air quality…': 'Laster luftkvaliteten…',
  'Air quality is unavailable right now.': 'Luftkvaliteten er ikke tilgjengelig akkurat nå.',
  'No air quality index for this place.': 'Ingen luftkvalitetsindeks for dette stedet.',
  'European AQI': 'Europeisk luftkvalitetsindeks',
  'US AQI': 'Amerikansk luftkvalitetsindeks',
  'aqi|Good': 'God',
  'aqi|Fair': 'Grei',
  'aqi|Moderate': 'Moderat',
  'aqi|Poor': 'Dårlig',
  'aqi|Very poor': 'Svært dårlig',
  'aqi|Extremely poor': 'Ekstremt dårlig',
  'usaqi|Good': 'God',
  'usaqi|Moderate': 'Moderat',
  'usaqi|Unhealthy for sensitive groups': 'Helseskadelig for sårbare grupper',
  'usaqi|Unhealthy': 'Helseskadelig',
  'usaqi|Very unhealthy': 'Svært helseskadelig',
  'usaqi|Hazardous': 'Farlig',
  'UK DAQI': 'Storbritannias DAQI',
  'Canada AQHI': 'Canadas AQHI',
  'daqi|Low': 'Lav',
  'daqi|Moderate': 'Moderat',
  'daqi|High': 'Høy',
  'daqi|Very high': 'Svært høy',
  'aqhi|Low risk': 'Lav risiko',
  'aqhi|Moderate risk': 'Moderat risiko',
  'aqhi|High risk': 'Høy risiko',
  'aqhi|Very high risk': 'Svært høy risiko',
  'Worked out from forecast data; official readings can differ a little.':
    'Beregnet fra prognosedata; offisielle målinger kan avvike litt.',
  'Ozone (O₃)': 'Ozon (O₃)',
  'Nitrogen dioxide (NO₂)': 'Nitrogendioksid (NO₂)',
  'Next days': 'De neste dagene',
  'worst around {time}': 'verst rundt kl. {time}',
  '{name} pollen': '{name} (pollen)',
  'Pollen forecast': 'Pollenvarsel',
  None: 'Ingen pollen',
  Birch: 'Bjørk',
  Alder: 'Or',
  Grass: 'Gress',
  Mugwort: 'Burot',
  Ragweed: 'Ambrosia',
  Olive: 'Oliven',
  'pollen|Low': 'Lite',
  'pollen|Moderate': 'Moderat',
  'pollen|High': 'Mye',

  // UV levels
  Low: 'Lav',
  Moderate: 'Moderat',
  High: 'Høy',
  'Very high': 'Svært høy',
  Extreme: 'Ekstrem',

  // More details
  'More details': 'Flere detaljer',
  Humidity: 'Luftfuktighet',
  Pressure: 'Lufttrykk',
  rising: 'stigende',
  falling: 'synkende',
  steady: 'uendret',
  Sunrise: 'Soloppgang',
  Sunset: 'Solnedgang',
  'No sunrise today': 'Sola går ikke opp i dag',
  'No sunset today': 'Sola går ikke ned i dag',
  Sun: 'Sol',
  'Polar night – the sun does not rise today': 'Mørketid – sola går ikke opp i dag',
  'Midnight sun – the sun does not set today': 'Midnattssol – sola går ikke ned i dag',
  Daylight: 'Daglengde',
  '{minutes} min longer tomorrow': '{minutes} min lengre i morgen',
  '{minutes} min shorter tomorrow': '{minutes} min kortere i morgen',
  'about the same tomorrow': 'omtrent like lang i morgen',
  Moon: 'Månen',
  '{percent} lit': '{percent} opplyst',
  'New moon': 'Nymåne',
  'Waxing crescent': 'Voksende månesigd',
  'First quarter': 'Første kvarter',
  'Waxing gibbous': 'Voksende måne',
  'Full moon': 'Fullmåne',
  'Waning gibbous': 'Minkende måne',
  'Last quarter': 'Siste kvarter',
  'Waning crescent': 'Minkende månesigd',
  'Local time': 'Lokal tid',
  Coordinates: 'Koordinater',
  Elevation: 'Høyde over havet',

  // Warnings
  'Weather warnings': 'Farevarsler',
  'Checking…': 'Sjekker…',
  'until {time}': 'til {time}',
  'Sea area: {area}': 'Havområde: {area}',
  'Issued by': 'Utstedt av',
  'Not available for this area': 'Ikke tilgjengelig for dette området',
  "Couldn't be checked right now": 'Kunne ikke sjekkes akkurat nå',
  'None in effect': 'Ingen gjeldende',
  '{count} in effect (see top)': '{count} gjeldende (se øverst)',

  // Weather (WMO codes)
  'Clear sky': 'Klarvær',
  'Mainly clear': 'Lettskyet',
  'Partly cloudy': 'Delvis skyet',
  Overcast: 'Skyet',
  Fog: 'Tåke',
  'Depositing rime fog': 'Tåke med rim',
  'Light drizzle': 'Lett yr',
  'Moderate drizzle': 'Yr',
  'Dense drizzle': 'Tett yr',
  'Light freezing drizzle': 'Lett underkjølt yr',
  'Dense freezing drizzle': 'Tett underkjølt yr',
  'Slight rain': 'Lett regn',
  'Moderate rain': 'Regn',
  'Heavy rain': 'Kraftig regn',
  'Light freezing rain': 'Lett underkjølt regn',
  'Heavy freezing rain': 'Kraftig underkjølt regn',
  'Slight snowfall': 'Lett snø',
  'Moderate snowfall': 'Snø',
  'Heavy snowfall': 'Kraftig snø',
  'Snow grains': 'Kornsnø',
  'Slight rain showers': 'Lette regnbyger',
  'Moderate rain showers': 'Regnbyger',
  'Violent rain showers': 'Svært kraftige regnbyger',
  'Slight snow showers': 'Lette snøbyger',
  'Heavy snow showers': 'Kraftige snøbyger',
  Thunderstorm: 'Torden',
  'Thunderstorm with slight hail': 'Torden med lett hagl',
  'Heavy thunderstorm': 'Kraftig torden',
  'Thunderstorm with heavy hail': 'Torden med kraftig hagl',
  'Unknown conditions': 'Ukjent vær',

  // Favourites editor
  'Name for {place}': 'Navn på {place}',
  'Move {place} up': 'Flytt {place} opp',
  'Move {place} down': 'Flytt {place} ned',
  'Remove {place}': 'Fjern {place}',
  'Removed {place}.': '{place} er fjernet.',
  '{place} is back.': '{place} er tilbake.',
  "Couldn't put it back: this browser is blocking storage, or the list is full.":
    'Kunne ikke legge det tilbake: nettleseren blokkerer lagring, eller listen er full.',

  // Settings
  'Remove your favourites, start place and settings from this device?':
    'Vil du fjerne favorittene, startstedet og innstillingene dine fra denne enheten?',
  "This browser didn't let the app remove them.": 'Nettleseren lot ikke appen fjerne dem.',
  "This browser didn't let the app save it.": 'Nettleseren lot ikke appen lagre valget.',
  'Frost on car windscreens this morning': 'Rim på bilrutene i morges',
  'Scrape the windscreen tomorrow morning': 'Skrap frontruta i morgen tidlig',
  'Frost tonight ({temp}): bring the balcony plants in':
    'Frost i natt ({temp}): ta inn balkongplantene',
  'Weather record': 'Værrekord',
  'Vostok: coldest ever measured on Earth, {value} (1983)':
    'Vostok: det kaldeste som er målt på jorda, {value} (1983)',
  'Death Valley: hottest ever measured on Earth, {value} (1913)':
    'Death Valley: det varmeste som er målt på jorda, {value} (1913)',
  'Greenland: coldest in the Northern Hemisphere, {value} (1991)':
    'Grønland: det kaldeste på den nordlige halvkule, {value} (1991)',
  'Oymyakon: one of the coldest villages, {value} (1933)':
    'Ojmjakon: en av de kaldeste landsbyene, {value} (1933)',
  'Barrow Island: strongest gust ever measured, {value} (1996)':
    'Barrow Island: det kraftigste vindkastet som er målt, {value} (1996)',
  'Mawsynram: wettest place on Earth, about {value} a year':
    'Mawsynram: det våteste stedet på jorda, omtrent {value} i året',
  'Atacama Desert: some stations here have never had rain':
    'Atacamaørkenen: noen stasjoner her har aldri fått regn',
  'Pokka: coldest in Finland, {value} (1999)': 'Pokka: det kaldeste i Finland, {value} (1999)',
  'Liperi: hottest in Finland, {value} (2010)': 'Liperi: det varmeste i Finland, {value} (2010)',
  'Vuoggatjålme: coldest in Sweden, {value} (1966)':
    'Vuoggatjålme: det kaldeste i Sverige, {value} (1966)',
  'Karasjok: coldest in Norway, {value} (1886)': 'Karasjok: det kaldeste i Norge, {value} (1886)',
  'freezing rain': 'underkjølt regn',
  'html:sources-roads':
    '<strong>Føreforhold i Finland:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), hovedveien nærmest stedet; hentes for hele landet, så ingen posisjon sendes',
  'very slippery': 'svært glatt',
  slippery: 'glatt',
  icy: 'isete',
  'partly icy': 'delvis isete',
  slush: 'sørpe',
  'snow on the road': 'snø på veien',
  'frost on the road': 'rim på veien',
  'heavy snowfall': 'kraftig snøfall',
  snowfall: 'snøfall',
  'strong wind': 'sterk vind',
  'wet road': 'våt vei',
  'Very poor road conditions': 'Svært vanskelige kjøreforhold',
  'Poor road conditions': 'Vanskelige kjøreforhold',
  'Road weather:': 'Veivær:',
  'No official warnings in effect ·': 'Ingen offisielle farevarsler gjelder ·',
  "Official warnings couldn't be checked:": 'Offisielle farevarsler kunne ikke sjekkes:',
  'WMO severe weather': 'WMOs tjeneste for farlig vær',
  "This app doesn't show warnings for this region. Official warnings:":
    'Appen viser ikke farevarsler for dette området. Offisielle farevarsler:',
  'from {start} until {time}': '{start} – {time}',
  'from {start}': 'fra {start}',
  'Finnish Meteorological Institute': 'Finlands meteorologiske institutt',
  'Play radar history': 'Spill av radarhistorikk',
  'Pause radar history': 'Sett radarhistorikk på pause',
  'Radar time': 'Tidspunkt for radarbildet',
  '{time} · latest': '{time} · siste',
  '{time} · {minutes} min ago': '{time} · for {minutes} min siden',
  'loading {loaded}/{total}': 'laster {loaded}/{total}',
  // ── Weather on a day (past-weather.ts) ──
  'Weather on a day…': 'Været en bestemt dag…',
  'Weather on a day': 'Været en bestemt dag',
  'This day in the past': 'Denne dagen tidligere år',
  '1 year ago': 'For 1 år siden',
  '10 years ago': 'For 10 år siden',
  '50 years ago': 'For 50 år siden',
  'Any day': 'Valgfri dag',
  Show: 'Vis',
  'From 1 January 1940 to about a week ago.': 'Fra 1. januar 1940 til for omtrent en uke siden.',
  'Estimated from weather records (ERA5, about 25 km grid): a thermometer there may have shown a few degrees different. Historical weather: Open-Meteo.com, ERA5 by Copernicus.':
    'Anslått fra værdata (ERA5, rutenett på omtrent 25 km): et termometer på stedet kan ha vist noen grader annerledes. Historisk vær: Open-Meteo.com, ERA5 fra Copernicus.',
  'Pick a day between 1 January 1940 and a week ago.':
    'Velg en dag mellom 1. januar 1940 og for en uke siden.',
  "Couldn't get the weather for that day. Try again.":
    'Kunne ikke hente været for den dagen. Prøv igjen.',
  'No weather records for that day yet.': 'Ingen værdata for den dagen ennå.',
  'high {temperature}': 'høyest {temperature}',
  'low {temperature}': 'lavest {temperature}',
  'wind up to {speed}': 'vind opptil {speed}',
  '{hours} h of sunshine': '{hours} t sol',
  'Snow {amount}': 'Snø {amount}',
  'Rain {amount}': 'Nedbør {amount}',
  'No rain or snow': 'Ingen nedbør',
  '{degrees}° warmer': '{degrees}° varmere',
  '{degrees}° colder': '{degrees}° kaldere',
  'the same high': 'samme høyeste temperatur',
  'Today: {high} / {low}, {difference}': 'I dag: {high} / {low}, {difference}',
  "Couldn't open it. Check your connection.": 'Kunne ikke åpne den. Sjekk nettforbindelsen.',
  'Greetings from {year}': 'Hilsen fra {year}',
  'Weather in {place} on {date}': 'Været i {place} {date}',
  // ── Sky section (render/sky.ts) ──
  Sky: 'Himmelen',
  'Until midwinter': 'Til midtvinter',
  'Since midwinter': 'Siden midtvinter',
  '{duration} less daylight by {date}': '{duration} mindre dagslys til {date}',
  '+{duration} of daylight since {date}': '+{duration} dagslys siden {date}',
  'Golden hour': 'Gyllen time',
  'All day (the sun stays low)': 'Hele dagen (sola står lavt)',
  'Blue hour': 'Blå time',
  'dark sky': 'mørk himmel',
  'some moonlight': 'litt måneskinn',
  'bright moon': 'sterkt måneskinn',
  Stargazing: 'Stjernekikking',
  'Good {from}–{to}: clear sky, {moonlight}': 'Bra {from}–{to}: klar himmel, {moonlight}',
  'Almost none (the sun is high)': 'Nesten ingen (sola står høyt)',
  'Very long (the sun is low)': 'Svært lang (sola står lavt)',
  '{ratio}× your height': '{ratio} × høyden din',
  'Your shadow': 'Skyggen din',
  'Chance {percent} now': 'Sjanse {percent} nå',
  'low in the north': 'lavt i nord',
  'low in the south': 'lavt i sør',
  'Northern lights': 'Nordlys',
  'Southern lights': 'Sørlys',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Sjansen for nordlys er et modellanslag for omtrent den neste timen, og nordlyset kan endre seg på få minutter. Stjernekikking, gyllen time og de andre tidene for himmelen beregnes fra sola, månen og skyvarselet og er omtrentlige.',
  'html:sources-aurora':
    '<strong>Nordlys:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-modellen, public domain)',
  // ── Beer outside (render/sky.ts, weather/beer.ts) ──
  'Beer outside': 'Øl ute',
  'Gets warm in about {time}': 'Blir lunken på omtrent {time}',
  'Starts to freeze in about {time}': 'Begynner å fryse på omtrent {time}',
  'Stays cold out here': 'Holder seg kald her ute',
  'beer|sunny': 'sol',
  'beer|breezy': 'bris',
  'beer|windy': 'mye vind',
  // ── Atmospheric correction for surveying instruments (weather/edm.ts) ──
  'Atmospheric correction (EDM)': 'Atmosfærisk korreksjon (EDM)',
  '{pressure} at ground level': '{pressure} ved bakken',
  'Estimate only, not a measurement.': 'Bare et anslag, ikke en måling.',
  'Worked out from the weather forecast for this area, which can differ from the conditions at your instrument by several ppm. For survey work, measure temperature and pressure on site.':
    'Beregnet fra værvarselet for området, som kan avvike fra forholdene ved instrumentet ditt med flere ppm. Ved oppmåling: mål temperatur og lufttrykk på stedet.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Den atmosfæriske korreksjonen for oppmålingsinstrumenter og luftverdiene (forurensning, CO₂, metan) er modellanslag, ikke målinger. Ikke bruk dem der nøyaktighet er viktig uten å måle på stedet.',
  'html:sources-edm':
    '<strong>Atmosfærisk korreksjon (EDM):</strong> beregnes i appen med formelen Leica Geosystems publiserer i brukerhåndbøkene for totalstasjoner (f.eks. brukerhåndboken for TS13, Technical Data → Formulas; synlig rød laser, 658 nm), fra varselets temperatur, lufttrykk ved bakken og luftfuktighet. 0 ppm = 1013,25 hPa, 12 °C, 60 % luftfuktighet. Andre fabrikater og lasere bruker litt andre formler, som regel innenfor noen få ppm.',
  // ── More air values (render/air-quality.ts) ──
  'Sulphur dioxide (SO₂)': 'Svoveldioksid (SO₂)',
  'Carbon monoxide (CO)': 'Karbonmonoksid (CO)',
  'Desert dust': 'Ørkenstøv',
  'Greenhouse gases': 'Klimagasser',
  'Carbon dioxide (CO₂)': 'Karbondioksid (CO₂)',
  'Methane (CH₄)': 'Metan (CH₄)',
  'Everything in this section comes from the CAMS forecast model, not from measuring stations.':
    'Alt i denne delen kommer fra prognosemodellen CAMS, ikke fra målestasjoner.',
  'Values are averages for an area about 11 km across in Europe (40 km elsewhere); stations nearby can show different values.':
    'Verdiene er gjennomsnitt for et område på omtrent 11 km i Europa (40 km andre steder); målestasjoner i nærheten kan vise andre verdier.',
  'Not part of the air quality index.': 'Inngår ikke i luftkvalitetsindeksen.',
  'Inputs: {values}': 'Inndata: {values}',
  // ── Weather excuse and small talk (quips/card.ts; the lines are in quips/) ──
  'Weather excuse': 'Værunnskyldning',
  'Another one': 'En til',
  Share: 'Del',
  "Couldn't copy it: select the text to copy it.":
    'Kunne ikke kopiere: merk teksten og kopier den selv.',
  // ── Unit settings (settings.ts) ──
  Units: 'Enheter',
  'Rain and snow': 'Regn og snø',
  Knots: 'Knop',
  Beaufort: 'Beaufort',
  'Automatic follows °C/°F and your region (now: {units}).':
    'Automatisk følger °C/°F og regionen din (nå: {units}).',
  // ── Umbrella in What to wear (weather/wear.ts) ──
  'umbrella (raining until about {time})': 'paraply (regn til rundt kl. {time})',
  'umbrella (rain from about {time})': 'paraply (regn fra rundt kl. {time})',
  'umbrella for later (rain from about {time})': 'paraply til senere (regn fra rundt kl. {time})',
  'no umbrella needed today': 'ingen paraply trengs i dag',
  'Small talk': 'Småprat',
  Copied: 'Kopiert',
  'html:fun-disclaimer':
    'Værunnskyldninger og småprat er for moro skyld. De bygger på værmeldingen for stedet; resultatet kan ikke garanteres. Vi tar ikke ansvar hvis sjefen ikke godtar unnskyldningen, samtalen dør etter én setning, eller katten din er uenig.',
  // ── Add to home screen (settings.ts) ──
  App: 'App',
  'Add to home screen': 'Legg til på startskjermen',
  'Added to the home screen.': 'Lagt til på startskjermen.',
  'Tap the Share button (a square with an arrow), then Add to Home Screen.':
    'Trykk på Del-knappen (en firkant med en pil), og velg Legg til på Hjem-skjerm.',
  'Open the browser menu (⋮), then choose Install.': 'Åpne nettlesermenyen (⋮), og velg Installer.',
  "Open your browser's menu and choose Install app or Add to Home screen.":
    'Åpne nettlesermenyen og velg Installer app eller Legg til på startskjermen.',
  // ── Temperature quiz (quiz/) and electric car range (weather/ev.ts) ──
  '{low}–{high} % less': '{low}–{high} % mindre',
  'Electric car range': 'Elbilens rekkevidde',
  'Typical at {temp}. Less with a heat pump or a car warmed while plugged in; more on short trips.':
    'Typisk ved {temp}. Mindre med varmepumpe eller hvis bilen forvarmes under lading; mer på korte turer.',
  'Estimate from published tests, not your car.': 'Anslag fra publiserte tester, ikke din bil.',
  'Temperature quiz': 'Temperaturquiz',
  'html:sources-elevation':
    '<strong>Høyde over havet:</strong> fra høydemodellen Copernicus DEM (rutenett på 90 m), via Open-Meteo; i bratt terreng kan den avvike med flere titalls meter.',
  'html:sources-ev':
    '<strong>Elbilens rekkevidde i kulde:</strong> typiske tall fra publiserte vintertester og flåtedata (NAFs El Prix-vintertester, AAA, Geotab) etter temperaturen nå; ikke noen bestemt bil.',
};
