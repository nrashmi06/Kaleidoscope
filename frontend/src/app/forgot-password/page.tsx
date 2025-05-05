import ForgotPasswordForm from "@/components/authorization/forgot-password-form";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

function ForgotPasswordPage() {
  return (
    <div className="flex flex-row h-screen w-full">
      {/* Left side: Aurora visual background */}
      <div className="w-1/2 hidden md:block relative">
        <AuroraBackground className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 w-full h-full bg-transparent">
            <div className="absolute top-1/2 transform -translate-y-1/2 text-center w-full px-6">
              <div className="space-y-4">
                <div className="text-12xl md:text-14xl lg:text-16xl font-extrabold tracking-tight leading-tight text-center">
                  <Image
                    src="/team_1.png"
                    alt="Forgot password image"
                    width={500}
                    height={500}
                    className="mx-auto"
                  />
                  <span className="text-transparent bg-clip-text">
                    <TextGenerateEffect
                      words="Reset your password and reclaim access!"
                      className="text-sm font-semibold text-transparent bg-clip-text text-gray-400"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </div>

      {/* Right side: Forgot Password Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center h-full p-6 md:p-12 bg-white">
        <div className="w-full max-w-md shadow-input md:shadow-none md:rounded-2xl">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
