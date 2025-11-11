import { axiosInstance } from '@/hooks/axios';
import { NominatimLocation } from '@/lib/types/post';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const searchNominatimLocations = async (
  query: string,
  limit: number = 5
): Promise<NominatimLocation[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await axiosInstance.get<NominatimLocation[]>(
      `${NOMINATIM_BASE_URL}/search`,
      {
        params: {
          q: query,
          format: 'jsonv2',
          limit,
          addressdetails: 1,
        },
        // Note: User-Agent cannot be set in browser environments
        // Nominatim will see the browser's default User-Agent
      }
    );
    return response.data;
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
};
