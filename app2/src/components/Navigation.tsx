import type { JSX } from "react";
import type { Theme } from "../themes";
import { darkTheme } from "../themes";

interface NavigationProps {
  onNavigate: (sectionId: "sixfold-v0" | "square") => void;
  activeSection: "sixfold-v0" | "square";
  onToggleTheme?: () => void;
  svgTheme?: Theme;
}

export function Navigation({
  onNavigate,
  activeSection,
  onToggleTheme,
  svgTheme = darkTheme,
}: NavigationProps): JSX.Element {
  const handleNavigate = (sectionId: "sixfold-v0" | "square"): void => {
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
            >
              Square
            </button>
          </li>
        </ul>
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
            title="Toggle SVG Theme"
          >
            {svgTheme === darkTheme ? "🌙" : "☀️"}
          </button>
        )}
      </div>
    </nav>
  );
}
