import React from 'react';

type Rfid = {
    id: string;
    tag: string;
    status: 0 | 1;
    lastSeen?: string;
    animate?: boolean;
    createdAt?: string;
};

export default function RfidSidebar(props: {
    rfids: Rfid[];
    onToggle: (id: string) => void;
}) {
    const { rfids, onToggle } = props;

    function RfidCard({ rfid, onToggle }: { rfid: Rfid; onToggle: (id: string) => void }) {
        const statusClass =
            rfid.lastSeen === 'RFID not found'
                ? 'status-not-found'
                : rfid.status === 1
                ? 'status-active'
                : 'status-inactive';

        return (
            <div
                className={`rfid-card ${rfid.animate ? 'animate' : ''}`}
                onClick={() => onToggle(rfid.id)}
            >
                <div className={`status-indicator ${statusClass}`} />
                <h3 className="rfid-tag">{rfid.tag}</h3>
                <div className="rfid-info">
                    <div>Status: {rfid.status === 1 ? 'Active' : 'Inactive'}</div>
                    {rfid.createdAt && (
                        <div>Created: {new Date(rfid.createdAt).toLocaleString()}</div>
                    )}
                    {rfid.lastSeen && <div>Last seen: {rfid.lastSeen}</div>}
                </div>
            </div>
        );
    }

    return (
        <aside className="rfid-sidebar" aria-label="RFID sidebar">
            <div className="sidebar-inner">
                {/* Add form removed per request */}

                <div className="registered-title">
                    <h3>Registered RFID</h3>
                </div>

                <ul className="sidebar-list">
                    {rfids.map((r, idx) => (
                        <li key={r.id} className="sidebar-item">
                            <div className="item-index">{idx + 1}.</div>
                            <div className="item-tag">{r.tag}</div>
                            <div
                                className={`item-toggle ${r.status === 1 ? 'on' : 'off'} item-toggle--static`}
                                role="switch"
                                aria-checked={r.status === 1}
                                aria-disabled="true"
                                tabIndex={-1}
                                title={`Status: ${r.status === 1 ? 'On' : 'Off'}`}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
