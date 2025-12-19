'use client';

import React from 'react';

interface GlitchTextProps {
    text: string;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

export default function GlitchText({ text, className = '', as: Component = 'span' }: GlitchTextProps) {
    return (
        <Component className={`relative inline-flex flex-wrap ${className}`}>
            {text.split('').map((char, i) => (
                <span
                    key={i}
                    className="opacity-0 animate-in inline-block whitespace-pre"
                    style={{ animationDelay: `${i * 30}ms` }}
                >
                    {char}
                </span>
            ))}
        </Component>
    );
}

