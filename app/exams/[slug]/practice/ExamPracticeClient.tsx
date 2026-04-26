"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { checkAnswer, getPublicQuestion, type PublicQuestion } from "../../actions";

type Mode = "random20" | "sequential";

type Props = {
  slug: string;
  total: number;
  title: string;
};

function shuffleIndices(n: number, take: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  if (take >= n) return arr;
  return arr.slice(0, take);
}

export function ExamPracticeClient({ slug, total, title }: Props) {
  const [mode, setMode] = useState<Mode>("random20");
  const [order, setOrder] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [q, setQ] = useState<PublicQuestion | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctIndex: number;
    explanation: string | null;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const sessionSize = useMemo(
    () => (mode === "random20" ? Math.min(20, total) : total),
    [mode, total],
  );

  const startSession = useCallback(() => {
    setError("");
    setResult(null);
    setChoice(null);
    setPos(0);
    setScore(0);
    const ord =
      mode === "sequential"
        ? Array.from({ length: total }, (_, i) => i)
        : shuffleIndices(total, Math.min(20, total));
    setOrder(ord);
  }, [mode, total]);

  useEffect(() => {
    if (!order || order.length === 0) return;
    setError("");
    setResult(null);
    setChoice(null);
    const idx = order[pos]!;
    startTransition(async () => {
      const res = await getPublicQuestion(slug, idx);
      if ("error" in res) {
        setError(res.error);
        setQ(null);
        return;
      }
      setQ(res);
    });
  }, [order, pos, slug]);

  if (total < 1) {
    return (
      <p className="text-sm text-amber-800">
        문제 데이터가 없습니다. JSON에 questions 배열이 있는지 확인해 주세요.
      </p>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">풀이 방식을 고른 뒤 시작하세요.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("random20")}
            className={
              mode === "random20"
                ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            }
          >
            20문제 랜덤
            {total < 20 ? ` (${total}문제)` : ""}
          </button>
          <button
            type="button"
            onClick={() => setMode("sequential")}
            className={
              mode === "sequential"
                ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800"
            }
          >
            전체 {total}문제 순서대로
          </button>
        </div>
        <button
          type="button"
          onClick={startSession}
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          연습 시작
        </button>
        <p className="text-xs text-slate-500">
          세션 문항: {sessionSize}개
        </p>
      </div>
    );
  }

  const currentNum = pos + 1;
  const last = pos >= order.length - 1;

  function submit() {
    if (choice == null || !q || !order) return;
    setError("");
    const idx = order[pos]!;
    startTransition(async () => {
      try {
        const r = await checkAnswer(slug, idx, choice);
        setResult(r);
        if (r.correct) setScore((s) => s + 1);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "채점 실패");
      }
    });
  }

  function next() {
    if (last) {
      setOrder(null);
      setQ(null);
      return;
    }
    setPos((p) => p + 1);
  }

  if (error && !q) {
    return (
      <p className="text-sm text-red-700">
        {error}{" "}
        <Link href="/exams" className="font-medium text-blue-700 underline">
          목록으로
        </Link>
      </p>
    );
  }

  if (!q) {
    return <p className="text-sm text-slate-600">불러오는 중…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          문항 {currentNum} / {order.length} (총 풀 {total}문 중)
        </span>
        <span className="font-medium text-slate-900">맞힌 개수: {score}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-7 text-slate-900">{q.question}</p>
        <ul className="mt-4 space-y-2">
          {q.options.map((opt, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/60">
                <input
                  type="radio"
                  name="c"
                  className="mt-0.5"
                  checked={choice === i}
                  disabled={!!result}
                  onChange={() => setChoice(i)}
                />
                <span className="text-slate-800">
                  {i + 1}. {opt}
                </span>
              </label>
            </li>
          ))}
        </ul>

        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}

        {result ? (
          <div
            className={
              result.correct
                ? "mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                : "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            }
          >
            <p className="font-medium">
              {result.correct ? "정답입니다." : "오답입니다."}
              {!result.correct
                ? ` (정답: ${result.correctIndex + 1}번)`
                : null}
            </p>
            {result.explanation ? (
              <p className="mt-2 text-slate-800">{result.explanation}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {!result ? (
            <button
              type="button"
              disabled={choice == null || pending}
              onClick={submit}
              className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              채점
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white"
            >
              {last ? "세션 끝" : "다음 문항"}
            </button>
          )}
        </div>
      </div>

      {order && !last && !result && (
        <p className="text-xs text-slate-500" aria-live="polite">
          채점한 뒤 다음으로 넘어갈 수 있어요.
        </p>
      )}
    </div>
  );
}
