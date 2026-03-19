import {
  getUserInterestsService,
  addUserInterestService,
  removeUserInterestService,
  removeUserInterestsBulkService,
  getUserInterestsByUserIdService,
} from "@/services/userInterest/userInterestService";
import {
  GetUserInterestsResponse,
  AddUserInterestResponse,
  RemoveUserInterestResponse,
  BulkUserInterestResponse,
} from "@/lib/types/userInterest";

export async function getUserInterestsController(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetUserInterestsResponse> {
  return getUserInterestsService(accessToken, page, size);
}

export async function addUserInterestController(
  accessToken: string,
  categoryId: number
): Promise<AddUserInterestResponse> {
  return addUserInterestService(accessToken, categoryId);
}

export async function removeUserInterestController(
  accessToken: string,
  categoryId: number
): Promise<RemoveUserInterestResponse> {
  return removeUserInterestService(accessToken, categoryId);
}

export async function removeUserInterestsBulkController(
  accessToken: string,
  categoryIds: number[]
): Promise<BulkUserInterestResponse> {
  return removeUserInterestsBulkService(accessToken, categoryIds);
}

export async function getUserInterestsByUserIdController(
  accessToken: string,
  userId: number,
  page: number = 0,
  size: number = 10
): Promise<GetUserInterestsResponse> {
  return getUserInterestsByUserIdService(accessToken, userId, page, size);
}
