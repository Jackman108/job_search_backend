export const TIMEOUTS = {
    SHORT: 1000,
    LONG: 60000,
    MODAL: 20000,
    SEARCH: 10000
};

/** HH scrape pagination — was hardcoded in secrets.ts; not a credential. */
export const HH_SCRAPE = {
    TOTAL_PAGES: Number(process.env.HH_TOTAL_PAGES) || 3,
};

export const SELECTORS = {
    COOKIE_ACCEPT: '[data-qa="cookies-policy-informer-accept"]',
    LOGIN: '[data-qa="login"]',
    REGION_BUTTON: '.supernova-overlay-closer',
    EMAIL_BUTTON: '[data-qa="credential-type-EMAIL"]',
    EMAIL_INPUT: '[data-qa="applicant-login-input-email"]',
    PASSWORD_BUTTON: '[data-qa="expand-login-by-password"]',
    // Primary + Magritte/legacy alts (comma = first match). Live guest verify blocked when already logged in.
    PASSWORD_INPUT:
        '[data-qa="applicant-login-input-password"], [data-qa="login-input-password"]',
    LOGIN_SUBMIT:
        '[data-qa="submit-button"], [data-qa="account-login-submit"]',
    OTP_CODE_INPUT: 'input[data-qa="otp-code-input"]',
    OTP_SUBMIT: '[data-qa="otp-code-submit"]',
    // Prefer stable data-qa; class*=vacancy-card still matches Magritte CSS-module wrappers but is fragile.
    VACANCY_CARD: '[data-qa="vacancy-serp__vacancy"]',
    VACANCY_RESPONSE: '[data-qa="vacancy-serp__vacancy_response"]',
    VACANCY_INPUT: '[data-qa="search-input"]',
    // Response control is often an <a role="button">; span child may be absent — prefer the button itself in callers when possible.
    RESPONSE_BUTTON_SPAN: '[data-qa="vacancy-serp__vacancy_response"]',
    PAGER_NEXT: '[data-qa="pager-next"]',
    RELOCATION_MODAL_TITLE: '[data-qa="relocation-warning-title"]',
    RELOCATION_CONFIRM: '[data-qa="relocation-warning-confirm"]',
    // Popup (`add-cover-letter` / *-popup-*) + vacancy-page Magritte letter toggle/submit/input.
    COVER_LETTER_TOGGLE:
        '[data-qa="add-cover-letter"], [data-qa="vacancy-response-letter-toggle"], [data-qa="vacancy-response-letter-toggle-text"]',
    RESPONSE_SUBMIT:
        '[data-qa="vacancy-response-submit-popup"], [data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit"]',
    COVER_LETTER_INPUT:
        '[data-qa="vacancy-response-popup-form-letter-input"], [data-qa="vacancy-response-letter"]',
    BLOK_TEXTAREA: 'textarea',
    TEXTAREA_INVALID: 'bloko-textarea_invalid',
    BLOK_RADIO: 'label.bloko-radio',
    RADIO_INVALID: 'bloko-radio_invalid',
    BLOCK_CHECKBOX: 'label.bloko-checkbox',
    BLOCK_CHECKBOX_INVALID: 'bloko-checkbox_invalid',
    VACANCY_TITLE: '[data-qa="serp-item__title-text"]',
    VACANCY_LINK: '[data-qa="serp-item__title"]',
    COMPANY_LINK: 'a[data-qa="vacancy-serp__vacancy-employer"]',
    LOGIN_ERROR: '[data-qa="account-login-error"]',
    CAPTCHA_IMAGE: '[data-qa="account-captcha-picture"]',
    CAPTCHA_INPUT: '[data-qa="account-captcha-input"]',
    CAPTCHA_LANG: '[data-qa="captcha-language"]',
};

export const SELECTORS_CHAT = {
    CHAT_URL: 'https://chatik.hh.ru/?hhtmSource=chat_page&hhtmFrom=chat',
    CHAT_CARD: 'a[data-qa^="chatik-open-chat-"]',
    VACANCY_RESPONSE: '[data-qa="vacancy-serp__vacancy_response"]',
    VACANCY_URL: '[data-qa="chatik-header-vacancy-link"]',
    RESPONSE_STATUS: '[data-qa="chat-bubble-title"]',
    CHAT_TEXT: '[data-qa="chat-bubble-text"]',
    CHAT_DATE: '[class*="chat-date"]',
    CHAT_TIME: '[data-qa="chat-buble-display-time"]',
};