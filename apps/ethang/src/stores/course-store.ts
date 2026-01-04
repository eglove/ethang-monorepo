import { BaseStore } from "@ethang/store";
import findIndex from "lodash/findIndex";
import forEach from "lodash/forEach";

type CourseData = {
  knowledgeAreas: (keyof typeof knowledgeArea)[];
  name: string;
  platform: string;
  url: string;
};

const coltSteele = "Colt Steele";
const patternsDevelopment = "Patterns.dev";
const typeLevelTypeScript = "Type-Level TypeScript";
const frontendMasters = "Frontend Masters";
const linkedInLearning = "LinkedIn Learning";

const courseData: CourseData[] = [
  {
    knowledgeAreas: [4, 3],
    name: "The HTML & CSS Bootcamp",
    platform: coltSteele,
    url: "https://www.udemy.com/course/html-and-css-bootcamp/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "The Web Developer Bootcamp",
    platform: coltSteele,
    url: "https://www.udemy.com/course/the-web-developer-bootcamp/",
  },
  {
    knowledgeAreas: [8],
    name: "The Git & GitHub Bootcamp",
    platform: coltSteele,
    url: "https://www.udemy.com/course/git-and-github-bootcamp/",
  },
  {
    knowledgeAreas: [16, 6],
    name: "The Linux Command Line Bootcamp",
    platform: coltSteele,
    url: "https://www.udemy.com/course/the-linux-command-line-bootcamp/",
  },
  {
    knowledgeAreas: [4],
    name: "JavaScript Pro: Mastering Advanced Concepts and Techniques",
    platform: coltSteele,
    url: "https://www.udemy.com/course/pro-javascript/",
  },
  {
    knowledgeAreas: [4],
    name: "Mastering TypeScript",
    platform: coltSteele,
    url: "https://www.udemy.com/course/learn-typescript/",
  },
  {
    knowledgeAreas: [4],
    name: "JavaScript - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "CSS - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/css-the-complete-guide-incl-flexbox-grid-sass/",
  },
  {
    knowledgeAreas: [4],
    name: "Vue - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/vuejs-2-the-complete-guide/",
  },
  {
    knowledgeAreas: [4, 6],
    name: "NodeJS - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/nodejs-the-complete-guide/",
  },
  {
    knowledgeAreas: [4, 16],
    name: "MongoDB - The Complete Developer's Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/mongodb-the-complete-developers-guide/",
  },
  {
    knowledgeAreas: [4, 16],
    name: "SQL - The Complete Developer's Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/sql-the-complete-guide-mysql-postgresql-more",
  },
  {
    knowledgeAreas: [4],
    name: "React - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "Next.js 15 & React - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/nextjs-react-the-complete-guide/",
  },
  {
    knowledgeAreas: [4],
    name: "React Native - The Practical Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/react-native-the-practical-guide/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "React, NodeJS, Express & MongoDB - The MERN Fullstack Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/react-nodejs-express-mongodb-the-mern-fullstack-guide",
  },
  {
    knowledgeAreas: [4],
    name: "React & TypeScript - The Practical Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/react-typescript-the-practical-guide/",
  },
  {
    knowledgeAreas: [4],
    name: "Understanding TypeScript",
    platform: "Academind",
    url: "https://www.udemy.com/course/understanding-typescript/",
  },
  {
    knowledgeAreas: [4],
    name: "Angular - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/the-complete-guide-to-angular-2/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "Angular & NodeJS - The MEAN Stack Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/angular-nodejs-the-mean-stack-guide-2020-edition",
  },
  {
    knowledgeAreas: [4],
    name: "Ionic - Build iOS, Android & Web Apps with Ionic & Angular",
    platform: "Academind",
    url: "https://pro.academind.com/p/ionic-build-ios-android-web-apps-with-ionic-angular",
  },
  {
    knowledgeAreas: [8],
    name: "Git & GitHub - The Practical Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/git-github-the-practical-guide",
  },
  {
    knowledgeAreas: [6],
    name: "Docker & Kubernetes: The Practical Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/",
  },
  {
    knowledgeAreas: [8, 6],
    name: "GitHub Actions - The Complete Guide",
    platform: "Academind",
    url: "https://www.udemy.com/course/github-actions-the-complete-guide/",
  },
  {
    knowledgeAreas: [4, 12],
    name: "Clean Code",
    platform: "Academind",
    url: "https://www.udemy.com/course/writing-clean-code/",
  },
  {
    knowledgeAreas: [4],
    name: "JavaScript - The Tricky Parts",
    platform: "Academind",
    url: "https://pro.academind.com/p/javascript-the-tricky-parts",
  },
  {
    knowledgeAreas: [16, 17],
    name: "JavaScript Algorithms: The Fundamentals",
    platform: "Academind",
    url: "https://pro.academind.com/p/javascript-algorithms-the-fundamentals",
  },
  {
    knowledgeAreas: [16],
    name: "JavaScript Data Structures - The Fundamentals",
    platform: "Academind",
    url: "https://pro.academind.com/p/javascript-datastructures-the-fundamentals",
  },
  {
    knowledgeAreas: [4],
    name: "Python - The Practical Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/python-the-practical-guide",
  },
  {
    knowledgeAreas: [4],
    name: "Python Django - The Practical Guide",
    platform: "Academind",
    url: "https://pro.academind.com/p/python-django-the-practical-guide",
  },
  {
    knowledgeAreas: [4],
    name: "Query.gg",
    platform: "UI.dev",
    url: "https://query.gg/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "CSS for JavaScript Developers",
    platform: "Josh W Comeau",
    url: "https://css-for-js.dev/",
  },
  {
    knowledgeAreas: [3, 2],
    name: patternsDevelopment,
    platform: patternsDevelopment,
    url: "https://www.patterns.dev/#patterns",
  },
  {
    knowledgeAreas: [4, 16],
    name: typeLevelTypeScript,
    platform: typeLevelTypeScript,
    url: "https://type-level-typescript.com/",
  },
  {
    knowledgeAreas: [4, 16],
    name: "Complete Intro to Web Development",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-development-v3/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "Getting Started with CSS",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/getting-started-css-v2/",
  },
  {
    knowledgeAreas: [4],
    name: "Getting Started with JavaScript",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/getting-started-javascript-v3/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "CSS Foundations",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/css-foundations/",
  },
  {
    knowledgeAreas: [4],
    // eslint-disable-next-line no-script-url,sonar/code-eval
    name: "JavaScript: From First Steps to Professional",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/javascript-first-steps/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "Website Accessibility",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/accessibility-v3/",
  },
  {
    knowledgeAreas: [4],
    // eslint-disable-next-line no-script-url,sonar/code-eval
    name: "JavaScript: The Hard Parts",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/javascript-hard-parts-v2/",
  },
  {
    knowledgeAreas: [4],
    name: "Deep JavaScript Foundations",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/deep-javascript-v3/",
  },
  {
    knowledgeAreas: [4],
    name: "Complete Intro to React",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/complete-react-v9/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "Vanilla JS: You Might Not Need a Framework",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/vanilla-js-apps/",
  },
  {
    knowledgeAreas: [4, 12],
    name: "Web Performance Fundamentals",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-perf-v2/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "Professional CSS: Build a Website from Scratch",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/pro-css/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "Full Stack for Front-End Engineers",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/fullstack-v3/",
  },
  {
    knowledgeAreas: [4],
    name: "TypeScript 5+ Fundamentals",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/typescript-v4/",
  },
  {
    knowledgeAreas: [5],
    name: "Testing Fundamentals",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/testing/",
  },
  {
    knowledgeAreas: [4],
    name: "Functional JavaScript First Steps",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/functional-first-steps-v2/",
  },
  {
    knowledgeAreas: [4],
    name: "Advanced Web Development Quiz",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-dev-quiz/",
  },
  {
    knowledgeAreas: [4],
    name: "The Hard Parts of Asynchronous JavaScript",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/javascript-new-hard-parts/",
  },
  {
    knowledgeAreas: [5, 12],
    name: "Enterprise UI Development: Testing & Code Quality",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/enterprise-ui-dev/",
  },
  {
    knowledgeAreas: [4, 12],
    name: "JavaScript Performance",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-performance/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "The Hard Parts of UI Development",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/hard-parts-ui-dev/",
  },
  {
    knowledgeAreas: [2, 3],
    name: "Front-End System Design",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/frontend-system-design/",
  },
  {
    knowledgeAreas: [4],
    name: "Functional-Light JavaScript",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/functional-javascript-v3/",
  },
  {
    knowledgeAreas: [3, 4],
    name: "State Machines in JavaScript with XState",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/xstate-v2/",
  },
  {
    knowledgeAreas: [8],
    name: "Everything You'll Need to Know About Git",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/everything-git/",
  },
  {
    knowledgeAreas: [13],
    name: "Web Security",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-security-v2/",
  },
  {
    knowledgeAreas: [14],
    name: "My Dev Setup Is Better Than Yours",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/developer-productivity-v2/",
  },
  {
    knowledgeAreas: [4],
    // eslint-disable-next-line no-script-url,sonar/code-eval
    name: "JavaScript: The Recent Parts",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/js-recent-parts/",
  },
  {
    knowledgeAreas: [4],
    name: "A Tour of Web Capabilities",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/device-web-apis/",
  },
  {
    knowledgeAreas: [4, 3],
    name: "Web Components",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-components/",
  },
  {
    knowledgeAreas: [13, 4],
    name: "Web Authentication APIs",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-auth-apis/",
  },
  {
    knowledgeAreas: [4, 16],
    name: "Web Storage APIs",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/web-storage-apis/",
  },
  {
    knowledgeAreas: [4, 2],
    name: "PWAs: You Might Not Need That App Store",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/pwas-v2/",
  },
  {
    knowledgeAreas: [4, 6],
    name: "Exploring Service Workers",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/service-workers/",
  },
  {
    knowledgeAreas: [4],
    name: "Vanilla JavaScript Projects",
    platform: frontendMasters,
    url: "https://frontendmasters.com/courses/javascript-projects/",
  },
  {
    knowledgeAreas: [1, 15],
    name: "Business Benefits Realization Foundations",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/business-benefits-realization-foundations",
  },
  {
    knowledgeAreas: [1, 11],
    name: "Business Analysis Foundations: Business Process Modeling",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/business-analysis-foundations-business-process-modeling",
  },
  {
    knowledgeAreas: [9, 6],
    name: "Modern Project Management in Microsoft 365",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/modern-project-management-in-microsoft-365-24522936",
  },
  {
    knowledgeAreas: [1],
    name: "Managing Data with Microsoft 365",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/managing-data-with-microsoft-365",
  },
  {
    knowledgeAreas: [1, 11],
    name: "Business Analysis: Essential Tools and Techniques",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/business-analysis-essential-tools-and-techniques-27995561",
  },
  {
    knowledgeAreas: [1],
    name: "Introduction to Business Analysis",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/introduction-to-business-analysis",
  },
  {
    knowledgeAreas: [1],
    name: "Generative AI for Business Analysts",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/generative-ai-for-business-analysts",
  },
  {
    knowledgeAreas: [1],
    name: "Agentic AI for Business Analysis",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/agentic-ai-for-business-analysis",
  },
  {
    knowledgeAreas: [1],
    name: "The Role of Business Analysis in Data Analytics",
    platform: linkedInLearning,
    url: "https://www.linkedin.com/learning/the-role-of-business-analysis-in-data-analytics",
  },
  {
    knowledgeAreas: [],
    name: "Associate Software Developer",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/associate-software-developer-certification",
  },
  {
    knowledgeAreas: [],
    name: "Professional Software Developer",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/professional-software-developer-certification",
  },
  {
    knowledgeAreas: [],
    name: "Professional Software Engineering Master",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/professional-software-engineering-master-certification",
  },
];

export const knowledgeArea = {
  1: "Requirements",
  10: "Engineering Process",
  11: "Engineering Models and Methods",
  12: "Quality",
  13: "Security",
  14: "Engineering Professional Practice",
  15: "Engineering Economics",
  16: "Computing Foundations",
  17: "Mathematical Foundations",
  18: "Engineering Foundations",
  2: "Architecture",
  3: "Design",
  4: "Construction",
  5: "Testing",
  6: "Engineering Operations",
  7: "Maintenance",
  8: "Configuration Management",
  9: "Engineering Management",
} as const;

export const knowledgeAreasKeys: (keyof typeof knowledgeArea)[] = [
  4, 5, 3, 16, 17, 18, 1, 2, 8, 6, 7, 12, 13, 11, 10, 9, 15, 14,
];

const courseStoreInitialState = {
  selectedKnowledgeArea: null as keyof typeof knowledgeArea | null,
};

class CourseStore extends BaseStore<typeof courseStoreInitialState> {
  public courseData = courseData;

  public constructor() {
    super(courseStoreInitialState);
  }

  public getCourseIndex(name: string) {
    return findIndex(this.courseData, { name });
  }

  public getKnowledgeAreaCount(area: keyof typeof knowledgeArea) {
    let count = 0;

    forEach(this.courseData, (course) => {
      forEach(course.knowledgeAreas, (_area) => {
        if (_area === area) {
          count += 1;
        }
      });
    });

    return count;
  }

  public setSelectedKnowledgeArea(value: keyof typeof knowledgeArea | null) {
    this.update((draft) => {
      draft.selectedKnowledgeArea = value;
    });
  }

  protected override onFirstSubscriber() {
    globalThis.addEventListener(
      "resize",
      () => {
        if (640 > globalThis.innerWidth) {
          this.update((draft) => {
            draft.selectedKnowledgeArea = null;
          });
        }
      },
      { signal: this.cleanupSignal },
    );
  }
}

export const courseStore = new CourseStore();
