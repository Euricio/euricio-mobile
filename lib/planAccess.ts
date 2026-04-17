const PREMIUM_PLANS = ['professional', 'enterprise'];

export interface ProfileWithPlan {
  plan?: string | null;
  is_internal?: boolean | null;
  role?: string | null;
}

export function hasPremiumPlan(profile: ProfileWithPlan | null | undefined): boolean {
  if (!profile?.plan) return false;
  return PREMIUM_PLANS.includes(profile.plan.toLowerCase());
}

export function isInternal(profile: ProfileWithPlan | null | undefined): boolean {
  return profile?.is_internal === true;
}

export function isAdmin(profile: ProfileWithPlan | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function canAccessPdfTools(profile: ProfileWithPlan | null | undefined): boolean {
  return isAdmin(profile) || isInternal(profile) || hasPremiumPlan(profile);
}
