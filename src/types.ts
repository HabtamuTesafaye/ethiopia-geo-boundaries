export type AdmLevel = 1 | 2 | 3;

export type ColorPalette = 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface MapOptions {
  /** Map region/zone/woreda names to numeric values (for choropleth coloring) */
  values?: Record<string, number>;
  palette?: ColorPalette;
  /** SVG canvas size. Defaults to 800 */
  size?: number;
  /** CSS class prefix for path elements. Defaults to 'eth-geo' */
  classPrefix?: string;
  /** Stroke color. Defaults to '#ffffff' */
  stroke?: string;
  strokeWidth?: number;
  /** Whether to render a legend inside the SVG. Defaults to false */
  showLegend?: boolean;
  /** Labels for the legend [low, high]. Defaults to ['Low', 'High'] */
  legendLabels?: [string, string];
}
