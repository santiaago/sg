// Mock hash/name for testing - deterministic hashing
let counter = 0;

export function hashName(geometry) {
  counter++;
  if (geometry.type == "line") {
    return `l${counter.toString(16).padStart(3, "0")}`;
  }
  if (geometry.type == "point") {
    return `p${counter.toString(16).padStart(3, "0")}`;
  }
  if (geometry.type == "circle") {
    return `c${counter.toString(16).padStart(3, "0")}`;
  }
  return `${counter.toString(16).padStart(3, "0")}`;
}

// Reset counter for clean tests
export function resetHashCounter() {
  counter = 0;
}
