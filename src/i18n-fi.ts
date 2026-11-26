// Finnish texts, keyed by the English text (see i18n.ts). {placeholders}
// stay as they are. A "context|" in front of a key tells apart English
// words that need different Finnish ones. scripts/check-i18n.mjs checks that
// every text in the app is here.
//
// Level words follow Finnish usage: air quality as the Finnish air quality
// services word it (hyvä, tyydyttävä, välttävä…), UV as the Radiation and
// Nuclear Safety Authority does (heikko, kohtalainen, voimakas…), pollen as
// the pollen forecasts do (vähäinen, kohtalainen, runsas).

export const FINNISH: Record<string, string> = {
  // ── Page (index.html) ───────────────────────────────────────────────────
  'World map. Click or tap a point to see the weather there. With the keyboard, pan with the arrow keys and press Enter for the weather at the centre.':
    'Maailmankartta. Napsauta tai napauta kohtaa nähdäksesi sen sään. Näppäimistöllä siirrä karttaa nuolinäppäimillä ja paina Enter nähdäksesi keskikohdan sään.',
  'Weatherpin – weather anywhere on the world map':
    'Weatherpin – sää missä tahansa maailmankartalla',
  'Search for a place': 'Hae paikkaa',
  'Random place': 'Satunnainen paikka',
  'Edit favourites': 'Muokkaa suosikkeja',
  'Weather at my location': 'Sää sijainnissani',
  'Rain radar': 'Sadetutka',
  'Weather details': 'Säätiedot',
  Weather: 'Sää',
  'Start place': 'Aloituspaikka',
  Favourite: 'Suosikki',
  'Close weather panel': 'Sulje säänäkymä',
  'Share this place': 'Jaa tämä paikka',
  'Share as a picture': 'Jaa kuvana',
  'Greetings from': 'Terveisiä täältä:',
  'Today {temps}': 'Tänään {temps}',
  'Today {temps} · rain {percent}': 'Tänään {temps} · sade {percent}',
  Tomorrow: 'Huomenna',
  'Picture saved': 'Kuva tallennettu',
  "Couldn't make the picture": 'Kuvan tekeminen ei onnistunut',
  'Start here': 'Aloita tästä',
  'The app will open here.': 'Sovellus avautuu jatkossa tähän paikkaan.',
  'The app will open at the world map.': 'Sovellus avautuu jatkossa maailmankarttaan.',
  'More actions': 'Lisää toimintoja',
  'Weather data by Open-Meteo.com': 'Säätiedot: Open-Meteo.com',
  'About Weatherpin': 'Tietoa Weatherpinistä',
  Close: 'Sulje',
  Settings: 'Asetukset',
  Temperature: 'Lämpötila',
  Appearance: 'Ulkoasu',
  Colours: 'Värit',
  Classic: 'Klassinen',
  'Nordic night': 'Pohjolan yö',
  Retro: 'Retro',
  'High contrast': 'Suuri kontrasti',
  'Each in light and dark.': 'Jokainen vaaleana ja tummana.',
  'More units': 'Lisää yksiköitä',
  Automatic: 'Automaattinen',
  Light: 'Vaalea',
  Dark: 'Tumma',
  "Automatic follows your device's setting.": 'Automaattinen seuraa laitteesi asetusta.',
  'Remove start place': 'Poista aloituspaikka',
  'The app opens at {place}.': 'Sovellus avautuu tähän paikkaan: {place}.',
  'The app opens at the world map. To change it, open a place and choose Start here in its ⋯ menu.':
    'Sovellus avautuu maailmankarttaan. Voit vaihtaa sen avaamalla paikan ja valitsemalla sen ⋯-valikosta Aloita tästä.',
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Napauta mitä tahansa kohtaa maailmankartalla, hae paikkaa tai käytä omaa sijaintiasi nähdäksesi sen sään: nyt, seuraavat 24 tuntia ja 7 päivää, sekä ilmanlaatu, UV, sadetutka ja säävaroitukset.',
  'Where the data comes from': 'Mistä tiedot tulevat',
  Privacy: 'Tietosuoja',
  // The sauna easter egg (sauna.ts).
  Sauna: 'Sauna',
  'Saunalahti, Finland': 'Saunalahti, Suomi',
  'Löyly incoming': 'Löylyä tulossa',
  'Humidity rising': 'Kosteus nousee',
  'Wind: none (close the door!)': 'Tuuli: tyyntä (sulje ovi!)',
  'After the sauna: the sea is right there': 'Saunan jälkeen: meri on ihan vieressä',
  'After the sauna: the sea is {temperature}': 'Saunan jälkeen: meri on {temperature}',
  // The Santa easter egg (santa.ts).
  "Santa's workshop": 'Joulupukin paja',
  "Santa's workshop, Rovaniemi": 'Joulupukin paja, Rovaniemi',
  'Rovaniemi, Finland': 'Rovaniemi, Suomi',
  'Sleigh flying conditions: excellent': 'Rekikeli ilmassa: erinomainen',
  'Sleigh flying conditions: bumpy, hold on to the presents':
    'Rekikeli ilmassa: töyssyistä, pidä lahjoista kiinni',
  'Sleigh flying conditions: stormy, reindeer on standby':
    'Rekikeli ilmassa: myrskyistä, porot valmiudessa',
  'Reindeer visibility: good': 'Porojen näkyvyys: hyvä',
  'Reindeer visibility: snowy': 'Porojen näkyvyys: lumisadetta',
  'Reindeer visibility: foggy, follow the bright red nose':
    'Porojen näkyvyys: sumuista, seuraa kirkkaan punaista nenää',
  'The elves are resting: merry Christmas!': 'Tontut lepäävät: hyvää joulua!',
  'Elves: busy, {count} day to Christmas Eve': 'Tontut: kiireisiä, {count} päivä jouluaattoon',
  'Elves: busy, {count} days to Christmas Eve': 'Tontut: kiireisiä, {count} päivää jouluaattoon',
  'Use at your own risk': 'Käyttö omalla vastuulla',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Ennusteet voivat olla vääriä, ja tiedot voivat olla myöhässä tai puuttua. Älä luota pelkästään tähän sovellukseen, kun kyse on turvallisuudesta, kuten merellä, tunturissa tai ankarassa säässä. Noudata oman maasi sääpalvelun virallisia varoituksia.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Ilmanlaatu, siitepöly ja UV ovat yleistä tietoa, eivät lääketieteellisiä neuvoja.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Sovellus on maksuton ja tarjotaan sellaisenaan, ilman takuuta. Lain sallimissa rajoissa sen käytöstä aiheutuvista menetyksistä ei vastata.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Sovellus ei ole yhteydessä yllä mainittuihin tiedontuottajiin tai laitevalmistajiin, eivätkä ne ole hyväksyneet sitä.',
  Language: 'Kieli',
  'Clear saved data': 'Poista tallennetut tiedot',
  Done: 'Valmis',
  'Tap a name to rename the place. ↑ and ↓ change the order.':
    'Napauta nimeä nimetäksesi paikan uudelleen. ↑ ja ↓ muuttavat järjestystä.',
  'No favourites. Tap ☆ in the weather panel to save a place.':
    'Ei suosikkeja. Tallenna paikka napauttamalla ☆ säänäkymässä.',
  Undo: 'Kumoa',

  'html:sources-weather':
    '<strong>Sää, UV, lumi ja meri:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Paikkahaku:</strong> Open-Meteo, paikannimet <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Napautettujen paikkojen nimet:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMapin</a> tekijät (ODbL)',
  'html:sources-air':
    '<strong>Ilmanlaatu, siitepöly ja kasvihuonekaasut:</strong> Copernicus Atmosphere Monitoring Service, Open-Meteon kautta',
  'html:sources-history':
    '<strong>Sää menneenä päivänä:</strong> ERA5, Copernicuksen ilmastonmuutospalvelu, <a href="https://open-meteo.com/">Open-Meteo.comin</a> kautta (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-map':
    '<strong>Kartta:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMapin</a> tekijät, näytetään <a href="https://leafletjs.com/">Leafletilla</a>',
  'html:sources-radar':
    '<strong>Sadetutka:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> Pohjois-Amerikassa (Open Government Licence – Canada) ja <a href="https://www.rainviewer.com/">RainViewer</a> muualla',
  'html:sources-warnings':
    '<strong>Säävaroitukset:</strong> Environment and Climate Change Canada, Yhdysvaltain National Weather Service, MET Norway (CC BY 4.0), SMHI (CC BY 4.0) ja Ilmatieteen laitos (CC BY 4.0), Kanadaan, Yhdysvaltoihin, Norjaan, Ruotsiin ja Suomeen. Suomen varoitukset tulevat tämän sivuston oman palvelimen kautta, koska selaimet eivät voi lukea Ilmatieteen laitoksen varoitussyötettä suoraan; sijaintiasi ei lähetetä sille (sovellus tarkistaa itse, mitkä varoitukset koskevat paikkaa)',
  'html:privacy-tracking':
    'Ei tiliä, ei evästeitä eikä seurantaa. Käynnit lasketaan nimettömästi Cloudflare Web Analyticsilla, ilman evästeitä tai mitään, mistä sinut voisi tunnistaa.',
  'html:privacy-saved':
    'Suosikkisi, aloituspaikka (noin 1 km:n tarkkuudella), yksikkövalinnat, vaalea tai tumma ulkoasu ja värit, kieli, sadetutkan asetus, piilottamasi osiot ja visatuloksesi (päivän tulos, putki ja paras) tallennetaan vain tähän selaimeen, tällä laitteella. Samoin sääseikkailusi: pisteet, merkit ja mitä noin 50 km:n alueita, maita ja maanosia olet katsonut. Samoin kolmen viimeksi katsomasi paikan sää (noin 1 km:n tarkkuudella), jotta sen voi näyttää ilman yhteyttä.',
  'html:privacy-sent':
    'Sään näyttämiseksi valitsemasi paikan koordinaatit lähetetään yllä mainituille sääpalveluille, ja napautetun paikan nimen hakemiseksi myös OpenStreetMapin Nominatimille. Toiminnossa Sää tiettynä päivänä Open-Meteolle lähetetään myös valitsemasi päivä, eikä sitä tallenneta. Kuten minkä tahansa verkkosivun kohdalla, ne, karttapalvelu ja sivustoa isännöivä Cloudflare näkevät IP-osoitteesi.',
  'html:privacy-location':
    'Sijaintiasi käytetään vain, kun painat Oma sijainti -painiketta. Se tallennetaan vain, jos teet siitä paikasta aloituspaikkasi, sekä sen sään kanssa (yllä), noin 1 km:n tarkkuudella.',
  'html:privacy-address':
    'Sivun osoite näyttää katsomasi paikan (noin 1 km:n tarkkuudella), joten sen voi lisätä kirjanmerkkeihin tai jakaa. Se pysyy selaimessasi, ellet jaa linkkiä.',

  // ── Map, search, location ───────────────────────────────────────────────
  About: 'Tietoa',
  'Zoom in': 'Lähennä',
  'Zoom out': 'Loitonna',
  Favourites: 'Suosikit',
  Places: 'Paikat',
  'No places found.': 'Paikkoja ei löytynyt.',
  'Something went wrong searching.': 'Haussa tapahtui virhe.',
  '{count} place found. Use the arrow keys to choose.':
    '{count} paikka löytyi. Valitse nuolinäppäimillä.',
  '{count} places found. Use the arrow keys to choose.':
    '{count} paikkaa löytyi. Valitse nuolinäppäimillä.',
  '{count} favourite. Use the arrow keys to choose.': '{count} suosikki. Valitse nuolinäppäimillä.',
  '{count} favourites. Use the arrow keys to choose.':
    '{count} suosikkia. Valitse nuolinäppäimillä.',
  'Could not reach the place search. Check your connection.':
    'Paikkahakuun ei saatu yhteyttä. Tarkista verkkoyhteys.',
  'Finding your location…': 'Haetaan sijaintiasi…',
  'Your location could not be determined.': 'Sijaintiasi ei voitu määrittää.',
  'Your location could not be determined right now.': 'Sijaintiasi ei voitu määrittää juuri nyt.',
  "Location access is blocked. Allow it in your browser's site settings and try again.":
    'Sijainnin käyttö on estetty. Salli se selaimen sivustoasetuksista ja yritä uudelleen.',
  'Finding your location took too long. Please try again.':
    'Sijainnin haku kesti liian kauan. Yritä uudelleen.',
  'Your location is only available over a secure (https) connection.':
    'Sijainti on käytettävissä vain suojatun (https) yhteyden kautta.',
  'This browser cannot share your location.': 'Tämä selain ei voi jakaa sijaintiasi.',
  'Hide rain radar': 'Piilota sadetutka',
  'Show rain radar': 'Näytä sadetutka',
  'Snow radar': 'Lumitutka',
  Radar: 'Tutka',
  'Rain radar is unavailable right now. Try again later.':
    'Sadetutka ei ole juuri nyt käytettävissä. Yritä myöhemmin uudelleen.',

  // ── Weather panel ───────────────────────────────────────────────────────
  'Loading…': 'Ladataan…',
  'Loading weather…': 'Ladataan säätä…',
  'Weather unavailable': 'Säätietoja ei saatavilla',
  'Try again': 'Yritä uudelleen',
  'Something went wrong loading the weather.': 'Sään lataamisessa tapahtui virhe.',
  'Could not reach the weather service. Check your connection.':
    'Sääpalveluun ei saatu yhteyttä. Tarkista verkkoyhteys.',
  'The weather service returned unexpected data.': 'Sääpalvelu palautti odottamattomia tietoja.',
  'Remove from favourites': 'Poista suosikeista',
  'Save as favourite': 'Tallenna suosikiksi',
  'Removed from favourites.': 'Poistettu suosikeista.',
  'Saved to favourites.': 'Tallennettu suosikkeihin.',
  'You have {count} favourites. Remove one to save another.':
    'Sinulla on {count} suosikkia. Poista yksi tallentaaksesi uuden.',
  'Could not save: this browser is blocking storage.':
    'Tallennus ei onnistunut: selain estää tallentamisen.',
  'Link copied': 'Linkki kopioitu',
  'Weather in {place}': 'Sää: {place}',
  'Weather here': 'Sää täällä',
  'The app opens here. Press to open at the world map instead.':
    'Sovellus avautuu tähän. Paina avataksesi sen sijaan maailmankartalle.',
  'Open the app at this place next time': 'Avaa sovellus tähän paikkaan ensi kerralla',

  // Now
  'Current weather': 'Sää nyt',
  'Feels like {temp}': 'Tuntuu kuin {temp}',
  'Updated {time}': 'Päivitetty {time}',
  'No connection · weather from {time}': 'Ei yhteyttä · sää ajalta {time}',
  'Rain starting around {time}': 'Sade alkaa noin klo {time}',
  'Rain stopping around {time}': 'Sade lakkaa noin klo {time}',
  'Snow starting around {time}': 'Lumisade alkaa noin klo {time}',
  'Snow stopping around {time}': 'Lumisade lakkaa noin klo {time}',
  // What to wear (weather/wear.ts)
  'What to wear:': 'Mitä pukea:',
  'Winter gear: hat and mittens': 'Talvivarusteet: pipo ja lapaset',
  'Warm coat': 'Lämmin takki',
  Jacket: 'Takki',
  'Light jacket or sweater': 'Kevyt takki tai neule',
  'T-shirt': 'T-paita',
  'Shorts weather': 'Shortsikeli',
  'waterproof boots': 'vedenpitävät kengät',
  'a hood (too windy for an umbrella)': 'huppu (liian tuulista sateenvarjolle)',
  umbrella: 'sateenvarjo',
  'something windproof': 'jotain tuulenpitävää',
  'sunglasses and sunscreen': 'aurinkolasit ja aurinkovoide',
  Wind: 'Tuuli',
  'gusts {speed}': 'puuskissa {speed}',
  Precipitation: 'Sade',
  '{amount} snow': '{amount} lunta',
  'UV index': 'UV-indeksi',
  "today's max {value} {level} around {time}": 'tänään enintään {value} {level} noin klo {time}',
  'around {time}': 'noin klo {time}',
  'Sun protection {hours}': 'Aurinkosuojaus {hours}',
  'Air quality': 'Ilmanlaatu',

  // Hours and days
  'Next 24 hours': 'Seuraavat 24 tuntia',
  Now: 'Nyt',
  'Chance of precipitation': 'Sateen todennäköisyys',
  '7 days': '7 päivää',
  Today: 'Tänään',
  'temperature|Low': 'Alin',
  'temperature|high': 'ylin',
  Snow: 'Lunta',
  'UV index {value}, {level}': 'UV-indeksi {value}, {level}',
  'Hours on {day}': 'Tunnit: {day}',
  'No hourly forecast for this day.': 'Tälle päivälle ei ole tuntiennustetta.',
  'Temperature from {low} to {high}, warmest around {time}.':
    'Lämpötila {low}…{high}, lämpimintä noin klo {time}.',
  'Precipitation {amount} in total, most around {time}.':
    'Sadetta yhteensä {amount}, eniten noin klo {time}.',
  'No precipitation.': 'Ei sadetta.',

  // Sea
  Sea: 'Meri',
  Waves: 'Aallot',
  'every {seconds} s': '{seconds} s välein',
  Swell: 'Mainingit',
  'Highest in 24 h': 'Korkeimmat 24 h:ssa',
  '{height} around {time}': '{height} noin klo {time}',
  'Sea temperature': 'Meriveden lämpötila',

  // Air quality and pollen
  'Loading air quality…': 'Ladataan ilmanlaatua…',
  'Air quality is unavailable right now.': 'Ilmanlaatutietoja ei ole juuri nyt saatavilla.',
  'No air quality index for this place.': 'Tälle paikalle ei ole ilmanlaatuindeksiä.',
  'European AQI': 'Eurooppalainen ilmanlaatuindeksi',
  'US AQI': 'Yhdysvaltain ilmanlaatuindeksi',
  'aqi|Good': 'Hyvä',
  'aqi|Fair': 'Tyydyttävä',
  'aqi|Moderate': 'Välttävä',
  'aqi|Poor': 'Huono',
  'aqi|Very poor': 'Erittäin huono',
  'aqi|Extremely poor': 'Äärimmäisen huono',
  'usaqi|Good': 'Hyvä',
  'usaqi|Moderate': 'Kohtalainen',
  'usaqi|Unhealthy for sensitive groups': 'Epäterveellinen herkille',
  'usaqi|Unhealthy': 'Epäterveellinen',
  'usaqi|Very unhealthy': 'Erittäin epäterveellinen',
  'usaqi|Hazardous': 'Vaarallinen',
  'UK DAQI': 'Ison-Britannian DAQI-indeksi',
  'Canada AQHI': 'Kanadan AQHI-indeksi',
  'daqi|Low': 'Matala',
  'daqi|Moderate': 'Kohtalainen',
  'daqi|High': 'Korkea',
  'daqi|Very high': 'Erittäin korkea',
  'aqhi|Low risk': 'Pieni riski',
  'aqhi|Moderate risk': 'Kohtalainen riski',
  'aqhi|High risk': 'Suuri riski',
  'aqhi|Very high risk': 'Erittäin suuri riski',
  'Worked out from forecast data; official readings can differ a little.':
    'Laskettu ennustetiedoista; viralliset lukemat voivat poiketa hieman.',
  'Ozone (O₃)': 'Otsoni (O₃)',
  'Nitrogen dioxide (NO₂)': 'Typpidioksidi (NO₂)',
  'Next days': 'Seuraavat päivät',
  'worst around {time}': 'huonoin noin klo {time}',
  '{name} pollen': '{name} (siitepöly)',
  'Pollen forecast': 'Siitepölyennuste',
  None: 'Ei siitepölyä',
  Birch: 'Koivu',
  Alder: 'Leppä',
  Grass: 'Heinät',
  Mugwort: 'Pujo',
  Ragweed: 'Tuoksukki',
  Olive: 'Oliivi',
  'pollen|Low': 'Vähäinen',
  'pollen|Moderate': 'Kohtalainen',
  'pollen|High': 'Runsas',

  // UV levels
  Low: 'Heikko',
  Moderate: 'Kohtalainen',
  High: 'Voimakas',
  'Very high': 'Hyvin voimakas',
  Extreme: 'Äärimmäinen',

  // More details
  'More details': 'Lisätietoja',
  Humidity: 'Kosteus',
  Pressure: 'Ilmanpaine',
  rising: 'nousee',
  falling: 'laskee',
  steady: 'vakaa',
  Sunrise: 'Auringonnousu',
  Sunset: 'Auringonlasku',
  'No sunrise today': 'Aurinko ei nouse tänään',
  'No sunset today': 'Aurinko ei laske tänään',
  Sun: 'Aurinko',
  'Polar night – the sun does not rise today': 'Kaamos – aurinko ei nouse tänään',
  'Midnight sun – the sun does not set today': 'Yötön yö – aurinko ei laske tänään',
  Daylight: 'Päivän pituus',
  '{minutes} min longer tomorrow': 'huomenna {minutes} min pidempi',
  '{minutes} min shorter tomorrow': 'huomenna {minutes} min lyhyempi',
  'about the same tomorrow': 'huomenna suunnilleen sama',
  Moon: 'Kuu',
  '{percent} lit': '{percent} valaistuna',
  'New moon': 'Uusikuu',
  'Waxing crescent': 'Kasvava sirppi',
  'First quarter': 'Ensimmäinen neljännes',
  'Waxing gibbous': 'Kasvava kuu',
  'Full moon': 'Täysikuu',
  'Waning gibbous': 'Vähenevä kuu',
  'Last quarter': 'Viimeinen neljännes',
  'Waning crescent': 'Vähenevä sirppi',
  'Local time': 'Paikallinen aika',
  Coordinates: 'Koordinaatit',
  Elevation: 'Korkeus merenpinnasta',
  'Your level': 'Tasosi',
  'Snow on the ground': 'Lunta maassa',
  'about {depth}': 'noin {depth}',

  // Warnings
  'Weather warnings': 'Säävaroitukset',
  'Checking…': 'Tarkistetaan…',
  'until {time}': '{time} asti',
  'Sea area: {area}': 'Merialue: {area}',
  'Issued by': 'Antaja:',
  'Not available for this area': 'Ei saatavilla tälle alueelle',
  "Couldn't be checked right now": 'Ei voitu tarkistaa juuri nyt',
  'None in effect': 'Ei voimassa olevia',
  '{count} in effect (see top)': '{count} voimassa (ks. ylhäältä)',

  // Weather (WMO codes)
  'Clear sky': 'Selkeää',
  'Mainly clear': 'Enimmäkseen selkeää',
  'Partly cloudy': 'Puolipilvistä',
  Overcast: 'Pilvistä',
  Fog: 'Sumua',
  'Depositing rime fog': 'Huurtavaa sumua',
  'Light drizzle': 'Heikkoa tihkusadetta',
  'Moderate drizzle': 'Kohtalaista tihkusadetta',
  'Dense drizzle': 'Runsasta tihkusadetta',
  'Light freezing drizzle': 'Heikkoa jäätävää tihkua',
  'Dense freezing drizzle': 'Runsasta jäätävää tihkua',
  'Slight rain': 'Heikkoa sadetta',
  'Moderate rain': 'Kohtalaista sadetta',
  'Heavy rain': 'Rankkaa sadetta',
  'Light freezing rain': 'Heikkoa jäätävää sadetta',
  'Heavy freezing rain': 'Runsasta jäätävää sadetta',
  'Slight snowfall': 'Heikkoa lumisadetta',
  'Moderate snowfall': 'Kohtalaista lumisadetta',
  'Heavy snowfall': 'Runsasta lumisadetta',
  'Snow grains': 'Lumijyväsiä',
  'Slight rain showers': 'Heikkoja sadekuuroja',
  'Moderate rain showers': 'Kohtalaisia sadekuuroja',
  'Violent rain showers': 'Voimakkaita sadekuuroja',
  'Slight snow showers': 'Heikkoja lumikuuroja',
  'Heavy snow showers': 'Voimakkaita lumikuuroja',
  Thunderstorm: 'Ukkosta',
  'Thunderstorm with slight hail': 'Ukkosta ja heikkoja raekuuroja',
  'Heavy thunderstorm': 'Voimakasta ukkosta',
  'Thunderstorm with heavy hail': 'Ukkosta ja voimakkaita raekuuroja',
  'Unknown conditions': 'Tuntematon sää',

  // Favourites editor
  'Name for {place}': 'Nimi paikalle {place}',
  'Move {place} up': 'Siirrä {place} ylöspäin',
  'Move {place} down': 'Siirrä {place} alaspäin',
  'Remove {place}': 'Poista {place}',
  'Removed {place}.': 'Poistettu: {place}.',
  '{place} is back.': '{place} palautettu.',
  "Couldn't put it back: this browser is blocking storage, or the list is full.":
    'Palauttaminen ei onnistunut: selain estää tallentamisen tai lista on täynnä.',

  // About
  'Remove your favourites, start place and settings from this device?':
    'Poistetaanko suosikit, aloituspaikka ja asetukset tältä laitteelta?',
  "This browser didn't let the app remove them.": 'Selain ei sallinut niiden poistamista.',
  "This browser didn't let the app save it.": 'Selain ei sallinut valinnan tallentamista.',
  'Frost on car windscreens this morning': 'Autojen tuulilaseissa on huurretta tänä aamuna',
  'Scrape the windscreen tomorrow morning': 'Huomenna aamulla tuulilasi pitää raaputtaa',
  'Frost tonight ({temp}): bring the balcony plants in':
    'Yöllä pakkasta ({temp}): ota parvekekasvit sisään',
  'Weather record': 'Sääennätys',
  'Vostok: coldest ever measured on Earth, {value} (1983)':
    'Vostok-asema: maapallon kylmin mitattu, {value} (1983)',
  'Death Valley: hottest ever measured on Earth, {value} (1913)':
    'Death Valley: maapallon kuumin mitattu, {value} (1913)',
  'Greenland: coldest in the Northern Hemisphere, {value} (1991)':
    'Grönlanti: pohjoisen pallonpuoliskon kylmin, {value} (1991)',
  'Oymyakon: one of the coldest villages, {value} (1933)':
    'Oimjakon: yksi kylmimmistä kylistä, {value} (1933)',
  'Barrow Island: strongest gust ever measured, {value} (1996)':
    'Barrow Island: kovin mitattu tuulenpuuska, {value} (1996)',
  'Mawsynram: wettest place on Earth, about {value} a year':
    'Mawsynram: maapallon sateisin paikka, noin {value} vuodessa',
  'Atacama Desert: some stations here have never had rain':
    'Atacaman autiomaa: osa asemista ei ole koskaan saanut sadetta',
  'Pokka: coldest in Finland, {value} (1999)': 'Pokka: Suomen kylmin, {value} (1999)',
  'Liperi: hottest in Finland, {value} (2010)': 'Liperi: Suomen kuumin, {value} (2010)',
  'Vuoggatjålme: coldest in Sweden, {value} (1966)': 'Vuoggatjålme: Ruotsin kylmin, {value} (1966)',
  'Karasjok: coldest in Norway, {value} (1886)': 'Kaarasjoki: Norjan kylmin, {value} (1886)',
  'freezing rain': 'jäätävää sadetta',
  'html:sources-roads':
    '<strong>Tieolosuhteet Suomessa:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), paikkaa lähin päätie; ladataan koko maasta, joten sijaintia ei lähetetä',
  'very slippery': 'erittäin liukasta',
  slippery: 'liukasta',
  icy: 'jäistä',
  'partly icy': 'osittain jäistä',
  slush: 'sohjoa',
  'snow on the road': 'lunta tiellä',
  'frost on the road': 'kuuraa tiellä',
  'heavy snowfall': 'runsasta lumisadetta',
  snowfall: 'lumisadetta',
  'strong wind': 'kovaa tuulta',
  'wet road': 'märkä tie',
  'Very poor road conditions': 'Erittäin huono ajokeli',
  'Poor road conditions': 'Huono ajokeli',
  'Road weather:': 'Tiesää:',
  'No official warnings in effect ·': 'Ei voimassa olevia virallisia varoituksia ·',
  "Official warnings couldn't be checked:": 'Virallisia varoituksia ei voitu tarkistaa:',
  'WMO severe weather': 'WMO:n vaarallisen sään palvelu',
  "This app doesn't show warnings for this region. Official warnings:":
    'Sovellus ei näytä varoituksia tällä alueella. Viralliset varoitukset:',
  'from {start} until {time}': '{start} – {time}',
  'from {start}': 'alkaen {start}',
  'Finnish Meteorological Institute': 'Ilmatieteen laitos',
  'Play radar history': 'Toista tutkahistoria',
  'Pause radar history': 'Keskeytä tutkahistoria',
  'Radar time': 'Tutkakuvan aika',
  '{time} · latest': '{time} · uusin',
  '{time} · {minutes} min ago': '{time} · {minutes} min sitten',
  'loading {loaded}/{total}': 'ladataan {loaded}/{total}',
  // ── Weather on a day (past-weather.ts) ──
  'Weather on a day…': 'Sää tiettynä päivänä…',
  'Weather on a day': 'Sää tiettynä päivänä',
  'This day in the past': 'Tämä päivä menneinä vuosina',
  '1 year ago': 'Vuosi sitten',
  '10 years ago': '10 vuotta sitten',
  '50 years ago': '50 vuotta sitten',
  'Any day': 'Mikä tahansa päivä',
  Show: 'Näytä',
  'From 1 January 1940 to about a week ago.': '1.1.1940 alkaen noin viikon päähän tästä päivästä.',
  'Estimated from weather records (ERA5, about 25 km grid): a thermometer there may have shown a few degrees different. Historical weather: Open-Meteo.com, ERA5 by Copernicus.':
    'Arvio säähavainnoista (ERA5, noin 25 km:n hila): paikan päällä lämpömittari on voinut näyttää muutaman asteen eri lukemaa. Historiallinen sää: Open-Meteo.com, ERA5, Copernicus.',
  'Pick a day between 1 January 1940 and a week ago.':
    'Valitse päivä 1.1.1940 ja viikko sitten väliltä.',
  "Couldn't get the weather for that day. Try again.":
    'Päivän säätä ei saatu haettua. Yritä uudelleen.',
  'No weather records for that day yet.': 'Tältä päivältä ei ole vielä säätietoja.',
  'high {temperature}': 'ylin {temperature}',
  'low {temperature}': 'alin {temperature}',
  'wind up to {speed}': 'tuuli enintään {speed}',
  '{hours} h of sunshine': 'aurinkoa {hours} h',
  'Snow {amount}': 'Lunta {amount}',
  'Rain {amount}': 'Sadetta {amount}',
  'No rain or snow': 'Ei sadetta',
  '{degrees}° warmer': '{degrees}° lämpimämpää',
  '{degrees}° colder': '{degrees}° kylmempää',
  'the same high': 'sama ylin lämpötila',
  'Today: {high} / {low}, {difference}': 'Tänään: {high} / {low}, {difference}',
  "Couldn't open it. Check your connection.": 'Avaaminen ei onnistunut. Tarkista yhteys.',
  'Greetings from {year}': 'Terveisiä vuodelta {year}',
  'Weather in {place} on {date}': 'Sää: {place}, {date}',
  // ── Sky section (render/sky.ts) ──
  Sky: 'Taivas',
  'Until midwinter': 'Talvipäivänseisaukseen',
  'Since midwinter': 'Talvipäivänseisauksesta',
  '{duration} less daylight by {date}': 'päivä lyhenee vielä {duration} ({date})',
  '+{duration} of daylight since {date}': 'päivä pidentynyt {duration} ({date} jälkeen)',
  'Golden hour': 'Kultainen tunti',
  'All day (the sun stays low)': 'Koko päivän (aurinko pysyy matalalla)',
  'Blue hour': 'Sininen hetki',
  'dark sky': 'pimeä taivas',
  'some moonlight': 'hieman kuunvaloa',
  'bright moon': 'kirkas kuu',
  Stargazing: 'Tähtien katselu',
  'Good {from}–{to}: clear sky, {moonlight}': 'Hyvä {from}–{to}: selkeää, {moonlight}',
  'Almost none (the sun is high)': 'Lähes olematon (aurinko on korkealla)',
  'Very long (the sun is low)': 'Hyvin pitkä (aurinko on matalalla)',
  '{ratio}× your height': '{ratio} × pituutesi',
  'Your shadow': 'Varjosi',
  'Chance {percent} now': 'Todennäköisyys nyt {percent}',
  'low in the north': 'matalalla pohjoisessa',
  'low in the south': 'matalalla etelässä',
  'Northern lights': 'Revontulet',
  'Southern lights': 'Etelänvalot',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Revontulten todennäköisyys on malliarvio noin seuraavalle tunnille, ja revontulet voivat muuttua minuuteissa. Tähtien katselu, kultainen tunti ja muut taivaan ajat lasketaan auringon, kuun ja pilvisyysennusteen perusteella, ja ne ovat likimääräisiä.',
  'html:sources-aurora':
    '<strong>Revontulet:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-malli, public domain)',
  // ── Beer outside (render/sky.ts, weather/beer.ts) ──
  'Beer outside': 'Olut ulkona',
  'Gets warm in about {time}': 'Lämpenee noin {time}',
  'Starts to freeze in about {time}': 'Alkaa jäätyä noin {time}',
  'Stays cold out here': 'Pysyy täällä kylmänä',
  'beer|sunny': 'aurinkoista',
  'beer|breezy': 'tuulista',
  'beer|windy': 'kovaa tuulta',
  // ── Atmospheric correction for surveying instruments (weather/edm.ts) ──
  'Atmospheric correction (EDM)': 'Ilmakehäkorjaus (EDM)',
  '{pressure} at ground level': '{pressure} maanpinnalla',
  'Estimate only, not a measurement.': 'Vain arvio, ei mittaus.',
  'Worked out from the weather forecast for this area, which can differ from the conditions at your instrument by several ppm. For survey work, measure temperature and pressure on site.':
    'Laskettu tämän alueen sääennusteesta, joka voi poiketa kojeesi luona vallitsevista oloista useita ppm:iä. Mittaustöissä mittaa lämpötila ja ilmanpaine paikan päällä.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Mittauskojeiden ilmakehäkorjaus ja ilman arvot (epäpuhtaudet, CO₂, metaani) ovat malliarvioita, eivät mittauksia. Älä käytä niitä tarkkuutta vaativiin töihin mittaamatta paikan päällä.',
  'html:sources-edm':
    '<strong>Ilmakehäkorjaus (EDM):</strong> lasketaan sovelluksessa kaavalla, jonka Leica Geosystems julkaisee takymetriensä käyttöohjeissa (esim. TS13:n käyttöohje, Technical Data → Formulas; näkyvä punainen laser, 658 nm), ennusteen lämpötilasta, maanpinnan ilmanpaineesta ja ilmankosteudesta. 0 ppm = 1013,25 hPa, 12 °C, 60 % kosteus. Muiden valmistajien ja laserien kaavat poikkeavat hieman, yleensä enintään muutaman ppm:n.',
  // ── More air values (render/air-quality.ts) ──
  'Sulphur dioxide (SO₂)': 'Rikkidioksidi (SO₂)',
  'Carbon monoxide (CO)': 'Hiilimonoksidi (CO)',
  'Desert dust': 'Aavikkopöly',
  'Greenhouse gases': 'Kasvihuonekaasut',
  'Carbon dioxide (CO₂)': 'Hiilidioksidi (CO₂)',
  'Methane (CH₄)': 'Metaani (CH₄)',
  'Everything in this section comes from the CAMS forecast model, not from measuring stations.':
    'Kaikki tämän osion tiedot tulevat CAMS-ennustemallista, eivät mittausasemilta.',
  'Values are averages for an area about 11 km across in Europe (40 km elsewhere); stations nearby can show different values.':
    'Arvot ovat keskiarvoja noin 11 km:n levyiseltä alueelta Euroopassa (muualla 40 km); lähellä olevat mittausasemat voivat näyttää eri arvoja.',
  'Not part of the air quality index.': 'Eivät kuulu ilmanlaatuindeksiin.',
  'Inputs: {values}': 'Lähtöarvot: {values}',
  // ── Weather excuse and small talk (quips/card.ts; the lines are in quips/) ──
  'Weather excuse': 'Säätekosyy',
  'Another one': 'Toinen',
  Share: 'Jaa',
  "Couldn't copy it: select the text to copy it.":
    'Kopiointi ei onnistunut: valitse teksti ja kopioi se itse.',
  // ── Unit settings (settings.ts) ──
  Units: 'Yksiköt',
  'Rain and snow': 'Sade ja lumi',
  Knots: 'Solmut',
  Beaufort: 'Beaufort',
  'Automatic follows °C/°F and your region (now: {units}).':
    'Automaattinen seuraa °C/°F-valintaa ja aluettasi (nyt: {units}).',
  // ── Umbrella in What to wear (weather/wear.ts) ──
  'umbrella (raining until about {time})': 'sateenvarjo (sadetta noin klo {time} asti)',
  'umbrella (rain from about {time})': 'sateenvarjo (sadetta noin klo {time} alkaen)',
  'umbrella for later (rain from about {time})':
    'sateenvarjo myöhemmäksi (sadetta noin klo {time} alkaen)',
  'no umbrella needed today': 'sateenvarjoa ei tarvita tänään',
  'Small talk': 'Jutun juurta',
  Copied: 'Kopioitu',
  'html:fun-disclaimer':
    'Säätekosyyt ja jutun juurta ovat huvin vuoksi. Ne perustuvat paikan sääennusteeseen, eikä niiden tehoa voida taata. Emme vastaa, jos esihenkilö ei hyväksy tekosyytä, keskustelu tyrehtyy ensimmäiseen lauseeseen tai kissasi on eri mieltä.',
  // ── Add to home screen (settings.ts) ──
  App: 'Sovellus',
  'Add to home screen': 'Lisää aloitusnäytölle',
  'Added to the home screen.': 'Lisätty aloitusnäytölle.',
  'Tap the Share button (a square with an arrow), then Add to Home Screen.':
    'Napauta Jaa-painiketta (neliö, jossa nuoli) ja valitse Lisää Koti-valikkoon.',
  'Open the browser menu (⋮), then choose Install.': 'Avaa selaimen valikko (⋮) ja valitse Asenna.',
  "Open your browser's menu and choose Install app or Add to Home screen.":
    'Avaa selaimen valikko ja valitse Asenna sovellus tai Lisää aloitusnäytölle.',
  // ── Temperature quiz (quiz/) and electric car range (weather/ev.ts) ──
  '{low}–{high} % less': '{low}–{high} % vähemmän',
  'Electric car range': 'Sähköauton toimintamatka',
  'Typical at {temp}. Less with a heat pump or a car warmed while plugged in; more on short trips.':
    'Tyypillinen, kun on {temp}. Vähemmän, jos autossa on lämpöpumppu tai se on esilämmitetty latauksessa; enemmän lyhyillä matkoilla.',
  'Estimate from published tests, not your car.':
    'Arvio julkaistujen testien perusteella, ei sinun autosi.',
  'Temperature quiz': 'Lämpötilavisa',
  'html:sources-elevation':
    '<strong>Korkeus merenpinnasta:</strong> Copernicus DEM -korkeusmallista (90 metrin ruudukko) Open-Meteon kautta; jyrkässä maastossa se voi heittää kymmeniä metrejä.',
  'html:sources-fishing':
    '<strong>Kalojen syöntiajat:</strong> lasketaan sovelluksessa kuun asemasta (solunaariajat, kuten kalastuskalentereissa): vanha perinne, ei ennuste kalojen syönnistä.',
  'html:sources-ev':
    '<strong>Sähköauton toimintamatka kylmällä:</strong> tyypilliset luvut julkaistuista talvitesteistä ja ajoneuvodatasta (Norjan autoliiton NAF:n El Prix -talvitestit, AAA, Geotab) nykyisen lämpötilan mukaan; ei mikään tietty auto.',
};
