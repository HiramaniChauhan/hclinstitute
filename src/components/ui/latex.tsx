import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexProps {
    content: string;
    className?: string;
}

export const Latex: React.FC<LatexProps> = ({ content, className }) => {
    if (!content) return null;

    // Split content by:
    // 1. $$ ... $$ (block)
    // 2. $ ... $ (inline)
    // 3. \[ ... \] (block)
    // 4. \( ... \) (inline)
    // Using a more comprehensive regex to catch these common delimiters
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$.*?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (!part) return null;

                // Check for block math: $$...$$ or \[...\]
                if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
                    const formula = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
                    return <BlockMath key={index} math={formula} />;
                }

                // Check for inline math: $...$ or \(...\)
                if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
                    const formula = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
                    return <InlineMath key={index} math={formula} />;
                }

                // Regular text (potentially with HTML-like tags)
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
