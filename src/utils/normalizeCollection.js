// Normalize Discogs collection items to a consistent shape used by the UI
export function normalizeCollection(rawReleases = []) {
  if (!Array.isArray(rawReleases)) return [];
  return rawReleases.map((r) => {
    // discogs collection items often appear as { id, basic_information: { ... } }
    const basic = r.basic_information || {};
    const id =
      r.id || basic.id || basic.discogs_id || `${basic.title}-${basic.year}`;
    const resource_url =
      basic.resource_url || r.resource_url || r.basic_information?.resource_url;
    return {
      // preserve original
      ...r,
      id,
      resource_url,
      basic_information: {
        title: basic.title || r.title || "Unknown",
        artists: basic.artists || r.artists || [],
        year: basic.year || r.year || null,
        genres: basic.genres || r.genres || [],
        cover_image:
          basic.cover_image || basic.thumbnail || r.cover_image || null,
        resource_url: resource_url,
        ...basic,
      },
    };
  });
}
