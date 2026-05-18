import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://localhost:3333/api';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

export const fetchAPI = async (endpoint: string, method = 'GET', body?: any) => {
  const { getToken, getRefreshToken, setToken, logout } = useAuthStore.getState();
  let token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        logout();
        throw new Error('Session expired. Please login again.');
      }

      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        token = await new Promise(resolve => {
          subscribeTokenRefresh(token => resolve(token));
        });
        // Retry request with new token
        headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } else {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          
          const refreshData = await refreshRes.json();
          
          if (!refreshRes.ok) {
            throw new Error('Refresh failed');
          }
          
          const newAccessToken = refreshData.data.accessToken;
          setToken(newAccessToken, refreshToken);
          isRefreshing = false;
          onRefreshed(newAccessToken);
          
          // Retry original request
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
        } catch (err) {
          isRefreshing = false;
          refreshSubscribers = [];
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error: any) {
    if (error.message === 'Session expired. Please login again.') {
      throw error;
    }
    throw new Error(error.message || 'Network error occurred');
  }
};
