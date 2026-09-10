import { SignIn } from "@clerk/nextjs";
import { AuthDisabledNotice } from "@/components/AuthDisabledNotice";
import { PostSignInRouter } from "@/components/PostSignInRouter";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthDisabledNotice>
        <PostSignInRouter />
        <SignIn />
      </AuthDisabledNotice>
    </div>
  );
}
