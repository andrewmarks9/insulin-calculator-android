import React from 'react';
import { formatNumber } from './utils/calculator';
import { PermissionState, isNativePlatform } from './utils/permissions';

export function HistoryTab({
  history,
  filteredHistory,
  dateRange,
  onDateRangeChange,
  isExporting,
  appStatus,
  permissionStatus,
  onExport,
  onClear,
  onRequestPermission
}) {
  return (
    <div className="history-view">
      {isNativePlatform() && permissionStatus !== PermissionState.GRANTED && (
        <div className="permission-banner">
          <div className="permission-info">
            <strong>📁 Storage Permission Required</strong>
            <p>Allow file access to export your history as PDF</p>
          </div>
          <button className="secondary-btn small" onClick={onRequestPermission}>
            Grant Permission
          </button>
        </div>
      )}

      <div className="date-range-filter">
        <label id="history-date-range-label">Show data for:</label>
        <div className="range-buttons" role="group" aria-labelledby="history-date-range-label">
          {[3, 7, 14, 30, 90].map(days => (
            <button
              key={days}
              className={`range-btn ${dateRange === days ? 'active' : ''}`}
              onClick={() => onDateRangeChange(days)}
              aria-pressed={dateRange === days}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      <div className="history-actions">
        <button
          className="secondary-btn"
          onClick={onExport}
          disabled={isExporting || filteredHistory.length === 0}
        >
          {isExporting ? 'Exporting...' : `Export last ${dateRange} days`}
        </button>
        <button
          className="text-btn danger"
          onClick={onClear}
          disabled={history.length === 0}
        >
          Clear
        </button>
      </div>

      {appStatus && (
        <div
          className={`export-status ${appStatus.type}`}
          role={appStatus.type === 'error' ? 'alert' : 'status'}
          aria-live={appStatus.type === 'error' ? 'assertive' : 'polite'}
        >
          {appStatus.type === 'success' ? '✓ ' : '⚠ '}
          {appStatus.message}
        </div>
      )}

      {history.length === 0 ? (
        <p className="empty-history">No history yet.</p>
      ) : filteredHistory.length === 0 ? (
        <p className="empty-history">No entries in the last {dateRange} days.</p>
      ) : (
        Object.entries(
          filteredHistory.reduce((groups, item) => {
            const date = new Date(item.timestamp).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
            return groups;
          }, {})
        ).map(([date, items]) => (
          <div key={date} className="history-group">
            <h3 className="history-date-header">{date}</h3>
            <ul className="history-list">
              {items.map(item => (
                <li key={item.id} className="history-item">
                  <div className="history-time">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="history-details">
                    <strong>{formatNumber(item.result.totalDose)} u</strong>
                    <span>BG: {item.inputs.currentBG}</span>
                    <span>Carbs: {item.inputs.carbs}g {item.inputs.foodName ? `(${item.inputs.foodName})` : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
