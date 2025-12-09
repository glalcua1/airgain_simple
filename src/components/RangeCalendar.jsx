import React, { useMemo, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  addDays,
} from 'date-fns';

export default function RangeCalendar({ start, end, onChange, onDone }) {
  const [month, setMonth] = useState(start || new Date());
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  const weeks = useMemo(() => {
    const mStart = startOfMonth(month);
    const gridStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const mEnd = endOfMonth(month);
    const gridEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
    const rows = [];
    let day = gridStart;
    while (day <= gridEnd) {
      const row = [];
      for (let i = 0; i < 7; i++) {
        row.push(day);
        day = addDays(day, 1);
      }
      rows.push(row);
    }
    return rows;
  }, [month]);

  function onSelectDate(d) {
    if (!startDate || (startDate && endDate)) {
      onChange({ start: d, end: null });
      return;
    }
    if (isBefore(d, startDate)) {
      onChange({ start: d, end: startDate });
      return;
    }
    onChange({ start: startDate, end: d });
  }

  function cellClasses(d) {
    const inMonth = isSameMonth(d, month);
    const isStart = startDate && isSameDay(d, startDate);
    const isEnd = endDate && isSameDay(d, endDate);
    const inRange =
      startDate && endDate && isWithinInterval(d, { start: startDate, end: endDate });
    const classes = ['day-cell'];
    if (!inMonth) classes.push('day-muted');
    if (isStart || isEnd) classes.push('day-today');
    if (inRange && !isStart && !isEnd) classes.push('day-hover');
    return classes.join(' ');
  }

  return (
    <div className="calendar" role="dialog" aria-label="Select date range">
      <div className="hstack">
        <button className="btn" type="button" onClick={() => setMonth(addMonths(month, -1))} aria-label="Prev month">‹</button>
        <div className="spacer" />
        <div style={{ fontWeight: 800 }}>{format(month, 'MMMM yyyy')}</div>
        <div className="spacer" />
        <button className="btn" type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">›</button>
      </div>
      <div className="calendar-grid" style={{ marginTop: 8 }}>
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
          <div key={d} className="muted" style={{ textAlign: 'center', fontSize: 12 }}>{d}</div>
        ))}
        {weeks.flat().map((d) => (
          <button
            key={d.toISOString()}
            type="button"
            className={cellClasses(d)}
            onClick={() => onSelectDate(d)}
            title={format(d, 'EEE, dd MMM yyyy')}
            style={{ minHeight: 64 }}
          >
            <div className="day-header">
              <span>{format(d, 'd')}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="hstack" style={{ marginTop: 10 }}>
        <div className="muted">
          {startDate ? format(startDate, 'dd MMM yyyy') : '—'} {startDate || endDate ? 'to' : ''} {endDate ? format(endDate, 'dd MMM yyyy') : ''}
        </div>
        <div className="spacer" />
        <button className="btn" type="button" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}


