import React from 'react';
import Skeleton from './Skeleton.jsx';

export default function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="chart-skeleton-header">
        <Skeleton className="sk-chip" style={{ width: 90, height: 16 }} />
        <Skeleton className="sk-chip" style={{ width: 70, height: 16 }} />
        <Skeleton className="sk-chip" style={{ width: 110, height: 16 }} />
      </div>
      <div className="chart-skeleton-body">
        <div className="y-axis">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ width: 54, height: 12, marginBottom: 18 }} />
          ))}
        </div>
        <div className="plot">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="plot-row">
              <Skeleton className="grid-line" />
              <div className="lines">
                <Skeleton className="line l1" />
                <Skeleton className="line l2" />
                <Skeleton className="line l3" />
              </div>
            </div>
          ))}
          <div className="x-axis">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ width: 40, height: 12 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


