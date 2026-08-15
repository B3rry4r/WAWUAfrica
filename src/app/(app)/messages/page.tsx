import { Inbox } from "@/components/messages/Inbox";
import { QuestionsDesktop } from "@/components/messages/QuestionsDesktop";

export const metadata = {
  title: "Messages · WAWUAfrica",
};

export default function MessagesPage() {
  return (
    <>
      {/* Mobile inbox list, unchanged below xl: — the desktop three-pane
          view below replaces it at xl and up (design D8). */}
      <div className="xl:hidden">
        <Inbox />
      </div>
      <QuestionsDesktop />
    </>
  );
}
