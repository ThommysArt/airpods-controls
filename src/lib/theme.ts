import { android } from "./android";

const light = {
  primary: "#526434",
  onPrimary: "#ffffff",
  container: "#d6e8b5",
  onContainer: "#253512",
  background: "#f7f8f0",
  surface: "#ffffff",
  text: "#20251b",
  muted: "#69705f",
  outline: "#dce0d2",
};
const dark = {
  primary: "#b8cf94",
  onPrimary: "#243610",
  container: "#394d23",
  onContainer: "#d6e8b5",
  background: "#12150f",
  surface: "#1d2219",
  text: "#e4e8da",
  muted: "#a4ac99",
  outline: "#3e4637",
};
export type Palette = typeof light;
export function getPalette(isDark: boolean, dynamic: boolean): Palette {
  const fallback = isDark ? dark : light;
  if (!dynamic || !android) return fallback;
  try {
    return { ...fallback, ...android.getMaterialColors(isDark) };
  } catch {
    return fallback;
  }
}
