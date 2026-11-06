import { safeLink } from "@/lib/website/schema";
function inline(text: string) {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g;
  return text.split(pattern).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
    if (link && safeLink(link[2]))
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]} ↗
        </a>
      );
    return part;
  });
}
export function ContentText({ text }: { text: string }) {
  return (
    <div className="content-prose">
      {text.split(/\n\s*\n/).map((block, i) =>
        block.startsWith("## ") ? (
          <h2 key={i}>{inline(block.slice(3))}</h2>
        ) : block.split("\n").every((line) => line.startsWith("- ")) ? (
          <ul key={i}>
            {block.split("\n").map((line, j) => (
              <li key={j}>{inline(line.slice(2))}</li>
            ))}
          </ul>
        ) : (
          <p key={i} style={{ whiteSpace: "pre-wrap" }}>
            {inline(block)}
          </p>
        ),
      )}
    </div>
  );
}
