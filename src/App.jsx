import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TerminalTabs from "./components/terminalTabs";
import SettingsPage from "./components/SettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TerminalTabs />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;

