const SIZE = 3;

export function hashName(geometry) {
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

const hash = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
