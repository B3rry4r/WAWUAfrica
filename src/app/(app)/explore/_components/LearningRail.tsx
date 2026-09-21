import type { LearnCourse } from "@/types/learn";
import { Icon, MediaCard } from "@/components/ui";
import { Rail } from "./Rail";

/**
 * Learning & Growth, built to the reference
 * (refs/target-explore-desktop-structure.jpg).
 *
 * WHAT THE REFERENCE DRAWS. A slider of wide picture cards with the course
 * title set over the bottom of the photograph. Not the bordered panels with
 * a graduation-cap glyph this first shipped as.
 *
 * The rail reads the real course catalogue rather than the four titles the
 * reference names (music production, filmmaking, content creation, music
 * business): hard-coding those would put four names on the screen that
 * nothing in the app can open. Whatever the catalogue holds is what appears.
 *
 * Server component: the catalogue is a public read and the page that renders
 * this already awaits it, so there is nothing to fetch again on the client.
 */
export function LearningRail({ courses }: { courses: readonly LearnCourse[] }) {
  return (
    <Rail
      title="Learning and growth"
      caption="Gain new skills, get certified and grow your creative career"
      seeAllHref="/learn"
    >
      {courses.slice(0, 10).map((c) => (
        <MediaCard
          key={c.id}
          href={`/learn/courses/${c.id}`}
          imageUrl={c.imageUrl}
          aspect="aspect-[4/3]"
          className="w-[236px]"
          fallback={<Icon name="GraduationCap" size={34} color="rgba(255,255,255,0.5)" />}
          title={c.title}
          caption={`${c.hours} ${c.hours === 1 ? "hour" : "hours"}${c.certificate ? " · Certificate" : ""}`}
        />
      ))}

      <MediaCard
        href="/learn"
        aspect="aspect-[4/3]"
        className="w-[236px]"
        fallback={<Icon name="BookOpen" size={34} color="rgba(255,255,255,0.5)" />}
        title="Business Playbook"
        caption="Yours to download, any time"
      />
    </Rail>
  );
}
