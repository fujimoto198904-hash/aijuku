export function mixLearningFeed<T, U>(members: T[], guides: U[]) {
  const result: ({ type: 'member'; value: T } | { type: 'guide'; value: U })[] =
    [];
  let guideIndex = 0;
  members.forEach((value, i) => {
    result.push({ type: 'member', value });
    if (i % 3 === 1 && guides[guideIndex])
      result.push({ type: 'guide', value: guides[guideIndex++] });
  });
  while (guideIndex < guides.length)
    result.push({ type: 'guide', value: guides[guideIndex++] });
  return result;
}
