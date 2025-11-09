"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RichTextViewerProps = {
  content: string | null | undefined;
  className?: string;
};

/**
 * Component to safely display rich HTML content from Kibo UI Editor
 * Strips HTML tags for previews or renders full HTML for detail views
 */
export const RichTextViewer = ({ content, className }: RichTextViewerProps) => {
  if (!content) return null;

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-p:text-muted-foreground prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:text-muted-foreground",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        "prose-table:border prose-table:border-border",
        "prose-th:bg-muted prose-th:font-semibold",
        "prose-td:border prose-td:border-border",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

/**
 * Extract plain text from HTML content for previews
 */
export const stripHtml = (html: string | null | undefined, maxLength?: number): string => {
  if (!html) return "";
  
  const text = html.replace(/<[^>]*>/g, "");
  
  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  
  return text;
};

/**
 * Rich text preview component (shows plain text excerpt)
 */
export const RichTextPreview = ({ 
  content, 
  maxLength = 100, 
  className 
}: { 
  content: string | null | undefined; 
  maxLength?: number; 
  className?: string;
}) => {
  if (!content) return null;
  
  const plainText = stripHtml(content, maxLength);
  
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {plainText}
    </p>
  );
};

