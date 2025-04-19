import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [enableAISuggestions, setEnableAISuggestions] = useState(false);
  const [enableAgent, setEnableAgent] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load saved settings from electron-store
    window.settingsAPI.getSettings().then((settings) => {
      setApiKey(settings.apiKey);
      setEnableAISuggestions(settings.aiSuggestionsEnabled);
      setEnableAgent(settings.aiEnabled);
    });
  }, []);

  const handleUpdate = async () => {
    await window.settingsAPI.updateSettings({
      apiKey,
      aiSuggestionsEnabled: enableAISuggestions,
      aiEnabled: enableAgent,
    });

    alert("Settings updated. Please restart the app for changes to take effect.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-10">
      <h1 className="text-3xl font-bold mb-10">Terminal Settings</h1>

      {/* API Key */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Groq API Key</label>
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          {showKey ? "Hide Key" : "Show Key"}
        </button>
      </div>

      {/* Checkboxes */}
      <div className="mb-6 flex items-center space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enableAISuggestions}
            onChange={(e) => setEnableAISuggestions(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded"
          />
          <span className="text-sm">Enable AI Suggestions</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enableAgent}
            onChange={(e) => setEnableAgent(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-500 bg-gray-800 border-gray-600 rounded"
          />
          <span className="text-sm">Enable Agent</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Save Settings
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Back to Terminal
        </button>
      </div>
    </div>
  );
}
