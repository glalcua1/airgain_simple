import React from 'react';

export default function LoadingBanner({ message = 'Loading fresh fare insights…', subtext }) {
  return (
    <div className="loading-banner" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div className="loading-banner-texts">
        <div className="loading-banner-title">{message}</div>
        {subtext ? <div className="loading-banner-sub">{subtext}</div> : null}
      </div>
      <div className="spacer" />
      <div className="loading-progress" aria-hidden="true">
        <div className="loading-progress-bar" />
      </div>
    </div>
  );
}


