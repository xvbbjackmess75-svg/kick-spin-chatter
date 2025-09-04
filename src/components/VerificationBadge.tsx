import { Badge } from '@/components/ui/badge';
import { Shield, Star } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  isVerified, 
  size = 'sm', 
  showText = true,
  className = '' 
}: VerificationBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const iconSize = sizeClasses[size];

  return (
    <Badge 
      variant="secondary"
      className={`bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 ${className}`}
    >
      <Shield className={`${iconSize} mr-1`} />
      {showText && 'Verified'}
    </Badge>
  );
}

interface VerificationStatusProps {
  isVerified: boolean;
  hasAccount: boolean;
  className?: string;
}

export function VerificationStatus({ isVerified, hasAccount, className = '' }: VerificationStatusProps) {
  if (isVerified) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <VerificationBadge isVerified={true} />
        <span className="text-sm text-green-600 dark:text-green-400">Verified Viewer</span>
      </div>
    );
  }

  if (hasAccount) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400">
          <Star className="h-3 w-3 mr-1" />
          Registered
        </Badge>
        <span className="text-sm text-yellow-600 dark:text-yellow-400">Has Account</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="text-muted-foreground">
        Guest
      </Badge>
      <span className="text-sm text-muted-foreground">No Account</span>
    </div>
  );
}