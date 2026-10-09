// Linien-Icons (24×24, erben currentColor). Neue Icons einfach im Objekt ergänzen.

const PATHS = {
  atom: <><circle cx="12" cy="12" r="1.6" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  quiz: <><path d="M9.2 9a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.2-1.5 2.2v.3" /><circle cx="12" cy="17.5" r=".7" fill="currentColor" /><circle cx="12" cy="12" r="9.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  moon: <path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" />,
  minus: <path d="M5 12h14" />,
  up: <path d="m5 15 7-7 7 7" />,
  down: <path d="m5 9 7 7 7-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  reset: <><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" /><path d="M3.5 4v4.5H8" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sound: <><path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" /><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" /></>,
  text: <><path d="M6 15.5 10.5 4.5 15 15.5M7.6 12h5.8" /><path d="M3 20.5h18M5.5 18.5l-2 2 2 2M18.5 18.5l2 2-2 2" /></>,
  mute: <><path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" /><path d="m16.5 9.5 5 5M21.5 9.5l-5 5" /></>,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  home: <><path d="M3.5 11.2 12 3.8l8.5 7.4" /><path d="M5.8 9.4v11.1h4.4v-6h3.6v6h4.4V9.4" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /></>,
  fire: <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  leaf: <><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19 13 11" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>,
  screen: <><rect x="2.5" y="4" width="19" height="12.5" rx="2" /><path d="M8 20.5h8M12 16.5v4" /></>,
  cube: <><path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z" /><path d="M3.5 7.5 12 12.2l8.5-4.7M12 12.2v9" /></>,
  ruler: <><rect x="2.5" y="8" width="19" height="8" rx="1.5" /><path d="M6 8v3M9 8v2M12 8v3M15 8v2M18 8v3" /></>,
  board: <><rect x="3" y="3.5" width="18" height="13" rx="1.5" /><path d="M7 20.5 9 16.5M17 20.5l-2-4M7 8h5M7 11.5h8" /></>,
  table: <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M3 9.5h18M9 4.5v15M15 4.5v15" /></>,
  swap: <><path d="M7 4 3.5 7.5 7 11M3.5 7.5H17" /><path d="M17 13l3.5 3.5L17 20M20.5 16.5H7" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" /></>,
  info: <><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".8" fill="currentColor" /></>,
  layers: <path d="M4 19h5M10 14.5h5M16 10h4M4 19V5M4 5h16" />,
  pm: <path d="M8 3.5v8M4 7.5h8M13 17.5h7M5 20.5 19 3.5" />,
  cation: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  anion: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
  molecule: <><circle cx="6" cy="17" r="2.6" /><circle cx="18" cy="17" r="2.6" /><circle cx="12" cy="6.5" r="2.6" /><path d="M7.4 14.8 10.6 8.8M16.6 14.8 13.4 8.8" /></>,
  bond: <><path d="M4 12h3M17 12h3" /><circle cx="12" cy="12" r="4" /><path d="M2.5 8.5v7M21.5 8.5v7" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  beaker: <><path d="M6 3.5h12M8 3.5v6.5L3.8 18.5A1.6 1.6 0 0 0 5.2 21h13.6a1.6 1.6 0 0 0 1.4-2.5L16 10V3.5" /><path d="M6.2 14.5h11.6" /></>,
  funnel: <><path d="M3.5 4h17l-6.5 8v6.5l-4 2.5V12z" /></>,
  shake: <><path d="M8 4h8l-1 16H9z" /><path d="M3.5 8.5 2 12l1.5 3.5M20.5 8.5 22 12l-1.5 3.5" /></>,
  magnet: <><path d="M6 3.5v8.5a6 6 0 0 0 12 0V3.5h-4V12a2 2 0 0 1-4 0V3.5z" /><path d="M6 7.5h4M14 7.5h4" /></>,
  sample: <><path d="M5 4h14v16H5z" /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
