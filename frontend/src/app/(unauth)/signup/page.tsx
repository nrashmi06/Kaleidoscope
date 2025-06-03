import SignupForm from "@/components/authorization/signup-form-demo";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

function Page() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left side: Aurora visual background (fixed for all viewports >= md) */}
      <div className="hidden md:block w-1/2 h-screen sticky top-0">
        <AuroraBackground className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 w-full h-full bg-transparent">
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

      {/* Right side: Scrollable Signup Form */}
      <div className="w-full md:w-1/2 h-screen overflow-y-auto bg-white flex justify-center">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default Page;
