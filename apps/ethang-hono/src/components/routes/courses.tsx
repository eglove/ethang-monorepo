import get from "lodash/get.js";
import { DateTime } from "luxon";

import { coursePathData } from "../../stores/course-path-store.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { registerScript } from "../../utilities/register-script.ts";
import { CourseProgressBar } from "../courses/course-progress-bar.tsx";
import { CoursesContainer } from "../courses/courses-container.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { Link } from "../typography/link.tsx";
import { P } from "../typography/p.tsx";
import { YouTubeVideo } from "../you-tube-video.tsx";

export const Courses = async () => {
  registerScript(globalStore, "components/courses/course-completion");

  const { latestUpdate } = coursePathData;

  const formatted = DateTime.fromISO(
    get(latestUpdate, ["_updatedAt"], DateTime.now().toISO()),
    {
      locale: globalStore.locale,
      zone: globalStore.timezone,
    },
  ).toLocaleString({
    dateStyle: "medium",
    timeStyle: "long",
  });

  return (
    <MainLayout
      title="Recommended Courses"
      textAlternate="/courses?format=text"
      updatedAt={latestUpdate?._updatedAt}
      imageUrl="/images/generated/Gemini_Generated_Image_2ac79s2ac79s2ac7.png"
      description="A curated list of recommended courses for development. Learn from industry experts and stay up-to-date with the latest technologies."
    >
      <div class="mx-auto max-w-7xl">
        <H1>Recommended Courses</H1>
        <P>Last Updated: {formatted}</P>
        <YouTubeVideo
          videoId="5uxDJJdl_jA"
          title="EthanG | Recommended Courses"
          classNames={{ container: "max-h-96" }}
        />
        <P
          id="sign-in-prompt"
          className={globalStore.isAuthenticated ? "hidden" : ""}
        >
          <Link href="/sign-in">Sign In To Track Changes</Link>
        </P>
        <P
          id="auth-section-header"
          className={globalStore.isAuthenticated ? "" : "hidden"}
        >
          Your Progress:
        </P>
        <CourseProgressBar
          classNames={{
            container: globalStore.isAuthenticated ? "" : "hidden",
          }}
        />
        <div class="my-6">
          <CoursesContainer />
        </div>
      </div>
    </MainLayout>
  );
};
