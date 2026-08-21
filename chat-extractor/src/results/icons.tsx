// Minimal line-icon set for the results page. Hand-drawn rather than pulled
// from a library (e.g. lucide-react) since this project's package.json isn't
// available here to add a new dependency to — these are plain SVG, 24x24,
// 1.75px stroke, no external assets.
import React from 'react';

type IconProps = { className?: string };
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconLogo = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="6" width="18" height="13" rx="4" />
    <path d="M8 19v2M16 19v2" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9 4l1.5 2M15 4l-1.5 2" />
  </svg>
);

export const IconMessage = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M4 5h16v11H8l-4 4V5z" /></svg>
);

export const IconUsers = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="8" r="2.5" /><path d="M15.5 14.2c2.5.3 4.5 2.6 4.5 5.8" />
  </svg>
);

export const IconCalendar = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconClock = ({ className }: IconProps) => (
  <svg className={className} {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);

export const IconPaperclip = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M9 15V7a3 3 0 016 0v9a5 5 0 01-10 0V8" />
  </svg>
);

export const IconDownload = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M12 4v11m0 0l-4-4m4 4l4-4" /><path d="M4 19h16" /></svg>
);

export const IconCopy = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export const IconRefresh = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" /><path d="M18 3v4h-4M6 21v-4h4" />
  </svg>
);

export const IconLock = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
);

export const IconSearch = ({ className }: IconProps) => (
  <svg className={className} {...base}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.5-4.5" /></svg>
);

export const IconFilter = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M4 5h16l-6 8v6l-4-2v-4L4 5z" /></svg>
);

export const IconCheck = ({ className }: IconProps) => (
  <svg className={className} {...base}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9" /></svg>
);

export const IconChevronLeft = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M15 6l-6 6 6 6" /></svg>
);

export const IconChevronRight = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M9 6l6 6-6 6" /></svg>
);

export const IconGrid = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9h18M9 4v16" />
  </svg>
);

export const IconChat = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M4 5h11v6H9l-3 3v-3H4V5z" /><path d="M20 10v6h-3v3l-3-3h-2" />
  </svg>
);

export const IconBraces = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M8 4c-2 0-3 1-3 3v3c0 1-.5 2-2 2 1.5 0 2 1 2 2v3c0 2 1 3 3 3" />
    <path d="M16 4c2 0 3 1 3 3v3c0 1 .5 2 2 2-1.5 0-2 1-2 2v3c0 2-1 3-3 3" />
  </svg>
);

export const IconFileText = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M7 3h7l4 4v14H7V3z" /><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" />
  </svg>
);

export const IconTable = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18M3 15h18M9.5 4v16" />
  </svg>
);

export const IconCode = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M9 6L3 12l6 6M15 6l6 6-6 6" /></svg>
);

export const IconFilePdf = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M7 3h7l4 4v14H7V3z" /><path d="M14 3v4h4" />
    <path d="M9 17v-4h1.2a1.2 1.2 0 010 2.4H9M13 17v-4h1.5M13 15h1M17 17v-4h1.5" />
  </svg>
);

export const IconSettings = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 00-.15-1.5l2-1.4-2-3.4-2.3.9a7 7 0 00-2.6-1.5L13.5 3h-3l-.45 2.1a7 7 0 00-2.6 1.5l-2.3-.9-2 3.4 2 1.4a7 7 0 000 3l-2 1.4 2 3.4 2.3-.9a7 7 0 002.6 1.5L10.5 21h3l.45-2.1a7 7 0 002.6-1.5l2.3.9 2-3.4-2-1.4c.1-.5.15-1 .15-1.5z" />
  </svg>
);
