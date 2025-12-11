import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import FiltersDrawer from '../components/FiltersDrawer.jsx';
import SearchCriteriaBar from '../components/SearchCriteriaBar.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import LoadingBanner from '../components/LoadingBanner.jsx';
import ChartSkeleton from '../components/ChartSkeleton.jsx';

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

const seriesMeta = [
  { key: 'vna', name: 'Vietnam Airlines', color: '#2563eb', width: 2.5 },
  { key: 'vietjet', name: 'VietJet Air', color: '#10b981', width: 2 },
  { key: 'bamboo', name: 'Bamboo Airways', color: '#f59e0b', width: 2 },
  { key: 'pacific', name: 'Pacific Airlines', color: '#ef4444', width: 2 },
];

const routeColorPalette = ['#1f77b4', '#2ca02c', '#ff7f0e', '#d62728', '#9467bd', '#17becf'];
const airlineDashByKey = {
  vna: undefined,      // solid
  vietjet: '4 4',
  bamboo: '6 3',
  pacific: '2 2',
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(hexA, hexB, ratio = 0.4) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({
    r: a.r * (1 - ratio) + b.r * ratio,
    g: a.g * (1 - ratio) + b.g * ratio,
    b: a.b * (1 - ratio) + b.b * ratio,
  });
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const baseData = [
  // More realistic baseline fares with occasional promotions where VNA undercuts competitors
  { vna: 10_200_000, vietjet: 9_800_000, bamboo: 10_000_000, pacific: 9_900_000 },
  { vna: 8_900_000,  vietjet: 9_300_000, bamboo: 9_500_000,  pacific: 9_100_000 }, // VNA lowest
  { vna: 9_600_000,  vietjet: 9_000_000, bamboo: 9_400_000,  pacific: 9_100_000 },
  { vna: 8_300_000,  vietjet: 8_700_000, bamboo: 8_900_000,  pacific: 8_500_000 }, // VNA lowest
  { vna: 8_700_000,  vietjet: 8_900_000, bamboo: 9_000_000,  pacific: 8_950_000 }, // VNA lowest
  { vna: 9_800_000,  vietjet: 9_400_000, bamboo: 9_700_000,  pacific: 9_200_000 },
  { vna: 11_000_000, vietjet: 10_400_000, bamboo: 10_800_000, pacific: 10_200_000 },
  { vna: 8_200_000,  vietjet: 8_500_000, bamboo: 8_700_000,  pacific: 8_400_000 }, // VNA lowest
  { vna: 8_900_000,  vietjet: 8_700_000, bamboo: 9_000_000,  pacific: 8_800_000 },
  { vna: 8_100_000,  vietjet: 8_600_000, bamboo: 8_900_000,  pacific: 8_300_000 }, // VNA lowest
  { vna: 8_400_000,  vietjet: 8_300_000, bamboo: 8_600_000,  pacific: 8_400_000 },
  { vna: 9_300_000,  vietjet: 9_100_000, bamboo: 9_400_000,  pacific: 9_000_000 },
  { vna: 8_200_000,  vietjet: 8_600_000, bamboo: 8_800_000,  pacific: 8_400_000 }, // VNA lowest
  { vna: 9_600_000,  vietjet: 9_400_000, bamboo: 9_700_000,  pacific: 9_200_000 },
];

export default function FareTrends() {
  const [tab, setTab] = useState('cheapest');
  const [myAirline, setMyAirline] = useState('vna');
  const [competitorOpen, setCompetitorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Crunching fare data…');
  const [loadingSub, setLoadingSub] = useState('');
  const defaultFilters = useMemo(() => ({
    stops: ['0 Stop', '1 Stop'],
    journeyHours: 100,
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    fareType: 'Gross fare',
    selectedFlights: [],
  }), []);
  const [filters, setFilters] = useState(defaultFilters);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoomRange, setZoomRange] = useState(null); // {start, end} indices
  const [selectRange, setSelectRange] = useState(null); // temporary selection while dragging
  const [visibleCompetitors, setVisibleCompetitors] = useState(() => new Set(seriesMeta.map(s => s.key)));
  const todayISO = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [criteria, setCriteria] = useState({
    shopDate: todayISO,
    cabin: 'Economy',
    fareView: 'By Channel',
    routes: ['BKK-HAN'],
    departStart: format(addDays(new Date(), 0), 'yyyy-MM-dd'),
    departEnd: format(addDays(new Date(), 13), 'yyyy-MM-dd'),
    trip: 'OW',
    currency: (typeof window !== 'undefined' && window.localStorage.getItem('airgain_currency')) || 'VND',
  });

  useEffect(() => {
    document.title = 'AirGain | Fare Trends';
  }, []);

  const availableShopDates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10; i++) {
      arr.push(format(addDays(new Date(), -i), 'yyyy-MM-dd'));
    }
    return arr;
  }, []);

  useEffect(() => {
    function onCurrencyChange() {
      if (typeof window !== 'undefined') {
        const v = window.localStorage.getItem('airgain_currency') || 'VND';
        setCriteria((p) => ({ ...p, currency: v }));
      }
    }
    window.addEventListener('airgain_currency_changed', onCurrencyChange);
    window.addEventListener('storage', onCurrencyChange);
    return () => {
      window.removeEventListener('airgain_currency_changed', onCurrencyChange);
      window.removeEventListener('storage', onCurrencyChange);
    };
  }, []);

  function onCriteriaChange(patch) {
    setCriteria((prev) => ({ ...prev, ...patch }));
    setLoading(true);
  }

  function formatCurrency(value) {
    const curr = criteria.currency === 'USD' ? 'USD' : 'VND';
    const locale = curr === 'USD' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(value);
  }

  const selectedRoutes = useMemo(() => {
    if (Array.isArray(criteria.routes) && criteria.routes.length > 0) return criteria.routes;
    return [criteria.route || 'BKK-HAN'];
  }, [criteria.routes, criteria.route]);

  function baseFactors() {
    const cabinFactor = criteria.cabin === 'Business' ? 1.6 : criteria.cabin === 'Premium' ? 1.15 : 1.0;
    const tripFactor = criteria.trip === 'RT' ? 1.8 : 1.0;
    return { cabinFactor, tripFactor };
  }

  function computeRouteFactor(route) {
    const routeFactorMap = {
      'BKK-HAN': 1.0,
      'BOM-HND': 1.1,
      'DEL-NRT': 1.2,
      'DMK-HAN': 0.95,
      'HAN-BKK': 0.98,
    };
    return routeFactorMap[route] ?? 1.0;
  }

  // Single-route data (for Cheapest/Average tabs)
  const chartData = useMemo(() => {
    const start = parseISO(criteria.departStart);
    const end = parseISO(criteria.departEnd);
    const days = Math.max(1, Math.min(60, differenceInCalendarDays(end, start) + 1));
    const { cabinFactor, tripFactor } = baseFactors();
    const routeFactor = computeRouteFactor(selectedRoutes[0]);
    const m = cabinFactor * tripFactor * routeFactor;
    // Currency conversion (approx): VND per USD
    const vndPerUsd = 24000;
    const toCurrency = (v) => (criteria.currency === 'USD' ? Math.round(v / vndPerUsd) : v);
    // Filters multipliers
    const fareTypeFactor = filters.fareType === 'Base fare' ? 0.85 : filters.fareType === 'YQ/YR' ? 0.15 : 1.0;
    // Stops factor: average factors for selected stops
    const stopFactorMap = { '0 Stop': 0.95, '1 Stop': 1.0, '1+ Stop': 1.05 };
    const stopFactors = (filters.stops?.length ?? 0) > 0 ? filters.stops.map(s => stopFactorMap[s] ?? 1.0) : [1.0];
    const avgStopFactor = stopFactors.reduce((a, b) => a + b, 0) / stopFactors.length;
    // Journey hours factor: 0.7..1.0
    const journeyFactor = 0.7 + Math.min(100, Math.max(0, filters.journeyHours)) * 0.003;
    const totalFactor = m * fareTypeFactor * avgStopFactor * journeyFactor;

    const rows = [];
    for (let i = 0; i < days; i++) {
      const base = baseData[i % baseData.length];
      const date = addDays(start, i);
      rows.push({
        name: format(date, 'dd MMM'),
        dateISO: format(date, 'yyyy-MM-dd'),
        vna: toCurrency(Math.round(base.vna * totalFactor)),
        vietjet: toCurrency(Math.round(base.vietjet * totalFactor)),
        bamboo: toCurrency(Math.round(base.bamboo * totalFactor)),
        pacific: toCurrency(Math.round(base.pacific * totalFactor)),
      });
    }
    // Weekdays filter
    const codeFor = (d) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][parseISO(d).getDay()];
    const weekdaySet = new Set(filters.weekdays);
    const filtered = rows.filter(r => weekdaySet.has(codeFor(r.dateISO)));
    return filtered;
  }, [criteria, filters, selectedRoutes]);

  const displayData = useMemo(() => {
    if (tab === 'distribution') return chartData;
    if (chartData.length === 0) return chartData;
    if (tab === 'cheapest') {
      return chartData.map((r) => {
        const minVal = Math.min(r.vna, r.vietjet, r.bamboo, r.pacific);
        return { ...r, cheapest: minVal };
      });
    }
    if (tab === 'average') {
      return chartData.map((r) => {
        const avgVal = Math.round((r.vna + r.vietjet + r.bamboo + r.pacific) / 4);
        return { ...r, average: avgVal };
      });
    }
    return chartData;
  }, [chartData, tab]);

  // Multi-route data for Distribution tab: produce series per (route, airline)
  const multiChartData = useMemo(() => {
    const start = parseISO(criteria.departStart);
    const end = parseISO(criteria.departEnd);
    const days = Math.max(1, Math.min(60, differenceInCalendarDays(end, start) + 1));
    const { cabinFactor, tripFactor } = baseFactors();
    const vndPerUsd = 24000;
    const toCurrency = (v) => (criteria.currency === 'USD' ? Math.round(v / vndPerUsd) : v);
    const fareTypeFactor = filters.fareType === 'Base fare' ? 0.85 : filters.fareType === 'YQ/YR' ? 0.15 : 1.0;
    const stopFactorMap = { '0 Stop': 0.95, '1 Stop': 1.0, '1+ Stop': 1.05 };
    const stopFactors = (filters.stops?.length ?? 0) > 0 ? filters.stops.map(s => stopFactorMap[s] ?? 1.0) : [1.0];
    const avgStopFactor = stopFactors.reduce((a, b) => a + b, 0) / stopFactors.length;
    const journeyFactor = 0.7 + Math.min(100, Math.max(0, filters.journeyHours)) * 0.003;

    const keyFor = (route, airlineKey) => `${route.replace(/[^A-Za-z0-9]/g, '')}_${airlineKey}`;

    const rows = [];
    for (let i = 0; i < days; i++) {
      const base = baseData[i % baseData.length];
      const date = addDays(start, i);
      const row = {
        name: format(date, 'dd MMM'),
        dateISO: format(date, 'yyyy-MM-dd'),
      };
      for (const route of selectedRoutes) {
        const m = cabinFactor * tripFactor * computeRouteFactor(route) * fareTypeFactor * avgStopFactor * journeyFactor;
        row[keyFor(route, 'vna')] = toCurrency(Math.round(base.vna * m));
        row[keyFor(route, 'vietjet')] = toCurrency(Math.round(base.vietjet * m));
        row[keyFor(route, 'bamboo')] = toCurrency(Math.round(base.bamboo * m));
        row[keyFor(route, 'pacific')] = toCurrency(Math.round(base.pacific * m));
      }
      rows.push(row);
    }
    const codeFor = (d) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][parseISO(d).getDay()];
    const weekdaySet = new Set(filters.weekdays);
    return rows.filter(r => weekdaySet.has(codeFor(r.dateISO)));
  }, [criteria, filters, selectedRoutes]);

  const routeSeries = useMemo(() => {
    const keyFor = (route, airlineKey) => `${route.replace(/[^A-Za-z0-9]/g, '')}_${airlineKey}`;
    return selectedRoutes.flatMap((route, routeIndex) =>
      seriesMeta.map((s) => ({
        dataKey: keyFor(route, s.key),
        name: `${route} – ${s.name}`,
        route,
        airlineKey: s.key,
        routeColor: routeColorPalette[routeIndex % routeColorPalette.length],
        lineColor: mixColors(routeColorPalette[routeIndex % routeColorPalette.length], s.color, 0.45),
        dash: airlineDashByKey[s.key],
        routeIndex,
      }))
    );
  }, [selectedRoutes]);

  const [visibleRoutes, setVisibleRoutes] = useState(new Set(selectedRoutes));
  const [visibleAirlinesByRoute, setVisibleAirlinesByRoute] = useState(() => {
    const all = seriesMeta.map(s => s.key);
    const map = {};
    for (const r of selectedRoutes) map[r] = new Set(all);
    return map;
  });

  useEffect(() => {
    setVisibleRoutes(new Set(selectedRoutes));
    setVisibleAirlinesByRoute((prev) => {
      const all = seriesMeta.map(s => s.key);
      const next = {};
      for (const r of selectedRoutes) {
        if (prev[r]) {
          next[r] = new Set(prev[r]);
        } else {
          next[r] = new Set(all);
        }
      }
      return next;
    });
  }, [selectedRoutes]);

  const baseChartData = tab === 'distribution' ? multiChartData : displayData;

  const viewData = useMemo(() => {
    if (!zoomRange) return baseChartData;
    const start = Math.max(0, Math.min(zoomRange.start, zoomRange.end));
    const end = Math.min(baseChartData.length - 1, Math.max(zoomRange.start, zoomRange.end));
    return baseChartData.slice(start, end + 1);
  }, [baseChartData, zoomRange]);

  // If user selects multiple routes, auto-switch to Distribution to show multiple lines clearly
  useEffect(() => {
    if (selectedRoutes.length > 1 && tab !== 'distribution') {
      setTab('distribution');
    }
  }, [selectedRoutes, tab]);

  // Determine which series are currently visible (affects Y-axis auto domain)
  const activeDataKeys = useMemo(() => {
    if (tab === 'distribution') {
      return routeSeries
        .filter((sr) =>
          visibleRoutes.has(sr.route) &&
          (visibleAirlinesByRoute[sr.route]?.has(sr.airlineKey) ?? true) &&
          visibleCompetitors.has(sr.airlineKey)
        )
        .map((sr) => sr.dataKey);
    }
    if (tab === 'cheapest') return ['cheapest'];
    if (tab === 'average') return ['average'];
    return [];
  }, [tab, routeSeries, visibleRoutes, visibleAirlinesByRoute, visibleCompetitors]);

  // Compute Y-axis domain based on current view and visible series
  const yDomain = useMemo(() => {
    if (!viewData || viewData.length === 0 || activeDataKeys.length === 0) return ['auto', 'auto'];
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of viewData) {
      for (const key of activeDataKeys) {
        const v = row?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      }
    }
    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) return ['auto', 'auto'];
    if (minVal === maxVal) {
      // Add a small buffer when the range collapses to a single value
      const pad = Math.max(1, Math.round(maxVal * 0.05));
      return [Math.max(0, minVal - pad), maxVal + pad];
    }
    const pad = Math.max(1, Math.round((maxVal - minVal) * 0.06)); // ~6% padding
    return [Math.max(0, minVal - pad), maxVal + pad];
  }, [viewData, activeDataKeys]);

  // Events / Holidays: simple built-in set + Today marker
  const eventsByISO = useMemo(() => {
    const map = {};
    const now = new Date();
    const year = now.getFullYear();
    const years = [year, year + 1]; // include next year for forward ranges
    function add(iso, label) {
      map[iso] = map[iso] || [];
      map[iso].push(label);
    }
    // Today marker
    add(format(now, 'yyyy-MM-dd'), 'Today');
    // Common holidays (can be extended or wired to real calendar later)
    for (const y of years) {
      add(`${y}-01-01`, 'New Year’s Day');
      add(`${y}-05-01`, 'Labor Day');
      add(`${y}-09-02`, 'National Day');
    }
    return map;
  }, []);

  const visibleEvents = useMemo(() => {
    if (!viewData || viewData.length === 0) return [];
    const items = [];
    for (const r of viewData) {
      const labels = eventsByISO[r.dateISO];
      if (labels && labels.length > 0) {
        items.push({ xName: r.name, labels });
      }
    }
    // Avoid clutter: cap to first 8 events in view
    return items.slice(0, 8);
  }, [viewData, eventsByISO]);

  // Maps to help tooltip rendering
  const seriesMetaByKey = useMemo(() => {
    const map = {};
    for (const s of seriesMeta) map[s.key] = s;
    return map;
  }, []);
  const seriesMetaByDataKey = useMemo(() => {
    const m = new Map();
    for (const sr of routeSeries) m.set(sr.dataKey, sr);
    return m;
  }, [routeSeries]);

  // Custom tooltip for better readability
  function CustomTooltip({ active, label, payload }) {
    if (!active || !payload || payload.length === 0) return null;
    // Choose font size based on item count
    const totalItems = payload.filter(p => p && p.value != null && Number.isFinite(p.value)).length;
    const baseFont = totalItems > 14 ? 11 : totalItems > 8 ? 12 : 13;
    const headerFont = Math.max(baseFont, 13);
    const sectionTitleFont = baseFont;
    const rowFont = baseFont;

    if (tab !== 'distribution') {
      // Single metric view: cheapest or average
      const item = payload.find(p => p && p.value != null);
      if (!item) return null;
      const color = item.color || item.stroke || '#2563eb';
      const routeName = selectedRoutes[0];
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: headerFont }}>{label}</div>
          <div style={{ color: '#6b7280', marginBottom: 4, fontSize: sectionTitleFont }}>{routeName}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: rowFont }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 10, background: color }} />
              <span>{tab === 'cheapest' ? 'Cheapest' : 'Average'}</span>
            </span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(item.value)}</span>
          </div>
        </div>
      );
    }

    // Distribution: group by route, and show airline rows
    const groups = {};
    for (const p of payload) {
      if (!p || p.value == null || !Number.isFinite(p.value)) continue;
      const meta = seriesMetaByDataKey.get(p.dataKey);
      if (!meta) continue;
      const route = meta.route;
      const airlineKey = meta.airlineKey;
      const airlineName = seriesMetaByKey[airlineKey]?.name || airlineKey;
      const lineColor = meta.lineColor || p.color || p.stroke;
      if (!groups[route]) groups[route] = [];
      groups[route].push({
        airlineKey,
        airlineName,
        value: p.value,
        color: lineColor
      });
    }
    const routeOrder = selectedRoutes.filter(r => groups[r]);

    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxWidth: 360 }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: headerFont }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routeOrder.map((route) => (
            <div key={route} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ color: '#6b7280', fontSize: sectionTitleFont }}>{route}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {groups[route]
                  .sort((a, b) => a.airlineName.localeCompare(b.airlineName))
                  .map((it) => (
                    <div key={`${route}-${it.airlineKey}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: rowFont }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 10, background: it.color }} />
                        <span>{it.airlineName}</span>
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(it.value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tags = useMemo(() => {
    const t = [];
    const isDefaultStops = (() => {
      const def = new Set(defaultFilters.stops);
      const cur = new Set(filters.stops);
      if (def.size !== cur.size) return false;
      for (const s of def) { if (!cur.has(s)) return false; }
      return true;
    })();
    if (!isDefaultStops && (filters.stops?.length ?? 0) > 0) {
      t.push({ id: 'stops', label: `Stops: ${filters.stops.join(', ')}` });
    }
    if (filters.journeyHours !== 100) {
      t.push({ id: 'journey', label: `Journey ≤ ${filters.journeyHours}h` });
    }
    if (filters.weekdays.length !== 7) {
      t.push({ id: 'days', label: `Days: ${filters.weekdays.join(' ')}` });
    }
    if (filters.fareType !== 'Gross fare') {
      t.push({ id: 'fare', label: filters.fareType });
    }
    if ((filters.selectedFlights?.length ?? 0) > 0) {
      t.push({ id: 'flights', label: `Flights: ${filters.selectedFlights.length}` });
    }
    // Competitors active status pill (only when not all selected)
    const allCompetitorKeys = seriesMeta.map(s => s.key);
    if (visibleCompetitors.size !== allCompetitorKeys.length) {
      const keyToName = Object.fromEntries(seriesMeta.map(s => [s.key, s.name]));
      const selectedNames = allCompetitorKeys.filter(k => visibleCompetitors.has(k)).map(k => keyToName[k]);
      const maxShow = 3;
      const shown = selectedNames.slice(0, maxShow);
      const more = Math.max(0, selectedNames.length - shown.length);
      const label = selectedNames.length === 0
        ? 'Competitors: None'
        : `Competitors: ${shown.join(', ')}${more > 0 ? ` +${more} more` : ''}`;
      t.push({ id: 'competitors', label });
    }
    return t;
  }, [filters, visibleCompetitors]);

  function handleRemoveTag(id) {
    if (id === 'stops') setFilters((p) => ({ ...p, stops: ['0 Stop', '1 Stop'] }));
    if (id === 'journey') setFilters((p) => ({ ...p, journeyHours: 100 }));
    if (id === 'days') setFilters((p) => ({ ...p, weekdays: defaultFilters.weekdays }));
    if (id === 'fare') setFilters((p) => ({ ...p, fareType: 'Gross fare' }));
    if (id === 'flights') setFilters((p) => ({ ...p, selectedFlights: [] }));
    if (id === 'competitors') setVisibleCompetitors(new Set(seriesMeta.map(s => s.key)));
  }

  function handleApply(newFilters) {
    setFilters(newFilters);
    setDrawerOpen(false);
    setLoading(true);
  }

  function handleReset() {
    setFilters(defaultFilters);
    setLoading(true);
  }
  // Estimate load duration and craft positive message
  useEffect(() => {
    const startISO = criteria.departStart;
    const endISO = criteria.departEnd;
    let days = 14;
    try {
      const s = parseISO(startISO);
      const e = parseISO(endISO);
      days = Math.max(1, Math.min(60, differenceInCalendarDays(e, s) + 1));
    } catch {}
    const numRoutes = selectedRoutes.length;
    const base = 400;
    const perDay = 10;
    const perRoute = 180;
    const extra = tab === 'distribution' ? 220 : 0;
    const estMs = Math.min(2400, base + days * perDay + numRoutes * perRoute + extra);
    const messages = [
      'Crunching fare data…',
      'Finding the best time to fly…',
      'Surfacing the clearest trends…',
      'Scanning millions of prices…',
      'Uncovering market signals…',
    ];
    const friendly = messages[(days + numRoutes) % messages.length];
    const subtitle = numRoutes > 1
      ? `Comparing ${numRoutes} routes over ${days} days`
      : `Analyzing ${days} days of fares`;
    if (!loading) setLoading(true);
    setLoadingMsg(friendly);
    setLoadingSub(subtitle);
    const t = setTimeout(() => setLoading(false), estMs);
    return () => clearTimeout(t);
    // trigger on criteria/filters/routes/tab change
  }, [criteria, filters, selectedRoutes, tab]); 

  // Close competitor dropdown on outside click or ESC
  const competitorMenuRef = useRef(null);
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!competitorOpen) return;
      const el = competitorMenuRef.current;
      if (el && !el.contains(e.target)) setCompetitorOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setCompetitorOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [competitorOpen]);

  return (
    <div className="grid">
      <SearchCriteriaBar
        criteria={criteria}
        onChange={onCriteriaChange}
        availableShopDates={availableShopDates}
        onOpenFilters={() => setDrawerOpen(true)}
        stops={filters.stops}
        onStopsChange={(next) => setFilters((p) => ({ ...p, stops: next }))}
        filterTags={tags}
        onRemoveFilterTag={handleRemoveTag}
        onResetFilters={handleReset}
        loading={loading}
      />
      <div className="card trends-card">
        <div className="card-header">
          <div className="pill-tabs" role="tablist" aria-label="Fare Trends">
            <span className="pill-tabs-label">Fare Trends</span>
            <span className="pill-tabs-sep" />
            <button className={`pill-tab ${tab === 'cheapest' ? 'active' : ''}`} onClick={() => setTab('cheapest')} role="tab" aria-selected={tab === 'cheapest'} title="Cheapest">
              Cheapest
            </button>
            <button className={`pill-tab ${tab === 'average' ? 'active' : ''}`} onClick={() => setTab('average')} role="tab" aria-selected={tab === 'average'} title="Average">
              Average
            </button>
            <button className={`pill-tab ${tab === 'distribution' ? 'active' : ''}`} onClick={() => setTab('distribution')} role="tab" aria-selected={tab === 'distribution'} title="Fare Distribution">
              Fare Distribution
            </button>
          </div>
          <div className="spacer" />
          {tab === 'distribution' && (
            <div className="inline-select" style={{ position: 'relative' }} ref={competitorMenuRef}>
              <button className="inline-select-button" type="button" onClick={() => setCompetitorOpen(v => !v)}>
                <span className="inline-select-label">Competitors</span>
                <span className="inline-select-value">
                  {visibleCompetitors.size === seriesMeta.length ? 'All' : `${visibleCompetitors.size} selected`}
                </span>
                <span className="inline-select-caret">▾</span>
              </button>
              {competitorOpen && (
                <div className="inline-select-menu" role="menu" style={{ minWidth: 260, right: 0, left: 'auto', fontSize: 12, lineHeight: 1.25 }}>
                  <div
                    className="inline-select-item"
                    onClick={() => setVisibleCompetitors(new Set(seriesMeta.map(s => s.key)))}
                    style={{ padding: '6px 10px' }}
                  >
                    Select All
                  </div>
                  <div
                    className="inline-select-item"
                    onClick={() => setVisibleCompetitors(new Set())}
                    style={{ padding: '6px 10px' }}
                  >
                    Select None
                  </div>
                  {seriesMeta.map((s) => {
                    const checked = visibleCompetitors.has(s.key);
                    return (
                      <div
                        key={`comp-${s.key}`}
                        className="inline-select-item"
                        onClick={() => {
                          setVisibleCompetitors((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.key)) next.delete(s.key); else next.add(s.key);
                            return next;
                          });
                        }}
                        title={s.name}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 10, background: s.color }} />
                          <span>{s.name}</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.key === myAirline && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 999,
                                border: '1px solid #3b82f6',
                                color: '#1d4ed8',
                                background: 'rgba(59, 130, 246, 0.10)'
                              }}
                            >
                              Mine
                            </span>
                          )}
                          {checked && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 999,
                                border: '1px solid #10b981',
                                color: '#047857',
                                background: 'rgba(16, 185, 129, 0.12)'
                              }}
                            >
                              Active
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {zoomRange && (
            <button className="btn" type="button" onClick={() => setZoomRange(null)} title="Reset zoom" style={{ marginLeft: 10 }}>
              Reset Zoom
            </button>
          )}
        </div>
        <div className="hstack" style={{ marginTop: 8, gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={() => setDrawerOpen(true)} title="More filters">More filters</button>
          {tags && tags.length > 0 && (
            <>
              <div className="filter-tags">
                {tags.map((t) => (
                  <span key={t.id} className="tag">
                    {t.label}
                    <button className="tag-remove" onClick={() => handleRemoveTag(t.id)} aria-label={`Remove ${t.label}`}>×</button>
                  </span>
                ))}
              </div>
              <button className="btn" type="button" onClick={handleReset} title="Clear filters">Clear</button>
            </>
          )}
        </div>
        {loading && (
          <div style={{ marginBottom: 12 }}>
            <LoadingBanner message={loadingMsg} subtext={loadingSub} />
          </div>
        )}

        {/* legends moved below chart */}

        <div className="trends-chart" style={{ marginTop: 24 }} aria-busy={loading ? 'true' : 'false'}>
          {loading ? (
            <ChartSkeleton />
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={viewData}
              margin={{ top: 12, right: 12, left: 6, bottom: 24 }}
              onMouseDown={(e) => {
                if (e && e.activeTooltipIndex != null) {
                  setSelectRange({ start: e.activeTooltipIndex, end: e.activeTooltipIndex });
                }
              }}
              onMouseMove={(e) => {
                if (!selectRange) return;
                if (e && e.activeTooltipIndex != null) {
                  setSelectRange((p) => p ? { ...p, end: e.activeTooltipIndex } : null);
                }
              }}
              onMouseUp={() => {
                if (!selectRange) return;
                const s = Math.min(selectRange.start, selectRange.end);
                const eIdx = Math.max(selectRange.start, selectRange.end);
                if (eIdx !== s) {
                  // Map indices back to full chart indices
                  const baseStartIndex = zoomRange ? Math.min(zoomRange.start, zoomRange.end) : 0;
                  setZoomRange({ start: baseStartIndex + s, end: baseStartIndex + eIdx });
                }
                setSelectRange(null);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} label={{ value: 'Departure Days', position: 'insideBottom', offset: -8, style: { fontSize: 12 } }} />
              <YAxis domain={yDomain} tickFormatter={formatCurrency} width={88} tick={{ fontSize: 12 }} />
              <Tooltip content={(props) => <CustomTooltip {...props} />} />
              {visibleEvents.map((ev) => {
                const title = ev.labels.length > 1 ? `${ev.labels[0]} +${ev.labels.length - 1} more` : ev.labels[0];
                const isToday = ev.labels.includes('Today');
                return (
                  <ReferenceLine
                    key={`evt-${ev.xName}-${title}`}
                    x={ev.xName}
                    stroke={isToday ? '#6366f1' : '#f59e0b'}
                    strokeDasharray={isToday ? '4 2' : '3 3'}
                    label={{ value: title, position: 'top', fill: '#6b7280', fontSize: 10 }}
                  />
                );
              })}
              {tab === 'distribution' ? (
                <>
                  {routeSeries
                    .filter((sr) => visibleRoutes.has(sr.route)
                      && (visibleAirlinesByRoute[sr.route]?.has(sr.airlineKey) ?? true)
                      && visibleCompetitors.has(sr.airlineKey)
                    )
                    .map((sr) => (
                      <Line
                        key={sr.dataKey}
                        type="monotone"
                        dataKey={sr.dataKey}
                        name={sr.name}
                        stroke={sr.lineColor}
                        strokeWidth={sr.airlineKey === myAirline ? 3 : 2.2}
                        strokeDasharray={sr.dash}
                        strokeOpacity={1}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                </>
              ) : tab === 'cheapest' ? (
                <Line
                  type="monotone"
                  dataKey="cheapest"
                  name="Cheapest"
                  stroke="#10b981"
                  strokeWidth={2.8}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Average"
                  stroke="#2563eb"
                  strokeWidth={2.8}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {selectRange != null && (
                <ReferenceArea
                  x1={viewData[Math.min(selectRange.start, selectRange.end)]?.name}
                  x2={viewData[Math.max(selectRange.start, selectRange.end)]?.name}
                  strokeOpacity={0.3}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
        {/* legends below chart */}
        <div className="hstack" style={{ marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
          <div className="pill-tabs small" aria-label="Routes">
            <span className="pill-tabs-label">Routes</span>
            <span className="pill-tabs-sep" />
            {selectedRoutes.map((r) => {
              const active = visibleRoutes.has(r);
              const routeIndex = selectedRoutes.indexOf(r);
              const color = routeColorPalette[routeIndex % routeColorPalette.length];
              return (
                <button
                  key={r}
                  className="pill-tab"
                  onClick={() => {
                    setVisibleRoutes((prev) => {
                      const next = new Set(prev);
                      if (next.has(r)) next.delete(r); else next.add(r);
                      return next;
                    });
                  }}
                  title={r}
                  style={{
                    border: `1px solid ${color}`,
                    color,
                    background: active ? hexToRgba(color, 0.1) : '#ffffff'
                  }}
                >
                  <span className="color-dot" style={{ background: color }} /> {r}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hstack" style={{ marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            {selectedRoutes.map((r) => (
              <div key={r} className="pill-tabs small airlines" aria-label={`Flights for ${r}`}>
                <span className="pill-tabs-label">{r}</span>
                <span className="pill-tabs-sep" />
                {seriesMeta.filter((s) => visibleCompetitors.has(s.key)).map((s) => {
                  const active = visibleRoutes.has(r) && (visibleAirlinesByRoute[r]?.has(s.key) ?? true);
                  const routeIndex = selectedRoutes.indexOf(r);
                  const routeColor = routeColorPalette[routeIndex % routeColorPalette.length];
                  const airlineColor = mixColors(routeColor, s.color, 0.45);
                  return (
                    <button
                      key={`${r}-${s.key}`}
                      className="pill-tab"
                      onClick={() => {
                        setVisibleAirlinesByRoute((prev) => {
                          const next = { ...prev };
                          const set = new Set(prev[r] ?? seriesMeta.map(x => x.key));
                          if (set.has(s.key)) set.delete(s.key); else set.add(s.key);
                          next[r] = set;
                          return next;
                        });
                      }}
                      title={`${r} – ${s.name}`}
                      style={{
                        border: `1px solid ${airlineColor}`,
                        color: airlineColor,
                        background: active ? hexToRgba(airlineColor, 0.10) : '#ffffff'
                      }}
                    >
                      {s.key === myAirline ? '★ ' : ''}{s.name}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
      <FiltersDrawer
        open={drawerOpen}
        initialFilters={filters}
        onClose={() => setDrawerOpen(false)}
        onApply={handleApply}
      />
    </div>
  );
}


