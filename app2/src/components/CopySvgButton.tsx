import { useState } from "react";
import type { JSX } from "react";

export interface CopySvgButtonProps {
  // Reference to the SVG element to copy
  svgRef: React.RefObject<SVGSVGElement | null>;
  // Optional title for the button
  title?: string;
}

// Formats the SVG element to a string with proper XML formatting
function formatSvg(svg: SVGSVGElement): string {
  // Clone the SVG to avoid modifying the original
  const clone = svg.cloneNode(true) as SVGSVGElement;

  // Serialize the SVG to a string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Add XML declaration
  svgString = '<?xml version="1.0" standalone="no"?>\n' + svgString;

  return svgString;
}

export function CopySvgButton({
  svgRef,
  title = "Copy SVG to clipboard",
}: CopySvgButtonProps): JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);

  const copySvgToClipboard = (): void => {
    if (!svgRef.current) {
      console.error("No SVG element to copy");
      return;
    }

    try {
      const formattedSvg = formatSvg(svgRef.current);
      navigator.clipboard
        .writeText(formattedSvg)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy SVG: ", err);
        });
    } catch (err) {
      console.error("Clipboard API not available: ", err);
    }
  };

  return (
    <button
      onClick={copySvgToClipboard}
      className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
      title={title}
    >
      {copied ? (
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path>
            <path d="M5 9a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2H5z"></path>
          </svg>
          Copy SVG
        </span>
      )}
    </button>
  );
}
