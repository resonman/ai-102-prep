"use client";
import { useState, useEffect } from "react";
import { Question, Option } from "@/lib/types";
import { Star } from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";

type UserSelection = string | string[] | null;

interface Props {
	question: Question;
	isRandomMode?: boolean;
	showFeedbackImmediate?: boolean;
	onAnswer: (isCorrect: boolean, userSelection: UserSelection) => void;
	isFavorite: boolean;
	onToggleFavorite: () => void;
}

export default function QuestionCard({
	question,
	isRandomMode,
	showFeedbackImmediate,
	onAnswer,
	isFavorite,
	onToggleFavorite,
}: Props) {
	const [selected, setSelected] = useState<UserSelection>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	// 1. 初始状态直接使用原题目的选项顺序（保证 SSR 匹配）
	const [displayOptions, setDisplayOptions] = useState<Option[]>(
		question.options
	);

	// 2. 使用 useEffect 处理随机化
	// 这会将随机逻辑推迟到客户端挂载之后，避开"Impure function"错误
	useEffect(() => {
		// 重置选择状态
		setSelected(null);
		setIsSubmitted(false);

		// 创建副本
		const opts = [...question.options];

		// 仅在开启随机模式且题目允许时打乱
		if (isRandomMode && question.allow_randomize_options) {
			// Fisher-Yates Shuffle (比 sort 随机性更好，且完全合规)
			for (let i = opts.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[opts[i], opts[j]] = [opts[j], opts[i]];
			}
		}

		// 更新显示的选项
		setDisplayOptions(opts);

		// 3. 关键：依赖项只写 question.id 和 isRandomMode
		// 这样只有切题或切换模式时才会触发，不会导致死循环或级联更新警告
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [question.id, isRandomMode]);

	const handleSubmit = () => {
		if (selected === null) return;

		let correct = false;

		if (question.type === "SingleChoice" || question.type === "Simulation") {
			correct = question.correct_answer.includes(selected as string);
		} else if (question.type === "MultipleChoice") {
			if (Array.isArray(selected)) {
				const correctSet = new Set(question.correct_answer as string[]);
				correct =
					selected.length === correctSet.size &&
					selected.every((s) => correctSet.has(s));
			}
		} else {
			correct = true;
		}

		setIsSubmitted(true);
		onAnswer(correct, selected);
	};

	const renderOptions = () => {
		// 使用 state 中的 displayOptions 渲染
		return displayOptions.map((opt: Option) => {
			const isSelected = Array.isArray(selected)
				? selected.includes(opt.id)
				: selected === opt.id;

			let styleClass =
				"border p-3 rounded cursor-pointer hover:bg-gray-50 mb-2 transition-colors";

			if (isSelected)
				styleClass += " border-blue-500 bg-blue-50 ring-1 ring-blue-500";

			if (showFeedbackImmediate && isSubmitted) {
				// 类型断言处理正确答案
				const correctIds = question.correct_answer as unknown as string[];
				// 为了兼容旧数据结构，增加防御性检查
				const isCorrectOption = Array.isArray(correctIds)
					? correctIds.includes(opt.id)
					: correctIds === opt.id;

				if (isCorrectOption) {
					styleClass = "border-green-500 bg-green-100 ring-1 ring-green-500";
				} else if (isSelected && !isCorrectOption) {
					styleClass = "border-red-500 bg-red-100 ring-1 ring-red-500";
				}
			}

			return (
				<div
					key={opt.id}
					className={styleClass}
					onClick={() => {
						if (showFeedbackImmediate && isSubmitted) return;

						if (question.type === "MultipleChoice") {
							const prev = Array.isArray(selected) ? selected : [];
							// 确保 prev 是数组
							const prevArray = Array.isArray(prev) ? prev : [];

							const newSelection = prevArray.includes(opt.id)
								? prevArray.filter((i) => i !== opt.id)
								: [...prevArray, opt.id];
							setSelected(newSelection);
						} else {
							setSelected(opt.id);
						}
					}}
				>
					{opt.text}
				</div>
			);
		});
	};

	return (
		<div className="bg-white shadow rounded-lg p-6 max-w-3xl mx-auto">
			<div className="flex justify-between items-start mb-4">
				<span className="text-sm font-bold text-gray-500">
					{question.topic} | {question.id}
				</span>

				<button
					type="button"
					onClick={onToggleFavorite}
					aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
					className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 rounded-full p-1"
				>
					<Star
						className={clsx(
							"w-6 h-6",
							isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
						)}
					/>
				</button>
			</div>

			<h2 className="text-lg font-semibold mb-4 whitespace-pre-line leading-relaxed text-gray-900">
				{question.question_text}
			</h2>

			{question.code_snippet && (
				<div className="bg-gray-100 p-4 rounded mb-4 overflow-x-auto border border-gray-200">
					<pre className="text-sm font-mono text-gray-800">
						{question.code_snippet}
					</pre>
				</div>
			)}

			{question.images && question.images.length > 0 && (
				<div className="mb-6 space-y-4">
					{question.images.map((img) => (
						<div
							key={img}
							className="relative w-full h-auto border rounded overflow-hidden"
						>
							<Image
								src={`/assets/images/${img}`}
								alt={`Reference for ${question.id}`}
								width={800}
								height={500}
								style={{ width: "100%", height: "auto" }}
								onError={() => {
									// 可选：图片加载失败时的处理
									console.warn(`Image failed to load: ${img}`);
								}}
							/>
						</div>
					))}
				</div>
			)}

			<div className="mb-6 space-y-2 text-gray-800">{renderOptions()}</div>

			{!isSubmitted && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={
						selected === null ||
						(Array.isArray(selected) && selected.length === 0)
					}
					className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
				>
					Submit Answer
				</button>
			)}

			{showFeedbackImmediate && isSubmitted && (
				<div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200 animate-in fade-in duration-300">
					<h3 className="font-bold text-blue-800 mb-2">Explanation</h3>
					<p className="text-gray-700 leading-relaxed text-sm">
						{question.explanation}
					</p>
				</div>
			)}
		</div>
	);
}
