import { useRef } from "react";
import { Bold, Code2, Eye, Heading2, Image, Italic, Link2, List, ListChecks, Minus, Quote, Table2 } from "lucide-react";
import { MarkdownContent } from "@/modules/recruitment/components/MarkdownContent";

type Tool = { label: string; icon: typeof Bold; before: string; after?: string; placeholder?: string };

const tools: Tool[] = [
  { label: "Heading", icon: Heading2, before: "## ", placeholder: "Section heading" },
  { label: "Bold", icon: Bold, before: "**", after: "**", placeholder: "bold text" },
  { label: "Italic", icon: Italic, before: "*", after: "*", placeholder: "italic text" },
  { label: "List", icon: List, before: "- ", placeholder: "List item" },
  { label: "Checklist", icon: ListChecks, before: "- [ ] ", placeholder: "Checklist item" },
  { label: "Link", icon: Link2, before: "[", after: "](https://example.com)", placeholder: "link text" },
  { label: "Image", icon: Image, before: "![", after: "](https://example.com/image.png)", placeholder: "image description" },
  { label: "Quote", icon: Quote, before: "> ", placeholder: "Quote" },
  { label: "Code", icon: Code2, before: "```\n", after: "\n```", placeholder: "code" },
  { label: "Table", icon: Table2, before: "| Heading | Heading |\n| --- | --- |\n| Value | Value |", placeholder: "" },
  { label: "Rule", icon: Minus, before: "\n---\n", placeholder: "" },
];

export function MarkdownEditor({ value, onChange, label = "Job description", error }: { value: string; onChange: (value: string) => void; label?: string; error?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insert(tool: Tool) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || tool.placeholder || "";
    const inserted = `${tool.before}${selected}${tool.after ?? ""}`;
    const next = value.slice(0, start) + inserted + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + tool.before.length + selected.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="job-markdown" className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</label>
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}><Eye size={13} />Live preview</span>
      </div>
      <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: error ? "#ef4444" : "var(--border-default)", background: "var(--bg-surface)" }}>
        <div className="flex flex-wrap gap-1 border-b p-2" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            return <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} onClick={() => insert(tool)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-purple-500/10 hover:text-purple-600"><Icon size={15} /></button>;
          })}
        </div>
        <div className="grid min-h-[34rem] lg:grid-cols-2">
          <textarea
            ref={textareaRef}
            id="job-markdown"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[24rem] resize-y border-0 bg-transparent p-5 font-mono text-sm leading-6 outline-none lg:min-h-[34rem] lg:border-r"
            style={{ color: "var(--text-primary)", borderColor: "var(--border-default)" }}
            placeholder="# About the role\n\nDescribe the opportunity, responsibilities, requirements, and benefits in one place."
          />
          <div className="min-h-[24rem] overflow-auto p-6 lg:max-h-[44rem] lg:min-h-[34rem]">
            {value.trim() ? <MarkdownContent>{value}</MarkdownContent> : <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Your formatted preview will appear here.</p>}
          </div>
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>GitHub-flavored Markdown supports headings, tables, lists, links, images, code, quotes, rules, emphasis, and checkboxes.</p>}
    </div>
  );
}
