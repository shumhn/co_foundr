'use client';

import React from 'react';

interface GlitchTextProps {
    text: string;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

export default function GlitchText({ text, className = '', as: Component = 'span' }: GlitchTextProps) {
    return (
        <Component className={`relative inline-block group ${className}`}>
            <span className="relative z-10">{text}</span>
            <span
                className="absolute top-0 left-0 -z-10 w-full h-full text-[#00D4AA] opacity-0 group-hover:opacity-100 group-hover:animate-[glitch-anim-1_0.4s_infinite_linear_alternate-reverse] translate-x-[2px]"
                aria-hidden="true"
            >
                {text}
            </span>
            <span
                className="absolute top-0 left-0 -z-10 w-full h-full text-[#6366f1] opacity-0 group-hover:opacity-100 group-hover:animate-[glitch-anim-2_0.4s_infinite_linear_alternate-reverse] -translate-x-[2px]"
                aria-hidden="true"
            >
                {text}
            </span>
        </Component>
    );
}
