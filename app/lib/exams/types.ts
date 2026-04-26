/**
 * `data/exams/{slug}.json` 문제은행 기본 스키마.
 * 기존 JSON 필드명이 다르면 변환 스크립트로 맞추거나, normalizeExamBank를 확장하세요.
 */
export type ExamQuestion = {
  id: string;
  question: string;
  options: string[];
  /** 0-based index into `options` */
  answer: number;
  explanation?: string;
};

export type ExamBankFile = {
  id: string;
  title: string;
  subject?: string;
  questions: ExamQuestion[];
};

export type ExamRegistryEntry = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  /** 표시용(실제는 JSON length 사용) */
  questionCountHint?: number;
  /** `data/exams/{dataFile}.json` — 기본은 slug와 동일 */
  dataFile?: string;
  /** false면 목록/연습 비공개(준비 중) */
  public?: boolean;
};
