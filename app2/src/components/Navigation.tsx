import type { JSX } from "react";
import type { Theme } from "../themes";
import { darkTheme } from "../themes";

type SectionId = "square-dsl" | "sixfold-dsl" | "sixfold-dsl-v2" | "sixfold-dsl-v1";

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
              onClick={() => handleNavigate("sixfold-dsl-v2")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "sixfold-dsl-v2"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-sixfold-dsl-v2"
            >
              SixFold DSL v2
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigate("sixfold-dsl-v1")}
              className={`px-4 py-2 rounded transition-colors ${
                activeSection === "sixfold-dsl-v1"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              data-testid="nav-sixfold-dsl-v1"
            >
              SixFold DSL v1
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
