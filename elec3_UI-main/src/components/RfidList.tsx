import React from 'react';

type Rfid = {
    id: string;
    tag: string;
    status: 0 | 1;
    lastSeen?: string;
};

export default function RfidList(props: {
    rfids: Rfid[];
    onToggle: (id: string) => void;
}) {
    const { rfids, onToggle } = props;

    return (
        <section className="rfid-section">
            {/* Add form removed per request */}

            <div className="rfid-list">
                {rfids.length === 0 && <div className="empty">No RFIDs registered</div>}
                {rfids.map(r => (
                    <article key={r.id} className="rfid-card">
                        <div className="rfid-main">
                            <div className="rfid-tag">{r.tag}</div>
                            <div className="rfid-last">{r.lastSeen ? new Date(r.lastSeen).toLocaleString() : '—'}</div>
                        </div>
                        <div className="rfid-actions">
                            <label className="toggle" aria-disabled="true">
                                <input
                                    type="checkbox"
                                    checked={r.status === 1}
                                    disabled
                                    tabIndex={-1}
                                    readOnly
                                    aria-label={`Toggle status for ${r.tag}`}
                                    className="toggle-input--no-pointer"
                                    // prevent mouse/keyboard toggles while keeping controlled checked state
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onKeyDown={(e) => { e.preventDefault(); }}
                                    onChange={() => { /* no-op to silence React controlled-input warning */ }}
                                />
                                <span className="slider" />
                            </label>
                            <div className="status-text">{r.status === 1 ? '1' : '0'}</div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
