#!/usr/bin/env node
/**
 * convert-hdx.js — Convert HDX COD-AB shapefile to local GeoJSON
 *
 * 1. Download: https://data.humdata.org/dataset/cod-ab-eth
 *    File: eth_adm_csa_bofedb_2021_shp.zip
 * 2. Unzip into ./input/
 * 3. Run: node scripts/convert-hdx.js
 * 4. Output: data/eth-adm2.json and data/eth-adm3.json
 */
const fs = require('fs'), path = require('path');
let shapefile;
try { shapefile = require('shapefile'); }
catch { console.error('Run: npm install shapefile'); process.exit(1); }

const INPUT = path.join(__dirname, '../input');
const OUTPUT = path.join(__dirname, '../data');

async function convert(shpName, outName, keepFields) {
  const source = await shapefile.open(path.join(INPUT, shpName));
  const features = [];
  let r;
  while (!(r = await source.read()).done) {
    const props = {};
    for (const k of keepFields) props[k] = r.value.properties[k] ?? null;
    features.push({ type:'Feature', properties: props, geometry: r.value.geometry });
  }
  fs.writeFileSync(path.join(OUTPUT, outName), JSON.stringify({ type:'FeatureCollection', features }));
  console.log(`✓ ${outName}  (${features.length} features)`);
}

(async () => {
  await convert('eth_admbnda_adm2_csa_bofedb_2021.shp', 'eth-adm2.json',
    ['ADM0_EN','ADM1_EN','ADM2_EN','ADM0_PCODE','ADM1_PCODE','ADM2_PCODE']);
  await convert('eth_admbnda_adm3_csa_bofedb_2021.shp', 'eth-adm3.json',
    ['ADM0_EN','ADM1_EN','ADM2_EN','ADM3_EN','ADM0_PCODE','ADM1_PCODE','ADM2_PCODE','ADM3_PCODE']);
  console.log('\nDone. Files written to data/');
})();
