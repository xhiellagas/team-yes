import React, { useMemo, useState } from 'react';

type LogEntry = {
	id: string;
	tag: string;
	status: 0 | 1;
	time: string;
};

type Rfid = {
	id: string;
	tag: string;
	status: 0 | 1;
};

export default function LogsTable(props: {
	logs: LogEntry[];
	rfids: Rfid[];
	onClear: () => void;
}) {
	const { logs, rfids, onClear } = props;
	const [query, setQuery] = useState('');

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return logs;
		return logs.filter(l => l.tag.toLowerCase().includes(q));
	}, [logs, query]);

	const formatTime = (timestamp: string) => {
		try {
			const date = new Date(timestamp);
			return date.toLocaleString();
		} catch {
			return timestamp;
		}
	};

	return (
		<div className="logs-container">
			<div className="logs-header">
				<h2>📋 Activity Logs</h2>
				<button className="logs-clear-btn" onClick={onClear}>
					Clear Logs
				</button>
			</div>

			<div className="logs-table-wrapper">
				{filtered.length === 0 ? (
					<div className="logs-empty">No logs yet</div>
				) : (
					<table className="logs-table">
						<thead>
							<tr>
								<th>RFID Tag</th>
								<th>Status</th>
								<th>Time</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((log, i) => {
								// determine current registered status for this tag
								const reg = rfids.find(r => r.tag === log.tag);
								const statusText = reg ? (reg.status === 1 ? '1' : '0') : 'NF';
								const statusClass = reg ? (reg.status === 1 ? 'on' : 'off') : 'nf';

								return (
									<tr key={log.id}>
										<td className="tag-cell">{log.tag}</td>
										<td>
											<span
												className={`status-badge ${
													log.status === 1 ? 'active' : 'inactive'
												}`}
											>
												{log.status === 1 ? '✓ Active' : '✗ Inactive'}
											</span>
										</td>
										<td className="time-cell">{formatTime(log.time)}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
