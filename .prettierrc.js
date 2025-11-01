/** @type {import("prettier").Config} */
const config = {
  // 한 줄의 최대 글자 수
  printWidth: 80,
  // 탭 너비 (공백 수)
  tabWidth: 2,
  // 탭 대신 스페이스 사용
  useTabs: false,
  // 문장 끝 세미콜론 사용
  semi: true,
  // 싱글 쿼트(') 사용
  singleQuote: true,
  // 객체, 배열 등 마지막 요소의 후행 쉼표
  trailingComma: 'es5',
  // 객체 리터럴 괄호 양 끝 공백
  bracketSpacing: true,
  // 화살표 함수 인자가 하나일 때도 항상 괄호 사용
  arrowParens: 'always',
  // 줄 바꿈 문자(End of Line) 통일
  endOfLine: 'lf',
};

// export default 사용
export default config;
