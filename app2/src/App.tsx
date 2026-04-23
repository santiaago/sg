import { useState, useRef, useEffect, useCallback } from "react";
import type { JSX } from "react";
import {
  useGeometryStore,
  useGeometryStoreSquare,
  useGeometryStorev2,
  useGeometryStorev3,
  useGeometryStorev4,
} from "./react-store";
import { SixFold } from "./components/SixFold";
import { SixFoldv2 } from "./components/SixFoldv2";
import { SixFoldv3 } from "./components/SixFoldv3";
import { SixFoldv4 } from "./components/SixFoldv4";
import { Square } from "./components/Square";
import { standardSvgConfig, sixFoldSvgConfig } from "./config/svgConfig";
import { GeometryList } from "./components/GeometryList";
import { GeometryDetails } from "./components/GeometryDetails";
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";
import { lightTheme, darkTheme, SQUARE_STEPS } from "./geometry/squareSteps";
import type { Theme, LegacyStep } from "./types/geometry";

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
  const [activeSection, setActiveSection] = useState<
    "sixfold-v4" | "sixfold-v3" | "sixfold-v2" | "sixfold-v1" | "square"
  >("sixfold-v4");
  const sectionRefs = {
    "sixfold-v4": useRef<HTMLDivElement>(null),
    "sixfold-v3": useRef<HTMLDivElement>(null),
    "sixfold-v2": useRef<HTMLDivElement>(null),
    "sixfold-v1": useRef<HTMLDivElement>(null),
    square: useRef<HTMLDivElement>(null),
  };

  // Scroll to section when navigation changes
  const scrollToSection = (
    sectionId: "sixfold-v4" | "sixfold-v3" | "sixfold-v2" | "sixfold-v1" | "square",
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
      const hash = window.location.hash.substring(1) as
        | "sixfold-v4"
        | "sixfold-v3"
        | "sixfold-v2"
        | "sixfold-v1"
        | "square"
        | "";
      const validSections = [
        "sixfold-v4",
        "sixfold-v3",
        "sixfold-v2",
        "sixfold-v1",
        "square",
      ] as const;
      if (
        hash &&
        validSections.includes(
          hash as "sixfold-v4" | "sixfold-v3" | "sixfold-v2" | "sixfold-v1" | "square",
        )
      ) {
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

  const store = useGeometryStore();
  const storeSquare = useGeometryStoreSquare();
  const storev2 = useGeometryStorev2();
  const storev3 = useGeometryStorev3();
  const storev4 = useGeometryStorev4();

  const [stepsv3, setStepsv3] = useState<readonly LegacyStep[]>([]);
  const [currentStepv3, setCurrentStepv3] = useState<number>(0);
  const [restartKeyv3, setRestartKeyv3] = useState<number>(0);

  const handleNextClickv3 = (): void => {
    console.log("next step", currentStepv3, stepsv3.length);
    if (currentStepv3 < stepsv3.length) {
      console.log("inside");
      const step = stepsv3[currentStepv3];
      console.log(step);
      step.draw = true;
      step.drawShapes();
      console.log("after drawShapes");
      setCurrentStepv3(currentStepv3 + 1);
    }
  };

  const handleRestartv3 = (): void => {
    // Reset all steps
    const resetSteps = stepsv3.map((step) => ({ ...step, draw: false }));
    setStepsv3(resetSteps);
    setCurrentStepv3(0);

    // Clear the store using the proper clear method
    if (storev3 && storev3.clear) {
      // Remove elements from SVG if they exist
      Object.keys(storev3.items).forEach((key) => {
        const item = storev3.items[key];
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
      storev3.clear();
    }

    // Trigger re-render by incrementing restart key
    setRestartKeyv3(restartKeyv3 + 1);
  };

  const updateStepsv3 = useCallback((steps: readonly LegacyStep[]): void => {
    console.log("steps", steps, "stepsv3", stepsv3);
    setStepsv3(steps);
  }, []);

  const [stepsv4, setStepsv4] = useState<readonly LegacyStep[]>([]);
  const [currentStepv4, setCurrentStepv4] = useState<number>(0);
  const [restartKeyv4, setRestartKeyv4] = useState<number>(0);

  const handleNextClickv4 = (): void => {
    console.log("next step", currentStepv4, stepsv4.length);
    if (currentStepv4 < stepsv4.length) {
      console.log("inside");
      const step = stepsv4[currentStepv4];
      console.log(step);
      step.draw = true;
      step.drawShapes();
      console.log("after drawShapes");
      setCurrentStepv4(currentStepv4 + 1);
    }
  };

  const handleRestartv4 = (): void => {
    // Reset all steps
    const resetSteps = stepsv4.map((step) => ({ ...step, draw: false }));
    setStepsv4(resetSteps);
    setCurrentStepv4(0);

    // Clear the store using the proper clear method
    if (storev4 && storev4.clear) {
      // Remove elements from SVG if they exist
      Object.keys(storev4.items).forEach((key) => {
        const item = storev4.items[key];
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
      storev4.clear();
    }

    // Trigger re-render by incrementing restart key
    setRestartKeyv4(restartKeyv4 + 1);
  };

  const updateStepsv4 = useCallback((steps: readonly LegacyStep[]): void => {
    console.log("steps", steps, "stepsv4", stepsv4);
    setStepsv4(steps);
  }, []);

  const [currentStepSquare, setCurrentStepSquare] = useState<number>(1);
  const [restartKeySquare, setRestartKeySquare] = useState<number>(0);
  const [showInputHighlight, setShowInputHighlight] = useState(true);

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
    // Clear the store using the proper clear method
    if (storeSquare && storeSquare.clear) {
      // Remove elements from SVG if they exist
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

    // Reset to step 1 and trigger re-render
    setCurrentStepSquare(1);
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

      {/* v4 Section */}
      <div
        ref={sectionRefs["sixfold-v4"]}
        className="mb-8 p-8 bg-dark-card rounded-lg"
        id="sixfold-v4"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v4</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">14/05/2023</small>
          <p className="text-gray-300 mb-4">1/4 Six fold pattern, with input output geometries</p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv4
              store={storev4}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              steps={stepsv4}
              updateSteps={updateStepsv4}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleNextClickv4}
                className={`px-4 py-2 text-white rounded ${
                  currentStepv4 >= stepsv4.length
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepv4 >= stepsv4.length}
              >
                next
              </button>
              <button
                onClick={handleRestartv4}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                restart
              </button>
            </div>
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepv4}/{stepsv4.length}
            </p>
            <div>
              <GeometryList
                store={storev4}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v3 Section */}
      <div
        ref={sectionRefs["sixfold-v3"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="sixfold-v3"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v3</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">11/03/2023</small>
          <p className="text-gray-300 mb-4">
            1/4 Six fold pattern, with steps to display geometry incrementally
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv3
              store={storev3}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              steps={stepsv3}
              updateSteps={updateStepsv3}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={handleNextClickv3}
                className={`px-4 py-2 text-white rounded ${
                  currentStepv3 >= stepsv3.length
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                disabled={currentStepv3 >= stepsv3.length}
              >
                next
              </button>
              <button
                onClick={handleRestartv3}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                restart
              </button>
            </div>
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepv3}/{stepsv3.length}
            </p>
            <div>
              <GeometryList
                store={storev3}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v2 Section */}
      <div
        ref={sectionRefs["sixfold-v2"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="sixfold-v2"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern v2</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">24/12/2022</small>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFoldv2
              store={storev2}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
            />
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <div>
              <GeometryList
                store={storev2}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>

      {/* v1 Section */}
      <div
        ref={sectionRefs["sixfold-v1"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="sixfold-v1"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">1/4 Six fold pattern</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">08/10/2022</small>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-9">
            <SixFold
              store={store}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              svgConfig={sixFoldSvgConfig}
            />
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <div>
              <GeometryList
                store={store}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
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
              strokeBig={strokeBig}
              svgConfig={standardSvgConfig}
              restartKey={restartKeySquare}
              currentStep={currentStepSquare}
              theme={svgTheme}
            />
            <div className="mt-1 flex gap-2">
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
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
