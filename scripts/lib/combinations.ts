// The curated combinations (SPEC §8.5): named groups of council areas, each shown like a
// county, made for particular groups of users (John, November 5th 2026). The councils are
// named as scripts/lib/councils.ts gives them (OS Boundary-Line, tidied); a name that matches
// no gauge's council stops the build, so a typo can't quietly leave an area out.

export type CombinationDef = { name: string; councils: string[] }

export const COMBINATIONS: CombinationDef[] = [
  {
    name: 'Berks, N Hants, S Oxon',
    councils: [
      'Bracknell Forest', 'Reading', 'Slough', 'West Berkshire', 'Windsor and Maidenhead', 'Wokingham',
      'Basingstoke and Deane', 'South Oxfordshire',
    ],
  },
  {
    name: 'S Hants, Dorset, IoW',
    councils: [
      'Eastleigh', 'Fareham', 'Gosport', 'Havant', 'New Forest', 'Winchester', 'City of Portsmouth', 'City of Southampton',
      'Dorset', 'Bournemouth, Christchurch and Poole', 'Isle of Wight',
    ],
  },
]
