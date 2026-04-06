import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface PieSlice {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

export default function PieChart({ data, size = 120 }: PieChartProps) {
  const { slices, total } = useMemo(() => {
    const t = data.reduce((sum, d) => sum + d.value, 0);
    const slices: { color: string; path: string; percentage: number }[] = [];
    let currentAngle = 0;

    for (const d of data) {
      const percentage = t > 0 ? d.value / t : 0;
      const sweepAngle = percentage * 360;

      if (percentage > 0.001) {
        const outerR = size / 2 - 4;
        const innerR = size / 2 - 20;
        const cx = size / 2;
        const cy = size / 2;

        const startOuter = polarToCartesian(cx, cy, outerR, currentAngle);
        const endOuter = polarToCartesian(cx, cy, outerR, currentAngle + sweepAngle);
        const startInner = polarToCartesian(cx, cy, innerR, currentAngle + sweepAngle);
        const endInner = polarToCartesian(cx, cy, innerR, currentAngle);

        const largeArc = sweepAngle > 180 ? 1 : 0;

        const path = [
          `M ${startOuter.x} ${startOuter.y}`,
          `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
          `L ${startInner.x} ${startInner.y}`,
          `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
          'Z',
        ].join(' ');

        slices.push({ color: d.color, path, percentage });
      }

      currentAngle += sweepAngle;
    }

    return { slices, total: t };
  }, [data, size]);

  if (data.length === 0 || total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyCircle, { width: size - 8, height: size - 8 }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((slice, i) => (
            <Path key={i} d={slice.path} fill={slice.color} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    borderRadius: 999,
    borderWidth: 16,
    borderColor: '#1a1a1a',
  },
});
