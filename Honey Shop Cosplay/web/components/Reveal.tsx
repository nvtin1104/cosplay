'use client';
import { useEffect, useRef } from 'react';
export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) { const ref = useRef<HTMLDivElement>(null); useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add('visible'); observer.disconnect(); } }, { threshold: .12 }); observer.observe(node); return () => observer.disconnect(); }, []); return <div ref={ref} className={`reveal ${className}`}>{children}</div>; }
