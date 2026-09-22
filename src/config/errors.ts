// Uygulama genelinde kullanılan hata tipleri
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    this.name = 'NetworkError';
  }
}

// Hata mesajını kullanıcı dostu stringe çevir
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof DatabaseError) return 'Veri kaydedilirken bir hata oluştu.';
  if (error instanceof NetworkError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu.';
};

// API response kontrolü — tüm servisler bunu kullanır
export const handleApiResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    let message = `Sunucu hatası: ${response.status}`;
    try {
      const json = JSON.parse(body);
      if (json.message) message = json.message;
      else if (json.error) message = json.error;
    } catch {
      if (body) message = body;
    }
    throw new ApiError(response.status, message);
  }
  return response.json();
};