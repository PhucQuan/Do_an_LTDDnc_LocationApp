import { useEffect, useRef } from 'react';

/**
 * Hook to control map camera with smooth animations
 */
export function useMapCamera(mapRef) {
  const currentTarget = useRef(null);
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);

  const animateCamera = async (config, duration = 1000) => {
    if (!mapRef?.current) return;

    return new Promise((resolve) => {
      mapRef.current.animateCamera(config, { duration });
      setTimeout(resolve, duration);
    });
  };

  const flyTo = async (latitude, longitude, options = {}) => {
    const {
      zoom = 16,
      pitch = 0,
      heading = 0,
      altitude = 500,
      duration = 1200,
    } = options;

    currentTarget.current = { latitude, longitude };

    await animateCamera(
      {
        center: { latitude, longitude },
        zoom,
        pitch,
        heading,
        altitude,
      },
      duration
    );
  };

  const zoomIn = async (steps = 2, duration = 800) => {
    if (!mapRef?.current) return;

    const camera = await mapRef.current.getCamera();
    const newZoom = (camera.zoom || 15) + steps;

    await animateCamera(
      {
        ...camera,
        zoom: newZoom,
      },
      duration
    );
  };

  const zoomOut = async (steps = 2, duration = 800) => {
    if (!mapRef?.current) return;

    const camera = await mapRef.current.getCamera();
    const newZoom = Math.max((camera.zoom || 15) - steps, 3);

    await animateCamera(
      {
        ...camera,
        zoom: newZoom,
      },
      duration
    );
  };

  const focusOnRegion = async (coordinates, padding = 50, duration = 1000) => {
    if (!mapRef?.current || !coordinates || coordinates.length === 0) return;

    // Calculate bounding box
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5; // Add padding
    const lngDelta = (maxLng - minLng) * 1.5;

    await animateCamera(
      {
        center: {
          latitude: centerLat,
          longitude: centerLng,
        },
        zoom: calculateZoomLevel(latDelta, lngDelta),
      },
      duration
    );
  };

  const orbitAround = async (latitude, longitude, duration = 3000) => {
    const steps = 36; // 10 degrees per step
    const stepDuration = duration / steps;

    for (let i = 0; i < steps; i++) {
      const heading = (i * 10) % 360;
      await animateCamera(
        {
          center: { latitude, longitude },
          zoom: 17,
          pitch: 45,
          heading,
          altitude: 300,
        },
        stepDuration
      );
    }
  };

  const smoothFollow = async (latitude, longitude, offset = 0.0005) => {
    if (!currentTarget.current) {
      currentTarget.current = { latitude, longitude };
      return;
    }

    const latDiff = Math.abs(currentTarget.current.latitude - latitude);
    const lngDiff = Math.abs(currentTarget.current.longitude - longitude);

    // Only animate if moved significantly
    if (latDiff > offset || lngDiff > offset) {
      await flyTo(latitude, longitude, {
        zoom: 16,
        duration: 800,
      });
    }
  };

  return {
    flyTo,
    zoomIn,
    zoomOut,
    focusOnRegion,
    orbitAround,
    smoothFollow,
    animateCamera,
  };
}

function calculateZoomLevel(latDelta, lngDelta) {
  const maxDelta = Math.max(latDelta, lngDelta);
  
  if (maxDelta > 10) return 4;
  if (maxDelta > 5) return 6;
  if (maxDelta > 2) return 8;
  if (maxDelta > 1) return 10;
  if (maxDelta > 0.5) return 12;
  if (maxDelta > 0.1) return 14;
  if (maxDelta > 0.05) return 15;
  return 16;
}

/**
 * Preset camera animations
 */
export const CameraPresets = {
  // Dramatic entrance from space
  spaceToEarth: (latitude, longitude) => [
    {
      center: { latitude, longitude },
      zoom: 2,
      pitch: 0,
      heading: 0,
      altitude: 10000,
    },
    {
      center: { latitude, longitude },
      zoom: 16,
      pitch: 0,
      heading: 0,
      altitude: 500,
    },
  ],

  // Cinematic reveal
  cinematicReveal: (latitude, longitude) => ({
    center: { latitude: latitude - 0.001, longitude },
    zoom: 17,
    pitch: 60,
    heading: 0,
    altitude: 200,
  }),

  // Bird's eye view
  birdsEye: (latitude, longitude) => ({
    center: { latitude, longitude },
    zoom: 15,
    pitch: 0,
    heading: 0,
    altitude: 1000,
  }),

  // Street level
  streetLevel: (latitude, longitude) => ({
    center: { latitude, longitude },
    zoom: 18,
    pitch: 70,
    heading: 0,
    altitude: 100,
  }),
};
