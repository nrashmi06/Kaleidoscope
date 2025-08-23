import SigninForm from "@/components/authorization/signin-form-demo";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

function Page() {
  return (
    <div className="flex flex-row h-screen w-full bg-white dark:bg-black transition-colors duration-500">
      {/* Left side: Aurora visual background */}
      <div className="w-1/2 hidden md:block relative">
        <AuroraBackground className="absolute inset-0 w-full h-full">
          {/* Transparent overlay with dark mode fallback */}
          <div className="absolute inset-0 w-full h-full bg-transparent dark:bg-black/80">
            {/* Centered text on top of the aurora */}
            <div className="absolute top-1/2 transform -translate-y-1/2 text-center w-full px-6">
              <div className="space-y-4">
                <div className="text-12xl md:text-14xl lg:text-16xl font-extrabold tracking-tight leading-tight text-center">
                  <Image
                    src="/team_1.png"
                    alt="img"
                    width={500}
                    height={500}
                    className="mx-auto"
                  />
                  <span className="text-transparent bg-clip-text">
                    <TextGenerateEffect
                      words="Sign in to explore the other side!"
                      className="text-sm font-semibold text-gray-600 dark:text-gray-400"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </div>

      {/* Right side: Fullscreen Signin Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center h-full p-6 md:p-12 bg-white dark:bg-black transition-colors duration-500">
        <div className="w-full max-w-md shadow-input md:shadow-none md:rounded-2xl bg-white dark:bg-neutral-900 transition-colors duration-500">
          <SigninForm />
        </div>
      </div>
    </div>
  );
}

export default Page;
