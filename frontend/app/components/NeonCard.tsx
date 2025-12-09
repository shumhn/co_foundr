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

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation X
        const rotateY = ((x - centerX) / centerX) * 10;  // Max 10 deg rotation Y

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
            className={`relative rounded-3xl transition-all duration-200 ease-out transform-gpu ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                boxShadow: isHovered
                    ? '0 20px 50px -10px rgba(0, 212, 170, 0.3), 0 0 15px rgba(0, 212, 170, 0.2)'
                    : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            }}
        >
            {/* Dynamic Glow Border */}
            <div
                className={`absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-[#00D4AA] via-transparent to-[#6366f1] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-30'}`}
                style={{
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                }}
            />

            {/* Content */}
            <div className="relative h-full bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl p-[1px] overflow-hidden">
                {children}
            </div>
        </div>
    );
}
