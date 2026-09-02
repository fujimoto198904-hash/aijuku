type DemoAwareUser = {
  isDemo?: boolean;
};

export function rejectDemoWrite(user: DemoAwareUser): Response | null {
  if (!user.isDemo) return null;

  return Response.json(
    {
      error:
        'デモアカウントは閲覧専用です。申込・学習記録・会員情報の変更は保存されません。',
    },
    { status: 403 },
  );
}
