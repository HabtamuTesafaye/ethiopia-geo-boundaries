# ethiopia-geo-boundaries v2

> Fully offline administrative boundary data for Ethiopia.  
> **Zero network calls · Works forever · Vue 3 / Nuxt 3 ready**
> Features: Interactive drill-down (Region -> Zone -> Woreda), highly accessible, and handles contested borders cleanly.

### 🌍 Region Level
![Region Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/v2/demo_1.png)

### 📍 Zone Level
![Zone Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/v2/demo_2.png)

### 🏠 Woreda Level
![Woreda Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/v2/demo_3.png)

### 🏠 Zone Level As a whole
![Woreda Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/v2/demo_4.png)

## Install

```bash
npm install ethiopia-geo-boundaries d3
```

---

## 🌟 Live Demo & Example App

**Live Demo:** [map-et.vercel.app](https://map-et.vercel.app/)

**Example App Repo:** [HabtamuTesafaye/map_et](https://github.com/HabtamuTesafaye/map_et/tree/main)

---

## What's included

| File | Contents |
|------|----------|
| `data/eth-adm0.json` | Country outline GeoJSON |
| `data/eth-adm1.json` | 14 regions GeoJSON (Natural Earth, public domain) with Contested area correctly mapped |
| `data/hierarchy.json` | 14 regions + zones with PCodes, names, Amharic, capitals, populations |
| `vue/EthiopiaMap.vue` | Vue 3 / Nuxt 3 choropleth map component |
| `scripts/convert-hdx.js` | Convert HDX COD-AB shapefile → zone/woreda GeoJSON |

> **ADM2/ADM3 geometry**: Zone and woreda polygons require the HDX COD-AB shapefile (manual download from humdata.org). Run `node scripts/convert-hdx.js` after placing the shapefile in `./input/`.

---

## Usage

### Install

```bash
npm install ethiopia-geo-boundaries d3
```

### SVG Paths (ADM1–ADM3)

Import pre-built SVG path strings keyed by P-code:

```ts
import { adm1Paths, adm1PathsNames } from 'ethiopia-geo-boundaries/adm1'
import {
  adm2Paths, adm2PathsParents, adm2PathsNames,
} from 'ethiopia-geo-boundaries/adm2'
import {
  adm3Paths, adm3PathsParents, adm3PathsNames,
} from 'ethiopia-geo-boundaries/adm3'
```

- `adm1Paths` / `adm2Paths` / `adm3Paths` — `Record<string, string>` of P-code → SVG `d` attribute
- `adm1PathsNames` / `adm2PathsNames` / `adm3PathsNames` — `Record<string, string>` of P-code → human-readable name
- `adm2PathsParents` / `adm3PathsParents` — `Record<string, string>` of child P-code → parent name

### Render SVG string

```ts
import { renderEthiopiaMap } from 'ethiopia-geo-boundaries'

const svg = renderEthiopiaMap(adm1Paths, {
  colors: { ET04: '#ff0000', ET03: '#00ff00' },
  size: 700,
  stroke: '#1e293b',
  strokeWidth: 1.2,
})
```

Then render with `v-html` (Vue) or `innerHTML` (vanilla JS).

### Map Options (`MapOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `values` | `Record<string, number>` | `{}` | Numeric data keyed by P-code for choropleth |
| `colors` | `Record<string, string>` | `{}` | Explicit hex colors per P-code (overrides `values` + `palette`) |
| `palette` | `'blue' \| 'green' \| 'orange' \| 'red' \| 'purple'` | `'blue'` | Color palette for choropleth |
| `size` | `number` | `800` | SVG canvas size |
| `classPrefix` | `string` | `'eth-geo'` | CSS class prefix for path elements |
| `stroke` | `string` | `'#ffffff'` | Stroke color |
| `strokeWidth` | `number` | `0.5` | Stroke width |
| `showLegend` | `boolean` | `false` | Render legend inside SVG |
| `legendLabels` | `[string, string]` | `['Low', 'High']` | Legend labels |

## Matching names to P-codes

Use the names dictionaries to look up P-codes:

```ts
import { adm1PathsNames, adm2PathsNames } from 'ethiopia-geo-boundaries/adm1' // or /adm2

// Find P-code for a name
const pcode = Object.keys(adm1PathsNames).find(k => adm1PathsNames[k] === 'Oromia')
```

## Region P-codes

| P-code | English | Amharic | Capital |
|--------|---------|---------|---------|
| ET01 | Tigray | ትግራይ | Mekelle |
| ET02 | Afar | አፋር | Semera |
| ET03 | Amhara | አማራ | Bahir Dar |
| ET04 | Oromia | ኦሮሚያ | Addis Ababa |
| ET05 | Somali | ሶማሌ | Jijiga |
| ET06 | Benishangul-Gumuz | ቤኒሻንጉል-ጉምዝ | Asosa |
| ET07 | Central Ethiopia | ማዕከላዊ ኢትዮጵያ | Hosaina |
| ET08 | South Ethiopia | ደቡብ ኢትዮጵያ | Arba Minch |
| ET11 | South West Ethiopia | ደቡብ ምዕራብ | Bonga |
| ET12 | Gambela | ጋምቤላ | Gambela |
| ET13 | Harari | ሐረሪ | Harar |
| ET14 | Addis Ababa | አዲስ አበባ | Addis Ababa |
| ET15 | Dire Dawa | ድሬዳዋ | Dire Dawa |
| ET16 | Sidama | ሲዳማ | Hawassa |


