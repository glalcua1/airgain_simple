import React from 'react';

export default function FiltersBar({ onOpen, tags = [], onRemoveTag, onReset }) {
  return (
    <div className="filters-bar">
      <div className="filters-grid">
        <button className="btn" type="button" title="Filters" onClick={onOpen}>
          <span style={{ marginRight: 6 }}>☰</span> Filters
        </button>
        <div className="filter-tags">
          {tags.length === 0 ? (
            <span className="muted">No filters applied</span>
          ) : (
            tags.map((t) => (
              <span key={t.id} className="tag">
                {t.label}
                <button className="tag-remove" onClick={() => onRemoveTag?.(t.id)} aria-label={`Remove ${t.label}`}>×</button>
              </span>
            ))
          )}
        </div>
        <span className="spacer" />
        <button className="btn" type="button" title="Reset" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

