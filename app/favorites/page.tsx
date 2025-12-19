"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react"; // ✅ 引入 RotateCcw
import { Question } from "@/lib/types";

export default function FavoritesPage() {
  const { userData, loading, toggleFavorite, saveFavoritesProgress } =
    useUserData();
  const favList = allQuestions.filter((q) => userData.favorites.includes(q.id));

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      const savedIndex = userData.favoritesIndex || 0;
      setIndex(savedIndex >= favList.length ? 0 : savedIndex);
    }
  }, [loading, userData.favoritesIndex, favList.length]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (favList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          No Favorites Yet
        </h2>
        <p className="text-gray-500 mb-6">
          Mark questions with the star icon to see them here.
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

  const safeIndex = Math.min(index, favList.length - 1);
  const currentQ = favList[safeIndex] as Question;

  const handleNext = () => {
    const nextIndex = safeIndex + 1;
    if (nextIndex < favList.length) {
      setIndex(nextIndex);
      saveFavoritesProgress(nextIndex);
    }
  };

  const handlePrev = () => {
    const prevIndex = safeIndex - 1;
    if (prevIndex >= 0) {
      setIndex(prevIndex);
      saveFavoritesProgress(prevIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <Home className="w-5 h-5 mr-1" /> Home
        </Link>
        <span className="font-bold text-yellow-600">
          Favorites ({safeIndex + 1} / {favList.length})
        </span>

        {/* ✅ Reset 按钮 */}
        <button
          onClick={() => {
            if (confirm("Reset favorites progress to start?")) {
              setIndex(0);
              saveFavoritesProgress(0);
            }
          }}
          className="flex items-center text-gray-500 text-sm hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </button>
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={false}
        showFeedbackImmediate={true}
        onAnswer={() => {}}
        isFavorite={true}
        onToggleFavorite={() => toggleFavorite(currentQ.id)}
        // 收藏夹也可以显示你上次做这道题选了什么
        savedUserAnswer={
          userData.answers ? userData.answers[currentQ.id] : null
        }
      />

      <div className="max-w-3xl mx-auto mt-6 flex justify-between items-center">
        <button
          disabled={safeIndex === 0}
          onClick={handlePrev}
          className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          disabled={safeIndex === favList.length - 1}
          onClick={handleNext}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
