import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  lineColor?: string;
  className?: string;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 40,
  displayValue = true,
  fontSize = 12,
  lineColor = '#000000',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: format,
        width: width,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        margin: 2,
        lineColor: lineColor,
        font: 'monospace',
        textMargin: 2,
      });
    } catch {
      // Fallback to generic code128 if EAN checksum fails
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width: width,
            height: height,
            displayValue: displayValue,
            fontSize: fontSize,
            margin: 2,
            lineColor: lineColor,
            font: 'monospace',
            textMargin: 2,
          });
        }
      } catch {
        // quiet fallback
      }
    }
  }, [value, format, width, height, displayValue, fontSize, lineColor]);

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
