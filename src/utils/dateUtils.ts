// Uygulamanın kayıtlarda kullandığı gg.aa.yyyy biçimi.

export const formatDateToString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

// Geçersiz veya boşsa null döner (çağıran bugünü seçebilsin).
export const parseDateString = (value: string): Date | null => {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(p => parseInt(p, 10));
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) || date.getDate() !== d ? null : date;
};

export const isAfterToday = (date: Date): boolean => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date.getTime() > end.getTime();
};
