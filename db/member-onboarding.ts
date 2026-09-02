import { env } from 'cloudflare:workers';

import type {
  InterestKey,
  LearningGoal,
  StartMode,
} from '@/lib/member-onboarding';

export type MemberOnboardingProfile = {
  learningGoal: LearningGoal;
  startMode: StartMode;
  interestKeys: InterestKey[];
  firstOutcome: string | null;
};

function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding `DB` is unavailable.');
  return env.DB;
}

export async function getMemberOnboardingProfile(
  memberId: string,
): Promise<MemberOnboardingProfile | null> {
  const row = await getD1()
    .prepare(
      `
      SELECT
        learning_goal AS learningGoal,
        start_mode AS startMode,
        interest_keys AS interestKeys,
        first_outcome AS firstOutcome
      FROM member_onboarding_profiles
      WHERE member_id = ?
      LIMIT 1
    `,
    )
    .bind(memberId)
    .first<
      Omit<MemberOnboardingProfile, 'interestKeys'> & { interestKeys: string }
    >();
  if (!row) return null;
  try {
    const interestKeys = JSON.parse(row.interestKeys) as InterestKey[];
    return {
      ...row,
      interestKeys: Array.isArray(interestKeys) ? interestKeys : [],
    };
  } catch {
    return { ...row, interestKeys: [] };
  }
}

export async function saveMemberOnboardingProfile(input: {
  memberId: string;
  profile: MemberOnboardingProfile;
}): Promise<void> {
  const now = Date.now();
  await getD1()
    .prepare(
      `
      INSERT INTO member_onboarding_profiles (
        member_id,
        learning_goal,
        start_mode,
        interest_keys,
        first_outcome,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(member_id) DO UPDATE SET
        learning_goal = excluded.learning_goal,
        start_mode = excluded.start_mode,
        interest_keys = excluded.interest_keys,
        first_outcome = excluded.first_outcome,
        updated_at = excluded.updated_at
    `,
    )
    .bind(
      input.memberId,
      input.profile.learningGoal,
      input.profile.startMode,
      JSON.stringify(input.profile.interestKeys),
      input.profile.firstOutcome,
      now,
      now,
    )
    .run();
}
