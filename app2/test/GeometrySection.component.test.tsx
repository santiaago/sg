import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GeometrySection } from "../src/components/GeometrySection";
import type { GeometryStore, GeometryItem } from "../src/react-store";
import type { StepRef, Theme } from "../src/types/geometry";
import type { GeometryType } from "../src/react-store";
import { lightTheme } from "../src/themes";
import { standardSvgConfig } from "../src/config/svgConfig";

// Mock SVG component
const MockSvgComponent = vi.fn(
  ({
    store,
    dotStrokeWidth,
    svgConfig,
    restartTrigger,
    currentStep,
    theme,
  }: {
    store: GeometryStore;
    dotStrokeWidth: number;
    svgConfig: typeof standardSvgConfig;
    restartTrigger: number;
    currentStep: number;
    theme: Theme;
  }) => {
    return <svg data-testid="mock-svg" />;
  },
);

// Mock store
const createMockStore = (): GeometryStore => {
  const items: Record<string, GeometryItem> = {};
  return {
    get items() {
      return items;
    },
    add: vi.fn((name, element, type, dependsOn) => {
      items[name] = {
        name,
        element: element as unknown as SVGCircleElement,
        selected: false,
        type: type as GeometryType,
        dependsOn,
        context: undefined,
        stepId: "",
        parameterValues: {},
      };
    }),
    update: vi.fn((key, partial) => {
      items[key] = { ...items[key], ...partial };
    }),
    clear: vi.fn(() => {
      Object.keys(items).forEach((key) => delete items[key]);
    }),
  };
};

// Mock stepper result
const createMockStepper = () => ({
  currentVisualIndex: 0,
  visualStepCount: 10,
  stepsUpToIndex: 0,
  goToStep: vi.fn(),
  goToNext: vi.fn(),
  goToPrev: vi.fn(),
  canGoNext: true,
  canGoPrev: false,
  steps: [] as unknown as Array<{ id: string }>,
});

// Mock steps
const mockSteps: readonly StepRef[] = [
  { id: "step1", name: "Step 1" },
  { id: "step2", name: "Step 2" },
] as const;

const GEOMETRY_TYPES: ReadonlyArray<GeometryType> = [
  "point",
  "line",
  "circle",
  "polygon",
  "coordinate_system",
] as const;

describe("GeometrySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section with title and description", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };

    render(
      <GeometrySection
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("renders with correct section id", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };

    render(
      <GeometrySection
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByTestId("section-test-section")).toBeInTheDocument();
  });

  it("renders GeometryPlayer with SVG component", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };

    render(
      <GeometrySection
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByTestId("mock-svg")).toBeInTheDocument();
  });

  it("renders GeometryDetails with current step info", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };

    render(
      <GeometrySection
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByText("Right pane")).toBeInTheDocument();
    expect(screen.getByText("Current step 0/10")).toBeInTheDocument();
  });

  it("renders CopyUrlButton in header", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };

    render(
      <GeometrySection
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByTestId("copy-url-btn")).toBeInTheDocument();
  });

  it("forwards ref to outer div", () => {
    const mockStore = createMockStore();
    const mockStepper = createMockStepper();
    const svgRef = { current: null };
    const ref = { current: null } as React.RefObject<HTMLDivElement>;

    render(
      <GeometrySection
        ref={ref}
        sectionId="test-section"
        title="Test Section"
        date="01/01/2026"
        description="Test description"
        stepper={mockStepper}
        SvgComponent={MockSvgComponent}
        svgRef={svgRef as unknown as React.RefObject<SVGSVGElement | null>}
        svgConfig={standardSvgConfig}
        restartKey={0}
        store={mockStore}
        strokeBig={2}
        steps={mockSteps}
        strokeMid={0.5}
        strokeLine={1.4}
        showInputHighlight={true}
        availableTypes={GEOMETRY_TYPES}
        showInputsToggle={true}
        showPlayButton={true}
        onToggleInputs={vi.fn()}
        isPlaying={false}
        onPlayClick={vi.fn()}
        onFirstStep={vi.fn()}
        onPrevStep={vi.fn()}
        onNextStep={vi.fn()}
        onLastStep={vi.fn()}
        theme={lightTheme}
      />,
    );

    expect(ref.current).toBeInTheDocument();
    expect(ref.current).toHaveAttribute("id", "test-section");
  });
});
