"use server";

import { loadExamBank } from "../lib/exams/load-bank";

export type PublicQuestion = {
  id: string;
  index: number;
  question: string;
  options: string[];
  total: number;
};

export async function getExamMeta(slug: string) {
  const bank = await loadExamBank(slug);
  return {
    slug,
    title: bank.title,
    subject: bank.subject,
    id: bank.id,
    total: bank.questions.length,
  };
}

export async function getPublicQuestion(
  slug: string,
  index: number,
): Promise<PublicQuestion | { error: string }> {
  try {
    const bank = await loadExamBank(slug);
    if (index < 0 || index >= bank.questions.length) {
      return { error: "문제 번호가 범위를 벗어났습니다." };
    }
    const q = bank.questions[index]!;
    return {
      id: q.id,
      index,
      question: q.question,
      options: q.options,
      total: bank.questions.length,
    };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "불러오지 못했습니다." };
  }
}

export async function checkAnswer(
  slug: string,
  index: number,
  choiceIndex: number,
) {
  const bank = await loadExamBank(slug);
  if (index < 0 || index >= bank.questions.length) {
    throw new Error("Invalid question index");
  }
  const q = bank.questions[index]!;
  if (choiceIndex < 0 || choiceIndex >= q.options.length) {
    throw new Error("Invalid choice");
  }
  const correct = choiceIndex === q.answer;
  return {
    correct,
    correctIndex: q.answer,
    explanation: q.explanation ?? null,
  };
}
