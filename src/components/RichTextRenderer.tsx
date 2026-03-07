interface RichTextRendererProps {
  content: string;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  // Check if content looks like HTML (from TipTap) or markdown (legacy)
  const isHtml = content.trim().startsWith("<");

  if (isHtml) {
    return (
      <div
        className="prose prose-sm max-w-none text-foreground
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul_li]:text-sm [&_ul_li]:text-muted-foreground
          [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3 [&_ol_li]:text-sm [&_ol_li]:text-muted-foreground
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote_p]:text-muted-foreground
          [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto
          [&_code]:text-xs [&_code]:text-foreground
          [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
          [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_hr]:my-6 [&_hr]:border-border"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Legacy markdown rendering (fallback)
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
  };

  let inCodeBlock = false;
  let codeLines: string[] = [];
  const elements: React.ReactNode[] = [];

  content.split("\n").forEach((line: string, i: number) => {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-muted rounded-lg p-4 my-3 overflow-x-auto">
            <code className="text-xs text-foreground">{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }

    if (line.startsWith("# ")) { elements.push(<h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>); return; }
    if (line.startsWith("## ")) { elements.push(<h2 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">{line.slice(3)}</h2>); return; }
    if (line.startsWith("### ")) { elements.push(<h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.slice(4)}</h3>); return; }
    if (line.startsWith("> ")) { elements.push(<blockquote key={i} className="border-l-4 border-primary/30 pl-4 py-1 my-3 italic text-sm text-muted-foreground">{renderInline(line.slice(2))}</blockquote>); return; }
    if (line.startsWith("- ")) { elements.push(<li key={i} className="text-sm text-muted-foreground ml-4">{renderInline(line.slice(2))}</li>); return; }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={i} className="text-sm text-muted-foreground ml-4 flex gap-2">
          <span className="text-foreground font-medium shrink-0">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
      return;
    }
    if (line.trim() === "") { elements.push(<br key={i} />); return; }
    elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed">{renderInline(line)}</p>);
  });

  return <div className="prose prose-sm max-w-none">{elements}</div>;
}
