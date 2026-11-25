// Small talk ("Jutun juurta" in Finnish, "Småprat" in Swedish and
// Norwegian): one line to open a conversation with, always about the
// real weather there: rain and snow, wind, temperature, the light (day
// length, darkness, sunrise and sunset), tomorrow and the weekend, and how
// a cold beer would fare outside. Openers only: the rest of the
// conversation is up to you. Each fits when its facts are true (facts.ts);
// today's and tomorrow's weather always fit. Written as lines that sound
// natural in each language.

import { linesFor, type Line } from './facts';
import { MORE_SMALL_TALK } from './small-talk-more';
import type { Forecast } from '../weather/api';

const always = () => true;

export const SMALL_TALK: readonly Line[] = [
  // ── Today and tomorrow (always) ──
  {
    when: always,
    text: {
      en: "It's {weather} and {temp} today. How are you finding it?",
      fi: 'Tänään {weather} ja {temp}. Miltäs tämä sää sinusta tuntuu?',
      sv: 'I dag är det {weather} och {temp}. Vad tycker du om vädret?',
      nb: 'I dag er det {weather} og {temp}. Hva synes du om været?',
    },
  },
  {
    when: always,
    text: {
      en: 'Tomorrow looks like {tomorrow}, {tomorrowHigh} at most. Better than today?',
      fi: 'Huomenna kuulemma {tomorrow}, korkeintaan {tomorrowHigh}. Parempi kuin tänään?',
      sv: 'I morgon blir det visst {tomorrow}, högst {tomorrowHigh}. Bättre än i dag?',
      nb: 'I morgen blir det visst {tomorrow}, høyst {tomorrowHigh}. Bedre enn i dag?',
    },
  },
  {
    when: (f) => !!f.colder,
    text: {
      en: 'Supposed to be {colder}° colder tomorrow. Better enjoy this while it lasts, eh?',
      fi: 'Huomenna kuulemma {colder}° kylmempää. Pitää nauttia tästä niin kauan kuin kestää, vai mitä?',
      sv: 'Det ska tydligen bli {colder}° kallare i morgon. Bäst att njuta medan det varar, va?',
      nb: 'Det skal visst bli {colder}° kaldere i morgen. Best å nyte dette mens det varer, hva?',
    },
  },
  {
    when: (f) => !!f.warmer,
    text: {
      en: "Apparently it'll be {warmer}° warmer tomorrow. Do you believe it?",
      fi: 'Huomenna pitäisi olla {warmer}° lämpimämpää. Uskotko?',
      sv: 'Det ska visst bli {warmer}° varmare i morgon. Tror du på det?',
      nb: 'Det skal visst bli {warmer}° varmere i morgen. Tror du på det?',
    },
  },
  {
    when: (f) => !!f.weekend,
    text: {
      en: 'Weekend forecast: {weekend}. Any plans?',
      fi: 'Viikonloppuna luvassa: {weekend}. Onko suunnitelmia?',
      sv: 'Till helgen väntas: {weekend}. Några planer?',
      nb: 'Til helgen ventes: {weekend}. Noen planer?',
    },
  },
  // ── Rain and snow ──
  {
    when: (f) => f.raining,
    text: {
      en: "Proper rain, isn't it? Good for the gardens, at least.",
      fi: 'Kunnon sade, eikö? Hyvää puutarhoille ainakin.',
      sv: 'Ordentligt regn, va? Bra för trädgårdarna i alla fall.',
      nb: 'Ordentlig regn, hva? Bra for hagene i hvert fall.',
    },
  },
  {
    when: (f) => !!f.rainFrom,
    text: {
      en: 'Rain from about {rainFrom}, they say. Got your umbrella?',
      fi: 'Sadetta tulossa noin klo {rainFrom}, sanovat. Onko sateenvarjo mukana?',
      sv: 'Regn från omkring kl. {rainFrom}, säger de. Har du paraply med dig?',
      nb: 'Regn fra rundt kl. {rainFrom}, sier de. Har du paraply?',
    },
  },
  {
    when: (f) => f.rainStopped,
    text: {
      en: "Nice that the rain has stopped, isn't it?",
      fi: 'Mukavaa, että sade loppui, eikö?',
      sv: 'Skönt att regnet har slutat, va?',
      nb: 'Godt at regnet har gitt seg, hva?',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: 'Snow at last: {snow} today. Skis or shovel?',
      fi: 'Vihdoin lunta: {snow} tänään. Sukset vai lumilapio?',
      sv: 'Äntligen snö: {snow} i dag. Skidor eller snöskyffel?',
      nb: 'Endelig snø: {snow} i dag. Ski eller snøskuffe?',
    },
  },
  {
    when: (f) => !!f.snowFrom,
    text: {
      en: 'Snow on the way from about {snowFrom}. Ready for it?',
      fi: 'Lunta tulossa noin klo {snowFrom} alkaen. Oletko valmis?',
      sv: 'Snö på väg från omkring kl. {snowFrom}. Är du redo?',
      nb: 'Snø på vei fra rundt kl. {snowFrom}. Er du klar?',
    },
  },
  // ── Wind ──
  {
    when: (f) => !!f.gusts,
    text: {
      en: "Bit breezy today, isn't it? Gusts of {gusts}.",
      fi: 'Aika tuulinen päivä, vai mitä? Puuskat {gusts}.',
      sv: 'Lite blåsigt i dag, va? Vindbyar på {gusts}.',
      nb: 'Litt friskt i dag, hva? Vindkast på {gusts}.',
    },
  },
  {
    when: (f) => f.feelsColder,
    text: {
      en: "It's {temp}, but the wind makes it feel like {feels}. Chilly, isn't it?",
      fi: 'Lämpötila on {temp}, mutta tuulessa tuntuu kuin olisi {feels}. Viileää, eikö?',
      sv: 'Det är {temp}, men vinden gör att det känns som {feels}. Kyligt, va?',
      nb: 'Det er {temp}, men vinden gjør at det føles som {feels}. Kjølig, hva?',
    },
  },
  // ── Temperature ──
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp}! Proper winter, this. At least the mosquitoes are gone.',
      fi: '{temp}! Tämä on oikeaa talvea. Hyttyset ovat sentään poissa.',
      sv: '{temp}! Det här är riktig vinter. Myggen är i alla fall borta.',
      nb: '{temp}! Dette er ordentlig vinter. Myggen er i hvert fall borte.',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: '{temp} out there. Mind the ice on the way home.',
      fi: 'Ulkona {temp}. Varo liukkautta kotimatkalla.',
      sv: '{temp} ute. Akta dig för isen på vägen hem.',
      nb: '{temp} ute. Pass på isen på vei hjem.',
    },
  },
  {
    when: (f) => f.cool,
    text: {
      en: "{temp} today. Proper jacket weather, isn't it?",
      fi: '{temp} tänään. Oikeaa takkisäätä, eikö?',
      sv: '{temp} i dag. Riktigt jackväder, va?',
      nb: '{temp} i dag. Ordentlig jakkevær, hva?',
    },
  },
  {
    when: (f) => f.mild,
    text: {
      en: "Fairly mild today: {temp}. Can't complain, can we?",
      fi: 'Aika leutoa tänään: {temp}. Ei voi valittaa, vai mitä?',
      sv: 'Ganska milt i dag: {temp}. Inte mycket att klaga på, va?',
      nb: 'Ganske mildt i dag: {temp}. Ikke noe å klage på, hva?',
    },
  },
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: "{temp} and sunny! Sauna weather. Then again, when isn't it?",
      fi: '{temp} ja aurinkoista! Saunasää. Tosin milloin ei olisi?',
      sv: '{temp} och sol! Bastuväder. Fast när är det inte det?',
      nb: '{temp} og sol! Badstuevær. Men når er det ikke det?',
    },
  },
  {
    when: (f) => f.heat,
    text: {
      en: '{temp}! Proper summer heat. Managing to keep cool?',
      fi: '{temp}! Kunnon helle. Pysytkö viileänä?',
      sv: '{temp}! Riktig sommarvärme. Lyckas du hålla dig sval?',
      nb: '{temp}! Ordentlig sommervarme. Klarer du å holde deg kjølig?',
    },
  },
  // ── Sky ──
  {
    when: (f) => f.clear,
    text: {
      en: "Lovely clear sky today, isn't it?",
      fi: 'Kaunis kirkas taivas tänään, eikö?',
      sv: 'Härlig klar himmel i dag, va?',
      nb: 'Nydelig klar himmel i dag, hva?',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'Grey again. Do you remember what the sun looks like?',
      fi: 'Taas harmaata. Muistatko vielä, miltä aurinko näyttää?',
      sv: 'Grått igen. Minns du hur solen ser ut?',
      nb: 'Grått igjen. Husker du hvordan sola ser ut?',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: "Thick fog today, isn't it? Could hardly see the other side of the street.",
      fi: 'Sakea sumu tänään, eikö? Kadun toista puolta tuskin näki.',
      sv: 'Tät dimma i dag, va? Man såg knappt andra sidan gatan.',
      nb: 'Tett tåke i dag, hva? Man så knapt andre siden av gata.',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunder expected around {thunderAt}. Better be home before it, eh?',
      fi: 'Ukkosta luvassa noin klo {thunderAt}. Parasta olla kotona ennen sitä, vai mitä?',
      sv: 'Åska väntas omkring kl. {thunderAt}. Bäst att vara hemma innan dess, va?',
      nb: 'Torden ventet rundt kl. {thunderAt}. Best å være hjemme før det, hva?',
    },
  },
  // ── Light and darkness ──
  {
    when: (f) => !!f.daylight,
    text: {
      en: 'Only {daylight} of daylight today. Did you manage to see any of it?',
      fi: 'Vain {daylight} valoisaa tänään. Ehditkö nähdä siitä mitään?',
      sv: 'Bara {daylight} dagsljus i dag. Hann du se något av det?',
      nb: 'Bare {daylight} dagslys i dag. Rakk du å se noe av det?',
    },
  },
  {
    when: (f) => !!f.shorter,
    text: {
      en: "{shorter} min less daylight tomorrow. Winter's coming, isn't it?",
      fi: 'Huomenna {shorter} min vähemmän valoa. Talvi tulee, eikö?',
      sv: '{shorter} min mindre dagsljus i morgon. Vintern är på väg, va?',
      nb: '{shorter} min mindre dagslys i morgen. Vinteren er på vei, hva?',
    },
  },
  {
    when: (f) => !!f.longer,
    text: {
      en: "Days are getting longer again: {longer} min more tomorrow. Spring's on its way, surely?",
      fi: 'Päivät pitenevät taas: huomenna {longer} min enemmän valoa. Kevät on tulossa, eikö?',
      sv: 'Dagarna blir längre igen: {longer} min mer i morgon. Våren är väl på väg?',
      nb: 'Dagene blir lengre igjen: {longer} min mer i morgen. Våren er vel på vei?',
    },
  },
  {
    when: (f) => f.darkMorning,
    text: {
      en: "Still dark out: the sun only rises at {sunrise}. Hard to get going, isn't it?",
      fi: 'Vielä pimeää: aurinko nousee vasta klo {sunrise}. Vaikea päästä vauhtiin, eikö?',
      sv: 'Fortfarande mörkt: solen går upp först kl. {sunrise}. Svårt att komma igång, va?',
      nb: 'Fortsatt mørkt: sola står først opp kl. {sunrise}. Vanskelig å komme i gang, hva?',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: 'Dark already: the sun set at {sunset}. Long evenings now, eh?',
      fi: 'Jo pimeää: aurinko laski klo {sunset}. Pitkiä iltoja nyt, vai mitä?',
      sv: 'Redan mörkt: solen gick ned kl. {sunset}. Långa kvällar nu, va?',
      nb: 'Allerede mørkt: sola gikk ned kl. {sunset}. Lange kvelder nå, hva?',
    },
  },
  {
    when: (f) => !!f.sunsetAt,
    text: {
      en: "The sun sets at {sunsetAt} today. Better get outside while it's light?",
      fi: 'Aurinko laskee tänään klo {sunsetAt}. Ehtisikö vielä ulos valoisaan aikaan?',
      sv: 'Solen går ned kl. {sunsetAt} i dag. Dags att gå ut medan det är ljust?',
      nb: 'Sola går ned kl. {sunsetAt} i dag. På tide å gå ut mens det er lyst?',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: 'No sun at all today. How are you coping with the dark?',
      fi: 'Aurinko ei nouse ollenkaan tänään. Miten jaksat pimeää?',
      sv: 'Ingen sol alls i dag. Hur klarar du mörkret?',
      nb: 'Ingen sol i dag i det hele tatt. Hvordan takler du mørket?',
    },
  },
  {
    when: (f) => f.midnightSun,
    text: {
      en: "The sun doesn't set at all today. Sleeping well?",
      fi: 'Aurinko ei laske tänään ollenkaan. Saatko nukuttua?',
      sv: 'Solen går inte ned alls i dag. Sover du gott?',
      nb: 'Sola går ikke ned i dag i det hele tatt. Sover du godt?',
    },
  },
  // ── Beer outside (weather/beer.ts) ──
  {
    when: (f) => f.beerWarms,
    text: {
      en: 'A cold beer would be warm in about {beerTime} out here. Better drink fast, eh?',
      fi: 'Kylmä olut lämpenisi täällä ulkona noin {beerTime} kuluessa. Pitäisi juoda nopeasti, vai mitä?',
      sv: 'En kall öl skulle bli varm på ungefär {beerTime} här ute. Bäst att dricka fort, va?',
      nb: 'En kald øl ville blitt varm på omtrent {beerTime} her ute. Best å drikke fort, hva?',
    },
  },
  {
    when: (f) => f.beerFreezes,
    text: {
      en: 'A beer left outside would start to freeze in about {beerTime}. Cold enough for you?',
      fi: 'Ulos jätetty olut alkaisi jäätyä noin {beerTime} kuluessa. Tarpeeksi kylmää?',
      sv: 'En öl som står ute skulle börja frysa på ungefär {beerTime}. Kallt nog för dig?',
      nb: 'En øl som står ute ville begynt å fryse på omtrent {beerTime}. Kaldt nok for deg?',
    },
  },
  {
    when: (f) => f.beerStaysCold,
    text: {
      en: 'At least a beer would stay nicely cold out here. Small mercies, eh?',
      fi: 'Olut pysyisi ainakin mukavan kylmänä täällä ulkona. Aina jotain hyvää, eikö?',
      sv: 'En öl skulle i alla fall hålla sig kall här ute. Man får vara glad för det lilla, va?',
      nb: 'En øl ville i hvert fall holdt seg kald her ute. Man får være glad for det lille, hva?',
    },
  },
];

/** Every small talk line that fits the weather, in a random order. */
export function smallTalkFor(forecast: Forecast): string[] {
  return linesFor([...SMALL_TALK, ...MORE_SMALL_TALK], forecast);
}
