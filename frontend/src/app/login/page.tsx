import SignupForm from "@/components/authorization/signup-form-demo";
import React from 'react'

function page() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate to-neutral-300 p-4 md:p-8">
        <SignupForm />
    </div>
  )
}

export default page