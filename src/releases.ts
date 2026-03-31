export type ReleaseNote = {
  version: string;
  date?: string;
  highlights: string[];
};

export const RELEASES: ReleaseNote[] = [
  {
    version: '1.0.1',
    date: '2026-03-24',
    highlights: [
      'Landing page refresh + installer download.',
      'Improved stage-friendly UI and navigation.',
      'Bug fixes and performance improvements.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-19',
    highlights: [
      'Initial public release of Presenta Pro.',
      'Live controller, agenda, and display mode.',
      'Local-first storage (offline-ready).',
    ],
  },
];

