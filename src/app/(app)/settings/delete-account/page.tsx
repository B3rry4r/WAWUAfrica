"use client";

import { useRouter } from "next/navigation";
import { ThreePaneLayout } from "@/components/layout/ThreePaneLayout";
import { DeleteAccountBody } from "./DeleteAccountBody";
import { SettingsCategoryList, SettingsDetailShell, SETTINGS_LIST_HEADER } from "../SettingsDesktopShared";
import type { InternalSettingsKey } from "../SettingsDesktopShared";

export default function DeleteAccountPage() {
  const router = useRouter();

  const goTo = (key: InternalSettingsKey) => {
    router.push(key === "notifications" ? "/settings/notifications" : "/settings/delete-account");
  };

  return (
    <>
      <div className="p-[14px_16px_96px] xl:hidden">
        <DeleteAccountBody variant="mobile" />
      </div>

      <ThreePaneLayout
        listWidth={320}
        listHeader={SETTINGS_LIST_HEADER}
        list={<SettingsCategoryList activeKey="delete-account" onSelectInternal={goTo} />}
        detail={
          <SettingsDetailShell title="Delete account">
            <DeleteAccountBody variant="desktop" />
          </SettingsDetailShell>
        }
      />
    </>
  );
}
