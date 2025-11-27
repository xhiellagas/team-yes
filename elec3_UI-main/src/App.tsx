import React, { useEffect, useState } from 'react';
import './App.css';
import RfidSidebar from './components/RfidSidebar';
import LogsTable from './components/LogsTable';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

type Rfid = {
    id: string;
    tag: string;
    status: 0 | 1;
    lastSeen?: string;
    animate?: boolean;
};

type LogEntry = {
    id: string;
    tag: string;
    status: 0 | 1;
    time: string;
    preserved?: boolean;
    statusLabel?: string;
    currentStatus?: string;
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
            const response = await fetch(`${API_URL}/rfid_reg`);
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
                lastSeen: undefined,
                animate: false
            }));

            setRfids(transformedData);
        } catch (error) {
            console.error('Failed to fetch RFIDs:', error);
        }
    }

    async function fetchLatestLogs() {
        try {
            const res = await fetch(`${API_URL}/rfid_logs`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            const data = await res.json();
            const transformedLogs: LogEntry[] = data
                .sort((a: any, b: any) => new Date(b.time_log).getTime() - new Date(a.time_log).getTime())
                .map((item: any) => ({
                    id: item.id.toString(),
                    tag: item.rfid_data,
                    status: item.rfid_status === '1' || item.rfid_status === 1 ? 1 : 0,
                    time: new Date(item.time_log).toLocaleString(),
                    preserved: true,
                    statusLabel: item.status_label,
                    currentStatus: item.current_status
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
            const response = await fetch(`${API_URL}/rfid_reg/verify/${tag}`);
            return response.ok;
        } catch (error) {
            console.error('Failed to verify RFID:', error);
            return false;
        }
    }

    // Async implementation that performs the status toggle work
    async function toggleStatusAsync(id: string) {
        const rfid = rfids.find(r => r.id === id);
        if (!rfid) return;

        try {
            const newStatus: 0 | 1 = rfid.status === 1 ? 0 : 1;
            
            const response = await fetch(`${API_URL}/rfid_reg/status`, {
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

    // Synchronous wrapper that components expecting (id: string) => void can use
    function toggleStatus(id: string): void {
        void toggleStatusAsync(id);
    }

    return (
        <div className="dashboard-shell">
            <div className="dashboard-frame">
                {/* Pass only the props RfidSidebar expects: rfids and onToggle (synchronous) */}
                <RfidSidebar rfids={rfids} onToggle={toggleStatus} />
                {/* LogsTable expects logs; pass only logs to match its prop type */}
                <LogsTable logs={logs} />
            </div>
        </div>
    );
}

export default App;