import { RegisterForm } from "@/components/auth/RegisterForm";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AuthPageFrame } from "../../components/auth/AuthPageFrame";

export function RegisterPage() {
  usePageMeta({ title: "Register - WorkNest" });

  return (
    <AuthPageFrame
      title="Create your workspace account"
      description="Launch your WorkNest company workspace and set up your admin profile in minutes."
    >
      <RegisterForm />
    </AuthPageFrame>
  );
}