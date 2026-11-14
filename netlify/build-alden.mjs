import { copyFile, cp, mkdir } from 'node:fs/promises';

const source = new URL('../paladin-preview/', import.meta.url);
const destination = new URL('../outputs/alden/', import.meta.url);
const assets = [
  'index.html', 'tools.js', 'tools.css', 'sheet.css', 'battle.js', 'battle.css',
  'portrait-card.js', 'portrait-luskan-prayer.jpg', 'portrait-luskan-prayer.mp4', 'dnd-logo.png', 'castle-hall-unlit.jpg',
  'torch-flame-soft.png', 'notes-parchment-portrait.png', 'shar-sanctuary.jpg',
  'favicon-shar.png', 'faerun-map.jpg', 'map.css', 'map.js'
];

await mkdir(destination, { recursive: true });
await Promise.all(assets.map(file =>
  copyFile(new URL(file, source), new URL(file, destination))
));
await cp(new URL('rpg-icons/', source), new URL('rpg-icons/', destination), { recursive: true });
