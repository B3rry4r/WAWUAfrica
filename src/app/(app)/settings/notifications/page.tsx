"use client";

import { useRouter } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { NotificationsSettingsBody } from "./NotificationsSettingsBody";
import { SettingsCategoryList, SettingsDetailShell, SETTINGS_LIST_HEADER } from "../SettingsDesktopShared";
import type { InternalSettingsKey } from "../SettingsDesktopShared";

export default function NotificationsPage() {
  const router = useRouter();

  const goTo = (key: InternalSettingsKey) => {
    router.push(key === "notifications" ? "/settings/notifications" : "/settings/delete-account");
  };

  return (
    <>
      <div className="flex flex-col gap-[14px] p-[14px_16px_96px] xl:hidden">
        <div className="flex items-center gap-[10px]">
          <ProfileBackButton compact />
          <span className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Notifications
          </span>
        </div>
        <NotificationsSettingsBody />
      </div>

      <ThreePaneLayout
        listWidth={320}
        listHeader={SETTINGS_LIST_HEADER}
        list={<SettingsCategoryList activeKey="notifications" onSelectInternal={goTo} />}
        detail={
          <SettingsDetailShell title="Notifications">
            <NotificationsSettingsBody />
          </SettingsDetailShell>
        }
      />
    </>
  );
}
