import { AxiosError } from "axios";
import { CreateLocationRequestDTO, CreateLocationResponse } from "@/lib/types/post";
import { createLocation } from "@/services/location/createLocation";

export const createLocationController = async (
  input: CreateLocationRequestDTO,
  accessToken: string
): Promise<CreateLocationResponse> => {
  try {
    const response = await createLocation(input, accessToken);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while creating the location.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[LocationController] Failed to create location - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[LocationController] Unexpected error while creating location:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to create location.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/locations",
    };
  }
};
