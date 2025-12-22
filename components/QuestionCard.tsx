"use client";
import { useState, useEffect } from "react";
import { Question, Option } from "@/lib/types";
import { Star, Check, X } from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";

type UserSelection = string | string[] | Record<number, string> | null;

type AnswerObject = {
  slot?: number;
  order?: number;
  target?: string;
  option_id: string;
};

interface Props {
  question: Question;
  isRandomMode?: boolean;
  showFeedbackImmediate?: boolean;
  onAnswer: (isCorrect: boolean, userSelection: UserSelection) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  // ✅ 1. 新增接口定义
  savedUserAnswer?: UserSelection;
}

export default function QuestionCard({
  question,
  isRandomMode,
  showFeedbackImmediate,
  onAnswer,
  isFavorite,
  onToggleFavorite,
  // ✅ 2. 解构参数
  savedUserAnswer,
}: Props) {
  const [selected, setSelected] = useState<UserSelection>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<Option[]>(
    question.options
  );

  const isSlotQuestion =
    question.type === "DragDrop" || question.type === "Hotspot";
  const slotCount = isSlotQuestion ? question.correct_answer.length : 0;

  // ✅ 3. 核心修复：依赖数组改为 question.id
  useEffect(() => {
    // 如果传入了存档答案，优先恢复
    if (savedUserAnswer) {
      setSelected(savedUserAnswer);
      setIsSubmitted(true);
    } else {
      // 如果没有存档，且题目ID变了，才重置状态
      // 这保证了父组件刷新（如增加错题计数）时，当前选项不会消失
      setSelected(isSlotQuestion ? {} : null);
      setIsSubmitted(false);
    }

    const opts = [...question.options];
    // 只有在新题且无存档时才乱序
    if (!savedUserAnswer && isRandomMode && question.allow_randomize_options) {
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
    }
    setCurrentOptions(opts);

    // ⚠️ 注意这里的依赖：必须是 question.id
  }, [question.id, isRandomMode, isSlotQuestion, savedUserAnswer]);

  const renderCodeSnippet = (text: string) => {
    const parts = text.split(/\{(\d+)\}/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const slotIndex = parseInt(part) + 1;
        return (
          <span
            key={index}
            className="inline-block mx-1 px-2 py-0.5 bg-yellow-400 text-black font-bold rounded border border-yellow-600 select-none"
          >
            [{slotIndex}]
          </span>
        );
      }
      return part;
    });
  };

  const handleSlotChange = (slotIndex: number, optionId: string) => {
    if (isSubmitted) return;
    const currentSlots = (selected as Record<number, string>) || {};
    if (!optionId) {
      const newSlots = { ...currentSlots };
      delete newSlots[slotIndex];
      setSelected(newSlots);
    } else {
      setSelected({ ...currentSlots, [slotIndex]: optionId });
    }
  };

  const getNormalizedSlotIndex = (answerItem: any, index: number): number => {
    if (typeof answerItem === "object" && answerItem !== null) {
      if ("slot" in answerItem) return answerItem.slot;
      if ("order" in answerItem) return answerItem.order - 1;
    }
    return index;
  };

  const handleSubmit = () => {
    // if (selected === null) return;

    let correct = false;

    if (isSlotQuestion) {
      const userSlots = selected as Record<number, string>;
      const correctAnswers = question.correct_answer;

      correct = correctAnswers.every((ans, index) => {
        if (typeof ans === "string") return false;
        const targetSlot = getNormalizedSlotIndex(ans, index);
        return userSlots[targetSlot] === (ans as AnswerObject).option_id;
      });
    } else if (
      question.type === "SingleChoice" ||
      question.type === "Simulation"
    ) {
      correct = question.correct_answer.includes(selected as string);
    } else if (question.type === "MultipleChoice") {
      if (Array.isArray(selected)) {
        const correctIds = question.correct_answer.filter(
          (i): i is string => typeof i === "string"
        );
        const correctSet = new Set(correctIds);
        correct =
          selected.length === correctSet.size &&
          selected.every((s) => correctSet.has(s));
      }
    }

    setIsSubmitted(true);
    onAnswer(correct, selected);
  };

  const renderSlotInputs = () => {
    const slots = Array.from({ length: slotCount }, (_, i) => i);

    return (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-gray-700 mb-2">
          {question.text_map
            ? "Answer the following statements:"
            : (question.correct_answer[0] as any).target
            ? "Match the items:"
            : "Fill in the blanks:"}
        </h3>

        {slots.map((slotIndex) => {
          const userSelection = (selected as Record<number, string>)?.[
            slotIndex
          ];

          const correctItem = (question.correct_answer as any[]).find(
            (a, i) => getNormalizedSlotIndex(a, i) === slotIndex
          );

          let labelContent;
          if (question.text_map && question.text_map[slotIndex.toString()]) {
            labelContent = (
              <span className="text-sm font-medium">
                {question.text_map[slotIndex.toString()]}
              </span>
            );
          } else if ((correctItem as any)?.target) {
            labelContent = (
              <span className="text-sm font-medium">
                {(correctItem as any).target}
              </span>
            );
          } else {
            labelContent = (
              <span className="bg-yellow-200 px-2 py-1 rounded font-bold">
                [{slotIndex + 1}]
              </span>
            );
          }

          const isSlotCorrect =
            isSubmitted && userSelection === correctItem?.option_id;
          const isSlotWrong =
            isSubmitted && userSelection !== correctItem?.option_id;

          const availableOptions = currentOptions.filter(
            (opt) => opt.group === undefined || opt.group === slotIndex
          );

          return (
            <div
              key={slotIndex}
              className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-2 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 sm:w-1/2 text-gray-800">
                {labelContent}
              </div>

              <div className="flex-grow relative sm:w-1/2">
                <select
                  value={userSelection || ""}
                  onChange={(e) => handleSlotChange(slotIndex, e.target.value)}
                  disabled={isSubmitted}
                  className={clsx(
                    "w-full p-2 border rounded appearance-none bg-white border-gray-300 text-sm",
                    showFeedbackImmediate &&
                      isSlotCorrect &&
                      "border-green-500 bg-green-50 text-green-700 font-medium",
                    showFeedbackImmediate &&
                      isSlotWrong &&
                      "border-red-500 bg-red-50 text-red-700"
                  )}
                >
                  <option value="">Select...</option>
                  {availableOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.text}
                    </option>
                  ))}
                </select>

                {showFeedbackImmediate && isSubmitted && (
                  <div className="absolute right-3 top-2.5 pointer-events-none">
                    {isSlotCorrect ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {showFeedbackImmediate && isSubmitted && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-700">
            <span className="font-bold block mb-1 text-green-800">
              Correct Answer:
            </span>
            {question.correct_answer.map((ans, i) => {
              if (typeof ans === "string") return null;
              const safeAns = ans as AnswerObject;
              const slotIdx = getNormalizedSlotIndex(safeAns, i);
              const optText = question.options.find(
                (o) => o.id === safeAns.option_id
              )?.text;

              let feedbackLabel = `[${slotIdx + 1}]`;
              if (question.text_map && question.text_map[slotIdx.toString()]) {
                const fullText = question.text_map[slotIdx.toString()];
                feedbackLabel =
                  fullText.length > 20
                    ? fullText.substring(0, 20) + "..."
                    : fullText;
              } else if (safeAns.target) {
                feedbackLabel = safeAns.target;
              }

              return (
                <div key={i} className="ml-2 mb-1 flex items-start">
                  <span className="font-bold text-gray-500 mr-2 whitespace-nowrap">
                    {feedbackLabel}:
                  </span>
                  <span className="font-mono text-green-700">{optText}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderNormalOptions = () => {
    const correctAnswersList = Array.isArray(question.correct_answer)
      ? question.correct_answer
      : [question.correct_answer];

    return currentOptions.map((opt: Option) => {
      const isSelected = Array.isArray(selected)
        ? selected.includes(opt.id)
        : selected === opt.id;

      const isCorrectOption = correctAnswersList.includes(opt.id);
      const isWrongSelection = isSelected && !isCorrectOption;
      const isResultMode = showFeedbackImmediate && isSubmitted;

      return (
        <div
          key={opt.id}
          onClick={() => {
            if (isResultMode) return;
            if (question.type === "MultipleChoice") {
              const prev = Array.isArray(selected) ? selected : [];
              const prevArray = Array.isArray(prev) ? prev : [];
              const newSelection = prevArray.includes(opt.id)
                ? prevArray.filter((i) => i !== opt.id)
                : [...prevArray, opt.id];
              setSelected(newSelection);
            } else {
              setSelected(opt.id);
            }
          }}
          className={clsx(
            "relative flex items-center p-3 rounded-lg mb-2 border transition-all duration-200 cursor-pointer",
            !isResultMode &&
              !isSelected &&
              "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
            !isResultMode &&
              isSelected &&
              "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:border-blue-400 dark:ring-blue-400",
            isResultMode &&
              isCorrectOption &&
              "border-green-500 bg-green-50 ring-1 ring-green-500 dark:bg-green-900/30 dark:border-green-400 dark:ring-green-400",
            isResultMode &&
              isWrongSelection &&
              "border-red-500 bg-red-50 ring-1 ring-red-500 dark:bg-red-900/30 dark:border-red-400 dark:ring-red-400",
            isResultMode &&
              !isCorrectOption &&
              !isSelected &&
              "border-gray-200 opacity-50 dark:border-gray-700"
          )}
        >
          <span
            className={clsx(
              "text-base",
              isResultMode && isCorrectOption
                ? "font-medium text-green-800 dark:text-green-300"
                : "text-gray-900 dark:text-gray-200",
              isResultMode &&
                isWrongSelection &&
                "text-red-800 dark:text-red-300"
            )}
          >
            {opt.text}
          </span>
          {isResultMode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCorrectOption && (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
              {isWrongSelection && (
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const isSubmitDisabled = () => {
    if (isSlotQuestion) {
      const userSlots = (selected as Record<number, string>) || {};
      return Object.keys(userSlots).length < slotCount;
    }
    return (
      selected === null || (Array.isArray(selected) && selected.length === 0)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 max-w-3xl mx-auto border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {question.topic} | {question.id}
        </span>
        <button
          type="button"
          onClick={onToggleFavorite}
          className="focus:outline-none p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <Star
            className={clsx(
              "w-6 h-6",
              isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            )}
          />
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4 whitespace-pre-line leading-relaxed text-gray-900 dark:text-white">
        {question.question_text}
      </h2>

      {question.code_snippet && (
        <div className="bg-gray-900 p-5 rounded-lg mb-6 overflow-x-auto border border-gray-700 shadow-inner">
          <pre className="text-sm font-mono text-gray-300 leading-loose whitespace-pre-wrap">
            {renderCodeSnippet(question.code_snippet)}
          </pre>
        </div>
      )}

      {question.images && question.images.length > 0 && (
        <div className="mb-6 space-y-4">
          {question.images.map((img) => (
            <div
              key={img}
              className="relative w-full h-auto border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
            >
              <Image
                src={`/assets/images/${img}`}
                alt={`Reference for ${question.id}`}
                width={800}
                height={500}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 space-y-2 text-gray-800 dark:text-gray-200">
        {isSlotQuestion ? renderSlotInputs() : renderNormalOptions()}
      </div>

      {!isSubmitted && (
        <button
          type="button"
          onClick={handleSubmit}
          //   disabled={isSubmitDisabled()}
          disabled={false}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Submit Answer
        </button>
      )}

      {showFeedbackImmediate && isSubmitted && (
        <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-3 text-blue-800 dark:text-blue-200">
            <div className="w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            <h3 className="font-bold text-lg">Explanation</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
