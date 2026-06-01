import { forwardRef } from "react";
import type { ReactNode, RefObject } from "react";
import { CopyUrlButton } from "./CopyUrlButton";
import { GeometryPlayer } from "./GeometryPlayer";
import { GeometryDetails } from "./GeometryDetails";
import { GeometryList } from "./GeometryList";
import type { GeometryStore } from "../react-store";
import type { StepRef, Theme } from "../types/geometry";
import type { GeometryType } from "../react-store";
import type { SvgConfig } from "../config/svgConfig";
import type { UseSmartStepperResult } from "../hooks/useSmartStepper";

/**
 * Props for the GeometrySection component.
 * All customization is through props (configuration-over-customization pattern).
 */
export interface GeometrySectionProps {
  // Identity props
  sectionId: string;
  title: string;
  date: string;
  description: string;

  // Step management props (from useSmartStepper)
  stepper: UseSmartStepperResult;

  // SVG rendering props
  SvgComponent: React.ComponentType<{
    ref?: RefObject<SVGSVGElement | null>;
    store: GeometryStore;
    dotStrokeWidth: number;
    svgConfig: SvgConfig;
    restartTrigger: number;
    currentStep: number;
    theme: Theme;
  }>;
  svgRef: RefObject<SVGSVGElement | null>;
  svgConfig: SvgConfig;
  restartKey: number;

  // Geometry details props
  store: GeometryStore;
  strokeBig: number;
  steps: readonly StepRef[];

  // Geometry list props
  strokeMid: number;
  strokeLine: number;
  showInputHighlight: boolean;
  availableTypes: ReadonlyArray<GeometryType>;

  // Player configuration props
  showInputsToggle: boolean;
  showPlayButton: boolean;
  onToggleInputs: () => void;

  // Play state props
  isPlaying: boolean;
  onPlayClick: () => void;

  // Navigation handlers
  onFirstStep: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onLastStep: () => void;

  // Theme
  theme: Theme;
}

/**
 * GeometrySection component - Encapsulates the common structure of all geometry construction sections.
 *
 * Renders:
 * - Section header with title, CopyUrlButton, and description
 * - CSS grid with col-span-7 (player), col-span-2 (details), col-span-3 (list)
 * - GeometryPlayer with SVG component
 * - GeometryDetails
 * - GeometryList
 *
 * Uses configuration-over-customization: all section content is configured via props.
 */
export const GeometrySection = forwardRef<HTMLDivElement, GeometrySectionProps>(
  (
    {
      sectionId,
      title,
      date,
      description,
      stepper,
      SvgComponent,
      svgRef,
      svgConfig,
      restartKey,
      store,
      strokeBig,
      steps,
      strokeMid,
      strokeLine,
      showInputHighlight,
      availableTypes,
      showInputsToggle,
      showPlayButton,
      onToggleInputs,
      isPlaying,
      onPlayClick,
      onFirstStep,
      onPrevStep,
      onNextStep,
      onLastStep,
      theme,
    },
    ref,
  ): ReactNode => {
    const { currentVisualIndex, visualStepCount, stepsUpToIndex } = stepper;

    return (
      <div
        ref={ref}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id={sectionId}
        data-testid={`section-${sectionId}`}
      >
        {/* Header */}
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">{title}</h1>
          <CopyUrlButton />
        </div>

        {/* Description */}
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">{date}</small>
          <p className="text-gray-300 mb-4">{description}</p>
        </div>

        {/* Main grid layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Player column (col-span-7) */}
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={svgRef}
              svgConfig={svgConfig}
              currentStep={currentVisualIndex}
              totalSteps={visualStepCount - 1}
              onStepChange={stepper.goToStep}
              onFirstStep={onFirstStep}
              onPrevStep={onPrevStep}
              onNextStep={onNextStep}
              onLastStep={onLastStep}
              showInputsToggle={showInputsToggle}
              showInputHighlight={showInputHighlight}
              onToggleInputs={onToggleInputs}
              showPlayButton={showPlayButton}
              isPlaying={isPlaying}
              onPlayClick={onPlayClick}
            >
              <SvgComponent
                ref={svgRef}
                store={store}
                dotStrokeWidth={strokeBig}
                svgConfig={svgConfig}
                restartTrigger={restartKey}
                currentStep={stepsUpToIndex}
                theme={theme}
              />
            </GeometryPlayer>
          </div>

          {/* Details column (col-span-2) */}
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentVisualIndex}/{visualStepCount}
            </p>
            <GeometryDetails store={store} strokeBig={strokeBig} steps={steps} />
          </div>

          {/* List column (col-span-3) */}
          <div className="col-span-3">
            <div>
              <GeometryList
                store={store}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
                showInputHighlight={showInputHighlight}
                showNameFilter={true}
                showTypeFilters={true}
                availableTypes={availableTypes}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

GeometrySection.displayName = "GeometrySection";
