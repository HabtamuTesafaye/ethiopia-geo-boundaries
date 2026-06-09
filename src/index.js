/**
 * ethiopia-boundaries v2.1.0
 * Self-contained administrative boundary data for Ethiopia.
 * GeoJSON (ADM0–ADM3) + full region/zone hierarchy with PCodes.
 * License: Public Domain / ODC-PDDL-1.0
 */
const adm0      = require('../data/eth-adm0.json');
const adm1      = require('../data/eth-adm1-hdx.json');
const adm2      = require('../data/eth-adm2.json');
const adm3      = require('../data/eth-adm3.json');
const hierarchy = require('../data/hierarchy.json');

/** GeoJSON for any admin level: 0=country, 1=regions, 2=zones, 3=woredas */
function getBoundaries(level) {
  if (level === 0) return adm0;
  if (level === 1) return adm1;
  if (level === 2) return adm2;
  if (level === 3) return adm3;
  throw new Error(`Level ${level} not available. Use 0 (country), 1 (region), 2 (zone), or 3 (woreda).`);
}

/** Get zones GeoJSON filtered by region pcode */
function getRegionZonesGeo(regionPcode) {
  return {
    type: 'FeatureCollection',
    features: adm2.features.filter(f => f.properties.adm1_pcode === regionPcode)
  };
}

/** Get woredas GeoJSON filtered by zone pcode */
function getZoneWoredasGeo(zonePcode) {
  return {
    type: 'FeatureCollection',
    features: adm3.features.filter(f => f.properties.adm2_pcode === zonePcode)
  };
}

/** Get woredas GeoJSON filtered by region pcode */
function getRegionWoredasGeo(regionPcode) {
  return {
    type: 'FeatureCollection',
    features: adm3.features.filter(f => f.properties.adm1_pcode === regionPcode)
  };
}

/** Look up a region by P-code (e.g. 'ET04') */
function getRegion(pcode) {
  return hierarchy._indexes.regions_by_pcode[pcode] || null;
}

/** Look up a zone by P-code (e.g. 'ET0401') */
function getZone(pcode) {
  return hierarchy._indexes.zones_by_pcode[pcode] || null;
}

/** Get parent region of a zone */
function getZoneRegion(zonePcode) {
  const regionPcode = hierarchy._indexes.region_pcode_by_zone_pcode[zonePcode];
  return regionPcode ? getRegion(regionPcode) : null;
}

/** Flat list of all regions (lightweight) */
function listRegions() {
  return hierarchy.regions.map(({ pcode, name, name_am, capital, iso_3166_2, population_2024, area_km2 }) => ({
    pcode, name, name_am, capital, iso_3166_2, population_2024, area_km2
  }));
}

/** Flat list of all zones */
function listZones() {
  return hierarchy.regions.flatMap(r =>
    (r.zones || []).map(z => ({
      pcode: z.pcode,
      name: z.name,
      name_am: z.name_am,
      capital: z.capital,
      region_pcode: r.pcode,
      region_name: r.name,
    }))
  );
}

/** Get all zones for a region */
function getRegionZones(regionPcode) {
  const region = getRegion(regionPcode);
  return region ? (region.zones || []) : [];
}

/** Get woreda count per zone from ADM3 GeoJSON */
function getZoneWoredaCount(zonePcode) {
  return adm3.features.filter(f => f.properties.adm2_pcode === zonePcode).length;
}

/** List all woredas for a zone from ADM3 GeoJSON */
function listWoredas(zonePcode) {
  return adm3.features
    .filter(f => f.properties.adm2_pcode === zonePcode)
    .map(f => ({
      pcode: f.properties.adm3_pcode,
      name: f.properties.adm3_name,
      zone_pcode: f.properties.adm2_pcode,
      zone_name: f.properties.adm2_name,
      region_pcode: f.properties.adm1_pcode,
      region_name: f.properties.adm1_name,
      area_sqkm: f.properties.area_sqkm,
    }));
}

/** Match a text name or pcode to a region — useful for joining your DB data */
function matchRegion(query) {
  const q = query.toLowerCase().trim();
  return hierarchy.regions.find(r =>
    r.pcode.toLowerCase() === q ||
    r.name.toLowerCase() === q ||
    r.iso_3166_2?.toLowerCase() === q ||
    r.name_am === query
  ) || null;
}

/** Match a text name or pcode to a zone */
function matchZone(query) {
  const q = query.toLowerCase().trim();
  return listZones().find(z =>
    z.pcode.toLowerCase() === q ||
    z.name.toLowerCase() === q ||
    z.name_am === query
  ) || null;
}

/** Stats summary of the dataset */
function getStats() {
  return {
    regions: adm1.features.length,
    zones: adm2.features.length,
    woredas: adm3.features.length,
  };
}

module.exports = {
  // GeoJSON
  getBoundaries, adm0, adm1, adm2, adm3,
  // Geo filters
  getRegionZonesGeo, getZoneWoredasGeo, getRegionWoredasGeo,
  // Hierarchy
  getRegion, getZone, getZoneRegion,
  listRegions, listZones, getRegionZones,
  matchRegion, matchZone,
  // Woreda helpers
  getZoneWoredaCount, listWoredas,
  // Stats
  getStats,
  // Raw data
  hierarchy,
};
