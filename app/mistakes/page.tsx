"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState } from "react";
import Link from "next/link"; // ✅
import { Home, Trash2 } from "lucide-react"; // ✅
import { Question } from "@/lib/types";

export default function MistakesPage() {
  const { userData, removeMistake, toggleFavorite } = useUserData();
  const mistakesList = allQuestions.filter((q) =>
    userData.mistakes.includes(q.id)
  );
  const [index, setIndex] = useState(0);

  if (mistakesList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Clean Sheet! 🎉
        </h2>
        <p className="text-gray-500 mb-6">You have no mistakes to review.</p>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // 防止移除最后一题后索引越界
  const safeIndex = Math.min(index, mistakesList.length - 1);
  const currentQ = mistakesList[safeIndex] as Question;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* ✅ 顶部导航 */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <Home className="w-5 h-5 mr-1" /> Home
        </Link>
        <span className="font-bold text-red-600">
          Mistakes ({safeIndex + 1} / {mistakesList.length})
        </span>
        <div className="w-16"></div>
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={false}
        showFeedbackImmediate={true}
        onAnswer={() => {}}
        isFavorite={userData.favorites.includes(currentQ.id)}
        onToggleFavorite={() => toggleFavorite(currentQ.id)}
      />

      <div className="max-w-3xl mx-auto mt-6 flex justify-between items-center">
        <div className="space-x-2">
          <button
            disabled={safeIndex === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={safeIndex === mistakesList.length - 1}
            onClick={() => setIndex((i) => i + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <button
          onClick={() => {
            removeMistake(currentQ.id);
            // 移除后如果是最后一题，索引会自动调整
          }}
          className="flex items-center text-green-600 font-bold hover:bg-green-50 px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />I Mastered This!
        </button>
      </div>
    </div>
  );
}
