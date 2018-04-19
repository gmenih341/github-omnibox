import { GithubClient } from '../github/client';
import { browser, storageWrapper } from '../browser';
import { OPTION_STRINGS as OPTIONS } from '../constants';
import { onTextChangedFactory, onEnterFactory } from './omnibox.handlers';

let onTextChanged = null;
const storage = storageWrapper(browser.storage.local);
const onItemSelected = onEnterFactory(browser);

const bindBackgroundHandlers = async (omnibox) => {
    const settings = await storage.getAllSettings();

    if (!settings[OPTIONS.GITHUB_TOKEN]) {
        if (!settings[OPTIONS.OPTIONS_SHOWN]) {
            storage.setItem(OPTIONS.SEARCH_NAME, true);
            storage.setItem(OPTIONS.SEARCH_FORKED, true);
            browser.runtime.openOptionsPage(() => {
                storage.setItem(OPTIONS.OPTIONS_SHOWN, true);
            });
        }
        return;
    }
    const client = new GithubClient(settings[OPTIONS.GITHUB_TOKEN]);
    try {
        const logins = await client.fetchUserLogins();
        storage.setItem(OPTIONS.GITHUB_LOGINS, logins);
        onTextChanged = onTextChangedFactory(client, storage);
        omnibox.onInputChanged.addListener(onTextChanged);
        omnibox.onInputEntered.addListener(onItemSelected);
    } catch (err) {
        console.error(err);
    }
};

const unbindBackgroundHandlers = (omnibox) => {
    if (typeof onTextChanged === 'function') {
        omnibox.onInputChanged.removeListener(onTextChanged);
    }
    if (typeof onItemSelected === 'function') {
        omnibox.onInputEntered.removeListener(onItemSelected);
    }
};

browser.storage.onChanged.addListener(async (changes, scope) => {
    if (scope !== 'local') {
        return;
    }
    if (Object.keys(changes).includes(OPTIONS.GITHUB_TOKEN)) {
        unbindBackgroundHandlers(browser.omnibox);
        await bindBackgroundHandlers(browser.omnibox);
    }
});

bindBackgroundHandlers(browser.omnibox);
