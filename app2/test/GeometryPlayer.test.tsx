import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { GeometryPlayer } from "../src/components/GeometryPlayer";
import { standardSvgConfig } from "../src/config/svgConfig";

describe("GeometryPlayer Component", () => {
  const defaultProps = {
    svgRef: { current: null },
    currentStep: 0,
    totalSteps: 10,
    onStepChange: vi.fn(),
    svgConfig: standardSvgConfig,
    children: <svg data-testid="test-svg" />,
  };

  describe("Rendering", () => {
    it("should render without crashing", () => {
      render(<GeometryPlayer {...defaultProps} />);
      expect(screen.getByTestId("test-svg")).toBeInTheDocument();
    });

    it("should render all control buttons when callbacks provided", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onPrevStep: vi.fn(),
        onNextStep: vi.fn(),
        onLastStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("First step")).toBeInTheDocument();
      expect(screen.getByLabelText("Previous step")).toBeInTheDocument();
      expect(screen.getByLabelText("Next step")).toBeInTheDocument();
      expect(screen.getByLabelText("Last step")).toBeInTheDocument();
      expect(screen.getByLabelText("Restart animation")).toBeInTheDocument();
    });

    it("should not render first step button when onFirstStep not provided", () => {
      const props = {
        ...defaultProps,
        onPrevStep: vi.fn(),
        onNextStep: vi.fn(),
        onLastStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByLabelText("First step")).not.toBeInTheDocument();
    });

    it("should not render prev button when onPrevStep not provided", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onNextStep: vi.fn(),
        onLastStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByLabelText("Previous step")).not.toBeInTheDocument();
    });

    it("should not render next button when onNextStep not provided", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onPrevStep: vi.fn(),
        onLastStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByLabelText("Next step")).not.toBeInTheDocument();
    });

    it("should not render last step button when onLastStep not provided", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onPrevStep: vi.fn(),
        onNextStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByLabelText("Last step")).not.toBeInTheDocument();
    });

    it("should not render restart button when onRestart not provided", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onPrevStep: vi.fn(),
        onNextStep: vi.fn(),
        onLastStep: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByLabelText("Restart animation")).not.toBeInTheDocument();
    });

    it("should render inputs toggle button when showInputsToggle is true", () => {
      const props = { ...defaultProps, showInputsToggle: true, onToggleInputs: vi.fn() };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Toggle input highlights")).toBeInTheDocument();
    });

    it("should not render inputs toggle button when showInputsToggle is false", () => {
      render(<GeometryPlayer {...defaultProps} />);
      expect(screen.queryByLabelText("Toggle input highlights")).not.toBeInTheDocument();
    });

    it("should render slider when onStepChange and totalSteps > 0", () => {
      render(<GeometryPlayer {...defaultProps} />);
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("should not render slider when totalSteps is 0", () => {
      const props = { ...defaultProps, totalSteps: 0 };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    });
  });

  describe("Slider Behavior", () => {
    it("should display correct min and max values", () => {
      render(<GeometryPlayer {...defaultProps} totalSteps={10} />);
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("min", "0");
      expect(slider).toHaveAttribute("max", "10");
    });

    it("should display step labels", () => {
      render(<GeometryPlayer {...defaultProps} totalSteps={10} />);
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("Button Callbacks", () => {
    it("should call onFirstStep when first step button clicked", async () => {
      const onFirstStep = vi.fn();
      const user = userEvent.setup();
      render(<GeometryPlayer {...defaultProps} onFirstStep={onFirstStep} />);

      await user.click(screen.getByLabelText("First step"));
      expect(onFirstStep).toHaveBeenCalledTimes(1);
    });

    it("should call onPrevStep when prev button clicked", async () => {
      const onPrevStep = vi.fn();
      const user = userEvent.setup();
      const props = { ...defaultProps, currentStep: 1, onPrevStep };
      render(<GeometryPlayer {...props} />);

      await user.click(screen.getByLabelText("Previous step"));
      expect(onPrevStep).toHaveBeenCalledTimes(1);
    });

    it("should call onNextStep when next button clicked", async () => {
      const onNextStep = vi.fn();
      const user = userEvent.setup();
      render(<GeometryPlayer {...defaultProps} onNextStep={onNextStep} />);

      await user.click(screen.getByLabelText("Next step"));
      expect(onNextStep).toHaveBeenCalledTimes(1);
    });

    it("should call onLastStep when last step button clicked", async () => {
      const onLastStep = vi.fn();
      const user = userEvent.setup();
      render(<GeometryPlayer {...defaultProps} onLastStep={onLastStep} />);

      await user.click(screen.getByLabelText("Last step"));
      expect(onLastStep).toHaveBeenCalledTimes(1);
    });

    it("should call onRestart when restart button clicked", async () => {
      const onRestart = vi.fn();
      const user = userEvent.setup();
      render(<GeometryPlayer {...defaultProps} onRestart={onRestart} />);

      await user.click(screen.getByLabelText("Restart animation"));
      expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it("should call onToggleInputs when inputs toggle button clicked", async () => {
      const onToggleInputs = vi.fn();
      const user = userEvent.setup();
      render(
        <GeometryPlayer
          {...defaultProps}
          showInputsToggle={true}
          onToggleInputs={onToggleInputs}
        />,
      );

      await user.click(screen.getByLabelText("Toggle input highlights"));
      expect(onToggleInputs).toHaveBeenCalledTimes(1);
    });
  });

  describe("Button Disabled States", () => {
    const buttonProps = {
      ...defaultProps,
      onFirstStep: vi.fn(),
      onPrevStep: vi.fn(),
      onNextStep: vi.fn(),
      onLastStep: vi.fn(),
      onRestart: vi.fn(),
    };

    it("should disable prev button when currentStep is 0", () => {
      const props = { ...buttonProps, currentStep: 0 };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Previous step")).toBeDisabled();
    });

    it("should enable prev button when currentStep is 1", () => {
      const props = { ...buttonProps, currentStep: 1 };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Previous step")).not.toBeDisabled();
    });

    it("should disable next button when currentStep equals totalSteps", () => {
      const props = { ...buttonProps, currentStep: 10, totalSteps: 10 };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Next step")).toBeDisabled();
    });

    it("should enable next button when currentStep is less than totalSteps", () => {
      const props = { ...buttonProps, currentStep: 5, totalSteps: 10 };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Next step")).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on control buttons", () => {
      const props = {
        ...defaultProps,
        onFirstStep: vi.fn(),
        onPrevStep: vi.fn(),
        onNextStep: vi.fn(),
        onLastStep: vi.fn(),
        onRestart: vi.fn(),
      };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("First step")).toBeInTheDocument();
      expect(screen.getByLabelText("Previous step")).toBeInTheDocument();
      expect(screen.getByLabelText("Next step")).toBeInTheDocument();
      expect(screen.getByLabelText("Last step")).toBeInTheDocument();
      expect(screen.getByLabelText("Restart animation")).toBeInTheDocument();
    });

    it("should have aria-label on slider", () => {
      render(<GeometryPlayer {...defaultProps} />);
      expect(screen.getByRole("slider")).toHaveAttribute("aria-label", "Step navigation");
    });

    it("should have aria-label on inputs toggle button", () => {
      const props = { ...defaultProps, showInputsToggle: true, onToggleInputs: vi.fn() };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByLabelText("Toggle input highlights")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should not crash when totalSteps is 0", () => {
      const props = { ...defaultProps, totalSteps: 0, currentStep: 0 };
      render(<GeometryPlayer {...props} />);
      expect(screen.getByTestId("test-svg")).toBeInTheDocument();
    });

    it("should not render slider when totalSteps is 0", () => {
      const props = { ...defaultProps, totalSteps: 0 };
      render(<GeometryPlayer {...props} />);
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    });
  });

  describe("Children Rendering", () => {
    it("should render children correctly", () => {
      const childText = "Test SVG Content";
      render(
        <GeometryPlayer {...defaultProps}>
          <div>{childText}</div>
        </GeometryPlayer>,
      );
      expect(screen.getByText(childText)).toBeInTheDocument();
    });

    it("should pass svgConfig.containerClass to container", () => {
      const props = {
        ...defaultProps,
        svgConfig: { ...standardSvgConfig, containerClass: "custom-container" },
      };
      render(<GeometryPlayer {...props} />);
      const container = screen.getByTestId("test-svg").parentElement?.parentElement;
      expect(container).toHaveClass("custom-container");
    });
  });
});
