import { useEffect, useRef, useState } from 'react';
import { TerminalInstance } from './terminalInstance';
import { debounce } from '../utils/debounce';

export default function TerminalTabs() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const containerRefs = useRef({});
  const terminals = useRef({});

  const handleResize = useRef(
    debounce(() => {
      // Resize all terminals, updating both frontend and backend
      Object.entries(terminals.current).forEach(([sessionId, terminal]) => {
        terminal.resize();
      });
    }, 200)
  ).current;

  // Initialize with one session
  useEffect(() => {
    const createInitialSession = async () => {
      try {
        const sessionId = await window.terminalAPI.createTerminalSession();
        setSessions([sessionId]);
        setActiveSessionId(sessionId);
      } catch (error) {
        console.error('Failed to create initial session:', error);
      }
    };
    createInitialSession();
  }, []);

  // Add a new tab
  const addTab = async () => {
    try {
      const sessionId = await window.terminalAPI.createTerminalSession();
      setSessions(prev => [...prev, sessionId]);
      setActiveSessionId(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Close a tab
  const closeTab = (sessionId) => {
    terminals.current[sessionId]?.destroy();
    delete terminals.current[sessionId];
    delete containerRefs.current[sessionId];
    setSessions(prev => prev.filter(id => id !== sessionId));
    if (activeSessionId === sessionId) {
      const nextSession = sessions.find(id => id !== sessionId);
      setActiveSessionId(nextSession || null);
    }
    window.terminalAPI.closeTerminalSession(sessionId);
  };

  // Handle terminal exit
  useEffect(() => {
    const handleTerminalExited = (sessionId) => {
      terminals.current[sessionId]?.destroy();
      delete terminals.current[sessionId];
      delete containerRefs.current[sessionId];
      setSessions(prev => prev.filter(id => id !== sessionId));
      if (activeSessionId === sessionId) {
        const nextSession = sessions.find(id => id !== sessionId);
        setActiveSessionId(nextSession || null);
      }
    };
    window.terminalAPI.onTerminalExited(handleTerminalExited);
    return () => {
      window.terminalAPI.removeTerminalExitedListener(handleTerminalExited);
    };
  }, [sessions, activeSessionId]);

  // Create TerminalInstance for each session
  useEffect(() => {
    sessions.forEach(id => {
      if (!terminals.current[id] && containerRefs.current[id]) {
        terminals.current[id] = new TerminalInstance({
          container: containerRefs.current[id],
          sessionId: id,
          onResize: () => {
            console.log(`Terminal ${id} resized`);
          },
        });
      }
    });
  }, [sessions]);

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 bg-gray-900 text-white">
        {sessions.map(id => (
          <div
            key={id}
            className={`flex items-center px-2 rounded-t-md py-1 ${
              id === activeSessionId ? 'bg-gray-700' : 'bg-gray-800'
            }`}
          >
            <button
              onClick={() => setActiveSessionId(id)}
              className="text-sm focus:outline-none"
            >
              Tab {id.toString().slice(0, 4)}
            </button>
            <button
              onClick={() => closeTab(id)}
              className="text-red-500 hover:text-red-400 focus:outline-none"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className=" px-2 bg-blue-500 rounded-t-md hover:bg-blue-600"
        >
          + New Tab
        </button>
      </div>
      <div className="flex-grow relative">
        {sessions.map(id => (
          <div
            key={id}
            ref={el => (containerRefs.current[id] = el)}
            className="absolute inset-0"
            style={{ display: id === activeSessionId ? 'block' : 'none' }}
          />
        ))}
      </div>
    </div>
  );
}