export type Option = {
	id: string;
	text: string;
	group?: number; // 用于 Hotspot/DragDrop 分组
};

// 1. 定义正确答案的具体联合类型
export type CorrectAnswerItem =
	| string // 情况1: 单选/多选/模拟题
	| { slot: number; option_id: string } // 情况2: Hotspot 填空
	| { order: number; option_id: string } // 情况3: 排序题
	| { target: string; option_id: string }; // 情况4: 连线匹配题

export type Question = {
	id: string;
	topic: string;
	type:
		| "SingleChoice"
		| "MultipleChoice"
		| "DragDrop"
		| "Hotspot"
		| "Simulation";
	question_text: string;
	allow_randomize_options: boolean;
	code_snippet?: string;
	options: Option[];
	text_map?: Record<string, string>;

	// 2. 在这里应用上面定义的类型
	correct_answer: CorrectAnswerItem[];

	explanation: string;
	images: string[];
};

export type UserProgress = {
	currentQuestionIndex: number;
	mistakes: string[];
	favorites: string[];
};
