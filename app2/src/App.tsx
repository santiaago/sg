import { useState, useRef, useEffect, useCallback } from "react";
import type { JSX } from "react";
import {
  useGeometryStoreSquare,
  useGeometryStoreSixFoldV0,
} from "./react-store";
import { SixFoldV0 } from "./components/SixFoldV0";
import { Square } from "./components/Square";
import { standardSvgConfig } from "./config/svgConfig";
import { GeometryList } from "./components/GeometryList";
import { GeometryDetails } from "./components/GeometryDetails";
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";
import { CopySvgButton } from "./components/CopySvgButton";
import { SQUARE_STEPS } from "./geometry/squareSteps";
import { SIX_FOLD_V0_STEPS } from "./geometry/sixFoldV0Steps";
import { lightTheme, darkTheme } from "./themes";
import type { Theme, GeometryType } from "./types/geometry";

const GEOMETRY_TYPES: ReadonlyArray<GeometryType> = [
  "point",
  "line",
  "circle",
  "polygon",
] as const;

export default function App(): JSX.Element {
  const stroke = 0.5;
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
  const scrollToSection = (
    sectionId: "sixfold-v0" | "square",
  ) => {
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
  const [currentStepv0, setCurrentStepv0] = useState<number>(1);
  const [restartKeyv0, setRestartKeyv0] = useState<number>(0);
  const sixFoldV0SvgRef = useRef<SVGSVGElement>(null);

  const handleNextClickv0 = (): void => {
    if (currentStepv0 < SIX_FOLD_V0_STEPS.length) {
      setCurrentStepv0(currentStepv0 + 1);
    }
  };

  const handlePrevClickv0 = (): void => {
    if (currentStepv0 > 1) {
      setCurrentStepv0(currentStepv0 - 1);
    }
  };

  const handleRestartv0 = (): void => {
    setCurrentStepv0(1);
    setRestartKeyv0(restartKeyv0 + 1);
  };

  const handleLastStepv0 = (): void => {
    setCurrentStepv0(SIX_FOLD_V0_STEPS.length);
    setRestartKeyv0(restartKeyv0 + 1);
  };

  const [currentStepSquare, setCurrentStepSquare] = useState<number>(1);
  const [restartKeySquare, setRestartKeySquare] = useState<number>(0);
  const [showInputHighlight, setShowInputHighlight] = useState(true);

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
    console.log("next step", currentStepSquare, SQUARE_STEPS.length);
    if (currentStepSquare < SQUARE_STEPS.length) {
      console.log("inside");
      setCurrentStepSquare(currentStepSquare + 1);
    }
  };

  const handlePrevClickSquare = (): void => {
    console.log("prev step", currentStepSquare);
    if (currentStepSquare > 1) {
      setCurrentStepSquare(currentStepSquare - 1);
    }
  };

  const handleRestartSquare = (): void => {
    clearSquareStore();
    setCurrentStepSquare(1);
    setRestartKeySquare(restartKeySquare + 1);
  };

  const handleFirstStepSquare = (): void => {
    clearSquareStore();
    setCurrentStepSquare(1);
    setRestartKeySquare(restartKeySquare + 1);
  };

  const handleLastStepSquare = (): void => {
    clearSquareStore();
    setCurrentStepSquare(SQUARE_STEPS.length);
    setRestartKeySquare(restartKeySquare + 1);
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
            <SixFoldV0
              ref={sixFoldV0SvgRef}
              store={storeSixFoldV0}
              svgConfig={standardSvgConfig}
              restartTrigger={restartKeyv0}
              currentStep={currentStepv0}
              theme={svgTheme}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleRestartv0}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                title="Go to beginning"
              >
                ««
              </button>
              <button
                onClick={handlePrevClickv0}
                className={`px-4 py-2 text-white rounded ${
                  currentStepv0 <= 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepv0 <= 1}
              >
                prev
              </button>
              <button
                onClick={handleNextClickv0}
                className={`px-4 py-2 text-white rounded ${
                  currentStepv0 >= SIX_FOLD_V0_STEPS.length
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepv0 >= SIX_FOLD_V0_STEPS.length}
              >
                next
              </button>
              <button
                onClick={handleLastStepv0}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                title="Go to end"
              >
                »»
              </button>
              <button
                onClick={handleRestartv0}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                restart
              </button>
              <button
                onClick={() => setShowInputHighlight(!showInputHighlight)}
                className={`px-4 py-2 text-white rounded ${
                  showInputHighlight ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                inputs
              </button>
              <CopySvgButton svgRef={sixFoldV0SvgRef} />
            </div>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepv0}/{SIX_FOLD_V0_STEPS.length}
            </p>
            <GeometryDetails store={storeSixFoldV0} />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSixFoldV0}
                stroke={stroke}
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
            <Square
              store={storeSquare}
              dotStrokeWidth={strokeBig}
              svgConfig={standardSvgConfig}
              restartTrigger={restartKeySquare}
              currentStep={currentStepSquare}
              theme={svgTheme}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleFirstStepSquare}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                title="Go to beginning"
              >
                ««
              </button>
              <button
                onClick={handlePrevClickSquare}
                className={`px-4 py-2 text-white rounded ${
                  currentStepSquare <= 1
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepSquare <= 1}
              >
                prev
              </button>
              <button
                onClick={handleNextClickSquare}
                className={`px-4 py-2 text-white rounded ${
                  currentStepSquare >= SQUARE_STEPS.length
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepSquare >= SQUARE_STEPS.length}
              >
                next
              </button>
              <button
                onClick={handleLastStepSquare}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                title="Go to end"
              >
                »»
              </button>
              <button
                onClick={handleRestartSquare}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                restart
              </button>
              <button
                onClick={() => setShowInputHighlight(!showInputHighlight)}
                className={`px-4 py-2 text-white rounded ${
                  showInputHighlight ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                inputs
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepSquare}/{SQUARE_STEPS.length}
            </p>
            <GeometryDetails store={storeSquare} />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeSquare}
                stroke={stroke}
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
