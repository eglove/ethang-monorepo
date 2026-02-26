/* eslint-disable cspell/spellchecker */
import { BlogLayout } from "../../layouts/blog-layout.tsx";
import { H1 } from "../../typography/h1.tsx";
import { H2 } from "../../typography/h2.tsx";
import { Link } from "../../typography/link.tsx";
import { P } from "../../typography/p.tsx";
import { YouTubeVideo } from "../../you-tube-video.tsx";

export const developmentJobsTrendingPublished = new Date("Feb. 26, 2026");

export const DevelopmentJobsTrendingUpward = async () => {
  return (
    <BlogLayout
      title="Dev job postings are finally trending upward"
      imageUrl="/images/generated/Gemini_Generated_Image_yj0e8dyj0e8dyj0e.png"
      description="Dev Reads edition Dev job postings are finally trending upward"
      canonicalUrl="https://www.linkedin.com/pulse/dev-job-postings-finally-trending-upward-ethan-glover-1bljc/"
    >
      <H1>Dev job postings are finally trending upward</H1>
      <H2 className="mt-6">The software dev job market is picking up!</H2>
      <YouTubeVideo
        videoId="7ov2M4ljccA"
        title="The software dev job market is picking up!"
      />
      <P>
        <Link href="https://fred.stlouisfed.org/series/IHLIDXUSTPSOFTDEVE">
          Software Development Job Postings on Indeed in the United States
        </Link>
      </P>
      <H2>The Internet Was Weeks Away From Disaster and No One Knew</H2>
      <YouTubeVideo
        videoId="aoag03mSuXQ"
        title="The Internet Was Weeks Away From Disaster and No One Knew"
      />
    </BlogLayout>
  );
};
