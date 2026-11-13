/** Magritte toast: infrastructure / soft-block — reload once, not “wrong password”. */
export function loginTransientReloadMatches(text: string): boolean {
    if (!text) return false;
    return /Произошла ошибка\.?\s*Попробуйте перезагрузить/i.test(text);
}

/**
 * Magritte / HH login error copy (password step). Cyrillic — no JS `\b`.
 * Reload toast alone (or toast + bare «Ошибка») is NOT bad credentials — prefer transient retry.
 */
export function loginErrorTextMatches(text: string): boolean {
    if (!text) return false;
    if (loginTransientReloadMatches(text)) {
        return false;
    }
    // Field-level «Ошибка» under password (wrong password / Magritte validation).
    if (/Ошибка/i.test(text) && /Введите пароль|Войти с паролем/i.test(text)) {
        return true;
    }
    return /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)/i.test(text);
}
