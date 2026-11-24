export type BackSafety = 'safe' | 'moderate';
export type ExerciseCategory = 'decompression' | 'mobilite' | 'souplesse' | 'renfo' | 'inspi';

export interface ExercisePattern {
  upBeats: number;
  holdBeats: number;
  downBeats: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  backSafety: BackSafety;
  cue: string;
  idealBpmRange: [number, number];
  pattern: ExercisePattern;
  cycles: number;
  sourceUrl?: string;
  steps?: string[];
}

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: 'cat-cow',
    name: 'Chat-Vache fluide',
    category: 'decompression',
    backSafety: 'safe',
    cue: 'Enroule la colonne vertèbre par vertèbre sans forcer sur la nuque.',
    idealBpmRange: [65, 85],
    pattern: { upBeats: 4, holdBeats: 1, downBeats: 4 },
    cycles: 6,
  },
  {
    id: 'child-pose',
    name: "Posture de l'enfant & respiration",
    category: 'decompression',
    backSafety: 'safe',
    cue: 'Laisse les fessiers peser vers les talons et respire dans le bas du dos.',
    idealBpmRange: [60, 80],
    pattern: { upBeats: 4, holdBeats: 2, downBeats: 6 },
    cycles: 5,
  },
  {
    id: 'knee-hugs',
    name: 'Genoux poitrine & bascule douce',
    category: 'decompression',
    backSafety: 'safe',
    cue: 'Garde les épaules relâchées au sol, berce doucement le bassin.',
    idealBpmRange: [65, 85],
    pattern: { upBeats: 4, holdBeats: 0, downBeats: 4 },
    cycles: 6,
  },
  {
    id: 'psoas-stretch',
    name: 'Étirement du psoas au sol',
    category: 'mobilite',
    backSafety: 'safe',
    cue: 'Rétroverse légèrement le bassin pour soulager les lombaires sans cambrer.',
    idealBpmRange: [70, 90],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 4 },
    cycles: 4,
  },
  {
    id: 'supine-twist',
    name: 'Torsion allongée douce',
    category: 'mobilite',
    backSafety: 'safe',
    cue: 'Garde les deux omoplates collées au tapis, laisse les genoux descendre.',
    idealBpmRange: [65, 85],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 4 },
    cycles: 4,
  },
  {
    id: 'open-book',
    name: 'Ouverture thoracique (Open Book)',
    category: 'mobilite',
    backSafety: 'safe',
    cue: 'Suis ta main du regard pour délier le milieu du dos et les épaules.',
    idealBpmRange: [75, 95],
    pattern: { upBeats: 4, holdBeats: 2, downBeats: 4 },
    cycles: 6,
  },
  {
    id: 'glute-bridge',
    name: 'Pont fessier contrôlé',
    category: 'renfo',
    backSafety: 'moderate',
    cue: 'Pousse dans les talons et garde les côtes basses en haut du mouvement.',
    idealBpmRange: [85, 110],
    pattern: { upBeats: 2, holdBeats: 2, downBeats: 4 },
    cycles: 8,
  },
  {
    id: 'bird-dog',
    name: 'Bird-Dog lent',
    category: 'renfo',
    backSafety: 'moderate',
    cue: 'Allonge bras et jambe opposés sans laisser le bassin basculer.',
    idealBpmRange: [80, 100],
    pattern: { upBeats: 2, holdBeats: 2, downBeats: 4 },
    cycles: 8,
  },
  {
    id: 'dead-bug',
    name: 'Dead-Bug contrôlé',
    category: 'renfo',
    backSafety: 'moderate',
    cue: 'Plaque fermement le bas du dos au tapis pendant toute la descente.',
    idealBpmRange: [80, 100],
    pattern: { upBeats: 2, holdBeats: 1, downBeats: 4 },
    cycles: 8,
  },
];
export const FLEXIBILITY_EXERCISES: Exercise[] = [
  {
    id: 'half-split-hamstring',
    name: 'Demi-grand écart (Ardha Hanumanasana)',
    category: 'souplesse',
    backSafety: 'safe',
    cue: 'Garde le dos plat et le nombril aspiré plutôt que de descendre le front vers le genou.',
    steps: [
      'À genoux, avance le pied droit devant toi jambe tendue, talon au sol et orteils relevés vers toi, mains posées sur des blocs ou de chaque côté de la jambe.',
      'Inspire en allongeant la colonne vers l’avant, puis expire en reculant légèrement la hanche droite pour sentir l’arrière de la cuisse s’étirer.',
      'Ne laisse jamais le bas du dos s’arrondir : plie légèrement le genou avant si ça tire derrière le genou ou dans les lombaires.',
    ],
    idealBpmRange: [60, 80],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 4 },
    cycles: 4,
  },
  {
    id: 'low-lunge-lizard',
    name: 'Fente basse profonde (Lézard doux)',
    category: 'souplesse',
    backSafety: 'safe',
    cue: 'Rétroverse légèrement le bassin pour ouvrir l’avant de la hanche sans pincer le bas du dos.',
    steps: [
      'Place le pied droit à l’extérieur de ta main droite, genou avant aligné au-dessus de la cheville et genou arrière posé loin derrière sur le tapis.',
      'Inspire pour redresser la poitrine, puis expire en laissant le bassin descendre lourdement vers le sol sur quatre temps.',
      'Contracte légèrement le fessier de la jambe arrière pour protéger tes lombaires et éviter de cambrer.',
    ],
    idealBpmRange: [65, 85],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 4 },
    cycles: 4,
  },
  {
    id: 'pigeon-prep',
    name: 'Posture du Pigeon préparatoire',
    category: 'souplesse',
    backSafety: 'safe',
    cue: 'Garde les deux hanches face au tapis, quitte à glisser un coussin sous la fesse avant.',
    steps: [
      'Depuis le quatre-pattes, glisse le genou droit derrière le poignet droit et allonge la jambe gauche bien droite derrière toi.',
      'Inspire en gardant le buste haut sur le bout des doigts, puis expire en relâchant la tension dans la fesse droite et le psoas gauche.',
      'Si ton bassin bascule sur le côté ou que le bas du dos pince, cale un coussin sous la fesse droite pour garder le bassin à niveau.',
    ],
    idealBpmRange: [60, 78],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 6 },
    cycles: 4,
  },
  {
    id: 'frog-stretch',
    name: 'Grenouille douce (Ouverture adducteurs)',
    category: 'souplesse',
    backSafety: 'safe',
    cue: 'Garde les côtes rentrées et le dos parfaitement plat pendant que les genoux s’écartent.',
    steps: [
      'Place-toi sur les avant-bras et écarte progressivement les genoux sur les côtés en gardant les chevilles alignées derrière les genoux.',
      'Inspire en allongeant la nuque, puis expire en reculant très doucement le bassin vers les talons sans forcer.',
      'Engage légèrement les abdominaux pour empêcher le ventre de tomber vers le sol et éviter toute cambrure lombaire.',
    ],
    idealBpmRange: [60, 75],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 6 },
    cycles: 4,
  },
  {
    id: 'pancake-seated-straddle',
    name: 'Écart facial assis (Dos droit)',
    category: 'souplesse',
    backSafety: 'moderate',
    cue: 'Avance le nombril vers le sol plutôt que la tête, les rotules pointées vers le plafond.',
    steps: [
      'Assieds-toi jambes écartées confortablement, mains posées derrière toi pour basculer le bassin vers l’avant (ischiions bien ancrés).',
      'Inspire en grandissant la colonne, puis expire en marchant les mains devant toi de quelques centimètres seulement.',
      'Arrête la descente dès que le bas du dos commence à s’arrondir : l’étirement doit rester uniquement à l’intérieur des cuisses.',
    ],
    idealBpmRange: [65, 85],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 4 },
    cycles: 5,
  },
  {
    id: 'supported-front-split',
    name: 'Glissade Grand Écart assistée',
    category: 'souplesse',
    backSafety: 'moderate',
    cue: 'Utilise deux supports sous tes mains pour contrôler le poids et garder le buste vertical.',
    steps: [
      'Depuis le demi-grand écart, place les mains sur deux blocs (ou livres épais) de chaque côté des hanches et laisse glisser le talon avant.',
      'Inspire en repoussant le sol avec les mains pour alléger le bassin, puis expire en relâchant d’un millimètre dans les hanches.',
      'Garde le buste droit au-dessus du bassin (ne te penche pas en arrière) pour qu’aucune pression n’aille dans les vertèbres lombaires.',
    ],
    idealBpmRange: [60, 75],
    pattern: { upBeats: 4, holdBeats: 4, downBeats: 6 },
    cycles: 4,
  },
];