'use client';

import React, { useRef, useState } from 'react';

interface NeonCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function NeonCard({ children, className = '' }: NeonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className={`relative rounded-2xl transition-all duration-500 ease-out transform-gpu ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovered ? 1.01 : 1}, ${isHovered ? 1.01 : 1}, 1)`,
                boxShadow: isHovered
                    ? '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 4px 20px -12px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Precision Border */}
            <div
                className={`absolute inset-0 rounded-2xl p-[1px] transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-20'}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.5) 0%, transparent 40%, rgba(99, 102, 241, 0.3) 100%)',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                }}
            />

            {/* Inner Glow/Reflection */}
            {isHovered && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none transition-opacity duration-500" />
            )}

            {/* Content Container */}
            <div className="relative h-full bg-zinc-950/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5">
                {children}
            </div>
        </div>
    );
}

