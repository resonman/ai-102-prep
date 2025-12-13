"use client";
import { useState, useEffect } from "react";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useUserData } from "@/hooks/useUserData";
import { Question } from "@/lib/types";
import Link from "next/link"; // ✅ 引入 Link
import { Home } from "lucide-react"; // ✅ 引入 Home 图标

export default function PracticePage() {
  const { userData, loading, saveProgress, toggleFavorite, addMistake } =
    useUserData();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentIndex(userData.practiceIndex || 0);
    }
  }, [loading, userData.practiceIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Syncing progress...
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(
    Math.max(0, currentIndex),
    allQuestions.length - 1
  );
  const currentQ = allQuestions[safeIndex] as Question;

  const handleAnswer = (isCorrect: boolean) => {
    if (!isCorrect) addMistake(currentQ.id);
  };

  const nextQuestion = () => {
    const next = safeIndex + 1;
    if (next < allQuestions.length) {
      setCurrentIndex(next);
      saveProgress(next);
    }
  };

  const prevQuestion = () => {
    const prev = safeIndex - 1;
    if (prev >= 0) {
      setCurrentIndex(prev);
      saveProgress(prev);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* ✅ 顶部导航栏 */}
      <div className="mb-6 flex justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/"
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <Home className="w-5 h-5 mr-1" />
          Home
        </Link>

        <span className="text-gray-800 font-bold">
          {safeIndex + 1}{" "}
          <span className="text-gray-400 font-normal">
            / {allQuestions.length}
          </span>
        </span>

        <button
          onClick={() => {
            if (confirm("Reset progress to Question 1?")) {
              setCurrentIndex(0);
              saveProgress(0);
            }
          }}
          className="text-red-500 text-sm hover:text-red-700 hover:underline transition-colors"
        >
          Reset
        </button>
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={false}
        showFeedbackImmediate={true}
        onAnswer={handleAnswer}
        isFavorite={userData.favorites.includes(currentQ.id)}
        onToggleFavorite={() => toggleFavorite(currentQ.id)}
      />

      <div className="max-w-3xl mx-auto mt-6 flex justify-between">
        <button
          onClick={prevQuestion}
          disabled={safeIndex === 0}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={nextQuestion}
          disabled={safeIndex === allQuestions.length - 1}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
