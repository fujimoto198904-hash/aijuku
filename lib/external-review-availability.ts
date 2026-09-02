export function externalReviewUnavailableResponse(): Response {
  return Response.json(
    {
      code: 'external_reviews_unavailable',
      error: '第三者評価機能は提供していません。',
    },
    { status: 410 },
  );
}
