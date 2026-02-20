export type Answer = {
    id: string;
    content: string;
    isCorrect: boolean;
};

export type Question = {
    id: string;
    content: string;
    answers: Answer[];
    explanation?: string;
    topicId: string;
    imageUrl?: string | null;
    isCritical?: boolean;
};

export type Topic = {
    id: string;
    name: string;
    parentId?: string | null;
};

export type Exam = {
    id: string;
    questionIds: string[];
    topicId?: string | null;
    createdAt: string;
};

export type ExamStartRequest = {
    topicId?: string | null;
    count?: number;
};

export type ExamStartResponse = {
    exam: Exam;
    questions: Question[];
    topics: Topic[];
};

export type Submission = {
    examId: string;
    responses: {
        questionId: string;
        answerId: string | null;
    }[];
};

export type ResultDetail = {
    questionId: string;
    correctAnswerId: string;
    yourAnswerId: string | null;
    correct: boolean;
};

export type ResultSummary = {
    examId: string;
    total: number;
    correct: number;
    scorePercent: number;
    details: ResultDetail[];
};

export type PaginatedQuestions = {
    items: Question[];
    total: number;
    page: number;
    pageSize: number;
};
