import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => <h1 className="mb-4 mt-8 text-3xl font-bold tracking-tight first:mt-0" style={{ color: "var(--text-primary)" }}>{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-8 border-b pb-2 text-2xl font-bold" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{children}</h3>,
  p: ({ children }) => <p className="my-4 leading-7" style={{ color: "var(--text-secondary)" }}>{children}</p>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-purple-600 underline decoration-purple-300 underline-offset-4 hover:text-purple-700">{children}</a>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6" style={{ color: "var(--text-secondary)" }}>{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6" style={{ color: "var(--text-secondary)" }}>{children}</ol>,
  li: ({ children, className }) => <li className={className}>{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-purple-400 bg-purple-500/5 px-5 py-1 italic" style={{ color: "var(--text-secondary)" }}>{children}</blockquote>,
  hr: () => <hr className="my-8" style={{ borderColor: "var(--border-default)" }} />,
  table: ({ children }) => <div className="my-6 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-default)" }}><table className="worknest-data-table w-full text-left text-sm">{children}</table></div>,
  th: ({ children }) => <th className="border-b px-4 py-3 font-semibold" style={{ background: "var(--bg-muted)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}>{children}</th>,
  td: ({ children }) => <td className="border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>{children}</td>,
  pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100 shadow-inner">{children}</pre>,
  code: ({ children, className }) => className
    ? <code className={className}>{children}</code>
    : <code className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[0.9em] text-purple-700 dark:text-purple-300">{children}</code>,
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" className="my-6 max-h-[32rem] w-auto max-w-full rounded-2xl border object-contain shadow-sm" style={{ borderColor: "var(--border-default)" }} />,
  input: ({ type, checked, ...props }) => <input {...props} type={type} checked={checked} readOnly className="mr-2 accent-purple-600" />,
};

export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <article className={`min-w-0 text-[15px] ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
    </article>
  );
}
