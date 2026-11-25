// More small talk openers (see small-talk.ts): one line each, always about
// the real weather there, grouped by the weather they need, several per
// kind so "Another one" has plenty to go through. Openers only: no
// scripted conversations. Written to sound natural in each language.

import type { Line } from './facts';

const always = () => true;

export const MORE_SMALL_TALK: readonly Line[] = [
  // ── Today and tomorrow (always) ──
  {
    when: always,
    text: {
      en: '{temp} and {weather}. Is this what you expected when you got up?',
      fi: '{temp} ja {weather}. Tätäkö odotit, kun heräsit?',
      sv: '{temp} och {weather}. Var det här vad du väntade dig när du vaknade?',
      nb: '{temp} og {weather}. Var det dette du ventet deg da du sto opp?',
    },
  },
  {
    when: always,
    text: {
      en: 'Have you been out yet today? {temp} and {weather} out there.',
      fi: 'Oletko jo käynyt ulkona tänään? Siellä on {temp} ja {weather}.',
      sv: 'Har du varit ute i dag? Det är {temp} och {weather} där ute.',
      nb: 'Har du vært ute i dag? Det er {temp} og {weather} der ute.',
    },
  },
  {
    when: always,
    text: {
      en: 'They say tomorrow will be {tomorrow}. Do you trust the forecast?',
      fi: 'Huomiseksi luvataan {tomorrow}. Luotatko sääennusteeseen?',
      sv: 'De säger att det blir {tomorrow} i morgon. Litar du på prognosen?',
      nb: 'De sier det blir {tomorrow} i morgen. Stoler du på værmeldingen?',
    },
  },
  {
    when: always,
    text: {
      en: 'Up to {tomorrowHigh} tomorrow, apparently. Got anything planned outside?',
      fi: 'Huomenna kuulemma enimmillään {tomorrowHigh}. Onko suunnitelmia ulkona?',
      sv: 'Upp till {tomorrowHigh} i morgon, visst. Har du något planerat ute?',
      nb: 'Opp til {tomorrowHigh} i morgen, visstnok. Har du noe planlagt ute?',
    },
  },
  {
    when: always,
    text: {
      en: "Today it's {weather}. What's your favourite kind of weather, actually?",
      fi: 'Tänään {weather}. Mikä on muuten lempisääsi?',
      sv: 'I dag är det {weather}. Vilket väder tycker du bäst om, egentligen?',
      nb: 'I dag er det {weather}. Hva slags vær liker du best, egentlig?',
    },
  },
  {
    when: always,
    text: {
      en: 'Today {weather}, tomorrow {tomorrow}. Which one do you prefer?',
      fi: 'Tänään {weather}, huomenna {tomorrow}. Kumpi on mieleisempi?',
      sv: 'I dag {weather}, i morgon {tomorrow}. Vilket föredrar du?',
      nb: 'I dag {weather}, i morgen {tomorrow}. Hva foretrekker du?',
    },
  },
  {
    when: always,
    text: {
      en: 'Is {temp} warm or cold for you? People never seem to agree.',
      fi: 'Onko {temp} sinusta lämmin vai kylmä? Ihmiset eivät koskaan tunnu olevan samaa mieltä.',
      sv: 'Är {temp} varmt eller kallt för dig? Folk verkar aldrig vara överens.',
      nb: 'Er {temp} varmt eller kaldt for deg? Folk ser aldri ut til å være enige.',
    },
  },
  {
    when: always,
    text: {
      en: 'How did you dress for {temp} and {weather} today?',
      fi: 'Miten pukeuduit tänään, kun on {temp} ja {weather}?',
      sv: 'Hur klädde du dig i dag, med {temp} och {weather}?',
      nb: 'Hvordan kledde du deg i dag, med {temp} og {weather}?',
    },
  },
  // ── Tomorrow and the weekend ──
  {
    when: (f) => !!f.colder,
    text: {
      en: '{colder}° colder tomorrow, they say. Time to find the warm hat?',
      fi: 'Huomenna kuulemma {colder}° kylmempää. Onko aika kaivaa pipo esiin?',
      sv: '{colder}° kallare i morgon, säger de. Dags att leta fram mössan?',
      nb: '{colder}° kaldere i morgen, sier de. På tide å finne fram lua?',
    },
  },
  {
    when: (f) => !!f.colder,
    text: {
      en: 'A {colder}° drop tomorrow. Do you think winter is really here now?',
      fi: 'Huomenna {colder}° kylmempää. Luuletko, että talvi on nyt tosissaan tullut?',
      sv: '{colder}° kallare i morgon. Tror du att vintern verkligen är här nu?',
      nb: '{colder}° kaldere i morgen. Tror du vinteren virkelig er her nå?',
    },
  },
  {
    when: (f) => !!f.warmer,
    text: {
      en: '{warmer}° warmer tomorrow. Any plans to make the most of it?',
      fi: 'Huomenna {warmer}° lämpimämpää. Aiotko ottaa siitä kaiken irti?',
      sv: '{warmer}° varmare i morgon. Några planer för att ta vara på det?',
      nb: '{warmer}° varmere i morgen. Noen planer for å få mest mulig ut av det?',
    },
  },
  {
    when: (f) => !!f.warmer,
    text: {
      en: 'Tomorrow is meant to be {warmer}° warmer. Spring jacket or still the winter one?',
      fi: 'Huomenna pitäisi olla {warmer}° lämpimämpää. Kevättakki vai vielä talvitakki?',
      sv: 'I morgon ska det bli {warmer}° varmare. Vårjacka eller fortfarande vinterjackan?',
      nb: 'I morgen skal det bli {warmer}° varmere. Vårjakke eller fortsatt vinterjakka?',
    },
  },
  {
    when: (f) => !!f.weekend,
    text: {
      en: 'The weekend looks like {weekend}. Good for getting outside, do you think?',
      fi: 'Viikonloppuna näyttäisi olevan {weekend}. Hyvä ulkoilusää, mitä luulet?',
      sv: 'Helgen ser ut att bli {weekend}. Bra för att vara ute, tror du?',
      nb: 'Helgen ser ut til å bli {weekend}. Bra for å være ute, tror du?',
    },
  },
  {
    when: (f) => !!f.weekend,
    text: {
      en: "At the weekend it's {weekend}. Cabin weather or sofa weather?",
      fi: 'Viikonloppuna {weekend}. Mökkisää vai sohvasää?',
      sv: 'I helgen: {weekend}. Stugväder eller soffväder?',
      nb: 'I helgen: {weekend}. Hyttevær eller sofavær?',
    },
  },
  // ── Rain ──
  {
    when: (f) => f.raining,
    text: {
      en: 'Did you get caught in the rain on the way here?',
      fi: 'Kastuitko sateessa matkalla tänne?',
      sv: 'Blev du blöt i regnet på vägen hit?',
      nb: 'Ble du våt i regnet på vei hit?',
    },
  },
  {
    when: (f) => f.raining,
    text: {
      en: 'Rain again today. Are you an umbrella person or a hood person?',
      fi: 'Taas sataa. Oletko sateenvarjo- vai huppuihminen?',
      sv: 'Regn igen i dag. Är du en paraplymänniska eller en luvmänniska?',
      nb: 'Regn igjen i dag. Er du et paraplymenneske eller et hettemenneske?',
    },
  },
  {
    when: (f) => f.raining,
    text: {
      en: 'Proper rainy day, this. Perfect for a book and a cup of tea, isn’t it?',
      fi: 'Kunnon sadepäivä. Täydellinen kirjalle ja teekupille, eikö?',
      sv: 'En riktig regndag. Perfekt för en bok och en kopp te, va?',
      nb: 'En ordentlig regnværsdag. Perfekt for en bok og en kopp te, hva?',
    },
  },
  {
    when: (f) => !!f.amount,
    text: {
      en: 'About {amount} of rain in the next few hours. Did you bring a raincoat?',
      fi: 'Seuraavina tunteina noin {amount} sadetta. Toitko sadetakin?',
      sv: 'Ungefär {amount} regn de närmaste timmarna. Har du regnjacka med dig?',
      nb: 'Rundt {amount} regn de neste timene. Har du med regnjakke?',
    },
  },
  {
    when: (f) => !!f.rainFrom,
    text: {
      en: 'Rain from about {rainFrom}. Will you make it home before it starts?',
      fi: 'Sadetta noin klo {rainFrom} alkaen. Ehditkö kotiin ennen sitä?',
      sv: 'Regn från omkring kl. {rainFrom}. Hinner du hem innan det börjar?',
      nb: 'Regn fra rundt kl. {rainFrom}. Rekker du hjem før det begynner?',
    },
  },
  {
    when: (f) => !!f.rainFrom,
    text: {
      en: 'Dry for now, but rain is due around {rainFrom}. Making the most of it?',
      fi: 'Vielä poutaa, mutta sadetta on luvassa noin klo {rainFrom}. Otatko tästä kaiken irti?',
      sv: 'Uppehåll än så länge, men regn väntas omkring kl. {rainFrom}. Passar du på?',
      nb: 'Opphold foreløpig, men regn ventes rundt kl. {rainFrom}. Benytter du anledningen?',
    },
  },
  {
    when: (f) => !!f.percent,
    text: {
      en: '{percent} chance of rain soon. Feeling lucky?',
      fi: 'Pian sateen todennäköisyys {percent}. Tunnetko olevasi onnekas?',
      sv: '{percent} risk för regn snart. Känner du dig lyckligt lottad?',
      nb: '{percent} sjanse for regn snart. Føler du deg heldig?',
    },
  },
  {
    when: (f) => f.rainStopped,
    text: {
      en: 'The rain stopped at last. Did you get out in the dry spell?',
      fi: 'Sade vihdoin loppui. Ehditkö ulos poutahetkenä?',
      sv: 'Äntligen slutade det regna. Hann du ut i uppehållet?',
      nb: 'Endelig sluttet det å regne. Rakk du ut i oppholdet?',
    },
  },
  {
    when: (f) => f.rainStopped,
    text: {
      en: 'Everything smells fresh after the rain, doesn’t it?',
      fi: 'Kaikki tuoksuu raikkaalta sateen jälkeen, eikö?',
      sv: 'Allt luktar så friskt efter regnet, va?',
      nb: 'Alt lukter så friskt etter regnet, hva?',
    },
  },
  // ── Snow ──
  {
    when: (f) => !!f.snow,
    text: {
      en: '{snow} of new snow. Have you had to shovel yet?',
      fi: '{snow} uutta lunta. Joko olet joutunut lapioimaan?',
      sv: '{snow} nysnö. Har du behövt skotta än?',
      nb: '{snow} nysnø. Har du måttet måke ennå?',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: 'Snow today, {snow} of it. Does it feel like Christmas yet?',
      fi: 'Tänään lunta, {snow}. Joko tuntuu jouluiselta?',
      sv: 'Snö i dag, {snow}. Känns det som jul än?',
      nb: 'Snø i dag, {snow}. Føles det som jul ennå?',
    },
  },
  {
    when: (f) => !!f.snow,
    text: {
      en: '{snow} of snow today. Winter tyres on already?',
      fi: '{snow} lunta tänään. Joko talvirenkaat on vaihdettu?',
      sv: '{snow} snö i dag. Har du bytt till vinterdäck än?',
      nb: '{snow} snø i dag. Har du byttet til vinterdekk ennå?',
    },
  },
  {
    when: (f) => !!f.snowFrom,
    text: {
      en: 'Snow coming from about {snowFrom}. Are you looking forward to it or dreading it?',
      fi: 'Lunta tulossa noin klo {snowFrom} alkaen. Odotatko sitä innolla vai kauhulla?',
      sv: 'Snö på väg från omkring kl. {snowFrom}. Ser du fram emot det eller bävar du?',
      nb: 'Snø på vei fra rundt kl. {snowFrom}. Gleder du deg eller gruer du deg?',
    },
  },
  {
    when: (f) => !!f.snowFrom,
    text: {
      en: 'Snow due from {snowFrom}, apparently. Skis waxed?',
      fi: 'Lunta luvassa klo {snowFrom} alkaen. Onko sukset jo voideltu?',
      sv: 'Snö väntas från kl. {snowFrom}. Är skidorna vallade?',
      nb: 'Snø ventes fra kl. {snowFrom}. Er skiene smurt?',
    },
  },
  // ── Wind ──
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'Gusts of {gusts} today. Did your umbrella survive?',
      fi: 'Puuskat {gusts} tänään. Selvisikö sateenvarjosi hengissä?',
      sv: 'Vindbyar på {gusts} i dag. Överlevde ditt paraply?',
      nb: 'Vindkast på {gusts} i dag. Overlevde paraplyen din?',
    },
  },
  {
    when: (f) => !!f.gusts,
    text: {
      en: 'Wind coming {from} with gusts of {gusts}. Was it a headwind on your way in?',
      fi: 'Tuulee {from}, puuskat {gusts}. Oliko vastatuuli matkalla tänne?',
      sv: 'Det blåser {from} med vindbyar på {gusts}. Var det motvind på vägen hit?',
      nb: 'Det blåser {from} med vindkast på {gusts}. Var det motvind på vei hit?',
    },
  },
  {
    when: (f) => !!f.wind,
    text: {
      en: 'Windy one today, {wind}. Good day for drying the washing, at least.',
      fi: 'Tuulinen päivä, {wind}. Hyvä pyykinkuivatussää ainakin.',
      sv: 'Blåsigt i dag, {wind}. Bra torkväder för tvätten i alla fall.',
      nb: 'Vindfull dag, {wind}. Godt tørkevær for klesvasken i hvert fall.',
    },
  },
  {
    when: (f) => f.feelsColder,
    text: {
      en: 'The wind makes {temp} feel like {feels}. Did you dress for the wind?',
      fi: 'Tuuli saa lämpötilan {temp} tuntumaan kuin olisi {feels}. Pukeuduitko tuulta vastaan?',
      sv: 'Vinden gör att {temp} känns som {feels}. Klädde du dig för vinden?',
      nb: 'Vinden gjør at {temp} føles som {feels}. Kledde du deg for vinden?',
    },
  },
  {
    when: (f) => f.feelsColder,
    text: {
      en: 'Feels like {feels} in the wind. Colder than it looks out there, isn’t it?',
      fi: 'Tuulessa tuntuu kuin olisi {feels}. Kylmempää kuin miltä näyttää, eikö?',
      sv: 'Känns som {feels} i vinden. Kallare än det ser ut, va?',
      nb: 'Føles som {feels} i vinden. Kaldere enn det ser ut, hva?',
    },
  },
  // ── Temperature ──
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp} today! Did your car start this morning?',
      fi: '{temp} tänään! Lähtikö autosi käyntiin aamulla?',
      sv: '{temp} i dag! Startade bilen i morse?',
      nb: '{temp} i dag! Startet bilen i morges?',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: '{temp} out there. How many layers are you wearing?',
      fi: 'Ulkona {temp}. Montako kerrosta sinulla on päällä?',
      sv: '{temp} ute. Hur många lager har du på dig?',
      nb: '{temp} ute. Hvor mange lag har du på deg?',
    },
  },
  {
    when: (f) => f.veryCold,
    text: {
      en: 'Proper frost, {temp}. Have you seen the trees all white with rime?',
      fi: 'Kunnon pakkanen, {temp}. Näitkö puut aivan valkoisina huurteesta?',
      sv: 'Riktig kyla, {temp}. Har du sett träden alldeles vita av rimfrost?',
      nb: 'Ordentlig kulde, {temp}. Har du sett trærne helt hvite av rim?',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: 'Just below zero today, {temp}. Have the roads been gritted where you are?',
      fi: 'Vähän pakkasella, {temp}. Onko teillä hiekoitettu?',
      sv: 'Strax under noll i dag, {temp}. Har de sandat hos er?',
      nb: 'Like under null i dag, {temp}. Har de strødd der du bor?',
    },
  },
  {
    when: (f) => f.freezing,
    text: {
      en: '{temp} this morning. Did you have to scrape the car?',
      fi: '{temp} tänään. Piti raapia auton ikkunoita?',
      sv: '{temp} i dag. Fick du skrapa bilrutorna?',
      nb: '{temp} i dag. Måtte du skrape bilruta?',
    },
  },
  {
    when: (f) => f.cool,
    text: {
      en: '{temp} and a bit raw. Hot drink weather, wouldn’t you say?',
      fi: '{temp} ja vähän koleaa. Kuuman juoman säätä, vai mitä?',
      sv: '{temp} och lite rått. Väder för något varmt att dricka, va?',
      nb: '{temp} og litt rått. Vær for noe varmt å drikke, hva?',
    },
  },
  {
    when: (f) => f.cool,
    text: {
      en: '{temp} today. Have you switched to the winter coat yet?',
      fi: '{temp} tänään. Joko vaihdoit talvitakkiin?',
      sv: '{temp} i dag. Har du bytt till vinterjackan än?',
      nb: '{temp} i dag. Har du byttet til vinterjakka ennå?',
    },
  },
  {
    when: (f) => f.mild,
    text: {
      en: 'Mild for the time of year, {temp}. Do you think it will last?',
      fi: 'Leutoa vuodenaikaan nähden, {temp}. Luuletko, että tätä kestää?',
      sv: 'Milt för årstiden, {temp}. Tror du att det håller i sig?',
      nb: 'Mildt for årstiden, {temp}. Tror du det varer?',
    },
  },
  {
    when: (f) => f.mild,
    text: {
      en: '{temp} and dry. Nice day for a walk, isn’t it?',
      fi: '{temp} ja poutaa. Mukava päivä kävelylle, eikö?',
      sv: '{temp} och uppehåll. Fin dag för en promenad, va?',
      nb: '{temp} og opphold. Fin dag for en tur, hva?',
    },
  },
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: '{temp} and sunshine! Have you managed to get outside today?',
      fi: '{temp} ja auringonpaistetta! Oletko päässyt ulos tänään?',
      sv: '{temp} och solsken! Har du hunnit ut i dag?',
      nb: '{temp} og solskinn! Har du kommet deg ut i dag?',
    },
  },
  {
    when: (f) => f.warmAndSunny,
    text: {
      en: 'Gorgeous, {temp} and sunny. Swimming weather yet, do you think?',
      fi: 'Upeaa, {temp} ja aurinkoista. Joko on uimakeli, mitä luulet?',
      sv: 'Underbart, {temp} och sol. Badväder än, tror du?',
      nb: 'Nydelig, {temp} og sol. Badevær ennå, tror du?',
    },
  },
  {
    when: (f) => f.heat,
    text: {
      en: '{temp}! How are you sleeping in this heat?',
      fi: '{temp}! Miten saat nukuttua tässä helteessä?',
      sv: '{temp}! Hur sover du i den här värmen?',
      nb: '{temp}! Hvordan sover du i denne varmen?',
    },
  },
  {
    when: (f) => f.heat,
    text: {
      en: 'Heatwave, {temp}. Have you found a cool spot anywhere?',
      fi: 'Helleaalto, {temp}. Oletko löytänyt jostain viileän paikan?',
      sv: 'Värmebölja, {temp}. Har du hittat något svalt ställe?',
      nb: 'Hetebølge, {temp}. Har du funnet et kjølig sted noe sted?',
    },
  },
  // ── Sky ──
  {
    when: (f) => f.clear,
    text: {
      en: 'Not a cloud in the sky today. Did you catch some sun?',
      fi: 'Ei pilveäkään taivaalla. Ehditkö ottaa aurinkoa?',
      sv: 'Inte ett moln på himlen i dag. Fick du lite sol?',
      nb: 'Ikke en sky på himmelen i dag. Fikk du litt sol?',
    },
  },
  {
    when: (f) => f.clear,
    text: {
      en: 'Clear skies today. Might be a cold, starry night later, don’t you think?',
      fi: 'Kirkas taivas tänään. Illasta voi tulla kylmä ja tähtikirkas, eikö?',
      sv: 'Klar himmel i dag. Det kan bli en kall stjärnklar natt sen, tror du inte?',
      nb: 'Klar himmel i dag. Kan bli en kald, stjerneklar natt senere, tror du ikke?',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'Overcast again. Missing the sun as much as I am?',
      fi: 'Taas pilvistä. Kaipaatko aurinkoa yhtä paljon kuin minä?',
      sv: 'Mulet igen. Saknar du solen lika mycket som jag?',
      nb: 'Overskyet igjen. Savner du sola like mye som meg?',
    },
  },
  {
    when: (f) => f.grey,
    text: {
      en: 'Another grey day. How do you keep your spirits up?',
      fi: 'Taas harmaa päivä. Miten pidät mielen virkeänä?',
      sv: 'Ännu en grå dag. Hur håller du humöret uppe?',
      nb: 'Enda en grå dag. Hvordan holder du humøret oppe?',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: 'Foggy today. Was it hard driving in?',
      fi: 'Sumuista tänään. Oliko ajaminen hankalaa?',
      sv: 'Dimmigt i dag. Var det svårt att köra hit?',
      nb: 'Tåkete i dag. Var det vanskelig å kjøre hit?',
    },
  },
  {
    when: (f) => f.fog,
    text: {
      en: 'Fog everywhere. A bit eerie, isn’t it?',
      fi: 'Sumua kaikkialla. Vähän aavemaista, eikö?',
      sv: 'Dimma överallt. Lite kusligt, va?',
      nb: 'Tåke overalt. Litt skummelt, hva?',
    },
  },
  {
    when: (f) => !!f.thunderAt,
    text: {
      en: 'Thunderstorms around {thunderAt}, they say. Do you like a good storm?',
      fi: 'Ukkosta noin klo {thunderAt}, sanovat. Pidätkö kunnon ukkosesta?',
      sv: 'Åska omkring kl. {thunderAt}, säger de. Gillar du ett ordentligt oväder?',
      nb: 'Torden rundt kl. {thunderAt}, sier de. Liker du et skikkelig uvær?',
    },
  },
  {
    when: (f) => !!f.uv,
    text: {
      en: 'UV {uv} today. Remembered the sunscreen?',
      fi: 'UV {uv} tänään. Muistitko aurinkorasvan?',
      sv: 'UV {uv} i dag. Kom du ihåg solkrämen?',
      nb: 'UV {uv} i dag. Husket du solkremen?',
    },
  },
  {
    when: (f) => !!f.humidity,
    text: {
      en: 'Humidity {humidity}. Muggy, isn’t it?',
      fi: 'Ilmankosteus {humidity}. Tukalaa, eikö?',
      sv: 'Luftfuktighet {humidity}. Kvavt, va?',
      nb: 'Luftfuktighet {humidity}. Lummert, hva?',
    },
  },
  {
    when: (f) => f.pressureFalling,
    text: {
      en: 'The air pressure is dropping. Do you feel the weather changing?',
      fi: 'Ilmanpaine laskee. Tunnetko sään muuttuvan?',
      sv: 'Lufttrycket sjunker. Känner du att vädret slår om?',
      nb: 'Lufttrykket synker. Kjenner du at været snur?',
    },
  },
  // ── Light and darkness ──
  {
    when: (f) => !!f.daylight,
    text: {
      en: '{daylight} of daylight today. How do you cope with the dark season?',
      fi: '{daylight} valoisaa tänään. Miten selviät pimeästä vuodenajasta?',
      sv: '{daylight} dagsljus i dag. Hur klarar du den mörka årstiden?',
      nb: '{daylight} dagslys i dag. Hvordan takler du den mørke årstiden?',
    },
  },
  {
    when: (f) => !!f.daylight,
    text: {
      en: 'Just {daylight} of light today. Do you go for a walk at lunchtime to catch it?',
      fi: 'Vain {daylight} valoa tänään. Käytkö lounastauolla kävelyllä, jotta näet sitä?',
      sv: 'Bara {daylight} ljus i dag. Tar du en lunchpromenad för att få lite av det?',
      nb: 'Bare {daylight} lys i dag. Tar du en lunsjtur for å få med deg litt?',
    },
  },
  {
    when: (f) => !!f.shorter,
    text: {
      en: 'The days keep getting shorter: {shorter} min less tomorrow. Do you mind the dark?',
      fi: 'Päivät lyhenevät: huomenna {shorter} min vähemmän. Haittaako pimeys sinua?',
      sv: 'Dagarna blir kortare: {shorter} min mindre i morgon. Stör mörkret dig?',
      nb: 'Dagene blir kortere: {shorter} min mindre i morgen. Plager mørket deg?',
    },
  },
  {
    when: (f) => !!f.longer,
    text: {
      en: '{longer} min more light tomorrow. Have you noticed the evenings getting lighter?',
      fi: 'Huomenna {longer} min enemmän valoa. Oletko huomannut, että illat valoistuvat?',
      sv: '{longer} min mer ljus i morgon. Har du märkt att kvällarna blir ljusare?',
      nb: '{longer} min mer lys i morgen. Har du merket at kveldene blir lysere?',
    },
  },
  {
    when: (f) => f.darkMorning,
    text: {
      en: 'Dark until {sunrise}. How do you get yourself out of bed in this?',
      fi: 'Pimeää klo {sunrise} asti. Miten saat itsesi ylös sängystä tällaisena aamuna?',
      sv: 'Mörkt till kl. {sunrise}. Hur tar du dig ur sängen i det här?',
      nb: 'Mørkt til kl. {sunrise}. Hvordan kommer du deg ut av senga i dette?',
    },
  },
  {
    when: (f) => f.darkMorning,
    text: {
      en: 'The sun is only up at {sunrise}. Do you use a daylight lamp?',
      fi: 'Aurinko nousee vasta klo {sunrise}. Käytätkö kirkasvalolamppua?',
      sv: 'Solen går upp först kl. {sunrise}. Använder du en dagsljuslampa?',
      nb: 'Sola står først opp kl. {sunrise}. Bruker du dagslyslampe?',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: 'Already dark since {sunset}. Do you light candles on evenings like this?',
      fi: 'Pimeää jo klo {sunset} lähtien. Sytytätkö kynttilöitä tällaisina iltoina?',
      sv: 'Mörkt redan sedan kl. {sunset}. Tänder du ljus sådana här kvällar?',
      nb: 'Mørkt allerede siden kl. {sunset}. Tenner du lys på kvelder som dette?',
    },
  },
  {
    when: (f) => !!f.sunset,
    text: {
      en: 'Sun went down at {sunset}. What do you do with these long evenings?',
      fi: 'Aurinko laski klo {sunset}. Mitä teet näinä pitkinä iltoina?',
      sv: 'Solen gick ned kl. {sunset}. Vad gör du på de här långa kvällarna?',
      nb: 'Sola gikk ned kl. {sunset}. Hva gjør du på disse lange kveldene?',
    },
  },
  {
    when: (f) => !!f.sunsetAt,
    text: {
      en: 'Sunset at {sunsetAt} today. Going out for a bit of daylight first?',
      fi: 'Aurinko laskee tänään klo {sunsetAt}. Käytkö ensin ulkona valoisaan aikaan?',
      sv: 'Solnedgång kl. {sunsetAt} i dag. Går du ut och tar lite dagsljus först?',
      nb: 'Solnedgang kl. {sunsetAt} i dag. Går du ut og får litt dagslys først?',
    },
  },
  {
    when: (f) => !!f.sunsetAt,
    text: {
      en: 'The sun sets at {sunsetAt}. Could be a nice sunset tonight, couldn’t it?',
      fi: 'Aurinko laskee klo {sunsetAt}. Illasta voi tulla kaunis auringonlasku, eikö?',
      sv: 'Solen går ned kl. {sunsetAt}. Det kan bli en fin solnedgång i kväll, va?',
      nb: 'Sola går ned kl. {sunsetAt}. Det kan bli en fin solnedgang i kveld, hva?',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: 'Polar night now. How many weeks until the sun comes back, do you know?',
      fi: 'Nyt on kaamos. Tiedätkö, montako viikkoa auringon paluuseen on?',
      sv: 'Polarnatt nu. Vet du hur många veckor det är tills solen kommer tillbaka?',
      nb: 'Mørketid nå. Vet du hvor mange uker det er til sola kommer tilbake?',
    },
  },
  {
    when: (f) => f.polarNight,
    text: {
      en: 'No sunrise today at all. Have you seen any northern lights lately?',
      fi: 'Aurinko ei nouse tänään lainkaan. Oletko nähnyt revontulia viime aikoina?',
      sv: 'Ingen soluppgång alls i dag. Har du sett något norrsken på sistone?',
      nb: 'Ingen soloppgang i dag i det hele tatt. Har du sett nordlys i det siste?',
    },
  },
  {
    when: (f) => f.midnightSun,
    text: {
      en: 'Midnight sun! Have you been up all night enjoying it?',
      fi: 'Yötön yö! Oletko valvonut koko yön nauttimassa siitä?',
      sv: 'Midnattssol! Har du varit uppe hela natten och njutit av den?',
      nb: 'Midnattssol! Har du vært oppe hele natta og nytt den?',
    },
  },
  {
    when: (f) => f.midnightSun,
    text: {
      en: 'The sun doesn’t set tonight. Do you have blackout curtains?',
      fi: 'Aurinko ei laske tänä yönä. Onko sinulla pimennysverhot?',
      sv: 'Solen går inte ned i natt. Har du mörkläggningsgardiner?',
      nb: 'Sola går ikke ned i natt. Har du blendingsgardiner?',
    },
  },
  // ── Beer outside ──
  {
    when: (f) => f.beerWarms,
    text: {
      en: 'Out here a cold beer lasts about {beerTime}. Terrace weather, isn’t it?',
      fi: 'Täällä ulkona kylmä olut kestää noin {beerTime}. Terassikeli, eikö?',
      sv: 'Här ute håller en kall öl i ungefär {beerTime}. Uteserveringsväder, va?',
      nb: 'Her ute holder en kald øl seg i omtrent {beerTime}. Uteserveringsvær, hva?',
    },
  },
  {
    when: (f) => f.beerFreezes,
    text: {
      en: 'Cold enough that a beer would freeze in {beerTime}. Fancy a hot drink instead?',
      fi: 'Niin kylmää, että olut jäätyisi {beerTime} kuluessa. Maistuisiko mieluummin jokin lämmin?',
      sv: 'Så kallt att en öl skulle frysa på {beerTime}. Sugen på något varmt i stället?',
      nb: 'Så kaldt at en øl ville frosset på {beerTime}. Lyst på noe varmt i stedet?',
    },
  },
  {
    when: (f) => f.beerStaysCold,
    text: {
      en: 'Good weather for keeping drinks cool on the balcony. Do you use yours as a fridge?',
      fi: 'Hyvä sää pitää juomat kylminä parvekkeella. Käytätkö omaasi jääkaappina?',
      sv: 'Bra väder för att hålla drycker kalla på balkongen. Använder du din som kylskåp?',
      nb: 'Godt vær for å holde drikke kald på balkongen. Bruker du din som kjøleskap?',
    },
  },
];
