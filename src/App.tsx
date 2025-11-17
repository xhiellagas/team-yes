import React, { useEffect, useState } from 'react';
import './App.css';
import RfidSidebar from './components/RfidSidebar';
import LogsTable from './components/LogsTable';

type Rfid = {
	id: string;
	tag: string;
	status: 0 | 1;
	lastSeen?: string;
	createdAt?: string;  // Add this field
	animate?: boolean;
};

type LogEntry = {
	id: string;
	tag: string;
	status: 0 | 1;
	time: string;
	preserved?: boolean; // Add this to mark logs that shouldn't update
};

function App() {
	const [rfids, setRfids] = useState<Rfid[]>([]); // Start with empty array
	const [logs, setLogs] = useState<LogEntry[]>([]); // logs come from DB

	useEffect(() => {
		localStorage.setItem('rfids', JSON.stringify(rfids));
	}, [rfids]);

	// Add function to fetch latest data
	async function fetchLatestRfids() {
		try {
			const response = await fetch('http://localhost:3000/rfid_reg');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			
			if (!Array.isArray(data)) {
				console.error('Received non-array data:', data);
				return;
			}

			const transformedData: Rfid[] = data.map((item: any) => ({
				id: item.rfid_data.toString(),
				tag: item.rfid_data,
				status: item.rfid_status === 1 ? 1 : 0,
				lastSeen: item.last_seen || undefined,
				createdAt: item.created_at || undefined
			}));

			setRfids(transformedData);
		} catch (error) {
			console.error('Failed to fetch RFIDs:', error);
		}
	}

	// Fetch logs from backend (immutable history)
	async function fetchLatestLogs() {
		try {
			const res = await fetch('http://localhost:3000/rfid_logs');
			if (!res.ok) throw new Error('Failed to fetch logs');
			const data = await res.json();
			const transformedLogs: LogEntry[] = data.map((item: any) => ({
				id: item.id.toString(),
				tag: item.rfid_data,
				status: item.status === 1 ? 1 : 0,
				time: item.timestamp || item.timestamp,
				preserved: true
			}));
			setLogs(transformedLogs);
		} catch (err) {
			console.error('Failed to fetch logs:', err);
		}
	}

	// Replace the existing polling useEffect with this one
	useEffect(() => {
		// Initial fetch
		fetchLatestRfids();
		fetchLatestLogs();

		// Set up polling interval
		const interval = setInterval(() => {
			fetchLatestRfids();
			fetchLatestLogs();
		}, 2000); // Poll every 2 seconds

		return () => clearInterval(interval);
	}, []); // Empty dependency array

	function genId() {
		return Math.random().toString(36).slice(2, 9);
	}

	function addLog(entry: LogEntry) {
		// no-op: logs are persisted in DB by backend. UI updates via fetchLatestLogs polling.
	}

	async function verifyRfid(tag: string) {
		try {
			const response = await fetch(`http://localhost:3000/rfid_reg/verify/${tag}`);
			return response.ok;
		} catch (error) {
			console.error('Failed to verify RFID:', error);
			return false;
		}
	}

	async function toggleStatus(id: string) {
		const rfid = rfids.find(r => r.id === id);
		if (!rfid) return;

		try {
			const newStatus: 0 | 1 = rfid.status === 1 ? 0 : 1;
			
			const response = await fetch('http://localhost:3000/rfid_reg/status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					rfid_data: rfid.tag,
					rfid_status: newStatus
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update status');
			}

			const data = await response.json();
			
			if (data.statusChanged) {
				const time = new Date().toISOString();
				// Do not add a local log; backend already inserted into rfid_logs.
				setRfids(prev =>
					prev.map(r => r.id === id ? {
						...r,
						status: newStatus,
						lastSeen: time,
						animate: true
					} : r)
				);

				setTimeout(() => {
					setRfids(prev =>
						prev.map(r => r.id === id ? { ...r, animate: false } : r)
					);
				}, 1000);
			}

		} catch (error) {
			console.error('Failed to toggle status:', error);
		}
	}

	async function addRfid(tag: string) {
		try {
			const response = await fetch('http://localhost:3000/rfid_reg/add', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ rfid_data: tag })
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('Failed to add RFID:', error);
				return;
			}

			const data = await response.json();
			const newRfid: Rfid = {
				id: data.rfid_data.toString(),
				tag: data.rfid_data,
				status: data.rfid_status === 1 ? 1 : 0,
				lastSeen: undefined
			};

			setRfids(prev => [newRfid, ...prev]);
		} catch (error) {
			console.error('Failed to add RFID:', error);
		}
	}

	function clearLogs() {
		setLogs([]);
	}

	return (
		<div className="dashboard-shell">
			<div className="dashboard-frame">
				<RfidSidebar rfids={rfids} onToggle={toggleStatus} onAdd={addRfid} />
				<LogsTable logs={logs} rfids={rfids} onClear={clearLogs} />
			</div>
		</div>
	);
}

export default App;