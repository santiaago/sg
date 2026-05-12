import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { useGeometryStoreSquare, useGeometryStoreSixFoldV0, useGeometryStore } from "./react-store";
import { SixFoldV0Svg } from "./components/SixFoldV0Svg";
import { SquareSvg } from "./components/SquareSvg";
import { SquareDslSvg } from "./components/SquareDslSvg";
import { SixFoldDslSvg } from "./components/SixFoldDslSvg";
import { RotatedSquareSvg } from "./components/RotatedSquareSvg";
import { GeometryPlayer } from "./components/GeometryPlayer";
import { standardSvgConfig } from "./config/svgConfig";
import { GeometryList } from "./components/GeometryList";
import { GeometryDetails } from "./components/GeometryDetails";
import { Navigation } from "./components/Navigation";
import { CopyUrlButton } from "./components/CopyUrlButton";
import { SQUARE_STEPS } from "./geometry/squareSteps";
import { SIX_FOLD_V0_STEPS } from "./geometry/sixFoldV0Steps";
import { ROTATED_SQUARE_STEPS } from "./geometry/rotatedSquareSteps";
import { DSL_SQUARE_STEPS_LENGTH, buildSquareDslSteps } from "./geometry/squareDslSteps";
import { DSL_SIXFOLD_STEPS_LENGTH, buildSixfoldDslSteps } from "./geometry/sixfoldDslSteps";
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
  type SectionId = "sixfold-v0" | "square" | "square-dsl" | "sixfold-dsl" | "rotated-square";
  const [activeSection, setActiveSection] = useState<SectionId>("sixfold-v0");
  const sectionRefs = {
    "sixfold-v0": useRef<HTMLDivElement>(null),
    square: useRef<HTMLDivElement>(null),
    "square-dsl": useRef<HTMLDivElement>(null),
    "sixfold-dsl": useRef<HTMLDivElement>(null),
    "rotated-square": useRef<HTMLDivElement>(null),
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
      const validSections = [
        "sixfold-v0",
        "square",
        "square-dsl",
        "sixfold-dsl",
        "rotated-square",
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

  const storeSquare = useGeometryStoreSquare();
  const storeSixFoldV0 = useGeometryStoreSixFoldV0();
  const storeRotatedSquare = useGeometryStore();
  const storeSquareDsl = useGeometryStore();
  const storeSixFoldDsl = useGeometryStore();

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
    storeSquare.clear();
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
    storeSquare.clear();
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
    storeSquare.clear();
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

  // Rotated Square state
  const [currentStepRotated, setCurrentStepRotated] = useState<number>(0);
  const [restartKeyRotated, setRestartKeyRotated] = useState<number>(0);
  const [isPlayingRotated, setIsPlayingRotated] = useState<boolean>(false);
  const rotatedSquareSvgRef = useRef<SVGSVGElement>(null);
  const playIntervalRotated = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNextClickRotated = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingRotated && playIntervalRotated.current) {
      clearInterval(playIntervalRotated.current);
      playIntervalRotated.current = null;
      setIsPlayingRotated(false);
    }
    if (currentStepRotated < ROTATED_SQUARE_STEPS.length) {
      setCurrentStepRotated(currentStepRotated + 1);
    }
  };

  const handlePrevClickRotated = (): void => {
    // Stop playing if user manually clicks
    if (isPlayingRotated && playIntervalRotated.current) {
      clearInterval(playIntervalRotated.current);
      playIntervalRotated.current = null;
      setIsPlayingRotated(false);
    }
    if (currentStepRotated > 0) {
      setCurrentStepRotated(currentStepRotated - 1);
    }
  };

  const handleRestartRotated = (): void => {
    // Stop playing when restarting
    if (isPlayingRotated && playIntervalRotated.current) {
      clearInterval(playIntervalRotated.current);
      playIntervalRotated.current = null;
      setIsPlayingRotated(false);
    }
    storeRotatedSquare.clear();
    setCurrentStepRotated(0);
    setRestartKeyRotated(restartKeyRotated + 1);
  };

  const handleFirstStepRotated = (): void => {
    // Stop playing when jumping to first step
    if (isPlayingRotated && playIntervalRotated.current) {
      clearInterval(playIntervalRotated.current);
      playIntervalRotated.current = null;
      setIsPlayingRotated(false);
    }
    storeRotatedSquare.clear();
    setCurrentStepRotated(0);
    setRestartKeyRotated(restartKeyRotated + 1);
  };

  const handleLastStepRotated = (): void => {
    // Stop playing when jumping to end
    if (isPlayingRotated && playIntervalRotated.current) {
      clearInterval(playIntervalRotated.current);
      playIntervalRotated.current = null;
      setIsPlayingRotated(false);
    }
    storeRotatedSquare.clear();
    setCurrentStepRotated(ROTATED_SQUARE_STEPS.length);
    setRestartKeyRotated(restartKeyRotated + 1);
  };

  const handlePlayClickRotated = (): void => {
    if (isPlayingRotated) {
      // Stop playing
      if (playIntervalRotated.current) {
        clearInterval(playIntervalRotated.current);
        playIntervalRotated.current = null;
      }
      setIsPlayingRotated(false);
    } else {
      // Clear any existing interval first to prevent race condition
      if (playIntervalRotated.current) {
        clearInterval(playIntervalRotated.current);
        playIntervalRotated.current = null;
      }
      // Reset to 0 if at the end
      if (currentStepRotated >= ROTATED_SQUARE_STEPS.length) {
        setCurrentStepRotated(0);
      }
      // Start playing
      setIsPlayingRotated(true);
      playIntervalRotated.current = setInterval(() => {
        setCurrentStepRotated((prev) => {
          if (prev >= ROTATED_SQUARE_STEPS.length) {
            // Stop when reaching the end
            if (playIntervalRotated.current) {
              clearInterval(playIntervalRotated.current);
              playIntervalRotated.current = null;
            }
            setIsPlayingRotated(false);
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
      if (playIntervalRotated.current) {
        clearInterval(playIntervalRotated.current);
      }
    };
  }, []);

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

  const handleRestartSquareDsl = (): void => {
    // Stop playing when restarting
    if (isPlayingSquareDsl && playIntervalSquareDsl.current) {
      clearInterval(playIntervalSquareDsl.current);
      playIntervalSquareDsl.current = null;
      setIsPlayingSquareDsl(false);
    }
    storeSquareDsl.clear();
    setCurrentStepSquareDsl(0);
    setRestartKeySquareDsl(restartKeySquareDsl + 1);
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

  const handleRestartSixfoldDsl = (): void => {
    // Stop playing when restarting
    if (isPlayingSixfoldDsl && playIntervalSixfoldDsl.current) {
      clearInterval(playIntervalSixfoldDsl.current);
      playIntervalSixfoldDsl.current = null;
      setIsPlayingSixfoldDsl(false);
    }
    storeSixFoldDsl.clear();
    setCurrentStepSixfoldDsl(0);
    setRestartKeySixfoldDsl(restartKeySixfoldDsl + 1);
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
        data-testid="section-sixfold-v0"
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
      <div
        ref={sectionRefs["square"]}
        className="mb-8 p-8 bg-gray-900 rounded-lg"
        id="square"
        data-testid="section-square"
      >
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
              totalSteps={DSL_SQUARE_STEPS_LENGTH}
              onStepChange={setCurrentStepSquareDsl}
              onFirstStep={handleFirstStepSquareDsl}
              onPrevStep={handlePrevClickSquareDsl}
              onNextStep={handleNextClickSquareDsl}
              onLastStep={handleLastStepSquareDsl}
              onRestart={handleRestartSquareDsl}
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
              totalSteps={DSL_SIXFOLD_STEPS_LENGTH}
              onStepChange={setCurrentStepSixfoldDsl}
              onFirstStep={handleFirstStepSixfoldDsl}
              onPrevStep={handlePrevClickSixfoldDsl}
              onNextStep={handleNextClickSixfoldDsl}
              onLastStep={handleLastStepSixfoldDsl}
              onRestart={handleRestartSixfoldDsl}
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

      {/* Rotated Square Section */}
      <div
        ref={sectionRefs["rotated-square"]}
        className="mb-8 p-8 bg-dark-card rounded-lg"
        id="rotated-square"
        data-testid="section-rotated-square"
      >
        <div className="mb-6 flex items-center">
          <h1 className="text-2xl font-semibold mb-1 text-left">Rotated Square</h1>
          <CopyUrlButton />
        </div>
        <div className="mb-4">
          <small className="block text-gray-400 mb-2">05/05/2026</small>
          <p className="text-gray-300 mb-4">
            Square with rotated coordinate system (Pi/16 radians) to test CS transformations.
          </p>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <GeometryPlayer
              svgRef={rotatedSquareSvgRef}
              svgConfig={standardSvgConfig}
              currentStep={currentStepRotated}
              totalSteps={ROTATED_SQUARE_STEPS.length}
              onStepChange={setCurrentStepRotated}
              onFirstStep={handleFirstStepRotated}
              onPrevStep={handlePrevClickRotated}
              onNextStep={handleNextClickRotated}
              onLastStep={handleLastStepRotated}
              onRestart={handleRestartRotated}
              showInputsToggle={true}
              showInputHighlight={showInputHighlight}
              onToggleInputs={toggleInputs}
              showPlayButton={true}
              isPlaying={isPlayingRotated}
              onPlayClick={handlePlayClickRotated}
            >
              <RotatedSquareSvg
                ref={rotatedSquareSvgRef}
                store={storeRotatedSquare}
                dotStrokeWidth={strokeBig}
                svgConfig={standardSvgConfig}
                restartTrigger={restartKeyRotated}
                currentStep={currentStepRotated}
                theme={svgTheme}
              />
            </GeometryPlayer>
          </div>
          <div className="col-span-2">
            <h2 className="text-lg font-medium mb-4">Right pane</h2>
            <p className="text-gray-300 mb-4">
              Current step {currentStepRotated}/{ROTATED_SQUARE_STEPS.length}
            </p>
            <GeometryDetails
              store={storeRotatedSquare}
              strokeBig={strokeBig}
              steps={ROTATED_SQUARE_STEPS}
            />
          </div>
          <div className="col-span-3">
            <div>
              <GeometryList
                store={storeRotatedSquare}
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
