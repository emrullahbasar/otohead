// Uygulama genelinde kullanılan hata tipleri
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Hata mesajını kullanıcı dostu stringe çevir
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof DatabaseError) return 'Veri kaydedilirken bir hata oluştu.';
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu.';
};
