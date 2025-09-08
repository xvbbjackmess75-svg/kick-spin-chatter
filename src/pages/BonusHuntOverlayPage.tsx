import { useSearchParams } from "react-router-dom";
import BonusHuntOverlay from "@/components/BonusHuntOverlay";

export default function BonusHuntOverlayPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const maxBonuses = parseInt(searchParams.get('maxBonuses') || '5');

  return (
    <div className="min-h-screen bg-transparent p-4">
      <BonusHuntOverlay userId={userId || undefined} maxBonuses={maxBonuses} />
    </div>
  );
}