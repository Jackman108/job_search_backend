import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { URLS, BASE_PATHS } from '@config';

/** Raster images only — never SVG (stored XSS if served from API origin). */
const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

type UpdateFields = {
    avatar?: string;
    userId?: string | number;
};

/**
 * Persist data-URL avatar under uploads with an opaque filename.
 * Public /uploads stays static; opacity + allowlist remove predictable userId paths and SVG.
 */
export const handleAvatarUpload = async (avatar: string, updateFields: UpdateFields): Promise<void> => {
    if (!avatar.startsWith('data:image')) {
        updateFields.avatar = avatar;
        return;
    }

    const matches = avatar.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (!matches) {
        throw new Error('Некорректный формат данных изображения');
    }

    const mimeType = matches[1].toLowerCase();
    const extension = ALLOWED_MIME[mimeType];
    if (!extension) {
        throw new Error('Допустимы только JPEG, PNG, WebP или GIF');
    }

    const fileName = `${randomUUID()}.${extension}`;
    const filePath = path.join(BASE_PATHS.uploads, fileName);
    const base64Data = avatar.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    // Cap ~2MB decoded — reject oversized payloads early.
    const approxBytes = Math.floor((base64Data.length * 3) / 4);
    if (approxBytes > 2 * 1024 * 1024) {
        throw new Error('Изображение слишком большое (макс. 2 МБ)');
    }

    await fs.promises.mkdir(BASE_PATHS.uploads, { recursive: true });
    await fs.promises.writeFile(filePath, base64Data, 'base64');
    // Same origin as API so existing CORS/static mount keeps working.
    updateFields.avatar = `${URLS.api}/uploads/${fileName}`;
};
