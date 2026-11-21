const alphabet = 'ABCDEFGHILMNOPQRSTUVZ';
const word = document.querySelector('#word');
const letters = document.querySelector('#letters');
const erase = document.querySelector('#erase');
const speak = document.querySelector('#speak');
const status = document.querySelector('#status');
const animals = document.querySelector('#animals');
const voice = window.speechSynthesis;
const nativeSpeech = window.webkit?.messageHandlers?.beaSpeech;
let value = '';
let currentSound;
let currentAnimal;

function render() {
  if (value) {
    word.textContent = value;
  } else {
    const hint = document.createElement('span');
    hint.textContent = 'Tocca una lettera';
    word.replaceChildren(hint);
  }
  word.classList.remove('mistake', 'arrive');
  reward.hidden = true;
  feedback.hidden = true;
  reset.disabled = !value;
  fitWord();
  erase.disabled = !value;
  speak.disabled = !value;
  status.hidden = true;
}
function showError(message) {
  status.textContent = message;
  status.hidden = false;
}
function stopAnimal() {
  currentSound?.pause();
  currentAnimal?.setAttribute('aria-pressed', 'false');
  currentSound = undefined;
  currentAnimal = undefined;
}

const reset = document.querySelector('#reset');
const reward = document.querySelector('#reward');
const feedback = document.querySelector('#feedback');
const names = 'a bi ci di e effe gi acca i elle emme enne o pi cu erre esse ti u vi zeta'.split(' ');
const recognized = new Set('ACQUA ALBERO APE ARCOBALENO AZZURRO BALENA BARCA BEA BEATRICE BICICLETTA BLU BOSCO BRACCIO BUCO CALZA CANE CASA CAVALLO CENA CERCHIO CIAO CIELO COCCINELLA COLORE CONIGLIO CUORE DADO DENTE DITO DONO DUE ELEFANTE ERBA ESTATE FACCIA FAME FARFALLA FATA FIORE FOGLIA FRAGOLA FRUTTA FUOCO GALLINA GATTO GELATO GIALLO GIOCO GIORNO GIRASOLE GOMMA GRATTA GRIGIO LAGO LANA LATTE LETTERA LIBRO LUNA LUPO MAMMA MANO MARE MARRONE MELA MERAVIGLIOSAMENTE MIELE MONDO MUCCA NASO NAVE NEVE NIDO NONNA NONNO NOTTE NUVOLA OCA OCCHIO ONDA ORSO OTTO PALLA PANE PAPERA PAPA PAPÀ PAROLA PATATA PECORA PENNA PERA PESCE PIEDE PIOGGIA PIZZA PORTA PRATO QUADRATO QUATTRO RANA REGALO RETTANGOLO RICCIO ROSA ROSSO RUOTA SALE SEI SERPENTE SETTE SOLE STELLA TANA TAZZA TEMPO TIGRE TOPO TORTA TRE TRENO TRIANGOLO UNO UOVO UVA VERDE VENTO VIOLA VISO VITE ZEBRA ZERO ZIO ZUCCA'.split(' '));
const mistakes = new Map(Object.entries({
  AQA:'ACQUA', ACUA:'ACQUA', ACQUAA:'ACQUA', GATTOO:'GATTO', CANEE:'CANE',
  MAMMAA:'MAMMA', SOLEE:'SOLE', FARFALA:'FARFALLA', PIATZA:'PIAZZA'
}));
const ruler = document.createElement('canvas').getContext('2d');

function fitWord() {
  word.style.removeProperty('--word-size');
  if (!value) return;
  const style = getComputedStyle(word);
  let size = parseFloat(style.fontSize);
  const parent = word.parentElement;
  const frame = getComputedStyle(parent);
  const space = parent.clientWidth - parseFloat(frame.paddingLeft) - parseFloat(frame.paddingRight)
    - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 4;
  ruler.font = style.fontWeight + ' ' + size + 'px ' + style.fontFamily;
  const width = ruler.measureText(value).width + value.length * size * .045;
  if (width > space) word.style.setProperty('--word-size', Math.max(20, size * space / width) + 'px');
}

function animate(element, effect) {
  element.classList.remove(effect);
  void element.offsetWidth;
  element.classList.add(effect);
}

function say(text) {
  stopAnimal();
  status.hidden = true;
  if (nativeSpeech) return nativeSpeech.postMessage(text);
  if (!voice) return showError('La voce non è disponibile in questo browser.');
  voice.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'it-IT';
  utterance.rate = .85;
  const italian = voice.getVoices().filter(item => /^it(?:[-_]|$)/i.test(item.lang));
  const preferred = italian.find(item => /alice|federica|elsa|isabella|lucia|bianca|paola|female/i.test(item.name));
  const selected = preferred || italian.find(item => item.localService) || italian[0];
  if (selected) utterance.voice = selected;
  utterance.onerror = event => {
    if (!['interrupted', 'canceled'].includes(event.error)) showError('Tocca di nuovo per riprovare con la voce.');
  };
  voice.speak(utterance);
}

for (const [index, letter] of [...alphabet].entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'letter';
  button.textContent = letter;
  button.addEventListener('click', () => {
    value += letter;
    render();
    animate(button, 'lit');
    animate(word, 'arrive');
    say(names[index]);
  });
  letters.append(button);
}
erase.addEventListener('click', () => { value = value.slice(0, -1); render(); });
reset.addEventListener('click', () => { value = ''; render(); });
speak.addEventListener('click', () => {
  if (!value) return;
  reward.hidden = true;
  feedback.hidden = true;
  say(value.toLocaleLowerCase('it-IT'));
  if (recognized.has(value)) {
    word.classList.remove('mistake');
    reward.hidden = false;
    animate(reward, 'arrive');
  } else if (mistakes.has(value)) {
    word.classList.remove('arrive');
    feedback.textContent = 'Prova ' + mistakes.get(value);
    feedback.hidden = false;
    animate(word, 'mistake');
  }
});
window.addEventListener('resize', fitWord);

const activities = {
  numeri: Array.from({length: 10}, (_, i) => [String(i + 1), ['Uno','Due','Tre','Quattro','Cinque','Sei','Sette','Otto','Nove','Dieci'][i]]),
  colori: [['#e85c6e','Rosso'],['#fac950','Giallo'],['#68bb84','Verde'],['#5b99e5','Blu'],['#f18cba','Rosa'],['#a385e0','Viola']],
  forme: [['circle','Cerchio'],['square','Quadrato'],['triangle','Triangolo'],['rectangle','Rettangolo'],['diamond','Rombo'],['oval','Ovale']]
};
const tabs = [...document.querySelectorAll('[data-section]')];
const discovery = document.querySelector('#discovery');
for (const tab of tabs) {
  tab.addEventListener('click', () => {
    const section = tab.dataset.section;
    const alphabetShown = section === 'alfabeto';
    for (const item of tabs) item.setAttribute('aria-pressed', String(item === tab));
    document.querySelector('#alfabeto').hidden = !alphabetShown;
    discovery.hidden = alphabetShown;
    if (alphabetShown) { fitWord(); return; }
    document.querySelector('#discovery-title').textContent = tab.textContent.trim();
    const cards = document.querySelector('#cards');
    cards.replaceChildren();
    for (const [symbol, name] of activities[section]) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'activity-card';
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      if (section === 'numeri') visual.textContent = symbol;
      if (section === 'colori') { visual.className = 'swatch'; visual.style.background = symbol; }
      if (section === 'forme') visual.className = 'shape ' + symbol;
      card.append(visual, name);
      card.addEventListener('click', () => { animate(card, 'lit'); say(name); });
      cards.append(card);
    }
  });
}

const friends = [
  ['cane', 'Cane', '🐶'],
  ['gatto', 'Gatto', '🐱'],
  ['mucca', 'Mucca', '🐮'],
  ['papera', 'Papera', '🦆'],
];
for (const [file, name, face] of friends) {
  const sound = new Audio('audio/' + file + '.wav');
  sound.preload = 'auto';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'animal';
  button.setAttribute('aria-label', 'Ascolta il verso di ' + name.toLowerCase());
  button.setAttribute('aria-pressed', 'false');
  const illustration = document.createElement('span');
  illustration.className = 'face';
  illustration.setAttribute('aria-hidden', 'true');
  illustration.textContent = face;
  button.append(illustration, name);
  sound.addEventListener('ended', () => {
    if (currentSound === sound) stopAnimal();
  });
  button.addEventListener('click', () => {
    nativeSpeech?.postMessage(null);
    voice?.cancel();
    stopAnimal();
    status.hidden = true;
    sound.currentTime = 0;
    currentSound = sound;
    currentAnimal = button;
    button.setAttribute('aria-pressed', 'true');
    sound.play().catch(() => {
      if (currentSound !== sound || !sound.paused) return;
      stopAnimal();
      showError('Il verso non è partito. Tocca di nuovo l’animale.');
    });
  });
  animals.append(button);
}
voice?.getVoices();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline:', error));
}
