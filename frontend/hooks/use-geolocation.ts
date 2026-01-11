"use client";

import { useState, useEffect } from "react";

type LocationState = {
  loaded: boolean;
  coordinates: { 
    latitude: number; 
    longitude: number 
  };
  error: { 
    code: number; 
    message: string 
  } | null;
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationState>({
    loaded: false,
    coordinates: { latitude: 0, longitude: 0 },
    error: null,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation((previous) => ({
        ...previous,
        loaded: true,
        error: { 
          code: 0, 
          message: "Geolocation not supported" 
        },
      }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocation({
        loaded: true,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setLocation((previous) => ({
        ...previous,
        loaded: true,
        error: { 
          code: error.code, 
          message: error.message 
        },
      }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return location;
};