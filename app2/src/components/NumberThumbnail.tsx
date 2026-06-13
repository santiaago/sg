import { useEffect, useRef, useState, useMemo } from "react";
import { rect } from "../svgElements";
import { setupSvg } from "../svg";

import { executeSteps } from "../geometry/stepExecution";
import { computeNumberConfig } from "../geometry/numbers/config";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";
import { useGeometryStore } from "../react-store";
import type { NumberId } from "./NumberSvg";
import type { Step } from "../types/geometry";
import type { NumberConfig } from "../geometry/numbers/config";

const THUMBNAIL_SIZE = 150;

// SVG config for thumbnails
const thumbnailSvgConfig = {
  viewBox: `0 0 ${THUMBNAIL_SIZE} ${THUMBNAIL_SIZE}`,
  width: THUMBNAIL_SIZE,
  height: THUMBNAIL_SIZE,
  containerClass: "thumbnail-container",
  svgClass: "thumbnail-svg",
} as const;

interface NumberThumbnailProps {
  number: NumberId;
  label: string;
  onClick: (number: NumberId) => void;
  theme?: Theme;
}

// Import step builders directly (not dynamic)
import { buildNumber1Steps } from "../geometry/numbers/1";
import { buildNumber2Steps } from "../geometry/numbers/2";
import { buildNumber3Steps } from "../geometry/numbers/3";
import { buildNumber4Steps } from "../geometry/numbers/4";

const stepBuilders: Record<NumberId, () => Step<NumberConfig>[]> = {
  1: () => buildNumber1Steps(),
  2: () => buildNumber2Steps(),
  3: () => buildNumber3Steps(),
  4: () => buildNumber4Steps(),
};

/**
 * NumberThumbnail component - Renders a 150x150 preview of a number's final geometry state.
 */
export function NumberThumbnail({
  number,
  label,
  onClick,
  theme = darkTheme,
}: NumberThumbnailProps): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const store = useGeometryStore();

  const numberConfig = useMemo(() => {
    return computeNumberConfig(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }, []);

  // Render thumbnail on mount
  useEffect(() => {
    renderThumbnail();
  }, [number]);

  const renderThumbnail = () => {
    if (!svgRef.current) return;

    setIsLoading(true);
    const svg = svgRef.current;

    try {
      // Setup SVG
      setupSvg(svg, thumbnailSvgConfig);
      rect(svg, THUMBNAIL_SIZE, THUMBNAIL_SIZE, theme);

      const allSteps = stepBuilders[number]();
      const totalSteps = allSteps.length;

      // Execute all steps to get final state
      executeSteps(allSteps, totalSteps, { svg, store, theme }, numberConfig);
    } catch (error) {
      console.error("Failed to render thumbnail for number", number, ":", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (!isLoading) {
      onClick(number);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-36 h-36 border-2 border-gray-600 rounded-lg overflow-hidden hover:border-blue-500 transition-colors bg-gray-800"
      title={label}
      data-testid={`thumbnail-${number}`}
      disabled={isLoading}
    >
      <svg ref={svgRef} className="w-full h-full" viewBox={thumbnailSvgConfig.viewBox} />
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </button>
  );
}
