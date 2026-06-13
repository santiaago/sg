import { useCallback } from "react";
import { NumberThumbnail } from "./NumberThumbnail";
import { NUMBERS, type NumberId } from "./NumberSvg";

interface NumberPickerProps {
  onSelectNumber: (number: NumberId) => void;
}

/**
 * NumberPicker component - Renders a grid of number thumbnails for selection.
 * Displays numbers 1-4 in a grid layout.
 */
export function NumberPicker({ onSelectNumber }: NumberPickerProps): React.JSX.Element {
  const handleSelect = useCallback(
    (number: NumberId) => {
      onSelectNumber(number);
    },
    [onSelectNumber],
  );

  return (
    <div className="mb-8" data-testid="number-picker">
      <h3 className="text-xl font-semibold mb-4 text-gray-300">Select a number:</h3>
      <div className="flex flex-wrap gap-4 justify-start">
        {([1, 2, 3, 4] as NumberId[]).map((num) => (
          <NumberThumbnail
            key={num}
            number={num}
            label={NUMBERS[num].label}
            onClick={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
