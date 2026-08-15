import { Header } from "@/components/layout/Header";
import { ProfileHeader } from "@/components/ui/ProfileHeader";

export default function ExplorePage() {
  return (
    <div>
      <Header title="Explore" />
      <div className="pt-[16px] px-[16px] pb-[32px] flex flex-col gap-[16px]">
        <ProfileHeader
          name="Adaeze Okonkwo"
          handle="adaezeokonkwo"
          bio="I turn market traders into registered businesses. CAC, pricing, bookkeeping — plain and practical."
          tier="certified_professional"
          plan="pro"
          stats={[
            { value: "4", label: "Pieces" },
            { value: "1,240", label: "EVG" },
            { value: "2.4k", label: "Followers" },
          ]}
          primaryAction="Follow"
        />
      </div>
    </div>
  );
}
