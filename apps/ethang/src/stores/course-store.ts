import { BaseStore } from "@ethang/store";
import forEach from "lodash/forEach";
import keys from "lodash/keys";
import map from "lodash/map";

type CourseData = {
  author: string;
  description: string;
  knowledgeAreas: (keyof typeof knowledgeArea)[];
  name: string;
  platform: string;
  url: string;
};

const coltSteele = "Colt Steele";
const patternsDevelopment = "Patterns.dev";
const typeLevelTypeScript = "Type-Level TypeScript";
const frontendMasters = "Frontend Masters";

const courseData: CourseData[] = [
  {
    author: coltSteele,
    description:
      "Covers Flexbox, CSS Grid, Animations, Responsive Design and More! Tons of Exercises & Projects.",
    knowledgeAreas: [4, 16],
    name: "The HTML & CSS Bootcamp",
    platform: "Udemy",
    url: "https://www.udemy.com/course/html-and-css-bootcamp/",
  },
  {
    author: coltSteele,
    description:
      "Become a Developer With ONE course - HTML, CSS, JavaScript, React, Node, MongoDB and More!",
    knowledgeAreas: [4, 16],
    name: "The Web Developer Bootcamp",
    platform: "Udemy",
    url: "https://www.udemy.com/course/the-web-developer-bootcamp/",
  },
  {
    author: coltSteele,
    description:
      "Master the essentials and the tricky bits: rebasing, squashing, stashing, reflogs, blobs, trees, & more!",
    knowledgeAreas: [8],
    name: "The Git & GitHub Bootcamp",
    platform: "Udemy",
    url: "https://www.udemy.com/course/git-and-github-bootcamp/",
  },
  {
    author: coltSteele,
    description:
      "Level Up Your Skills And Take Control Of Your Machine, w/ Dozens of Commands, Projects, and Challenges!",
    knowledgeAreas: [16],
    name: "The Linux Command Line Bootcamp",
    platform: "Udemy",
    url: "https://www.udemy.com/course/the-linux-command-line-bootcamp/",
  },
  {
    author: coltSteele,
    description:
      "Level Up Your JS. Covers latest syntax, design patterns, functional programming, browser APIS, OOP, Canvas, and more!",
    knowledgeAreas: [4, 11, 16],
    name: "JavaScript Pro: Mastering Advanced Concepts and Techniques",
    platform: "Udemy",
    url: "https://www.udemy.com/course/pro-javascript/",
  },
  {
    author: coltSteele,
    description:
      "Learn the world's fastest growing programming language from scratch. Includes Webpack & React!",
    knowledgeAreas: [4, 16],
    name: "Mastering TypeScript",
    platform: "Udemy",
    url: "https://www.udemy.com/course/learn-typescript/",
  },
  {
    author: "Academind",
    description:
      "A guided path on your way to become a frontend web developer. All technologies you need to understand to build amazing and interactive websites. Basic HTML knowledge is required to follow along this path.",
    knowledgeAreas: [4, 16],
    name: "Frontend Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/frontend-web-development",
  },
  {
    author: "Academind",
    description:
      "Learn how to write the server-side code behind the scenes of a modern website. From learning all about Node.js, the most popular, JavaScript based server-side programming language, up to learning how to interact with and use different databases, all covered in this path.",
    knowledgeAreas: [4, 16],
    name: "Backend Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/backend-web-development",
  },
  {
    author: "Academind",
    description:
      "Understand THE most popular JavaScript library. Learn how to build modern single-page-applications with components in React.js and use this knowledge to dive into frameworks like Next.js. In addition, you'll also learn how to use React to build mobile apps with React Native or Ionic + React.",
    knowledgeAreas: [4, 11],
    name: "React Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/react-a-z",
  },
  {
    author: "Academind",
    description:
      "Angular is Google's leading, Typescript-based framework allowing you create complex, customizable, modern, responsive and user friendly web applications. After setting the basics with JavaScript and Typescript, you will explore Angular in great detail and understand how to use Angular in fullstack applications. In addition to desktop applications, using Angular to build mobile apps will also be taught in this path.",
    knowledgeAreas: [4, 11],
    name: "Angular Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/angular-a-z",
  },
  {
    author: "Academind",
    description:
      "DevOps or Development Operations make our developer lives easier by automating development related processes. Managing code efficiently via Git and GitHub and simplifying the development and deployment process with Docker & Kubernetes are two of the most important tools in this area. Both will be taught in great detail in this path.",
    knowledgeAreas: [6, 8, 10],
    name: "DevOps Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/devops-essentials",
  },
  {
    author: "Academind",
    description:
      "You mastered the basics and want to dive deeper into programming and web development? This path teaches how to write clean and understandable code and dives very deep into more advanced JavaScript topics like data structures or algorithms.",
    knowledgeAreas: [4, 11, 16],
    name: "Advanced Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/advanced-concepts",
  },
  {
    author: "Academind",
    description:
      "Python is the most popular programming language. This path teaches all you need to know to work with Python in your own projects. Although Python is not a web development focused programming language, in this path you will also learn how to create modern websites with Python with the help of the Django framework.",
    knowledgeAreas: [4, 16],
    name: "Python Path",
    platform: "Academind",
    url: "https://academind.com/courses/paths/python",
  },
  {
    author: "UI.dev",
    description:
      "React Query has been one of the fastest growing and most popular third party libraries in the React ecosystem, and this course will teach you everything you need to ship it like a pro.",
    knowledgeAreas: [4],
    name: "Query.gg",
    platform: "UI.dev",
    url: "https://query.gg/",
  },
  {
    author: "Josh W Comeau",
    description:
      "The interactive learning experience designed to help JavaScript developers become confident with CSS.",
    knowledgeAreas: [4, 16],
    name: "CSS for JavaScript Developers",
    platform: "Josh W Comeau",
    url: "https://css-for-js.dev/",
  },
  {
    author: patternsDevelopment,
    description:
      "Patterns.dev is a free online resource on design, rendering, and performance patterns for building powerful web apps with vanilla JavaScript or modern frameworks.",
    knowledgeAreas: [2, 3, 11],
    name: patternsDevelopment,
    platform: patternsDevelopment,
    url: "https://www.patterns.dev/#patterns",
  },
  {
    author: typeLevelTypeScript,
    description:
      "Learn how to unleash the full potential of the Turing Complete type system of TypeScript!",
    knowledgeAreas: [4, 17],
    name: typeLevelTypeScript,
    platform: typeLevelTypeScript,
    url: "https://type-level-typescript.com/",
  },
  {
    author: frontendMasters,
    description:
      "Get an introduction to web development, JavaScript, and modern CSS layout techniques to have the skills to be a professional web developer today.",
    knowledgeAreas: [4, 16],
    name: "Beginner Path",
    platform: frontendMasters,
    url: "https://frontendmasters.com/learn/beginner/",
  },
  {
    author: frontendMasters,
    description:
      "Deep dive into JavaScript, the most popular framework React, Web performance, CSS, deploying websites, TypeScript, and functional JavaScript to become a professional web developer today.",
    knowledgeAreas: [4, 11, 12, 16],
    name: "Professional Path",
    platform: frontendMasters,
    url: "https://frontendmasters.com/learn/professional/",
  },
  {
    author: frontendMasters,
    description:
      "Learn mind-expanding web development techniques and emerging APIs to solve even the most complex challenges top-level engineers face.",
    knowledgeAreas: [4, 11],
    name: "Expert Path",
    platform: frontendMasters,
    url: "https://frontendmasters.com/learn/advanced/",
  },
  {
    author: frontendMasters,
    description:
      "Code your way from the fundamentals to advanced, reactive applications, and discover how far you can go with JavaScript!",
    knowledgeAreas: [4, 16],
    name: "JavaScript Path",
    platform: frontendMasters,
    url: "https://frontendmasters.com/learn/javascript/",
  },
  {
    author: frontendMasters,
    description:
      "Explore new JavaScript APIs and the advanced capabilities in modern web browsers like device/sensor integration, client-side data storage, user authentication, and Service Worker use cases",
    knowledgeAreas: [4, 16],
    name: "Browser APIs Path",
    platform: frontendMasters,
    url: "https://frontendmasters.com/learn/browser-apis/",
  },
  {
    author: "IEEE",
    description:
      "This certification recognizes candidates who have acquired the basic knowledge and understanding required for developing software products. It requires a coherent, demonstrable understanding of the principles and processes in software requirements, software design, software construction, and software testing.",
    knowledgeAreas: [1, 3, 4, 5],
    name: "Associate Software Developer",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/associate-software-developer-certification",
  },
  {
    author: "IEEE",
    description:
      "This professional competency certification requires successful completion of Certificates of Proficiency in four key knowledge areas.",
    knowledgeAreas: [1, 3, 4, 5],
    name: "Professional Software Developer",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/professional-software-developer-certification",
  },
  {
    author: "IEEE",
    description:
      "This professional competency certification requires successful completion of Certificates of Proficiency in the eleven key knowledge areas.",
    knowledgeAreas: [1, 3, 4, 5, 7, 8, 12, 10, 11, 9, 15],
    name: "Professional Software Engineering Master",
    platform: "IEEE",
    url: "https://www.computer.org/product/education/professional-software-engineering-master-certification",
  },
];

export const knowledgeArea = {
  1: "Software Requirements",
  10: "Software Engineering Process",
  11: "Software Engineering Models and Methods",
  12: "Software Quality",
  13: "Software Security",
  14: "Software Engineering Professional Practice",
  15: "Software Engineering Economics",
  16: "Computing Foundations",
  17: "Mathematical Foundations",
  18: "Engineering Foundations",
  2: "Software Architecture",
  3: "Software Design",
  4: "Software Construction",
  5: "Software Testing",
  6: "Software Engineering Operations",
  7: "Software Maintenance",
  8: "Software Configuration Management",
  9: "Software Engineering Management",
} as const;

// @ts-expect-error restrict type
export const knowledgeAreasKeys: (keyof typeof knowledgeArea)[] = map(
  keys(
    knowledgeArea,
    // eslint-disable-next-line unicorn/no-array-sort
  ).sort((a, b) => {
    return Number(a) - Number(b);
  }),
  Number,
);

const courseStoreInitialState = {
  selectedKnowledgeArea: null as keyof typeof knowledgeArea | null,
};

class CourseStore extends BaseStore<typeof courseStoreInitialState> {
  public courseData = courseData;

  public constructor() {
    super(courseStoreInitialState);
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
}

export const courseStore = new CourseStore();
