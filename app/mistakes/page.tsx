"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Trash2, AlertCircle, RotateCcw } from "lucide-react";
import { Question } from "@/lib/types";

export default function MistakesPage() {
  // ✅ 1. 引入 addMistake 和 recordAnswer
  const {
    userData,
    loading,
    removeMistake,
    addMistake, // <--- 新增
    recordAnswer, // <--- 新增
    toggleFavorite,
    saveMistakesProgress,
  } = useUserData();

  const mistakesList = allQuestions.filter((q) =>
    userData.mistakes.includes(q.id)
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!loading) {
      const savedIndex = userData.mistakesIndex || 0;
      setIndex(savedIndex >= mistakesList.length ? 0 : savedIndex);
    }
  }, [loading, userData.mistakesIndex, mistakesList.length]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

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

  const safeIndex = Math.min(index, mistakesList.length - 1);
  const currentQ = mistakesList[safeIndex] as Question;
  const mistakeCount = userData.mistakeCounts[currentQ.id] || 1;

  const handleNext = () => {
    const nextIndex = safeIndex + 1;
    if (nextIndex < mistakesList.length) {
      setIndex(nextIndex);
      saveMistakesProgress(nextIndex);
    }
  };

  const handlePrev = () => {
    const prevIndex = safeIndex - 1;
    if (prevIndex >= 0) {
      setIndex(prevIndex);
      saveMistakesProgress(prevIndex);
    }
  };

  // ✅ 2. 定义处理答题的逻辑
  const handleAnswer = (isCorrect: boolean, userSelection: any) => {
    // 无论对错，都更新一下“我最后一次选了什么”，这样下次进来看到的是最新的
    recordAnswer(currentQ.id, userSelection);

    if (!isCorrect) {
      // 如果在错题本里又做错了，调用 addMistake
      // 我们之前的逻辑里，addMistake 会自动让 count + 1
      addMistake(currentQ.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 顶部导航 (不变) */}
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
        <button
          onClick={() => {
            if (confirm("Reset review progress to start?")) {
              setIndex(0);
              saveMistakesProgress(0);
            }
          }}
          className="flex items-center text-gray-500 text-sm hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </button>
      </div>

      {/* 错误次数提示 (不变) */}
      <div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center justify-between text-red-800 text-sm">
        <div className="flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>
            You have missed this question <strong>{mistakeCount}</strong> time
            {mistakeCount > 1 ? "s" : ""}.
          </span>
        </div>
      </div>

      <QuestionCard
        key={currentQ.id}
        question={currentQ}
        isRandomMode={false}
        showFeedbackImmediate={true}
        // ✅ 3. 将 handleAnswer 传进去 (之前这里是空函数 () => {})
        onAnswer={handleAnswer}
        isFavorite={userData.favorites.includes(currentQ.id)}
        onToggleFavorite={() => toggleFavorite(currentQ.id)}
        // 注意：如果你希望每次进来都能“重新做题”，可以把下面这行 savedUserAnswer 注释掉
        // 如果保留下面这行，你进来时看到的是上次选的答案（如果是错的，那你就不能再点一次来增加错误次数了，除非你先去别的页面再回来？）
        // 建议：保留 savedUserAnswer，但理解为“只有当你改变主意选了另一个错选项时，次数才会增加”。
        savedUserAnswer={
          userData.answers ? userData.answers[currentQ.id] : null
        }
      />

      {/* 底部按钮 (不变) */}
      <div className="max-w-3xl mx-auto mt-6 flex justify-between items-center">
        <div className="space-x-2">
          <button
            disabled={safeIndex === 0}
            onClick={handlePrev}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            disabled={safeIndex === mistakesList.length - 1}
            onClick={handleNext}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        <button
          onClick={() => removeMistake(currentQ.id)}
          className="flex items-center text-green-600 font-bold hover:bg-green-50 px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />I Mastered This!
        </button>
      </div>
    </div>
  );
}
