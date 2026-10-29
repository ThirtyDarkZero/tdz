import { useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { prefersReducedMotion } from "./useShowroomScroll";
import "./showroom.css";

export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="sr-arrow-link">
      <span className="sr-arrow-link__circle"><ArrowRight aria-hidden="true" /></span>
      {children}
    </Link>
  );
}

type ChapterProps = {
  word: string;
  image: string;
  imageAlt: string;
  title: string;
  children: ReactNode;
  /** A link out of the chapter… */
  link?: { to: string; label: string };
  /** …or detail that opens below it. */
  more?: { label: string; content: ReactNode };
  id?: string;
};

/**
 * Full-screen photo that pulls back into a frame as you scroll, revealing a
 * giant word behind it, then a one-line caption.
 */
export function Chapter({ word, image, imageAlt, title, children, link, more, id }: ChapterProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      requestAnimationFrame(() =>
        panel.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }),
      );
    }
  };

  return (
    <>
      <section
        id={id}
        className="sr-chapter"
        data-chapter
        aria-label={title}
        style={{ ["--n" as string]: word.length }}
      >
        <div className="sr-chapter__stage">
          <p className="sr-chapter__word" aria-hidden="true">{word}</p>
          <div className="sr-chapter__frame">
            <img className="sr-chapter__image" src={image} alt={imageAlt} loading="lazy" />
          </div>
          <div className="sr-chapter__caption">
            <h2 className="sr-chapter__title">{title}</h2>
            <p className="sr-chapter__body">{children}</p>
            {link && <ArrowLink to={link.to}>{link.label}</ArrowLink>}
            {more && (
              <button
                type="button"
                className="sr-arrow-link"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={toggle}
              >
                <span className="sr-arrow-link__circle" data-open={open || undefined}>
                  <Plus aria-hidden="true" />
                </span>
                {open ? "Close" : more.label}
              </button>
            )}
          </div>
        </div>
      </section>
      {more && (
        <div id={panelId} ref={panel} className="sr-more" hidden={!open}>
          {more.content}
        </div>
      )}
    </>
  );
}

/** Segmented control used for tabs (role="tablist"). */
export function Segmented<T extends string>({
  label, options, value, onChange, idPrefix,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  idPrefix: string;
}) {
  return (
    <div className="sr-tabs" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${o.id}`}
          aria-selected={o.id === value}
          aria-controls={`${idPrefix}-panel`}
          className="sr-tabs__tab"
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
