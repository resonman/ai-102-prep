"use client";
import { useState, useEffect } from "react";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useUserData } from "@/hooks/useUserData";
import { Question } from "@/lib/types"; // ✅ 1. 引入类型

export default function PracticePage() {
	const { userData, saveProgress, toggleFavorite, addMistake } = useUserData();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [hasSynced, setHasSynced] = useState(false);

	useEffect(() => {
		if (!hasSynced && typeof userData.practiceIndex === "number") {
			const cloudIndex = userData.practiceIndex;
			if (cloudIndex >= 0) {
				setTimeout(() => {
					setCurrentIndex(cloudIndex);
					setHasSynced(true);
				}, 0);
			}
		}
	}, [userData.practiceIndex, hasSynced]);

	const safeIndex = Math.min(
		Math.max(0, currentIndex),
		allQuestions.length - 1
	);

	// ✅ 2. 使用具体类型替代 any
	const currentQ = allQuestions[safeIndex] as Question;

	const handleAnswer = (isCorrect: boolean) => {
		if (!isCorrect) {
			addMistake(currentQ.id);
		}
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
			<div className="mb-4 flex justify-between items-center max-w-3xl mx-auto">
				<span className="text-gray-700 font-medium">
					Progress: {safeIndex + 1} / {allQuestions.length}
				</span>
				<button
					onClick={() => {
						setCurrentIndex(0);
						saveProgress(0);
					}}
					className="text-red-500 text-sm hover:underline"
				>
					Reset Progress
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
					className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Previous
				</button>

				<button
					onClick={nextQuestion}
					disabled={safeIndex === allQuestions.length - 1}
					className="px-6 py-2 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next Question
				</button>
			</div>
		</div>
	);
}
