import type { FeatureCollection, Feature, Geometry } from 'geojson';

export interface RegionProperties {
  name: string; name_am: string; iso_3166_2: string; region_cod: string;
  capital: string; centroid: [number, number]; adm_level: number; area_sqkm: number | null;
}
export interface Zone {
  pcode: string; name: string; name_am: string; capital: string;
  region_pcode?: string; region_name?: string;
}
export interface Region {
  pcode: string; name: string; name_am: string; capital: string; capital_am: string;
  iso_3166_2: string; area_km2: number; population_2024: number; note?: string;
  zones: Zone[];
}
export interface RegionSummary {
  pcode: string; name: string; name_am: string; capital: string;
  iso_3166_2: string; population_2024: number;
}
export interface ZoneFlat extends Zone {
  region_pcode: string; region_name: string;
}

export function getBoundaries(level: 0 | 1): FeatureCollection<Geometry, RegionProperties>;
export function getRegion(pcode: string): Region | null;
export function getZone(pcode: string): Zone | null;
export function getZoneRegion(zonePcode: string): Region | null;
export function listRegions(): RegionSummary[];
export function listZones(): ZoneFlat[];
export function getRegionZones(regionPcode: string): Zone[];
export function matchRegion(query: string): Region | null;
export function matchZone(query: string): ZoneFlat | null;
export const adm0: FeatureCollection<Geometry, RegionProperties>;
export const adm1: FeatureCollection<Geometry, RegionProperties>;
export const hierarchy: any;
