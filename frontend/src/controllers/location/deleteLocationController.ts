import { deleteLocationService } from "@/services/location/deleteLocation";

export async function deleteLocationController(
  accessToken: string,
  locationId: number
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await deleteLocationService(locationId, accessToken);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
