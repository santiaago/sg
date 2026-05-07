import { useState, useRef, useCallback, useMemo } from "react";
import { GeometryPlayer } from "./GeometryPlayer";
import { SquaresV2Svg, buildSquareSteps } from "./SquaresV2Svg";
import { useGeometryStore } from "../react-store";
import type { SvgConfig } from "../config/svgConfig";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";
import { computeSquareConfig } from "../geometry/operations";

// Props for the SquaresV2 component
export interface SquaresV2Props {
  // SVG configuration
  svgConfig?: SvgConfig;

  // Theme
  theme?: Theme;

  // Initial step to show
  initialStep?: number;

  // Whether to show player controls
  showControls?: boolean;
}

/**
 * Get the total number of steps in the SquaresV2 construction
 */
function getTotalSteps(svgConfig: SvgConfig): number {
  const config = computeSquareConfig(svgConfig.width, svgConfig.height);
  const steps = buildSquareSteps(config);
  return steps.length;
}

/**
 * SquaresV2 component - Displays the square geometric construction using the declarative API.
 * This is a complete component with player controls that demonstrates the declarative framework.
 */
export function SquaresV2({
  svgConfig: propsSvgConfig,
  theme = darkTheme,
  initialStep = 0,
  showControls = true,
}: SquaresV2Props): React.JSX.Element {
  const store = useGeometryStore();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [restartTrigger, setRestartTrigger] = useState(0);

  // Default SVG config if not provided
  const svgConfig = useMemo(() => {
    return propsSvgConfig ?? {
      width: 840,
      height: 519,
      viewBox: "0 0 840 519",
      svgClass: "w-full h-full",
      containerClass: "w-full",
    };
  }, [propsSvgConfig]);

  // Compute total steps
  const totalSteps = useMemo(() => {
    return getTotalSteps(svgConfig);
  }, [svgConfig]);

  // Handle step changes
  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps)));
  }, [totalSteps]);

  // Handle navigation
  const handleFirstStep = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  }, [totalSteps]);

  const handleLastStep = useCallback(() => {
    setCurrentStep(totalSteps);
  }, [totalSteps]);

  const handleRestart = useCallback(() => {
    setRestartTrigger((prev) => prev + 1);
    setCurrentStep(0);
  }, []);

  if (showControls) {
    return (
      <GeometryPlayer
        svgRef={svgRef}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepChange={handleStepChange}
        onFirstStep={handleFirstStep}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
        onLastStep={handleLastStep}
        onRestart={handleRestart}
        showPlayButton={false}
        showInputsToggle={false}
        svgConfig={svgConfig}
        showCopyButton={true}
      >
        <SquaresV2Svg
          ref={svgRef}
          store={store}
          svgConfig={svgConfig}
          restartTrigger={restartTrigger}
          currentStep={currentStep}
          theme={theme}
        />
      </GeometryPlayer>
    );
  }

  // Without controls, just render the SVG
  return (
    <SquaresV2Svg
      ref={svgRef}
      store={store}
      svgConfig={svgConfig}
      restartTrigger={restartTrigger}
      currentStep={totalSteps}
      theme={theme}
    />
  );
}

// Export the builder function for testing
export { buildSquareSteps };
