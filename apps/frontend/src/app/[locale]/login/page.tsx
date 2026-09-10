"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthDisabledNotice } from "@/components/AuthDisabledNotice";
import { PostSignInRouter } from "@/components/PostSignInRouter";

export default function LoginPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <AuthDisabledNotice>
        <PostSignInRouter />
        <SignIn />
      </AuthDisabledNotice>
    </div>
  );
}
