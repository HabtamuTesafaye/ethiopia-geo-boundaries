# ethiopia-geo-boundaries v2

> Fully offline administrative boundary data for Ethiopia.  
> **Zero network calls · Works forever · Vue 3 / Nuxt 3 ready**
> Features: Interactive drill-down (Region -> Zone -> Woreda), highly accessible, and handles contested borders cleanly.

### 🌍 Region Level
![Region Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/demo.png)

### 📍 Zone Level
![Zone Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/demo2.png)

### 🏠 Woreda Level
![Woreda Map Demo](https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/assets/demo3.png)

## Install

```bash
npm install ethiopia-geo-boundaries d3
```

---

## 🌟 Example Usage App
Check out the full example Nuxt application that uses this package here:  
**[HabtamuTesafaye/map_et](https://github.com/HabtamuTesafaye/map_et)**

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

## Nuxt 3 Setup

```bash
# nuxt.config.ts — no special config needed
# Just install and import
```

```vue
<!-- pages/map.vue -->
<template>
  <ClientOnly>
    <EthiopiaMap
      :data="regionData"
      color-mode="data"
      :color-range="['#fff7ec', '#7f0000']"
      legend-title="Population"
      :value-format="(v) => v.toLocaleString()"
      @feature-click="onRegionClick"
    />
  </ClientOnly>
</template>

<script setup>
import { EthiopiaMap } from 'ethiopia-geo-boundaries/vue'
import { listRegions } from 'ethiopia-geo-boundaries'

// Your backend data — keyed by P-code (ET01, ET04, etc.)
const regionData = {
  'ET04': 40884000,   // Oromia population
  'ET03': 30216000,   // Amhara population
  'ET01': 7070000,    // Tigray population
  'ET05': 6657000,    // Somali population
  // ...etc, from your database
}

function onRegionClick(feature, dataEntry) {
  console.log(feature.properties.name, dataEntry)
}
</script>
```

---

## Matching YOUR database data to P-codes

Your database has region/zone names or codes — use `matchRegion()` / `matchZone()` to link them:

```js
import { matchRegion, matchZone, getRegion } from 'ethiopia-geo-boundaries'

// Works with English name, Amharic name, ISO code, or P-code
matchRegion('Oromia')     // → { pcode: 'ET04', name: 'Oromia', ... }
matchRegion('ኦሮሚያ')       // → same result
matchRegion('ET-OR')      // → same result
matchRegion('ET04')       // → same result

matchZone('Jimma')        // → { pcode: 'ET0410', region_pcode: 'ET04', ... }

// Then build your data map:
const myRows = await db.query('SELECT region_name, value FROM stats')
const mapData = Object.fromEntries(
  myRows.map(row => {
    const region = matchRegion(row.region_name)
    return region ? [region.pcode, row.value] : null
  }).filter(Boolean)
)
```

---

## API Reference

```js
import {
  getBoundaries,    // (0|1) → GeoJSON FeatureCollection
  getRegion,        // (pcode) → Region object
  getZone,          // (pcode) → Zone object
  getZoneRegion,    // (zonePcode) → parent Region
  listRegions,      // () → RegionSummary[]
  listZones,        // () → ZoneFlat[]
  getRegionZones,   // (regionPcode) → Zone[]
  matchRegion,      // (nameOrCode) → Region | null
  matchZone,        // (nameOrCode) → ZoneFlat | null
} from 'ethiopia-geo-boundaries'
```

## Map Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `{ [pcode]: number \| { value, color } }` | `{}` | Your data keyed by P-code |
| `level` | `0 \| 1 \| 2 \| 3` | `1` | Admin level to display (Country, Region, Zone, Woreda) |
| `customGeojson` | `GeoJSON` | `null` | Override with zone/woreda GeoJSON |
| `colorMode` | `'palette' \| 'data' \| 'custom'` | `'palette'` | How to color features |
| `colorRange` | `[string, string]` | red scale | Sequential color range |
| `palette` | `string[]` | built-in | Categorical colors |
| `activeRegion` | `string` | `null` | P-code of region to highlight |
| `showControls` | `boolean` | `true` | Show level switcher |
| `showLegend` | `boolean` | `true` | Show color legend |
| `showSidebarValues` | `boolean` | `false` | Show data values next to regions in sidebar list |
| `pcodeField` | `string` | auto-detect | GeoJSON property key for P-code |
| `valueFormat` | `(v) => string` | `toLocaleString` | Format tooltip values |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@feature-click` | `(feature, dataEntry)` | User clicked a region |
| `@feature-hover` | `(feature \| null, dataEntry \| null)` | Hover start/end |
| `@update:level` | `number` | Level switcher changed |

## Slots

```vue
<!-- Custom tooltip -->
<EthiopiaMap ...>
  <template #tooltip="{ feature, value }">
    <strong>{{ feature.properties.name }}</strong>
    <br/>Cases: {{ value }}
  </template>
</EthiopiaMap>
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

## License
Data: **Public Domain / ODC-PDDL-1.0** (Natural Earth)  
Code: MIT
