import type { Task } from "@/lib/tasks";

export function TaskPanel({
  open,
  onClose,
  tasks,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggle: (id: string) => void;
}) {
  if (!open) return null;

  const openCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-80 flex-col border-l border-border bg-paper shadow-panel">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-paper-deep px-4 py-3">
        <div>
          <h2 className="rule-label">Task list</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {openCount} open {openCount === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close task list"
          className="tabular-nums text-sm text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Accept an action in the parcel chat to add a task.
          </p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex gap-3 border border-border bg-paper-deep p-3 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  aria-label={`Mark ${task.title} as ${task.completed ? "open" : "done"}`}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <div className="flex-1">
                  <p
                    className={`text-sm leading-snug ${
                      task.completed ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && <p className="mt-1.5 text-xs text-accent">Due {task.dueDate}</p>}
                  {task.contact && (
                    <p className="mt-1 text-xs text-muted-foreground">Contact: {task.contact}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
