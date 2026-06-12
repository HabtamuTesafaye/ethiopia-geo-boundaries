import type { MapOptions, ColorPalette } from './types.js';

const PALETTES: Record<ColorPalette, string[]> = {
  blue:   ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
  green:  ['#dcfce7', '#86efac', '#22c55e', '#15803d', '#14532d'],
  orange: ['#ffedd5', '#fdba74', '#f97316', '#c2410c', '#7c2d12'],
  red:    ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'],
  purple: ['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce', '#581c87'],
};

function getColor(
  value: number | undefined,
  min: number,
  max: number,
  palette: string[]
): string {
  if (value === undefined) return '#e5e7eb'; // gray default
  const Math_max = Math.max;
  const normalized = max === min ? 0 : (value - min) / (max - min);
  const index = Math.min(Math.floor(normalized * palette.length), palette.length - 1);
  return palette[Math_max(0, index)];
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderEthiopiaMap(
  paths: Record<string, string>,
  options: MapOptions = {}
): string {
  const {
    values = {},
    palette = 'blue',
    size = 800,
    classPrefix = 'eth-geo',
    stroke = '#ffffff',
    strokeWidth = 0.5,
  } = options;

  const numericValues = Object.values(values).filter(v => typeof v === 'number');
  const min = numericValues.length ? Math.min(...numericValues) : 0;
  const max = numericValues.length ? Math.max(...numericValues) : 1;
  const colors = PALETTES[palette];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const pathElements = Object.entries(paths)
    .map(([name, d]) => {
      // Calculate Bounding Box
      const coords = d.match(/-?\d+(\.\d+)?/g);
      if (coords) {
        for (let i = 0; i < coords.length; i += 2) {
          const x = parseFloat(coords[i]);
          const y = parseFloat(coords[i+1]);
          if (!isNaN(x) && !isNaN(y)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const fill = getColor(values[name], min, max, colors);
      const safeName = escapeHtml(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      const safeDataName = escapeHtml(name);
      return `  <path class="${escapeHtml(classPrefix)}-${safeName}" data-name="${safeDataName}" d="${d}" fill="${fill}" stroke="${escapeHtml(stroke)}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke" />`;
    })
    .join('\n');

  // Fallback to default if no valid coordinates
  if (minX === Infinity) {
    minX = 0; minY = 0; maxX = 800; maxY = 800;
  }

  // Add 2% padding
  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * 0.02 || 10;
  const padY = height * 0.02 || 10;
  const vbMinX = minX - padX;
  const vbMinY = minY - padY;
  const vbWidth = width + (padX * 2);
  const vbHeight = height + (padY * 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbMinX} ${vbMinY} ${vbWidth} ${vbHeight}" width="100%" height="100%">
${pathElements}
</svg>`;
}
