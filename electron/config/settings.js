import Store from 'electron-store';

const schema = {
    aiSuggestionsEnabled: {
        type: 'boolean',
        default: false,
    },
    apiKey: {
        type: 'string',
        default: '',
    },
    aiEnabled: {
        type: 'boolean',
        default: false,
    },
};

const store = new Store({ schema });

export function getSettings() {
    return {
        aiSuggestionsEnabled: store.get('aiSuggestionsEnabled'),
        apiKey: store.get('apiKey'),
        aiEnabled: store.get('aiEnabled'),
    };
}

export function updateSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value);
    }
  }
export function getApiKey() {
    return store.get('apiKey');
}
export function isAiSuggestionsEnabled() {
    return store.get('aiSuggestionsEnabled');
}
export function isAiEnabled() {
    return store.get('aiEnabled');
}