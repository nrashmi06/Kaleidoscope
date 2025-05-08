import axios,{ AxiosError} from "axios";
import { ForgotPasswordData, ForgotPasswordResponse, ErrorResponse } from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";

export const forgotPassword = async (
    data: ForgotPasswordData,
    ): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.post<ForgotPasswordResponse>(AuthMapper.forgotPassword, data);
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
            message: typeof errData === "string" ? errData : "Failed to send OTP",
        };
        }
        return {
        success: false,
        message: "Unexpected error occurred",
        };
    }
    }
