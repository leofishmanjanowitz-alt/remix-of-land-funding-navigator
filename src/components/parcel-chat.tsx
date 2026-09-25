import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import {
  DEFAULT_QUESTION,
  FREE_QUESTIONS,
  buildAnswer,
  type ChatAction,
  type ChatAnswer,
} from "@/lib/tulsa-chat";
import { createTaskFromAction } from "@/lib/tasks";
import { findParcelByQuery, type Parcel } from "@/lib/tulsa-map-data";
import { Cite, CitationScope, ReferenceList } from "@/components/citation";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message as ChatMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: ChatAnswer; done: string[] }
  | { id: string; role: "system"; text: string };

let seq = 0;
const uid = () => `m${++seq}`;

function seedMessages(): Message[] {
  return [
    { id: uid(), role: "user", text: DEFAULT_QUESTION },
    { id: uid(), role: "assistant", answer: buildAnswer(DEFAULT_QUESTION, null), done: [] },
  ];
}

const SUGGESTIONS = [
  "Do we qualify for the Section 202 program?",
  "What does the TIF district actually pay for?",
];

export function ParcelChat({
  parcel,
  onSelectParcel,
  onClose,
  onAddTask,
}: {
  parcel: Parcel | null;
  onSelectParcel: (parcel: Parcel) => void;
  onClose: () => void;
  onAddTask: (action: ChatAction) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [asked, setAsked] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const remaining = Math.max(0, FREE_QUESTIONS - asked);
  const locked = remaining === 0;

  const isQuestion = (text: string) =>
    /[?]|^(what|which|can|is|does|how|why|are|do|should|when|who)\b/i.test(text);

  const submitInput = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    const matchedParcel = findParcelByQuery(text);
    if (matchedParcel && !isQuestion(text)) {
      onSelectParcel(matchedParcel);
      setMessages((current) => [
        ...current,
        { id: uid(), role: "user", text },
        {
          id: uid(),
          role: "system",
          text: `Parcel selected — ${matchedParcel.address}. The parcel facts and funding results have been updated.`,
        },
      ]);
      return;
    }

    if (!isQuestion(text)) {
      setMessages((current) => [
        ...current,
        { id: uid(), role: "user", text },
        {
          id: uid(),
          role: "system",
          text: `I couldn't match “${text}” to a sample parcel. Try a full Tulsa street address or parcel number.`,
        },
      ]);
      return;
    }

    if (locked) return;
    setMessages((m) => [
      ...m,
      { id: uid(), role: "user", text },
      { id: uid(), role: "assistant", answer: buildAnswer(text, parcel), done: [] },
    ]);
    setAsked((a) => a + 1);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages.length]);

  const runAction = (messageId: string, action: ChatAction) => {
    onAddTask(action);
    setMessages((m) =>
      m.map((msg) =>
        msg.id === messageId && msg.role === "assistant" && !msg.done.includes(action.id)
          ? { ...msg, done: [...msg.done, action.id] }
          : msg,
      ),
    );
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: "system",
        text:
          action.kind === "reminder"
            ? `Reminder set — ${action.label.replace(/^Set reminder: /, "")}.`
            : action.kind === "flag"
              ? `Flagged. ${action.label.replace(/^Flag missing source: /, "")} is queued for sourcing.`
              : `Added to your task list — ${action.label.replace(/^Add task: /, "")}.`,
      },
    ]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-border bg-paper">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-paper-deep px-4 py-2.5">
        <div>
          <p className="rule-label">Ask about this parcel</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {parcel ? parcel.address : "No parcel selected"}
          </p>
        </div>
        <Button
          onClick={onClose}
          aria-label="Close chat"
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <CitationScope
        ids={messages.flatMap((m) =>
          m.role === "assistant" && m.answer.sourceId ? [m.answer.sourceId] : [],
        )}
      >
        <Conversation className="min-h-0">
          <ConversationContent className="gap-4 px-4 py-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <ChatMessage key={m.id} from="user">
                  <MessageContent className="border border-primary bg-primary px-3 py-2 text-primary-foreground">
                    {m.text}
                  </MessageContent>
                </ChatMessage>
              ) : m.role === "system" ? (
                <ChatMessage key={m.id} from="assistant">
                  <MessageContent className="w-full border-l-2 border-accent bg-secondary/40 px-3 py-2 tabular-nums text-[11px] leading-relaxed text-foreground">
                    {m.text}
                  </MessageContent>
                </ChatMessage>
              ) : (
                <ChatMessage key={m.id} from="assistant">
                  <MessageContent className="w-full gap-3">
                    <div className="text-sm leading-relaxed text-foreground">
                      <MessageResponse>{m.answer.text}</MessageResponse>
                      {m.answer.sourceId && <Cite id={m.answer.sourceId} />}
                    </div>

                    {m.answer.actions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="rule-label">Next steps</p>
                        {m.answer.actions.map((a) => {
                          const used = m.done.includes(a.id);
                          return (
                            <Button
                              key={a.id}
                              disabled={used}
                              onClick={() => runAction(m.id, a)}
                              variant="outline"
                              className={`h-auto w-full justify-start px-3 py-2 text-left text-sm leading-snug whitespace-normal ${
                                used
                                  ? "border-border text-muted-foreground"
                                  : "border-accent text-accent hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {used && <Check aria-hidden="true" />}
                              {a.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </MessageContent>
                </ChatMessage>
              ),
            )}
            <ReferenceList className="border-t border-border pt-4" />
          </ConversationContent>
          <ConversationScrollButton className="" />
        </Conversation>
      </CitationScope>

      <div className="shrink-0 border-t border-border bg-paper-deep px-4 py-3">
        {locked && (
          <div className="border border-accent p-3 rounded-lg">
            <p className="text-sm leading-relaxed text-foreground">
              You've used your three free questions. Full access includes unlimited questions,
              parcel reports, and the complete source library. Address lookups remain available.
            </p>
            <Button className="mt-3 w-full" disabled>
              Upgrade for unlimited questions
            </Button>
          </div>
        )}
        {!locked && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                onClick={() => submitInput(s)}
                variant="outline"
                size="sm"
                className="h-auto px-2 py-1 text-left text-xs whitespace-normal text-muted-foreground hover:border-accent hover:text-accent"
              >
                {s}
              </Button>
            ))}
          </div>
        )}
        <div className={locked ? "mt-3" : undefined}>
          <PromptInput
            onSubmit={({ text }) => submitInput(text)}
            className="[&_[data-slot=input-group]]:border-border [&_[data-slot=input-group]]:bg-paper"
          >
            <PromptInputTextarea
              ref={inputRef}
              aria-label="Enter an address or ask about funding"
              placeholder={
                locked ? "Enter a parcel address…" : "Enter an address or ask about funding…"
              }
              className="min-h-16 text-sm"
            />
            <PromptInputFooter className="justify-between">
              <span className="tabular-nums text-[10px] text-muted-foreground">
                {locked ? "Address lookup" : "Address or question"}
              </span>
              <PromptInputSubmit className="" disabled={false}>
                <ArrowRight aria-hidden="true" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 tabular-nums text-[11px] text-muted-foreground">
            {remaining} of {FREE_QUESTIONS} free questions remaining · address lookups are free
          </p>
        </div>
      </div>
    </div>
  );
}
