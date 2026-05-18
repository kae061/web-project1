import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export const uploadService = {
  uploadFile: async (file: File, type: 'image' | 'video' | 'audio' | 'file'): Promise<{ url: string; duration?: number }> => {
    const formData = new FormData();
    formData.append(type, file);

    const token = useAuthStore.getState().getToken() || localStorage.getItem('kaeapp_token');
    const response = await fetch(`${API_URL}/upload/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      let errorMsg = `Upload failed for ${type}`;
      try {
        const error = await response.json();
        errorMsg = error.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    const result = await response.json();
    return result.data;
  }
};
