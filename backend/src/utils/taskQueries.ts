export function parseProjectIdsQuery(projectIds: unknown) {
  const normalizedProjectIds = Array.isArray(projectIds)
    ? projectIds.join(',')
    : typeof projectIds === 'string'
      ? projectIds
      : '';

  const parsedIds = normalizedProjectIds
    .split(',')
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  return {
    normalizedProjectIds,
    parsedIds,
  };
}
