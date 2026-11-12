/**
 * Browser-side vacancy-page apply click. Plain JS — no tsx `__name` injection.
 */
module.exports = function clickVacancyPageApplyInPage(sels) {
    for (var i = 0; i < sels.length; i++) {
        var el = document.querySelector(sels[i]);
        if (!el) continue;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.click();
        return { ok: true, via: sels[i] };
    }
    var nodes = document.querySelectorAll('a, button, [role="button"]');
    for (var n = 0; n < nodes.length; n++) {
        var btn = nodes[n];
        var text = (btn.textContent || '').trim();
        if (text !== 'Откликнуться' && !/^Откликнуться\b/i.test(text)) continue;
        btn.scrollIntoView({ block: 'center', inline: 'nearest' });
        btn.click();
        return { ok: true, via: 'text' };
    }
    return { ok: false, via: 'none' };
};
