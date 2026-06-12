import { geoPath, geoMercator } from 'd3-geo';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const WIDTH = 800;
const HEIGHT = 800;

type GeoRecord = Record<string, string>;

// Use a single projection based on ADM1 so ADM2 and ADM3 align perfectly
const baseRaw = JSON.parse(readFileSync('geojson/eth-adm1-hdx.json', 'utf-8'));
const projection = geoMercator().fitSize([WIDTH, HEIGHT], baseRaw);
const pathGenerator = geoPath(projection);

function buildGeometry(geojsonPath: string, nameProp: string, pcodeProp: string, parentProp?: string, filter?: (f: any) => boolean): { paths: GeoRecord, parents: GeoRecord, names: GeoRecord } {
  const raw = JSON.parse(readFileSync(geojsonPath, 'utf-8'));
  const paths: GeoRecord = {};
  const parents: GeoRecord = {};
  const names: GeoRecord = {};

  for (const feature of raw.features) {
    if (filter && !filter(feature)) continue;
    
    // Always use PCODE as the globally unique ID to prevent overlapping generic names (like 'Central')
    const id: string = feature.properties[pcodeProp];
    const name: string = feature.properties[nameProp];
    
    if (!id || name === 'Contested') continue;
    const d = pathGenerator(feature);
    if (id && d) {
      paths[id] = d;
      names[id] = name;
      if (parentProp) {
        parents[id] = feature.properties[parentProp];
      }
    }
  }

  return { paths, parents, names };
}

function writeGeometryFile(outputPath: string, varName: string, data: GeoRecord, parentsData?: GeoRecord, namesData?: GeoRecord) {
  const keys = Object.keys(data);
  const vals = Object.values(data);
  const parentsContent = parentsData ? `export const ${varName}Parents: Record<string, string> = ${JSON.stringify(parentsData, null, 2)};` : '';
  const namesContent = namesData ? `export const ${varName}Names: Record<string, string> = ${JSON.stringify(namesData, null, 2)};` : '';

  const content = `// AUTO-GENERATED — do not edit. Run \`npm run prebuild\` to regenerate.

const _keys = ${JSON.stringify(keys)};
const _vals = ${JSON.stringify(vals)};

export const ${varName}: Record<string, string> = Object.fromEntries(
  _keys.map((k, i) => [k, _vals[i]])
);

${parentsContent}
${namesContent}
`;
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Written: ${outputPath} (${(content.length / 1024).toFixed(1)} KB)`);
}

// --- Run ---
mkdirSync('src/geometry', { recursive: true });

// 1. ADM1: Use perfectly merged ADM2 topojson data so there are no internal borders!
const adm1Result = buildGeometry('geojson/eth-adm1-topo-merged.json', 'adm1_name', 'adm1_name');
writeGeometryFile('src/geometry/adm1.ts', 'adm1Paths', adm1Result.paths, undefined, adm1Result.names);

// 2. ADM2: HDX ADM2 + City Regions Sub-cities promoted from ADM3
const adm2Base = buildGeometry('geojson/eth-adm2.json', 'adm2_name', 'adm2_pcode', 'adm1_name', (f) => {
  // Exclude single-polygon city regions from ADM2
  const adm1 = f.properties.adm1_name;
  return adm1 !== 'Addis Ababa' && adm1 !== 'Dire Dawa';
});
const adm2CitySubcities = buildGeometry('geojson/eth-adm3.json', 'adm3_name', 'adm3_pcode', 'adm1_name', (f) => {
  // Include ONLY subcities of Addis Ababa and Dire Dawa
  const adm1 = f.properties.adm1_name;
  return adm1 === 'Addis Ababa' || adm1 === 'Dire Dawa';
});
const adm2CombinedPaths = { ...adm2Base.paths, ...adm2CitySubcities.paths };
const adm2CombinedParents = { ...adm2Base.parents, ...adm2CitySubcities.parents };
const adm2CombinedNames = { ...adm2Base.names, ...adm2CitySubcities.names };
writeGeometryFile('src/geometry/adm2.ts', 'adm2Paths', adm2CombinedPaths, adm2CombinedParents, adm2CombinedNames);

// 3. ADM3: HDX ADM3 (excluding city regions since we promoted them)
const adm3Filtered = buildGeometry('geojson/eth-adm3.json', 'adm3_name', 'adm3_pcode', 'adm2_pcode', (f) => {
  const adm1 = f.properties.adm1_name;
  return adm1 !== 'Addis Ababa' && adm1 !== 'Dire Dawa';
});
writeGeometryFile('src/geometry/adm3.ts', 'adm3Paths', adm3Filtered.paths, adm3Filtered.parents, adm3Filtered.names);

