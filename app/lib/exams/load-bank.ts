import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ExamBankFile, ExamQuestion } from "./types";
import { getRegistryEntry } from "./registry";

const cache = new Map<string, ExamBankFile>();

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeQuestion(q: unknown, i: number): ExamQuestion {
  if (!isRecord(q)) {
    throw new Error(`Invalid question at index ${i}`);
  }
  const id = String(q.id ?? `q${i + 1}`);
  const question = String(q.question ?? q.text ?? q.stem ?? "");
  let options: string[] = [];
  if (Array.isArray(q.options)) {
    options = q.options.map((o) => String(o));
  } else if (Array.isArray(q.choices)) {
    options = q.choices.map((o) => String(o));
  }
  const answerRaw = q.answer ?? q.correct ?? q.correctIndex;
  let answer = typeof answerRaw === "number" ? answerRaw : Number(answerRaw);
  if (Number.isNaN(answer) || answer < 0 || answer >= options.length) {
    throw new Error(`질문 ${id}: 정답 인덱스(0~${options.length - 1})를 확인하세요.`);
  }
  const explanation =
    q.explanation != null ? String(q.explanation) : undefined;
  if (!question.trim() || options.length < 2) {
    throw new Error(`질문 ${id}: 지문/선지가 올바르지 않아요.`);
  }
  return { id, question, options, answer, explanation };
}

function normalizeBank(raw: unknown, slug: string): ExamBankFile {
  if (!isRecord(raw)) throw new Error("JSON 최상위가 객체가 아닙니다.");
  const id = String(raw.id ?? slug);
  const title = String(raw.title ?? "문제 은행");
  const subject = raw.subject != null ? String(raw.subject) : undefined;
  const list = Array.isArray(raw.questions) ? raw.questions : null;
  if (!list) throw new Error("'questions' 배열이 없습니다.");
  const questions = list.map((q, i) => normalizeQuestion(q, i));
  return { id, title, subject, questions };
}

export function resolveDataFileName(slug: string): string {
  const e = getRegistryEntry(slug);
  return (e?.dataFile ?? slug).replace(/[\\/]/g, "");
}

export async function loadExamBank(slug: string): Promise<ExamBankFile> {
  if (cache.has(slug)) {
    return cache.get(slug)!;
  }
  if (!getRegistryEntry(slug)) {
    throw new Error("등록되지 않은 시험입니다.");
  }
  const fileName = `${resolveDataFileName(slug)}.json`;
  const full = path.join(process.cwd(), "data", "exams", fileName);
  const text = await readFile(full, "utf-8");
  const raw = JSON.parse(text) as unknown;
  const bank = normalizeBank(raw, slug);
  cache.set(slug, bank);
  return bank;
}

export function getCachedBank(slug: string): ExamBankFile | undefined {
  return cache.get(slug);
}
