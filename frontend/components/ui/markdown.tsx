'use client';

import ReactMarkdown from 'react-markdown';
import { getFileUrl, resolveMarkdownImages } from '@/lib/utils';

interface MarkdownProps {
  content: string | undefined | null;
  className?: string;
  variant?: 'default' | 'news';
}

type MarkdownSegment =
  | { type: 'markdown'; value: string }
  | {
      type: 'image';
      src: string;
      alt: string;
      caption: string;
      size: 'small' | 'medium' | 'wide' | 'full';
      align: 'left' | 'center' | 'right';
      fit: 'cover' | 'contain';
    };

type ImageSegment = Extract<MarkdownSegment, { type: 'image' }>;

const imageShortcodePattern = /\[\[image\s+([^[\]]+)\]\]/g;

function parseImageShortcodes(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let cursor = 0;
  const regex = new RegExp(imageShortcodePattern);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, rawAttributes] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > cursor) {
      segments.push({ type: 'markdown', value: content.slice(cursor, matchIndex) });
    }

    const attributes: Record<string, string> = {};
    const attributesRegex = /(\w+)="([^"]*)"/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attributesRegex.exec(rawAttributes)) !== null) {
      attributes[attrMatch[1]] = attrMatch[2];
    }

    segments.push({
      type: 'image',
      src: attributes.src ?? '',
      alt: attributes.alt ?? '',
      caption: attributes.caption ?? '',
      size: (attributes.size as ImageSegment['size']) || 'wide',
      align: (attributes.align as ImageSegment['align']) || 'center',
      fit: (attributes.fit as ImageSegment['fit']) || 'cover',
    });

    cursor = matchIndex + fullMatch.length;
  }

  if (cursor < content.length) {
    segments.push({ type: 'markdown', value: content.slice(cursor) });
  }

  return segments.filter((segment) => segment.type !== 'markdown' || segment.value.trim().length > 0);
}

function renderMarkdownBlock(content: string, variant: 'default' | 'news', key: string) {
  const processedContent = resolveMarkdownImages(content);
  const proseClassName =
    variant === 'news'
      ? 'prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-p:text-slate-700 prose-p:leading-8 prose-strong:text-slate-900 prose-strong:font-semibold prose-a:text-emerald-700 prose-a:underline prose-a:underline-offset-4 prose-blockquote:border-l-4 prose-blockquote:border-emerald-300 prose-blockquote:bg-emerald-50/70 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:not-italic prose-li:marker:text-emerald-700 prose-img:rounded-2xl prose-img:shadow-md'
      : 'prose prose-slate max-w-none';

  return (
    <div key={key} className={proseClassName}>
      <ReactMarkdown
        components={{
          img: ({ src, alt }) => (
            <img
              src={getFileUrl(src)}
              alt={alt ?? ''}
              className="my-6 w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

function renderImageBlock(segment: ImageSegment, key: string) {
  const widthClassMap = {
    small: 'w-full sm:w-56',
    medium: 'w-full sm:w-80',
    wide: 'w-full sm:w-[36rem]',
    full: 'w-full',
  };

  const alignClassMap = {
    left: 'sm:float-left sm:mr-6',
    center: 'mx-auto',
    right: 'sm:float-right sm:ml-6',
  };

  const heightClassMap = {
    small: 'h-52',
    medium: 'h-64',
    wide: 'h-80',
    full: 'h-[26rem]',
  };

  return (
    <figure
      key={key}
      className={`my-8 ${widthClassMap[segment.size]} ${segment.align === 'center' || segment.size === 'full' ? 'mx-auto' : ''} ${segment.size === 'full' ? 'sm:float-none' : alignClassMap[segment.align]}`}
    >
      <div className={`overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-sm ${heightClassMap[segment.size]}`}>
        <img
          src={getFileUrl(segment.src)}
          alt={segment.alt || segment.caption || 'Imagen de la noticia'}
          className={`h-full w-full ${segment.fit === 'contain' ? 'object-contain p-2' : 'object-cover'}`}
        />
      </div>
      {segment.caption ? <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">{segment.caption}</figcaption> : null}
    </figure>
  );
}

export function Markdown({ content, className, variant = 'default' }: MarkdownProps) {
  if (!content) return null;

  const segments = parseImageShortcodes(content);

  return (
    <div className={className}>
      {segments.map((segment, index) =>
        segment.type === 'markdown'
          ? renderMarkdownBlock(segment.value, variant, `markdown-${index}`)
          : renderImageBlock(segment, `image-${index}`),
      )}
      {variant === 'news' ? <div className="clear-both" /> : null}
    </div>
  );
}
