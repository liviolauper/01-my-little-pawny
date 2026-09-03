const board = document.querySelector('#board');
const places = document.querySelector('#places');
const pieces = [
    "i",
    "w",
    "x",
    "T",
];
const style = getComputedStyle(board);
const cols = style.gridTemplateColumns.split(' ').length;
const rows = style.gridTemplateRows.split(' ').length;

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
    card.dataset.row = row;
    card.dataset.col = col;
    board.appendChild(card);
  }
}
