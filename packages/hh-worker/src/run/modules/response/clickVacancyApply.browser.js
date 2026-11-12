/**
 * Browser-side SERP apply click. Kept as plain JS so tsx/esbuild cannot inject
 * `__name(...)` helpers (those are undefined in Puppeteer page context).
 */
module.exports = function clickVacancyApplyInPage(id, cardSelector, responseSelector) {
    var needle = '/vacancy/' + id;

    function tryClick(el, via) {
        if (!el) return { ok: false, reason: 'no_el:' + via };
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        var rect = el.getBoundingClientRect();
        try {
            el.click();
        } catch (e) {
            return { ok: false, reason: 'click_throw:' + via };
        }
        return {
            ok: true,
            x: Math.max(1, rect.left + Math.max(rect.width, 1) / 2),
            y: Math.max(1, rect.top + Math.max(rect.height, 1) / 2),
            via: via,
        };
    }

    function findApplyIn(root, viaPrefix) {
        var byQa = root.querySelector(responseSelector);
        var viaQa = tryClick(byQa, viaPrefix + ':qa');
        if (viaQa.ok) return viaQa;

        var nodes = root.querySelectorAll('a, button, [role="button"]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (/Откликнуться/i.test(el.textContent || '')) {
                return tryClick(el, viaPrefix + ':text');
            }
        }
        return { ok: false, reason: 'no_apply:' + viaPrefix };
    }

    var cards = document.querySelectorAll(cardSelector);
    var sawCard = false;
    for (var c = 0; c < cards.length; c++) {
        var card = cards[c];
        var link = card.querySelector('a[href*="' + needle + '"]');
        if (!link) continue;
        sawCard = true;
        card.scrollIntoView({ block: 'center', inline: 'nearest' });
        card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        var hitCard = findApplyIn(card, 'card');
        if (hitCard.ok) return hitCard;
    }

    var responses = document.querySelectorAll(responseSelector);
    for (var r = 0; r < responses.length; r++) {
        var resp = responses[r];
        var root = resp.closest(cardSelector) || resp.parentElement;
        if (root && root.querySelector('a[href*="' + needle + '"]')) {
            var viaLoose = tryClick(resp, 'loose-qa');
            if (viaLoose.ok) return viaLoose;
        }
    }

    var all = document.querySelectorAll('a, button, [role="button"]');
    for (var a = 0; a < all.length; a++) {
        var btn = all[a];
        if (!/Откликнуться/i.test(btn.textContent || '')) continue;
        var nearRoot = btn.closest(cardSelector) || btn.parentElement;
        if (nearRoot && nearRoot.querySelector('a[href*="' + needle + '"]')) {
            return tryClick(btn, 'near-text');
        }
    }

    return { ok: false, reason: sawCard ? 'card_no_apply' : 'card_missing' };
};
