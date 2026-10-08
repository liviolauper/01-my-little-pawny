/* ==========================================================================
   TABLEAUX
   Toutes les listes fixes du jeu : disposition de départ, crans du curseur,
   directions de déplacement et tables de position de l'algorithme.
   Aucune logique ici, uniquement des données lues par main.js.
   ========================================================================== */

/* ---------- DISPOSITION DE DÉPART ---------- */

export const pieces = [ // une lettre par case, de haut en bas
  'T', 'L', 'W', 'cuk', 'L', 'T',
  'i', 'i', 'i', 'i', 'i', 'i',
  '',  '',  '',  '',  '',  '',
  '',  '',  '',  '',  '',  '',
  'i', 'i', 'i', 'i', 'i', 'i',
  'T', 'L', 'W', 'cuk', 'L', 'T',
];

/* ---------- ATTRIBUT DES "i" ---------- */

export const MOODS = ['peureux', 'soumis', 'vaillants']; // les trois crans du curseur, dans l'ordre

/* ---------- DIRECTIONS DE DÉPLACEMENT ---------- */

export const STRAIGHT = [ // les 4 directions droites, en [ligne, colonne]
  [-1, 0], [1, 0], [0, -1], [0, 1],
];

export const DIAGONAL = [ // les 4 diagonales, en [ligne, colonne]
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

export const KNIGHT_JUMPS = [ // les 8 sauts en L, en [ligne, colonne]
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

/* ---------- TABLES DE POSITION ---------- */

// Taillées pour 6x6, écrites du point de vue du parti du bas.
// La première ligne est le fond adverse, la dernière est son propre fond.
export const TABLES = {
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
