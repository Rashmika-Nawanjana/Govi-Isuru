import React from 'react';

/**
 * Lightweight markdown renderer for chatbot answers:
 * bold, italics, lists, code, links (incl. govi-nav:// in-app links)
 */
const ChatMarkdown = ({ content, onNavigate }) => {
  if (!content) return null;

  const handleNav = (viewId, e) => {
    e.preventDefault();
    if (onNavigate && viewId) onNavigate(viewId);
  };

  const renderInline = (text, keyPrefix) => {
    const parts = [];
    // bold, italic, code, links
    const regex =
      /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**')) {
        parts.push(
          <strong key={`${keyPrefix}-b-${i}`} className="font-bold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*')) {
        parts.push(
          <em key={`${keyPrefix}-i-${i}`} className="italic">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith('`')) {
        parts.push(
          <code
            key={`${keyPrefix}-c-${i}`}
            className="px-1 py-0.5 rounded bg-green-50 dark:bg-green-900/40 text-[12px] font-mono text-green-800 dark:text-green-200"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (match[2] && match[3]) {
        const label = match[2];
        const href = match[3];
        if (href.startsWith('govi-nav://')) {
          const viewId = href.replace('govi-nav://', '').trim();
          parts.push(
            <button
              key={`${keyPrefix}-n-${i}`}
              type="button"
              onClick={(e) => handleNav(viewId, e)}
              className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-full text-[12px] font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              {label}
            </button>
          );
        } else {
          parts.push(
            <a
              key={`${keyPrefix}-a-${i}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 dark:text-green-300 font-semibold underline underline-offset-2"
            >
              {label}
            </a>
          );
        }
      }

      lastIndex = regex.lastIndex;
      i += 1;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : text;
  };

  const lines = String(content).split('\n');
  const blocks = [];
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} ml-5 my-2 space-y-1 text-sm leading-relaxed text-slate-700 dark:text-gray-200`}
      >
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    const heading = line.match(/^\s*#{1,3}\s+(.+)$/);

    if (bullet) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(bullet[1]);
      return;
    }

    if (numbered) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(numbered[2]);
      return;
    }

    flushList();

    if (!line.trim()) {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    if (heading) {
      blocks.push(
        <p key={`h-${idx}`} className="font-bold text-[15px] text-slate-900 dark:text-white mt-2 mb-1">
          {renderInline(heading[1], `h-${idx}`)}
        </p>
      );
      return;
    }

    blocks.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed text-slate-700 dark:text-gray-200 my-1">
        {renderInline(line, `p-${idx}`)}
      </p>
    );
  });

  flushList();

  return <div className="chat-md">{blocks}</div>;
};

export default ChatMarkdown;
