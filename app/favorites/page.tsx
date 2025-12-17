"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState } from "react";
import Link from "next/link"; // ✅
import { Home } from "lucide-react"; // ✅
import { Question } from "@/lib/types";

export default function FavoritesPage() {
  const { userData, toggleFavorite } = useUserData();
  const favoritesList = allQuestions.filter((q) =>
    userData.favorites.includes(q.id)
  );
  const [index, setIndex] = useState(0);

  if (favoritesList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          No Favorites Yet
        </h2>
        <p className="text-gray-500 mb-6">
          Use the star icon to bookmark questions.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const safeIndex = Math.min(index, favoritesList.length - 1);
  const currentQ = favoritesList[safeIndex] as Question;

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
        <span className="font-bold text-yellow-600">
          Favorites ({safeIndex + 1} / {favoritesList.length})
        </span>
        <div className="w-16"></div>
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={false}
        showFeedbackImmediate={true}
        onAnswer={() => {}}
        isFavorite={true}
        onToggleFavorite={() => toggleFavorite(currentQ.id)}
      />

      <div className="max-w-3xl mx-auto mt-6 flex justify-between">
        <button
          disabled={safeIndex === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={safeIndex === favoritesList.length - 1}
          onClick={() => setIndex((i) => i + 1)}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
