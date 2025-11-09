const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_BACKEND_URL || 'http://localhost:8080';

/**
 * Fetch hashtag suggestions
 * @param prefix - Hashtag prefix to search for
 * @param token - Bearer token for authorization
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 10)
 */
export async function getHashtagSuggestions(
  prefix: string,
  token: string,
  page: number = 0,
  size: number = 10
) {
  if (!prefix?.trim()) throw new Error('Prefix is required');

  const queryString = new URLSearchParams({
    prefix: prefix.trim(),
    page: page.toString(),
    size: size.toString(),
  }).toString();

  const url = `${API_BASE_URL}/kaleidoscope/api/hashtags/suggest?${queryString}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error(data?.message || 'Failed to fetch hashtag suggestions');
  }

  return data;
}
