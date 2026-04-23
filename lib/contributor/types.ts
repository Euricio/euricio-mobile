// SYNC'D FROM Euricio.es/lib/contributor/types.ts — keep in sync

export type ContributionTypeId =
  | 'bug' | 'improvement' | 'feature_idea' | 'workflow_idea'
  | 'data_contribution' | 'confirmation' | 'high_impact';

export type ContributionStatus =
  | 'submitted' | 'reviewing' | 'community_backed' | 'planned'
  | 'in_dev' | 'implemented' | 'not_planned' | 'rejected';

export type RetentionState = 'active' | 'archived' | 'permanent';
export type BoostLevel = 'S' | 'M' | 'L';
export type ProfileVisibility = 'private' | 'registered' | 'leaderboard';
export type ReplyLabel = 'product_team' | 'official_answer' | 'response_from_euricio';
export type ModerationReason = 'spam' | 'duplicate' | 'abuse' | 'low_quality' | 'other';
export type RewardStatus = 'pending' | 'issued' | 'redeemed' | 'expired';

export type LeaderboardBoardType =
  | 'overall' | 'bugs' | 'ideas' | 'data' | 'trust' | 'monthly_climbers' | 'monthly_top';

export interface ContributorRank {
  id: number;
  name: string;
  reward_score_min: number;
  trust_score_min: number;
  coupon_discount_pct: number;
  privileges: Record<string, unknown>;
}

export interface ContributorProfile {
  user_id: string;
  display_name?: string | null;
  visibility: ProfileVisibility;
  bio?: string | null;
  region?: string | null;
  opted_in_at?: string | null;
  updated_at: string;
}

export interface ContributorScore {
  user_id: string;
  contribution_score: number;
  trust_score: number;
  reward_score: number;
  rank_id: number;
  verified_contributions_count: number;
  last_recalc_at?: string | null;
  updated_at: string;
}

export interface Contribution {
  id: number;
  type: ContributionTypeId;
  author_id: string;
  title: string;
  body_json: Record<string, unknown>;
  status: ContributionStatus;
  retention_state: RetentionState;
  is_verified: boolean;
  quality_multiplier: number;
  likes_count: number;
  views_count: number;
  priority_score: number;
  created_at: string;
  updated_at: string;
}

export interface AdminReply {
  id: number;
  contribution_id: number;
  author_id: string;
  body: string;
  label: ReplyLabel;
  created_at: string;
  updated_at: string;
}

export interface RewardGrant {
  id: number;
  user_id: string;
  rank_id: number;
  discount_pct: number;
  stripe_coupon_id?: string | null;
  status: RewardStatus;
  issued_at?: string | null;
  redeemed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}
