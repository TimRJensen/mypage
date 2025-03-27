interface InfoPanelData {
    [key: number]: {txt: string; rating: number};
}

export default {
    0x20: {
        txt: "Critical thinking",
        rating: 5,
    },
    0x21: {
        txt: "Communication.",
        rating: 3,
    },
    0x22: {
        txt: "Problem solving",
        rating: 4,
    },
    0x23: {
        txt: "Creativity",
        rating: 3,
    },
    0x24: {
        txt: "Planning",
        rating: 4,
    },
    0x30: {
        txt: "<b>mypage</b>\n\nThis page. Nothing fancy, it just uses standard web APIs so that it can run in any browser. \n\n<a href='' target='_blank'>page</a><a href='https://github.com/TimRJensen/mypage' target='_blank'>source</a>",
        rating: -1,
    },
    0x31: {
        txt: "<b>Aruco generator</b>\n\nA very simple app, that can generate aruco codes. The codes are mainly used in robotics.\n\n<a href='https://aruco-generator.sliplane.app/' target='_blank'>page</a><a href='https://github.com/TimRJensen/aruco-generator' target='_blank'>source</a>",
        rating: -1,
    },
    0x32: {
        txt: "<b>Breakout & Galage</b>\n\nA cool little project we did at the institute, where we recreated old arcade games.\n\n<a href='https://github.com/TimRJensen/DIKUGames' target='_blank'>source</a>",
        rating: -1,
    },
    0x410: {
        txt: "Every developer knows some Git. I personally know about 12 commands, where the first 4 are stage, commit, pull and push. The last eight are for when I messed up.",
        rating: 3,
    },
    0x411: {
        txt: "Docker is one of the best tools that has been released in the last decade. It makes it so easy to spin up a new environment and share it with others. Most of the projects I work on are containerized.",
        rating: 4,
    },
    0x412: {
        txt: "I found SQL frustrating in the beginning, but once I got the hang of multiple joins and views, the appeal of SQL became quite clear to me.",
        rating: 5,
    },
    0x413: {
        txt: "I remember when it took the better part of a day to get a React project up an running. Thankfully a lot of tools were released to ease the processs and I think that NextJS is the best one out there.",
        rating: 4,
    },
    0x414: {
        txt: "Deno ships with a lot of packages, that I often found myself installing in NodeJS. Because of this, I quickly adopted Deno as my go-to environment to get a project up and running quickly.",
        rating: 5,
    },
    0x415: {
        txt: "I did not really enjoy working with NodeJS, but that was before they got the async flavour of their API. I've mostly used it to spin up an Express server and small CLI scripts.",
        rating: 3,
    },
    0x420: {
        txt: "I love the idea of taking critical logic and writing it in an all purpose language. I've worked with WebAssembly in Go and that was overall a good experience.", 
        rating: 4,
    },
    0x421: {
        txt: "I know the CSS baseline and I do try to keep up with the latest features. I worked with preprocessors like SASS and LESS, but I prefer CSS-in-JS.",
        rating: 5,
    },
    0x422: {
        txt: "! + ⏎\n\nAll kidding aside, I'm quite familiar with HTML, including semantic elements and specialized input elements.",
        rating: 4,
    },
    0x423: {
        txt: "The few small projects I've done with Vue has been satisfying. I like the simplicity of the framework and that it doesn't include all the frustration found in other directive driven frameworks.",
        rating: 2,
    },
    0x424: {
        txt: "I like React for its unopinionated minimal API. I've been using it extensively, and when they switched from class components to functional components, I was hooked.",
        rating: 5,
    },
    0x425: {
        txt: "Typescript provides some type safety, which is fine, but more importantly, it provides a lot of context right in the editor. I can't always remember the idea behind what I wrote some months ago, so this can be a big help.",
        rating: 5,
    },
    0x426: {
        txt: "I worked with libraries such as jQuery, Loadash, Underscore.js, Knockout, Bootstrap and many more. I'm also confident with modern API, like observers, webcomponents, etc.",
        rating: 5
    },
    0x430: {
        txt: "Go is without a contest my favorite language. It may be a bit verbose, but you end up with programs that are stable, and easy to maintain. Not to mention concurrency is so easy to work with.",
        rating: 5,
    },
    0x431: {
        txt: "I've worked with most of the popular libraries, such as Pandas, Numpy, Matplotlib, Scikit-learn, however they are so vast, I know at best half of what they can do.",
        rating: 2,
    },
    0x432: {
        txt: "It's a shame that F# isn't more widely used, because the typesystem is outstanding. Unions are so useful and working with them is a breeze.",
        rating: 3,
    },
    0x433: {
        txt: "I'm not a huge fan of strictly OOP languages, but C# does a lot of things right. I really like how properties are defined and LINQ is a very powerful feature.",
        rating: 3,
    },
    0x434: {
        txt: "C used to be my favorite language. The freedom it provides is unmatched and the few structures of the language, really gives you a fundamental understanding of how code works. It also made me appreciate a garbage collector.",
        rating: 4,
    },
} as InfoPanelData;
