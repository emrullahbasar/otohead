// Yalnızca geliştirme ortamında kullanılan yerel API adresi — üretim build'lerinde
// EXPO_PUBLIC_API_IP tanımlı değilse bu özellik sessizce devre dışı kalır (bkz. carApi.ts
// NetworkError yakalaması), sabit bir LAN IP'si üretime sızmaz.
const API_IP = process.env.EXPO_PUBLIC_API_IP ?? '';
const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '3000';

export const API_BASE_URL = API_IP ? `http://${API_IP}:${API_PORT}/api` : '';

export const API_ENDPOINTS = {
  cars:  `${API_BASE_URL}/cars`,
  users: `${API_BASE_URL}/users`,
} as const;