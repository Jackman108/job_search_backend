import path from 'path';
import fs from 'fs';
import { uploadDir } from '../config/httpConfig.js';
import { API_URL } from '../config/serverConfig.js';

export const handleAvatarUpload = async (avatar, userId, updateFields) => {
    if (avatar.startsWith('data:image')) {
        // Извлечение информации о формате изображения
        const matches = avatar.match(/^data:(image\/[^;]+);base64,/);
        if (!matches) {
            throw new Error('Некорректный формат данных изображения');
        }

        const mimeType = matches[1];
        const extension = mimeType.split('/')[1]; // Получение расширения (png, jpeg и т.д.)
        const fileName = `${userId}_avatar.${extension}`;
        const filePath = path.join(uploadDir, fileName);
        const base64Data = avatar.replace(/^data:image\/[^;]+;base64,/, '');

        await fs.promises.writeFile(filePath, base64Data, 'base64');
        updateFields.avatar = `${API_URL}/uploads/${fileName}`;
    } else {
        updateFields.avatar = avatar;
    }
};
