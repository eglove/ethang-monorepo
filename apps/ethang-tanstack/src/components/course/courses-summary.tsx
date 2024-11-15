import { DateTime } from "luxon";

// eslint-disable-next-line @typescript-eslint/unbound-method
const formatter = Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  style: "unit",
  unit: "year",
}).format;
const timezone = "America/Chicago";

export const CoursesSummary = () => {
  const start = DateTime.fromObject({
    month: 11,
    year: 2018,
  }, { zone: "America/Chicago" });
  const now = DateTime.now().setZone(timezone);
  const diff = now.diff(start, "years");

  return (
    <div className="prose max-w-max text-foreground">
      <p>
        I have been maintaining this list of courses for
        {" "}
        {formatter(diff.years)}
        . It's meant as a way to provide a straightforward curriculum of what
        you need to learn for development. It's updated constantly, but at any
        given point in time, I believe this is the best way to get started
        with,
        and learn everything you need to know to work with the web and beyond.
      </p>
      <p>
        These courses will take a while to get through, so I do recommend
        signing up for Pro accounts instead of buying one-time courses. So in
        the beginner section, check out Udemy Pro. Keep going with Udemy Pro
        for
        Academind's courses. Once you're through those, cancel it, move on to
        AlgoExpert, and so on.
      </p>
    </div>
  );
};
