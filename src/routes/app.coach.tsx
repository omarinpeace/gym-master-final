import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { coachChat } from "@/lib/ai.functions";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "I missed my workout, what now?",
  "Can I replace bench press?",
  "What should I eat today?",
  "How do I fix my squat form?",
];

function CoachPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [convoId, setConvoId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const send = useServerFn(coachChat);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = async (text?: string) => {
    const message = text ?? input;
    if (!message.trim() || loading) return;
    setMessages((p) => [...p, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const { reply, conversationId } = await send({ data: { message, conversationId: convoId } });
      setConvoId(conversationId);
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-3xl flex-col">
      <header className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, var(--lov-peach), var(--lov-pink))" }}
        >
          <Sparkles className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI Coach</div>
          <h1 className="font-serif text-3xl">Ask me anything.</h1>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-2xl border border-border bg-card/60 p-4 text-left text-sm transition-colors hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl p-4 ${
              m.role === "user"
                ? "ml-12 bg-foreground text-background"
                : "mr-12 border border-border bg-card/70"
            }`}
          >
            {m.role === "assistant" ? (
              <div className="prose prose-sm max-w-none text-foreground prose-p:my-1 prose-headings:font-serif">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm">{m.content}</p>
            )}
          </div>
        ))}
        {loading && (
          <div className="mr-12 rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted-foreground">
            Coach is thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
