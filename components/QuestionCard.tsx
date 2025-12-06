"use client";
import { useState, useEffect } from "react";
import { Question, Option, CorrectAnswerItem } from "@/lib/types";
import { Star, Check, X } from "lucide-react";
import Image from "next/image";
import { clsx } from "clsx";

// 定义用户选择的类型
type UserSelection = string | string[] | Record<number, string> | null;

// 辅助类型：填空题答案结构
type SlotAnswer = { slot: number; option_id: string };

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
  // 状态管理
  const [selected, setSelected] = useState<UserSelection>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 使用 state 存储显示的选项（解决 Impure Function 报错）
  // 初始化时直接使用原顺序，确保 SSR 一致性
  const [currentOptions, setCurrentOptions] = useState<Option[]>(
    question.options
  );

  // 判断是否为填空类题目
  const isSlotQuestion =
    question.type === "DragDrop" || question.type === "Hotspot";
  const slotCount = isSlotQuestion ? question.correct_answer.length : 0;

  // 1. 处理选项乱序 (副作用放在 useEffect)
  useEffect(() => {
    // 重置选择状态
    setSelected(isSlotQuestion ? {} : null);
    setIsSubmitted(false);

    // 准备选项副本
    const opts = [...question.options];

    // 仅在客户端且开启随机模式时打乱
    if (isRandomMode && question.allow_randomize_options) {
      // Fisher-Yates Shuffle
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
    }

    // 更新状态
    setCurrentOptions(opts);
  }, [question, isRandomMode, isSlotQuestion]);

  // 辅助函数：渲染高亮代码块
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

  // 处理填空题的选择变更
  const handleSlotChange = (slotIndex: number, optionId: string) => {
    if (isSubmitted) return;

    // 类型断言：确信当前 selected 是 Record 类型（由 useEffect 初始化）
    const currentSlots = (selected as Record<number, string>) || {};

    if (!optionId) {
      const newSlots = { ...currentSlots };
      delete newSlots[slotIndex];
      setSelected(newSlots);
    } else {
      setSelected({ ...currentSlots, [slotIndex]: optionId });
    }
  };

  const handleSubmit = () => {
    if (selected === null) return;

    let correct = false;

    if (isSlotQuestion) {
      const userSlots = selected as Record<number, string>;
      // 类型守卫：确保 correct_answer 是 SlotAnswer 数组
      const correctSlots = question.correct_answer.filter(
        (item): item is SlotAnswer => typeof item === "object" && "slot" in item
      );

      correct = correctSlots.every(
        (ans) => userSlots[ans.slot] === ans.option_id
      );
    } else if (
      question.type === "SingleChoice" ||
      question.type === "Simulation"
    ) {
      correct = question.correct_answer.includes(selected as string);
    } else if (question.type === "MultipleChoice") {
      if (Array.isArray(selected)) {
        // 类型守卫：确保 correct_answer 是 string[]
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

  // 渲染填空题 UI (下拉菜单)
  const renderSlotInputs = () => {
    const slots = Array.from({ length: slotCount }, (_, i) => i);

    return (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-bold text-gray-700 mb-2">Fill in the blanks:</h3>
        {slots.map((slotIndex) => {
          const userSelection = (selected as Record<number, string>)?.[
            slotIndex
          ];

          // 查找正确答案 (使用类型守卫查找)
          const correctItem = question.correct_answer.find(
            (a): a is SlotAnswer =>
              typeof a === "object" && "slot" in a && a.slot === slotIndex
          );

          const isSlotCorrect =
            isSubmitted && userSelection === correctItem?.option_id;
          const isSlotWrong =
            isSubmitted && userSelection !== correctItem?.option_id;

          // 过滤选项 (Hotspot 分组逻辑)
          const availableOptions = currentOptions.filter(
            (opt) => opt.group === undefined || opt.group === slotIndex
          );

          return (
            <div key={slotIndex} className="flex items-center space-x-3">
              <div className="w-16 shrink-0 font-bold text-gray-600 bg-yellow-200 px-2 py-1 rounded text-center">
                [{slotIndex + 1}]
              </div>

              <div className="grow relative">
                <select
                  value={userSelection || ""}
                  onChange={(e) => handleSlotChange(slotIndex, e.target.value)}
                  disabled={isSubmitted}
                  className={clsx(
                    "w-full p-2 border rounded appearance-none bg-white",
                    showFeedbackImmediate &&
                      isSlotCorrect &&
                      "border-green-500 bg-green-50 text-green-700",
                    showFeedbackImmediate &&
                      isSlotWrong &&
                      "border-red-500 bg-red-50 text-red-700"
                  )}
                >
                  <option value="">Select an answer...</option>
                  {availableOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.text}
                    </option>
                  ))}
                </select>

                {showFeedbackImmediate && isSubmitted && (
                  <div className="absolute right-3 top-2.5">
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

        {/* 显示正确答案 */}
        {showFeedbackImmediate && isSubmitted && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-bold">Correct Answers: </span>
            {question.correct_answer.map((ans, i) => {
              // 仅渲染 Slot 类型的答案
              if (typeof ans === "object" && "slot" in ans) {
                const optText = question.options.find(
                  (o) => o.id === ans.option_id
                )?.text;
                return (
                  <span key={i} className="mr-3 block sm:inline">
                    [{ans.slot + 1}]:{" "}
                    <span className="text-green-700 font-mono">{optText}</span>
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  // 渲染普通选择题 UI
  const renderNormalOptions = () => {
    return currentOptions.map((opt: Option) => {
      const isSelected = Array.isArray(selected)
        ? selected.includes(opt.id)
        : selected === opt.id;

      let styleClass =
        "border p-3 rounded cursor-pointer hover:bg-gray-50 mb-2 transition-colors relative";

      if (isSelected)
        styleClass += " border-blue-500 bg-blue-50 ring-1 ring-blue-500";

      if (showFeedbackImmediate && isSubmitted) {
        const correctIds = question.correct_answer.filter(
          (i): i is string => typeof i === "string"
        );
        const isCorrectOption = correctIds.includes(opt.id);

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
          {/* 选项右侧小图标 */}
          {showFeedbackImmediate && isSubmitted && (
            <div className="absolute right-3 top-3">
              {/* 仅当该选项是正确答案时显示勾选 */}
              {question.correct_answer.includes(opt.id) && (
                <Check className="w-5 h-5 text-green-600" />
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // 验证提交按钮状态
  const isSubmitDisabled = () => {
    if (isSlotQuestion) {
      const userSlots = (selected as Record<number, string>) || {};
      // 检查是否填满了所有空
      return Object.keys(userSlots).length < slotCount;
    }
    return (
      selected === null || (Array.isArray(selected) && selected.length === 0)
    );
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
          className="focus:outline-none p-1"
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

      {/* 代码块渲染 (深色模式 + 高亮插槽) */}
      {question.code_snippet && (
        <div className="bg-gray-800 p-5 rounded-lg mb-6 overflow-x-auto border border-gray-700 shadow-inner">
          <pre className="text-sm font-mono text-gray-200 leading-loose whitespace-pre-wrap">
            {renderCodeSnippet(question.code_snippet)}
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
              />
            </div>
          ))}
        </div>
      )}

      {/* 核心分支：如果是填空题显示下拉，否则显示普通选项 */}
      <div className="mb-6 space-y-2 text-gray-800">
        {isSlotQuestion ? renderSlotInputs() : renderNormalOptions()}
      </div>

      {!isSubmitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled()}
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
