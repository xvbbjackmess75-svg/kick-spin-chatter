import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface TwitterConditionsSelectorProps {
  conditions: any;
  onConditionsChange: (conditions: any) => void;
}

export function TwitterConditionsSelector({ conditions, onConditionsChange }: TwitterConditionsSelectorProps) {
  const updateCondition = (key: string, value: any) => {
    onConditionsChange({
      ...conditions,
      [key]: value,
    });
  };

  const conditionDescriptions = {
    retweet_required: "User must have retweeted the post",
    like_required: "User must have liked the post",
    follow_required: "User must be following your account",
    comment_with_kick: "User must comment with their Kick username",
    tag_friends: "User must tag friends in comments",
    minimum_followers: "User must have minimum number of followers",
    follow_duration: "User must have been following for X months",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Conditions</CardTitle>
        <CardDescription>
          Set the requirements for users to be eligible for your giveaway
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="retweet_required"
              checked={conditions.retweet_required || false}
              onCheckedChange={(checked) => updateCondition('retweet_required', checked)}
            />
            <Label htmlFor="retweet_required" className="flex-1">
              Retweet Required
              <span className="block text-xs text-muted-foreground">
                {conditionDescriptions.retweet_required}
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="like_required"
              checked={conditions.like_required || false}
              onCheckedChange={(checked) => updateCondition('like_required', checked)}
            />
            <Label htmlFor="like_required" className="flex-1">
              Like Required
              <span className="block text-xs text-muted-foreground">
                {conditionDescriptions.like_required}
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="follow_required"
              checked={conditions.follow_required || false}
              onCheckedChange={(checked) => updateCondition('follow_required', checked)}
            />
            <Label htmlFor="follow_required" className="flex-1">
              Follow Required
              <span className="block text-xs text-muted-foreground">
                {conditionDescriptions.follow_required}
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="comment_with_kick"
              checked={conditions.comment_with_kick || false}
              onCheckedChange={(checked) => updateCondition('comment_with_kick', checked)}
            />
            <Label htmlFor="comment_with_kick" className="flex-1">
              Kick Username in Comments
              <span className="block text-xs text-muted-foreground">
                {conditionDescriptions.comment_with_kick}
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tag_friends"
              checked={conditions.tag_friends || false}
              onCheckedChange={(checked) => updateCondition('tag_friends', checked)}
            />
            <Label htmlFor="tag_friends" className="flex-1">
              Tag Friends
              <span className="block text-xs text-muted-foreground">
                {conditionDescriptions.tag_friends}
              </span>
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="minimum_followers"
                checked={conditions.minimum_followers_enabled || false}
                onCheckedChange={(checked) => updateCondition('minimum_followers_enabled', checked)}
              />
              <Label htmlFor="minimum_followers">Minimum Followers</Label>
            </div>
            {conditions.minimum_followers_enabled && (
              <Input
                type="number"
                placeholder="Minimum follower count"
                value={conditions.minimum_followers || ''}
                onChange={(e) => updateCondition('minimum_followers', parseInt(e.target.value) || 0)}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_duration"
                checked={conditions.follow_duration_enabled || false}
                onCheckedChange={(checked) => updateCondition('follow_duration_enabled', checked)}
              />
              <Label htmlFor="follow_duration">Minimum Follow Duration</Label>
            </div>
            {conditions.follow_duration_enabled && (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Months"
                  value={conditions.follow_duration_months || ''}
                  onChange={(e) => updateCondition('follow_duration_months', parseInt(e.target.value) || 0)}
                />
                <span className="text-sm text-muted-foreground">months</span>
              </div>
            )}
          </div>
        </div>

        {Object.keys(conditions).filter(key => conditions[key]).length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Active Conditions:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(conditions).map(([key, value]) => {
                if (!value) return null;
                
                let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                if (key === 'minimum_followers_enabled') label = `Min Followers: ${conditions.minimum_followers || 0}`;
                if (key === 'follow_duration_enabled') label = `Follow Duration: ${conditions.follow_duration_months || 0}m`;
                if (key.endsWith('_enabled') || key.endsWith('_months') || key === 'minimum_followers') return null;
                
                return (
                  <Badge key={key} variant="secondary">
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}