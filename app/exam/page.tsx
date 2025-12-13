"use client";
import { useState, useEffect } from "react";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useUserData } from "@/hooks/useUserData";
import Link from "next/link"; // ✅
import { Home } from "lucide-react"; // ✅
import { Question } from "@/lib/types";

export default function ExamPage() {
  const { addMistake } = useUserData();
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const shuffled = [...allQuestions]
      .sort(() => 0.5 - Math.random())
      .slice(0, 50);
    setExamQuestions(shuffled as Question[]);
  }, []);

  const handleAnswer = (isCorrect: boolean, selection: any) => {
    setResults((prev) => ({
      ...prev,
      [examQuestions[currentIndex].id]: isCorrect,
    }));
    if (!isCorrect) addMistake(examQuestions[currentIndex].id);

    if (currentIndex < 49) {
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
    } else {
      setIsFinished(true);
    }
  };

  if (examQuestions.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Generating Exam...
      </div>
    );

  // 考试结果页面的 Home 按钮
  if (isFinished) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const wrongQuestions = examQuestions.filter((q) => results[q.id] === false);

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Exam Result</h1>
            <Link
              href="/"
              className="flex items-center text-blue-600 font-bold hover:underline"
            >
              <Home className="w-5 h-5 mr-2" /> Back Home
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 text-center">
            <p className="text-gray-500 mb-2">Your Score</p>
            <p className="text-5xl font-black text-blue-600">
              {correctCount}{" "}
              <span className="text-2xl text-gray-400">/ 50</span>
            </p>
          </div>

          {wrongQuestions.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-red-600 mb-4">
                Review Mistakes ({wrongQuestions.length})
              </h2>
              <div className="space-y-6">
                {wrongQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="border p-5 rounded-lg bg-white shadow-sm"
                  >
                    <h3 className="font-bold text-gray-800 mb-2">
                      {q.question_text}
                    </h3>
                    <div className="text-sm bg-green-50 text-green-800 p-3 rounded border border-green-100">
                      <span className="font-bold">Explanation:</span>{" "}
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQ = examQuestions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* ✅ 考试中的顶部导航 */}
      <div className="mb-6 flex justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="flex items-center text-gray-500 hover:text-red-600 transition-colors text-sm"
          onClick={(e) => {
            if (!confirm("Quit exam? Progress will be lost."))
              e.preventDefault();
          }}
        >
          <Home className="w-4 h-4 mr-1" />
          Quit Exam
        </Link>
        <span className="font-bold text-gray-700">
          Question {currentIndex + 1} / 50
        </span>
        <div className="w-16"></div> {/* 占位符，保持中间居中 */}
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={true}
        showFeedbackImmediate={false}
        onAnswer={handleAnswer}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />
    </div>
  );
}
