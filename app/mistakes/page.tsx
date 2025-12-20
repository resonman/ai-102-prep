"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Trash2, AlertCircle, RotateCcw } from "lucide-react";
import { Question } from "@/lib/types";

export default function MistakesPage() {
	const {
		userData,
		loading,
		removeMistake,
		toggleFavorite,
		saveMistakesProgress,
		addMistake, // ✅ 引入
	} = useUserData();

	const mistakesList = allQuestions.filter((q) =>
		userData.mistakes.includes(q.id)
	);

	const [index, setIndex] = useState(0);

	// 同步数据库进度
	useEffect(() => {
		if (!loading) {
			const savedIndex = userData.mistakesIndex || 0;
			setIndex(savedIndex >= mistakesList.length ? 0 : savedIndex);
		}
	}, [loading, userData.mistakesIndex, mistakesList.length]);

	if (loading)
		return <div className="p-10 text-center">Loading progress...</div>;

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

	// ✅ 获取该题的错误次数，默认为1（因为已经在错题本里了至少错了一次）
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

	// ✅ 处理答题：如果错，计数+1
	const handleAnswer = (isCorrect: boolean) => {
		if (!isCorrect) {
			addMistake(currentQ.id);
		}
		// 注意：这里不需要 recordAnswer，因为我们不保存本次错题本的答案供下次查看
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
				<span className="font-bold text-red-600">
					Mistakes ({safeIndex + 1} / {mistakesList.length})
				</span>

				{/* ✅ Reset 按钮：只重置页码，不重置错误次数 */}
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

			{/* ✅ 错误次数提示条 */}
			<div className="max-w-3xl mx-auto mb-4 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center justify-between text-red-800 text-sm animate-in fade-in slide-in-from-top-2">
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
				onAnswer={handleAnswer}
				isFavorite={userData.favorites.includes(currentQ.id)}
				onToggleFavorite={() => toggleFavorite(currentQ.id)}
				// ✅ 核心：显式传入 null，每次都是新题
				savedUserAnswer={null}
			/>

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
					onClick={() => {
						removeMistake(currentQ.id);
						// 移除后 React 会自动重新渲染，处理边界逻辑在 useEffect 里
					}}
					className="flex items-center text-green-600 font-bold hover:bg-green-50 px-4 py-2 rounded-lg transition-colors"
				>
					<Trash2 className="w-4 h-4 mr-2" />I Mastered This!
				</button>
			</div>
		</div>
	);
}
