import { ipcMain } from "electron";
import { getSettings, updateSettings } from "../../config/settings.js";

export function setSettingsHandler(mainWindow) {
    
    ipcMain.handle('get-settings', () => {
        return getSettings();
    });

    ipcMain.handle("update-settings", (event, updatedValues) => {
        updateSettings(updatedValues);
        return true;
    });
}