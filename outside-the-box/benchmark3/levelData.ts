export const LEVEL_COUNT = 30;

export interface LevelEntry {
  title: string;
  lines: string[];
  skippable?: boolean;   // defaults to true if omitted
}

export const LEVEL_DATA: LevelEntry[] = [
  { title: "Q1",  lines: ["Hello, candidate. Please enter your name below."] },
  { title: "Q2",  lines: ["Accept the terms to proceed.", "Read carefully. Every word matters."] },
  { title: "Q3",  lines: ["Click the dot"] },
  { title: "Q4",  lines: ["CLICK IT! CLICK IT!! CLICK IT... WHAT ARE YOU WAITING FOR?! CLICK IT CLICK IT CLICK IT!!! GO GO GO!! CLICK. IT. NOW!!!"] },
  { title: "Q5",  lines: ["I don't know if THAT button wants to be clicked"] },
  { title: "Q6",  lines: ["A brief intermission, candidate.", "Defeat Frodrick Rederer to proceed."] },
  { title: "Q7",  lines: ["I think we are counting something here?"] },
  { title: "Q8",  lines: ["An unregistered individual has approached you during the examination.", "This interaction is not part of the official assessment."], skippable: false },
  { title: "Q9",  lines: ["Focus, candidate. Show all work.", "Select the correct answer from the options above."] },
  { title: "Q10", lines: ["Navigate to the exit.", "The path is yours to find."] },
  { title: "Q11", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q12", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q13", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q14", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q15", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q16", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q17", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q18", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q19", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q20", lines: ["Use W, A, S, and D to move the player.", "The sprite changes direction with each move."] },
  { title: "Q21", lines: ["He is back.", "Frodrick seems to have trained a lot...", "maybe this time you need to cheat on the exam for once???"] },
  { title: "Q22", lines: ["did you catch that??"] },
  { title: "Q23", lines: ["Corporate wanted a question that assessed your logic in math form.", "I hope you remember how to fill out a truth table..."] },
  { title: "Q24", lines: ["This should be an easy one..."] },
  { title: "Q25", lines: ["Some walls are only visible under the right conditions.", "Toggle your perspective to navigate."] },
  { title: "Q26", lines: ["Development in progress."] },
  { title: "Q27", lines: ["Development in progress."] },
  { title: "Q28", lines: ["Development in progress."] },
  { title: "Q29", lines: ["Development in progress."] },
  { title: "Q30", lines: ["One final question before I hand you your results.", "Think carefully — you have answered this before."] },
];
