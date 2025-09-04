import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SlotsOverlay from "@/components/SlotsOverlay";

export default function SlotsOverlayPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const maxCalls = parseInt(searchParams.get('maxCalls') || '10');

  return (
    <div className="min-h-screen bg-transparent p-4">
      <SlotsOverlay eventId={eventId || undefined} maxCalls={maxCalls} />
    </div>
  );
}