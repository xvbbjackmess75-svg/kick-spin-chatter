import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Zap, Key, Link } from "lucide-react";

export default function KickIntegration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kick Integration</h1>
        <p className="text-muted-foreground mt-1">
          Connect your bot to Kick streaming platform.
        </p>
      </div>

      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-kick-green" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-kick-green/10 border border-kick-green/30">
            <CheckCircle className="h-5 w-5 text-kick-green" />
            <div>
              <p className="text-sm font-medium text-foreground">Connected to Kick</p>
              <p className="text-xs text-muted-foreground">Ready to receive chat messages</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}