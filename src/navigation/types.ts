export type MainTabParamList = {
  'Ana Sayfa':     undefined;
  // carId: Ana Sayfa'daki yakıt kaydı bölmesinden belirli bir araçla açılır;
  // ts: aynı araçla tekrar gelindiğinde de seçimi yeniden uygulatmak için.
  'Yakıt':         { carId?: string; ts?: number } | undefined;
  // carId/ts: Ana Sayfa'daki "yaklaşan bakım" uyarısından belirli bir aracın
  // detay ekranıyla açılmak için (bkz. HomeScreen.tsx, Yakıt'taki aynı desen).
  'Araç Yönetimi': { carId?: string; ts?: number } | undefined;
  // tab: bildirimden gelinen alt sekme ('sell' da 'evaluate' sekmesinin
  // içinde açılır, bkz. SuggestionsScreen.tsx); ts: aynı sekmeye tekrar
  // gelindiğinde de yenileme tetiklemek için.
  'Araç Öneri':    { tab?: 'find' | 'evaluate' | 'sell'; ts?: number } | undefined;
};
