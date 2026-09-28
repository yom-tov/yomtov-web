import { Fragment } from "react";

// Renders admin-edited plain text: keeps line breaks and turns e-mail
// addresses and http(s) links into real links. No HTML is ever injected.
const TOKEN = /([\w.+-]+@[\w-]+\.[\w.-]+|https?:\/\/[^\s]+)/g;

function linkify(line: string, linkClass: string) {
  const parts = line.split(TOKEN);
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const isEmail = part.includes("@") && !part.startsWith("http");
    return (
      <a
        key={i}
        href={isEmail ? `mailto:${part}` : part}
        className={linkClass}
        dir="ltr"
        {...(isEmail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {part}
      </a>
    );
  });
}

export function RichText({ text, linkClassName = "prose-link" }: { text: string; linkClassName?: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {linkify(line, linkClassName)}
        </Fragment>
      ))}
    </>
  );
}
