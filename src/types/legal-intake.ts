/**
 * Legal profiling.
 *
 * Every one of these shapes is defined by the Hub API, including the
 * questions themselves. The app does not know which questions exist, which
 * order they come in, or which ones a given matter adds — it renders what it
 * is handed. That is what keeps the consultant's brief and the client's
 * screen showing the same wording.
 */

export type QuestionLevel = "required" | "optional";
export type QuestionKind = "single" | "multi" | "text" | "date" | "documents";

export interface IntakeQuestionOption {
  value: string;
  label: string;
}

export interface IntakeQuestion {
  id: string;
  step: number;
  stepTitle: string;
  prompt: string;
  kind: QuestionKind;
  level: QuestionLevel;
  options?: IntakeQuestionOption[];
  placeholder?: string;
  /** Tappable openers under a text box, so nobody faces an empty field. */
  suggestions?: string[];
  helper?: string;
  showIf?: { questionId: string; includes: string[] };
}

export interface LegalMatterOption {
  value: string;
  label: string;
}

/** What Gemini made of the answers. Always shown as analysis, never as fact. */
export interface IntakeAnalysis {
  summary: string;
  keyIssues: string[];
  questionsToClarify: string[];
  risks: string[];
}

export interface LegalBrief {
  matter: string;
  matterLabel: string;
  /** The client's own answers. The half that cannot be invented. */
  facts: Array<{ question: string; answer: string }>;
  documentCount: number;
  analysis: IntakeAnalysis;
  generatedBy: string;
  generatedAt: string;
}

export type IntakeStatus = "in_progress" | "completed" | "converted";

export interface LegalIntake {
  id: string;
  matter: string;
  matterLabel: string;
  status: IntakeStatus;
  /** Question id to answer: a string, an array of strings, or absent. */
  answers: Record<string, string | string[] | null>;
  documents: string[];
  /** Only the questions this person should see, already filtered by the API. */
  questions: IntakeQuestion[];
  /** Required question ids still unanswered. Drives the finish button. */
  outstandingRequired: string[];
  brief: LegalBrief | null;
}
