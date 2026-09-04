const board = document.querySelector('#board');
const places = document.querySelector('#places');

const SIZE = 6;

for (let row = 0; row < SIZE; row++) {
  for (let col = 0; col < SIZE; col++) {
    const card = document.createElement('div');
    card.classList.add('card', (row + col) % 2 === 0 ? 'light' : 'dark');
    board.appendChild(card);
  }
}

const pieces = [
  'T', 'L', 'W', 'm', 'L', 'T',
  'i', 'i', 'i', 'i', 'i', 'i',
  '',  '',  '',  '',  '',  '',
  '',  '',  '',  '',  '',  '',
  'i', 'i', 'i', 'i', 'i', 'i',
  'T', 'L', 'W', 'm', 'L', 'T',
];

const TOP = 'top';
const BOTTOM = 'bottom';

const topIsWhite = Math.random() < 0.5;

// État du jeu : une case = null ou { type, side }
const state = pieces.map((type, i) => {
  if (type === '') return null;
  return { type, side: i < pieces.length / 2 ? TOP : BOTTOM };
});

let selected = null;
let legalMoves = [];

function toRow(index) {
  return Math.floor(index / SIZE);
}

function toCol(index) {
  return index % SIZE;
}

function isWhiteSide(side) {
  return side === TOP ? topIsWhite : !topIsWhite;
}

// Direction d'avance : le bas monte, le haut descend
function forward(side) {
  return side === BOTTOM ? -1 : 1;
}

function movesForPawn(index, piece) {
  const moves = [];
  const row = toRow(index) + forward(piece.side);
  if (row < 0 || row >= SIZE) return moves;

  const target = row * SIZE + toCol(index);
  if (state[target] === null) moves.push(target);

  return moves;
}

function movesFor(index) {
  const piece = state[index];
  if (piece === null) return [];
  if (piece.type === 'i') return movesForPawn(index, piece);
  return [];
}

function select(index) {
  selected = index;
  legalMoves = movesFor(index);
  render();
}

function clearSelection() {
  selected = null;
  legalMoves = [];
  render();
}

function move(from, to) {
  state[to] = state[from];
  state[from] = null;
  clearSelection();
}

function onPlaceClick(index) {
  if (legalMoves.includes(index)) {
    move(selected, index);
    return;
  }

  const piece = state[index];
  // Le parti du bas est joué à la main, le haut sera géré par l'algorithme
  if (piece !== null && piece.side === BOTTOM) {
    select(index);
    return;
  }

  clearSelection();
}

function render() {
  places.replaceChildren();

  for (let i = 0; i < state.length; i++) {
    const piece = state[i];
    const place = document.createElement('div');
    place.classList.add('place');

    if (piece !== null) {
      place.textContent = piece.type;
      place.classList.add(isWhiteSide(piece.side) ? 'white' : 'black');
    }

    if (i === selected) place.classList.add('selected');
    if (legalMoves.includes(i)) place.classList.add('move');

    place.addEventListener('click', () => onPlaceClick(i));
    places.appendChild(place);
  }
}

render();
