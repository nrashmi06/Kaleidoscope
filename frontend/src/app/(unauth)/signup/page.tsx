import SignupForm from "@/components/authorization/signup-form-demo";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Image from "next/image";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

function Page() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-neutral-900">
      {/* Left side: Aurora visual background */}
      <div className="hidden md:block w-1/2 h-screen sticky top-0">
        <AuroraBackground className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 w-full h-full bg-transparent">
            <div className="absolute top-1/2 transform -translate-y-1/2 text-center w-full px-6">
              <div className="space-y-4">
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-center text-gray-900 dark:text-gray-100">
                  <Image
                    src="/team.png"
                    alt="img"
                    width={500}
                    height={500}
                    className="mx-auto"
                  />
                  <span>
                    <TextGenerateEffect
                      words="Sign-Up to explore the other side !"
                      className="text-sm text-slate-600 dark:text-slate-300"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </div>

      {/* Right side: Signup Form */}
      <div className="w-full md:w-1/2 h-screen overflow-y-auto bg-white dark:bg-neutral-900 flex justify-center items-center">
        <div className="w-full max-w-md px-4">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}

export default Page;
