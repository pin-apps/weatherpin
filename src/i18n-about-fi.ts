// Finnish texts of the About dialog (index.html), keyed like i18n-fi.ts.
// Kept apart from the start-up language file: they load when About is first
// opened (about.ts), as most visitors never open it.

export const FINNISH_ABOUT: Record<string, string> = {
  'Tap anywhere on the world map, search for a place, or use My location to see the weather there: now, the next 24 hours and 7 days, with air quality, UV, rain radar and weather warnings.':
    'Napauta mitä tahansa kohtaa maailmankartalla, hae paikkaa tai käytä omaa sijaintiasi nähdäksesi sen sään: nyt, seuraavat 24 tuntia ja 7 päivää, sekä ilmanlaatu, UV, sadetutka ja säävaroitukset.',
  'Where the data comes from': 'Mistä tiedot tulevat',
  Privacy: 'Tietosuoja',
  'Use at your own risk': 'Käyttö omalla vastuulla',
  "Forecasts can be wrong, and data can be late or missing. Don't rely on this app alone where safety is at stake, such as at sea, in the mountains or in severe weather. Follow the official warnings of your national weather service.":
    'Ennusteet voivat olla vääriä, ja tiedot voivat olla myöhässä tai puuttua. Älä luota pelkästään tähän sovellukseen, kun kyse on turvallisuudesta, kuten merellä, tunturissa tai ankarassa säässä. Noudata oman maasi sääpalvelun virallisia varoituksia.',
  'Air quality, pollen and UV are general information, not medical advice.':
    'Ilmanlaatu, siitepöly ja UV ovat yleistä tietoa, eivät lääketieteellisiä neuvoja.',
  'The northern lights chance is a model estimate for the next hour or so, and the aurora can change within minutes. Stargazing, golden hour and the other sky times are calculated from the sun, moon and cloud forecast, and are approximate.':
    'Revontulten todennäköisyys on malliarvio noin seuraavalle tunnille, ja revontulet voivat muuttua minuuteissa. Tähtien katselu, kultainen tunti ja muut taivaan ajat lasketaan auringon, kuun ja pilvisyysennusteen perusteella, ja ne ovat likimääräisiä.',
  "The atmospheric correction for surveying instruments and the air values (pollutants, CO₂, methane) are model estimates, not measurements. Don't use them where accuracy matters without measuring on site.":
    'Mittauskojeiden ilmakehäkorjaus ja ilman arvot (epäpuhtaudet, CO₂, metaani) ovat malliarvioita, eivät mittauksia. Älä käytä niitä tarkkuutta vaativiin töihin mittaamatta paikan päällä.',
  'The app is free and provided as is, without any warranty. To the extent the law allows, no liability is accepted for any loss from using it.':
    'Sovellus on maksuton ja tarjotaan sellaisenaan, ilman takuuta. Lain sallimissa rajoissa sen käytöstä aiheutuvista menetyksistä ei vastata.',
  'The app is not affiliated with or endorsed by the data providers or instrument makers above.':
    'Sovellus ei ole yhteydessä yllä mainittuihin tiedontuottajiin tai laitevalmistajiin, eivätkä ne ole hyväksyneet sitä.',
  'html:sources-weather':
    '<strong>Sää, UV, lumi ja meri sekä pallon tuulet:</strong> <a href="https://open-meteo.com/">Open-Meteo.com</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-search':
    '<strong>Paikkahaku ja sääsymbolien kaupungit:</strong> Open-Meteo, paikannimet <a href="https://www.geonames.org/">GeoNames</a> (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-names':
    '<strong>Napautettujen paikkojen nimet:</strong> <a href="https://nominatim.org/">Nominatim</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMapin</a> tekijät (ODbL)',
  'html:sources-air':
    '<strong>Ilmanlaatu, siitepöly ja kasvihuonekaasut:</strong> Copernicus Atmosphere Monitoring Service, Open-Meteon kautta',
  'html:sources-history':
    '<strong>Sää menneenä päivänä:</strong> ERA5, Copernicuksen ilmastonmuutospalvelu, <a href="https://open-meteo.com/">Open-Meteo.comin</a> kautta (<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)',
  'html:sources-aurora':
    '<strong>Revontulet:</strong> <a href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast">NOAA Space Weather Prediction Center</a> (OVATION-malli, public domain)',
  'html:sources-edm':
    '<strong>Ilmakehäkorjaus (EDM):</strong> lasketaan sovelluksessa kaavalla, jonka Leica Geosystems julkaisee takymetriensä käyttöohjeissa (esim. TS13:n käyttöohje, Technical Data → Formulas; näkyvä punainen laser, 658 nm), ennusteen lämpötilasta, maanpinnan ilmanpaineesta ja ilmankosteudesta. 0 ppm = 1013,25 hPa, 12 °C, 60 % kosteus. Muiden valmistajien ja laserien kaavat poikkeavat hieman, yleensä enintään muutaman ppm:n.',
  'html:sources-elevation':
    '<strong>Korkeus merenpinnasta:</strong> Copernicus DEM -korkeusmallista (90 metrin ruudukko) Open-Meteon kautta; jyrkässä maastossa se voi heittää kymmeniä metrejä.',
  'html:sources-fishing':
    '<strong>Kalojen syöntiajat:</strong> lasketaan sovelluksessa kuun asemasta (solunaariajat, kuten kalastuskalentereissa): vanha perinne, ei ennuste kalojen syönnistä.',
  'html:sources-ev':
    '<strong>Sähköauton toimintamatka kylmällä:</strong> tyypilliset luvut julkaistuista talvitesteistä ja ajoneuvodatasta (Norjan autoliiton NAF:n El Prix -talvitestit, AAA, Geotab) nykyisen lämpötilan mukaan; ei mikään tietty auto.',
  'html:sources-map':
    '<strong>Kartta:</strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMapin</a> tekijät, näytetään <a href="https://leafletjs.com/">Leafletilla</a>',
  'html:sources-radar':
    '<strong>Sadetutka:</strong> <a href="https://eccc-msc.github.io/open-data/licence/readme_en/">Environment and Climate Change Canada</a> Pohjois-Amerikassa (Open Government Licence – Canada) ja <a href="https://www.rainviewer.com/">RainViewer</a> muualla',
  'html:sources-warnings':
    '<strong>Säävaroitukset:</strong> Environment and Climate Change Canada, Yhdysvaltain National Weather Service, MET Norway (CC BY 4.0), SMHI (CC BY 4.0) ja Ilmatieteen laitos (CC BY 4.0), Kanadaan, Yhdysvaltoihin, Norjaan, Ruotsiin ja Suomeen. Suomen varoitukset tulevat tämän sivuston oman palvelimen kautta, koska selaimet eivät voi lukea Ilmatieteen laitoksen varoitussyötettä suoraan; sijaintiasi ei lähetetä sille (sovellus tarkistaa itse, mitkä varoitukset koskevat paikkaa)',
  'html:sources-roads':
    '<strong>Tieolosuhteet Suomessa:</strong> <a href="https://www.digitraffic.fi/">Fintraffic / digitraffic.fi</a> (CC BY 4.0), paikkaa lähin päätie; ladataan koko maasta, joten sijaintia ei lähetetä',
  'html:privacy-tracking':
    'Ei tiliä, ei evästeitä eikä seurantaa. Käynnit lasketaan nimettömästi Cloudflare Web Analyticsilla, ilman evästeitä tai mitään, mistä sinut voisi tunnistaa.',
  'html:privacy-saved':
    'Suosikkisi, aloituspaikka (noin 1 km:n tarkkuudella), yksikkövalinnat, vaalea tai tumma ulkoasu ja värit, kieli, sadetutkan ja sääsymbolien asetukset, piilottamasi osiot, visatuloksesi (päivän tulos, putki ja paras) sekä pallosi nimi ja paras lento tallennetaan vain tähän selaimeen, tällä laitteella. Samoin sääseikkailusi: pisteet, merkit ja mitä noin 50 km:n alueita, maita ja maanosia olet katsonut. Samoin kolmen viimeksi katsomasi paikan sää (noin 1 km:n tarkkuudella), jotta sen voi näyttää ilman yhteyttä, ja kahden tunnin ajan sääsymbolien näyttämien kaupunkien sää.',
  'html:privacy-sent':
    'Sään näyttämiseksi valitsemasi paikan koordinaatit lähetetään yllä mainituille sääpalveluille, ja napautetun paikan nimen hakemiseksi myös OpenStreetMapin Nominatimille. Toiminnossa Sää tiettynä päivänä Open-Meteolle lähetetään myös valitsemasi päivä, eikä sitä tallenneta. Kuten minkä tahansa verkkosivun kohdalla, ne, karttapalvelu ja sivustoa isännöivä Cloudflare näkevät IP-osoitteesi.',
  'html:privacy-location':
    'Sijaintiasi käytetään vain, kun painat Oma sijainti -painiketta. Se tallennetaan vain, jos teet siitä paikasta aloituspaikkasi, sekä sen sään kanssa (yllä), noin 1 km:n tarkkuudella.',
  'html:privacy-address':
    'Sivun osoite näyttää katsomasi paikan (noin 1 km:n tarkkuudella), joten sen voi lisätä kirjanmerkkeihin tai jakaa. Se pysyy selaimessasi, ellet jaa linkkiä.',
  'html:fun-disclaimer':
    'Säätekosyyt, jutun juurta ja haikut ovat huvin vuoksi. Ne perustuvat paikan sääennusteeseen, eikä niiden tehoa voida taata. Emme vastaa, jos esihenkilö ei hyväksy tekosyytä, keskustelu tyrehtyy ensimmäiseen lauseeseen tai kissasi on eri mieltä.',
};
