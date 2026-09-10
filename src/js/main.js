import { sfxr } from "jsfxr";

/* BIBLIOTHÈQUE DE SONS */
const PieceMove = {
  "oldParams": true,
  "wave_type": 1,
  "p_env_attack": 0,
  "p_env_sustain": 0.18097412358211817,
  "p_env_punch": 0.6144211579088138,
  "p_env_decay": 0.5072782827425126,
  "p_base_freq": 0.125,
  "p_freq_limit": 0,
  "p_freq_ramp": 0.178,
  "p_freq_dramp": -0.028,
  "p_vib_strength": 0,
  "p_vib_speed": 0,
  "p_arp_mod": 0,
  "p_arp_speed": 0.589990290139025,
  "p_duty": 0.6245459008607657,
  "p_duty_ramp": 0.5145240583011941,
  "p_repeat_speed": 0,
  "p_pha_offset": 0,
  "p_pha_ramp": 0,
  "p_lpf_freq": 1,
  "p_lpf_ramp": -0.473,
  "p_lpf_resonance": 0.8804858607723413,
  "p_hpf_freq": 0.846,
  "p_hpf_ramp": 0,
  "sound_vol": 0.25,
  "sample_rate": 44100,
  "sample_size": 8
};
const PieceDeath = {
  "oldParams": true,
  "wave_type": 2,
  "p_env_attack": 0.709,
  "p_env_sustain": 0.6641,
  "p_env_punch": 0,
  "p_env_decay": 0,
  "p_base_freq": 0.258,
  "p_freq_limit": 0,
  "p_freq_ramp": -0.172,
  "p_freq_dramp": 0,
  "p_vib_strength": 0,
  "p_vib_speed": 0,
  "p_arp_mod": 0,
  "p_arp_speed": 0,
  "p_duty": 0,
  "p_duty_ramp": 0,
  "p_repeat_speed": 0,
  "p_pha_offset": 0,
  "p_pha_ramp": 0,
  "p_lpf_freq": 0.548,
  "p_lpf_ramp": 0,
  "p_lpf_resonance": 0,
  "p_hpf_freq": 0,
  "p_hpf_ramp": 0,
  "sound_vol": 1,
  "sample_rate": 44100,
  "sample_size": 8
};

/* ==========================================================================
   PARTIE 1 — FONCTIONNEMENT
   Éléments du DOM, état de jeu, règles des pièces, algorithme de l'adversaire,
   déroulement des tours et réactions aux clics.
   ========================================================================== */

/* ---------- ÉLÉMENTS DU DOM ---------- */

const board = document.querySelector('#board'); // récupère la grille des couleurs
const places = document.querySelector('#places'); // récupère la grille des pièces
const start = document.querySelector('#start'); // récupère le bouton de départ
const popup = document.querySelector('#popup'); // récupère la fenêtre de choix
const hints = document.querySelector('#hints'); // récupère la grille des encadrés
const setup = document.querySelector('#setup'); // récupère la barre de réglages
const levelSelect = document.querySelector('#level'); // récupère le choix du niveau
const card = document.querySelector('#popup-card'); // récupère la carte de la fenêtre de choix
const moodSlider = document.querySelector('#mood'); // récupère le curseur d'attribut
const moodLabels = document.querySelectorAll('#mood-labels span'); // récupère les trois mots
const confirm = document.querySelector('#confirm'); // récupère le bouton de validation
const intro = document.querySelector('#intro'); // récupère le message d'accueil
const stage = document.querySelector('#stage'); // récupère le fond, le damier et les pièces
const pixelSize = document.querySelector('#pixel-size'); // récupère la taille des blocs du filtre
const pixelGrow = document.querySelector('#pixel-grow'); // récupère l'épaisseur des blocs
const duel = document.querySelector('#duel'); // récupère la page de confrontation
const duelDefender = document.querySelector('#duel-defender'); // emplacement de l'occupante
const duelIntruder = document.querySelector('#duel-intruder'); // emplacement de l'arrivante
const duelCase = document.querySelector('#duel-case'); // image de la case du duel

/* ---------- DAMIER ---------- */

const SIZE = 6; // côté du damier, 6 cases

for (let row = 0; row < SIZE; row++) { // parcourt chaque ligne
  for (let col = 0; col < SIZE; col++) { // parcourt chaque colonne
    const card = document.createElement('div'); // crée une case
    card.classList.add('card', (row + col) % 2 === 0 ? 'light' : 'dark'); // blanc ou noir en alternance
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
const MOODS = ['peureux', 'soumis', 'vaillants']; // les trois crans du curseur, dans l'ordre
let pawnMood = 'soumis'; // attribut choisi pour les "i" du bas, cran du milieu par défaut
let level = 2; // niveau de l'adversaire, intermédiaire par défaut
let levelChosen = false; // tant que faux, toutes les pièces sortent de 01-start
let clash = null; // deux pièces opposées sur une même case, null le reste du temps

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

/* ---------- ATTRIBUT DES "i" DU BAS ---------- */

// Les deux attributs suivent la même mécanique : le "i" dévie du coup demandé,
// le peureux en avançant moins, le vaillant en avançant plus.
const MOOD_SMALL = 0.35; // part des cas où il dévie d'un cran
const MOOD_BIG = 0.15; // part des cas où il dévie de deux crans

// Le comportement d'un "i" contamine le suivant : plus le précédent a dévié,
// plus le prochain risque de dévier à son tour.
const AFTER_OBEY = 0.25; // le précédent a fait exactement ce qu'on lui demandait
const AFTER_SMALL = 0.5; // le précédent a dévié d'un cran
const AFTER_BIG = 0.75; // le précédent a dévié de deux crans
const AFTER_DEVIATE = 0.75; // le précédent a dévié, le suivant dévie à 75 %

let moodRisk = null; // risque que le prochain "i" dévie, null tant que rien n'est lancé

function advance(from, cases, bold) { // avance d'autant de cases que possible
  const step = forward(BOTTOM); // sens d'avance du parti du bas
  const col = toCol(from); // colonne du "i", elle ne change pas
  let row = toRow(from); // ligne atteinte pour l'instant

  for (let n = 0; n < cases; n++) { // avance case par case
    const next = row + step; // ligne suivante
    if (next < 0 || next >= SIZE) break; // bord du damier atteint

    const target = next * SIZE + col; // case suivante
    if (!isFree(target)) { // une pièce occupe la case
      // Le vaillant qui déborde s'y pose quand même, sans prendre personne.
      // Peu importe le parti de l'occupante, les deux partagent la case.
      if (bold) row = next; // il déborde sur elle
      break; // dans tous les cas il s'arrête ici
    }

    row = next; // la case est franchie
  }

  if (row === toRow(from)) return null; // il n'a pas pu bouger d'un pouce
  return row * SIZE + col; // case finalement atteinte
}

function shift(from, to, distance, crans) { // dévie le coup demandé d'un nombre de crans
  const wanted = distance + crans; // longueur finalement tentée
  if (wanted <= 0) return null; // il n'avance pas du tout et perd son tour
  return advance(from, wanted, crans > 0) ?? to; // seul le dépassement peut déborder
}

function moodFirst(from, to, distance) { // le premier "i" joué donne le ton
  const roll = Math.random(); // tire son comportement
  const way = pawnMood === 'peureux' ? -1 : 1; // le peureux dévie en moins, le vaillant en plus

  if (roll < MOOD_BIG) { // il dévie de deux crans
    moodRisk = AFTER_BIG; // le suivant déviera beaucoup
    return shift(from, to, distance, 2 * way); // deux cases de moins ou de plus
  }

  if (roll < MOOD_BIG + MOOD_SMALL) { // il dévie d'un cran
    moodRisk = AFTER_SMALL; // le suivant déviera à moitié
    return shift(from, to, distance, way); // une case de moins ou de plus
  }

  moodRisk = AFTER_OBEY; // il a obéi, le suivant déviera peu
  return to; // coup accompli tel que demandé
}

function moodNext(from, to, distance) { // les "i" suivants subissent la contagion
  const way = pawnMood === 'peureux' ? -1 : 1; // sens de la déviation

  if (Math.random() < moodRisk) { // le comportement du précédent le gagne
    moodRisk = AFTER_DEVIATE; // sa déviation contamine le suivant
    return shift(from, to, distance, way); // une case de moins ou de plus
  }

  moodRisk = AFTER_OBEY; // il a obéi, le suivant déviera peu
  return to; // coup accompli tel que demandé
}

function moodTarget(from, to) { // ajuste le coup selon l'attribut choisi
  const piece = state[from]; // pièce déplacée
  if (pawnMood === 'soumis') return to; // le soumis obéit toujours, aucun aléa
  if (piece.side !== BOTTOM) return to; // l'attribut ne concerne que le parti du bas
  if (piece.type !== 'i') return to; // ni les autres familles de pièces
  if (toCol(to) !== toCol(from)) return to; // une prise en diagonale n'est pas concernée

  const distance = Math.abs(toRow(to) - toRow(from)); // longueur du coup demandé
  if (moodRisk === null) return moodFirst(from, to, distance); // aucun "i" n'a encore joué
  return moodNext(from, to, distance); // les suivants héritent du ton donné
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

function pawnsOf(side) { // cases des "i" d'un parti
  const list = []; // liste à remplir
  for (let i = 0; i < state.length; i++) { // parcourt les cases
    const piece = state[i]; // contenu de la case
    if (piece !== null && piece.side === side && piece.type === 'i') list.push(i); // un "i" du parti
  }
  return list; // renvoie les cases trouvées
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

/* ---------- ÉVALUATION D'UNE POSITION ---------- */

const VALUES = { // valeur brute de chaque pièce, en centièmes de "i"
  i: 100, // le pion
  L: 320, // le cavalier
  T: 500, // la tour
  W: 900, // la reine
  cuk: 20000, // le roi, perdre le sien coûte la partie
};

// Tables de position taillées pour 6x6, écrites du point de vue du parti du bas.
// La première ligne est le fond adverse, la dernière est son propre fond.
const TABLES = {
  i: [ // le "i" gagne à avancer et à tenir le centre
    90, 90, 90, 90, 90, 90,
    40, 45, 50, 50, 45, 40,
    15, 20, 30, 30, 20, 15,
     5, 10, 20, 20, 10,  5,
     0,  0,  5,  5,  0,  0,
     0,  0,  0,  0,  0,  0,
  ],
  L: [ // le "L" perd sa force sur les bords
    -40, -20, -10, -10, -20, -40,
    -20,   0,  10,  10,   0, -20,
    -10,  10,  20,  20,  10, -10,
    -10,  10,  20,  20,  10, -10,
    -20,   0,  10,  10,   0, -20,
    -40, -20, -10, -10, -20, -40,
  ],
  T: [ // le "T" aime les lignes avancées
     5, 10, 10, 10, 10,  5,
     5, 10, 10, 10, 10,  5,
     0,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,
    -5,  0,  0,  5,  5, -5,
     0,  0,  0,  5,  5,  0,
  ],
  W: [ // le "W" préfère le centre sans trop s'exposer
    -20, -10, -5, -5, -10, -20,
    -10,   0,  5,  5,   0, -10,
     -5,   5, 10, 10,   5,  -5,
     -5,   5, 10, 10,   5,  -5,
    -10,   0,  5,  5,   0, -10,
    -20, -10, -5, -5, -10, -20,
  ],
  cuk: [ // le "cuk" reste à l'abri au fond
    -30, -40, -40, -40, -40, -30,
    -30, -40, -40, -40, -40, -30,
    -20, -30, -30, -30, -30, -20,
    -10, -20, -20, -20, -20, -10,
     10,  10,   0,   0,  10,  10,
     20,  30,  10,  10,  30,  20,
  ],
};

function other(side) { // parti adverse
  return side === TOP ? BOTTOM : TOP; // l'un ou l'autre
}

function tableValue(index, piece) { // bonus de position d'une pièce
  const table = TABLES[piece.type]; // table de sa famille
  if (piece.side === BOTTOM) return table[index]; // les tables sont écrites pour le bas
  return table[(SIZE - 1 - toRow(index)) * SIZE + toCol(index)]; // pour le haut, on retourne le damier
}

function evaluate(side) { // note la position du point de vue d'un parti
  let score = 0; // total à remplir

  for (let i = 0; i < state.length; i++) { // parcourt les cases
    const piece = state[i]; // contenu de la case
    if (piece === null) continue; // case vide

    const value = VALUES[piece.type] + tableValue(i, piece); // valeur brute plus position
    score += piece.side === side ? value : -value; // les siennes comptent, celles d'en face retirent
  }

  return score; // renvoie la note
}

/* ---------- RECHERCHE DU MEILLEUR COUP ---------- */

const LEVELS = { // les trois niveaux proposés
  1: { depth: 1, blunder: 0.45, blind: 0.55 }, // débutant, ~400 élo
  2: { depth: 3, blunder: 0.10, blind: 0.10 }, // intermédiaire, ~1500 élo
  3: { depth: 5, blunder: 0, blind: 0 }, // professionnel, ~2500 élo
};

const MATE = 100000; // note d'une partie gagnée

function applyMove(from, to) { // joue un coup sans toucher à l'affichage
  const taken = state[to]; // pièce éventuellement prise
  state[to] = state[from]; // la pièce avance
  state[from] = null; // sa case de départ se vide
  return taken; // garde la pièce prise pour pouvoir revenir en arrière
}

function undoMove(from, to, taken) { // annule un coup joué par applyMove
  state[from] = state[to]; // la pièce revient à son départ
  state[to] = taken; // la pièce prise reprend sa place
}

function orderedMoves(side) { // coups triés, les prises d'abord
  const list = allMoves(side); // tous les coups du parti

  for (const m of list) { // note chaque coup
    const victim = state[m.to]; // pièce visée, s'il y en a une
    m.gain = victim === null ? 0 : VALUES[victim.type] - VALUES[state[m.from].type]; // intérêt de la prise
  }

  list.sort((a, b) => b.gain - a.gain); // les prises intéressantes en tête
  return list; // renvoie la liste triée
}

function negamax(side, depth, alpha, beta) { // explore l'arbre des coups
  if (depth === 0) return evaluate(side); // profondeur atteinte, on note la position

  const list = orderedMoves(side); // coups possibles
  if (list.length === 0) return evaluate(side); // bloqué, on note la position

  let best = -Infinity; // meilleure note trouvée

  for (const m of list) { // essaie chaque coup
    const taken = applyMove(m.from, m.to); // joue le coup

    if (taken !== null && taken.type === 'cuk') { // le roi adverse tombe
      undoMove(m.from, m.to, taken); // remet la position en place
      return MATE + depth; // partie gagnée, inutile de chercher plus loin
    }

    const score = -negamax(other(side), depth - 1, -beta, -alpha); // l'adversaire répond
    undoMove(m.from, m.to, taken); // remet la position en place

    if (score > best) best = score; // nouveau meilleur coup
    if (best > alpha) alpha = best; // relève le plancher
    if (alpha >= beta) break; // l'adversaire éviterait cette branche, on l'élague
  }

  return best; // renvoie la meilleure note
}

function weakenMoves(list, blind) { // fait oublier des prises au débutant
  if (blind === 0) return list; // le professionnel ne rate rien

  const kept = list.filter((m) => { // trie les coups un à un
    if (isFree(m.to)) return true; // un simple déplacement est toujours gardé
    return Math.random() > blind; // une prise passe parfois inaperçue
  });

  return kept.length === 0 ? list : kept; // s'il ne reste rien, on garde tout
}

function bestMove(side) { // choisit le coup du parti dirigé par l'algorithme
  const rules = LEVELS[level]; // réglages du niveau choisi
  let list = orderedMoves(side); // coups possibles, prises en tête
  if (list.length === 0) return null; // aucun coup jouable

  list = weakenMoves(list, rules.blind); // le débutant laisse passer des prises

  if (Math.random() < rules.blunder) { // le joueur faible commet une faute
    return list[Math.floor(Math.random() * list.length)]; // coup pris au hasard
  }

  let best = null; // meilleur coup trouvé
  let bestScore = -Infinity; // sa note

  for (const m of list) { // essaie chaque coup
    const taken = applyMove(m.from, m.to); // joue le coup

    if (taken !== null && taken.type === 'cuk') { // il prend le roi adverse
      undoMove(m.from, m.to, taken); // remet la position en place
      return m; // rien de mieux à jouer
    }

    const score = -negamax(other(side), rules.depth - 1, -Infinity, Infinity); // note du coup
    undoMove(m.from, m.to, taken); // remet la position en place

    if (score > bestScore || (score === bestScore && Math.random() < 0.3)) { // meilleur, ou égal au hasard
      bestScore = score; // retient la note
      best = m; // retient le coup
    }
  }

  return best; // renvoie le coup choisi
}

/* ---------- DÉROULEMENT DES TOURS ---------- */

function move(from, to) { // déplace une pièce
  const side = state[from].side; // parti qui joue ce coup
  const taken = !isFree(to); // une pièce adverse occupe la case visée
  if (taken) captured[side].push(state[to]); // elle est prise
  state[to] = state[from]; // la pièce arrive sur la case visée
  state[from] = null; // sa case de départ devient vide
  hasPlayed[side] = true; // ce parti a fait son premier coup
  turn = side === TOP ? BOTTOM : TOP; // la main passe à l'autre parti
  sfxr.play(PieceMove); // son unique pour tout déplacement
  if (taken) sfxr.play(PieceDeath); // son si pièce prise
  clearSelection(); // remet à zéro et redessine
  if (turn === TOP) setTimeout(playTop, 400); // l'algorithme joue après une pause
}

/* ---------- DÉBORDEMENT SUR UNE CASE OCCUPÉE ---------- */

// Une pièce qui déborde ne prend pas celle qui l'attend : les deux partagent
// la case, l'occupante en haut à gauche, l'arrivante en bas à droite.
const CLASH_DELAY = 900; // attente avant l'ouverture de la page, en millisecondes

function startClash(from, to) { // pose deux pièces opposées sur la même case
  const intruder = state[from]; // pièce qui déborde
  const defender = state[to]; // pièce déjà sur place

  state[from] = null; // sa case de départ devient vide
  clash = { index: to, intruder, defender }; // retient la confrontation
  hasPlayed[intruder.side] = true; // ce parti a fait son premier coup

  sfxr.play(PieceMove); // son de déplacement, aucune prise
  clearSelection(); // remet à zéro et redessine
  setTimeout(openDuel, CLASH_DELAY); // laisse voir les deux pièces sur la case
}

function skipTurn() { // le parti du bas perd son tour sans bouger
  turn = TOP; // la main passe au parti du haut
  clearSelection(); // remet à zéro et redessine
  setTimeout(playTop, 400); // l'algorithme joue après une pause
}

function playTop() { // coup de l'algorithme du parti du haut
  if (turn !== TOP) return; // ce n'est pas son tour
  const pick = bestMove(TOP); // coup choisi par l'algorithme
  if (pick === null) return; // aucun coup, il passe
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
    const target = moodTarget(selected, index); // l'attribut peut changer le coup
    if (target === null) skipTurn(); // le "i" a eu peur, le tour est perdu
    else if (target !== index && !isFree(target)) startClash(selected, target); // il a débordé
    else move(selected, target); // sinon le coup est joué
    return; // stoppe ici
  }

  const piece = state[index]; // pièce éventuelle sur la case cliquée
  if (piece !== null && piece.side === BOTTOM) { // seul le parti du bas se joue à la main
    select(index); // sélectionne cette pièce
    return; // stoppe ici
  }

  clearSelection(); // clic ailleurs, on désélectionne
}

/* ---------- FLOU ET PIXELISATION DE L'ARRIVÉE ---------- */

const PIXEL_MAX = 44; // côté des plus gros blocs, en pixels
const BLUR_MAX = 4; // flou le plus épais, en vh
const CLEAR_TIME = 1000; // durée du retour à la netteté, en millisecondes

function setStage(amount) { // règle flou et pixelisation, de 1 à 0
  const size = Math.max(1, Math.round(PIXEL_MAX * amount)); // côté des blocs
  pixelSize.setAttribute('width', size); // largeur d'un bloc
  pixelSize.setAttribute('height', size); // hauteur d'un bloc
  pixelGrow.setAttribute('radius', size / 2); // les blocs se rejoignent

  // Le flou passe en premier : les couleurs se mélangent, puis chaque bloc
  // reprend cette moyenne. Ordre inverse, les blocs seraient flous à leur tour.
  const filter = amount === 0 ? 'none' : `blur(${BLUR_MAX * amount}vh) url(#pixelate)`; // filtre du moment
  stage.style.filter = filter; // applique le filtre au fond, au damier et aux pièces
}

function clearStage(startedAt) { // rend la netteté image par image
  const spent = performance.now() - startedAt; // temps écoulé depuis le début
  const amount = Math.max(0, 1 - spent / CLEAR_TIME); // part de flou restante

  setStage(amount); // applique l'état du moment
  if (amount > 0) requestAnimationFrame(() => clearStage(startedAt)); // continue tant qu'il reste du flou
}

function endIntro() { // efface le message d'accueil
  intro.classList.add('done'); // les deux mots s'estompent
  setTimeout(endBlur, 500); // attend la fin de cet effacement
}

function endBlur() { // rend la netteté au damier
  clearStage(performance.now()); // lance la dépixelisation progressive
  setTimeout(openSetup, CLEAR_TIME + 300); // laisse le damier redevenir net
}

function openSetup() { // affiche la pop-up de choix du niveau
  setup.classList.remove('hidden'); // le choix de l'adversaire apparaît
}

function onLevel() { // réagit au changement de difficulté
  if (started) return; // partie déjà lancée, le niveau est figé
  level = Number(levelSelect.value); // retient le niveau de l'adversaire
  levelChosen = true; // les pièces quittent 01-start
  render(); // redessine les "i" selon ce niveau
}

function onStart() { // montre les pièces concernées au clic du bouton
  if (started) return; // partie déjà lancée
  onLevel(); // fige le niveau affiché dans le menu
  setup.classList.add('hidden'); // les réglages laissent la place à la suite
  showHints(pawnsOf(BOTTOM)); // encadre en vert les "i" du joueur
  setTimeout(openPopup, 1200); // laisse le temps de les repérer
}

function openPopup() { // affiche la fenêtre de choix
  onMood(); // met la carte au cran affiché par le curseur
  popup.classList.remove('hidden'); // affiche le choix de l'attribut
}

function onMood() { // réagit au déplacement du curseur
  if (started) return; // partie déjà lancée, l'attribut est figé
  pawnMood = MOODS[Number(moodSlider.value)]; // retient l'attribut visé
  showCard(pawnMood); // montre le "i" correspondant en grand
  markMoodLabel(); // met en avant le mot choisi
}

function onConfirm() { // lance la partie une fois l'attribut validé
  if (started) return; // partie déjà lancée
  onMood(); // fige l'attribut affiché par le curseur
  started = true; // la partie est en cours
  popup.classList.add('hidden'); // referme la fenêtre de choix
  clearHints(); // retire les encadrés verts
  render(); // redessine avec les images de l'attribut choisi
  if (turn === TOP) setTimeout(playTop, 1000); // le haut est blanc, il joue après une seconde
}

/* ==========================================================================
   PARTIE 2 — HABILLAGE
   Images des pièces, vignettage des cases, encadrés verts, carte de la fenêtre
   de choix et dessin de la grille.
   ========================================================================== */

/* ---------- IMAGES DES PIÈCES ---------- */

// Chemins : src/img/<dossier>/<taille>/<couleur>[/<attribut>]/<pièce>.png
// 00-pieces range ses images par attribut, 01-start n'en a qu'une par couleur.
// La taille "small" sert au damier, la taille "big" aux affichages en grand.
const IMAGES = {
  i: { // le pion
    small: { // version damier
      'c-white': {
        weak: new URL('../img/00-pieces/1-small/c-white/weak/i.png', import.meta.url).href,
        neutral: new URL('../img/01-start/1-small/c-white/i.png', import.meta.url).href,
        strong: new URL('../img/00-pieces/1-small/c-white/strong/i.png', import.meta.url).href,
      },
      'c-black': {
        weak: new URL('../img/00-pieces/1-small/c-black/weak/i.png', import.meta.url).href,
        neutral: new URL('../img/01-start/1-small/c-black/i.png', import.meta.url).href,
        strong: new URL('../img/00-pieces/1-small/c-black/strong/i.png', import.meta.url).href,
      },
    },
    big: { // version en grand
      'c-white': {
        weak: new URL('../img/00-pieces/0-big/c-white/weak/i.png', import.meta.url).href,
        neutral: new URL('../img/01-start/0-big/c-white/i.png', import.meta.url).href,
        strong: new URL('../img/00-pieces/0-big/c-white/strong/i.png', import.meta.url).href,
      },
      'c-black': {
        weak: new URL('../img/00-pieces/0-big/c-black/weak/i.png', import.meta.url).href,
        neutral: new URL('../img/01-start/0-big/c-black/i.png', import.meta.url).href,
        strong: new URL('../img/00-pieces/0-big/c-black/strong/i.png', import.meta.url).href,
      },
    },
  },
};

// Chaque attribut pointe vers un jeu d'images.
const MOOD_FOLDERS = {
  peureux: 'weak', // dossier 00-pieces, version faible
  soumis: 'neutral', // dossier 01-start
  vaillants: 'strong', // dossier 00-pieces, version forte
};

/* ---------- VIGNETTAGE DES CASES ---------- */

// Le vignettage est dessiné dans une image de 16x16 pixels, comme les pièces.
// Étirée à la taille d'une case, elle montre les mêmes gros pixels.
const VIGNETTE_SIZE = 16; // côté de l'image, en pixels
const VIGNETTE_REACH = 0.7; // portée du dégradé, en part du côté

function makeVignette(red, green, blue, alpha) { // fabrique une image de vignettage
  const canvas = document.createElement('canvas'); // support de dessin
  canvas.height = VIGNETTE_SIZE; // 16 pixels de haut
  canvas.width = VIGNETTE_SIZE; // 16 pixels de large

  const middle = VIGNETTE_SIZE / 2; // centre de l'image
  const context = canvas.getContext('2d'); // outil de dessin
  const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, VIGNETTE_SIZE * VIGNETTE_REACH); // dégradé du centre vers les bords
  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha})`); // couleur pleine au centre
  gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`); // transparence aux bords

  context.fillStyle = gradient; // applique le dégradé
  context.fillRect(0, 0, VIGNETTE_SIZE, VIGNETTE_SIZE); // remplit l'image
  return `url(${canvas.toDataURL()})`; // renvoie l'image prête pour le CSS
}

function setVignettes() { // met les deux vignettages à disposition du CSS
  const root = document.documentElement.style; // variables du document
  root.setProperty('--vignette-dark', makeVignette(0, 0, 0, 0.5)); // centre sombre
  root.setProperty('--vignette-light', makeVignette(255, 255, 255, 0.25)); // centre clair
}

/* ---------- CHOIX DE L'IMAGE D'UNE PIÈCE ---------- */

const WEAK_COLUMNS = [1, 3]; // deuxième et quatrième colonne, où le niveau 2 reste faible

function isWhiteSide(side) { // dit si un parti est blanc
  return side === TOP ? topIsWhite : !topIsWhite; // le bas a toujours la couleur opposée
}

function moodFolder(index, piece) { // dossier d'attribut d'une pièce
  if (!levelChosen) return 'neutral'; // aucun niveau choisi, tout le monde sort de 01-start
  if (piece.side === BOTTOM) return MOOD_FOLDERS[pawnMood]; // le bas suit le curseur du joueur

  if (level === 1) return 'weak'; // débutant, tout le parti est faible
  if (level === 3) return 'strong'; // professionnel, tout le parti est fort
  return WEAK_COLUMNS.includes(toCol(index)) ? 'weak' : 'strong'; // intermédiaire, deux colonnes faibles
}

function pieceSrc(type, size, white, mood) { // chemin d'une image de pièce
  const set = IMAGES[type]; // images de sa famille, s'il en existe
  if (set === undefined) return null; // aucune image prévue
  return set[size][white ? 'c-white' : 'c-black'][mood]; // taille, couleur, attribut
}

function drawPiece(place, index, piece, corner) { // pose une pièce dans une case
  const white = isWhiteSide(piece.side); // couleur de son parti
  if (corner === undefined) place.classList.add(white ? 'white' : 'black'); // couleur du texte

  const src = pieceSrc(piece.type, 'small', white, moodFolder(index, piece)); // version damier
  if (src === null) { // aucune image prévue
    const letter = document.createElement('span'); // crée la lettre
    letter.classList.add('letter'); // la place au-dessus du vignettage
    if (corner !== undefined) letter.classList.add(corner, white ? 'white' : 'black'); // coin visé
    letter.textContent = piece.type; // affiche le nom de la pièce
    place.appendChild(letter); // pose la lettre dans la case
    return; // rien de plus à faire
  }

  const img = document.createElement('img'); // crée l'image
  img.src = src; // image de la bonne taille, couleur et attribut
  if (corner !== undefined) img.classList.add(corner); // coin visé lors d'un débordement
  img.alt = piece.type; // texte de remplacement
  place.appendChild(img); // pose l'image dans la case
}

/* ---------- PAGE DE CONFRONTATION ---------- */

function fillDuelSlot(slot, index, piece) { // met une pièce en grand dans un emplacement
  const white = isWhiteSide(piece.side); // couleur de son parti
  const src = pieceSrc(piece.type, 'big', white, moodFolder(index, piece)); // version en grand

  if (src === null) { // aucune image prévue pour cette famille
    slot.textContent = piece.type; // on retombe sur la lettre
    slot.classList.toggle('white', white); // couleur du texte
    slot.classList.toggle('black', !white); // couleur du texte
    return; // rien de plus à faire
  }

  const img = document.createElement('img'); // crée l'image en grand
  img.src = src; // image de la bonne couleur et du bon attribut
  img.alt = piece.type; // texte de remplacement
  slot.replaceChildren(img); // remplace le contenu de l'emplacement
}

// Image de la case sur laquelle se joue le duel, selon sa couleur de fond.
const DUEL_CASES = {
  white: new URL('../img/02-duel/a-case/white.png', import.meta.url).href, // case blanche
  black: new URL('../img/02-duel/a-case/black.png', import.meta.url).href, // case noire
};

function openDuel() { // ouvre la page qui présente les deux pièces
  if (clash === null) return; // aucune confrontation en cours

  const pale = (toRow(clash.index) + toCol(clash.index)) % 2 === 0; // même alternance que le damier
  duelCase.src = pale ? DUEL_CASES.black : DUEL_CASES.white; // la case garde sa couleur

  fillDuelSlot(duelDefender, clash.index, clash.defender); // pièce déjà sur la case
  fillDuelSlot(duelIntruder, clash.index, clash.intruder); // pièce qui a débordé
  duel.classList.remove('hidden'); // la page apparaît
}

function showCard(mood) { // remplit la carte de la fenêtre de choix
  const img = document.createElement('img'); // crée l'image en grand
  img.src = pieceSrc('i', 'big', isWhiteSide(BOTTOM), MOOD_FOLDERS[mood]); // "i" du joueur en grand
  img.alt = 'i'; // texte de remplacement
  card.replaceChildren(img); // remplace le contenu de la carte
}

function markMoodLabel() { // met en avant le mot visé par le curseur
  const picked = Number(moodSlider.value); // cran actuel du curseur
  moodLabels.forEach((label, i) => label.classList.toggle('picked', i === picked)); // un seul mot en avant
}

/* ---------- DESSIN DE LA GRILLE ---------- */

function render() { // dessine la grille des pièces
  places.replaceChildren(hints); // vide la grille mais garde les encadrés

  for (let i = 0; i < state.length; i++) { // parcourt les 36 cases
    const piece = state[i]; // contenu de la case
    const place = document.createElement('div'); // crée la case
    const pale = (toRow(i) + toCol(i)) % 2 === 0; // même alternance que le damier
    place.classList.add('place', pale ? 'light' : 'dark'); // retient la couleur du fond

    if (clash !== null && clash.index === i) { // deux pièces se partagent cette case
      place.classList.add('clash'); // règle leur placement en coin
      drawPiece(place, i, clash.defender, 'corner-in'); // l'occupante en haut à gauche
      drawPiece(place, i, clash.intruder, 'corner-out'); // l'arrivante en bas à droite
    } else if (piece !== null) drawPiece(place, i, piece); // pose la pièce, image ou lettre

    if (i === selected) place.classList.add('selected'); // marque la case sélectionnée
    if (legalMoves.includes(i)) { // case atteignable
      place.classList.add(piece === null ? 'move' : 'capture'); // simple déplacement ou prise
    }

    place.addEventListener('click', () => onPlaceClick(i)); // rend la case cliquable
    places.appendChild(place); // ajoute la case à la grille
  }
}

/* ---------- ENCADRÉS VERTS ---------- */

function showHints(marked) { // encadre en vert une liste de cases
  hints.replaceChildren(); // vide la grille des encadrés

  for (let i = 0; i < state.length; i++) { // parcourt les 36 cases
    const hint = document.createElement('div'); // crée la case d'encadré
    hint.classList.add('hint'); // style de base
    if (marked.includes(i)) hint.classList.add('marked'); // bordure verte sur les cases visées
    hints.appendChild(hint); // ajoute la case à la grille
  }
}

function clearHints() { // efface tous les encadrés
  hints.replaceChildren(); // vide la grille des encadrés
}

/* ---------- LANCEMENT ---------- */

start.addEventListener('click', onStart); // rend le bouton cliquable
levelSelect.addEventListener('change', onLevel); // change les "i" du haut aussitôt
setVignettes(); // prépare les images de vignettage
setStage(1); // flou et pixelisation au maximum à l'arrivée
setTimeout(endIntro, 2000); // laisse jouer le flou et les deux mots

moodSlider.addEventListener('input', onMood); // le curseur change l'image en direct
confirm.addEventListener('click', onConfirm); // le bouton valide et lance la partie

render(); // premier affichage du jeu
