import { useState } from "react";

export function useCity(): [string | null, (c: string) => void] {
  const [city, setCity] = useState<string | null>(null);
  return [city, setCity];
}
