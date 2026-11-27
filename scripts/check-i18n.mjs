// Every text the app shows has a Finnish, a Swedish and a Norwegian translation: the
// keys of t('…'), plural(…), msg('…') in src/, and the data-i18n texts,
// data-i18n-attrs values and data-i18n-html names in index.html, against
// src/i18n-fi.ts, src/i18n-sv.ts and src/i18n-nb.ts. Text written in src/style.css
// (`content: '…'`) fails too. Also lists entries nothing uses any more.
// CI runs it (fast, no browser); tests/finnish.spec.ts and
// tests/swedish.spec.ts check the running app too.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { exit } from 'node:process';
import { FINNISH } from '../src/i18n-fi.ts';
import { SWEDISH } from '../src/i18n-sv.ts';
import { NORWEGIAN } from '../src/i18n-nb.ts';
import { FINNISH_ABOUT } from '../src/i18n-about-fi.ts';
import { SWEDISH_ABOUT } from '../src/i18n-about-sv.ts';
import { NORWEGIAN_ABOUT } from '../src/i18n-about-nb.ts';
import { OPENINGS, VERSES } from '../src/quips/haiku-lines.ts';

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !/i18n-(about-)?[a-z]+\.ts$/.test(path) ? [path] : [];
  });
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();
const unescape = (text) => text.replace(/\\(['"\\])/g, '$1');
const used = new Set();

// t('…'), msg('…'), and the two texts of plural(count, '…', '…'), in
// single or double quotes.
const QUOTED = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
for (const file of sourceFiles('src')) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(
    /\b(?:t|msg)\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g,
  )) {
    used.add(unescape(match[1] ?? match[2]));
  }
  for (const match of source.matchAll(/\bplural\(\s*[^,]+,([^)]*)\)/g)) {
    for (const quoted of match[1].matchAll(QUOTED)) used.add(unescape(quoted[1] ?? quoted[2]));
  }
}

const html = readFileSync('index.html', 'utf8');
for (const match of html.matchAll(/<[a-z0-9]+\s[^>]*\bdata-i18n(?=[\s>])[^>]*>([^<]*)</g)) {
  used.add(collapse(match[1]));
}
for (const match of html.matchAll(/<[a-z0-9]+\s[^>]*\bdata-i18n-attrs="([^"]+)"[^>]*>/g)) {
  for (const name of match[1].split(' ')) {
    const value = match[0].match(new RegExp(`\\s${name}="([^"]*)"`));
    if (value) used.add(collapse(value[1]));
  }
}
for (const match of html.matchAll(/\bdata-i18n-html="([^"]+)"/g)) used.add(`html:${match[1]}`);

// Text in the stylesheet can't be translated: `content: 'Favourites'`
// must be `content: attr(data-…)`, set from t() in the code.
const cssTexts = [
  ...readFileSync('src/style.css', 'utf8').matchAll(/content:\s*'([^']*[A-Za-z][^']*)'/g),
];
if (cssTexts.length > 0) {
  console.error(
    `Text in src/style.css can't be translated (use attr() and t()):\n  ${cssTexts.map((m) => m[1]).join('\n  ')}`,
  );
  exit(1);
}

const LANGUAGES = [
  // About's texts load when it's opened (src/i18n-about-*.ts): one language each way.
  { name: 'Finnish', file: 'src/i18n-fi.ts', texts: { ...FINNISH, ...FINNISH_ABOUT } },
  { name: 'Swedish', file: 'src/i18n-sv.ts', texts: { ...SWEDISH, ...SWEDISH_ABOUT } },
  { name: 'Norwegian', file: 'src/i18n-nb.ts', texts: { ...NORWEGIAN, ...NORWEGIAN_ABOUT } },
];

// The weather excuses and small talk (src/quips/) and the quiz (src/quiz/)
// keep their lines in all
// four languages side by side (TypeScript checks none is missing): check
// each line's {placeholders} are the same in every language.
const STRING = String.raw`(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")`;
const LINE = new RegExp(
  String.raw`\b\w+: \{\s*en:\s*${STRING},\s*fi:\s*${STRING},\s*sv:\s*${STRING},\s*nb:\s*${STRING},?\s*\}`,
  'g',
);
// Also the number of *…* marks (bold words in the quiz's questions).
const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',') + ` *${(text.match(/\*/g) ?? []).length}`;
let badLines = 0;
let quipLines = 0;
const sideBySide = [
  ...['src/quips', 'src/quiz', 'src/journey', 'src/balloon', 'src/layer'].flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith('.ts'))
      .map((name) => `${dir}/${name}`),
  ),
  'src/render/fishing-texts.ts',
];
for (const file of sideBySide) {
  for (const match of readFileSync(file, 'utf8').matchAll(LINE)) {
    quipLines++;
    const [en, fi, sv, nb] = [1, 3, 5, 7].map((i) => match[i] ?? match[i + 1]);
    const want = placeholders(en);
    for (const [name, text] of [
      ['fi', fi],
      ['sv', sv],
      ['nb', nb],
    ]) {
      if (placeholders(text) !== want) {
        console.error(
          `src/quips/${file}: placeholders differ in ${name}:\n  en: ${en}\n  ${name}: ${text}`,
        );
        badLines++;
      }
    }
  }
}
if (badLines > 0 || quipLines === 0) {
  if (quipLines === 0)
    console.error('No lines found in src/quips/ or src/quiz/ (has their format changed?)');
  exit(1);
}
console.log(
  `ok   ${quipLines} quiz, excuse and small talk texts, same placeholders in all languages`,
);

// The weather haiku's Finnish lines are 5-7-5. Finnish syllables follow
// the vowels: a long vowel or a diphthong is one syllable, any other
// vowel pair two (good enough for the words used; no loan words).
const VOWELS = 'aeiouyäö';
const DIPHTHONGS = new Set('ai ei oi ui yi äi öi au eu iu ou ey iy äy öy ie uo yö'.split(' '));
function finnishSyllables(text) {
  let count = 0;
  for (const word of text.toLocaleLowerCase('fi').match(/[a-zåäö]+/g) ?? []) {
    for (let i = 0; i < word.length; i++) {
      if (!VOWELS.includes(word[i])) continue;
      count++;
      const pair = word.slice(i, i + 2);
      if (pair.length === 2 && (pair[0] === pair[1] || DIPHTHONGS.has(pair))) i++;
    }
  }
  return count;
}
const haikuLines = [
  ...OPENINGS.map(({ text }) => [text.fi, 5]),
  ...Object.values(VERSES).flatMap(({ middle, last }) => [
    ...middle.map((text) => [text.fi, 7]),
    ...last.map((text) => [text.fi, 5]),
  ]),
];
const badHaiku = haikuLines.filter(([text, want]) => finnishSyllables(text) !== want);
for (const [text, want] of badHaiku) {
  console.error(
    `src/quips/haiku-lines.ts: "${text}" has ${finnishSyllables(text)} syllables, not ${want}`,
  );
}
if (badHaiku.length > 0) exit(1);
console.log(`ok   ${haikuLines.length} Finnish haiku lines, 5-7-5`);

let failed = false;
for (const { name, file, texts } of LANGUAGES) {
  const missing = [...used].filter((key) => !(key in texts));
  const unused = Object.keys(texts).filter((key) => !used.has(key));
  if (unused.length > 0) {
    console.log(`${name} texts nothing uses (remove them):\n  ${unused.join('\n  ')}\n`);
  }
  if (missing.length > 0) {
    console.error(`No ${name} for these texts (add them to ${file}):\n  ${missing.join('\n  ')}`);
    failed = true;
  }
}
if (failed) exit(1);
console.log(`ok   ${used.size} texts, all in Finnish, Swedish and Norwegian`);
