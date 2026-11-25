import type { GeneratorGuide } from "./types";

const guide: GeneratorGuide = {
  intro: [
    "Contribution Grid turns the familiar developer activity chart into a wallpaper: one column per week, one row per day, a year of squares shaded from empty to busy. Anyone who has spent time on GitHub knows the pattern, with quiet weekends, busy stretches before a launch and the odd gap for a holiday.",
    "On this page the year is invented, but it does not have to be. Visit /u/ followed by your GitHub username and the same generator is fed your real public contribution history, with the month names lined up to the actual dates.",
  ],
  howItWorks: [
    "When there is no real data, the code makes up a believable year of 53 weeks. A mood value drifts up and down from week to week, so busy and quiet spells last a while. About one week in twenty is a holiday with nothing in it, weekends get under half the weekday activity, and now and then a single day spikes to the top level. Each day ends up at one of five levels, from 0 for nothing to 4 for the busiest.",
    "Empty days are drawn in the background colour nudged slightly toward the label colour, so the grid's shape is visible even when nothing happened. The four active levels mix the background toward the Busiest days colour at roughly 30, 52, 76 and 100 percent. With the year blend switched on, the target colour itself slides from Busiest days in the first week to Gradient to in the last.",
    "Layout is worked out to make the cells as large as possible. On a wide screen the year runs as one long strip. On a tall screen the Auto layout tries splitting the year into up to six stacked bands and keeps whichever arrangement gives the biggest cells. The Skyline style draws each day as an isometric bar, height set by its level, with the side faces darkened to give a simple 3D look.",
  ],
  settings: [
    { name: "Style", text: "Squares is the classic chart. Dots (sized by activity) draws circles that grow with the level, so busy days read by size as well as colour. Skyline (3D bars) turns the year into a little city of bars." },
    { name: "Layout", text: "Auto (strip on desktop, stacked on phone) picks for you. One strip forces a single row of weeks; Stacked bands forces the year to wrap." },
    { name: "Size and Gap", text: "Size is how much of the screen width the grid may use. Gap is the space between cells; zero makes a solid mosaic." },
    { name: "Corner radius", text: "Rounds the squares, from sharp at 0 to fully round at 1." },
    { name: "Skyline height", text: "How tall each level's bar is in Skyline style. It has no effect on Squares or Dots." },
    { name: "Months, weekdays + legend", text: "Shows Mon, Wed and Fri labels and a Less to More legend. Month names only appear when a real start date is known, which is the case on your /u page. Labels are not drawn in Skyline style." },
  ],
  bestFor: [
    "On a desktop monitor, One strip or Auto shows the whole year in a single wide band, just like the original chart. On a phone, Auto stacks the year into bands so each cell stays big enough to see. GitHub dark and GitHub light match the site's own colours. Neon skyline is the most dramatic, pink to cyan 3D bars on deep purple. Ocean dots uses the dot style in teal, Pumpkin blends amber to orange, and Paper uses sharp black squares on cream with a serif quote.",
    "The True black (OLED) toggle sets the Background to pure black.",
  ],
  faq: [
    { q: "Is this my real GitHub activity?", a: "Not on this page; here the year is randomly generated from the seed. Go to /u/your-username to see a version built from your real public contributions." },
    { q: "Does it use private repositories?", a: "No. The personal page only uses public GitHub activity." },
    { q: "Why are there no month names?", a: "Month labels need a real start date to line up with. Synthetic years have none, so only the weekday labels and legend are shown. On your /u page the months appear." },
  ],
};

export default guide;
