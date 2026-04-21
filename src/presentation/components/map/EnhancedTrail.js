import React from 'react';
import { Polyline } from 'react-native-maps';
import { COLORS } from '../../theme';

/**
 * Enhanced trail with gradient-like effect using multiple polylines
 */
export function EnhancedTrail({ coordinates, color = COLORS.accent, isLive = false }) {
  if (!coordinates || coordinates.length < 2) return null;

  // Create gradient effect with multiple polylines of decreasing opacity
  const layers = [
    { width: 8, opacity: 0.2 },
    { width: 6, opacity: 0.4 },
    { width: 4, opacity: 0.8 },
    { width: 3, opacity: 1 },
  ];

  return (
    <>
      {layers.map((layer, index) => (
        <Polyline
          key={`trail-layer-${index}`}
          coordinates={coordinates}
          strokeColor={color}
          strokeWidth={layer.width}
          lineCap="round"
          lineJoin="round"
          lineDashPattern={isLive ? [8, 4] : undefined}
          geodesic
          style={{ opacity: layer.opacity }}
        />
      ))}
    </>
  );
}

/**
 * Animated trail with moving dash pattern
 */
export function AnimatedTrail({ coordinates, color = COLORS.accent, speed = 1 }) {
  if (!coordinates || coordinates.length < 2) return null;

  // Calculate dash pattern based on speed
  const dashLength = Math.max(4, Math.min(12, speed * 2));
  const gapLength = dashLength / 2;

  return (
    <>
      {/* Glow layer */}
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={8}
        lineCap="round"
        lineJoin="round"
        geodesic
        style={{ opacity: 0.3 }}
      />
      
      {/* Main trail */}
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
        lineDashPattern={[dashLength, gapLength]}
        geodesic
      />
      
      {/* Highlight dots */}
      <Polyline
        coordinates={coordinates}
        strokeColor={COLORS.white}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        lineDashPattern={[2, dashLength + gapLength - 2]}
        geodesic
      />
    </>
  );
}

/**
 * Speed-based trail coloring
 */
export function SpeedTrail({ coordinates, speeds = [] }) {
  if (!coordinates || coordinates.length < 2) return null;

  // Split trail into segments based on speed
  const segments = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const speed = speeds[i] || 0;
    const color = getSpeedColor(speed);
    
    segments.push({
      coordinates: [coordinates[i], coordinates[i + 1]],
      color,
      width: Math.max(3, Math.min(6, speed / 10)),
    });
  }

  return (
    <>
      {segments.map((segment, index) => (
        <React.Fragment key={`speed-segment-${index}`}>
          {/* Glow */}
          <Polyline
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={segment.width + 4}
            lineCap="round"
            lineJoin="round"
            geodesic
            style={{ opacity: 0.3 }}
          />
          {/* Main line */}
          <Polyline
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={segment.width}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        </React.Fragment>
      ))}
    </>
  );
}

function getSpeedColor(speed) {
  if (speed < 5) return COLORS.green;
  if (speed < 20) return COLORS.yellow;
  if (speed < 40) return COLORS.orange;
  return COLORS.danger;
}

/**
 * Trail with checkpoint markers
 */
export function CheckpointTrail({ coordinates, checkpoints = [] }) {
  if (!coordinates || coordinates.length < 2) return null;

  return (
    <>
      {/* Main trail */}
      <Polyline
        coordinates={coordinates}
        strokeColor={COLORS.accent}
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
        geodesic
      />
      
      {/* Checkpoint highlights */}
      {checkpoints.map((checkpoint, index) => {
        const segmentStart = Math.max(0, checkpoint.index - 1);
        const segmentEnd = Math.min(coordinates.length - 1, checkpoint.index + 1);
        const segmentCoords = coordinates.slice(segmentStart, segmentEnd + 1);
        
        return (
          <Polyline
            key={`checkpoint-${index}`}
            coordinates={segmentCoords}
            strokeColor={checkpoint.color || COLORS.pink}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        );
      })}
    </>
  );
}
