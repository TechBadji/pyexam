import { create } from "zustand";

export interface MCQOption {
  id: string;
  question_id: string;
  label: string;
  text: string;
}

export interface Question {
  id: string;
  exam_id: string;
  type: "mcq" | "coding";
  order_index: number;
  points: number;
  statement: string;
  options: MCQOption[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: string;
  questions: Question[];
}

export interface AnswerDraft {
  selected_option_id?: string;
  code_written?: string;
}

interface ExamState {
  currentExam: Exam | null;
  submissionId: string | null;
  startedAt: Date | null;
  answers: Record<string, AnswerDraft>;
  isSubmitted: boolean;

  setExam: (exam: Exam) => void;
  setSubmissionId: (id: string) => void;
  setStartedAt: (date: Date) => void;
  setAnswer: (questionId: string, draft: AnswerDraft) => void;
  markSubmitted: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>()((set) => ({
  currentExam: null,
  submissionId: null,
  startedAt: null,
  answers: {},
  isSubmitted: false,

  setExam: (exam) => set({ currentExam: exam }),
  setSubmissionId: (id) => set({ submissionId: id }),
  setStartedAt: (date) => set({ startedAt: date }),

  setAnswer: (questionId, draft) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { ...state.answers[questionId], ...draft },
      },
    })),

  markSubmitted: () => set({ isSubmitted: true }),

  reset: () =>
    set({
      currentExam: null,
      submissionId: null,
      startedAt: null,
      answers: {},
      isSubmitted: false,
    }),
}));
