import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
  Path,
  Rect,
  G,
} from "react-native-svg";

export function AirPodsArt() {
  return (
    <Svg
      width="100%"
      height={210}
      viewBox="0 0 340 220"
      accessibilityLabel="AirPods Pro earbuds and charging case"
      role="img"
    >
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="0.55" stopColor="#f1f2ed" />
          <Stop offset="1" stopColor="#bfc5b5" />
        </LinearGradient>
        <LinearGradient id="case" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="0.75" stopColor="#eff1e9" />
          <Stop offset="1" stopColor="#d5dacb" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="173" cy="201" rx="86" ry="8" fill="#263b16" opacity="0.09" />
      <Rect
        x="96"
        y="108"
        width="153"
        height="88"
        rx="33"
        fill="url(#case)"
        stroke="#cdd3c1"
        strokeWidth="0.6"
      />
      <Path
        d="M97 135 Q173 141 248 135"
        fill="none"
        stroke="#c0c7b4"
        strokeWidth="1"
      />
      <Ellipse cx="173" cy="156" rx="2" ry="1.5" fill="#7d945b" />
      <G transform="translate(67 14) rotate(-20 40 60)">
        <Rect
          x="44"
          y="42"
          width="20"
          height="86"
          rx="10"
          fill="url(#body)"
          stroke="#d4d9cd"
          strokeWidth="0.7"
        />
        <Ellipse
          cx="40"
          cy="36"
          rx="31"
          ry="23"
          fill="url(#body)"
          stroke="#d4d9cd"
          strokeWidth="0.7"
        />
        <Ellipse
          cx="13"
          cy="35"
          rx="14"
          ry="17"
          fill="#f3f4ef"
          stroke="#cbd0c3"
        />
        <Ellipse cx="10" cy="35" rx="5" ry="10" fill="#30392e" />
        <Ellipse cx="49" cy="25" rx="9" ry="4" fill="#31392f" />
        <Rect x="49" y="67" width="3" height="26" rx="1.5" fill="#d0d5c9" />
        <Path d="M48 121 L59 121" stroke="#9da594" strokeWidth="1.5" />
      </G>
      <G transform="translate(263 8) scale(-1 1) rotate(-25 40 60)">
        <Rect
          x="44"
          y="42"
          width="20"
          height="86"
          rx="10"
          fill="url(#body)"
          stroke="#d4d9cd"
          strokeWidth="0.7"
        />
        <Ellipse
          cx="40"
          cy="36"
          rx="31"
          ry="23"
          fill="url(#body)"
          stroke="#d4d9cd"
          strokeWidth="0.7"
        />
        <Ellipse
          cx="13"
          cy="35"
          rx="14"
          ry="17"
          fill="#f3f4ef"
          stroke="#cbd0c3"
        />
        <Ellipse cx="10" cy="35" rx="5" ry="10" fill="#30392e" />
        <Ellipse cx="49" cy="25" rx="9" ry="4" fill="#31392f" />
        <Rect x="49" y="67" width="3" height="26" rx="1.5" fill="#d0d5c9" />
        <Path d="M48 121 L59 121" stroke="#9da594" strokeWidth="1.5" />
      </G>
    </Svg>
  );
}
