"use client";

import { useState, useEffect } from "react";

interface DateFormatterProps {
  iso: string;
}

export default function DateFormatter({ iso }: DateFormatterProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).format(new Date(iso))
    );
  }, [iso]);

  return <>{formatted}</>;
}
