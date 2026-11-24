import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Git Graph draws the branching diagram you see in tools that visualise a repository's history: a main line running straight through, feature branches splitting off in their own colours, commits as dots along each line, and curves where work is merged back. For developers it is a familiar picture of how a project actually moves forward, in parallel and in fits and starts.",
    "Beyond the nostalgia, it makes a good wallpaper because the structure is clean: a few coloured lanes, smooth S-curves between them and small monospaced labels. It reads as abstract line art from a distance and as a git log up close.",
  ],
  howItWorks: [
    "On this page the history is simulated. Lane 0 is the main branch and never ends. The code then steps through the commits one at a time. At each step there is roughly a one in five chance that a new branch splits off from a random active lane into the lowest free lane number, as long as Max branches allows it. There is a slightly smaller chance that a side branch merges into another lane and closes; the merge commit is drawn as a hollow ring. Otherwise a normal commit, a solid dot, lands on one of the active lanes.",
    "Time runs along the long side of the screen and lanes stack across the short side, unless you set the direction yourself. The lanes are spaced to fit the number of branches actually used, not the maximum, and connections between lanes are drawn as smooth cubic curves. Lane colours cycle through the four Branch colours, so lane 5 reuses Branch 1.",
    "With Hashes + messages on, each commit gets a random seven character hex hash. In the vertical layout every commit is labelled in a column to the right: the hash in its lane's colour, followed by a message from a short built-in list written in conventional commit style, like 'feat: add dark mode' or 'fix: race in cache'. In the horizontal layout there is less room, so every second commit gets just its hash, set at an angle below the graph.",
  ],
  settings: [
    { name: "Max branches", text: "From 2 to 10. Low values give a tidy trunk with occasional side branches; high values let many branches run in parallel, like a busy team." },
    { name: "Commits", text: "From 12 to 90. More commits make the graph longer and denser; fewer give spacious, readable labels." },
    { name: "Direction", text: "Auto (along the long side) chooses for you. Left → right and Top → bottom force an orientation. Messages in the simulated graph only appear in the vertical layout, whether you pick it or Auto picks it on a tall screen." },
  ],
  bestFor: [
    "On a phone, Auto runs the graph top to bottom down the left with messages beside it, which reads like a commit log in a terminal. On a desktop, the graph runs left to right through the middle with the quote in the top right. GitHub dark and Paper log echo the familiar dark and light code-hosting colours, Dracula uses that theme's purples and pinks, Dense monorepo fills ten lanes and 80 commits with no labels or text, and Minimal trunk is a greyscale three-lane version with 'Keep main green.' as its quote.",
    "For OLED, the True black (OLED) toggle makes the background pure black. The coloured lanes and dots stand out well against it.",
  ],
  faq: [
    { q: "Are these real commits?", a: "Not on this page; the history, hashes and messages are generated from the seed. Visit /u/ followed by your GitHub username and the Commit history look is built from your recent public commits, with each repository as its own lane and its name labelled." },
    { q: "Why don't I see commit messages?", a: "Messages only appear in the vertical layout, where there is room for a full line beside each commit. In horizontal mode the simulated graph shows short hashes only." },
    { q: "Why do two branches share a colour?", a: "There are four branch colours and up to ten lanes, so colours repeat in order once you pass four lanes." },
  ],
};

export default guide;
