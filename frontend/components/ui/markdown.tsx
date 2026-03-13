'use client';

import ReactMarkdown from 'react-markdown';
import { resolveMarkdownImages } from '@/lib/utils';

interface MarkdownProps {
  content: string | undefined | null;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;

  // Pre-process images to ensure they have absolute URLs
  const processedContent = resolveMarkdownImages(content);

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown>{processedContent}</ReactMarkdown>
    </div>
  );
}
