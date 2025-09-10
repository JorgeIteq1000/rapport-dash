import { DashboardDataProvider } from "@/contexts/DashboardDataContext";
import AdminArea from "./AdminArea";

export default function AdminAreaWithProvider() {
  return (
    <DashboardDataProvider>
      <AdminArea />
    </DashboardDataProvider>
  );
}