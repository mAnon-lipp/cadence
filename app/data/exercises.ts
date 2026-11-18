export type BackSafety = 'safe' | 'moderate';
export type ExerciseCategory = 'decompression' | 'mobilite' | 'renfo' | 'inspi';

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