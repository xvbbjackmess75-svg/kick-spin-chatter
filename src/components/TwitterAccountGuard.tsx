import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkTwitterAccount } from "@/components/LinkTwitterAccount";

export function TwitterAccountGuard() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter Account Required
            </CardTitle>
            <CardDescription>
              You need to link your Twitter account to create and manage Twitter giveaways
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkTwitterAccount />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}