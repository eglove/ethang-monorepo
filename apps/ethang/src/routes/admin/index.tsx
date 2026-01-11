import { LoginForm } from "../../components/admin/login-form.tsx";
import { MainLayout } from "../../components/main-layout.tsx";

const AdminLoginPage = () => {
  return (
    <MainLayout>
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoginForm />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: AdminLoginPage,
});
