export const TIMEOUTS = {
    SHORT: 1000,
    LONG: 60000,
    MODAL: 20000,
    SEARCH: 10000,
};

/** HH scrape pagination — was hardcoded in secrets.ts; not a credential. */
export const HH_SCRAPE = {
    TOTAL_PAGES: Number(process.env.HH_TOTAL_PAGES) || 3,
};

export const SELECTORS = {
    COOKIE_ACCEPT:
        '[data-qa="cookies-policy-informer-accept"], [data-qa="cookie-policy-informer-accept"], [data-qa*="cookies-policy"] button, [data-qa*="cookie"][data-qa*="accept"]',
    // Legacy serp header CTA — authorize does NOT wait on this (no English LOGIN).
    LOGIN: '[data-qa^="login "], [data-qa="login"], [data-qa*="mainmenu_loginButton"]',
    /** Region / city chooser overlay closer (pre-login). */
    REGION_BUTTON:
        '.supernova-overlay-closer, [data-qa="region-clarification-confirm"], [data-qa="mainmenu_areaSwitch"]',
    // Magritte 2026: applicant → Почта → email → «Войти с паролем» → password → «Войти».
    ACCOUNT_TYPE_APPLICANT: '[data-qa="account-type-card-APPLICANT"]',
    ACCOUNT_TYPE_APPLICANT_RADIO:
        '[data-qa="account-type-card-APPLICANT-radio"], [data-qa="account-type-card-APPLICANT-radio checked"]',
    ACCOUNT_LOGIN_FORM: '[data-qa="account-login-form"]',
    // Magritte may append " checked" into data-qa — match with ^= .
    EMAIL_BUTTON: '[data-qa^="credential-type-email"]',
    EMAIL_INPUT: '[data-qa="applicant-login-input-email"]',
    // «Войти с паролем» — text fallback in authorize when data-qa drifts.
    PASSWORD_BUTTON: '[data-qa="expand-login-by-password"]',
    // After expand, Magritte drops the email field and shows password only.
    PASSWORD_INPUT:
        '[data-qa="applicant-login-input-password"], [data-qa="login-input-password"], input[type="password"]',
    // Primary submit («Дальше» on account-type / «Войти» on password) — text fallbacks in authorize.
    LOGIN_SUBMIT: '[data-qa="submit-button"], [data-qa="account-login-submit"]',
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
    // Prefer no-questions link first (see submitApplyResponse); then popup/page submit.
    RESPONSE_LINK_NO_QUESTIONS: '[data-qa="vacancy-response-link-no-questions"]',
    RESPONSE_LINK_TOP: '[data-qa="vacancy-response-link-top"]',
    RESPONSE_SUBMIT:
        '[data-qa="vacancy-response-submit-popup"], [data-qa="vacancy-response-letter-submit"], [data-qa="vacancy-response-submit"]',
    COVER_LETTER_INPUT:
        'textarea[data-qa="vacancy-response-popup-form-letter-input"], [data-qa="vacancy-response-popup-form-letter-input"], [data-qa="vacancy-response-letter"]',
    RESPONSE_POPUP_CLOSE: '[data-qa="response-popup-close"]',
    ADDITIONAL_DATA_COLLECTOR_CLOSE: '[data-qa="additional-data-collector__popup-close"]',
    HIDDEN_RESUME_WARNING: '[data-qa="hidden-resume-warning"]',
    // Employer screening questions — skip auto-apply (no personal templates in code).
    EMPLOYER_QUESTION:
        'textarea[name^="task_"], [data-qa^="task_"], [data-qa*="employer-question"], [data-qa="vacancy-response-popup-form-task"]',
    BLOK_TEXTAREA: 'textarea',
    TEXTAREA_INVALID: 'bloko-textarea_invalid',
    BLOK_RADIO: 'label.bloko-radio',
    RADIO_INVALID: 'bloko-radio_invalid',
    BLOCK_CHECKBOX: 'label.bloko-checkbox',
    BLOCK_CHECKBOX_INVALID: 'bloko-checkbox_invalid',
    VACANCY_TITLE: '[data-qa="serp-item__title-text"]',
    VACANCY_LINK: '[data-qa="serp-item__title"]',
    COMPANY_LINK: 'a[data-qa="vacancy-serp__vacancy-employer"]',
    LOGIN_ERROR:
        '[data-qa="account-login-error"], [data-qa="account-login-form-error"], [data-qa*="login-error"], [class*="login-error"]',
    // Prefer picture URL — avoid matching decorative imgs under loose [data-qa*="captcha"].
    CAPTCHA_IMAGE:
        'img[src*="captcha/picture"], [data-qa="account-captcha-picture"], img[data-qa="account-captcha-picture"]',
    CAPTCHA_INPUT: '[data-qa="account-captcha-input"]',
    CAPTCHA_LANG: '[data-qa="captcha-language"]',
};

/** Vacancy row flags persisted by apply pipeline. */
export const VACANCY_STATUS = {
    SUCCESS: 'true',
    FAIL: 'false',
    /** Preflight skip / form invalid — not a successful отклик. */
    SKIP: 'N',
} as const;

/** Body-text success marker after Magritte submit (primary). */
export const APPLY_SUCCESS_RE = /Вы\s+откликнулись/;

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
