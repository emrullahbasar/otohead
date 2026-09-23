export type MainTabParamList = {
  'Ana Sayfa':     undefined;
  'Yakıt':         undefined;
  'Araç Yönetimi': undefined;
  // tab: bildirimden gelinen alt sekme; ts: aynı sekmeye tekrar gelindiğinde de yenileme tetiklemek için.
  'Araç Öneri':    { tab?: 'find' | 'evaluate'; ts?: number } | undefined;
};
