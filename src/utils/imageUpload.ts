import axios from 'axios';

const IMGBB_API_KEY = '76cef0ff37af805d02ac60ac70260ee2';
const IMGBB_URL = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

export const uploadImageToImgBB = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(IMGBB_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data && response.data.success) {
            return response.data.data.url;
        }
        throw new Error('Upload failed');
    } catch (error) {
        console.error('Error uploading image to ImgBB:', error);
        throw error;
    }
};
