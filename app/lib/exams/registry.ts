import type { ExamRegistryEntry } from "./types";

/**
 * 홈/시험 목록/관리자 "자격증" 목록의 단일 출처.
 * 이후 Supabase `certificates` 테이블로 옮길 때 이 구조를 그대로 쓰면 됩니다.
 */
export const EXAM_REGISTRY: ExamRegistryEntry[] = [
  {
    slug: "makeup-technician-written",
    title: "메이크업 미용사",
    subtitle: "국가기능장 필기",
    description:
      "필기 모의고사·연습용 문제은행으로 체험하실 수 있어요. (JSON을 교체해 문항을 늘릴 수 있어요.)",
    category: "미용",
    questionCountHint: 1000,
    public: true,
  },
];

export function getRegistryEntry(
  slug: string,
): ExamRegistryEntry | undefined {
  return EXAM_REGISTRY.find((e) => e.slug === slug);
}

export function listPublicExams(): ExamRegistryEntry[] {
  return EXAM_REGISTRY.filter((e) => e.public !== false);
}
