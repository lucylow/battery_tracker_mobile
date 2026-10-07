import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { StyleSheet, View } from "react-native";
import { useMemo } from "react";

import type { ExperimentParameters } from "@/domain/lattice";

const SIZE = 320;
const CENTER = SIZE / 2;

export function LatticeVisualization({ parameters }: { parameters: ExperimentParameters }) {
  const atoms = useMemo(() => {
    const points: { x: number; y: number; layer: 1 | 2 }[] = [];
    const spacing = 31;
    const angle = (parameters.twistAngle * Math.PI) / 180;
    for (let row = -4; row <= 4; row += 1) {
      for (let col = -4; col <= 4; col += 1) {
        const x = col * spacing;
        const y = row * spacing * 0.88;
        points.push({ x, y, layer: 1 });
        points.push({ x: x * Math.cos(angle) - y * Math.sin(angle) + 4, y: x * Math.sin(angle) + y * Math.cos(angle) + 4, layer: 2 });
      }
    }
    return points;
  }, [parameters.twistAngle]);

  const moirePath = useMemo(() => {
    const amplitude = Math.min(54, 16 + parameters.twistAngle * 6);
    const points = Array.from({ length: 11 }, (_, i) => {
      const x = 30 + i * 26;
      const y = CENTER + Math.sin(i * 0.9 + parameters.twistAngle * 0.2) * amplitude;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    });
    return points.join(" ");
  }, [parameters.twistAngle]);

  return (
    <View style={styles.frame} accessible accessibilityLabel="Simplified educational visualization of two twisted material lattices">
      <Svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Rect x="0" y="0" width={SIZE} height={SIZE} rx="24" fill="#091827" />
        <Path d={moirePath} stroke="#65E6E0" strokeWidth="2" opacity={0.45} fill="none" />
        {atoms.map((atom, index) => (
          <Circle key={`${atom.layer}-${index}`} cx={CENTER + atom.x} cy={CENTER + atom.y} r={atom.layer === 1 ? 3.2 : 3.8} fill={atom.layer === 1 ? "#9B8CFF" : "#65E6E0"} opacity={atom.layer === 1 ? 0.65 : 0.85} />
        ))}
        <Line x1="24" y1="286" x2="296" y2="286" stroke="#27415C" strokeWidth="1" />
      </Svg>
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#9B8CFF" }]} /><View /></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "#65E6E0" }]} /><View /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 310, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#27415C", backgroundColor: "#091827" },
  legend: { position: "absolute", left: 18, bottom: 17, flexDirection: "row", gap: 10 },
  legendItem: { width: 10, height: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
