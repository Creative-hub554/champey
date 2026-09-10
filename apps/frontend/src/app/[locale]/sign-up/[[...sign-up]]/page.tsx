import { SignUp } from "@clerk/nextjs";
import { AuthDisabledNotice } from "@/components/AuthDisabledNotice";
import { PostSignInRouter } from "@/components/PostSignInRouter";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthDisabledNotice>
        <PostSignInRouter />
        <SignUp />
      </AuthDisabledNotice>
    </div>
  );
}
