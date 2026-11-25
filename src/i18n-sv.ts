// Swedish texts, keyed by the English text (see i18n.ts). {placeholders}
// stay as they are. A "context|" in front of a key tells apart English
// words that need different translations. scripts/check-i18n.mjs checks
// that every text in the app is here.
//
// Weather words follow SMHI's usage (klart, halvklart, mulet, skurar…), UV
// levels too (låg, måttlig, hög…). FMI is "Meteorologiska institutet", as
// on its own Swedish pages.

export const SWEDISH: Record<string, string> = {
  // ── Page (index.html) ───────────────────────────────────────────────────
  'World map. Click or tap a point to see the weather there. With the keyboard, pan with the arrow keys and press Enter for the weather at the centre.':
    'Världskarta. Klicka eller tryck på en plats för att se vädret där. Med tangentbordet flyttar du kartan med piltangenterna och trycker Enter för vädret i mitten.',
  'Weatherpin – weather anywhere on the world map':
    'Weatherpin – vädret var som helst på världskartan',
  'Search for a place': 'Sök efter en plats',
  'Random place': 'Slumpmässig plats',
  'Edit favourites': 'Redigera favoriter',
  'Weather at my location': 'Vädret där jag är',
  'Rain radar': 'Regnradar',
  'Weather details': 'Väderuppgifter',
  Weather: 'Väder',
  'Start place': 'Startplats',
  Favourite: 'Favorit',
  'Close weather panel': 'Stäng vädervyn',
  'Share this place': 'Dela den här platsen',
  'Share as a picture': 'Dela som bild',
  'Greetings from': 'Hälsningar från',
  'Today {temps}': 'I dag {temps}',
  'Today {temps} · rain {percent}': 'I dag {temps} · regn {percent}',
  Tomorrow: 'I morgon',
  'Picture saved': 'Bilden sparad',
  "Couldn't make the picture": 'Det gick inte att göra bilden',
  'Start here': 'Starta här',
  'The app will open here.': 'Appen öppnas här från och med nu.',
  'The app will open at the world map.': 'Appen öppnas vid världskartan från och med nu.',
  'More actions': 'Fler åtgärder',
  'Weather data by Open-Meteo.com': 'Väderdata från Open-Meteo.com',
  'About Weatherpin': 'Om Weatherpin',
  Close: 'Stäng',
  Settings: 'Inställningar',
  Temperature: 'Temperatur',
  Appearance: 'Utseende',
  Automatic: 'Automatiskt',
  Light: 'Ljust',
  Dark: 'Mörkt',
  "Automatic follows your device's setting.": 'Automatiskt följer enhetens inställning.',
  'Remove start place': 'Ta bort startplatsen',
  'The app opens at {place}.': 'Appen öppnas vid {place}.',
  'The app opens at the world map. To change it, open a place and choose Start here in its ⋯ menu.':
    'Appen öppnas vid världskartan. Du ändrar det genom att öppna en plats och välja Starta här i dess ⋯-meny.',
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Tryck var som helst på världskartan, sök efter en plats eller använd din position för att se vädret där: nu, de närmaste 24 timmarna och 7 dagarna, med luftkvalitet, UV, regnradar och vädervarningar.',
  'Where the data comes from': 'Varifrån uppgifterna kommer',
  Privacy: 'Integritet',
  // The sauna easter egg (sauna.ts).
  Sauna: 'Bastu',
  'Saunalahti, Finland': 'Saunalahti, Finland',
  'Löyly incoming': 'Bastuångan kommer',
  'Humidity rising': 'Fuktigheten stiger',
  'Wind: none (close the door!)': 'Vind: ingen (stäng dörren!)',
  'After the sauna: the sea is right there': 'Efter bastun: havet ligger alldeles intill',
  'After the sauna: the sea is {temperature}': 'Efter bastun: havet är {temperature}',
  // The Santa easter egg (santa.ts).
  "Santa's workshop": 'Tomtens verkstad',
  "Santa's workshop, Rovaniemi": 'Tomtens verkstad, Rovaniemi',
  'Rovaniemi, Finland': 'Rovaniemi, Finland',
  'Sleigh flying conditions: excellent': 'Flygväder för släden: utmärkt',
  'Sleigh flying conditions: bumpy, hold on to the presents':
    'Flygväder för släden: skumpigt, håll i paketen',
  'Sleigh flying conditions: stormy, reindeer on standby':
    'Flygväder för släden: stormigt, renarna står i beredskap',
  'Reindeer visibility: good': 'Sikt för renarna: god',
  'Reindeer visibility: snowy': 'Sikt för renarna: snöigt',
  'Reindeer visibility: foggy, follow the bright red nose':
    'Sikt för renarna: dimmigt, följ den lysande röda nosen',
  'The elves are resting: merry Christmas!': 'Tomtenissarna vilar: god jul!',
  'Elves: busy, {count} day to Christmas Eve': 'Tomtenissarna: upptagna, {count} dag till julafton',
  'Elves: busy, {count} days to Christmas Eve':
    'Tomtenissarna: upptagna, {count} dagar till julafton',
  'Use at your own risk': 'Användning på egen risk',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Prognoser kan vara fel, och uppgifter kan vara försenade eller saknas. Lita inte enbart på den här appen när säkerheten står på spel, till exempel till sjöss, i fjällen eller vid svårt väder. Följ de officiella varningarna från ditt lands vädertjänst.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Luftkvalitet, pollen och UV är allmän information, inte medicinska råd.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Appen är gratis och tillhandahålls i befintligt skick, utan garantier. I den mån lagen tillåter tas inget ansvar för förluster till följd av att den används.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Appen har ingen koppling till dataleverantörerna eller instrumenttillverkarna ovan och är inte godkänd av dem.',
  Language: 'Språk',
  'Clear saved data': 'Radera sparade uppgifter',
  Done: 'Klar',
  'Tap a name to rename the place. ↑ and ↓ change the order.':
    'Tryck på ett namn för att byta namn på platsen. ↑ och ↓ ändrar ordningen.',
  'No favourites. Tap ☆ in the weather panel to save a place.':
    'Inga favoriter. Tryck på ☆ i vädervyn för att spara en plats.',
  Undo: 'Ångra',

  'html:sources-weather':
    '<strong>Väder, UV, snö och hav:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Platssökning:</strong> Open-Meteo, ortnamn från <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Namn på platser du trycker på:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMaps</a> bidragsgivare (ODbL)',
  'html:sources-air':
    '<strong>Luftkvalitet, pollen och växthusgaser:</strong> Copernicus Atmosphere Monitoring Service, via Open-Meteo',
  'html:sources-history':
    '<strong>Vädret en tidigare dag:</strong> ERA5 från Copernicus klimattjänst, via <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-map':
    '<strong>Karta:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMaps</a> bidragsgivare, visad med <a href="https://leafletjs.com/">Leaflet</a>',
  'html:sources-radar':
    '<strong>Regnradar:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> i Nordamerika (Open Government Licence – Canada) och <a href="https://www.rainviewer.com/">RainViewer</a> på andra håll',
  'html:sources-warnings':
    '<strong>Vädervarningar:</strong> Environment and Climate Change Canada, USA:s National Weather Service, MET Norway (CC BY 4.0), SMHI (CC BY 4.0) och Meteorologiska institutet (CC BY 4.0), för Kanada, USA, Norge, Sverige och Finland. Finlands varningar kommer via den här webbplatsens egen server, eftersom webbläsare inte kan läsa Meteorologiska institutets varningsflöde direkt; din plats skickas inte dit (appen kontrollerar själv vilka varningar som gäller platsen)',
  'html:privacy-tracking':
    'Inget konto, inga kakor och ingen spårning. Besök räknas anonymt med Cloudflare Web Analytics, utan kakor eller något som identifierar dig.',
  'html:privacy-saved':
    'Dina favoriter, din startplats (avrundad till ungefär 1 km), dina val av enheter, ljust eller mörkt utseende, språk, regnradarns inställning, vilka avsnitt du har fällt ihop och dina quizresultat (dagens resultat, svit och bästa) sparas bara i den här webbläsaren, på den här enheten. Det gör även vädret för de tre senaste platserna du tittade på (avrundade till ungefär 1 km), så att det kan visas utan anslutning.',
  'html:privacy-sent':
    'För att visa vädret skickas koordinaterna för den plats du väljer till vädertjänsterna ovan, och för en plats du trycker på även till OpenStreetMaps Nominatim, för dess namn. För Vädret en viss dag skickas även dagen du väljer till Open-Meteo, och den sparas inte. Som för alla webbplatser ser de, liksom karttjänsten och Cloudflare (webbplatsens värdtjänst), din IP-adress.',
  'html:privacy-location':
    'Din position används bara när du trycker på Min position. Den sparas bara om du gör platsen till din startplats, och med dess väder (ovan), avrundad till ungefär 1 km.',
  'html:privacy-address':
    'Sidans adress visar platsen du tittar på (avrundad till ungefär 1 km), så att den kan sparas som bokmärke eller delas. Den stannar i din webbläsare om du inte delar länken.',

  // ── Map, search, location ───────────────────────────────────────────────
  About: 'Om',
  'Zoom in': 'Zooma in',
  'Zoom out': 'Zooma ut',
  Favourites: 'Favoriter',
  Places: 'Platser',
  'No places found.': 'Inga platser hittades.',
  'Something went wrong searching.': 'Något gick fel vid sökningen.',
  '{count} place found. Use the arrow keys to choose.':
    '{count} plats hittades. Välj med piltangenterna.',
  '{count} places found. Use the arrow keys to choose.':
    '{count} platser hittades. Välj med piltangenterna.',
  '{count} favourite. Use the arrow keys to choose.': '{count} favorit. Välj med piltangenterna.',
  '{count} favourites. Use the arrow keys to choose.':
    '{count} favoriter. Välj med piltangenterna.',
  'Could not reach the place search. Check your connection.':
    'Platssökningen gick inte att nå. Kontrollera din anslutning.',
  'Finding your location…': 'Söker din position…',
  'Your location could not be determined.': 'Din position kunde inte fastställas.',
  'Your location could not be determined right now.':
    'Din position kunde inte fastställas just nu.',
  "Location access is blocked. Allow it in your browser's site settings and try again.":
    'Åtkomst till positionen är blockerad. Tillåt den i webbläsarens webbplatsinställningar och försök igen.',
  'Finding your location took too long. Please try again.':
    'Det tog för lång tid att hitta din position. Försök igen.',
  'Your location is only available over a secure (https) connection.':
    'Din position är bara tillgänglig via en säker (https) anslutning.',
  'This browser cannot share your location.': 'Den här webbläsaren kan inte dela din position.',
  'Hide rain radar': 'Dölj regnradarn',
  'Show rain radar': 'Visa regnradarn',
  'Snow radar': 'Snöradar',
  Radar: 'Radar',
  'Rain radar is unavailable right now. Try again later.':
    'Regnradarn är inte tillgänglig just nu. Försök igen senare.',

  // ── Weather panel ───────────────────────────────────────────────────────
  'Loading…': 'Laddar…',
  'Loading weather…': 'Laddar vädret…',
  'Weather unavailable': 'Vädret är inte tillgängligt',
  'Try again': 'Försök igen',
  'Something went wrong loading the weather.': 'Något gick fel när vädret laddades.',
  'Could not reach the weather service. Check your connection.':
    'Vädertjänsten gick inte att nå. Kontrollera din anslutning.',
  'The weather service returned unexpected data.': 'Vädertjänsten svarade med oväntade uppgifter.',
  'Remove from favourites': 'Ta bort från favoriter',
  'Save as favourite': 'Spara som favorit',
  'Removed from favourites.': 'Borttagen från favoriter.',
  'Saved to favourites.': 'Sparad som favorit.',
  'You have {count} favourites. Remove one to save another.':
    'Du har {count} favoriter. Ta bort en för att spara en ny.',
  'Could not save: this browser is blocking storage.':
    'Kunde inte spara: webbläsaren blockerar lagring.',
  'Link copied': 'Länken kopierad',
  'Weather in {place}': 'Vädret i {place}',
  'Weather here': 'Vädret här',
  'The app opens here. Press to open at the world map instead.':
    'Appen öppnas här. Tryck för att öppna vid världskartan i stället.',
  'Open the app at this place next time': 'Öppna appen vid den här platsen nästa gång',

  // Now
  'Current weather': 'Vädret nu',
  'Feels like {temp}': 'Känns som {temp}',
  'Updated {time}': 'Uppdaterad {time}',
  'No connection · weather from {time}': 'Ingen anslutning · vädret från {time}',
  'Rain starting around {time}': 'Regn börjar omkring kl. {time}',
  'Rain stopping around {time}': 'Regnet upphör omkring kl. {time}',
  'Snow starting around {time}': 'Snöfall börjar omkring kl. {time}',
  'Snow stopping around {time}': 'Snöfallet upphör omkring kl. {time}',
  // What to wear (weather/wear.ts)
  'What to wear:': 'Vad ska man ha på sig:',
  'Winter gear: hat and mittens': 'Vinterkläder: mössa och vantar',
  'Warm coat': 'Varm jacka',
  Jacket: 'Jacka',
  'Light jacket or sweater': 'Tunn jacka eller tröja',
  'T-shirt': 'T-shirt',
  'Shorts weather': 'Shortsväder',
  'waterproof boots': 'vattentäta skor',
  'a hood (too windy for an umbrella)': 'luva (för blåsigt för paraply)',
  umbrella: 'paraply',
  'something windproof': 'något vindtätt',
  'sunglasses and sunscreen': 'solglasögon och solkräm',
  Wind: 'Vind',
  'gusts {speed}': 'byar {speed}',
  Precipitation: 'Nederbörd',
  '{amount} snow': '{amount} snö',
  'UV index': 'UV-index',
  "today's max {value} {level} around {time}": 'i dag högst {value} {level} omkring kl. {time}',
  'around {time}': 'omkring kl. {time}',
  'Sun protection {hours}': 'Solskydd {hours}',
  'Air quality': 'Luftkvalitet',

  // Hours and days
  'Next 24 hours': 'Närmaste 24 timmarna',
  Now: 'Nu',
  'Chance of precipitation': 'Sannolikhet för nederbörd',
  '7 days': '7 dagar',
  Today: 'I dag',
  'temperature|Low': 'Lägsta',
  'temperature|high': 'högsta',
  Snow: 'Snö',
  'UV index {value}, {level}': 'UV-index {value}, {level}',
  'Hours on {day}': 'Timmar: {day}',
  'No hourly forecast for this day.': 'Ingen timprognos för den här dagen.',
  'Temperature from {low} to {high}, warmest around {time}.':
    'Temperatur från {low} till {high}, varmast omkring kl. {time}.',
  'Precipitation {amount} in total, most around {time}.':
    'Nederbörd {amount} totalt, mest omkring kl. {time}.',
  'No precipitation.': 'Ingen nederbörd.',

  // Sea
  Sea: 'Hav',
  Waves: 'Vågor',
  'every {seconds} s': 'period {seconds} s',
  Swell: 'Dyning',
  'Highest in 24 h': 'Högst inom 24 h',
  '{height} around {time}': '{height} omkring kl. {time}',
  'Sea temperature': 'Havstemperatur',

  // Air quality and pollen
  'Loading air quality…': 'Laddar luftkvaliteten…',
  'Air quality is unavailable right now.': 'Luftkvaliteten är inte tillgänglig just nu.',
  'No air quality index for this place.': 'Inget luftkvalitetsindex för den här platsen.',
  'European AQI': 'Europeiskt luftkvalitetsindex',
  'US AQI': 'Amerikanskt luftkvalitetsindex',
  'aqi|Good': 'Bra',
  'aqi|Fair': 'Godtagbar',
  'aqi|Moderate': 'Måttlig',
  'aqi|Poor': 'Dålig',
  'aqi|Very poor': 'Mycket dålig',
  'aqi|Extremely poor': 'Extremt dålig',
  'usaqi|Good': 'Bra',
  'usaqi|Moderate': 'Måttlig',
  'usaqi|Unhealthy for sensitive groups': 'Ohälsosam för känsliga grupper',
  'usaqi|Unhealthy': 'Ohälsosam',
  'usaqi|Very unhealthy': 'Mycket ohälsosam',
  'usaqi|Hazardous': 'Farlig',
  'UK DAQI': 'Storbritanniens DAQI',
  'Canada AQHI': 'Kanadas AQHI',
  'daqi|Low': 'Låg',
  'daqi|Moderate': 'Måttlig',
  'daqi|High': 'Hög',
  'daqi|Very high': 'Mycket hög',
  'aqhi|Low risk': 'Låg risk',
  'aqhi|Moderate risk': 'Måttlig risk',
  'aqhi|High risk': 'Hög risk',
  'aqhi|Very high risk': 'Mycket hög risk',
  'Worked out from forecast data; official readings can differ a little.':
    'Beräknat från prognosdata; officiella värden kan skilja sig något.',
  'Ozone (O₃)': 'Ozon (O₃)',
  'Nitrogen dioxide (NO₂)': 'Kvävedioxid (NO₂)',
  'Next days': 'Kommande dagar',
  'worst around {time}': 'sämst omkring kl. {time}',
  '{name} pollen': '{name} (pollen)',
  'Pollen forecast': 'Pollenprognos',
  None: 'Inget pollen',
  Birch: 'Björk',
  Alder: 'Al',
  Grass: 'Gräs',
  Mugwort: 'Gråbo',
  Ragweed: 'Ambrosia',
  Olive: 'Olivträd',
  'pollen|Low': 'Låga halter',
  'pollen|Moderate': 'Måttliga halter',
  'pollen|High': 'Höga halter',

  // UV levels
  Low: 'Låg',
  Moderate: 'Måttlig',
  High: 'Hög',
  'Very high': 'Mycket hög',
  Extreme: 'Extrem',

  // More details
  'More details': 'Mer information',
  Humidity: 'Luftfuktighet',
  Pressure: 'Lufttryck',
  rising: 'stigande',
  falling: 'fallande',
  steady: 'oförändrat',
  Sunrise: 'Soluppgång',
  Sunset: 'Solnedgång',
  'No sunrise today': 'Solen går inte upp i dag',
  'No sunset today': 'Solen går inte ned i dag',
  Sun: 'Sol',
  'Polar night – the sun does not rise today': 'Polarnatt – solen går inte upp i dag',
  'Midnight sun – the sun does not set today': 'Midnattssol – solen går inte ned i dag',
  Daylight: 'Dagslängd',
  '{minutes} min longer tomorrow': '{minutes} min längre i morgon',
  '{minutes} min shorter tomorrow': '{minutes} min kortare i morgon',
  'about the same tomorrow': 'ungefär lika lång i morgon',
  Moon: 'Månen',
  '{percent} lit': '{percent} belyst',
  'New moon': 'Nymåne',
  'Waxing crescent': 'Tilltagande skära',
  'First quarter': 'Första kvarteret',
  'Waxing gibbous': 'Tilltagande måne',
  'Full moon': 'Fullmåne',
  'Waning gibbous': 'Avtagande måne',
  'Last quarter': 'Sista kvarteret',
  'Waning crescent': 'Avtagande skära',
  'Local time': 'Lokal tid',
  Coordinates: 'Koordinater',
  Elevation: 'Höjd över havet',

  // Warnings
  'Weather warnings': 'Vädervarningar',
  'Checking…': 'Kontrollerar…',
  'until {time}': 'till {time}',
  'Sea area: {area}': 'Havsområde: {area}',
  'Issued by': 'Utfärdad av',
  'Not available for this area': 'Inte tillgängligt för det här området',
  "Couldn't be checked right now": 'Kunde inte kontrolleras just nu',
  'None in effect': 'Inga gällande',
  '{count} in effect (see top)': '{count} gällande (se överst)',

  // Weather (WMO codes)
  'Clear sky': 'Klart',
  'Mainly clear': 'Mestadels klart',
  'Partly cloudy': 'Halvklart',
  Overcast: 'Mulet',
  Fog: 'Dimma',
  'Depositing rime fog': 'Dimma med rimfrost',
  'Light drizzle': 'Lätt duggregn',
  'Moderate drizzle': 'Måttligt duggregn',
  'Dense drizzle': 'Tätt duggregn',
  'Light freezing drizzle': 'Lätt underkylt duggregn',
  'Dense freezing drizzle': 'Tätt underkylt duggregn',
  'Slight rain': 'Lätt regn',
  'Moderate rain': 'Måttligt regn',
  'Heavy rain': 'Kraftigt regn',
  'Light freezing rain': 'Lätt underkylt regn',
  'Heavy freezing rain': 'Kraftigt underkylt regn',
  'Slight snowfall': 'Lätt snöfall',
  'Moderate snowfall': 'Måttligt snöfall',
  'Heavy snowfall': 'Kraftigt snöfall',
  'Snow grains': 'Kornsnö',
  'Slight rain showers': 'Lätta regnskurar',
  'Moderate rain showers': 'Måttliga regnskurar',
  'Violent rain showers': 'Mycket kraftiga regnskurar',
  'Slight snow showers': 'Lätta snöbyar',
  'Heavy snow showers': 'Kraftiga snöbyar',
  Thunderstorm: 'Åska',
  'Thunderstorm with slight hail': 'Åska med lätt hagel',
  'Heavy thunderstorm': 'Kraftig åska',
  'Thunderstorm with heavy hail': 'Åska med kraftigt hagel',
  'Unknown conditions': 'Okänt väder',

  // Favourites editor
  'Name for {place}': 'Namn på {place}',
  'Move {place} up': 'Flytta upp {place}',
  'Move {place} down': 'Flytta ned {place}',
  'Remove {place}': 'Ta bort {place}',
  'Removed {place}.': '{place} borttagen.',
  '{place} is back.': '{place} är tillbaka.',
  "Couldn't put it back: this browser is blocking storage, or the list is full.":
    'Kunde inte lägga tillbaka den: webbläsaren blockerar lagring, eller så är listan full.',

  // Settings
  'Remove your favourites, start place and settings from this device?':
    'Ta bort dina favoriter, din startplats och dina inställningar från den här enheten?',
  "This browser didn't let the app remove them.": 'Webbläsaren lät inte appen ta bort dem.',
  "This browser didn't let the app save it.": 'Webbläsaren lät inte appen spara valet.',
  'Frost on car windscreens this morning': 'Frost på bilrutorna i morse',
  'Scrape the windscreen tomorrow morning': 'Skrapa vindrutan i morgon bitti',
  'Frost tonight ({temp}): bring the balcony plants in':
    'Frost i natt ({temp}): ta in balkongväxterna',
  'Weather record': 'Väderrekord',
  'Vostok: coldest ever measured on Earth, {value} (1983)':
    'Vostok: kallaste som uppmätts på jorden, {value} (1983)',
  'Death Valley: hottest ever measured on Earth, {value} (1913)':
    'Death Valley: varmaste som uppmätts på jorden, {value} (1913)',
  'Greenland: coldest in the Northern Hemisphere, {value} (1991)':
    'Grönland: kallaste på norra halvklotet, {value} (1991)',
  'Oymyakon: one of the coldest villages, {value} (1933)':
    'Ojmjakon: en av de kallaste byarna, {value} (1933)',
  'Barrow Island: strongest gust ever measured, {value} (1996)':
    'Barrow Island: kraftigaste vindby som uppmätts, {value} (1996)',
  'Mawsynram: wettest place on Earth, about {value} a year':
    'Mawsynram: jordens regnigaste plats, cirka {value} om året',
  'Atacama Desert: some stations here have never had rain':
    'Atacamaöknen: vissa stationer här har aldrig fått regn',
  'Pokka: coldest in Finland, {value} (1999)': 'Pokka: kallaste i Finland, {value} (1999)',
  'Liperi: hottest in Finland, {value} (2010)': 'Liperi: varmaste i Finland, {value} (2010)',
  'Vuoggatjålme: coldest in Sweden, {value} (1966)':
    'Vuoggatjålme: kallaste i Sverige, {value} (1966)',
  'Karasjok: coldest in Norway, {value} (1886)': 'Karasjok: kallaste i Norge, {value} (1886)',
  'freezing rain': 'underkylt regn',
  'html:sources-roads':
    '<strong>Väglag i Finland:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), den huvudväg som ligger närmast platsen; hämtas för hela landet, så ingen plats skickas',
  'very slippery': 'mycket halt',
  slippery: 'halt',
  icy: 'isigt',
  'partly icy': 'delvis isigt',
  slush: 'snömodd',
  'snow on the road': 'snö på vägen',
  'frost on the road': 'rimfrost på vägen',
  'heavy snowfall': 'kraftigt snöfall',
  snowfall: 'snöfall',
  'strong wind': 'hård vind',
  'wet road': 'våt väg',
  'Very poor road conditions': 'Mycket dåligt väglag',
  'Poor road conditions': 'Dåligt väglag',
  'Road weather:': 'Vägväder:',
  'No official warnings in effect ·': 'Inga officiella varningar gäller ·',
  "Official warnings couldn't be checked:": 'Officiella varningar kunde inte kontrolleras:',
  'WMO severe weather': 'WMO:s tjänst för farligt väder',
  "This app doesn't show warnings for this region. Official warnings:":
    'Appen visar inte varningar för det här området. Officiella varningar:',
  'from {start} until {time}': '{start} – {time}',
  'from {start}': 'från {start}',
  'Finnish Meteorological Institute': 'Meteorologiska institutet',
  'Play radar history': 'Spela upp radarhistorik',
  'Pause radar history': 'Pausa radarhistorik',
  'Radar time': 'Radarbildens tid',
  '{time} · latest': '{time} · senaste',
  '{time} · {minutes} min ago': '{time} · för {minutes} min sedan',
  'loading {loaded}/{total}': 'laddar {loaded}/{total}',
  // ── Weather on a day (past-weather.ts) ──
  'Weather on a day…': 'Vädret en viss dag…',
  'Weather on a day': 'Vädret en viss dag',
  'This day in the past': 'Den här dagen tidigare år',
  '1 year ago': 'För 1 år sedan',
  '10 years ago': 'För 10 år sedan',
  '50 years ago': 'För 50 år sedan',
  'Any day': 'Valfri dag',
  Show: 'Visa',
  'From 1 January 1940 to about a week ago.':
    'Från 1 januari 1940 till för ungefär en vecka sedan.',
  'Estimated from weather records (ERA5, about 25 km grid): a thermometer there may have shown a few degrees different. Historical weather: Open-Meteo.com, ERA5 by Copernicus.':
    'Uppskattat från väderdata (ERA5, rutnät på cirka 25 km): en termometer på platsen kan ha visat några grader annorlunda. Historiskt väder: Open-Meteo.com, ERA5 från Copernicus.',
  'Pick a day between 1 January 1940 and a week ago.':
    'Välj en dag mellan 1 januari 1940 och för en vecka sedan.',
  "Couldn't get the weather for that day. Try again.":
    'Det gick inte att hämta vädret för den dagen. Försök igen.',
  'No weather records for that day yet.': 'Inga väderdata för den dagen ännu.',
  'high {temperature}': 'högst {temperature}',
  'low {temperature}': 'lägst {temperature}',
  'wind up to {speed}': 'vind upp till {speed}',
  '{hours} h of sunshine': '{hours} h sol',
  'Snow {amount}': 'Snö {amount}',
  'Rain {amount}': 'Nederbörd {amount}',
  'No rain or snow': 'Ingen nederbörd',
  '{degrees}° warmer': '{degrees}° varmare',
  '{degrees}° colder': '{degrees}° kallare',
  'the same high': 'samma högsta temperatur',
  'Today: {high} / {low}, {difference}': 'I dag: {high} / {low}, {difference}',
  "Couldn't open it. Check your connection.": 'Det gick inte att öppna. Kontrollera anslutningen.',
  'Greetings from {year}': 'Hälsningar från {year}',
  'Weather in {place} on {date}': 'Vädret i {place} {date}',
  // ── Sky section (render/sky.ts) ──
  Sky: 'Himlen',
  'Until midwinter': 'Till midvintern',
  'Since midwinter': 'Sedan midvintern',
  '{duration} less daylight by {date}': '{duration} mindre dagsljus till {date}',
  '+{duration} of daylight since {date}': '+{duration} dagsljus sedan {date}',
  'Golden hour': 'Gyllene timmen',
  'All day (the sun stays low)': 'Hela dagen (solen står lågt)',
  'Blue hour': 'Blå timmen',
  'dark sky': 'mörk himmel',
  'some moonlight': 'lite månsken',
  'bright moon': 'ljus måne',
  Stargazing: 'Stjärnskådning',
  'Good {from}–{to}: clear sky, {moonlight}': 'Bra {from}–{to}: klar himmel, {moonlight}',
  'Almost none (the sun is high)': 'Nästan ingen (solen står högt)',
  'Very long (the sun is low)': 'Mycket lång (solen står lågt)',
  '{ratio}× your height': '{ratio} × din längd',
  'Your shadow': 'Din skugga',
  'Chance {percent} now': 'Chans {percent} nu',
  'low in the north': 'lågt i norr',
  'low in the south': 'lågt i söder',
  'Northern lights': 'Norrsken',
  'Southern lights': 'Sydsken',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Chansen för norrsken är en modelluppskattning för ungefär den närmaste timmen, och norrskenet kan ändras på några minuter. Stjärnskådning, gyllene timmen och de andra tiderna för himlen beräknas från solen, månen och molnprognosen och är ungefärliga.',
  'html:sources-aurora':
    '<strong>Norrsken:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-modellen, public domain)',
  // ── Beer outside (render/sky.ts, weather/beer.ts) ──
  'Beer outside': 'Öl utomhus',
  'Gets warm in about {time}': 'Blir varm på ungefär {time}',
  'Starts to freeze in about {time}': 'Börjar frysa på ungefär {time}',
  'Stays cold out here': 'Håller sig kall här ute',
  'beer|sunny': 'soligt',
  'beer|breezy': 'blåsigt',
  'beer|windy': 'hård vind',
  // ── Atmospheric correction for surveying instruments (weather/edm.ts) ──
  'Atmospheric correction (EDM)': 'Atmosfärskorrektion (EDM)',
  '{pressure} at ground level': '{pressure} vid marken',
  'Estimate only, not a measurement.': 'Endast en uppskattning, ingen mätning.',
  'Worked out from the weather forecast for this area, which can differ from the conditions at your instrument by several ppm. For survey work, measure temperature and pressure on site.':
    'Beräknad från väderprognosen för området, som kan skilja sig från förhållandena vid ditt instrument med flera ppm. Vid mätningsarbete: mät temperatur och lufttryck på plats.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Atmosfärskorrektionen för mätinstrument och luftvärdena (föroreningar, CO₂, metan) är modelluppskattningar, inte mätningar. Använd dem inte där noggrannhet spelar roll utan att mäta på plats.',
  'html:sources-edm':
    '<strong>Atmosfärskorrektion (EDM):</strong> beräknas i appen med formeln som Leica Geosystems publicerar i sina manualer för totalstationer (t.ex. TS13:s bruksanvisning, Technical Data → Formulas; synlig röd laser, 658 nm), från prognosens temperatur, lufttryck vid marken och luftfuktighet. 0 ppm = 1013,25 hPa, 12 °C, 60 % luftfuktighet. Andra fabrikat och lasrar använder något annorlunda formler, oftast inom några ppm.',
  // ── More air values (render/air-quality.ts) ──
  'Sulphur dioxide (SO₂)': 'Svaveldioxid (SO₂)',
  'Carbon monoxide (CO)': 'Kolmonoxid (CO)',
  'Desert dust': 'Ökendamm',
  'Greenhouse gases': 'Växthusgaser',
  'Carbon dioxide (CO₂)': 'Koldioxid (CO₂)',
  'Methane (CH₄)': 'Metan (CH₄)',
  'Everything in this section comes from the CAMS forecast model, not from measuring stations.':
    'Allt i det här avsnittet kommer från prognosmodellen CAMS, inte från mätstationer.',
  'Values are averages for an area about 11 km across in Europe (40 km elsewhere); stations nearby can show different values.':
    'Värdena är medelvärden för ett område på ungefär 11 km i Europa (40 km på andra håll); mätstationer i närheten kan visa andra värden.',
  'Not part of the air quality index.': 'Ingår inte i luftkvalitetsindexet.',
  'Inputs: {values}': 'Indata: {values}',
  // ── Weather excuse and small talk (quips/card.ts; the lines are in quips/) ──
  'Weather excuse': 'Väderursäkt',
  'Another one': 'En till',
  Share: 'Dela',
  "Couldn't copy it: select the text to copy it.":
    'Det gick inte att kopiera: markera texten och kopiera den själv.',
  // ── Unit settings (settings.ts) ──
  Units: 'Enheter',
  'Rain and snow': 'Regn och snö',
  Knots: 'Knop',
  Beaufort: 'Beaufort',
  'Automatic follows °C/°F and your region (now: {units}).':
    'Automatiskt följer °C/°F och din region (nu: {units}).',
  // ── Umbrella in What to wear (weather/wear.ts) ──
  'umbrella (raining until about {time})': 'paraply (regn till omkring kl. {time})',
  'umbrella (rain from about {time})': 'paraply (regn från omkring kl. {time})',
  'umbrella for later (rain from about {time})':
    'paraply till senare (regn från omkring kl. {time})',
  'no umbrella needed today': 'inget paraply behövs i dag',
  'Small talk': 'Småprat',
  Copied: 'Kopierat',
  'html:fun-disclaimer':
    'Väderursäkter och småprat är på skoj. De bygger på prognosen för platsen; resultatet kan inte garanteras. Vi tar inget ansvar om chefen inte godtar ursäkten, samtalet dör efter en mening eller om din katt inte håller med.',
  // ── Add to home screen (settings.ts) ──
  App: 'App',
  'Add to home screen': 'Lägg till på hemskärmen',
  'Added to the home screen.': 'Tillagd på hemskärmen.',
  'Tap the Share button (a square with an arrow), then Add to Home Screen.':
    'Tryck på Dela-knappen (en fyrkant med en pil) och välj Lägg till på hemskärmen.',
  'Open the browser menu (⋮), then choose Install.':
    'Öppna webbläsarens meny (⋮) och välj Installera.',
  "Open your browser's menu and choose Install app or Add to Home screen.":
    'Öppna webbläsarens meny och välj Installera app eller Lägg till på hemskärmen.',
  // ── Temperature quiz (quiz/) and electric car range (weather/ev.ts) ──
  '{low}–{high} % less': '{low}–{high} % mindre',
  'Electric car range': 'Elbilens räckvidd',
  'Typical at {temp}. Less with a heat pump or a car warmed while plugged in; more on short trips.':
    'Typiskt vid {temp}. Mindre med värmepump eller om bilen förvärms under laddning; mer på korta resor.',
  'Estimate from published tests, not your car.':
    'Uppskattning från publicerade tester, inte din bil.',
  'Temperature quiz': 'Temperaturquiz',
  'html:sources-elevation':
    '<strong>Höjd över havet:</strong> från höjdmodellen Copernicus DEM (rutnät på 90 m), via Open-Meteo; i brant terräng kan den skilja sig med tiotals meter.',
  'html:sources-ev':
    '<strong>Elbilens räckvidd i kyla:</strong> typiska värden från publicerade vintertester och fordonsdata (norska NAF:s vintertester El Prix, AAA, Geotab) efter temperaturen nu; inte någon särskild bil.',
};
