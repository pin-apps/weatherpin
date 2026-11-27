// The weather haiku's lines (haiku.ts puts a poem together): an opening
// about the light or the season (5 syllables), then a middle (7) and a
// closing line (5) from one weather group, so a poem stays on one subject.
// No numbers or placeholders: they'd break the count. English and Finnish
// are 5-7-5 (check:i18n counts the Finnish); Swedish and Norwegian are
// short-long-short, written to sound natural rather than counted.
// Data only (type imports alone), so scripts/check-i18n.mjs can import it.

import type { Language } from '../i18n';

type Texts = Record<Language, string>;

export type Light = 'dawn' | 'day' | 'dusk' | 'night' | 'polarNight' | 'midnightSun';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Group =
  | 'thunder'
  | 'snow'
  | 'rain'
  | 'fog'
  | 'wind'
  | 'frost'
  | 'heat'
  | 'clearNight'
  | 'clearDay'
  | 'grey';

/** A first line: fits that light, or that season (not near the equator). */
export interface Opening {
  light?: Light;
  season?: Season;
  text: Texts;
}

export const OPENINGS: readonly Opening[] = [
  {
    light: 'dawn',
    text: {
      en: 'Morning comes slowly',
      fi: 'Aamu sarastaa',
      sv: 'Morgonen gryr sakta',
      nb: 'Morgenen gryr sakte',
    },
  },
  {
    light: 'dawn',
    text: {
      en: 'Sunrise, the day wakes',
      fi: 'Päivä herää taas',
      sv: 'Solen går upp nu',
      nb: 'Sola står opp nå',
    },
  },
  {
    light: 'day',
    text: {
      en: 'Middle of the day',
      fi: 'Keskellä päivää',
      sv: 'Mitt på dagen nu',
      nb: 'Midt på dagen nå',
    },
  },
  {
    light: 'day',
    text: {
      en: 'Just another day',
      fi: 'Taas uusi päivä',
      sv: 'Ännu en dag här',
      nb: 'Nok en dag her',
    },
  },
  {
    light: 'dusk',
    text: {
      en: 'The day is ending',
      fi: 'Päivä hiipuu jo',
      sv: 'Dagen lider mot kväll',
      nb: 'Dagen går mot kveld',
    },
  },
  {
    light: 'dusk',
    text: {
      en: 'Sunset is coming',
      fi: 'Aurinko laskee',
      sv: 'Solen sjunker nu',
      nb: 'Sola går ned nå',
    },
  },
  {
    light: 'night',
    text: {
      en: 'Night over the town',
      fi: 'Hiljainen yö nyt',
      sv: 'Natten över stan',
      nb: 'Natten over byen',
    },
  },
  {
    light: 'night',
    text: {
      en: 'In the dark of night',
      fi: 'Yön pimeydessä',
      sv: 'I nattens mörker',
      nb: 'I nattens mørke',
    },
  },
  {
    light: 'polarNight',
    text: {
      en: 'Polar night is here',
      fi: 'Kaamos on täällä',
      sv: 'Polarnatten är här',
      nb: 'Mørketida er her',
    },
  },
  {
    light: 'polarNight',
    text: {
      en: 'No sunrise today',
      fi: 'Ei aurinkoa',
      sv: 'Ingen sol i dag',
      nb: 'Ingen sol i dag',
    },
  },
  {
    light: 'midnightSun',
    text: {
      en: 'The sun will not set',
      fi: 'Yötön yö taas on',
      sv: 'Solen går inte ned',
      nb: 'Sola går ikke ned',
    },
  },
  {
    light: 'midnightSun',
    text: {
      en: 'Light all through the night',
      fi: 'Valoa yöllä',
      sv: 'Ljust hela natten',
      nb: 'Lyst hele natten',
    },
  },
  {
    season: 'winter',
    text: {
      en: 'Deep in winter now',
      fi: 'Sydäntalvi on',
      sv: 'Mitt i vintern nu',
      nb: 'Midt på vinteren',
    },
  },
  {
    season: 'winter',
    text: {
      en: "A winter's moment",
      fi: 'Talvinen hetki',
      sv: 'En stund i vintern',
      nb: 'Et vinterøyeblikk',
    },
  },
  {
    season: 'spring',
    text: {
      en: 'Spring is on its way',
      fi: 'Kevät tulossa',
      sv: 'Våren är på väg',
      nb: 'Våren er på vei',
    },
  },
  {
    season: 'spring',
    text: {
      en: 'A moment of spring',
      fi: 'Keväinen hetki',
      sv: 'En stund av vår',
      nb: 'Et vårlig øyeblikk',
    },
  },
  {
    season: 'summer',
    text: {
      en: 'Summer is here now',
      fi: 'Kesä on täällä',
      sv: 'Sommaren är här',
      nb: 'Sommeren er her',
    },
  },
  {
    season: 'summer',
    text: {
      en: 'A summer moment',
      fi: 'Kesäinen hetki',
      sv: 'En sommarstund',
      nb: 'Et sommerøyeblikk',
    },
  },
  {
    season: 'autumn',
    text: {
      en: 'Autumn has arrived',
      fi: 'Syksy on tullut',
      sv: 'Hösten har kommit',
      nb: 'Høsten har kommet',
    },
  },
  {
    season: 'autumn',
    text: {
      en: 'An autumn moment',
      fi: 'Syksyinen hetki',
      sv: 'En höststund',
      nb: 'Et høstøyeblikk',
    },
  },
];

/** Each group's middle lines (7 syllables) and closing lines (5). */
export const VERSES: Record<Group, { middle: readonly Texts[]; last: readonly Texts[] }> = {
  thunder: {
    middle: [
      {
        en: 'thunder rolls across the sky',
        fi: 'ukkonen jylisee nyt',
        sv: 'åskan mullrar över himlen',
        nb: 'torden ruller over himmelen',
      },
      {
        en: 'a white flash, then counting slow',
        fi: 'salama, ja lasketaan',
        sv: 'en blixt, och sedan räknar vi',
        nb: 'et lyn, og så teller vi',
      },
      {
        en: 'the air hums before the storm',
        fi: 'ilmassa sähköä on',
        sv: 'luften surrar före stormen',
        nb: 'lufta summer før uværet',
      },
      {
        en: 'heavy clouds grow dark and tall',
        fi: 'tumma pilvi kasvaa jo',
        sv: 'tunga moln tornar upp sig',
        nb: 'tunge skyer tårner seg',
      },
    ],
    last: [
      {
        en: 'the dog hides away',
        fi: 'koira piiloon käy',
        sv: 'hunden gömmer sig',
        nb: 'hunden gjemmer seg',
      },
      {
        en: 'the power flickers',
        fi: 'valot välkkyvät',
        sv: 'lamporna flimrar',
        nb: 'lysene flimrer',
      },
      {
        en: 'rain follows the boom',
        fi: 'sade seuraa jo',
        sv: 'regnet följer på',
        nb: 'regnet følger på',
      },
    ],
  },
  snow: {
    middle: [
      {
        en: 'snowflakes drift without a sound',
        fi: 'lunta sataa hiljaa nyt',
        sv: 'snöflingor faller tyst',
        nb: 'snøfnugg daler stille',
      },
      {
        en: 'the footprints fill up with snow',
        fi: 'jäljet peittyvät lumeen',
        sv: 'spåren fylls igen av snö',
        nb: 'sporene fylles med snø',
      },
      {
        en: 'white on the branches and roofs',
        fi: 'valkoiset oksat, katot',
        sv: 'vitt på grenar och på tak',
        nb: 'hvitt på greiner og på tak',
      },
      {
        en: "snow muffles the city's noise",
        fi: 'lumi pehmentää äänet',
        sv: 'snön dämpar stadens ljud',
        nb: 'snøen demper alle lyder',
      },
    ],
    last: [
      {
        en: 'the shovel waits now',
        fi: 'lapio esiin',
        sv: 'fram med snöskyffeln',
        nb: 'fram med snøskuffa',
      },
      {
        en: 'a child laughs out loud',
        fi: 'lapsi nauraa vaan',
        sv: 'ett barn skrattar högt',
        nb: 'et barn ler høyt',
      },
      {
        en: 'the world, new again',
        fi: 'maailma uusi',
        sv: 'världen är ny igen',
        nb: 'verden er ny igjen',
      },
    ],
  },
  rain: {
    middle: [
      {
        en: 'rain taps on the window glass',
        fi: 'sade naputtaa lasiin',
        sv: 'regnet trummar mot rutan',
        nb: 'regnet trommer mot ruta',
      },
      {
        en: 'puddles gather on the street',
        fi: 'lätäköitä kadulla',
        sv: 'pölar samlas på gatan',
        nb: 'dammer samler seg i gata',
      },
      {
        en: 'umbrellas bloom on the street',
        fi: 'sateenvarjot kukkivat',
        sv: 'paraplyer blommar ut',
        nb: 'paraplyer blomstrer ut',
      },
      {
        en: 'grey water runs from the eaves',
        fi: 'räystäät valuvat vettä',
        sv: 'vatten rinner från taket',
        nb: 'vannet renner fra taket',
      },
    ],
    last: [
      {
        en: 'the kettle answers',
        fi: 'teevesi kiehuu',
        sv: 'tekitteln svarar',
        nb: 'tekjelen svarer',
      },
      {
        en: 'the earth drinks it in',
        fi: 'maa juo janoonsa',
        sv: 'jorden dricker nu',
        nb: 'jorda drikker nå',
      },
      {
        en: 'a snail goes walking',
        fi: 'etana kulkee',
        sv: 'en snigel tar en tur',
        nb: 'en snegle går tur',
      },
    ],
  },
  fog: {
    middle: [
      {
        en: 'the fog swallows the houses',
        fi: 'sumu nielee talot nyt',
        sv: 'dimman sväljer husen nu',
        nb: 'tåka sluker husene',
      },
      {
        en: 'grey breath hanging in the air',
        fi: 'harmaa henki ilmassa',
        sv: 'grå andedräkt i luften',
        nb: 'grå pust som henger i lufta',
      },
      {
        en: 'the world ends a few steps on',
        fi: 'maailma loppuu tähän',
        sv: 'världen slutar några steg bort',
        nb: 'verden slutter noen skritt unna',
      },
      {
        en: 'lamps float like moons in the mist',
        fi: 'lamput kuin kuut sumussa',
        sv: 'lampor svävar som månar',
        nb: 'lamper svever som måner',
      },
    ],
    last: [
      {
        en: 'a crow calls, unseen',
        fi: 'varis raakkuu vain',
        sv: 'en kråka kraxar',
        nb: 'en kråke skriker',
      },
      {
        en: 'footsteps, then nothing',
        fi: 'askel, hiljaisuus',
        sv: 'steg, sedan tystnad',
        nb: 'skritt, så stillhet',
      },
      {
        en: 'slowly, it will lift',
        fi: 'kyllä se haihtuu',
        sv: 'snart lättar den nog',
        nb: 'snart letter den nok',
      },
    ],
  },
  wind: {
    middle: [
      {
        en: 'the wind tugs at coats and hats',
        fi: 'tuuli nykii takkia',
        sv: 'vinden rycker i rockarna',
        nb: 'vinden river i jakkene',
      },
      {
        en: 'trees bow low and bend their backs',
        fi: 'puut kumartavat syvään',
        sv: 'träden bugar djupt i vinden',
        nb: 'trærne bøyer seg dypt',
      },
      {
        en: 'a lost umbrella flies by',
        fi: 'sateenvarjo lentää pois',
        sv: 'ett paraply flyger förbi',
        nb: 'en paraply flyr forbi',
      },
      {
        en: 'the wind howls around the house',
        fi: 'tuuli ulvoo nurkissa',
        sv: 'vinden yler runt huset',
        nb: 'vinden uler rundt huset',
      },
    ],
    last: [
      {
        en: 'hold on to your hat',
        fi: 'pidä hatusta',
        sv: 'håll i hatten nu',
        nb: 'hold på hatten nå',
      },
      {
        en: 'the gulls hang in place',
        fi: 'lokit leijuvat',
        sv: 'måsarna hänger still',
        nb: 'måkene står stille',
      },
      {
        en: 'the bin runs away',
        fi: 'roskis karkaa pois',
        sv: 'soptunnan rymmer',
        nb: 'søppeldunken rømmer',
      },
    ],
  },
  frost: {
    middle: [
      {
        en: 'the snow creaks under my boots',
        fi: 'lumi narskuu kengissä',
        sv: 'snön knarrar under kängan',
        nb: 'snøen knirker under støvlene',
      },
      {
        en: 'my breath hangs like a white cloud',
        fi: 'hengitys on huurua',
        sv: 'andan hänger som ett moln',
        nb: 'pusten henger som en sky',
      },
      {
        en: 'the frost bites my nose and cheeks',
        fi: 'pakkanen puree nenää',
        sv: 'kylan biter i näsan',
        nb: 'kulda biter i nesen',
      },
      {
        en: 'frost flowers on the window',
        fi: 'jääkukat ikkunassa',
        sv: 'isblommor på fönstret',
        nb: 'isroser på vinduet',
      },
    ],
    last: [
      {
        en: 'the car will not start',
        fi: 'auto ei lähde',
        sv: 'bilen startar inte',
        nb: 'bilen vil ikke starte',
      },
      {
        en: 'time for hot cocoa',
        fi: 'kaakaon aika',
        sv: 'dags för varm choklad',
        nb: 'tid for varm kakao',
      },
      {
        en: 'a small bird fluffs up',
        fi: 'tiainen pöyhii',
        sv: 'en mes burrar upp sig',
        nb: 'en meis bruser seg',
      },
    ],
  },
  heat: {
    middle: [
      {
        en: 'the asphalt shimmers with heat',
        fi: 'asfaltti väreilee nyt',
        sv: 'asfalten dallrar av hetta',
        nb: 'asfalten dirrer av varme',
      },
      {
        en: 'even the shadows feel warm',
        fi: 'varjokin on lämmin nyt',
        sv: 'även skuggan känns varm',
        nb: 'selv skyggen føles varm',
      },
      {
        en: 'ice cream drips onto my hand',
        fi: 'jäätelö sulaa käteen',
        sv: 'glassen smälter i handen',
        nb: 'isen smelter i hånda',
      },
      {
        en: 'the fan turns but nothing helps',
        fi: 'tuuletin ei auta nyt',
        sv: 'fläkten snurrar, hjälper ej',
        nb: 'viften går, men hjelper ikke',
      },
    ],
    last: [
      {
        en: 'the cat lies flat out',
        fi: 'kissa makoilee',
        sv: 'katten ligger platt',
        nb: 'katten ligger flat',
      },
      {
        en: 'a cold glass, misted',
        fi: 'lasi huurussa',
        sv: 'ett kallt glas immar',
        nb: 'et kaldt glass dugger',
      },
      {
        en: 'time itself slows down',
        fi: 'aika hidastuu',
        sv: 'tiden saktar ner',
        nb: 'tiden går sakte',
      },
    ],
  },
  clearNight: {
    middle: [
      {
        en: 'stars scattered across the sky',
        fi: 'tähdet taivaalla tuikkii',
        sv: 'stjärnor strödda över himlen',
        nb: 'stjerner strødd over himmelen',
      },
      {
        en: 'a clear sky, open and still',
        fi: 'taivas kirkas ja hiljaa',
        sv: 'en klar himmel, öppen, still',
        nb: 'en klar himmel, åpen, stille',
      },
      {
        en: 'no cloud between me and space',
        fi: 'ei pilveä taivaalla',
        sv: 'inget moln mellan mig och rymden',
        nb: 'ingen sky mellom meg og rommet',
      },
      {
        en: 'the Milky Way, faint and far',
        fi: 'Linnunrata kaukana',
        sv: 'Vintergatan, svag och långt bort',
        nb: 'Melkeveien, svak og fjern',
      },
    ],
    last: [
      {
        en: 'I make a small wish',
        fi: 'toivon jotakin',
        sv: 'jag önskar något',
        nb: 'jeg ønsker meg noe',
      },
      {
        en: 'the night breathes slowly',
        fi: 'yö hengähtää nyt',
        sv: 'natten andas lugnt',
        nb: 'natten puster rolig',
      },
      {
        en: 'an owl, far away',
        fi: 'pöllö jossakin',
        sv: 'en uggla långt bort',
        nb: 'ei ugle langt borte',
      },
    ],
  },
  clearDay: {
    middle: [
      {
        en: 'the sun warms my face for once',
        fi: 'aurinko kasvoilla taas',
        sv: 'solen värmer mitt ansikte',
        nb: 'sola varmer ansiktet',
      },
      {
        en: 'a blue sky without a cloud',
        fi: 'taivas sininen, kirkas',
        sv: 'en blå himmel utan moln',
        nb: 'en blå himmel uten skyer',
      },
      {
        en: 'sunlight on the windowsills',
        fi: 'aurinko ikkunassa',
        sv: 'solljus på fönsterbrädan',
        nb: 'sollys i vinduskarmen',
      },
      {
        en: 'people squint and smile outside',
        fi: 'siristellen hymyillään',
        sv: 'folk kisar och ler ute',
        nb: 'folk myser og smiler ute',
      },
    ],
    last: [
      {
        en: 'sunglasses, at last',
        fi: 'aurinkolasit',
        sv: 'solglasögon fram',
        nb: 'solbriller på nå',
      },
      {
        en: 'the cat finds the sun',
        fi: 'kissa paistattaa',
        sv: 'katten hittar solen',
        nb: 'katten finner sola',
      },
      {
        en: 'a good day to be',
        fi: 'hyvä olla on',
        sv: 'en bra dag att vara',
        nb: 'en god dag å være',
      },
    ],
  },
  grey: {
    middle: [
      {
        en: 'a low ceiling made of cloud',
        fi: 'matala pilvikatto',
        sv: 'ett lågt tak av moln',
        nb: 'et lavt tak av skyer',
      },
      {
        en: 'the whole world a shade of grey',
        fi: 'kaikki harmaan sävyissä',
        sv: 'hela världen i grått',
        nb: 'hele verden i grått',
      },
      {
        en: 'clouds drift slowly overhead',
        fi: 'pilvet ajelehtivat',
        sv: 'moln driver sakta förbi',
        nb: 'skyer driver sakte forbi',
      },
      {
        en: 'a quiet sky, nothing more',
        fi: 'vain taivas, ei muuta nyt',
        sv: 'en stilla himmel, inget mer',
        nb: 'en stille himmel, ikke mer',
      },
    ],
    last: [
      {
        en: "coffee, then we'll see",
        fi: 'kahvia ensin',
        sv: 'kaffe först, sen får vi se',
        nb: 'kaffe først, så får vi se',
      },
      {
        en: 'it might rain, or not',
        fi: 'sataako, vai ei',
        sv: 'regn, eller kanske inte',
        nb: 'regn, eller kanskje ikke',
      },
      {
        en: 'all is quiet here',
        fi: 'hiljaista on vain',
        sv: 'allt är stilla här',
        nb: 'alt er stille her',
      },
    ],
  },
};
