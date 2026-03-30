"use client";

import { useState, useEffect } from "react";

interface EventDateFormatterProps {
  fromDate: string;
  toDate: string;
}

export default function EventDateFormatter({ fromDate, toDate }: EventDateFormatterProps) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const f = new Date(fromDate);
    const t = new Date(toDate);

    const date = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone,
    }).format(f);

    const fromTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(f);

    const toTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(t);

    setFormatted(`${date}, ${fromTime}–${toTime}`);
  }, [fromDate, toDate]);

  return <>{formatted}</>;
}
