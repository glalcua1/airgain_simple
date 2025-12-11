import React from 'react';
import { addDays, format, parseISO } from 'date-fns';
import RangeCalendar from './RangeCalendar.jsx';

function Field({ label, children }) {
  return (
    <div className="inline-select">
      <div className="inline-select-button" style={{ gap: 10 }}>
        {label ? <span className="inline-select-label">{label}</span> : null}
        {children}
      </div>
    </div>
  );
}

export default function SearchCriteriaBar({
  criteria,
  onChange,
  availableShopDates = [],
  onOpenFilters,
  stops = [],
  onStopsChange,
  filterTags = [],
  onRemoveFilterTag,
  onResetFilters,
  loading = false,
}) {
  const routes = ['BKK-HAN', 'BOM-HND', 'DEL-NRT', 'DMK-HAN', 'HAN-BKK'];
  const cabins = ['Economy', 'Premium', 'Business'];
  const trips = ['OW', 'RT'];
  const [depOpen, setDepOpen] = React.useState(false);
  const [depPresetOpen, setDepPresetOpen] = React.useState(false);
  const [shopOpen, setShopOpen] = React.useState(false);
  const [cabinOpen, setCabinOpen] = React.useState(false);
  const [fareOpen, setFareOpen] = React.useState(false);
  const [routeOpen, setRouteOpen] = React.useState(false);
  const [tripOpen, setTripOpen] = React.useState(false);
  const [stopsOpen, setStopsOpen] = React.useState(false);
  const [customRange, setCustomRange] = React.useState({
    start: criteria.departStart ? parseISO(criteria.departStart) : null,
    end: criteria.departEnd ? parseISO(criteria.departEnd) : null,
  });

  function closeAllDropdowns() {
    setShopOpen(false);
    setCabinOpen(false);
    setFareOpen(false);
    setRouteOpen(false);
    setDepPresetOpen(false);
    setDepOpen(false);
    setTripOpen(false);
    setStopsOpen(false);
  }

  function applyPreset(days) {
    const start = new Date();
    const end = addDays(start, days - 1);
    onChange({
      departStart: format(start, 'yyyy-MM-dd'),
      departEnd: format(end, 'yyyy-MM-dd'),
    });
  }

  function toggleRoute(r) {
    const current = Array.isArray(criteria.routes) ? criteria.routes : (criteria.route ? [criteria.route] : []);
    const has = current.includes(r);
    const next = has ? current.filter(x => x !== r) : [...current, r];
    onChange({ routes: next });
  }

  function selectedRoutesLabel() {
    const sel = Array.isArray(criteria.routes) ? criteria.routes : (criteria.route ? [criteria.route] : []);
    if (sel.length === 0) return 'Select…';
    if (sel.length === 1) return sel[0];
    return `${sel.length} routes`;
  }

  function stopsLabel() {
    const all = ['0 Stop', '1 Stop', '1+ Stop'];
    if (!stops || stops.length === 0) return 'None';
    if (stops.length === all.length) return 'Any';
    return stops.join(', ');
  }

  function currentRangeLabel() {
    const start = parseISO(criteria.departStart);
    const end = parseISO(criteria.departEnd);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diff === 14) return 'Next 14 Days';
    if (diff === 30) return 'Next 30 Days';
    if (diff === 60) return 'Next 60 Days';
    return `${format(start, 'dd MMM yy')} – ${format(end, 'dd MMM yy')}`;
  }

  return (
    <div className="criteria-bar">
      <div className="criteria-grid">
        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${shopOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !shopOpen;
              closeAllDropdowns();
              if (next) setShopOpen(true);
            }}
          >
            <span className="inline-select-label">Shop</span>
            <span className="inline-select-value">{format(parseISO(criteria.shopDate), 'dd MMM yy')}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {shopOpen && (
            <div className="inline-select-menu" role="menu" style={{ minWidth: 220 }}>
              {availableShopDates.length === 0 && <div className="inline-select-item muted">No snapshots</div>}
              {availableShopDates.map((d) => (
                <div
                  key={d}
                  className={`inline-select-item${criteria.shopDate === d ? ' selected' : ''}`}
                  onClick={() => { onChange({ shopDate: d }); setShopOpen(false); }}
                >
                  {format(parseISO(d), 'dd MMM yyyy')}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${cabinOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !cabinOpen;
              closeAllDropdowns();
              if (next) setCabinOpen(true);
            }}
          >
            <span className="inline-select-label">Cabin</span>
            <span className="inline-select-value">{criteria.cabin}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {cabinOpen && (
            <div className="inline-select-menu" role="menu">
              {cabins.map((c) => (
                <div
                  key={c}
                  className={`inline-select-item${criteria.cabin === c ? ' selected' : ''}`}
                  onClick={() => { onChange({ cabin: c }); setCabinOpen(false); }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${fareOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !fareOpen;
              closeAllDropdowns();
              if (next) setFareOpen(true);
            }}
          >
            <span className="inline-select-label">Fare</span>
            <span className="inline-select-value">{criteria.fareView}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {fareOpen && (
            <div className="inline-select-menu" role="menu">
              {['By Channel', 'By Fare Type'].map((opt) => (
                <div
                  key={opt}
                  className={`inline-select-item${criteria.fareView === opt ? ' selected' : ''}`}
                  onClick={() => { onChange({ fareView: opt }); setFareOpen(false); }}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${routeOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !routeOpen;
              closeAllDropdowns();
              if (next) setRouteOpen(true);
            }}
          >
            <span className="inline-select-label">Route</span>
            <span className="inline-select-value">{selectedRoutesLabel()}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {routeOpen && (
            <div className="inline-select-menu" role="menu" style={{ minWidth: 220 }}>
              {routes.map((r) => {
                const sel = Array.isArray(criteria.routes) ? criteria.routes : (criteria.route ? [criteria.route] : []);
                const isSelected = sel.includes(r);
                return (
                  <div
                    key={r}
                    className="inline-select-item"
                    onClick={() => toggleRoute(r)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input type="checkbox" readOnly checked={isSelected} />
                    <span>{r}</span>
                  </div>
                );
              })}
              <div className="inline-select-item" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" type="button" onClick={() => setRouteOpen(false)}>Done</button>
              </div>
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${stopsOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !stopsOpen;
              closeAllDropdowns();
              if (next) setStopsOpen(true);
            }}
          >
            <span className="inline-select-label">Stops</span>
            <span className="inline-select-value">{stopsLabel()}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {stopsOpen && (
            <div className="inline-select-menu" role="menu" style={{ minWidth: 220 }}>
              {['0 Stop', '1 Stop', '1+ Stop'].map((s) => {
                const isSelected = (stops ?? []).includes(s);
                return (
                  <div
                    key={s}
                    className="inline-select-item"
                    onClick={() => {
                      if (!onStopsChange) return;
                      const set = new Set(stops ?? []);
                      if (set.has(s)) set.delete(s); else set.add(s);
                      onStopsChange(Array.from(set));
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <input type="checkbox" readOnly checked={isSelected} />
                    <span>{s}</span>
                  </div>
                );
              })}
              <div className="inline-select-item" onClick={() => onStopsChange?.(['0 Stop', '1 Stop', '1+ Stop'])}>Select All</div>
              <div className="inline-select-item" onClick={() => onStopsChange?.([])}>Clear</div>
              <div className="inline-select-item" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" type="button" onClick={() => setStopsOpen(false)}>Done</button>
              </div>
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${depPresetOpen || depOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !(depPresetOpen || depOpen);
              closeAllDropdowns();
              if (next) setDepPresetOpen(true);
            }}
          >
            <span className="inline-select-label">Departure</span>
            <span className="inline-select-value">{currentRangeLabel()}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {depPresetOpen && (
            <div className="inline-select-menu" role="menu" style={{ minWidth: 260 }}>
              <div className="inline-select-item" onClick={() => { applyPreset(14); setDepPresetOpen(false); }}>Next 14 Days</div>
              <div className="inline-select-item" onClick={() => { applyPreset(30); setDepPresetOpen(false); }}>Next 30 Days</div>
              <div className="inline-select-item" onClick={() => { applyPreset(60); setDepPresetOpen(false); }}>Next 60 Days</div>
              <div className="inline-select-item" onClick={() => { setDepPresetOpen(false); setDepOpen(true); }}>Custom…</div>
            </div>
          )}
          {depOpen && (
            <div className="date-range-panel" style={{ position: 'absolute', zIndex: 35 }}>
              <RangeCalendar
                start={customRange.start}
                end={customRange.end}
                onChange={(r) => setCustomRange(r)}
                onDone={() => {
                  if (customRange.start && customRange.end) {
                    onChange({
                      departStart: format(customRange.start, 'yyyy-MM-dd'),
                      departEnd: format(customRange.end, 'yyyy-MM-dd'),
                    });
                  }
                  setDepOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="inline-select" style={{ position: 'relative' }}>
          <button
            className={`inline-select-button${tripOpen ? ' open' : ''}`}
            type="button"
            onClick={() => {
              const next = !tripOpen;
              closeAllDropdowns();
              if (next) setTripOpen(true);
            }}
          >
            <span className="inline-select-label">Trip</span>
            <span className="inline-select-value">{criteria.trip}</span>
            <span className="inline-select-caret">▾</span>
          </button>
          {tripOpen && (
            <div className="inline-select-menu" role="menu">
              {trips.map((t) => (
                <div
                  key={t}
                  className={`inline-select-item${criteria.trip === t ? ' selected' : ''}`}
                  onClick={() => { onChange({ trip: t }); setTripOpen(false); }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="criteria-right">
          {loading && (
            <span className="pill-label" aria-live="polite" style={{ gap: 8 }}>
              <span className="spinner small" aria-hidden="true" />
              Refreshing…
            </span>
          )}
          <button className="btn" type="button" title="Save Market">Save Market</button>
        </div>
      </div>
    </div>
  );
}
