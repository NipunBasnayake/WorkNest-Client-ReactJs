import { LoginForm } from "@/components/auth/LoginForm";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AuthPageFrame } from "../../components/auth/AuthPageFrame";

export function LoginPage() {
  usePageMeta({ title: "Login - WorkNest" });

  return (
    <AuthPageFrame
      title="Welcome back"
      description="Continue to your workspace dashboard and team operations in one secure place."
    >
      <LoginForm />
    </AuthPageFrame>
  );
}