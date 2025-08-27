import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AutoFitTextProps {
  children: React.ReactNode;
  maxFontSize?: number;
  minFontSize?: number;
  maxLines?: number;
  className?: string;
  style?: React.CSSProperties;
  isMobile?: boolean;
}

export function AutoFitText({ 
  children, 
  maxFontSize = 40, 
  minFontSize = 16, 
  maxLines = 1,
  className = '',
  style = {},
  isMobile = false
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(isMobile ? Math.min(maxFontSize, 32) : maxFontSize);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver>();

  const calculateOptimalSize = useCallback(() => {
    if (!containerRef.current || !measureRef.current) return;

    const container = containerRef.current;
    const measurer = measureRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    if (containerWidth === 0 || containerHeight === 0) return;

    let currentFontSize = isMobile ? Math.min(maxFontSize, 32) : maxFontSize;
    let currentLetterSpacing = 0;

    // Binary search for optimal font size
    let left = minFontSize;
    let right = currentFontSize;
    
    while (left <= right) {
      const midSize = Math.floor((left + right) / 2);
      
      measurer.style.fontSize = `${midSize}px`;
      measurer.style.letterSpacing = '0px';
      measurer.style.lineHeight = maxLines === 1 ? '1' : '1.2';
      
      const textWidth = measurer.offsetWidth;
      const textHeight = measurer.offsetHeight;
      
      const fitsWidth = textWidth <= containerWidth;
      const fitsHeight = textHeight <= containerHeight;
      
      if (fitsWidth && fitsHeight) {
        currentFontSize = midSize;
        left = midSize + 1;
      } else {
        right = midSize - 1;
      }
    }

    // If still doesn't fit at minimum size, try letter spacing
    if (currentFontSize === minFontSize) {
      measurer.style.fontSize = `${minFontSize}px`;
      
      for (let spacing = -0.1; spacing >= -0.5; spacing -= 0.1) {
        measurer.style.letterSpacing = `${spacing}px`;
        
        if (measurer.offsetWidth <= containerWidth && measurer.offsetHeight <= containerHeight) {
          currentLetterSpacing = spacing;
          break;
        }
      }
    }

    setFontSize(currentFontSize);
    setLetterSpacing(currentLetterSpacing);
  }, [maxFontSize, minFontSize, maxLines, isMobile]);

  useEffect(() => {
    calculateOptimalSize();
  }, [calculateOptimalSize, children]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use ResizeObserver to recalculate on container resize
    resizeObserverRef.current = new ResizeObserver(() => {
      requestAnimationFrame(calculateOptimalSize);
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [calculateOptimalSize]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-visible ${className}`}
      style={style}
    >
      {/* Hidden measurer */}
      <span
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: maxLines === 1 ? 'nowrap' : 'normal',
          top: -9999,
          left: -9999,
          fontSize: `${fontSize}px`,
          letterSpacing: `${letterSpacing}px`,
          lineHeight: maxLines === 1 ? '1' : '1.2',
        }}
        className="tabular-nums"
      >
        {children}
      </span>
      
      {/* Actual content */}
      <div
        style={{
          fontSize: `${fontSize}px`,
          letterSpacing: `${letterSpacing}px`,
          lineHeight: maxLines === 1 ? '1' : '1.2',
        }}
        className={`tabular-nums leading-none ${maxLines === 1 ? 'whitespace-nowrap' : ''} w-full h-full flex items-center justify-center`}
      >
        {children}
      </div>
    </div>
  );
}