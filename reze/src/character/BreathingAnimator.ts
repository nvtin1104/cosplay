export function breathing(time: number, period: number) {
  return (
    Math.sin((time * Math.PI * 2) / Math.max(3, period)) * 0.7 +
    Math.sin(time * 0.53) * 0.15
  );
}
