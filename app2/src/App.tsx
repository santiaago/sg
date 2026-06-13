import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { useGeometryStore } from "./react-store";
import { SquareDslSvg } from "./components/SquareDslSvg";
import { SixFoldDslSvg } from "./components/SixFoldDslSvg";
import { SixFoldDslV1Svg } from "./components/SixFoldDslV1Svg";
import { SixFoldDslV2Svg } from "./components/SixFoldDslV2Svg";
import { GeometrySection } from "./components/GeometrySection";
import { NumberSvg, type NumberId } from "./components/NumberSvg";
import { NumberPicker } from "./components/NumberPicker";
import { standardSvgConfig } from "./config/svgConfig";
import { Navigation } from "./components/Navigation";
import { buildSquareDslSteps } from "./geometry/squareDslSteps";
import { buildSixfoldDslSteps } from "./geometry/sixfoldDslSteps";
import { buildSixfoldDslV1Steps } from "./geometry/sixfoldDslV1Steps";
import { buildSixfoldDslV2Steps } from "./geometry/sixfoldDslV2Steps";
import { buildNumber1Steps } from "./geometry/numbers/1";
import { buildNumber2Steps } from "./geometry/numbers/2";
import { buildNumber3Steps } from "./geometry/numbers/3";
import { buildNumber4Steps } from "./geometry/numbers/4";
import { lightTheme, darkTheme } from "./themes";
import type { Theme, GeometryType, Step } from "./types/geometry";
import { useSmartStepper } from "./hooks/useSmartStepper";
import { useGeometrySectionPlayback } from "./hooks/useGeometrySectionPlayback";
import type { NumberConfig } from "./geometry/numbers/config";

const GEOMETRY_TYPES: ReadonlyArray<GeometryType> = [
  "point",
  "line",
  "circle",
  "polygon",
  "coordinate_system",
] as const;

export default function App(): JSX.Element {
  const strokeMid = 0.5;
  const strokeBig = 2;
  const strokeLine = 1.4;

  // Theme state
  const [svgTheme, setSvgTheme] = useState<Theme>(darkTheme);

  // Set initial theme class on document element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", svgTheme === darkTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = svgTheme === darkTheme ? lightTheme : darkTheme;
    setSvgTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === darkTheme);
  }, [svgTheme]);

  // Navigation menu state
  type SectionId = "square-dsl" | "sixfold-dsl" | "sixfold-dsl-v2" | "sixfold-dsl-v1" | "numbers";
  const [activeSection, setActiveSection] = useState<SectionId>("sixfold-dsl-v2");
  const sectionRefs = {
    "square-dsl": useRef<HTMLDivElement>(null),
    "sixfold-dsl": useRef<HTMLDivElement>(null),
    "sixfold-dsl-v2": useRef<HTMLDivElement>(null),
    "sixfold-dsl-v1": useRef<HTMLDivElement>(null),
    numbers: useRef<HTMLDivElement>(null),
  };

  // Scroll to section when navigation changes
  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
    const timeoutId = setTimeout(() => {
      sectionRefs[sectionId].current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      clearTimeout(timeoutId);
    }, 100);
  };

  // Numbers section state
  const [selectedNumber, setSelectedNumber] = useState<NumberId>(1);
  const storeNumbers = useGeometryStore();
  const numbersSvgRef = useRef<SVGSVGElement>(null);

  // Build number steps
  const number1Steps = useMemo(() => buildNumber1Steps(), []);
  const number2Steps = useMemo(() => buildNumber2Steps(), []);
  const number3Steps = useMemo(() => buildNumber3Steps(), []);
  const number4Steps = useMemo(() => buildNumber4Steps(), []);

  // Get steps for current number
  const currentNumberSteps = useMemo(() => {
    switch (selectedNumber) {
      case 1:
        return number1Steps;
      case 2:
        return number2Steps;
      case 3:
        return number3Steps;
      case 4:
        return number4Steps;
      default:
        return number1Steps;
    }
  }, [selectedNumber, number1Steps, number2Steps, number3Steps, number4Steps]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) as SectionId | "";
      const validSections = [
        "square-dsl",
        "sixfold-dsl",
        "sixfold-dsl-v2",
        "sixfold-dsl-v1",
        "numbers",
      ] as const;
      if (hash && validSections.includes(hash as SectionId)) {
        scrollToSection(hash);
      }
    };

    // Check initial hash on load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Stores for each section
  const storeSquareDsl = useGeometryStore();
  const storeSixFoldDsl = useGeometryStore();
  const storeSixFoldDslV1 = useGeometryStore();
  const storeSixFoldDslV2 = useGeometryStore();

  // Global input highlight state
  const [showInputHighlight, setShowInputHighlight] = useState(true);
  const toggleInputs = useCallback((): void => {
    setShowInputHighlight(!showInputHighlight);
  }, [showInputHighlight]);

  // SVG refs
  const squareDslSvgRef = useRef<SVGSVGElement>(null);
  const sixfoldDslSvgRef = useRef<SVGSVGElement>(null);
  const sixfoldDslV1SvgRef = useRef<SVGSVGElement>(null);
  const sixfoldDslV2SvgRef = useRef<SVGSVGElement>(null);

  // Build steps once
  const squareDslSteps = useMemo(() => buildSquareDslSteps(), []);
  const sixfoldDslSteps = useMemo(() => buildSixfoldDslSteps(), []);
  const sixfoldDslV1Steps = useMemo(() => buildSixfoldDslV1Steps(), []);
  const sixfoldDslV2Steps = useMemo(() => buildSixfoldDslV2Steps(), []);

  // Smart steppers
  const squareDslStepper = useSmartStepper({ steps: squareDslSteps });
  const sixfoldDslStepper = useSmartStepper({ steps: sixfoldDslSteps });
  const sixfoldDslV1Stepper = useSmartStepper({ steps: sixfoldDslV1Steps });
  const sixfoldDslV2Stepper = useSmartStepper({ steps: sixfoldDslV2Steps });

  // Playback hooks for each section
  const squareDslPlayback = useGeometrySectionPlayback({
    stepper: squareDslStepper,
    store: storeSquareDsl,
    steps: squareDslSteps as readonly Step[],
  });

  const sixfoldDslPlayback = useGeometrySectionPlayback({
    stepper: sixfoldDslStepper,
    store: storeSixFoldDsl,
    steps: sixfoldDslSteps as readonly Step[],
  });

  const sixfoldDslV1Playback = useGeometrySectionPlayback({
    stepper: sixfoldDslV1Stepper,
    store: storeSixFoldDslV1,
    steps: sixfoldDslV1Steps as readonly Step[],
  });

  const sixfoldDslV2Playback = useGeometrySectionPlayback({
    stepper: sixfoldDslV2Stepper,
    store: storeSixFoldDslV2,
    steps: sixfoldDslV2Steps as readonly Step[],
  });

  return (
    <main className="p-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-left text-blue-400">sg</h1>

      <Navigation
        onNavigate={scrollToSection}
        activeSection={activeSection}
        onToggleTheme={toggleTheme}
        svgTheme={svgTheme}
      />

      {/* SixFold DSL v2 Section */}
      <GeometrySection
        ref={sectionRefs["sixfold-dsl-v2"]}
        sectionId="sixfold-dsl-v2"
        title="SixFold v2 DSL with cs2 and flipX"
        date="05/15/2026"
        description={`SixFold v2 construction using DSL with cs2 coordinate system and flipX transformation (${sixfoldDslV2Steps.length} steps).`}
        stepper={sixfoldDslV2Stepper}
        SvgComponent={SixFoldDslV2Svg}
        svgRef={sixfoldDslV2SvgRef}
        svgConfig={standardSvgConfig}
        restartKey={sixfoldDslV2Playback.restartKey}
        store={storeSixFoldDslV2}
        strokeBig={strokeBig}
        steps={sixfoldDslV2Steps}
        strokeMid={strokeMid}
        strokeLine={strokeLine}
        showInputHighlight={showInputHighlight}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={toggleInputs}
        isPlaying={sixfoldDslV2Playback.isPlaying}
        onPlayClick={sixfoldDslV2Playback.handlePlayClick}
        onFirstStep={sixfoldDslV2Playback.handleFirstStep}
        onPrevStep={sixfoldDslV2Playback.handlePrevClick}
        onNextStep={sixfoldDslV2Playback.handleNextClick}
        onLastStep={sixfoldDslV2Playback.handleLastStep}
        theme={svgTheme}
      />

      {/* SixFold DSL v1 Section */}
      <GeometrySection
        ref={sectionRefs["sixfold-dsl-v1"]}
        sectionId="sixfold-dsl-v1"
        title="SixFold v1 DSL with cs2"
        date="05/14/2026"
        description={`SixFold v1 construction using DSL with cs2 coordinate system (${sixfoldDslV1Steps.length} visual steps).`}
        stepper={sixfoldDslV1Stepper}
        SvgComponent={SixFoldDslV1Svg}
        svgRef={sixfoldDslV1SvgRef}
        svgConfig={standardSvgConfig}
        restartKey={sixfoldDslV1Playback.restartKey}
        store={storeSixFoldDslV1}
        strokeBig={strokeBig}
        steps={sixfoldDslV1Steps}
        strokeMid={strokeMid}
        strokeLine={strokeLine}
        showInputHighlight={showInputHighlight}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={toggleInputs}
        isPlaying={sixfoldDslV1Playback.isPlaying}
        onPlayClick={sixfoldDslV1Playback.handlePlayClick}
        onFirstStep={sixfoldDslV1Playback.handleFirstStep}
        onPrevStep={sixfoldDslV1Playback.handlePrevClick}
        onNextStep={sixfoldDslV1Playback.handleNextClick}
        onLastStep={sixfoldDslV1Playback.handleLastStep}
        theme={svgTheme}
      />

      {/* SixFold DSL Section */}
      <GeometrySection
        ref={sectionRefs["sixfold-dsl"]}
        sectionId="sixfold-dsl"
        title="SixFold v0 DSL"
        date="05/12/2025"
        description="SixFold v0 construction using the new declarative DSL implementation (96 steps)."
        stepper={sixfoldDslStepper}
        SvgComponent={SixFoldDslSvg}
        svgRef={sixfoldDslSvgRef}
        svgConfig={standardSvgConfig}
        restartKey={sixfoldDslPlayback.restartKey}
        store={storeSixFoldDsl}
        strokeBig={strokeBig}
        steps={sixfoldDslSteps}
        strokeMid={strokeMid}
        strokeLine={strokeLine}
        showInputHighlight={showInputHighlight}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={toggleInputs}
        isPlaying={sixfoldDslPlayback.isPlaying}
        onPlayClick={sixfoldDslPlayback.handlePlayClick}
        onFirstStep={sixfoldDslPlayback.handleFirstStep}
        onPrevStep={sixfoldDslPlayback.handlePrevClick}
        onNextStep={sixfoldDslPlayback.handleNextClick}
        onLastStep={sixfoldDslPlayback.handleLastStep}
        theme={svgTheme}
      />

      {/* DSL Square Section */}
      <GeometrySection
        ref={sectionRefs["square-dsl"]}
        sectionId="square-dsl"
        title="Square DSL"
        date="05/07/2026"
        description="Square construction using the new declarative DSL implementation."
        stepper={squareDslStepper}
        SvgComponent={SquareDslSvg}
        svgRef={squareDslSvgRef}
        svgConfig={standardSvgConfig}
        restartKey={squareDslPlayback.restartKey}
        store={storeSquareDsl}
        strokeBig={strokeBig}
        steps={squareDslSteps}
        strokeMid={strokeMid}
        strokeLine={strokeLine}
        showInputHighlight={showInputHighlight}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={toggleInputs}
        isPlaying={squareDslPlayback.isPlaying}
        onPlayClick={squareDslPlayback.handlePlayClick}
        onFirstStep={squareDslPlayback.handleFirstStep}
        onPrevStep={squareDslPlayback.handlePrevClick}
        onNextStep={squareDslPlayback.handleNextClick}
        onLastStep={squareDslPlayback.handleLastStep}
        theme={svgTheme}
      />

      {/* Numbers Section */}
      <section
        ref={sectionRefs["numbers"]}
        id="numbers"
        className="mt-16"
        data-testid="numbers-section"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-blue-400">Numbers Geometry</h2>
          <p className="text-gray-400 mb-6">
            Select a number (1-4) to explore its geometric construction step-by-step.
          </p>
          <NumberPicker
            onSelectNumber={(num) => {
              setSelectedNumber(num);
            }}
          />
          <div className="bg-gray-800 rounded-lg p-4 mb-8">
            <NumberSvg
              store={storeNumbers}
              svgConfig={standardSvgConfig}
              restartTrigger={0}
              currentStep={currentNumberSteps.length}
              theme={svgTheme}
              number={selectedNumber}
              steps={currentNumberSteps as Step<NumberConfig>[]}
              ref={numbersSvgRef}
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>
              Number {selectedNumber}:{" "}
              {selectedNumber === 1
                ? "Dot"
                : selectedNumber === 2
                  ? "Two Circles"
                  : selectedNumber === 3
                    ? "Three Circles"
                    : "Four Circles"}{" "}
              ({currentNumberSteps.length} steps)
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
