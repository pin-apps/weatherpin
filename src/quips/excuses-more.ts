// More weather excuses (see excuses.ts): grouped by the weather they need,
// several per kind of weather so "Another one" has plenty to go through.
// Mild to properly over the top. Written to work in each language.

import type { Line } from './facts';

const always = () => true;

export const MORE_EXCUSES: readonly Line[] = [
  // ── Gusts ──
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'Gusts of {gusts}. I opened the door and the door left.',
      fi: 'Puuskat {gusts}. Avasin oven, ja ovi lähti.',
      sv: 'Vindbyar på {gusts}. Jag öppnade dörren och dörren gick.',
      nb: 'Vindkast på {gusts}. Jeg åpnet døra, og døra dro.',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'With gusts of {gusts} {from}, my hair is already at the office. I will follow later.',
      fi: 'Kun puuskat ovat {gusts} {from}, hiukseni ovat jo toimistolla. Tulen perässä myöhemmin.',
      sv: 'Med vindbyar på {gusts} {from} är mitt hår redan på jobbet. Jag kommer efter senare.',
      nb: 'Med vindkast på {gusts} {from} er håret mitt allerede på jobben. Jeg kommer etter senere.',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'Gusts of {gusts}. I weigh too little for this. Please send a brick.',
      fi: 'Puuskat {gusts}. Painan liian vähän tähän säähän. Lähettäkää tiiliskivi.',
      sv: 'Vindbyar på {gusts}. Jag väger för lite för det här. Skicka en tegelsten.',
      nb: 'Vindkast på {gusts}. Jeg veier for lite til dette. Send en murstein.',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'My bike went out alone in {gusts} gusts. I am waiting for it to call.',
      fi: 'Pyöräni lähti yksin ulos {gusts} puuskissa. Odotan, että se soittaa.',
      sv: 'Min cykel gick ut ensam i vindbyar på {gusts}. Jag väntar på att den ska ringa.',
      nb: 'Sykkelen min dro ut alene i vindkast på {gusts}. Jeg venter på at den skal ringe.',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'Gusts of {gusts} {from}. The trampoline next door is now in our garden. I have to host it.',
      fi: 'Puuskat {gusts} {from}. Naapurin trampoliini on nyt meidän pihassa. Minun pitää emännöidä sitä.',
      sv: 'Vindbyar på {gusts} {from}. Grannens studsmatta står nu i vår trädgård. Jag måste ta hand om den.',
      nb: 'Vindkast på {gusts} {from}. Naboens trampoline står nå i hagen vår. Jeg må ta vare på den.',
    },
  },
  // ── Steady wind ──
  {
    when: (f) => !!f.wind,
    text: {
      en: '{wind} of wind. I tried to walk to work and arrived back home.',
      fi: 'Tuulta {wind}. Yritin kävellä töihin ja päädyin takaisin kotiin.',
      sv: '{wind} vind. Jag försökte gå till jobbet och kom hem igen.',
      nb: '{wind} vind. Jeg prøvde å gå til jobben og kom hjem igjen.',
    },
  },
  {
    when: (f) => !!f.wind,
    text: {
      en: 'The wind is {wind}. I am not dressed aerodynamically enough.',
      fi: 'Tuulee {wind}. En ole pukeutunut tarpeeksi aerodynaamisesti.',
      sv: 'Det blåser {wind}. Jag är inte tillräckligt aerodynamiskt klädd.',
      nb: 'Det blåser {wind}. Jeg er ikke aerodynamisk nok kledd.',
    },
  },
  {
    when: (f) => !!f.wind,
    text: {
      en: '{wind} of wind. My umbrella turned inside out, and so did my plans.',
      fi: 'Tuulta {wind}. Sateenvarjoni kääntyi nurin, ja niin kääntyivät suunnitelmanikin.',
      sv: '{wind} vind. Mitt paraply vändes ut och in, och det gjorde mina planer också.',
      nb: '{wind} vind. Paraplyen min ble vrengt, og det ble planene mine også.',
    },
  },
  // ── Rain ──
  {
    when: (f) => !!f.amount,
    text: {
      en: '{amount} of rain coming. I am a cat person, and the cat says no.',
      fi: '{amount} sadetta tulossa. Olen kissaihminen, ja kissa sanoo ei.',
      sv: '{amount} regn på väg. Jag är en kattmänniska, och katten säger nej.',
      nb: '{amount} regn på vei. Jeg er et kattemenneske, og katten sier nei.',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: '{amount} of rain. My shoes are made of hope, not leather.',
      fi: '{amount} sadetta. Kenkäni on tehty toivosta, ei nahasta.',
      sv: '{amount} regn. Mina skor är gjorda av hopp, inte av läder.',
      nb: '{amount} regn. Skoene mine er laget av håp, ikke av lær.',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: 'With {amount} of rain on the way, the ducks have booked the meeting room.',
      fi: 'Kun {amount} sadetta on tulossa, sorsat ovat varanneet neuvotteluhuoneen.',
      sv: 'Med {amount} regn på väg har änderna bokat mötesrummet.',
      nb: 'Med {amount} regn på vei har endene booket møterommet.',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: '{amount} of rain. I washed my car yesterday, so this is personal.',
      fi: '{amount} sadetta. Pesin autoni eilen, joten tämä on henkilökohtaista.',
      sv: '{amount} regn. Jag tvättade bilen i går, så det här är personligt.',
      nb: '{amount} regn. Jeg vasket bilen i går, så dette er personlig.',
    },
  },
  {
    when: (f) => f.raining,
    text: {
      en: "It's raining. I'm made of about 60 % water already; any more would be irresponsible.",
      fi: 'Sataa. Olen jo noin 60-prosenttisesti vettä; enempi olisi vastuutonta.',
      sv: 'Det regnar. Jag består redan av ungefär 60 % vatten; mer vore oansvarigt.',
      nb: 'Det regner. Jeg består allerede av rundt 60 % vann; mer ville vært uansvarlig.',
    },
  },
  {
    when: (f) => f.raining,
    text: {
      en: "It's raining and my raincoat is in the wash. Because of the rain.",
      fi: 'Sataa, ja sadetakkini on pesussa. Sateen takia.',
      sv: 'Det regnar och min regnjacka är i tvätten. På grund av regnet.',
      nb: 'Det regner, og regnjakka mi er til vask. På grunn av regnet.',
    },
  },
  {
    when: (f) => f.raining,
    text: {
      en: 'Raining again. I have decided to wait until it stops, however long that takes.',
      fi: 'Taas sataa. Päätin odottaa, kunnes se loppuu, kesti se kuinka kauan tahansa.',
      sv: 'Regn igen. Jag har bestämt mig för att vänta tills det slutar, hur länge det än tar.',
      nb: 'Regn igjen. Jeg har bestemt meg for å vente til det slutter, uansett hvor lang tid det tar.',
    },
  },
  {
    when: (f) => !!f.rainFrom,
    text: {
      en: 'Rain from about {rainFrom}. If I leave now, I will be soaked exactly halfway.',
      fi: 'Sadetta noin klo {rainFrom} alkaen. Jos lähden nyt, kastun täsmälleen puolimatkassa.',
      sv: 'Regn från omkring kl. {rainFrom}. Går jag nu blir jag genomblöt exakt halvvägs.',
      nb: 'Regn fra rundt kl. {rainFrom}. Drar jeg nå, blir jeg gjennomvåt nøyaktig halvveis.',
    },
  },
  {
    when: (f) => !!f.rainFrom,
    text: {
      en: 'Rain at {rainFrom}. I have calculated it: staying in is the only dry option.',
      fi: 'Sadetta klo {rainFrom}. Laskin sen: sisällä pysyminen on ainoa kuiva vaihtoehto.',
      sv: 'Regn kl. {rainFrom}. Jag har räknat på det: att stanna inne är det enda torra alternativet.',
      nb: 'Regn kl. {rainFrom}. Jeg har regnet på det: å bli inne er det eneste tørre alternativet.',
    },
  },
  {
    when: (f) => !!f.percent,
    text: {
      en: '{percent} chance of rain. I only go out on 0 % days. It is a lifestyle.',
      fi: 'Sateen todennäköisyys {percent}. Lähden ulos vain 0 %:n päivinä. Se on elämäntapa.',
      sv: '{percent} risk för regn. Jag går bara ut på 0 %-dagar. Det är en livsstil.',
      nb: '{percent} sjanse for regn. Jeg går bare ut på 0 %-dager. Det er en livsstil.',
    },
  },
  {
    when: (f) => !!f.percent,
    text: {
      en: 'The forecast says {percent} rain. I never argue with a percentage.',
      fi: 'Ennuste sanoo sateen todennäköisyydeksi {percent}. En koskaan kiistele prosenttien kanssa.',
      sv: 'Prognosen säger {percent} risk för regn. Jag bråkar aldrig med en procentsats.',
      nb: 'Værmeldingen sier {percent} sjanse for regn. Jeg krangler aldri med en prosentsats.',
    },
  },
  // ── Snow ──
  {
    when: (f) => !!f.snow,
    text: {
      en: '{snow} of fresh snow. I have to build a snowman before the neighbours do. It is a competition.',
      fi: '{snow} uutta lunta. Minun pitää tehdä lumiukko ennen naapureita. Tämä on kilpailu.',
      sv: '{snow} nysnö. Jag måste bygga en snögubbe före grannarna. Det är en tävling.',
      nb: '{snow} nysnø. Jeg må lage en snømann før naboene. Det er en konkurranse.',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: '{snow} of snow fell on my car. Somewhere under there is a car. Probably mine.',
      fi: 'Autoni päälle satoi {snow} lunta. Jossain tuolla alla on auto. Luultavasti minun.',
      sv: '{snow} snö föll på min bil. Någonstans där under finns en bil. Förmodligen min.',
      nb: '{snow} snø falt på bilen min. Et sted der under er det en bil. Sannsynligvis min.',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: '{snow} of snow today. I am shovelling the drive, then the drive of the drive.',
      fi: '{snow} lunta tänään. Lapioin pihatien ja sitten pihatien pihatien.',
      sv: '{snow} snö i dag. Jag skottar uppfarten och sedan uppfartens uppfart.',
      nb: '{snow} snø i dag. Jeg måker oppkjørselen og så oppkjørselens oppkjørsel.',
    },
  },
  {
    when: (f) => !!f.snowFrom,
    text: {
      en: 'Snow from about {snowFrom}. I need to be home in case it needs me.',
      fi: 'Lunta noin klo {snowFrom} alkaen. Minun pitää olla kotona siltä varalta, että se tarvitsee minua.',
      sv: 'Snö från omkring kl. {snowFrom}. Jag måste vara hemma ifall den behöver mig.',
      nb: 'Snø fra rundt kl. {snowFrom}. Jeg må være hjemme i tilfelle den trenger meg.',
    },
  },
  {
    when: (f) => !!f.snowFrom,
    text: {
      en: 'Snow on the way from {snowFrom}. I am stocking up on cocoa. This takes all day.',
      fi: 'Lunta tulossa klo {snowFrom} alkaen. Hamstraan kaakaota. Siihen menee koko päivä.',
      sv: 'Snö på väg från kl. {snowFrom}. Jag bunkrar varm choklad. Det tar hela dagen.',
      nb: 'Snø på vei fra kl. {snowFrom}. Jeg hamstrer kakao. Det tar hele dagen.',
    },
  },
  // ── Very cold ──
  {
    when: (f) => f.veryCold,
    text: {
      en: 'It is {temp}. My coffee froze between the pot and the cup.',
      fi: 'On {temp}. Kahvini jäätyi pannun ja kupin välissä.',
      sv: 'Det är {temp}. Mitt kaffe frös mellan kannan och koppen.',
      nb: 'Det er {temp}. Kaffen frøs mellom kanna og koppen.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp}. I said a word outside and it is still hanging in the air.',
      fi: '{temp}. Sanoin ulkona yhden sanan, ja se roikkuu yhä ilmassa.',
      sv: '{temp}. Jag sa ett ord ute och det hänger fortfarande kvar i luften.',
      nb: '{temp}. Jeg sa et ord ute, og det henger fortsatt i lufta.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: 'At {temp} my phone battery died, and so did my motivation.',
      fi: 'Kun on {temp}, puhelimeni akku kuoli, ja niin kuoli motivaationikin.',
      sv: 'I {temp} dog mitt mobilbatteri, och det gjorde min motivation också.',
      nb: 'I {temp} døde mobilbatteriet mitt, og det gjorde motivasjonen min også.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp}. The door froze shut. From the inside. I respect its decision.',
      fi: '{temp}. Ovi jäätyi kiinni. Sisäpuolelta. Kunnioitan sen päätöstä.',
      sv: '{temp}. Dörren frös fast. Inifrån. Jag respekterar dess beslut.',
      nb: '{temp}. Døra frøs fast. Fra innsiden. Jeg respekterer avgjørelsen.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp}. I am wearing every piece of clothing I own and still cannot bend my arms to open the door.',
      fi: '{temp}. Minulla on päällä kaikki vaatteeni, enkä saa käsiäni taivutettua avatakseni oven.',
      sv: '{temp}. Jag har på mig alla kläder jag äger och kan inte böja armarna för att öppna dörren.',
      nb: '{temp}. Jeg har på meg alle klærne jeg eier og får ikke bøyd armene for å åpne døra.',
    },
  },
  // ── Freezing ──
  {
    when: (f) => f.freezing,
    text: {
      en: '{temp} and ice everywhere. I am practising my penguin walk. Not ready yet.',
      fi: '{temp} ja jäätä kaikkialla. Harjoittelen pingviinikävelyä. En ole vielä valmis.',
      sv: '{temp} och is överallt. Jag övar på min pingvingång. Inte redo än.',
      nb: '{temp} og is overalt. Jeg øver på pingvingangen. Ikke klar ennå.',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: 'It is {temp}. My car is a block of ice with a car-shaped dent.',
      fi: 'On {temp}. Autoni on jääkimpale, jossa on auton muotoinen kolo.',
      sv: 'Det är {temp}. Min bil är ett isblock med en bilformad grop.',
      nb: 'Det er {temp}. Bilen min er en isblokk med en bilformet bulk.',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: '{temp}. The pavement is a skating rink and I left my skates in 1998.',
      fi: '{temp}. Jalkakäytävä on luistinrata, ja jätin luistimeni vuoteen 1998.',
      sv: '{temp}. Trottoaren är en skridskobana och jag lämnade mina skridskor 1998.',
      nb: '{temp}. Fortauet er en skøytebane, og jeg la igjen skøytene mine i 1998.',
    },
  },
  // ── Cool ──
  {
    when: (f) => f.cool,
    text: {
      en: '{temp}. Too warm for a winter coat, too cold for a jacket. I am stuck at the wardrobe.',
      fi: '{temp}. Liian lämmin talvitakille, liian kylmä takille. Olen jumissa vaatekaapilla.',
      sv: '{temp}. För varmt för vinterjacka, för kallt för jacka. Jag sitter fast vid garderoben.',
      nb: '{temp}. For varmt til vinterjakke, for kaldt til jakke. Jeg står fast ved garderoben.',
    },
  },
  {
    when: (f) => f.cool,
    text: {
      en: 'It is {temp}. Perfect weather for staying under a blanket, which I am now doing professionally.',
      fi: 'On {temp}. Täydellinen sää peiton alla olemiseen, mitä teen nyt ammattimaisesti.',
      sv: 'Det är {temp}. Perfekt väder för att ligga under en filt, vilket jag nu gör professionellt.',
      nb: 'Det er {temp}. Perfekt vær for å ligge under et pledd, noe jeg nå gjør profesjonelt.',
    },
  },
  // ── Mild ──
  {
    when: (f) => f.mild,
    text: {
      en: '{temp} and mild. Too nice to sit inside, too ordinary to go out. Tough call.',
      fi: '{temp} ja leutoa. Liian mukavaa sisällä istumiseen, liian tavallista ulos lähtemiseen. Vaikea valinta.',
      sv: '{temp} och milt. För fint för att sitta inne, för vanligt för att gå ut. Svårt val.',
      nb: '{temp} og mildt. For fint til å sitte inne, for vanlig til å gå ut. Vanskelig valg.',
    },
  },
  {
    when: (f) => f.mild,
    text: {
      en: 'Mild weather, {temp}. My body thinks it is spring and has started a big clean. I cannot stop it.',
      fi: 'Leutoa, {temp}. Kehoni luulee, että on kevät, ja aloitti suursiivouksen. En voi pysäyttää sitä.',
      sv: 'Milt väder, {temp}. Kroppen tror att det är vår och har börjat storstäda. Jag kan inte stoppa den.',
      nb: 'Mildt vær, {temp}. Kroppen tror det er vår og har begynt med storrengjøring. Jeg klarer ikke stoppe den.',
    },
  },
  // ── Warm and sunny / nice ──
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: '{temp} and sunny. I have to go and lie on a jetty. Doctor’s orders (I am the doctor).',
      fi: '{temp} ja aurinkoista. Minun pitää mennä makaamaan laiturille. Lääkärin määräys (minä olen lääkäri).',
      sv: '{temp} och sol. Jag måste ligga på en brygga. Läkarordination (jag är läkaren).',
      nb: '{temp} og sol. Jeg må ligge på en brygge. Legens ordre (jeg er legen).',
    },
  },
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: 'Sunny and {temp}. I have only so many sunny days in my life and I am using one now.',
      fi: 'Aurinkoista ja {temp}. Minulla on elämässäni vain rajallisesti aurinkoisia päiviä, ja käytän yhden nyt.',
      sv: 'Sol och {temp}. Jag har bara ett visst antal soliga dagar i livet och använder en nu.',
      nb: 'Sol og {temp}. Jeg har bare et visst antall solfylte dager i livet, og jeg bruker en nå.',
    },
  },
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: '{temp} and sunshine. In the Nordics, skipping a day like this is illegal.',
      fi: '{temp} ja auringonpaistetta. Suomessa tällaisen päivän väliin jättäminen on laitonta.',
      sv: '{temp} och solsken. I Norden är det olagligt att missa en sådan här dag.',
      nb: '{temp} og solskinn. I Norden er det ulovlig å gå glipp av en dag som denne.',
    },
  },
  {
    when: (f) => f.niceAndSunny,
    text: {
      en: '{temp} and sunny. The ice cream will not eat itself.',
      fi: '{temp} ja aurinkoista. Jäätelö ei syö itseään.',
      sv: '{temp} och sol. Glassen äter inte upp sig själv.',
      nb: '{temp} og sol. Isen spiser ikke seg selv.',
    },
  },
  // ── Heat ──
  {
    when: (f) => f.heat,
    text: {
      en: '{temp}. I am a Nordic person. My operating range ends at 22.',
      fi: '{temp}. Olen pohjoismainen. Toiminta-alueeni loppuu 22 asteeseen.',
      sv: '{temp}. Jag är nordbo. Mitt driftsområde slutar vid 22 grader.',
      nb: '{temp}. Jeg er nordbo. Driftsområdet mitt slutter på 22 grader.',
    },
  },
  {
    when: (f) => f.heat,
    text: {
      en: '{temp}. I am living in the fridge now. There is just enough room if I take out the milk.',
      fi: '{temp}. Asun nyt jääkaapissa. Tilaa on juuri sen verran, kun otan maidon pois.',
      sv: '{temp}. Jag bor i kylskåpet nu. Det finns precis plats om jag tar ut mjölken.',
      nb: '{temp}. Jeg bor i kjøleskapet nå. Det er akkurat plass hvis jeg tar ut melka.',
    },
  },
  {
    when: (f) => f.heat,
    text: {
      en: 'It is {temp}. The tarmac and I have both melted. We are discussing it.',
      fi: 'On {temp}. Asfaltti ja minä olemme molemmat sulaneet. Keskustelemme asiasta.',
      sv: 'Det är {temp}. Asfalten och jag har båda smält. Vi diskuterar saken.',
      nb: 'Det er {temp}. Asfalten og jeg har begge smeltet. Vi diskuterer saken.',
    },
  },
  {
    when: (f) => f.hot,
    text: {
      en: '{temp}. I tried to go out, but the door handle was hotter than the sauna.',
      fi: '{temp}. Yritin lähteä ulos, mutta ovenkahva oli kuumempi kuin sauna.',
      sv: '{temp}. Jag försökte gå ut, men dörrhandtaget var varmare än bastun.',
      nb: '{temp}. Jeg prøvde å gå ut, men dørhåndtaket var varmere enn badstua.',
    },
  },
  // ── Wind chill ──
  {
    when: (f) => f.feelsColder,
    text: {
      en: 'It says {temp}, but it feels like {feels}. I go by feelings.',
      fi: 'Mittari näyttää {temp}, mutta tuntuu kuin olisi {feels}. Menen tunteiden mukaan.',
      sv: 'Det står {temp}, men det känns som {feels}. Jag går efter känslan.',
      nb: 'Det står {temp}, men det føles som {feels}. Jeg går etter følelsen.',
    },
  },
  {
    when: (f) => f.feelsColder,
    text: {
      en: 'Feels like {feels}. The thermometer is lying and I will not reward it by going out.',
      fi: 'Tuntuu kuin olisi {feels}. Lämpömittari valehtelee, enkä palkitse sitä lähtemällä ulos.',
      sv: 'Känns som {feels}. Termometern ljuger och jag tänker inte belöna den genom att gå ut.',
      nb: 'Føles som {feels}. Termometeret lyver, og jeg vil ikke belønne det ved å gå ut.',
    },
  },
  // ── Fog ──
  {
    when: (f) => f.fog,
    text: {
      en: 'Fog so thick I waved at a lamp post for five minutes.',
      fi: 'Niin sakea sumu, että vilkutin lyhtypylväälle viisi minuuttia.',
      sv: 'Så tät dimma att jag vinkade till en lyktstolpe i fem minuter.',
      nb: 'Så tett tåke at jeg vinket til en lyktestolpe i fem minutter.',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: 'Fog. I cannot prove the office still exists.',
      fi: 'Sumua. En pysty todistamaan, että toimisto on vielä olemassa.',
      sv: 'Dimma. Jag kan inte bevisa att kontoret fortfarande finns.',
      nb: 'Tåke. Jeg kan ikke bevise at kontoret fortsatt finnes.',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: 'In this fog I followed a stranger for a while. Turned out to be my reflection.',
      fi: 'Tässä sumussa seurasin hetken tuntematonta. Se osoittautui omaksi peilikuvakseni.',
      sv: 'I den här dimman följde jag en främling en stund. Det visade sig vara min spegelbild.',
      nb: 'I denne tåka fulgte jeg en fremmed en stund. Det viste seg å være mitt eget speilbilde.',
    },
  },
  // ── Grey ──
  {
    when: (f) => f.grey,
    text: {
      en: 'Fully grey sky. I am in energy-saving mode until further notice.',
      fi: 'Täysin harmaa taivas. Olen virransäästötilassa toistaiseksi.',
      sv: 'Helt grå himmel. Jag är i energisparläge tills vidare.',
      nb: 'Helt grå himmel. Jeg er i strømsparemodus inntil videre.',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'Overcast again. My solar-powered personality is not charging.',
      fi: 'Taas pilvistä. Aurinkovoimalla toimiva persoonallisuuteni ei lataudu.',
      sv: 'Mulet igen. Min soldrivna personlighet laddas inte.',
      nb: 'Overskyet igjen. Den soldrevne personligheten min lader ikke.',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'The sky is one big grey lid. I am waiting for someone to open it.',
      fi: 'Taivas on yksi iso harmaa kansi. Odotan, että joku avaa sen.',
      sv: 'Himlen är ett enda stort grått lock. Jag väntar på att någon ska öppna det.',
      nb: 'Himmelen er ett stort, grått lokk. Jeg venter på at noen skal åpne det.',
    },
  },
  // ── Clear ──
  {
    when: (f) => f.clear,
    text: {
      en: 'Clear blue sky. I have to stare at it before it changes its mind.',
      fi: 'Kirkas sininen taivas. Minun pitää tuijottaa sitä ennen kuin se muuttaa mielensä.',
      sv: 'Klarblå himmel. Jag måste stirra på den innan den ändrar sig.',
      nb: 'Klarblå himmel. Jeg må stirre på den før den ombestemmer seg.',
    },
  },
  // ── Thunder ──
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunder around {thunderAt}. My dog and I are hiding under the table until it passes. He insisted.',
      fi: 'Ukkosta noin klo {thunderAt}. Koirani ja minä piilotamme pöydän alla, kunnes se menee ohi. Hän vaati.',
      sv: 'Åska omkring kl. {thunderAt}. Min hund och jag gömmer oss under bordet tills den går över. Han insisterade.',
      nb: 'Torden rundt kl. {thunderAt}. Hunden min og jeg gjemmer oss under bordet til den går over. Han insisterte.',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunder expected at {thunderAt}. I am unplugging everything, including myself.',
      fi: 'Ukkosta odotetaan klo {thunderAt}. Irrotan kaikki töpselit, myös omani.',
      sv: 'Åska väntas kl. {thunderAt}. Jag drar ur alla sladdar, inklusive min egen.',
      nb: 'Torden ventes kl. {thunderAt}. Jeg trekker ut alle støpsler, inkludert mitt eget.',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunder at {thunderAt}. I count the seconds after every flash, and that is a full-time job.',
      fi: 'Ukkosta klo {thunderAt}. Lasken sekunteja jokaisen salaman jälkeen, ja se on kokopäivätyö.',
      sv: 'Åska kl. {thunderAt}. Jag räknar sekunderna efter varje blixt, och det är ett heltidsjobb.',
      nb: 'Torden kl. {thunderAt}. Jeg teller sekundene etter hvert lyn, og det er en fulltidsjobb.',
    },
  },
  // ── UV ──
  {
    when: (f) => !!f.uv,
    text: {
      en: 'UV {uv}. My skin has only two settings: white and lobster.',
      fi: 'UV {uv}. Ihollani on vain kaksi asetusta: valkoinen ja hummeri.',
      sv: 'UV {uv}. Min hud har bara två lägen: vit och hummer.',
      nb: 'UV {uv}. Huden min har bare to innstillinger: hvit og hummer.',
    },
  },
  {
    when: (f) => !!f.uv,
    text: {
      en: 'UV {uv}. I am waiting for a cloud. Any cloud.',
      fi: 'UV {uv}. Odotan pilveä. Mitä tahansa pilveä.',
      sv: 'UV {uv}. Jag väntar på ett moln. Vilket moln som helst.',
      nb: 'UV {uv}. Jeg venter på en sky. Hvilken som helst sky.',
    },
  },
  // ── Darkness and light ──
  {
    when: (f) => f.darkMorning,
    text: {
      en: 'The sun rises at {sunrise}. I am not getting up before it; it would be rude.',
      fi: 'Aurinko nousee klo {sunrise}. En nouse ennen sitä; se olisi epäkohteliasta.',
      sv: 'Solen går upp kl. {sunrise}. Jag stiger inte upp före den; det vore oartigt.',
      nb: 'Sola står opp kl. {sunrise}. Jeg står ikke opp før den; det ville vært uhøflig.',
    },
  },
  {
    when: (f) => f.darkMorning,
    text: {
      en: 'Still dark until {sunrise}. My body is officially in night mode.',
      fi: 'Pimeää klo {sunrise} asti. Kehoni on virallisesti yötilassa.',
      sv: 'Mörkt till kl. {sunrise}. Min kropp är officiellt i nattläge.',
      nb: 'Mørkt til kl. {sunrise}. Kroppen min er offisielt i nattmodus.',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: 'The sun set at {sunset}. It is basically midnight, and I do not go out at midnight.',
      fi: 'Aurinko laski klo {sunset}. Käytännössä on keskiyö, enkä lähde ulos keskiyöllä.',
      sv: 'Solen gick ned kl. {sunset}. Det är i princip midnatt, och jag går inte ut vid midnatt.',
      nb: 'Sola gikk ned kl. {sunset}. Det er praktisk talt midnatt, og jeg går ikke ut ved midnatt.',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: 'Dark since {sunset}. I have entered hibernation. Wake me in April.',
      fi: 'Pimeää klo {sunset} lähtien. Olen siirtynyt talviunille. Herättäkää huhtikuussa.',
      sv: 'Mörkt sedan kl. {sunset}. Jag har gått i ide. Väck mig i april.',
      nb: 'Mørkt siden kl. {sunset}. Jeg har gått i hi. Vekk meg i april.',
    },
  },
  {
    when: (f) => !!f.sunsetAt,
    text: {
      en: 'The sun sets at {sunsetAt}. If I go now, I will only see the dark half of the day.',
      fi: 'Aurinko laskee klo {sunsetAt}. Jos lähden nyt, näen vain päivän pimeän puolen.',
      sv: 'Solen går ned kl. {sunsetAt}. Går jag nu ser jag bara dagens mörka halva.',
      nb: 'Sola går ned kl. {sunsetAt}. Drar jeg nå, ser jeg bare den mørke halvdelen av dagen.',
    },
  },
  {
    when: (f) => !!f.daylight,
    text: {
      en: 'Only {daylight} of daylight. I am saving mine for the weekend.',
      fi: 'Vain {daylight} valoisaa. Säästän omani viikonloppuun.',
      sv: 'Bara {daylight} dagsljus. Jag sparar mitt till helgen.',
      nb: 'Bare {daylight} dagslys. Jeg sparer mitt til helgen.',
    },
  },
  {
    when: (f) => !!f.daylight,
    text: {
      en: '{daylight} of daylight today. By the time I find my shoes, it will be over.',
      fi: '{daylight} valoisaa tänään. Kun löydän kenkäni, se on jo ohi.',
      sv: '{daylight} dagsljus i dag. När jag har hittat skorna är det över.',
      nb: '{daylight} dagslys i dag. Når jeg har funnet skoene, er det over.',
    },
  },
  {
    when: (f) => !!f.shorter,
    text: {
      en: '{shorter} min less daylight tomorrow. I am saving energy for the long winter.',
      fi: 'Huomenna {shorter} min vähemmän valoa. Säästän energiaa pitkää talvea varten.',
      sv: '{shorter} min mindre dagsljus i morgon. Jag sparar energi inför den långa vintern.',
      nb: '{shorter} min mindre dagslys i morgen. Jeg sparer energi til den lange vinteren.',
    },
  },
  {
    when: (f) => !!f.longer,
    text: {
      en: '{longer} min more daylight tomorrow. I am staying home to watch it happen.',
      fi: 'Huomenna {longer} min enemmän valoa. Jään kotiin katsomaan, kun se tapahtuu.',
      sv: '{longer} min mer dagsljus i morgon. Jag stannar hemma och tittar på när det händer.',
      nb: '{longer} min mer dagslys i morgen. Jeg blir hjemme og ser på at det skjer.',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: 'Polar night. Technically it is still yesterday, so I already went.',
      fi: 'Kaamos. Teknisesti on vielä eilinen, joten kävin jo.',
      sv: 'Polarnatt. Tekniskt sett är det fortfarande i går, så jag har redan varit där.',
      nb: 'Mørketid. Teknisk sett er det fortsatt i går, så jeg har allerede vært der.',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: 'The sun is on holiday. Out of solidarity, so am I.',
      fi: 'Aurinko on lomalla. Solidaarisuudesta olen minäkin.',
      sv: 'Solen har semester. Av solidaritet har jag det också.',
      nb: 'Sola har ferie. Av solidaritet har jeg det også.',
    },
  },
  {
    when: (f) => f.midnightSun,
    text: {
      en: 'Midnight sun. I have not slept since May and I am not sure what day it is.',
      fi: 'Yötön yö. En ole nukkunut toukokuun jälkeen, enkä ole varma, mikä päivä on.',
      sv: 'Midnattssol. Jag har inte sovit sedan maj och vet inte säkert vilken dag det är.',
      nb: 'Midnattssol. Jeg har ikke sovet siden mai og er ikke sikker på hvilken dag det er.',
    },
  },
  {
    when: (f) => f.midnightSun,
    text: {
      en: 'The sun never sets, so technically my working day never started.',
      fi: 'Aurinko ei laske koskaan, joten teknisesti työpäiväni ei ole koskaan alkanut.',
      sv: 'Solen går aldrig ned, så tekniskt sett har min arbetsdag aldrig börjat.',
      nb: 'Sola går aldri ned, så teknisk sett har arbeidsdagen min aldri begynt.',
    },
  },
  // ── Tomorrow ──
  {
    when: (f) => !!f.colder,
    text: {
      en: 'It will be {colder}° colder tomorrow, so I am staying in today to get used to it.',
      fi: 'Huomenna on {colder}° kylmempää, joten pysyn tänään sisällä totuttelemassa.',
      sv: 'Det blir {colder}° kallare i morgon, så jag stannar inne i dag för att vänja mig.',
      nb: 'Det blir {colder}° kaldere i morgen, så jeg blir inne i dag for å venne meg til det.',
    },
  },
  {
    when: (f) => !!f.warmer,
    text: {
      en: 'It will be {warmer}° warmer tomorrow. Why waste today going out?',
      fi: 'Huomenna on {warmer}° lämpimämpää. Miksi tuhlata tämä päivä ulkona?',
      sv: 'Det blir {warmer}° varmare i morgon. Varför slösa bort i dag på att gå ut?',
      nb: 'Det blir {warmer}° varmere i morgen. Hvorfor kaste bort i dag på å gå ut?',
    },
  },
  {
    when: (f) => !!f.weekend,
    text: {
      en: 'The weekend looks like {weekend}. I have to rest now so I am ready for it.',
      fi: 'Viikonloppuna luvassa {weekend}. Minun pitää levätä nyt, jotta olen valmis.',
      sv: 'Helgen ser ut att bli {weekend}. Jag måste vila nu så att jag är redo.',
      nb: 'Helgen ser ut til å bli {weekend}. Jeg må hvile nå så jeg er klar.',
    },
  },
  // ── Beer outside ──
  {
    when: (f) => f.beerWarms,
    text: {
      en: 'A cold beer goes warm in about {beerTime} out there. I cannot risk that.',
      fi: 'Kylmä olut lämpenee ulkona noin {beerTime} kuluessa. En voi ottaa sitä riskiä.',
      sv: 'En kall öl blir varm på ungefär {beerTime} där ute. Den risken kan jag inte ta.',
      nb: 'En kald øl blir varm på omtrent {beerTime} der ute. Den risikoen kan jeg ikke ta.',
    },
  },
  {
    when: (f) => f.beerFreezes,
    text: {
      en: 'A beer would freeze in about {beerTime} outside. Neither of us is going out.',
      fi: 'Olut jäätyisi ulkona noin {beerTime} kuluessa. Kumpikaan meistä ei lähde ulos.',
      sv: 'En öl skulle frysa på ungefär {beerTime} ute. Ingen av oss går ut.',
      nb: 'En øl ville frosset på omtrent {beerTime} ute. Ingen av oss går ut.',
    },
  },
  {
    when: (f) => f.beerStaysCold,
    text: {
      en: 'The weather keeps beer perfectly cold outside. I have to stay and guard it.',
      fi: 'Sää pitää oluen täydellisen kylmänä ulkona. Minun pitää jäädä vartioimaan sitä.',
      sv: 'Vädret håller ölen perfekt kall ute. Jag måste stanna och vakta den.',
      nb: 'Været holder ølet perfekt kaldt ute. Jeg må bli og vokte det.',
    },
  },
  // ── Humid and pressure ──
  {
    when: (f) => !!f.humidity,
    text: {
      en: 'Humidity {humidity}. The air is basically soup and I do not eat soup outside.',
      fi: 'Ilmankosteus {humidity}. Ilma on käytännössä keittoa, enkä syö keittoa ulkona.',
      sv: 'Luftfuktighet {humidity}. Luften är i princip soppa, och jag äter inte soppa ute.',
      nb: 'Luftfuktighet {humidity}. Lufta er praktisk talt suppe, og jeg spiser ikke suppe ute.',
    },
  },
  {
    when: (f) => f.pressureFalling,
    text: {
      en: 'The air pressure is dropping. I am staying low too, on the sofa.',
      fi: 'Ilmanpaine laskee. Minäkin pysyttelen matalana, sohvalla.',
      sv: 'Lufttrycket sjunker. Jag håller mig också lågt, i soffan.',
      nb: 'Lufttrykket synker. Jeg holder meg også lavt, på sofaen.',
    },
  },
  {
    when: (f) => f.pressureFalling,
    text: {
      en: 'Falling air pressure. My knees predicted this two days ago and they want a day off.',
      fi: 'Ilmanpaine laskee. Polveni ennustivat tämän kaksi päivää sitten, ja ne haluavat vapaapäivän.',
      sv: 'Sjunkande lufttryck. Mina knän förutsåg det för två dagar sedan och vill ha ledigt.',
      nb: 'Synkende lufttrykk. Knærne mine spådde dette for to dager siden og vil ha fri.',
    },
  },
  // ── Always fitting ──
  {
    when: always,
    text: {
      en: "It's {temp} and {weather}. I have read the forecast three times and it is not changing.",
      fi: 'On {temp} ja {weather}. Luin ennusteen kolmesti, eikä se muutu.',
      sv: 'Det är {temp} och {weather}. Jag har läst prognosen tre gånger och den ändras inte.',
      nb: 'Det er {temp} og {weather}. Jeg har lest værmeldingen tre ganger, og den endrer seg ikke.',
    },
  },
  {
    when: always,
    text: {
      en: 'Today is {weather}. I am waiting for tomorrow: {tomorrow}, up to {tomorrowHigh}.',
      fi: 'Tänään {weather}. Odotan huomista: {tomorrow}, enimmillään {tomorrowHigh}.',
      sv: 'I dag är det {weather}. Jag väntar på i morgon: {tomorrow}, upp till {tomorrowHigh}.',
      nb: 'I dag er det {weather}. Jeg venter på i morgen: {tomorrow}, opp til {tomorrowHigh}.',
    },
  },
  {
    when: always,
    text: {
      en: 'Weather app says {weather}, {temp}. My blanket says stay. The blanket outranks the app.',
      fi: 'Sääsovellus sanoo {weather}, {temp}. Peittoni sanoo jää. Peitto on sovellusta ylempänä.',
      sv: 'Väderappen säger {weather}, {temp}. Min filt säger stanna. Filten går före appen.',
      nb: 'Værappen sier {weather}, {temp}. Pleddet mitt sier bli. Pleddet går foran appen.',
    },
  },
  {
    when: always,
    text: {
      en: 'At {temp} with {weather}, my sofa has filed a formal request for my company.',
      fi: 'Kun on {temp} ja {weather}, sohvani on jättänyt virallisen pyynnön seurastani.',
      sv: 'I {temp} och {weather} har min soffa lämnat in en formell begäran om mitt sällskap.',
      nb: 'I {temp} og {weather} har sofaen min sendt en formell forespørsel om mitt selskap.',
    },
  },
  {
    when: always,
    text: {
      en: "It's {weather} and {temp}. I checked with my cat and we agree: not today.",
      fi: 'Ulkona {weather} ja {temp}. Kysyin kissaltani, ja olemme samaa mieltä: ei tänään.',
      sv: 'Det är {weather} och {temp}. Jag frågade min katt och vi är överens: inte i dag.',
      nb: 'Det er {weather} og {temp}. Jeg spurte katten min, og vi er enige: ikke i dag.',
    },
  },
  {
    when: always,
    text: {
      en: "It's {temp}. I was going to come, then I saw the word '{weather}' and needed to sit down.",
      fi: 'On {temp}. Olin tulossa, mutta näin sanan ”{weather}” ja minun piti istua alas.',
      sv: 'Det är {temp}. Jag skulle komma, men sedan såg jag ordet ”{weather}” och behövde sätta mig.',
      nb: 'Det er {temp}. Jeg skulle komme, men så så jeg ordet «{weather}» og måtte sette meg ned.',
    },
  },
  {
    when: always,
    text: {
      en: 'Tomorrow is {tomorrow}. I will be there tomorrow. Probably. Weather permitting.',
      fi: 'Huomenna {tomorrow}. Tulen huomenna. Luultavasti. Sään salliessa.',
      sv: 'I morgon blir det {tomorrow}. Jag kommer i morgon. Förmodligen. Om vädret tillåter.',
      nb: 'I morgen blir det {tomorrow}. Jeg kommer i morgen. Sannsynligvis. Hvis været tillater det.',
    },
  },
];
