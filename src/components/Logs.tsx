import React from 'react';

export default function Logs(props: {
	logs: { id: string; tag: string; status: 0 | 1; time: string }[];
	onClear: () => void;
}) {
	const { logs, onClear } = props;

	return (
		<section className="logs-section">
			<div className="logs-header">
				<h2>RFID Logs</h2>
				<button onClick={onClear} className="clear-btn">
					Clear
				</button>
			</div>

			{logs.length === 0 && <div className="empty">No logs yet</div>}

			<ul className="logs-list">
				{logs.map(l => (
					<li key={l.id} className="log-item">
						<div className="log-left">
							<div className="log-tag">{l.tag}</div>
							<div className="log-time">{new Date(l.time).toLocaleString()}</div>
						</div>
						<div className="log-status">{l.status === 1 ? '1' : '0'}</div>
					</li>
				))}
			</ul>
		</section>
	);
}
