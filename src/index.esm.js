import adm0      from '../data/eth-adm0.json' assert { type: 'json' };
import adm1      from '../data/eth-adm1-hdx.json' assert { type: 'json' };
import adm2      from '../data/eth-adm2.json' assert { type: 'json' };
import adm3      from '../data/eth-adm3.json' assert { type: 'json' };
import hierarchy from '../data/hierarchy.json' assert { type: 'json' };

export const getBoundaries = (level) => {
  if (level === 0) return adm0;
  if (level === 1) return adm1;
  if (level === 2) return adm2;
  if (level === 3) return adm3;
  throw new Error(`Level ${level} not available. Use 0–3.`);
};
export const getRegionZonesGeo  = (rp) => ({ type: 'FeatureCollection', features: adm2.features.filter(f => f.properties.adm1_pcode === rp) });
export const getZoneWoredasGeo  = (zp) => ({ type: 'FeatureCollection', features: adm3.features.filter(f => f.properties.adm2_pcode === zp) });
export const getRegionWoredasGeo = (rp) => ({ type: 'FeatureCollection', features: adm3.features.filter(f => f.properties.adm1_pcode === rp) });
export const getRegion      = (p) => hierarchy._indexes.regions_by_pcode[p] || null;
export const getZone        = (p) => hierarchy._indexes.zones_by_pcode[p] || null;
export const getZoneRegion  = (p) => { const rp = hierarchy._indexes.region_pcode_by_zone_pcode[p]; return rp ? getRegion(rp) : null; };
export const listRegions    = () => hierarchy.regions.map(({ pcode,name,name_am,capital,iso_3166_2,population_2024,area_km2 }) => ({pcode,name,name_am,capital,iso_3166_2,population_2024,area_km2}));
export const listZones      = () => hierarchy.regions.flatMap(r => (r.zones||[]).map(z => ({pcode:z.pcode,name:z.name,name_am:z.name_am,capital:z.capital,region_pcode:r.pcode,region_name:r.name})));
export const getRegionZones = (rp) => { const r = getRegion(rp); return r ? (r.zones||[]) : []; };
export const getZoneWoredaCount = (zp) => adm3.features.filter(f => f.properties.adm2_pcode === zp).length;
export const listWoredas    = (zp) => adm3.features.filter(f => f.properties.adm2_pcode === zp).map(f => ({pcode:f.properties.adm3_pcode,name:f.properties.adm3_name,zone_pcode:f.properties.adm2_pcode,zone_name:f.properties.adm2_name,region_pcode:f.properties.adm1_pcode,region_name:f.properties.adm1_name,area_sqkm:f.properties.area_sqkm}));
export const matchRegion    = (q) => { const lq = q.toLowerCase().trim(); return hierarchy.regions.find(r => r.pcode.toLowerCase()===lq||r.name.toLowerCase()===lq||r.iso_3166_2?.toLowerCase()===lq||r.name_am===q)||null; };
export const matchZone      = (q) => { const lq = q.toLowerCase().trim(); return listZones().find(z => z.pcode.toLowerCase()===lq||z.name.toLowerCase()===lq||z.name_am===q)||null; };
export const getStats       = () => ({ regions: adm1.features.length, zones: adm2.features.length, woredas: adm3.features.length });
export { adm0, adm1, adm2, adm3, hierarchy };
