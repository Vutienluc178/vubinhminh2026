
import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
  isHighlighted?: boolean;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', isHighlighted = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Helper to format text segments (outside of math delimiters)
    const formatTextSegment = (text: string) => {
        // 1. Escape HTML entities to prevent XSS and rendering issues
        let safe = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Apply formatting rules
        return safe
            .replace(/\\\\/g, '<br />') // Explicitly handle '\\' as line break
            .replace(/\\n/g, '\n')      // Handle literal \n string
            .replace(/\n/g, '<br />')   // Handle actual newline char
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold markdown
    };

    // Split content by Math delimiters ($$ or $) using regex capture group to keep delimiters
    // Regex matches: $$...$$ OR $...$
    const parts = (content || '').split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    const formattedContent = parts.map(part => {
        // Check if this part is a math segment (starts with $)
        if (part.startsWith('$')) {
            return part; // Return math as is, MathJax will handle internal '\\' (e.g. for matrices)
        }
        
        // It's a text segment
        return formatTextSegment(part);
    }).join('');

    containerRef.current.innerHTML = formattedContent;

    const triggerMathJax = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            try {
                // Clear and re-typeset specifically for this container
                window.MathJax.typesetClear([containerRef.current]);
                window.MathJax.typesetPromise([containerRef.current])
                    .then(() => {
                      // Post-typeset adjustment: ensure baseline alignment for inline math
                      const mjxElements = containerRef.current?.querySelectorAll('mjx-container');
                      mjxElements?.forEach((el: any) => {
                        el.style.verticalAlign = 'baseline';
                      });
                    })
                    .catch((err: any) => console.warn('MathJax Typeset Error:', err));
            } catch (e) {
                console.error("MathJax operation failed", e);
            }
        }
    };

    const timeoutId = setTimeout(triggerMathJax, 100);
    return () => clearTimeout(timeoutId);
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-content leading-relaxed transition-all duration-300 ${isHighlighted ? 'math-highlight' : ''} ${className}`}
      style={{ 
        overflowWrap: 'anywhere',
        wordBreak: 'normal',
        fontSize: 'inherit',
        color: 'inherit',
        textAlign: 'inherit',
        maxWidth: '100%',
        overflowX: 'visible',
        display: 'inline-block'
      }}
    />
  );
};
