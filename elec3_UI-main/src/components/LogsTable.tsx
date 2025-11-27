import React from 'react';

export default function LogsTable(props: {
    logs: { id: string; tag: string; status: 0 | 1; time: string; statusLabel?: string }[];
}) {
    const { logs } = props;

    return (
        <main className="logs-panel" aria-label="RFID logs">
            <div className="logs-header">
                <div className="logs-title-wrap">
                    <h2 className="logs-title">RFID Logs</h2>
                    {/* Search input removed per request */}
                </div>
                {/* Clear button removed per request */}
            </div>

            <div className="logs-table" role="table" aria-label="Logs table">
                <div className="logs-row logs-row-header" role="row">
                    <div className="col idx">#</div>
                    <div className="col tag">RFID</div>
                    <div className="col status">Status</div>
                    <div className="col time">Date &amp; Time</div>
                </div>

                {logs.length === 0 && <div className="logs-empty">No logs yet</div>}

                {logs.map((l, i) => {
                    const statusText = l.statusLabel === 'NOT FOUND' ? 'RFID NOT FOUND' : String(l.status);
                    const statusClass = statusText === 'RFID NOT FOUND' ? 'nf' : (l.status === 1 ? 'on' : 'off');

                    return (
                        <div key={l.id} className="logs-row" role="row">
                            <div className="col idx">{i + 1}</div>
                            <div className="col tag">{l.tag}</div>
                            <div className="col status">
                                <span className={`status-chip ${statusClass}`}>{statusText}</span>
                            </div>
                            <div className="col time">{new Date(l.time).toLocaleString()}</div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
