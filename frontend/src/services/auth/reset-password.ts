import axios, {AxiosError} from "axios";
import { ResetPasswordData, ResetPasswordResponse, ErrorResponse } from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";

export const resetPassword = async (
    data: ResetPasswordData,
    ): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.post<ResetPasswordResponse>(AuthMapper.resetPassword, data);
        return {
        success: true,
        message: response.data.message,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        const errData = axiosError.response?.data || { message: axiosError.message };
        return {
            success: false,
            message: typeof errData === "string" ? errData : "Failed to reset password",
        };
        }
        return {
        success: false,
        message: "Unexpected error occurred",
        };
    }
}