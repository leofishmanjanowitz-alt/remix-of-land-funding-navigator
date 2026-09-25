import type { ChatAction } from "./tulsa-chat";

export type Task = {
  id: string;
  title: string;
  dueDate?: string;
  contact?: string;
  completed: boolean;
  source: "mock" | "chat";
};

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function looksLikeDate(text: string): boolean {
  const lower = text.toLowerCase();
  return MONTH_NAMES.some((m) => lower.includes(m)) || /\b\d{1,2}\b/.test(text);
}

function stripPrefix(label: string): string {
  return label.replace(/^(Add task|Set reminder|Flag missing source):\s*/, "").trim();
}

function extractContact(title: string): string | undefined {
  const lower = title.toLowerCase();
  if (lower.includes("tulsa community development")) return "Tulsa Community Development Department";
  if (lower.includes("ohfa")) return "Oklahoma Housing Finance Agency";
  if (lower.includes("tulsa planning")) return "Tulsa Planning Office";
  if (lower.includes("firm")) return "FEMA / Tulsa County Assessor";
  if (lower.includes("usda rural")) return "USDA Rural Development";
  if (lower.includes("qualified opportunity fund")) return "Qualified Opportunity Fund partner";
  if (lower.includes("housing trust fund")) return "Tulsa Affordable Housing Trust Fund";
  if (lower.includes("increment district")) return "City of Tulsa Economic Development";
  if (lower.includes("home program")) return "Tulsa HOME Program";
  if (lower.includes("public hearing")) return "City Clerk";
  return undefined;
}

export function createTaskFromAction(action: ChatAction): Task {
  const rawTitle = stripPrefix(action.label);
  let title = rawTitle;
  const contact = extractContact(rawTitle);
  const task: Task = {
    id: action.id,
    title,
    completed: false,
    source: "chat",
  };

  if (contact) {
    task.contact = contact;
  }

  if (action.kind === "reminder") {
    const match = rawTitle.match(/,\s*([^,]+)$/);
    if (match && match[1] && looksLikeDate(match[1])) {
      task.dueDate = match[1].trim();
      task.title = rawTitle.slice(0, match.index).trim();
    }
  }

  if (action.kind === "flag") {
    task.title = `Source request: ${rawTitle}`;
  }

  return task;
}

export const INITIAL_TASKS: Task[] = [
  {
    id: "mock-1",
    title: "Review Tulsa Consolidated Plan",
    dueDate: "September 15",
    contact: "Tulsa Community Development Department",
    completed: false,
    source: "mock",
  },
  {
    id: "mock-2",
    title: "Confirm QCT status for 1847 E Apache St",
    contact: "Oklahoma Housing Finance Agency",
    completed: false,
    source: "mock",
  },
  {
    id: "mock-3",
    title: "Pre-application meeting with Tulsa Planning",
    dueDate: "September 8",
    contact: "Tulsa Planning Office",
    completed: true,
    source: "mock",
  },
];

let manualSeq = 0;

/** Create a task directly from an action-plan step or fixed date. */
export function createManualTask(input: {
  title: string;
  dueDate?: string;
  contact?: string;
}): Task {
  manualSeq += 1;
  const task: Task = {
    id: `plan-${Date.now()}-${manualSeq}`,
    title: input.title,
    completed: false,
    source: "chat",
  };
  if (input.dueDate) task.dueDate = input.dueDate;
  if (input.contact) task.contact = input.contact;
  return task;
}
