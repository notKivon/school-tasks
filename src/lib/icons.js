// Icon path data, copied verbatim from the SVG sprite in design/template.html
// (ids there are `i-<name>`). All icons are 24x24, stroked, no fill.
// Each icon is a list of [tag, attributes] shapes rendered by <Icon />.

const path = (d) => ['path', { d }]

export const ICONS = {
  plus: [path('M12 5v14M5 12h14')],
  trash: [path('M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3')],
  check: [path('M5 12.5l4.5 4.5L19 7.5')],
  cal: [
    ['rect', { x: 3.5, y: 5, width: 17, height: 15.5, rx: 2.5 }],
    path('M3.5 10h17M8 3v4M16 3v4'),
  ],
  x: [path('M6 6l12 12M18 6L6 18')],
  tag: [
    path('M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.7 6.7a1.4 1.4 0 0 1-2 0z'),
    ['circle', { cx: 8.2, cy: 8.2, r: 1.4 }],
  ],
  key: [
    ['circle', { cx: 8, cy: 15, r: 4.5 }],
    path('M11.2 11.8L20 3M16.5 6.5l2.5 2.5M14 9l2 2'),
  ],
  out: [path('M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10')],
  clock: [
    ['circle', { cx: 12, cy: 12, r: 8.5 }],
    path('M12 7.5V12l3 2'),
  ],
  'wifi-off': [
    path(
      'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.6-2.9M10.5 5.6A15 15 0 0 1 22 9.5',
    ),
    ['circle', { cx: 12, cy: 20, r: 0.6 }],
  ],
  'chev-down': [path('M7 10l5 5 5-5')],
  'chev-right': [path('M10 7l5 5-5 5')],
  alert: [
    ['circle', { cx: 12, cy: 12, r: 8.5 }],
    path('M12 8v4.5M12 16h.01'),
  ],
  mail: [
    ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2.5 }],
    path('M4 7l8 6 8-6'),
  ],
  info: [path('M12 11v6M12 7.5h.01')],
  copy: [
    ['rect', { x: 8.5, y: 8.5, width: 11.5, height: 11.5, rx: 2.5 }],
    path('M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5'),
  ],
  arrow: [path('M5 12h14M13 6l6 6-6 6')],
  down: [path('M12 4v11M7 10.5l5 5 5-5M5 20h14')],
  move: [path('M12 4v16M6 14l6 6 6-6')],
}

export const ICON_NAMES = Object.keys(ICONS)
