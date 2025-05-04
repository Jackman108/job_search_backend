import path from 'path';
import fs from 'fs';
import { URLS, BASE_PATHS } from '@config';

interface UpdateFields {
    avatar?: string;
    [key: string]: any;
}

export const handleAvatarUpload = async (
    avatar: string,
    updateFields: UpdateFields
): Promise<void> => {
    if (avatar.startsWith('data:image')) {
        const matches = avatar.match(/^data:(image\/[^;]+);base64,/);
        if (!matches) {
            throw new Error('Некорректный формат данных изображения');
        }

        const mimeType = matches[1];
        const extension = mimeType.split('/')[1];
        const fileName = `${updateFields.userId}_avatar.${extension}`;
        const filePath = path.join(BASE_PATHS.uploads, fileName);
        const base64Data = avatar.replace(/^data:image\/[^;]+;base64,/, '');

        await fs.promises.writeFile(filePath, base64Data, 'base64');
        updateFields.avatar = `${URLS.domain}/uploads/${fileName}`;
    } else {
        updateFields.avatar = avatar;
    }
};
