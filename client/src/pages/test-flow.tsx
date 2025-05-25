import { MainLayout } from "@/components/layout/main-layout";
import { TestUploadForm } from "@/components/test-upload-form";

export default function TestFlow() {
  return (
    <MainLayout
      title="Test End-to-End Flow"
      subtitle="Upload CSV → Train Model → Show Results"
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Test Flow" }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <TestUploadForm />
      </div>
    </MainLayout>
  );
}