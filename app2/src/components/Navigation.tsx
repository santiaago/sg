import type { JSX } from "react";
import type { Theme } from "../themes";
import { darkTheme } from "../themes";

type SectionId = "sixfold-v0" | "square" | "square-dsl" | "sixfold-dsl" | "rotated-square";

interface NavigationProps {
  onNavigate: (sectionId: SectionId) => void;
  activeSection: SectionId;
  onToggleTheme?: () => void;
  svgTheme?: Theme;
}

export function Navigation({
  onNavigate,
  activeSection,
  onToggleTheme,
  svgTheme = darkTheme,
}: NavigationProps): JSX.Element {
  const handleNavigate = (sectionId: SectionId): void => {
    // Update URL hash
    window.location.hash = sectionId;
    // Call the original navigation function
    onNavigate(sectionId);
  };

  return (
    <nav className="mb-8 bg-gray-800 rounded-lg p-4 sticky top-4 z-10">
      <div className="flex flex-wrap gap-4 justify-center items-center">
        <ul className="flex flex-wrap gap-4 justify-center">
          <li>
            <button
              onClick={() => handleNavigate("sixfold-v0")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "sixfold-v0"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-sixfold-v0"
            >
              SixFold v0
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigate("square")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "square"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-square"
            >
              Square
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigate("square-dsl")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "square-dsl"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-square-dsl"
            >
              Square DSL
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigate("sixfold-dsl")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "sixfold-dsl"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-sixfold-dsl"
            >
              SixFold DSL
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigate("rotated-square")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "rotated-square"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-rotated-square"
            >
              Rotated Square
            </button>
          </li>
        </ul>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
            title="Toggle SVG Theme"
            data-testid="theme-toggle"
          >
            {svgTheme === darkTheme ? "🌙" : "☀️"}
          </button>
        )}
      </div>
    </nav>
  );
}
