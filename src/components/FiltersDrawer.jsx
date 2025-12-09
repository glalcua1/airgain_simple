import React, { useMemo, useState } from 'react';

function Section({ title, children, right }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="hstack" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div className="spacer" />
        {right}
      </div>
      {children}
    </div>
  );
}

function Weekday({ day, selected, onToggle }) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'active' : ''}`}
      onClick={() => onToggle(day)}
      aria-pressed={selected}
      title={day}
    >
      {day}
    </button>
  );
}

export default function FiltersDrawer({
  open,
  initialFilters,
  onClose,
  onApply,
}) {
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const [airlineOpen, setAirlineOpen] = useState({ vna: true, vj: false, tg: false });

  React.useEffect(() => {
    if (open) {
      setLocalFilters(initialFilters);
    }
  }, [open, initialFilters]);

  const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const selectedFlightsCount = useMemo(() => {
    return localFilters.selectedFlights?.length ?? 0;
  }, [localFilters.selectedFlights]);

  function toggleDay(day) {
    setLocalFilters((prev) => {
      const set = new Set(prev.weekdays);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, weekdays: Array.from(set) };
    });
  }

  function toggleFlight(code) {
    setLocalFilters((prev) => {
      const set = new Set(prev.selectedFlights);
      if (set.has(code)) set.delete(code);
      else set.add(code);
      return { ...prev, selectedFlights: Array.from(set) };
    });
  }

  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} aria-label="Close filters overlay" />}
      <aside className={`drawer-panel ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Filters">
        <div className="hstack" style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800 }}>Filters</div>
          <div className="spacer" />
          <button className="btn" type="button" onClick={onClose} title="Close">✕</button>
        </div>

      <div className="drawer-content" style={{ display: 'grid', gap: 12 }}>
          <Section title="Journey Duration - OB" right={<div className="muted">{localFilters.journeyHours} hrs</div>}>
            <input
              type="range"
              min={0}
              max={100}
              value={localFilters.journeyHours}
              className="slider"
              onChange={(e) => setLocalFilters((p) => ({ ...p, journeyHours: Number(e.target.value) }))}
              aria-label="Journey duration hours"
              style={{ width: '100%' }}
            />
          </Section>

          <Section title="Week Days" right={<div className="muted">{localFilters.weekdays.length} Days</div>}>
            <div className="chips">
              {allDays.map((d) => (
                <Weekday key={d} day={d} selected={localFilters.weekdays.includes(d)} onToggle={toggleDay} />
              ))}
            </div>
          </Section>

          <Section
            title="Choose Flight"
            right={<div className="muted">{selectedFlightsCount ? `${selectedFlightsCount} Selected` : 'All Flights'}</div>}
          >
            <div className="flight-select">
              {/* Vietnam Airlines */}
              <button
                className="flight-group"
                type="button"
                onClick={() => setAirlineOpen((p) => ({ ...p, vna: !p.vna }))}
                aria-expanded={!!airlineOpen.vna}
              >
                <div style={{ fontWeight: 700 }}>Vietnam Airlines</div>
                <div className="spacer" />
                <span>{airlineOpen.vna ? '▾' : '▸'}</span>
              </button>
              {airlineOpen.vna && (
                <div className="flight-list">
                  {['VN-612', 'VN-614', 'VN-620'].map((code) => (
                    <label key={code} className="flight-item">
                      <input
                        type="checkbox"
                        checked={localFilters.selectedFlights.includes(code)}
                        onChange={() => toggleFlight(code)}
                      />
                      <span>{code}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* VietJet */}
              <button
                className="flight-group"
                type="button"
                onClick={() => setAirlineOpen((p) => ({ ...p, vj: !p.vj }))}
                aria-expanded={!!airlineOpen.vj}
              >
                <div style={{ fontWeight: 700 }}>VietJet Air</div>
                <div className="spacer" />
                <span>{airlineOpen.vj ? '▾' : '▸'}</span>
              </button>
              {airlineOpen.vj && (
                <div className="flight-list">
                  {['VJ-802', 'VJ-804'].map((code) => (
                    <label key={code} className="flight-item">
                      <input
                        type="checkbox"
                        checked={localFilters.selectedFlights.includes(code)}
                        onChange={() => toggleFlight(code)}
                      />
                      <span>{code}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Thai Airways sample */}
              <button
                className="flight-group"
                type="button"
                onClick={() => setAirlineOpen((p) => ({ ...p, tg: !p.tg }))}
                aria-expanded={!!airlineOpen.tg}
              >
                <div style={{ fontWeight: 700 }}>Thai Airways</div>
                <div className="spacer" />
                <span>{airlineOpen.tg ? '▾' : '▸'}</span>
              </button>
              {airlineOpen.tg && (
                <div className="flight-list">
                  {['TG-0560', 'TG-0564'].map((code) => (
                    <label key={code} className="flight-item">
                      <input
                        type="checkbox"
                        checked={localFilters.selectedFlights.includes(code)}
                        onChange={() => toggleFlight(code)}
                      />
                      <span>{code}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Fare Segmentation">
            <div className="stack" style={{ gap: 10 }}>
              {['Gross fare', 'Base fare', 'YQ/YR'].map((opt) => (
                <label key={opt} className="radio-row">
                  <input
                    type="radio"
                    name="fare-type"
                    checked={localFilters.fareType === opt}
                    onChange={() => setLocalFilters((p) => ({ ...p, fareType: opt }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Section>
        </div>

        <div className="hstack" style={{ marginTop: 16 }}>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <div className="spacer" />
          <button
            className="btn primary"
            type="button"
            onClick={() => onApply(localFilters)}
          >
            Apply Filter
          </button>
        </div>
      </aside>
    </>
  );
}


