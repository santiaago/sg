import { useCallback } from "react";
import type { ReactNode, Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { Theme } from "../themes";
import { CopySvgButton } from "./CopySvgButton";

// Props for the GeometryPlayer component
export interface GeometryPlayerProps {
  // Reference to the SVG element (for CopySvgButton)
  svgRef: React.RefObject<SVGSVGElement | null>;
  
  // Current step number
  currentStep: number;
  
  // Total number of steps
  totalSteps: number;
  
  // Callback when step changes
  onStepChange: (step: number) => void;
  
  // Callback for first step
  onFirstStep?: () => void;
  
  // Callback for previous step
  onPrevStep?: () => void;
  
  // Callback for next step
  onNextStep?: () => void;
  
  // Callback for last step
  onLastStep?: () => void;
  
  // Callback for restart
  onRestart?: () => void;
  
  // Whether to show the inputs toggle button
  showInputsToggle?: boolean;
  
  // Current state of inputs highlight
  showInputHighlight?: boolean;
  
  // Callback to toggle inputs highlight
  onToggleInputs?: () => void;
  
  // SVG configuration
  svgConfig: SvgConfig;
  
  // Theme
  theme?: Theme;
  
  // Children (the SVG component to render)
  children: ReactNode;
  
  // Whether to show the CopySvgButton
  showCopyButton?: boolean;
}

/**
 * GeometryPlayer component - Wraps an SVG geometry component with player controls.
 * Provides a consistent interface for step navigation, restart, and other controls.
 */
export function GeometryPlayer(
  {
    svgRef,
    currentStep,
    totalSteps,
    onStepChange,
    onFirstStep,
    onPrevStep,
    onNextStep,
    onLastStep,
    onRestart,
    showInputsToggle = false,
    showInputHighlight = false,
    onToggleInputs,
    svgConfig,
    theme,
    children,
    showCopyButton = true,
  }: GeometryPlayerProps,
): React.JSX.Element {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStep = parseInt(e.target.value, 10);
      if (!isNaN(newStep)) {
        onStepChange(newStep);
      }
    },
    [onStepChange],
  );

  const progressPercent = ((currentStep ?? 0) / totalSteps) * 100;

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <div className="flex flex-col items-center gap-2">
        {children}
        
        {/* Slider */}
        {onStepChange && totalSteps > 0 && (
          <div className="w-full max-w-md">
            <input
              type="range"
              min={0}
              max={totalSteps}
              step={1}
              value={currentStep ?? 0}
              onChange={handleSliderChange}
              aria-label="Step navigation"
              name="step-slider"
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, #4b5563 ${progressPercent}%, #4b5563 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{totalSteps}</span>
            </div>
          </div>
        )}

        {/* Player Controls */}
        <div className="mt-1 flex gap-2">
          {onFirstStep && (
            <button
              onClick={onFirstStep}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              title="Go to beginning"
            >
              ««
            </button>
          )}

          {onPrevStep && (
            <button
              onClick={onPrevStep}
              className={`px-4 py-2 text-white rounded ${
                currentStep <= 1
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              disabled={currentStep <= 1}
            >
              prev
            </button>
          )}

          {onNextStep && (
            <button
              onClick={onNextStep}
              className={`px-4 py-2 text-white rounded ${
                currentStep >= totalSteps
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
              disabled={currentStep >= totalSteps}
            >
              next
            </button>
          )}

          {onLastStep && (
            <button
              onClick={onLastStep}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              title="Go to end"
            >
              »»
            </button>
          )}

          {onRestart && (
            <button
              onClick={onRestart}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
              restart
            </button>
          )}

          {showInputsToggle && onToggleInputs && (
            <button
              onClick={onToggleInputs}
              className={`px-4 py-2 text-white rounded ${
                showInputHighlight ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              inputs
            </button>
          )}

          {showCopyButton && <CopySvgButton svgRef={svgRef} />}
        </div>
      </div>
    </div>
  );
}
