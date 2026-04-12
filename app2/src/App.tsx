import { useState, useRef, useEffect } from "react";
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
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";

export default function App(): JSX.Element {
  const stroke = 0.5;
  const strokeMid = 0.5;
  const strokeBig = 2;
  const strokeLine = 1.4;

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
      const validSections: readonly [
        "sixfold-v4",
        "sixfold-v3",
        "sixfold-v2",
        "sixfold-v1",
        "square",
      ] = ["sixfold-v4", "sixfold-v3", "sixfold-v2", "sixfold-v1", "square"];
      if (hash && validSections.includes(hash as any)) {
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

interface Step {
  draw: boolean;
  drawShapes: () => void;
}

  const [stepsv3, setStepsv3] = useState<Step[]>([]);
  const [currentStepv3, setCurrentStepv3] = useState<number>(0);

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

  const updateStepsv3 = (newSteps: Step[]): void => {
    console.log("newSteps", newSteps, "stepsv3", stepsv3);
    setStepsv3(newSteps);
  };

  const [stepsv4, setStepsv4] = useState<Step[]>([]);
  const [currentStepv4, setCurrentStepv4] = useState<number>(0);

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

  const updateStepsv4 = (newSteps: Step[]): void => {
    console.log("newSteps", newSteps, "stepsv4", stepsv4);
    setStepsv4(newSteps);
  };

  const [stepsSquare, setStepsSquare] = useState<Step[]>([]);
  const [currentStepSquare, setCurrentStepSquare] = useState<number>(0);

  const handleNextClickSquare = (): void => {
    console.log("next step", currentStepSquare, stepsSquare.length);
    if (currentStepSquare < stepsSquare.length) {
      console.log("inside");
      const step = stepsSquare[currentStepSquare];
      console.log(step);
      step.draw = true;
      step.drawShapes();
      console.log("after drawShapes");
      setCurrentStepSquare(currentStepSquare + 1);
    }
  };

  const updateStepsSquare = (newSteps: Step[]): void => {
    console.log("newSteps", newSteps, "stepsSquare", stepsSquare);
    setStepsSquare(newSteps);
  };

  return (
    <main className="p-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8 text-left text-blue-400">sg</h1>

      <Navigation onNavigate={scrollToSection} activeSection={activeSection} />

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
            <div className="mt-4">
              <button
                onClick={handleNextClickv4}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                next
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
            <div className="mt-4">
              <button
                onClick={handleNextClickv3}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                next
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
          <div className="col-span-9">
            <Square
              store={storeSquare}
              stroke={stroke}
              strokeMid={strokeMid}
              strokeBig={strokeBig}
              strokeLine={strokeLine}
              svgConfig={standardSvgConfig}
              steps={stepsSquare}
              updateSteps={updateStepsSquare}
            />
            <div className="mt-4">
              <button
                onClick={handleNextClickSquare}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                next
              </button>
            </div>
          </div>
          <div className="col-span-3 pl-4">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepSquare}/{stepsSquare.length}
            </p>
            <div>
              <GeometryList
                store={storeSquare}
                stroke={stroke}
                strokeMid={strokeMid}
                strokeBig={strokeBig}
                strokeLine={strokeLine}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
