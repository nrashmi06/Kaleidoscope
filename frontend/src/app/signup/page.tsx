import SignupForm from "@/components/authorization/signup-form-demo";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

function Page() {
  return (
    <div className="flex flex-row h-screen w-full">
      {/* Left side: Aurora visual background */}
      <div className="w-1/2 hidden md:block relative">
        <AuroraBackground className="absolute inset-0 w-full h-full">
          {/* Ensure the left side is transparent or has a background color */}
          <div className="absolute inset-0 w-full h-full bg-transparent">
            {/* Centered text on top of the aurora */}
            <div className="absolute top-1/2 transform -translate-y-1/2 text-center w-full px-6">
              <div className="space-y-4">
              <div className="text-12xl md:text-14xl lg:text-16xl font-extrabold tracking-tight leading-tight text-center">
                  <Image
                    src="/team.png"
                    alt="img"
                    width={500}
                    height={500}
                    className="mx-auto"
                  />
                  <span className="text-transparent bg-clip-text">
                    <TextGenerateEffect
                      words="Sign-Up to explore the other side !"
                      className="text-transparent bg-clip-text text-sm text-slate-400"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </div>

      {/* Right side: Fullscreen Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center h-full p-6 md:p-12 bg-white">
        <div className="w-full max-w-md shadow-input md:shadow-none md:rounded-2xl">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default Page;
