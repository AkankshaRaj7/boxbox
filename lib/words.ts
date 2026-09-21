/**
 * Wording helpers shared by the generated prose — the Briefing and the race
 * verdict. Kept together so the two read as one voice.
 */

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/**
 * Small counts read better as words; points, gaps and times stay as numerals.
 * The cut-off is ten, so a sentence never mixes "18 drivers" with "eighteen".
 */
export function count(n: number): string {
  return WORDS[n] ?? String(n);
}

/** For a count that opens a sentence. */
export function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const ORDINALS = [
  "", "first", "second", "third", "fourth", "fifth", "sixth",
  "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth",
];

/** "third", falling back to "P13" past the point where words help. */
export function ordinal(n: number): string {
  return ORDINALS[n] ?? `P${n}`;
}

/**
 * The name to call a driver by. F1 uses surnames, and every surname on the
 * current grid is the last word of the full name.
 */
export function surname(fullName: string): string {
  return fullName.trim().split(/\s+/).at(-1) ?? fullName;
}

/** A plural that reads naturally: "a place" / "three places". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? `a ${one}` : `${count(n)} ${many}`;
}

/**
 * A finishing or grid position: "1st", "19th". Used wherever two positions sit
 * in one sentence, so "from 19th to 1st" never reads "from P19 to first".
 */
export function position(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) {
    return `${n}th`;
  }
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}
