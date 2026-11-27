// Swedish texts of the About dialog (index.html), keyed like i18n-sv.ts.
// Kept apart from the start-up language file: they load when About is first
// opened (about.ts), as most visitors never open it.

export const SWEDISH_ABOUT: Record<string, string> = {
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Tryck var som helst på världskartan, sök efter en plats eller använd din position för att se vädret där: nu, de närmaste 24 timmarna och 7 dagarna, med luftkvalitet, UV, regnradar och vädervarningar.',
  'Where the data comes from': 'Varifrån uppgifterna kommer',
  Privacy: 'Integritet',
  'Use at your own risk': 'Användning på egen risk',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Prognoser kan vara fel, och uppgifter kan vara försenade eller saknas. Lita inte enbart på den här appen när säkerheten står på spel, till exempel till sjöss, i fjällen eller vid svårt väder. Följ de officiella varningarna från ditt lands vädertjänst.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Luftkvalitet, pollen och UV är allmän information, inte medicinska råd.',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Chansen för norrsken är en modelluppskattning för ungefär den närmaste timmen, och norrskenet kan ändras på några minuter. Stjärnskådning, gyllene timmen och de andra tiderna för himlen beräknas från solen, månen och molnprognosen och är ungefärliga.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Atmosfärskorrektionen för mätinstrument och luftvärdena (föroreningar, CO₂, metan) är modelluppskattningar, inte mätningar. Använd dem inte där noggrannhet spelar roll utan att mäta på plats.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Appen är gratis och tillhandahålls i befintligt skick, utan garantier. I den mån lagen tillåter tas inget ansvar för förluster till följd av att den används.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Appen har ingen koppling till dataleverantörerna eller instrumenttillverkarna ovan och är inte godkänd av dem.',
  'html:sources-weather':
    '<strong>Väder, UV, snö och hav samt ballongens vindar:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Platssökning och vädersymbolernas städer:</strong> Open-Meteo, ortnamn från <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Namn på platser du trycker på:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMaps</a> bidragsgivare (ODbL)',
  'html:sources-air':
    '<strong>Luftkvalitet, pollen och växthusgaser:</strong> Copernicus Atmosphere Monitoring Service, via Open-Meteo',
  'html:sources-history':
    '<strong>Vädret en tidigare dag:</strong> ERA5 från Copernicus klimattjänst, via <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-aurora':
    '<strong>Norrsken:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-modellen, public domain)',
  'html:sources-edm':
    '<strong>Atmosfärskorrektion (EDM):</strong> beräknas i appen med formeln som Leica Geosystems publicerar i sina manualer för totalstationer (t.ex. TS13:s bruksanvisning, Technical Data → Formulas; synlig röd laser, 658 nm), från prognosens temperatur, lufttryck vid marken och luftfuktighet. 0 ppm = 1013,25 hPa, 12 °C, 60 % luftfuktighet. Andra fabrikat och lasrar använder något annorlunda formler, oftast inom några ppm.',
  'html:sources-elevation':
    '<strong>Höjd över havet:</strong> från höjdmodellen Copernicus DEM (rutnät på 90 m), via Open-Meteo; i brant terräng kan den skilja sig med tiotals meter.',
  'html:sources-fishing':
    '<strong>Fisketider:</strong> beräknas i appen från månens läge (solunarperioder, som i fiskekalendrar): en gammal tradition, inte en prognos för hur fisken nappar.',
  'html:sources-ev':
    '<strong>Elbilens räckvidd i kyla:</strong> typiska värden från publicerade vintertester och fordonsdata (norska NAF:s vintertester El Prix, AAA, Geotab) efter temperaturen nu; inte någon särskild bil.',
  'html:sources-map':
    '<strong>Karta:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMaps</a> bidragsgivare, visad med <a href="https://leafletjs.com/">Leaflet</a>',
  'html:sources-radar':
    '<strong>Regnradar:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> i Nordamerika (Open Government Licence – Canada) och <a href="https://www.rainviewer.com/">RainViewer</a> på andra håll',
  'html:sources-warnings':
    '<strong>Vädervarningar:</strong> Environment and Climate Change Canada, USA:s National Weather Service, MET Norway (CC BY 4.0), SMHI (CC BY 4.0) och Meteorologiska institutet (CC BY 4.0), för Kanada, USA, Norge, Sverige och Finland. Finlands varningar kommer via den här webbplatsens egen server, eftersom webbläsare inte kan läsa Meteorologiska institutets varningsflöde direkt; din plats skickas inte dit (appen kontrollerar själv vilka varningar som gäller platsen)',
  'html:sources-roads':
    '<strong>Väglag i Finland:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), den huvudväg som ligger närmast platsen; hämtas för hela landet, så ingen plats skickas',
  'html:privacy-tracking':
    'Inget konto, inga kakor och ingen spårning. Besök räknas anonymt med Cloudflare Web Analytics, utan kakor eller något som identifierar dig.',
  'html:privacy-saved':
    'Dina favoriter, din startplats (avrundad till ungefär 1 km), dina val av enheter, ljust eller mörkt utseende och färger, språk, inställningarna för regnradarn och vädersymbolerna, vilka avsnitt du har fällt ihop, dina quizresultat (dagens resultat, svit och bästa) och din ballongs namn och bästa flygning sparas bara i den här webbläsaren, på den här enheten. Det gör även din väderresa: poäng, märken och vilka områden (ungefär 50 km), länder och världsdelar du har tittat på. Det gör även vädret för de tre senaste platserna du tittade på (avrundade till ungefär 1 km), så att det kan visas utan anslutning, och i två timmar vädret i städerna som vädersymbolerna visade.',
  'html:privacy-sent':
    'För att visa vädret skickas koordinaterna för den plats du väljer till vädertjänsterna ovan, och för en plats du trycker på även till OpenStreetMaps Nominatim, för dess namn. För Vädret en viss dag skickas även dagen du väljer till Open-Meteo, och den sparas inte. Som för alla webbplatser ser de, liksom karttjänsten och Cloudflare (webbplatsens värdtjänst), din IP-adress.',
  'html:privacy-location':
    'Din position används bara när du trycker på Min position. Den sparas bara om du gör platsen till din startplats, och med dess väder (ovan), avrundad till ungefär 1 km.',
  'html:privacy-address':
    'Sidans adress visar platsen du tittar på (avrundad till ungefär 1 km), så att den kan sparas som bokmärke eller delas. Den stannar i din webbläsare om du inte delar länken.',
  'html:fun-disclaimer':
    'Väderursäkter, småprat och haiku är på skoj. De bygger på prognosen för platsen; resultatet kan inte garanteras. Vi tar inget ansvar om chefen inte godtar ursäkten, samtalet dör efter en mening eller om din katt inte håller med.',
};
