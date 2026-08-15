import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/Feedback";

export default function CommunitiesPage() {
  return (
    <div>
      <Header title="Communities" />
      <EmptyState
        icon="Users"
        title="No communities yet"
        description="Join a creator's paid community to ask questions and trade notes with people who buy the same things."
      />
    </div>
  );
}
