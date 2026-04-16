const PREMIUM_PLANS = ['business', 'enterprise'];

export interface ProfileWithPlan {
  plan?: string | null;
  is_internal?: boolean | null;
}

export function hasPremiumPlan(profile: ProfileWithPlan | null | undefined): boolean {
  if (!profile?.plan) return false;
  return PREMIUM_PLANS.includes(profile.plan.toLowerCase());
}

export function isInternal(profile: ProfileWithPlan | null | undefined): boolean {
  return profile?.is_internal === true;
}

export function canAccessPdfTools(profile: ProfileWithPlan | null | undefined): boolean {
  return hasPremiumPlan(profile) || isInternal(profile);
}
