// 백엔드 notification 엔티티와 일치
export interface INotification {
  id: string;
  createdAt: string;

  confirmed: boolean;
  content: string;
}

// GET /notifications(페이지네이션) 응답 타입
export interface INotificaionResponse {
  data: INotification[];
  page: number;
  hasMore: boolean;
}
