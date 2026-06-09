<template>
  <div class="eth-map-root" :style="rootStyle">
    <!-- Top Toolbar (Breadcrumbs & Controls) -->
    <div v-if="showControls" class="eth-map-controls">
      <div class="eth-map-breadcrumbs">
        <span class="eth-map-bc" @click="resetToRegions">Ethiopia</span>
        <span v-if="selectedRegion" class="eth-map-bc-sep">›</span>
        <span v-if="selectedRegion" class="eth-map-bc" @click="goToZones">
          {{ getDisplayName(selectedRegion) }}
        </span>
        <span v-if="selectedZone" class="eth-map-bc-sep">›</span>
        <span v-if="selectedZone" class="eth-map-bc">
          {{ getDisplayName(selectedZone) }}
        </span>
      </div>

      <div class="eth-map-btn-group">
        <button
          v-for="lvl in availableLevels" :key="lvl.id"
          :class="['eth-map-btn', { active: currentLevel === lvl.id }]"
          @click="currentLevel = lvl.id"
        >{{ lvl.label }}<span class="eth-map-btn-count">{{ lvl.count }}</span></button>
      </div>
    </div>

    <!-- Body Layout -->
    <div class="eth-map-body">
      <!-- SVG Map Wrapper -->
      <div ref="containerRef" class="eth-map-svg-wrap">
        <!-- Skeleton Loader -->
        <div v-if="isLoading" class="eth-map-skeleton">
          <div class="eth-map-spinner"></div>
          <div class="eth-map-loading-text">Loading Map Data...</div>
        </div>

        <svg v-else ref="svgRef" class="eth-map-svg" :class="{'is-interactive': interactive}" :width="svgW" :height="svgH">
          <g 
            :transform="`translate(${PAD}, ${PAD})`"
            @mousemove="onSvgMouseMove"
            @mouseleave="onLeave"
            @click="onSvgClick"
          >
            <path
              v-for="(feature, i) in precomputedFeatures" :key="getFeatureKey(feature)"
              :d="feature._d"
              :fill="feature._color"
              :stroke="strokeColor"
              :stroke-width="strokeWidth"
              :opacity="getFeatureOpacity(feature)"
              class="eth-map-path"
              :data-index="i"
            />
          </g>
        </svg>

        <button v-if="!isLoading && currentLevel > 1 && interactive" class="eth-map-back-btn" @click="goBack">
          ← Back
        </button>

        <Teleport to="body">
          <div v-show="!isLoading && tooltip.show && tooltip.feature" id="eth-map-tooltip" class="eth-map-tooltip">
            <slot name="tooltip" :feature="tooltip.feature" :value="tooltip.value" v-if="tooltip.feature">
              <div class="eth-map-tt-name">{{ getDisplayName(tooltip.feature) }}</div>
              <div v-if="tooltip.value != null" class="eth-map-tt-value">{{ valueFormat(tooltip.value) }}</div>
              <div v-if="tooltip.feature.properties?.name_am" class="eth-map-tt-am">{{ tooltip.feature.properties.name_am }}</div>
            </slot>
          </div>
        </Teleport>
      </div>

      <!-- Clickable Sidebar / Legend -->
      <div v-if="showLegend" class="eth-map-sidebar">
        <!-- Dynamic Header for Selected Area -->
        <div v-if="selectedZone && getZoneDetails(selectedZone)" class="eth-map-sidebar-header">
          <div class="eth-map-sh-title">
            {{ getDisplayName(selectedZone) }}
            <span class="eth-map-sh-am" v-if="getZoneDetails(selectedZone).name_am">/ {{ getZoneDetails(selectedZone).name_am }}</span>
          </div>
          <div class="eth-map-sh-meta">
            <div v-if="getZoneDetails(selectedZone).capital"><strong>Capital:</strong> {{ getZoneDetails(selectedZone).capital }}</div>
          </div>
        </div>
        <div v-else-if="selectedRegion && getRegionDetails(selectedRegion)" class="eth-map-sidebar-header">
          <div class="eth-map-sh-title">
            {{ getDisplayName(selectedRegion) }}
            <span class="eth-map-sh-am" v-if="getRegionDetails(selectedRegion).name_am">/ {{ getRegionDetails(selectedRegion).name_am }}</span>
          </div>
          <div class="eth-map-sh-meta">
            <div v-if="getRegionDetails(selectedRegion).population_2024"><strong>Population:</strong> {{ valueFormat(getRegionDetails(selectedRegion).population_2024) }}</div>
            <div v-if="getRegionDetails(selectedRegion).capital"><strong>Capital:</strong> {{ getRegionDetails(selectedRegion).capital }}</div>
          </div>
        </div>
        
        <div class="eth-map-sidebar-title">{{ sidebarTitle }}</div>
        <div class="eth-map-sidebar-list">
          <div v-if="isLoading" class="eth-map-list-loading">
            <div class="eth-map-skeleton-row" v-for="n in 6" :key="n"></div>
          </div>
          <div 
            v-else
            v-for="(feature, i) in sidebarFeatures" 
            :key="getFeatureKey(feature)"
            class="eth-map-list-item"
            :class="{ active: hoveredPcode === getPcode(feature), 'is-interactive': interactive }"
            @mouseenter="hoveredPcode = getPcode(feature)"
            @mouseleave="hoveredPcode = null"
            @click="onClick(null, feature)"
          >
            <div class="eth-map-list-color" :style="{ background: getFeatureColor(feature, i) }"></div>
            <div class="eth-map-list-info">
              <div class="eth-map-list-name">
                {{ getDisplayName(feature) }}
                <span class="eth-map-list-am" v-if="getFeatureDetails(feature)?.name_am">({{ getFeatureDetails(feature).name_am }})</span>
              </div>
              <div class="eth-map-list-cap" v-if="getFeatureDetails(feature)?.capital">Capital: {{ getFeatureDetails(feature).capital }}</div>
            </div>
            <div v-if="showSidebarValues && getFeatureValue(feature) != null" class="eth-map-list-val">
              {{ valueFormat(getFeatureValue(feature)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick, markRaw } from 'vue';
import { getRegion, getZone } from '../src/index.esm.js';

const props = defineProps({
  data:           { type: Object,   default: () => ({}) },
  level:          { type: Number,   default: 1 },
  customGeojson:  { type: Object,   default: null },
  colorMode:      { type: String,   default: 'palette' },
  colorRange:     { type: Array,    default: () => ['#fee5d9', '#a50f15'] },
  palette:        { type: Array,    default: () => ['#7eb8da','#a8d5ba','#f4c87d','#e8a0bf','#b5a3d6','#8ecfc0','#f2b07e','#89c4e1','#c3dba0','#d4a5c6','#f0d68b','#a0cad6','#d9b8a3','#b1d4aa','#c2b8d9'] },
  activeRegion:   { type: String,   default: null },
  showControls:   { type: Boolean,  default: true },
  showLegend:     { type: Boolean,  default: true },
  interactive:    { type: Boolean,  default: true },
  legendTitle:    { type: String,   default: 'Legend' },
  strokeColor:    { type: String,   default: '#1a0e04' },
  width:          { type: [Number, String], default: '100%' },
  height:         { type: [Number, String], default: '650px' },
  valueFormat:    { type: Function, default: (v) => v?.toLocaleString?.() ?? String(v) },
  pcodeField:     { type: String,   default: null },
  showSidebarValues: { type: Boolean, default: false },
});
const emit = defineEmits(['feature-click', 'feature-hover', 'update:level']);

const svgRef = ref(null), containerRef = ref(null);
const svgW = ref(600), svgH = ref(600);
const currentLevel = ref(props.level);
const tooltip = ref({ show: false, feature: null, value: null });
const hoveredPcode = ref(null);

const d3ref = shallowRef(null);
const pkg = shallowRef({});
const isLoading = ref(true);
const PAD = 40;

// Drilldown state
const selectedRegion = ref(null);
const selectedZone = ref(null);

onMounted(async () => {
  d3ref.value = await import('d3');
  await nextTick();
  updateSize();
  initRO();
});

// Lazy load GeoJSON based on the active level to prevent heavy initial loads
watch(currentLevel, async (level) => {
  isLoading.value = true;
  try {
    const p = { ...pkg.value };
    if (level === 0 && !p.adm0) p.adm0 = markRaw((await import('../data/eth-adm0.json')).default);
    if (level === 1 && !p.adm1) p.adm1 = markRaw((await import('../data/eth-adm1-hdx.json')).default);
    if (level === 2 && !p.adm2) p.adm2 = markRaw((await import('../data/eth-adm2.json')).default);
    if (level === 3 && !p.adm3) p.adm3 = markRaw((await import('../data/eth-adm3.json')).default);
    pkg.value = p;
  } catch (err) {
    console.error("Failed to load map data:", err);
  } finally {
    isLoading.value = false;
  }
}, { immediate: true });

let ro;
function initRO() {
  if (!containerRef.value) return;
  ro = new ResizeObserver(([e]) => {
    if (!props.width) svgW.value = Math.max(200, e.contentRect.width);
    if (!props.height) svgH.value = Math.max(200, e.contentRect.height);
  });
  ro.observe(containerRef.value);
}
function updateSize() {
  if (containerRef.value) {
    if (!props.width) svgW.value = Math.max(200, containerRef.value.clientWidth);
    if (!props.height) svgH.value = Math.max(200, containerRef.value.clientHeight);
  }
}
onUnmounted(() => ro?.disconnect());

// GeoJSON Loading Logic
const activeGeojson = computed(() => {
  if (props.customGeojson) return props.customGeojson;
  if (!pkg.value) return { type: 'FeatureCollection', features: [] };

  if (currentLevel.value === 0) return pkg.value.adm0 || { type: 'FeatureCollection', features: [] };
  
  // Woredas view (Filtered by Zone if selected)
  if (currentLevel.value === 3) {
    const geo = pkg.value.adm3 || { type: 'FeatureCollection', features: [] };
    if (selectedZone.value) {
      const zp = getPcode(selectedZone.value);
      return markRaw({ type: 'FeatureCollection', features: geo.features.filter(f => (f.properties.adm2_pcode === zp || f.properties.ADM2_PCODE === zp)) });
    }
    return markRaw({ type: 'FeatureCollection', features: geo.features });
  }
  
  // Zones view (Filtered by Region if selected)
  if (currentLevel.value === 2) {
    const geo = pkg.value.adm2 || { type: 'FeatureCollection', features: [] };
    if (selectedRegion.value) {
      const rp = getPcode(selectedRegion.value);
      return markRaw({ type: 'FeatureCollection', features: geo.features.filter(f => (f.properties.adm1_pcode === rp || f.properties.ADM1_PCODE === rp)) });
    }
    return markRaw({ type: 'FeatureCollection', features: geo.features });
  }
  
  // Regions
  const geo = pkg.value.adm1 || { type: 'FeatureCollection', features: [] };
  return markRaw({ type: 'FeatureCollection', features: geo.features });
});

const activeFeatures = computed(() => activeGeojson.value?.features ?? []);

const sidebarFeatures = computed(() => {
  return activeFeatures.value.filter(f => f.properties?.adm1_name !== 'Contested' && f.properties?.adm1_pcode !== 'ET99' && f.properties?.ADM1_PCODE !== 'ET99');
});

// Pre-compute D3 paths and colors to prevent massive geometry recalculations on hover!
const precomputedFeatures = computed(() => {
  if (!pathFn.value) return activeFeatures.value;
  return activeFeatures.value.map((f, i) => {
    let d = pathFn.value(f);
    // Fallback block if bounding constraints break D3 rendering
    if (!d || d.includes('NaN')) {
      console.warn('D3 returned invalid path for feature:', f.properties.adm1_name || f.properties.adm2_name);
      d = '';
    }
    return {
      ...f,
      _d: d,
      _color: getFeatureColor(f, i)
    }
  });
});

const availableLevels = computed(() => {
  const lvls = [
    { id: 1, label: 'Regions', count: '15' },
    { id: 2, label: 'Zones', count: '107' }
  ];
  if (props.customGeojson) lvls.push({ id: 4, label: 'Custom', count: String(props.customGeojson.features?.length ?? '?') });
  return lvls;
});

const sidebarTitle = computed(() => {
  const count = sidebarFeatures.value.length;
  if (currentLevel.value === 3 && selectedZone.value) return `Sub-divisions (${count})`;
  if (currentLevel.value === 3) return `All Woredas (${count})`;
  if (currentLevel.value === 2 && selectedRegion.value) return `Sub-divisions (${count})`;
  if (currentLevel.value === 2) return `All Zones (${count})`;
  return `Regions (${count})`;
});

// Map Projection
const pathFn = computed(() => {
  if (!d3ref.value || !activeGeojson.value || activeFeatures.value.length === 0) return null;
  
  // Calculate bounds with fallback to prevent negative sizing errors when container shrinks
  const width = Math.max(10, svgW.value - PAD*2);
  const height = Math.max(10, svgH.value - PAD*2);
  
  // Frame the map around the currently active subset of features
  const proj = d3ref.value.geoMercator().fitSize([width, height], activeGeojson.value);
  return d3ref.value.geoPath().projection(proj);
});

function getPcode(f) {
  if (!f || !f.properties) return null;
  const p = f.properties;
  if (props.pcodeField) return p[props.pcodeField];
  return p.ADM3_PCODE || p.adm3_pcode || 
         p.ADM2_PCODE || p.adm2_pcode || 
         p.ADM1_PCODE || p.adm1_pcode || 
         p.pcode || p.id || null;
}
function getDisplayName(f) {
  if (!f || !f.properties) return '';
  const p = f.properties;
  if (currentLevel.value === 3) return p.ADM3_EN || p.adm3_en || p.adm3_name || p.ADM3_NAME || p.name || p.NAME || '';
  if (currentLevel.value === 2) {
    const pcode = getPcode(f);
    const zoneDetails = getZone(pcode);
    if (zoneDetails && zoneDetails.name) return zoneDetails.name;
    return p.ADM2_EN || p.adm2_en || p.adm2_name || p.ADM2_NAME || p.name || p.NAME || '';
  }
  return p.ADM1_EN || p.adm1_en || p.adm1_name || p.ADM1_NAME || p.name || p.NAME || '';
}
function getFeatureValue(f) {
  const pc = getPcode(f);
  if (!pc || !props.data) return null;
  const e = props.data[pc];
  if (e == null) return null;
  return typeof e === 'object' ? (e.value ?? null) : e;
}

function getRegionDetails(f) {
  if (!f) return null;
  return getRegion(getPcode(f));
}

function getZoneDetails(f) {
  if (!f) return null;
  return getZone(getPcode(f));
}

function getFeatureDetails(f) {
  if (currentLevel.value === 1) return getRegionDetails(f);
  if (currentLevel.value === 2) return getZoneDetails(f);
  // Optional: add a Woreda detail fetcher if you have data for it
  return null;
}

const dataExtent = computed(() => {
  if (props.colorMode !== 'data') return [0, 1];
  const vals = activeFeatures.value.map(f => getFeatureValue(f)).filter(v => v != null);
  return vals.length ? [Math.min(...vals), Math.max(...vals)] : [0, 1];
});

function getFeatureColor(f, i) {
  if (currentLevel.value === 0) return props.palette[0] ?? '#b5451b';
  if (props.colorMode === 'data') {
    const val = getFeatureValue(f);
    if (val == null || !d3ref.value) {
      // Provide a distinguishable fallback color instead of a flat #ddd
      return props.palette[i % props.palette.length];
    }
    const [lo, hi] = dataExtent.value;
    const t = hi === lo ? 0.5 : (val - lo) / (hi - lo);
    return d3ref.value.interpolateRgb(props.colorRange[0], props.colorRange[1])(t);
  }
  if (props.colorMode === 'custom') {
    const e = props.data?.[getPcode(f)];
    return (typeof e === 'object' && e?.color) ? e.color : '#ddd';
  }
  return props.palette[i % props.palette.length];
}

function getFeatureOpacity(f) {
  return 0.88; // Default opacity, CSS handles the hover dimming effect for performance
}

const strokeWidth = computed(() => currentLevel.value === 0 ? 1.5 : 0.8);

let rafId = null;

function updateTooltipPos(x, y) {
  const el = document.getElementById('eth-map-tooltip');
  if (el) { el.style.left = (x + 14) + 'px'; el.style.top = (y - 10) + 'px'; }
}

function onSvgMouseMove(e) {
  const target = e.target;
  if (target && target.classList && target.classList.contains('eth-map-path')) {
    const i = target.getAttribute('data-index');
    if (i !== null) {
      const f = precomputedFeatures.value[i];
      if (!tooltip.value.show || tooltip.value.feature !== f) {
        // feature changed (mouse enter)
        tooltip.value = { show: true, feature: f, value: getFeatureValue(f) };
        emit('feature-hover', f, props.data?.[getPcode(f)] ?? null);
      }
      // Throttled mouse move using requestAnimationFrame for butter-smooth tooltips
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateTooltipPos(e.clientX, e.clientY);
        rafId = null;
      });
      return;
    }
  }
  // If we get here, we are not on a path, so trigger leave
  if (tooltip.value.show) onLeave();
}

function onLeave() {
  if (tooltip.value.show) {
    tooltip.value.show = false;
    emit('feature-hover', null, null);
  }
}

function onSvgClick(e) {
  const target = e.target;
  if (target && target.classList && target.classList.contains('eth-map-path')) {
    const i = target.getAttribute('data-index');
    if (i !== null) {
      const f = precomputedFeatures.value[i];
      onClick(e, f);
    }
  }
}

// Drilldown actions
function resetToRegions() {
  selectedRegion.value = null;
  selectedZone.value = null;
  currentLevel.value = 1;
}

function goToZones() {
  selectedZone.value = null;
  currentLevel.value = 2;
}

function goBack() {
  if (currentLevel.value === 3) {
    goToZones();
  } else if (currentLevel.value === 2) {
    resetToRegions();
  }
}

function onClick(e, f) {
  emit('feature-click', f, props.data?.[getPcode(f)] ?? null);
  
  if (!props.interactive) return;

  if (currentLevel.value === 1) {
    selectedRegion.value = f;
    selectedZone.value = null;
    currentLevel.value = 2;
  } else if (currentLevel.value === 2) {
    selectedZone.value = f;
    currentLevel.value = 3;
  }
}

function getFeatureKey(f) { return getPcode(f) ?? JSON.stringify(f.properties).slice(0, 40); }

watch(() => props.level, v => { currentLevel.value = v; });
watch(currentLevel, v => emit('update:level', v));
const rootStyle = computed(() => {
  const w = typeof props.width === 'number' ? props.width + 'px' : props.width;
  const h = typeof props.height === 'number' ? props.height + 'px' : props.height;
  return { width: w, height: h };
});
</script>

<style scoped>
.eth-map-root { position:relative; display:flex; flex-direction:column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); overflow: hidden; border: 1px solid #eaebec; }

/* Toolbar */
.eth-map-controls { display:flex; align-items: center; justify-content: space-between; gap:6px; padding:16px 20px; background:#f8f9fa; border-bottom:1px solid #eaebec; flex-shrink:0; }
.eth-map-breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #4b5563; }
.eth-map-bc { cursor: pointer; transition: color 0.2s; padding: 4px 8px; border-radius: 6px; }
.eth-map-bc:hover { color: #2563eb; background: #eff6ff; }
.eth-map-bc-sep { color: #9ca3af; font-weight: 400; }

.eth-map-btn-group { display: flex; gap: 8px; background: #e5e7eb; padding: 4px; border-radius: 8px; }
.eth-map-btn { display:flex; gap: 6px; align-items:center; padding:6px 14px; border:none; border-radius:6px; background:transparent; cursor:pointer; font-size:12px; font-weight:600; color:#4b5563; transition:all .2s; }
.eth-map-btn:hover { color: #111827; }
.eth-map-btn.active { background:#ffffff; color:#111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.eth-map-btn-count { font-size:10px; font-weight: 700; opacity: 0.8; background: #f3f4f6; padding: 2px 6px; border-radius: 12px; color: #6b7280; }
.eth-map-btn.active .eth-map-btn-count { background: #f3f4f6; color: #111827; }

/* Body */
.eth-map-body { display: flex; flex: 1; min-height: 550px; background: #fcfcfd; }

/* SVG */
.eth-map-svg-wrap { flex:1; position:relative; overflow:hidden; min-height:200px; background: transparent; }
.eth-map-svg { display:block; width:100%; height:100%; }
.eth-map-path { transition:opacity .2s ease, stroke-width 0.2s ease; }
/* High-performance CSS hover logic (bypasses Vue reactivity) */
.eth-map-svg.is-interactive .eth-map-path { cursor:pointer; }
.eth-map-svg.is-interactive:hover .eth-map-path { opacity: 0.4 !important; }
.eth-map-svg.is-interactive .eth-map-path:hover { opacity: 1 !important; stroke-width: 1.5px; filter: brightness(1.1); }

.eth-map-back-btn { position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); border: 1px solid #e5e7eb; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.2s; z-index: 5; }
.eth-map-back-btn:hover { background: #ffffff; color: #111827; transform: translateY(-1px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }

/* Tooltip */
.eth-map-tooltip { position:fixed; z-index:9999; background:rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); color:#111827; padding:14px 20px; border-radius:12px; border:1px solid #e5e7eb; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-size:13px; pointer-events:none; min-width: 140px; max-width:280px; transition: opacity 0.15s ease; }
.eth-map-tt-name { font-weight:700; margin-bottom:4px; font-size: 15px; }
.eth-map-tt-value { color:#2563eb; font-size:18px; font-weight: 800; margin-top:4px; }
.eth-map-tt-am { font-size:13px; color:#6b7280; margin-top:2px; }

/* Sidebar Legend */
.eth-map-sidebar { width: 340px; border-left: 1px solid #eaebec; background: #ffffff; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: -4px 0 15px rgba(0,0,0,0.01); }
.eth-map-sidebar-header { padding: 24px 20px; border-bottom: 1px solid #eaebec; background: #f8f9fa; }
.eth-map-sh-title { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 10px; line-height: 1.2; }
.eth-map-sh-am { font-weight: 500; color: #6b7280; font-size: 16px; }
.eth-map-sh-meta { font-size: 14px; color: #4b5563; line-height: 1.8; }
.eth-map-sh-meta strong { color: #9ca3af; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; margin-right: 6px; }

.eth-map-sidebar-title { padding: 16px 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; border-bottom: 1px solid #eaebec; background: #ffffff; }
.eth-map-sidebar-list { flex: 1; overflow-y: auto; padding: 12px; }
.eth-map-list-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px; border-radius: 8px; margin-bottom: 4px; }
.eth-map-list-item.is-interactive { cursor: pointer; transition: all 0.2s ease; }
.eth-map-list-item.is-interactive:hover, .eth-map-list-item.is-interactive.active { background: #f3f4f6; transform: translateX(2px); }
.eth-map-list-color { width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0; margin-top: 3px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
.eth-map-list-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 2px; }
.eth-map-list-name { font-size: 15px; font-weight: 600; color: #111827; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.eth-map-list-am { font-weight: 500; color: #6b7280; font-size: 13px; margin-left: 6px; }
.eth-map-list-cap { font-size: 13px; color: #6b7280; }
.eth-map-list-val { font-size: 15px; font-weight: 800; color: #374151; margin-top: 2px; }

/* Skeleton Loaders */
.eth-map-skeleton { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(255,255,255,0.8); backdrop-filter: blur(4px); z-index:10; }
.eth-map-spinner { width:36px; height:36px; border:3px solid rgba(37, 99, 235, 0.1); border-top-color:#2563eb; border-radius:50%; animation:eth-spin 1s linear infinite; margin-bottom:16px; }
.eth-map-loading-text { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; animation:eth-pulse 1.5s ease-in-out infinite; }
.eth-map-list-loading { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.eth-map-skeleton-row { height: 32px; border-radius: 8px; background: #f3f4f6; animation:eth-pulse 1.5s ease-in-out infinite; }
@keyframes eth-spin { to { transform:rotate(360deg); } }
@keyframes eth-pulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }
</style>
