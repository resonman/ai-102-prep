"use client";
import { useState, useEffect } from "react";
import allQuestions from "@/data/data.json";
import QuestionCard from "@/components/QuestionCard";
import { useUserData } from "@/hooks/useUserData";

export default function ExamPage() {
	const { addMistake } = useUserData();
	const [examQuestions, setExamQuestions] = useState<any[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [results, setResults] = useState<Record<string, boolean>>({}); // 记录每题对错
	const [isFinished, setIsFinished] = useState(false);

	// 初始化 50 道随机题
	useEffect(() => {
		const shuffled = [...allQuestions]
			.sort(() => 0.5 - Math.random())
			.slice(0, 50);
		setExamQuestions(shuffled);
	}, []);

	const handleAnswer = (isCorrect: boolean) => {
		setResults((prev) => ({
			...prev,
			[examQuestions[currentIndex].id]: isCorrect,
		}));

		if (!isCorrect) {
			addMistake(examQuestions[currentIndex].id); // 错题自动入库
		}

		if (currentIndex < 49) {
			setTimeout(() => setCurrentIndex((prev) => prev + 1), 300); // 自动下一题
		} else {
			setIsFinished(true);
		}
	};

	if (examQuestions.length === 0) return <div>Loading Exam...</div>;

	if (isFinished) {
		const correctCount = Object.values(results).filter(Boolean).length;
		const wrongQuestions = examQuestions.filter((q) => results[q.id] === false);

		return (
			<div className="max-w-3xl mx-auto p-6">
				<h1 className="text-2xl font-bold mb-4">Exam Result</h1>
				<p className="text-xl mb-6">Score: {correctCount} / 50</p>

				<h2 className="text-lg font-bold text-red-500 mb-4">
					Review Wrong Answers:
				</h2>
				<div className="space-y-6">
					{wrongQuestions.map((q) => (
						<div key={q.id} className="border p-4 rounded bg-white">
							<h3 className="font-bold">{q.question_text}</h3>
							<p className="text-green-600 mt-2 font-mono">
								Correct: {JSON.stringify(q.correct_answer)}
							</p>
							<p className="text-gray-600 mt-1 text-sm">{q.explanation}</p>
						</div>
					))}
				</div>
			</div>
		);
	}

	const currentQ = examQuestions[currentIndex];

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			<div className="mb-4 text-center">Question {currentIndex + 1} / 50</div>
			<QuestionCard
				key={currentQ.id}
				question={currentQ}
				isRandomMode={true} // 开启选项乱序
				showFeedbackImmediate={false} // 考试模式不显示解析
				onAnswer={handleAnswer}
				isFavorite={false} // 考试时一般不操作收藏，或者你可以加上
				onToggleFavorite={() => {}}
			/>
		</div>
	);
}
