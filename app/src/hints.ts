interface InfoPanelData {
    [key: number]: { txt: string; rating: number };
}

export default {
    // Technical skills
    0x200: {
        txt: "<b>Vue.js</b><br/><br/>I like the simplicity of Vue and that it doesn't include all the frustration found in other directive driven frameworks. However, I've only made very simple projects with it.",
        rating: 3,
    },
    0x201: {
        txt: "<b>React</b><br/><br/>I've been using react extensively and I really like it for its unopinionated minimal API and emphasis on composition.",
        rating: 5,
    },
    0x202: {
        txt: "<b>HTML</b><br/><br/>! + ⏎<br/><br/>All kidding aside, I'm quite familiar with HTML, including semantic elements and specialized input elements.",
        rating: 4,
    },
    0x203: {
        txt: '<b>TypeScript</b><br/><br/>Type-safety is fine, but more importantly, with a quick glance, it provides a lot of context right in your editor, which often is invaluable.',
        rating: 5,
    },
    0x204: {
        txt: '<b>CSS</b><br/><br/>I know the CSS baseline and I try to keep up with the latest features. I worked with preprocessors like SASS and LESS, but I prefer CSS-in-JS.',
        rating: 4,
    },
    0x205: {
        txt: "<b>JavaScript</b><br/><br/>I'm quite confident with JavaScript and I've worked with libraries such as jQuery, Loadash, Underscore, Knockout, Bootstrap and many more.",
        rating: 5,
    },
    0x206: {
        txt: '<b>WebAssembly</b><br/><br/>I made some simple tools and most of them were written in Go.',
        rating: 4,
    },
    0x210: {
        txt: '<b>Git</b><br/><br/>I know about 12 Git commands, where the first 4 are stage, commit, pull and push. The last eight are for when I messed up.',
        rating: 4,
    },
    0x211: {
        txt: '<b>Docker</b><br/><br/>I love docker. It makes it so easy to spin up a new environment and share it with others. Most of the projects I work on are containerized.',
        rating: 5,
    },
    0x212: {
        txt: "<b>PostgreSQL</b><br/><br/>The databases I've worked with are mostly ones I created, so I'm quite familiar with schemas, views and how to query data.",
        rating: 5,
    },
    0x213: {
        txt: "<b>Next.js</b><br/><br/>I've used Next.js a couple of times and it's certainly a good framework. I however find it a bit opinionated and prefer to use a custom setup.",
        rating: 3,
    },
    0x214: {
        txt: '<b>Deno</b><br/><br/>Packages that I often found myself installing in Node.js are shipped with Deno by default. Because of that, I quickly adopted Deno as my go-to environment.',
        rating: 5,
    },
    0x215: {
        txt: "<b>Node.js</b><br/><br/>I've mostly used Node.js to spin up an Express server, but I've also made some CLI scripts to automate simple tasks.",
        rating: 3,
    },
    0x220: {
        txt: '<b>Go</b><br/><br/>This is without a contest my favorite language. It may be a bit verbose, but you end up with programs that are stable, and easy to maintain. Not to mention that concurrency in Go is awesome.',
        rating: 5,
    },
    0x221: {
        txt: "<b>Python</b><br/><br/>I've worked with most of the popular libraries, like Pandas, Numpy, Matplotlib, Scikit-learn, etc., however they are so vast that I know at best half of what they do.",
        rating: 3,
    },
    0x222: {
        txt: "<b>F#</b><br/><br/>It's a shame that F# isn't more widely used, because the typesystem is outstanding. Unions with match statements are such a versatile feature.",
        rating: 3,
    },
    0x223: {
        txt: "<b>C#</b><br/><br/>I'm not a huge fan of strictly OOP languages, but C# does a lot of things right, so I actually don't mind that I can't define an isolated function.",
        rating: 4,
    },
    0x224: {
        txt: '<b>C</b><br/><br/>The freedom C provides is unmatched and the few structures of the language, really gives you a fundamental understanding of how code works. It also made me appreciate a garbage collector.',
        rating: 4,
    },
    // Projects
    0x300: {
        txt: "<b>mypage</b><br/><br/>This page. Nothing fancy, it just uses standard web APIs so that it can run in any browser.<br/><br/><a href='#canvas' target='_self'>page</a><a href='https://github.com/TimRJensen/mypage' target='_blank'>source</a>",
        rating: -1,
    },
    0x301: {
        txt: "<b>Aruco generator</b><br/><br/>A very simple app, that can generate aruco codes. The codes are mainly used in robotics.<br/><br/><a href='https://aruco-generator.sliplane.app/' target='_blank'>page</a><a href='https://github.com/TimRJensen/aruco-generator' target='_blank'>source</a>",
        rating: -1,
    },
    0x302: {
        txt: "<b>Breakout & Galage</b><br/><br/>A cool little project we did at the institute, where we recreated old arcade games.<br/><br/><a href='https://github.com/TimRJensen/DIKUGames' target='_blank'>source</a>",
        rating: -1,
    },
    // Personal skills
    0x400: {
        txt: '<b>Creativity</b>',
        rating: 3,
    },
    0x401: {
        txt: '<b>Planning</b>',
        rating: 4,
    },
    0x402: {
        txt: '<b>Problem solving</b>',
        rating: 4,
    },
    0x403: {
        txt: '<b>Communication</b>',
        rating: 3,
    },
    0x404: {
        txt: '<b>Critical thinking</b>',
        rating: 5,
    },
    0x41: {
        txt: 'I enjoy watching football, olympic weightlifting & strong-man competitions.<br/><br/>Besides sports, I enjoy listening to music. I like all kinds of genres and can sit for hours just listening.<br/><br/>I also sometimes like to read, but mostly the classics or fantasy novels.',
        rating: -1,
    },
    // Help
    0x500: {
        txt: '<b>Hello World!</b><br/><br/>Infoboxes may contain ratings of my experience with a skill.',
        rating: 3,
    },
} as InfoPanelData;
