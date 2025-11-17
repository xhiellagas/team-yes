import React, { useState } from 'react';

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
	onAdd: (tag: string) => void;
}) {
	const { rfids, onToggle, onAdd } = props;
	const [newTag, setNewTag] = useState('');

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const tag = newTag.trim();
		if (!tag) return;
		onAdd(tag);
		setNewTag('');
	}

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
				<form className="sidebar-add" onSubmit={submit}>
					<input
						aria-label="Add RFID"
						placeholder="Add tag..."
						value={newTag}
						onChange={e => setNewTag(e.target.value)}
					/>
					<button type="submit">+</button>
				</form>

				<ul className="sidebar-list">
					{rfids.map((r, idx) => (
						<li key={r.id} className="sidebar-item">
							<div className="item-index">{idx + 1}.</div>
							<div className="item-tag">{r.tag}</div>
							<button
								className={`item-toggle ${r.status === 1 ? 'on' : 'off'}`}
								onClick={() => onToggle(r.id)}
								aria-pressed={r.status === 1}
								title={`Toggle ${r.tag}`}
							/>
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
