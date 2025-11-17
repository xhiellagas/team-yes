import React, { useState } from 'react';

type Rfid = {
	id: string;
	tag: string;
	status: 0 | 1;
	lastSeen?: string;
};

export default function RfidList(props: {
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

	return (
		<section className="rfid-section">
			<form className="add-form" onSubmit={submit}>
				<input
					aria-label="New RFID tag"
					placeholder="Add RFID tag (e.g. RFID-123)"
					value={newTag}
					onChange={e => setNewTag(e.target.value)}
				/>
				<button type="submit">Add</button>
			</form>

			<div className="rfid-list">
				{rfids.length === 0 && <div className="empty">No RFIDs registered</div>}
				{rfids.map(r => (
					<article key={r.id} className="rfid-card">
						<div className="rfid-main">
							<div className="rfid-tag">{r.tag}</div>
							<div className="rfid-last">{r.lastSeen ? new Date(r.lastSeen).toLocaleString() : '—'}</div>
						</div>
						<div className="rfid-actions">
							<label className="toggle">
								<input
									type="checkbox"
									checked={r.status === 1}
									onChange={() => onToggle(r.id)}
									aria-label={`Toggle status for ${r.tag}`}
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
