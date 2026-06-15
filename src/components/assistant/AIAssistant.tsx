import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, RotateCcw, Send, Settings2, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

type AssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AssistantContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'unordered-list' | 'ordered-list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; code: string; language?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' };

type InteractiveFilters = Record<'years' | 'months' | 'airlines' | 'origins' | 'destinations' | 'delayLevels', string[]>;

type AssistantHealth = {
  configured: boolean;
  model?: string;
  fallbackModels?: string[];
  modelOptions?: string[];
  backend?: boolean;
};

const MODEL_STORAGE_KEY = 'nexus-assistant-model';

function getStoredModel() {
  return localStorage.getItem(MODEL_STORAGE_KEY) || '';
}

function isTableSeparator(line: string) {
  const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseTableRow(line: string) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isMarkdownBlockStart(line: string, nextLine?: string) {
  return (
    /^```/.test(line) ||
    /^-{3,}$/.test(line.trim()) ||
    /^#{1,6}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    (line.includes('|') && Boolean(nextLine && isTableSeparator(nextLine)))
  );
}

function parseAssistantMarkdown(content: string): AssistantContentBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: AssistantContentBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    const codeMatch = trimmed.match(/^```(\w+)?/);
    if (codeMatch) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', code: codeLines.join('\n'), language: codeMatch[1] });
      continue;
    }

    if (trimmed.includes('|') && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      const headers = parseTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+(?:\[[ xX]\]\s+)?/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+[.)]\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownBlockStart(lines[index].trim(), lines[index + 1])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

function renderInlineMarkdown(text: string, keyPrefix: string) {
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*\n]+)\*|_([^_\n]+)_)/g;
  const nodes = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a key={`${keyPrefix}-link-${match.index}`} href={match[3]} target="_blank" rel="noreferrer">
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(<code key={`${keyPrefix}-code-${match.index}`}>{match[4]}</code>);
    } else if (match[5] || match[6]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${match.index}`}>{match[5] || match[6]}</strong>);
    } else if (match[7]) {
      nodes.push(<s key={`${keyPrefix}-strike-${match.index}`}>{match[7]}</s>);
    } else if (match[8] || match[9]) {
      nodes.push(<em key={`${keyPrefix}-em-${match.index}`}>{match[8] || match[9]}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function AssistantMessageContent({ content }: { content: string }) {
  const blocks = parseAssistantMarkdown(content);

  if (!blocks.length) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }

  return (
    <div className="assistant-content">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = (`h${Math.min(Math.max(block.level + 2, 4), 6)}`) as keyof JSX.IntrinsicElements;
          return <HeadingTag key={`heading-${index}`}>{renderInlineMarkdown(block.text, `heading-${index}`)}</HeadingTag>;
        }

        if (block.type === 'paragraph') {
          return <p key={`paragraph-${index}`}>{renderInlineMarkdown(block.text, `paragraph-${index}`)}</p>;
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={`blockquote-${index}`}>
              {renderInlineMarkdown(block.text, `blockquote-${index}`)}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={`code-${index}`}>
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={`table-${index}`} className="assistant-table-wrap">
              <table>
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={`${header}-${headerIndex}`}>{renderInlineMarkdown(header, `th-${index}-${headerIndex}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`row-${index}-${rowIndex}`}>
                      {block.headers.map((_, cellIndex) => (
                        <td key={`cell-${index}-${rowIndex}-${cellIndex}`}>
                          {renderInlineMarkdown(row[cellIndex] || '', `td-${index}-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'hr') {
          return <hr key={`hr-${index}`} />;
        }

        const ListTag = block.type === 'ordered-list' ? 'ol' : 'ul';
        return (
          <ListTag key={`list-${index}`}>
            {block.items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item, `li-${index}-${itemIndex}`)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}

export default function AIAssistant({
  activeTab,
  filters,
  interactiveData,
}: {
  activeTab: string;
  filters: InteractiveFilters;
  interactiveData?: any;
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredModel);
  const [health, setHealth] = useState<AssistantHealth | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', content: t('assistant.initial') },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(
    () => [t('assistant.suggestion1'), t('assistant.suggestion2'), t('assistant.suggestion3')],
    [t],
  );

  const modelOptions = useMemo(() => Array.from(new Set([
    health?.model,
    ...(health?.modelOptions || []),
    ...(health?.fallbackModels || []),
  ].filter(Boolean) as string[])), [health]);

  const effectiveModel = selectedModel.trim() || health?.model || 'gpt-5.5';

  const assistantStatus = health?.configured
    ? t('assistant.ready')
    : t('assistant.notReady');

  const getFriendlyError = (payload: any, fallback: string) => {
    const raw = String(payload?.error || fallback || '');
    if (payload?.code === 'STATIC_BACKEND_REQUIRED' || raw.includes('Node/Express backend proxy')) {
      return t('assistant.staticBackendRequired');
    }
    if (raw.includes('SUB2API_API_KEY') || raw.includes('OPENAI_API_KEY') || raw.includes('server key')) {
      return t('assistant.serverKeyMissing');
    }
    return raw || t('assistant.missing');
  };

  const clientContext = useMemo(() => ({
    activeTab,
    tabLabel: t(`tab.${activeTab}`, activeTab),
    recordCount: interactiveData?.recordCount,
    summary: interactiveData?.summary,
    hourlyTrend: interactiveData?.hourlyTrend?.slice?.(0, 24),
    topDestinationsVolume: interactiveData?.topDestinationsVolume?.slice?.(0, 8),
    topDestinationsDelay: interactiveData?.topDestinationsDelay?.slice?.(0, 8),
    delayRanking: interactiveData?.delayRanking?.slice?.(0, 8),
    ontimeRanking: interactiveData?.ontimeRanking?.slice?.(0, 8),
  }), [activeTab, interactiveData, t]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/assistant/health')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setHealth(payload))
      .catch(() => setHealth({ configured: false, backend: false }));
  }, [open]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.role === 'assistant') {
        return [{ role: 'assistant', content: t('assistant.initial') }];
      }
      return current;
    });
  }, [t]);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(MODEL_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(MODEL_STORAGE_KEY);
    }
  };

  const submitMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages: AssistantMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          activeTab,
          filters,
          language,
          clientContext,
          history: messages.slice(-6),
          model: effectiveModel,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getFriendlyError(payload, t('assistant.missing')));
      setMessages([...nextMessages, { role: 'assistant', content: payload.content || t('assistant.missing') }]);
      queueMicrotask(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
    } catch (error) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: error instanceof Error ? error.message : t('assistant.missing') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={t('assistant.open')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-2xl shadow-cyan-500/30 transition-colors hover:bg-cyan-400"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <section className="filter-panel flex h-[min(680px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl">
          <header className="assistant-header flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
                <Bot className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--page-ink)]">{t('assistant.title')}</h3>
                <p className="text-xs text-[var(--muted)]">
                  {assistantStatus}
                  {effectiveModel ? ` · ${effectiveModel}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSettingsOpen((current) => !current)}
                title={t('assistant.settings')}
                className={`rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-[var(--page-ink)] ${
                  settingsOpen ? 'bg-cyan-500/10 text-cyan-300' : 'text-[var(--muted)]'
                }`}
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title={t('assistant.close')}
                className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--page-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {settingsOpen && (
            <div className="assistant-settings border-b border-white/10 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="assistant-model" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {t('assistant.model')}
                </label>
                <button
                  type="button"
                  onClick={() => handleModelChange(health?.model || 'gpt-5.5')}
                  title={t('assistant.modelReset')}
                  className="rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-cyan-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                id="assistant-model"
                list="assistant-model-options"
                value={selectedModel || health?.model || ''}
                onChange={(event) => handleModelChange(event.target.value)}
                placeholder="gpt-5.5"
                className="assistant-input w-full rounded-lg border px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <datalist id="assistant-model-options">
                {modelOptions.map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                {t('assistant.modelHint')}
              </p>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'assistant-bubble-user ml-8'
                    : 'assistant-bubble-assistant mr-8'
                }`}
              >
                {message.role === 'assistant'
                  ? <AssistantMessageContent content={message.content} />
                  : <span className="whitespace-pre-wrap break-words">{message.content}</span>}
              </div>
            ))}
            {loading && (
              <div className="assistant-bubble-assistant mr-8 flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                {t('status.analyzing')}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitMessage(suggestion)}
                  disabled={loading}
                  className="assistant-suggestion inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('assistant.placeholder')}
                className="assistant-input min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">{t('assistant.send')}</span>
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
