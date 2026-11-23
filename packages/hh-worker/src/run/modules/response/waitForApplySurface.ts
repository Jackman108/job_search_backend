import { Page } from 'puppeteer';
import { SELECTORS, TIMEOUTS } from '@market-hunter/hh-worker/config';

/**
 * After «Откликнуться», Magritte may take a beat to mount letter / submit / questions.
 * Returns false if the vacancy page still looks untouched (CTA only).
 */
export async function waitForApplySurface(page: Page, timeout = TIMEOUTS.MODAL): Promise<boolean> {
    const handle = await page
        .waitForFunction(
            (sels) => {
                const visible = (el: Element | null) => {
                    if (!el) return false;
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                        return false;
                    }
                    return el.getClientRects().length > 0;
                };
                if (visible(document.querySelector(sels.COVER_LETTER_INPUT))) return true;
                if (visible(document.querySelector(sels.COVER_LETTER_TOGGLE))) return true;
                if (visible(document.querySelector(sels.RESPONSE_LINK_NO_QUESTIONS))) return true;
                if (visible(document.querySelector(sels.RESPONSE_SUBMIT))) return true;
                if (visible(document.querySelector(sels.EMPLOYER_QUESTION))) return true;
                if (visible(document.querySelector(sels.HIDDEN_RESUME_WARNING))) return true;
                // Magritte 2026 response modal — often no letter input until «Добавить сопроводительное».
                const dialogs = Array.from(
                    document.querySelectorAll(
                        '[role="dialog"], [data-qa*="response-popup"], [data-qa*="vacancy-response"]',
                    ),
                );
                for (const d of dialogs) {
                    if (!visible(d)) continue;
                    const t = (d.textContent || '').replace(/\s+/g, ' ');
                    if (/Отклик на вакансию|Добавить сопроводительн|Выберите резюме/i.test(t)) return true;
                }
                const body = document.body?.innerText || '';
                if (/уже\s+откликались|Вы\s+откликнулись|Отклик\s+отправлен/i.test(body)) return true;
                return false;
            },
            { timeout },
            SELECTORS,
        )
        .catch(() => null);
    return Boolean(handle);
}
