"use client";
import { useUserData } from "@/hooks/useUserData";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useState } from "react";
import Link from "next/link";
import { Question } from "@/lib/types"; // ✅ 1. 引入类型

export default function FavoritesPage() {
	const { userData, toggleFavorite } = useUserData();

	// 过滤出收藏的题目
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
					Mark questions with the star icon to review them here.
				</p>
				<Link href="/" className="text-blue-600 hover:underline">
					Back to Home
				</Link>
			</div>
		);
	}

	// ✅ 2. 使用具体类型替代 any
	const currentQ = favoritesList[index] as Question;

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			<div className="max-w-3xl mx-auto mb-4 flex justify-between items-center">
				<h1 className="font-bold text-gray-800">
					Favorites ({index + 1} / {favoritesList.length})
				</h1>
				<Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
					Exit
				</Link>
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
					disabled={index === 0}
					onClick={() => setIndex((i) => i - 1)}
					className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm disabled:opacity-50"
				>
					Previous
				</button>
				<button
					disabled={index === favoritesList.length - 1}
					onClick={() => setIndex((i) => i + 1)}
					className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-sm disabled:opacity-50"
				>
					Next
				</button>
			</div>
		</div>
	);
}
