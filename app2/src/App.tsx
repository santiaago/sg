import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { useGeometryStore } from "./react-store";
import { SquareDslSvg } from "./components/SquareDslSvg";
import { SixFoldDslSvg } from "./components/SixFoldDslSvg";
import { SixFoldDslV1Svg } from "./components/SixFoldDslV1Svg";
import { GeometryPlayer } from "./components/GeometryPlayer";
import { standardSvgConfig } from "./config/svgConfig";
import { GeometryList } from "./components/GeometryList";
import { GeometryDetails } from "./components/GeometryDetails";
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";
import { DSL_SQUARE_STEPS_LENGTH, buildSquareDslSteps } from "./geometry/squareDslSteps";
import { DSL_SIXFOLD_STEPS_LENGTH, buildSixfoldDslSteps } from "./geometry/sixfoldDslSteps";
import { buildSixfoldDslV1Steps } from "./geometry/sixfoldDslV1Steps";
import { lightTheme, darkTheme } from "./themes";
import type { Theme, GeometryType } from "./types/geometry";
import { useSmartStepper } from "./hooks/useSmartStepper";

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
    // Also update the document background for consistency
    document.documentElement.classList.toggle("dark", newTheme === darkTheme);
  }, [svgTheme]);

  // Navigation menu state
  type SectionId = "square-dsl" | "sixfold-dsl" | "sixfold-dsl-v1";
  const [activeSection, setActiveSection] = useState<SectionId>("sixfold-dsl-v1");
  const sectionRefs = {
    "square-dsl": useRef<HTMLDivElement>(null),
    "sixfold-dsl": useRef<HTMLDivElement>(null),
    "sixfold-dsl-v1": useRef<HTMLDivElement>(null),
  };

  // Scroll to section when navigation changes
  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    // Update URL hash
    window.location.hash = sectionId;
    const timeoutId = setTimeout(() => {
      sectionRefs[sectionId].current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      clearTimeout(timeoutId);
    }, 100);
  };

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) as SectionId | "";
      const validSections = ["square-dsl", "sixfold-dsl", "sixfold-dsl-v1"] as const;
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

  const storeSquareDsl = useGeometryStore();
  const storeSixFoldDsl = useGeometryStore();
  const storeSixFoldDslV1 = useGeometryStore();

  const [showInputHighlight, setShowInputHighlight] = useState(true);
  const toggleInputs = (): void => {
    setShowInputHighlight(!showInputHighlight);
  };

  // DSL Square state
  // Use the constant exported from squareDslSteps
  const [currentStepSquareDsl, setCurrentStepSquareDsl] = useState<number>(0);
  const [restartKeySquareDsl, setRestartKeySquareDsl] = useState<number>(0);
  const [isPlayingSquareDsl, setIsPlayingSquareDsl] = useState<boolean>(false);
  const squareDslSvgRef = useRef<SVGSVGElement>(null);
  const playIntervalSquareDsl = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build DSL square steps once
  const squareDslSteps = useMemo(() => buildSquareDslSteps(), []);

  // SixFold DSL state
  const [currentStepSixfoldDsl, setCurrentStepSixfoldDsl] = useState<number>(0);
  const [restartKeySixfoldDsl, setRestartKeySixfoldDsl] = useState<number>(0);
  const [isPlayingSixfoldDsl, setIsPlayingSixfoldDsl] = useState<boolean>(false);
  const sixfoldDslSvgRef = useRef<SVGSVGElement>(null);
  const playIntervalSixfoldDsl = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build DSL sixfold steps once
  const sixfoldDslSteps = useMemo(() => buildSixfoldDslSteps(), []);

  // SixFold DSL v1 state
  const [restartKeySixfoldDslV1, setRestartKeySixfoldDslV1] = useState<number>(0);
  const [isPlayingSixfoldDslV1, setIsPlayingSixfoldDslV1] = useState<boolean>(false);
  const sixfoldDslV1SvgRef = useRef<SVGSVGElement>(null);
  const playIntervalSixfoldDslV1 = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs to track latest stepper state for interval callbacks
  const currentVisualIndexV1Ref = useRef<number>(0);
  const visualStepCountV1Ref = useRef<number>(0);

  // Build DSL sixfold v1 steps once
  const sixfoldDslV1Steps = useMemo(() => buildSixfoldDslV1Steps(), []);

  // Smart stepper for SixFold DSL v1 - manages visual step navigation
  const {
    currentVisualIndex: currentVisualIndexV1,
    visualStepCount: visualStepCountV1,
    stepsUpToIndex: stepsUpToIndexV1,
    goToNext: goToNextV1,
    goToPrev: goToPrevV1,
    goToStep: goToStepV1,
    canGoNext: canGoNextV1,
    canGoPrev: canGoPrevV1,
  } = useSmartStepper({ steps: sixfoldDslV1Steps });

  // Keep refs in sync with latest stepper state
  useEffect(() => {
    currentVisualIndexV1Ref.current = currentVisualIndexV1;
  }, [currentVisualIndexV1]);

  useEffect(() => {
    visualStepCountV1Ref.current = visualStepCountV1;
  }, [visualStepCountV1]);

  const handleNextClickSquareDsl = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSquareDsl && playIntervalSquareDsl.current) {
      clearInterval(playIntervalSquareDsl.current);
      playIntervalSquareDsl.current = null;
      setIsPlayingSquareDsl(false);
    }
    if (currentStepSquareDsl < DSL_SQUARE_STEPS_LENGTH) {
      setCurrentStepSquareDsl(currentStepSquareDsl + 1);
    }
  };

  const handlePrevClickSquareDsl = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSquareDsl && playIntervalSquareDsl.current) {
      clearInterval(playIntervalSquareDsl.current);
      playIntervalSquareDsl.current = null;
      setIsPlayingSquareDsl(false);
    }
    if (currentStepSquareDsl > 0) {
      setCurrentStepSquareDsl(currentStepSquareDsl - 1);
    }
  };

  const handleFirstStepSquareDsl = (): void => {
    // Stop playing when jumping to first step
    if (isPlayingSquareDsl && playIntervalSquareDsl.current) {
      clearInterval(playIntervalSquareDsl.current);
      playIntervalSquareDsl.current = null;
      setIsPlayingSquareDsl(false);
    }
    storeSquareDsl.clear();
    setCurrentStepSquareDsl(0);
    setRestartKeySquareDsl(restartKeySquareDsl + 1);
  };

  const handleLastStepSquareDsl = (): void => {
    // Stop playing when jumping to end
    if (isPlayingSquareDsl && playIntervalSquareDsl.current) {
      clearInterval(playIntervalSquareDsl.current);
      playIntervalSquareDsl.current = null;
      setIsPlayingSquareDsl(false);
    }
    storeSquareDsl.clear();
    setCurrentStepSquareDsl(DSL_SQUARE_STEPS_LENGTH);
    setRestartKeySquareDsl(restartKeySquareDsl + 1);
  };

  const handlePlayClickSquareDsl = (): void => {
    if (isPlayingSquareDsl) {
      // Stop playing
      if (playIntervalSquareDsl.current) {
        clearInterval(playIntervalSquareDsl.current);
        playIntervalSquareDsl.current = null;
      }
      setIsPlayingSquareDsl(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalSquareDsl.current) {
        clearInterval(playIntervalSquareDsl.current);
        playIntervalSquareDsl.current = null;
      }
      // Reset to 0 if at the end
      if (currentStepSquareDsl >= DSL_SQUARE_STEPS_LENGTH) {
        setCurrentStepSquareDsl(0);
      }
      // Start playing
      setIsPlayingSquareDsl(true);
      playIntervalSquareDsl.current = setInterval(() => {
        setCurrentStepSquareDsl((prev) => {
          if (prev >= DSL_SQUARE_STEPS_LENGTH) {
            // Stop when reaching the end
            if (playIntervalSquareDsl.current) {
              clearInterval(playIntervalSquareDsl.current);
              playIntervalSquareDsl.current = null;
            }
            setIsPlayingSquareDsl(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200); // 200ms delay between steps
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalSquareDsl.current) {
        clearInterval(playIntervalSquareDsl.current);
      }
    };
  }, []);

  // SixFold DSL handlers
  const handleNextClickSixfoldDsl = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSixfoldDsl && playIntervalSixfoldDsl.current) {
      clearInterval(playIntervalSixfoldDsl.current);
      playIntervalSixfoldDsl.current = null;
      setIsPlayingSixfoldDsl(false);
    }
    if (currentStepSixfoldDsl < DSL_SIXFOLD_STEPS_LENGTH) {
      setCurrentStepSixfoldDsl(currentStepSixfoldDsl + 1);
    }
  };

  const handlePrevClickSixfoldDsl = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSixfoldDsl && playIntervalSixfoldDsl.current) {
      clearInterval(playIntervalSixfoldDsl.current);
      playIntervalSixfoldDsl.current = null;
      setIsPlayingSixfoldDsl(false);
    }
    if (currentStepSixfoldDsl > 0) {
      setCurrentStepSixfoldDsl(currentStepSixfoldDsl - 1);
    }
  };

  const handleFirstStepSixfoldDsl = (): void => {
    // Stop playing when jumping to first step
    if (isPlayingSixfoldDsl && playIntervalSixfoldDsl.current) {
      clearInterval(playIntervalSixfoldDsl.current);
      playIntervalSixfoldDsl.current = null;
      setIsPlayingSixfoldDsl(false);
    }
    storeSixFoldDsl.clear();
    setCurrentStepSixfoldDsl(0);
    setRestartKeySixfoldDsl(restartKeySixfoldDsl + 1);
  };

  const handleLastStepSixfoldDsl = (): void => {
    // Stop playing when jumping to end
    if (isPlayingSixfoldDsl && playIntervalSixfoldDsl.current) {
      clearInterval(playIntervalSixfoldDsl.current);
      playIntervalSixfoldDsl.current = null;
      setIsPlayingSixfoldDsl(false);
    }
    storeSixFoldDsl.clear();
    setCurrentStepSixfoldDsl(DSL_SIXFOLD_STEPS_LENGTH);
    setRestartKeySixfoldDsl(restartKeySixfoldDsl + 1);
  };

  const handlePlayClickSixfoldDsl = (): void => {
    if (isPlayingSixfoldDsl) {
      // Stop playing
      if (playIntervalSixfoldDsl.current) {
        clearInterval(playIntervalSixfoldDsl.current);
        playIntervalSixfoldDsl.current = null;
      }
      setIsPlayingSixfoldDsl(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalSixfoldDsl.current) {
        clearInterval(playIntervalSixfoldDsl.current);
        playIntervalSixfoldDsl.current = null;
      }
      // Reset to 0 if at the end
      if (currentStepSixfoldDsl >= DSL_SIXFOLD_STEPS_LENGTH) {
        setCurrentStepSixfoldDsl(0);
      }
      // Start playing
      setIsPlayingSixfoldDsl(true);
      playIntervalSixfoldDsl.current = setInterval(() => {
        setCurrentStepSixfoldDsl((prev) => {
          if (prev >= DSL_SIXFOLD_STEPS_LENGTH) {
            // Stop when reaching the end
            if (playIntervalSixfoldDsl.current) {
              clearInterval(playIntervalSixfoldDsl.current);
              playIntervalSixfoldDsl.current = null;
            }
            setIsPlayingSixfoldDsl(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200); // 200ms delay between steps
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalSixfoldDsl.current) {
        clearInterval(playIntervalSixfoldDsl.current);
      }
    };
  }, []);

  // SixFold DSL v1 handlers
  const handleNextClickSixfoldDslV1 = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSixfoldDslV1 && playIntervalSixfoldDslV1.current) {
      clearInterval(playIntervalSixfoldDslV1.current);
      playIntervalSixfoldDslV1.current = null;
      setIsPlayingSixfoldDslV1(false);
    }
    if (canGoNextV1) {
      goToNextV1();
    }
  };

  const handlePrevClickSixfoldDslV1 = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSixfoldDslV1 && playIntervalSixfoldDslV1.current) {
      clearInterval(playIntervalSixfoldDslV1.current);
      playIntervalSixfoldDslV1.current = null;
      setIsPlayingSixfoldDslV1(false);
    }
    if (canGoPrevV1) {
      goToPrevV1();
    }
  };

  const handleFirstStepSixfoldDslV1 = (): void => {
    // Stop playing when jumping to first step
    if (isPlayingSixfoldDslV1 && playIntervalSixfoldDslV1.current) {
      clearInterval(playIntervalSixfoldDslV1.current);
      playIntervalSixfoldDslV1.current = null;
      setIsPlayingSixfoldDslV1(false);
    }
    storeSixFoldDslV1.clear();
    goToStepV1(0);
    setRestartKeySixfoldDslV1(restartKeySixfoldDslV1 + 1);
  };

  const handleLastStepSixfoldDslV1 = (): void => {
    // Stop playing when jumping to end
    if (isPlayingSixfoldDslV1 && playIntervalSixfoldDslV1.current) {
      clearInterval(playIntervalSixfoldDslV1.current);
      playIntervalSixfoldDslV1.current = null;
      setIsPlayingSixfoldDslV1(false);
    }
    storeSixFoldDslV1.clear();
    goToStepV1(visualStepCountV1);
    setRestartKeySixfoldDslV1(restartKeySixfoldDslV1 + 1);
  };

  const handlePlayClickSixfoldDslV1 = (): void => {
    if (isPlayingSixfoldDslV1) {
      // Stop playing
      if (playIntervalSixfoldDslV1.current) {
        clearInterval(playIntervalSixfoldDslV1.current);
        playIntervalSixfoldDslV1.current = null;
      }
      setIsPlayingSixfoldDslV1(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalSixfoldDslV1.current) {
        clearInterval(playIntervalSixfoldDslV1.current);
        playIntervalSixfoldDslV1.current = null;
      }
      // Reset to 0 if at the end
      if (stepsUpToIndexV1 >= sixfoldDslV1Steps.length) {
        goToStepV1(0);
      }
      // Start playing
      setIsPlayingSixfoldDslV1(true);
      playIntervalSixfoldDslV1.current = setInterval(() => {
        // Use refs to get latest state and avoid stale closure
        const currentIndex = currentVisualIndexV1Ref.current;
        const totalVisualSteps = visualStepCountV1Ref.current;

        if (currentIndex > 0 && currentIndex < totalVisualSteps) {
          goToNextV1();
        } else {
          // Stop when reaching the end
          if (playIntervalSixfoldDslV1.current) {
            clearInterval(playIntervalSixfoldDslV1.current);
            playIntervalSixfoldDslV1.current = null;
          }
          setIsPlayingSixfoldDslV1(false);
        }
      }, 200); // 200ms delay between steps
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalSixfoldDslV1.current) {
        clearInterval(playIntervalSixfoldDslV1.current);
      }
    };
  }, []);

  return (
    <main className="p-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-left text-blue-400">sg</h1>

      <Navigation
        onNavigate={scrollToSection}
        activeSection={activeSection}
        onToggleTheme={toggleTheme}
        svgTheme={svgTheme}
      />

      {/* DSL Square Section */}
      <div
        ref={sectionRefs["square-dsl"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="square-dsl"
        data-testid="section-square-dsl"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">Square DSL</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">05/07/2026</small>
          <p className="text-gray-300 mb-4">
            Square construction using the new declarative DSL implementation.
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={squareDslSvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentStepSquareDsl}
              totalSteps={DSL_SQUARE_STEPS_LENGTH - 1}
              onStepChange={setCurrentStepSquareDsl}
              onFirstStep={handleFirstStepSquareDsl}
              onPrevStep={handlePrevClickSquareDsl}
              onNextStep={handleNextClickSquareDsl}
              onLastStep={handleLastStepSquareDsl}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingSquareDsl}
              onPlayClick={handlePlayClickSquareDsl}
            >
              <SquareDslSvg
                ref={squareDslSvgRef}
                store={storeSquareDsl}
                dotStrokeWidth={strokeBig}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeySquareDsl}
                currentStep={currentStepSquareDsl}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepSquareDsl}/{DSL_SQUARE_STEPS_LENGTH}
            </p>
            <GeometryDetails store={storeSquareDsl} strokeBig={strokeBig} steps={squareDslSteps} />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSquareDsl}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
                showInputHighlight={showInputHighlight}
                showNameFilter={true}
                showTypeFilters={true}
                availableTypes={GEOMETRY_TYPES}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SixFold DSL Section */}
      <div
        ref={sectionRefs["sixfold-dsl"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="sixfold-dsl"
        data-testid="section-sixfold-dsl"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">SixFold v0 DSL</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">05/12/2025</small>
          <p className="text-gray-300 mb-4">
            SixFold v0 construction using the new declarative DSL implementation (96 steps).
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={sixfoldDslSvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentStepSixfoldDsl}
              totalSteps={DSL_SIXFOLD_STEPS_LENGTH - 1}
              onStepChange={setCurrentStepSixfoldDsl}
              onFirstStep={handleFirstStepSixfoldDsl}
              onPrevStep={handlePrevClickSixfoldDsl}
              onNextStep={handleNextClickSixfoldDsl}
              onLastStep={handleLastStepSixfoldDsl}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingSixfoldDsl}
              onPlayClick={handlePlayClickSixfoldDsl}
            >
              <SixFoldDslSvg
                ref={sixfoldDslSvgRef}
                store={storeSixFoldDsl}
                dotStrokeWidth={strokeBig}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeySixfoldDsl}
                currentStep={currentStepSixfoldDsl}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepSixfoldDsl}/{DSL_SIXFOLD_STEPS_LENGTH}
            </p>
            <GeometryDetails
              store={storeSixFoldDsl}
              strokeBig={strokeBig}
              steps={sixfoldDslSteps}
            />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSixFoldDsl}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
                showInputHighlight={showInputHighlight}
                showNameFilter={true}
                showTypeFilters={true}
                availableTypes={GEOMETRY_TYPES}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SixFold DSL v1 Section */}
      <div
        ref={sectionRefs["sixfold-dsl-v1"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="sixfold-dsl-v1"
        data-testid="section-sixfold-dsl-v1"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">SixFold v1 DSL with cs2</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">05/14/2026</small>
          <p className="text-gray-300 mb-4">
            SixFold v1 construction using DSL with cs2 coordinate system ({visualStepCountV1} visual
            steps).
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={sixfoldDslV1SvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentVisualIndexV1}
              totalSteps={visualStepCountV1 - 1}
              onStepChange={(step) => goToStepV1(step)}
              onFirstStep={handleFirstStepSixfoldDslV1}
              onPrevStep={handlePrevClickSixfoldDslV1}
              onNextStep={handleNextClickSixfoldDslV1}
              onLastStep={handleLastStepSixfoldDslV1}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingSixfoldDslV1}
              onPlayClick={handlePlayClickSixfoldDslV1}
            >
              <SixFoldDslV1Svg
                ref={sixfoldDslV1SvgRef}
                store={storeSixFoldDslV1}
                dotStrokeWidth={strokeBig}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeySixfoldDslV1}
                currentStep={stepsUpToIndexV1}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentVisualIndexV1}/{visualStepCountV1}
            </p>
            <GeometryDetails
              store={storeSixFoldDslV1}
              strokeBig={strokeBig}
              steps={sixfoldDslV1Steps}
            />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSixFoldDslV1}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
                showInputHighlight={showInputHighlight}
                showNameFilter={true}
                showTypeFilters={true}
                availableTypes={GEOMETRY_TYPES}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
