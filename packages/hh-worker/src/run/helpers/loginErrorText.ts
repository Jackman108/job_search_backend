/** Magritte toast: infrastructure / soft-block — reload once, not “wrong password”. */
export function loginTransientReloadMatches(text: string): boolean {
    if (!text) return false;
    return /Произошла ошибка\.?\s*Попробуйте перезагрузить/i.test(text);
}

/**
 * Magritte / HH login error copy (password step). Cyrillic — no JS `\b`.
 * Does not treat the reload toast alone as bad credentials.
 */
export function loginErrorTextMatches(text: string): boolean {
    if (!text) return false;
    // Field-level «Ошибка» under password (wrong password / Magritte validation).
    if (/Ошибка/i.test(text) && /Введите пароль|Войти с паролем/i.test(text)) {
        return true;
    }
    return /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)/i.test(text);
}
