// API 성공 시 응답
// 로그인 JWT 토큰 반환
export interface LoginSuccessResponse {
  accessToken: string;
}

// API 실패 시 응답
// 에러 메시지 반환
export interface ApiErrorResponse {
  message: string;
}
