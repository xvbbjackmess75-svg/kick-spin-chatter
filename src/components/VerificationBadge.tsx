import { Badge } from '@/components/ui/badge';
import { Shield, Star, Crown } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  type?: 'verified_viewer' | 'verified_streamer';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  isVerified, 
  type = 'verified_viewer',
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

  // Different styling for different verification types
  const getVerificationStyle = () => {
    switch (type) {
      case 'verified_streamer':
        return {
          className: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
          icon: <Crown className={`${iconSize} mr-1`} />,
          text: 'Verified Streamer'
        };
      case 'verified_viewer':
      default:
        return {
          className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
          icon: <Shield className={`${iconSize} mr-1`} />,
          text: 'Verified'
        };
    }
  };

  const verificationStyle = getVerificationStyle();

  return (
    <Badge 
      variant="secondary"
      className={`${verificationStyle.className} ${className}`}
    >
      {verificationStyle.icon}
      {showText && verificationStyle.text}
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