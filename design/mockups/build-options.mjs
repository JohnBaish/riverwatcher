// Puts mock-data.json into options.src.html. Writes options.html (a complete page, for the
// repo and for checking in a browser) and, in the scratch folder given, the same page
// without its <html>/<head> wrapper, for publishing as a private page (which adds its own).
import { readFileSync, writeFileSync } from 'node:fs'
const here = (f) => new URL(f, import.meta.url)
const data = readFileSync(here('./mock-data.json'), 'utf8').replace(/</g, '\\u003c')
const page = readFileSync(here('./options.src.html'), 'utf8').replace('/*MOCK*/null', data)
writeFileSync(here('./options.html'), `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${page}\n</body>\n</html>\n`)
if (process.argv[2]) writeFileSync(`${process.argv[2]}/riverwatcher-options.html`, page)
console.log('written')
