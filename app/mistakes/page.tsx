"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState } from "react";

export default function MistakesPage() {
	const { userData, removeMistake, toggleFavorite } = useUserData();
	// 根据 ID 过滤出题目对象
	const mistakesList = allQuestions.filter((q) =>
		userData.mistakes.includes(q.id)
	);
	const [index, setIndex] = useState(0);

	if (mistakesList.length === 0)
		return <div className="p-10 text-center">No mistakes yet! Great job!</div>;

	const currentQ = mistakesList[index] as any;

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			<h1 className="text-center font-bold mb-4">
				Mistake Notebook ({index + 1} / {mistakesList.length})
			</h1>

			<QuestionCard
				key={currentQ.id}
				question={currentQ}
				isRandomMode={false} // 错题本保持原序
				showFeedbackImmediate={true}
				onAnswer={() => {}}
				isFavorite={userData.favorites.includes(currentQ.id)}
				onToggleFavorite={() => toggleFavorite(currentQ.id)}
			/>

			<div className="max-w-3xl mx-auto mt-4 flex justify-between">
				<button
					onClick={() => removeMistake(currentQ.id)}
					className="text-green-600 font-bold"
				>
					I Mastered This! (Remove)
				</button>

				<div className="space-x-2">
					<button
						disabled={index === 0}
						onClick={() => setIndex((i) => i - 1)}
						className="px-4 py-2 bg-gray-300 rounded"
					>
						Prev
					</button>
					<button
						disabled={index === mistakesList.length - 1}
						onClick={() => setIndex((i) => i + 1)}
						className="px-4 py-2 bg-gray-300 rounded"
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
}
