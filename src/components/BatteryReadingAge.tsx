import { useEffect, useState } from "react";
import { Copy } from "./ui";

export function BatteryReadingAge({ updatedAt }: { updatedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  return (
    <Copy muted>
      {seconds < 15
        ? "Just updated"
        : seconds < 60
          ? `Updated ${seconds}s ago`
          : `Updated ${Math.floor(seconds / 60)}m ago`}
    </Copy>
  );
}
