// Weather excuses, just for fun: a reason not to go anywhere, made from the
// real weather ("My cat is now a kite. Gusts of 25 mph from SW."). Some
// mild, many over the top. Each fits only when its facts are true
// (facts.ts); the last ones always fit, so there's always something.
// Written as jokes that work in each language, not word for word.

import { MORE_EXCUSES } from './excuses-more';
import { linesFor, type Line } from './facts';
import type { Forecast } from '../weather/api';

const always = () => true;

export const EXCUSES: readonly Line[] = [
  {
    when: (f) => !!f.gusts,
    text: {
      en: "Sorry I'm late: gusts of {gusts} {from} kept blowing me back home.",
      fi: 'Sori, myöhästyn: {gusts} puuskat {from} puhalsivat minut takaisin kotiin.',
      sv: 'Förlåt att jag är sen: vindbyar på {gusts} {from} blåste mig hem igen.',
      nb: 'Beklager at jeg er sen: vindkast på {gusts} {from} blåste meg hjem igjen.',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: "My cat is now a kite. Gusts of {gusts} {from}. I'm following it; I'll probably end up in Sweden.",
      fi: 'Kissani on nyt leija. {gusts} puuskat {from}. Lähden perään, taidan päätyä Ruotsiin.',
      sv: 'Min katt är nu en drake. Vindbyar på {gusts} {from}. Jag följer efter och hamnar nog i Finland.',
      nb: 'Katten min er nå en drage. Vindkast på {gusts} {from}. Jeg følger etter og havner nok i Sverige.',
    },
  },
  {
    when: (f) => !!f.wind,
    text: {
      en: "Can't cycle today: {wind} of headwind. Both ways, somehow.",
      fi: 'En pysty pyöräilemään tänään: {wind} vastatuulta. Jotenkin molempiin suuntiin.',
      sv: 'Kan inte cykla i dag: {wind} motvind. Åt båda hållen, på något sätt.',
      nb: 'Kan ikke sykle i dag: {wind} motvind. Begge veier, på et vis.',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: "Can't make it: {amount} of rain is coming and I'm not waterproof.",
      fi: 'En pääse: {amount} sadetta on tulossa, enkä ole vedenpitävä.',
      sv: 'Jag kan inte komma: {amount} regn är på väg och jag är inte vattentät.',
      nb: 'Jeg kommer ikke: {amount} regn er på vei, og jeg er ikke vanntett.',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: "{amount} of rain is coming. I've started building an ark and can't leave the project now.",
      fi: '{amount} sadetta on tulossa. Aloitin arkin rakentamisen, enkä voi jättää projektia kesken.',
      sv: '{amount} regn är på väg. Jag har börjat bygga en ark och kan inte lämna projektet nu.',
      nb: '{amount} regn er på vei. Jeg har begynt å bygge en ark og kan ikke forlate prosjektet nå.',
    },
  },
  {
    when: (f) => !!f.amount && !!f.gusts,
    text: {
      en: 'Horizontal rain. My umbrella left without me.',
      fi: 'Vaakasuoraa sadetta. Sateenvarjoni lähti ilman minua.',
      sv: 'Vågrätt regn. Mitt paraply gick utan mig.',
      nb: 'Vannrett regn. Paraplyen min dro uten meg.',
    },
  },
  {
    when: (f) => !!f.percent,
    text: {
      en: "Staying in: {percent} chance of rain, and I don't like those odds.",
      fi: 'Jään sisälle: sateen todennäköisyys {percent}, enkä pidä noista kertoimista.',
      sv: 'Jag stannar inne: {percent} risk för regn, och jag gillar inte de oddsen.',
      nb: 'Jeg blir inne: {percent} sjanse for regn, og jeg liker ikke de oddsene.',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: 'Snowed in: {snow} of fresh snow today and the shovel is losing.',
      fi: 'Lumen saartama: {snow} uutta lunta tänään, ja lumilapio häviää.',
      sv: 'Insnöad: {snow} nysnö i dag och snöskyffeln förlorar.',
      nb: 'Snødd inne: {snow} nysnø i dag, og snøskuffa taper.',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: "{snow} of snow. I'm not snowed in, I live in an igloo now. It's very cosy.",
      fi: '{snow} lunta. En ole lumen saartama, asun nyt iglussa. Täällä on tosi kodikasta.',
      sv: '{snow} snö. Jag är inte insnöad, jag bor i en igloo nu. Det är väldigt mysigt.',
      nb: '{snow} snø. Jeg er ikke snødd inne, jeg bor i en iglo nå. Det er veldig koselig.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: "My car won't start at {temp}. Neither will I.",
      fi: 'Auto ei käynnisty, kun on {temp}. En käynnisty minäkään.',
      sv: 'Bilen startar inte i {temp}. Inte jag heller.',
      nb: 'Bilen starter ikke i {temp}. Ikke jeg heller.',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: "At {temp} my eyelashes froze together. I'm typing this by touch.",
      fi: 'Kun on {temp}, ripseni jäätyivät yhteen. Kirjoitan tätä tunnustelemalla.',
      sv: 'I {temp} frös mina ögonfransar ihop. Jag skriver det här på känn.',
      nb: 'I {temp} frøs øyevippene mine sammen. Jeg skriver dette på følelsen.',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: 'Running late: had to scrape the windscreen at {temp}.',
      fi: 'Myöhästyn: piti raapia tuulilasia, kun on {temp}.',
      sv: 'Jag blir sen: fick skrapa rutan i {temp}.',
      nb: 'Jeg blir sen: måtte skrape ruta i {temp}.',
    },
  },
  {
    when: (f) => f.hot,
    text: {
      en: "Working from the shade today: it's {temp}.",
      fi: 'Teen tänään töitä varjosta käsin: on {temp}.',
      sv: 'Jobbar från skuggan i dag: det är {temp}.',
      nb: 'Jobber fra skyggen i dag: det er {temp}.',
    },
  },
  {
    when: (f) => f.hot,
    text: {
      en: '{temp}. I have merged with the sofa. We are one now.',
      fi: '{temp}. Olen sulautunut sohvaan. Olemme nyt yhtä.',
      sv: '{temp}. Jag har smält ihop med soffan. Vi är ett nu.',
      nb: '{temp}. Jeg har smeltet sammen med sofaen. Vi er ett nå.',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: "Couldn't find the office: fog.",
      fi: 'En löytänyt toimistolle: sumua.',
      sv: 'Hittade inte till jobbet: dimma.',
      nb: 'Fant ikke kontoret: tåke.',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: 'Fog. I left at eight and ended up in the next municipality.',
      fi: 'Sumua. Lähdin kahdeksalta ja päädyin naapurikuntaan.',
      sv: 'Dimma. Jag gick hemifrån klockan åtta och hamnade i grannkommunen.',
      nb: 'Tåke. Jeg dro hjemmefra klokka åtte og havnet i nabokommunen.',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Staying in: thunder around {thunderAt}.',
      fi: 'Jään sisälle: ukkosta noin klo {thunderAt}.',
      sv: 'Jag stannar inne: åska omkring kl. {thunderAt}.',
      nb: 'Jeg blir inne: torden rundt kl. {thunderAt}.',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunder around {thunderAt}. Thor and I have an agreement: I stay in.',
      fi: 'Ukkosta noin klo {thunderAt}. Minulla ja Ukko Ylijumalalla on sopimus: minä pysyn sisällä.',
      sv: 'Åska omkring kl. {thunderAt}. Tor och jag har en överenskommelse: jag stannar inne.',
      nb: 'Torden rundt kl. {thunderAt}. Tor og jeg har en avtale: jeg blir inne.',
    },
  },
  {
    when: (f) => !!f.uv,
    text: {
      en: 'Still putting on sunscreen: UV {uv}.',
      fi: 'Laitan vielä aurinkorasvaa: UV {uv}.',
      sv: 'Smörjer fortfarande in mig med solkräm: UV {uv}.',
      nb: 'Smører meg fortsatt med solkrem: UV {uv}.',
    },
  },
  {
    when: (f) => !!f.uv,
    text: {
      en: "UV {uv}. I'm Nordic. I would simply burst into flames.",
      fi: 'UV {uv}. Olen pohjoismainen. Syttyisin yksinkertaisesti tuleen.',
      sv: 'UV {uv}. Jag är nordbo. Jag skulle helt enkelt fatta eld.',
      nb: 'UV {uv}. Jeg er nordbo. Jeg ville rett og slett tatt fyr.',
    },
  },
  {
    when: (f) => f.niceAndSunny,
    text: {
      en: 'Sorry, the weather is too nice to waste: {temp} and sunny.',
      fi: 'Anteeksi, sää on liian hyvä hukattavaksi: {temp} ja aurinkoista.',
      sv: 'Förlåt, vädret är för fint för att slösa bort: {temp} och sol.',
      nb: 'Beklager, været er for fint til å kaste bort: {temp} og sol.',
    },
  },
  {
    when: (f) => f.niceAndSunny,
    text: {
      en: "{temp} and sunny. Up here that's a public holiday. Check the law.",
      fi: '{temp} ja aurinkoista. Täällä se on käytännössä yleinen vapaapäivä. Tarkista laista.',
      sv: '{temp} och sol. Här uppe är det i princip en helgdag. Kolla lagen.',
      nb: '{temp} og sol. Her oppe er det praktisk talt en helligdag. Sjekk loven.',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: "The sun isn't getting up today, so I'm not either.",
      fi: 'Aurinko ei nouse tänään, joten en nouse minäkään.',
      sv: 'Solen går inte upp i dag, så det gör inte jag heller.',
      nb: 'Sola står ikke opp i dag, så det gjør ikke jeg heller.',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: "It's been dark since {sunset}. My body thinks it's bedtime, and I respect my body.",
      fi: 'On ollut pimeää klo {sunset} lähtien. Kehoni luulee, että on nukkumaanmenoaika, ja minä kunnioitan kehoani.',
      sv: 'Det har varit mörkt sedan kl. {sunset}. Kroppen tror att det är läggdags, och jag respekterar min kropp.',
      nb: 'Det har vært mørkt siden kl. {sunset}. Kroppen tror det er leggetid, og jeg respekterer kroppen min.',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'Not feeling it: the sky is completely grey, and so am I.',
      fi: 'Ei huvita: taivas on ihan harmaa, ja niin olen minäkin.',
      sv: 'Orkar inte: himlen är helt grå, och det är jag också.',
      nb: 'Orker ikke: himmelen er helt grå, og det er jeg også.',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'The sky is the colour of wet cardboard. I need a day to process this.',
      fi: 'Taivas on märän pahvilaatikon värinen. Tarvitsen päivän käsitelläkseni tämän.',
      sv: 'Himlen har samma färg som en blöt pappkartong. Jag behöver en dag för att bearbeta det.',
      nb: 'Himmelen har samme farge som en våt pappeske. Jeg trenger en dag til å bearbeide dette.',
    },
  },
  {
    when: (f) => f.pressureFalling,
    text: {
      en: 'Air pressure is falling, and so is my motivation, at exactly the same rate.',
      fi: 'Ilmanpaine laskee, ja niin laskee motivaationikin, täsmälleen samaa tahtia.',
      sv: 'Lufttrycket sjunker, och det gör min motivation också, i exakt samma takt.',
      nb: 'Lufttrykket synker, og det gjør motivasjonen min også, i nøyaktig samme takt.',
    },
  },
  {
    when: (f) => !!f.humidity,
    text: {
      en: "Humidity {humidity}. My hair has formed its own opinions and won't leave the house.",
      fi: 'Ilmankosteus {humidity}. Hiukseni ovat muodostaneet omat mielipiteensä eivätkä suostu lähtemään kotoa.',
      sv: 'Luftfuktighet {humidity}. Mitt hår har egna åsikter och vägrar gå hemifrån.',
      nb: 'Luftfuktighet {humidity}. Håret mitt har fått egne meninger og nekter å gå ut.',
    },
  },
  // Always fitting.
  {
    when: always,
    text: {
      en: "Running late: it's {temp} and {weather}, I needed a moment.",
      fi: 'Myöhästyn: on {temp} ja {weather}, tarvitsin hetken.',
      sv: 'Jag blir sen: det är {temp} och {weather}, jag behövde en stund.',
      nb: 'Jeg blir sen: det er {temp} og {weather}, jeg trengte et øyeblikk.',
    },
  },
  {
    when: always,
    text: {
      en: "The forecast said '{weather}' and I took it personally.",
      fi: "Sääennuste sanoi '{weather}', ja otin sen henkilökohtaisesti.",
      sv: "Prognosen sa '{weather}' och jag tog det personligt.",
      nb: "Værmeldingen sa '{weather}', og jeg tok det personlig.",
    },
  },
  {
    when: always,
    text: {
      en: "I looked outside. The weather looked back. I'm not ready.",
      fi: 'Katsoin ulos. Sää katsoi takaisin. En ole valmis.',
      sv: 'Jag tittade ut. Vädret tittade tillbaka. Jag är inte redo.',
      nb: 'Jeg så ut. Været så tilbake. Jeg er ikke klar.',
    },
  },
];

/** Every excuse that fits the weather, in a random order. */
export function excusesFor(forecast: Forecast): string[] {
  return linesFor([...EXCUSES, ...MORE_EXCUSES], forecast);
}
