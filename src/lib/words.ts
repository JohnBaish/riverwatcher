// Numbers in running text: one to nine as words, 10 and above as digits (John's rule).
// Times, names, labels and short count tags keep their digits; see HOUSE-STYLE.md.

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

/** 2 → "two", 12 → "12", 1751 → "1,751". */
export const numberWord = (n: number): string => (Number.isInteger(n) && n >= 0 && n <= 9 ? NUMBERS[n] : n.toLocaleString('en-GB'))

/** "one hour", "three hours", "12 hours": a count of something, inside a sentence.
 *  One is plain "one hour", not "the only hour", which would read as if it were the
 *  single one that exists. */
export const countOf = (n: number, singular: string, plural = `${singular}s`): string =>
  `${numberWord(n)} ${n === 1 ? singular : plural}`
