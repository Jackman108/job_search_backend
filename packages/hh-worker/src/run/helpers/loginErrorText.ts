/** Magritte / HH login error copy (password step). Cyrillic — no JS `\b`. */
export function loginErrorTextMatches(text: string): boolean {
    if (!text) return false;
    if (/Ошибка/i.test(text) && /Введите пароль|Войти с паролем|Произошла ошибка/i.test(text)) {
        return true;
    }
    return /Неправильные данные для входа|неверн(ый|ые|ая)\s+(пароль|логин|данные)|Произошла ошибка\.?\s*Попробуйте перезагрузить/i.test(
        text,
    );
}
