import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface ProductBarcodeProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export const ProductBarcode: React.FC<ProductBarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 38,
  displayValue = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value && value.trim()) {
      const cleanVal = value.trim();
      try {
        JsBarcode(svgRef.current, cleanVal, {
          format,
          width,
          height,
          displayValue,
          fontSize: 11,
          textMargin: 2,
          margin: 4,
          background: '#ffffff',
          lineColor: '#0f172a',
        });
      } catch {
        // Fallback to universal CODE128 format if length/check-digit doesn't fit EAN
        try {
          JsBarcode(svgRef.current, cleanVal, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize: 11,
            margin: 4,
            background: '#ffffff',
            lineColor: '#0f172a',
          });
        } catch (e) {
          console.warn('Failed to render barcode for value:', cleanVal, e);
        }
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value || !value.trim()) {
    return null;
  }

  return (
    <div className={`inline-flex flex-col items-center bg-white p-1 rounded-xl border border-yellow-200/90 shadow-2xs ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
};
