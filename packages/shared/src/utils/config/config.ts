/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged packages/shared/src/utils/config.js
 *
 */

import { getProductionPlatformHostname, getStagingPlatformHostname } from '../brand';

// Domain to app ID mapping
export const domain_app_ids = {
    'dtrader.deriv.com': 16929,
    'staging-dtrader.deriv.com': 16303,
    'localhost': 36300,
};

// Platform app IDs
export const platform_app_ids = {
    derivgo: 23789,
};

export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain);

export const isStaging = () => {
    return /^staging/.test(window.location.hostname);
};

export const isBot = () => {
    return false; // Simplified for this implementation
};

/**
 * Gets the app ID based on current domain and configuration
 */
export const getAppId = () => {
    let app_id = null;
    const user_app_id = ''; // you can insert Application ID of your registered application here
    const config_app_id = window.localStorage.getItem('config.app_id');
    const current_domain = getCurrentProductionDomain() || '';
    window.localStorage.removeItem('config.platform'); // Remove config stored in localstorage if there's any.
    const platform = window.sessionStorage.getItem('config.platform');
    const is_bot = isBot();

    // Added platform at the top since this should take precedence over the config_app_id
    if (platform && platform_app_ids[platform as keyof typeof platform_app_ids]) {
        app_id = platform_app_ids[platform as keyof typeof platform_app_ids];
    } else if (config_app_id) {
        app_id = config_app_id;
    } else if (user_app_id.length) {
        window.localStorage.setItem('config.default_app_id', user_app_id);
        app_id = user_app_id;
    } else if (isStaging()) {
        window.localStorage.removeItem('config.default_app_id');
        app_id = is_bot ? 19112 : domain_app_ids[current_domain as keyof typeof domain_app_ids] || 16303;
    } else if (/localhost/i.test(window.location.hostname)) {
        app_id = 36300;
    } else {
        window.localStorage.removeItem('config.default_app_id');
        app_id = is_bot ? 19111 : domain_app_ids[current_domain as keyof typeof domain_app_ids] || 16929;
    }

    return app_id;
};

export const isProduction = () => {
    const productionHostname = getProductionPlatformHostname();
    const stagingHostname = getStagingPlatformHostname();

    // Create regex patterns for both production and staging domains (with optional www prefix)
    const productionPattern = `(www\\.)?${productionHostname.replace('.', '\\.')}`;
    const stagingPattern = `(www\\.)?${stagingHostname.replace('.', '\\.')}`;

    // Check if current hostname matches any of the supported domains
    const supportedDomainsRegex = new RegExp(`^(${productionPattern}|${stagingPattern})$`, 'i');

    // Return true only if we're on the production hostname
    const productionRegex = new RegExp(`^${productionPattern}$`, 'i');
    return supportedDomainsRegex.test(window.location.hostname) && productionRegex.test(window.location.hostname);
};

/**
 * Gets account_type with priority: URL parameter > localStorage > default 'demo'
 * @returns {string} 'real', 'demo', or 'demo' as default
 */
export const getAccountType = (): string => {
    const search = window.location.search;
    const search_params = new URLSearchParams(search);
    const accountTypeFromUrl = search_params.get('account_type');

    // First priority: URL parameter
    if (accountTypeFromUrl === 'real' || accountTypeFromUrl === 'demo') {
        window.localStorage.setItem('account_type', accountTypeFromUrl);

        // Remove account_type from URL after processing
        const url = new URL(window.location.href);
        if (url.searchParams.has('account_type')) {
            url.searchParams.delete('account_type');
            window.history.replaceState({}, document.title, url.toString());
        }

        return accountTypeFromUrl;
    }

    // Second priority: localStorage
    const storedAccountType = window.localStorage.getItem('account_type');
    if (storedAccountType === 'real' || storedAccountType === 'demo') {
        return storedAccountType;
    }

    // Default to demo when no account_type parameter or invalid value
    return 'demo';
};

export const getSocketURL = () => {
    // 1. Check for manually configured server URL
    const local_storage_server_url = window.localStorage.getItem('config.server_url');
    if (local_storage_server_url) return local_storage_server_url;

    // 2. Default to unified WebSocket URL
    return 'ws.derivws.com';
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};
