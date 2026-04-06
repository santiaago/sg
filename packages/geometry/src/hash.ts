const SIZE = 3;

interface GeometryWithType {
  type: string;
}

export function hashName(geometry: GeometryWithType): string {
  if (geometry.type == "line") {
    return `l${hash(SIZE)}`;
  }
  if (geometry.type == "point") {
    return `p${hash(SIZE)}`;
  }
  if (geometry.type == "circle") {
    return `c${hash(SIZE)}`;
  }
  return `${hash(SIZE)}`;
}

const hash = (size: number): string =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
