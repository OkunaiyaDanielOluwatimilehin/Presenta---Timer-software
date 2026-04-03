export type ReleaseNote = {
  version: string;
  date?: string;
  highlights: string[];
};

export const RELEASES: ReleaseNote[] = [
  {
    version: '1.1.2',
    date: '2026-04-03',
    highlights: [
      'Updated the website installer download to the 1.1.2 Windows MSI.',
      'Aligned landing page version labels with the current desktop release.',
      'Minor UI polish and cleanup.',
    ],
  },
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
