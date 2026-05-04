import { useState, useRef, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { useGeometryStoreSquare, useGeometryStoreSixFoldV0 } from "./react-store";
import { SixFoldV0Svg } from "./components/SixFoldV0Svg";
import { SquareSvg } from "./components/SquareSvg";
import { GeometryPlayer } from "./components/GeometryPlayer";
import { standardSvgConfig } from "./config/svgConfig";
import { GeometryList } from "./components/GeometryList";
import { GeometryDetails } from "./components/GeometryDetails";
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";
import { SQUARE_STEPS } from "./geometry/squareSteps";
import { SIX_FOLD_V0_STEPS } from "./geometry/sixFoldV0Steps";
import { lightTheme, darkTheme } from "./themes";
import type { Theme, GeometryType } from "./types/geometry";

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

  const toggleTheme = useCallback(() => {
    const newTheme = svgTheme === darkTheme ? lightTheme : darkTheme;
    setSvgTheme(newTheme);
    // Also update the document background for consistency
    document.documentElement.classList.toggle("dark", newTheme === darkTheme);
  }, [svgTheme]);

  // Navigation menu state
  const [activeSection, setActiveSection] = useState<"sixfold-v0" | "square">("sixfold-v0");
  const sectionRefs = {
    "sixfold-v0": useRef<HTMLDivElement>(null),
    square: useRef<HTMLDivElement>(null),
  };

  // Scroll to section when navigation changes
  const scrollToSection = (sectionId: "sixfold-v0" | "square") => {
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
      const hash = window.location.hash.substring(1) as "sixfold-v0" | "square" | "";
      const validSections = ["sixfold-v0", "square"] as const;
      if (hash && validSections.includes(hash as "sixfold-v0" | "square")) {
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

  const storeSquare = useGeometryStoreSquare();
  const storeSixFoldV0 = useGeometryStoreSixFoldV0();

  // SixFoldV0 state
  const [currentStepv0, setCurrentStepv0] = useState<number>(0);
  const [restartKeyv0, setRestartKeyv0] = useState<number>(0);
  const [isPlayingv0, setIsPlayingv0] = useState<boolean>(false);
  const sixFoldV0SvgRef = useRef<SVGSVGElement>(null);
  const playIntervalv0 = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextClickv0 = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingv0 && playIntervalv0.current) {
      clearInterval(playIntervalv0.current);
      playIntervalv0.current = null;
      setIsPlayingv0(false);
    }
    if (currentStepv0 < SIX_FOLD_V0_STEPS.length) {
      setCurrentStepv0(currentStepv0 + 1);
    }
  };

  const handlePrevClickv0 = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingv0 && playIntervalv0.current) {
      clearInterval(playIntervalv0.current);
      playIntervalv0.current = null;
      setIsPlayingv0(false);
    }
    if (currentStepv0 > 0) {
      setCurrentStepv0(currentStepv0 - 1);
    }
  };

  const handleRestartv0 = (): void => {
    // Stop playing when restarting
    if (isPlayingv0 && playIntervalv0.current) {
      clearInterval(playIntervalv0.current);
      playIntervalv0.current = null;
      setIsPlayingv0(false);
    }
    setCurrentStepv0(0);
    setRestartKeyv0(restartKeyv0 + 1);
  };

  const handleLastStepv0 = (): void => {
    // Stop playing when jumping to end
    if (isPlayingv0 && playIntervalv0.current) {
      clearInterval(playIntervalv0.current);
      playIntervalv0.current = null;
      setIsPlayingv0(false);
    }
    setCurrentStepv0(SIX_FOLD_V0_STEPS.length);
    setRestartKeyv0(restartKeyv0 + 1);
  };

  const handlePlayClickv0 = (): void => {
    if (isPlayingv0) {
      // Stop playing
      if (playIntervalv0.current) {
        clearInterval(playIntervalv0.current);
        playIntervalv0.current = null;
      }
      setIsPlayingv0(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalv0.current) {
        clearInterval(playIntervalv0.current);
        playIntervalv0.current = null;
      }
      // Reset to 0 if at the end
      if (currentStepv0 >= SIX_FOLD_V0_STEPS.length) {
        setCurrentStepv0(0);
      }
      // Start playing
      setIsPlayingv0(true);
      playIntervalv0.current = setInterval(() => {
        setCurrentStepv0((prev) => {
          if (prev >= SIX_FOLD_V0_STEPS.length) {
            // Stop when reaching the end
            if (playIntervalv0.current) {
              clearInterval(playIntervalv0.current);
              playIntervalv0.current = null;
            }
            setIsPlayingv0(false);
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
      if (playIntervalv0.current) {
        clearInterval(playIntervalv0.current);
      }
    };
  }, []);

  // Square state
  const [currentStepSquare, setCurrentStepSquare] = useState<number>(0);
  const [restartKeySquare, setRestartKeySquare] = useState<number>(0);
  const [isPlayingSquare, setIsPlayingSquare] = useState<boolean>(false);
  const [showInputHighlight, setShowInputHighlight] = useState(true);
  const squareSvgRef = useRef<SVGSVGElement>(null);
  const playIntervalSquare = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function to clear Square store and remove DOM elements.
  // Square store requires manual DOM cleanup because SVG elements and tooltips
  // are directly appended to the SVG container and need explicit removal.
  // v0 store does not need this because it uses a different rendering approach.
  const clearSquareStore = (): void => {
    if (storeSquare?.clear) {
      Object.keys(storeSquare.items).forEach((key) => {
        const item = storeSquare.items[key];
        if (item && item.element && item.element.parentNode) {
          item.element.parentNode.removeChild(item.element);
        }
        if (item && item.element && item.element.tooltip && item.element.tooltip.parentNode) {
          item.element.tooltip.parentNode.removeChild(item.element.tooltip);
        }
        if (item && item.element && item.element.tooltipBg && item.element.tooltipBg.parentNode) {
          item.element.tooltipBg.parentNode.removeChild(item.element.tooltipBg);
        }
      });
      storeSquare.clear();
    }
  };

  const handleNextClickSquare = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSquare && playIntervalSquare.current) {
      clearInterval(playIntervalSquare.current);
      playIntervalSquare.current = null;
      setIsPlayingSquare(false);
    }
    if (currentStepSquare < SQUARE_STEPS.length) {
      setCurrentStepSquare(currentStepSquare + 1);
    }
  };

  const handlePrevClickSquare = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingSquare && playIntervalSquare.current) {
      clearInterval(playIntervalSquare.current);
      playIntervalSquare.current = null;
      setIsPlayingSquare(false);
    }
    if (currentStepSquare > 0) {
      setCurrentStepSquare(currentStepSquare - 1);
    }
  };

  const handleRestartSquare = (): void => {
    // Stop playing when restarting
    if (isPlayingSquare && playIntervalSquare.current) {
      clearInterval(playIntervalSquare.current);
      playIntervalSquare.current = null;
      setIsPlayingSquare(false);
    }
    clearSquareStore();
    setCurrentStepSquare(0);
    setRestartKeySquare(restartKeySquare + 1);
  };

  const handleFirstStepSquare = (): void => {
    // Stop playing when jumping to first step
    if (isPlayingSquare && playIntervalSquare.current) {
      clearInterval(playIntervalSquare.current);
      playIntervalSquare.current = null;
      setIsPlayingSquare(false);
    }
    clearSquareStore();
    setCurrentStepSquare(0);
    setRestartKeySquare(restartKeySquare + 1);
  };

  const handleLastStepSquare = (): void => {
    // Stop playing when jumping to end
    if (isPlayingSquare && playIntervalSquare.current) {
      clearInterval(playIntervalSquare.current);
      playIntervalSquare.current = null;
      setIsPlayingSquare(false);
    }
    clearSquareStore();
    setCurrentStepSquare(SQUARE_STEPS.length);
    setRestartKeySquare(restartKeySquare + 1);
  };

  const handlePlayClickSquare = (): void => {
    if (isPlayingSquare) {
      // Stop playing
      if (playIntervalSquare.current) {
        clearInterval(playIntervalSquare.current);
        playIntervalSquare.current = null;
      }
      setIsPlayingSquare(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalSquare.current) {
        clearInterval(playIntervalSquare.current);
        playIntervalSquare.current = null;
      }
      // Reset to 0 if at the end
      if (currentStepSquare >= SQUARE_STEPS.length) {
        setCurrentStepSquare(0);
      }
      // Start playing
      setIsPlayingSquare(true);
      playIntervalSquare.current = setInterval(() => {
        setCurrentStepSquare((prev) => {
          if (prev >= SQUARE_STEPS.length) {
            // Stop when reaching the end
            if (playIntervalSquare.current) {
              clearInterval(playIntervalSquare.current);
              playIntervalSquare.current = null;
            }
            setIsPlayingSquare(false);
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
      if (playIntervalSquare.current) {
        clearInterval(playIntervalSquare.current);
      }
    };
  }, []);

  const toggleInputs = (): void => {
    setShowInputHighlight(!showInputHighlight);
  };

  return (
    <main className="p-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-left text-blue-400">sg</h1>

      <Navigation
        onNavigate={scrollToSection}
        activeSection={activeSection}
        onToggleTheme={toggleTheme}
        svgTheme={svgTheme}
      />

      {/* v0 Section */}
      <div
        ref={sectionRefs["sixfold-v0"]}
        className="mb-8 p-8 bg-dark-card rounded-lg"
        id="sixfold-v0"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v0</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">11/03/2023</small>
          <p className="text-gray-300 mb-4">
            1/4 Six fold pattern v0, with steps to display geometry incrementally
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={sixFoldV0SvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentStepv0}
              totalSteps={SIX_FOLD_V0_STEPS.length}
              onStepChange={setCurrentStepv0}
              onFirstStep={handleRestartv0}
              onPrevStep={handlePrevClickv0}
              onNextStep={handleNextClickv0}
              onLastStep={handleLastStepv0}
              onRestart={handleRestartv0}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingv0}
              onPlayClick={handlePlayClickv0}
            >
              <SixFoldV0Svg
                ref={sixFoldV0SvgRef}
                store={storeSixFoldV0}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeyv0}
                currentStep={currentStepv0}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepv0}/{SIX_FOLD_V0_STEPS.length}
            </p>
            <GeometryDetails
              store={storeSixFoldV0}
              strokeBig={strokeBig}
              steps={SIX_FOLD_V0_STEPS}
            />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSixFoldV0}
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

      {/* Square Section */}
      <div ref={sectionRefs["square"]} className="mb-8 p-8 bg-gray-900 rounded-lg" id="square">
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">Drawing a square</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">08/10/2022</small>
          <a
            href="https://www.youtube.com/watch?v=RSP5sm1e--4"
            target="_blank"
            className="text-blue-500 hover:underline text-sm"
          >
            inspired by
          </a>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={squareSvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentStepSquare}
              totalSteps={SQUARE_STEPS.length}
              onStepChange={setCurrentStepSquare}
              onFirstStep={handleFirstStepSquare}
              onPrevStep={handlePrevClickSquare}
              onNextStep={handleNextClickSquare}
              onLastStep={handleLastStepSquare}
              onRestart={handleRestartSquare}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingSquare}
              onPlayClick={handlePlayClickSquare}
            >
              <SquareSvg
                ref={squareSvgRef}
                store={storeSquare}
                dotStrokeWidth={strokeBig}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeySquare}
                currentStep={currentStepSquare}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepSquare}/{SQUARE_STEPS.length}
            </p>
            <GeometryDetails store={storeSquare} strokeBig={strokeBig} steps={SQUARE_STEPS} />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSquare}
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
