/* ---------- ÉLÉMENTS DU DOM ---------- */

const board = document.querySelector('#board'); // récupère la grille des couleurs
const places = document.querySelector('#places'); // récupère la grille des pièces
const start = document.querySelector('#start'); // récupère le bouton de départ

/* ---------- DAMIER ---------- */

const SIZE = 6; // côté du damier, 6 cases

for (let row = 0; row < SIZE; row++) { // parcourt chaque ligne
  for (let col = 0; col < SIZE; col++) { // parcourt chaque colonne
    const card = document.createElement('div'); // crée une case
    card.classList.add('card', (row + col) % 2 === 0 ? 'light' : 'dark'); // beige ou brun en alternance
    board.appendChild(card); // ajoute la case au damier
  }
}

/* ---------- PARTIS ET ÉTAT DE JEU ---------- */

const pieces = [ // disposition de départ, une lettre par case
  'T', 'L', 'W', 'cuk', 'L', 'T',
  'i', 'i', 'i', 'i', 'i', 'i',
  '',  '',  '',  '',  '',  '',
  '',  '',  '',  '',  '',  '',
  'i', 'i', 'i', 'i', 'i', 'i',
  'T', 'L', 'W', 'cuk', 'L', 'T',
];

const TOP = 'top'; // nom du parti du haut
const BOTTOM = 'bottom'; // nom du parti du bas

const topIsWhite = Math.random() < 0.5; // tire au sort la couleur du haut

const state = pieces.map((type, i) => { // transforme les lettres en état de jeu
  if (type === '') return null; // case vide
  return { type, side: i < pieces.length / 2 ? TOP : BOTTOM }; // pièce + son parti
});

let selected = null; // case actuellement sélectionnée
let legalMoves = []; // cases où la pièce sélectionnée peut aller
let turn = topIsWhite ? TOP : BOTTOM; // le parti blanc commence
let started = false; // la partie n'a pas encore commencé
const hasPlayed = { top: false, bottom: false }; // dit si un parti a déjà joué
const captured = { top: [], bottom: [] }; // pièces prises par chaque parti

/* ---------- OUTILS COMMUNS À TOUTES LES PIÈCES ---------- */

const STRAIGHT = [ // les 4 directions droites, en [ligne, colonne]
  [-1, 0], [1, 0], [0, -1], [0, 1],
];

const DIAGONAL = [ // les 4 diagonales, en [ligne, colonne]
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

function toRow(index) { // numéro de ligne d'une case
  return Math.floor(index / SIZE); // division entière par la largeur
}

function toCol(index) { // numéro de colonne d'une case
  return index % SIZE; // reste de la division par la largeur
}

function inBoard(r, c) { // dit si une ligne et une colonne sont sur le damier
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE; // les deux doivent rester dans les bornes
}

function isEnemy(target, side) { // dit si une case porte une pièce adverse
  return state[target] !== null && state[target].side !== side; // occupée par l'autre parti
}

function isFree(target) { // dit si une case est vide
  return state[target] === null; // aucune pièce dessus
}

function steps(index, piece, directions) { // cases voisines dans des directions données
  const moves = []; // liste à remplir
  const row = toRow(index); // ligne de départ
  const col = toCol(index); // colonne de départ

  for (const [dr, dc] of directions) { // essaie chaque direction
    const r = row + dr; // ligne visée
    const c = col + dc; // colonne visée
    if (!inBoard(r, c)) continue; // hors du damier

    const target = r * SIZE + c; // case visée
    if (isFree(target) || isEnemy(target, piece.side)) moves.push(target); // libre ou adverse
  }

  return moves; // renvoie les déplacements trouvés
}

function slide(index, piece, directions) { // glisse en ligne jusqu'à un obstacle
  const moves = []; // liste à remplir
  const row = toRow(index); // ligne de départ
  const col = toCol(index); // colonne de départ

  for (const [dr, dc] of directions) { // essaie chaque direction
    let r = row + dr; // première ligne dans cette direction
    let c = col + dc; // première colonne dans cette direction

    while (inBoard(r, c)) { // tant qu'on reste sur le damier
      const target = r * SIZE + c; // case examinée

      if (!isFree(target)) { // une pièce barre la route
        if (isEnemy(target, piece.side)) moves.push(target); // adverse, on peut la prendre
        break; // dans tous les cas la direction s'arrête
      }

      moves.push(target); // case libre, on peut s'y poser
      r += dr; // avance d'une case de plus
      c += dc; // avance d'une case de plus
    }
  }

  return moves; // renvoie les déplacements trouvés
}

/* ---------- PIÈCE "i" : LE PION ---------- */

function forward(side) { // sens d'avance d'un parti
  return side === BOTTOM ? -1 : 1; // le bas monte, le haut descend
}

function startRow(side) { // ligne de départ des "i" d'un parti
  return side === BOTTOM ? SIZE - 2 : 1; // avant-dernière ligne en bas, deuxième en haut
}

function movesForPawn(index, piece) { // déplacements possibles d'un "i"
  const moves = []; // liste à remplir
  const col = toCol(index); // colonne de la pièce
  const step = forward(piece.side); // sens d'avance du parti
  const first = toRow(index) + step; // ligne juste devant la pièce
  if (first < 0 || first >= SIZE) return moves; // sortie du damier, aucun déplacement

  for (const dc of [-1, 1]) { // les deux diagonales avant
    const c = col + dc; // colonne visée
    if (!inBoard(first, c)) continue; // hors du damier
    const target = first * SIZE + c; // case en diagonale
    if (isEnemy(target, piece.side)) moves.push(target); // le "i" ne prend qu'en diagonale
  }

  const one = first * SIZE + col; // case droit devant
  if (!isFree(one)) return moves; // bloquée, on ne peut pas avancer
  moves.push(one); // avance d'une case possible

  if (hasPlayed[piece.side]) return moves; // le parti a déjà joué, plus de double pas
  if (toRow(index) !== startRow(piece.side)) return moves; // pas au départ, pas de double pas

  const second = first + step; // deuxième ligne devant la pièce
  if (second < 0 || second >= SIZE) return moves; // sortie du damier
  const two = second * SIZE + col; // case deux crans devant
  if (isFree(two)) moves.push(two); // avance de deux cases possible

  return moves; // renvoie les déplacements trouvés
}

/* ---------- PIÈCE "L" : LE CAVALIER ---------- */

const KNIGHT_JUMPS = [ // les 8 sauts en L, en [ligne, colonne]
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

function movesForKnight(index, piece) { // déplacements possibles d'un "L"
  return steps(index, piece, KNIGHT_JUMPS); // il saute, seule l'arrivée compte
}

/* ---------- PIÈCE "T" : LA TOUR ---------- */

function movesForRook(index, piece) { // déplacements possibles d'un "T"
  return slide(index, piece, STRAIGHT); // seulement les lignes droites
}

/* ---------- PIÈCE "W" : LA REINE ---------- */

function movesForQueen(index, piece) { // déplacements possibles d'un "W"
  return slide(index, piece, STRAIGHT.concat(DIAGONAL)); // les droites et les diagonales
}

/* ---------- PIÈCE "cuk" : LE ROI ---------- */

function movesForKing(index, piece) { // déplacements possibles d'un "cuk"
  return steps(index, piece, STRAIGHT.concat(DIAGONAL)); // une seule case, dans les 8 sens
}

/* ---------- RÈGLES RÉUNIES ---------- */

function movesFor(index) { // déplacements possibles d'une case donnée
  const piece = state[index]; // pièce présente sur la case
  if (piece === null) return []; // case vide, rien à déplacer
  if (piece.type === 'i') return movesForPawn(index, piece); // règle du "i"
  if (piece.type === 'L') return movesForKnight(index, piece); // règle du "L"
  if (piece.type === 'T') return movesForRook(index, piece); // règle du "T"
  if (piece.type === 'W') return movesForQueen(index, piece); // règle du "W"
  if (piece.type === 'cuk') return movesForKing(index, piece); // règle du "cuk"
  return []; // autres pièces pas encore programmées
}

function allMoves(side) { // tous les coups jouables par un parti
  const list = []; // liste à remplir
  for (let i = 0; i < state.length; i++) { // parcourt les cases
    const piece = state[i]; // contenu de la case
    if (piece === null || piece.side !== side) continue; // pas une pièce de ce parti
    for (const to of movesFor(i)) list.push({ from: i, to }); // note chaque coup possible
  }
  return list; // renvoie tous les coups
}

/* ---------- DÉROULEMENT DES TOURS ---------- */

function move(from, to) { // déplace une pièce
  const side = state[from].side; // parti qui joue ce coup
  if (!isFree(to)) captured[side].push(state[to]); // pièce adverse présente, elle est prise
  state[to] = state[from]; // la pièce arrive sur la case visée
  state[from] = null; // sa case de départ devient vide
  hasPlayed[side] = true; // ce parti a fait son premier coup
  turn = side === TOP ? BOTTOM : TOP; // la main passe à l'autre parti
  clearSelection(); // remet à zéro et redessine
  if (turn === TOP) setTimeout(playTop, 400); // l'algorithme joue après une pause
}

function playTop() { // coup de l'algorithme du parti du haut
  if (turn !== TOP) return; // ce n'est pas son tour
  const list = allMoves(TOP); // coups disponibles
  if (list.length === 0) return; // aucun coup, il passe
  const pick = list[Math.floor(Math.random() * list.length)]; // choix au hasard
  move(pick.from, pick.to); // joue le coup choisi
}

/* ---------- INTERACTION DU JOUEUR ---------- */

function select(index) { // sélectionne une pièce
  selected = index; // mémorise la case cliquée
  legalMoves = movesFor(index); // calcule ses déplacements
  render(); // redessine pour montrer la sélection
}

function clearSelection() { // annule la sélection
  selected = null; // plus aucune case retenue
  legalMoves = []; // plus aucun déplacement affiché
  render(); // redessine sans les repères
}

function onPlaceClick(index) { // réagit au clic sur une case
  if (!started) return; // la partie n'a pas commencé
  if (turn !== BOTTOM) return; // pas le tour du joueur

  if (legalMoves.includes(index)) { // clic sur un déplacement proposé
    move(selected, index); // effectue le déplacement
    return; // stoppe ici
  }

  const piece = state[index]; // pièce éventuelle sur la case cliquée
  if (piece !== null && piece.side === BOTTOM) { // seul le parti du bas se joue à la main
    select(index); // sélectionne cette pièce
    return; // stoppe ici
  }

  clearSelection(); // clic ailleurs, on désélectionne
}

function onStart() { // lance la partie au clic du bouton
  if (started) return; // déjà lancée
  started = true; // la partie est en cours
  start.disabled = true; // le bouton ne sert plus
  if (turn === TOP) playTop(); // si le haut est blanc, il joue tout de suite
}

/* ---------- AFFICHAGE ---------- */

function render() { // dessine la grille des pièces
  places.replaceChildren(); // vide la grille avant de la refaire

  for (let i = 0; i < state.length; i++) { // parcourt les 36 cases
    const piece = state[i]; // contenu de la case
    const place = document.createElement('div'); // crée la case
    place.classList.add('place'); // style de base

    if (piece !== null) { // il y a une pièce
      place.textContent = piece.type; // affiche sa lettre
      place.classList.add(isWhiteSide(piece.side) ? 'white' : 'black'); // couleur de son parti
    }

    if (i === selected) place.classList.add('selected'); // marque la case sélectionnée
    if (legalMoves.includes(i)) { // case atteignable
      place.classList.add(piece === null ? 'move' : 'capture'); // simple déplacement ou prise
    }

    place.addEventListener('click', () => onPlaceClick(i)); // rend la case cliquable
    places.appendChild(place); // ajoute la case à la grille
  }
}

function isWhiteSide(side) { // dit si un parti est blanc
  return side === TOP ? topIsWhite : !topIsWhite; // le bas a toujours la couleur opposée
}

/* ---------- LANCEMENT ---------- */

start.addEventListener('click', onStart); // rend le bouton cliquable
render(); // premier affichage du jeu
