import { useEffect, useState } from "react";

const KEY = "hirelocal_city";

export function getStoredCity(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredCity(city: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, city);
  window.dispatchEvent(new Event("hirelocal-city-change"));
}

export function useCity(): [string | null, (c: string) => void] {
  const [city, setCity] = useState<string | null>(null);
  useEffect(() => {
    setCity(getStoredCity());
    const onChange = () => setCity(getStoredCity());
    window.addEventListener("hirelocal-city-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("hirelocal-city-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return [
    city,
    (c: string) => {
      setStoredCity(c);
      setCity(c);
    },
  ];
}
