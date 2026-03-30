"use client";

interface DateFormatterProps {
  iso: string;
}

export default function DateFormatter({ iso }: DateFormatterProps) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(iso));

  return <>{formatted}</>;
}
