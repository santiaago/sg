export interface SvgConfig {
  viewBox: string;
  width: number;
  height: number;
  containerClass: string;
  svgClass: string;
}

export const standardSvgConfig: SvgConfig = {
  viewBox: "0 0 840 519",
  width: 840,
  height: 519,
  containerClass: "square-container",
  svgClass: "square-svg",
};

export const sixFoldSvgConfig: SvgConfig = {
  viewBox: "0 0 647 400",
  width: 647,
  height: 400,
  containerClass: "sixfold-container",
  svgClass: "sixfold-svg w-full h-auto",
};
