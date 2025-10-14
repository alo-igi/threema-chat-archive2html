#!/usr/bin/node
'use strict'

//================================================================================
const author = 'Alois Ignaz Krähenmann, a.i@kraehenmann.org'
//--------------------------------------------------------------------------------
const sourceDate = '2025-10-13T09:01:35.070Z'
const sourceVersion = 'v0.9.0'

//================================================================================
// Compile with "pkg":
// pkg threema_chat2html.js --options max_old_space_size=8192
// Don't use "nexe", the generated code is not stable!!!
//================================================================================
// This program is useful in case you ever archived a Threema chat.
//================================================================================
// Threema stores archived chats as password protected zip archives.
// If you unzip the archive into a clean folder, you get a number of files:
// 1) The written text is stored in the pure text file "messages.txt".
// 2) All media files are present as uploaded, however, the original filename is lost.
//--------------------------------------------------------------------------------
// This program converts the pure text file "messages.txt" into an html file,
// including all media files as clickable links.
// "messages.txt" will not be touched.
//--------------------------------------------------------------------------------

const fs = require('fs')
const path = require('path')
const mime = require('mime')

//================================================================================
const CFG_FILE_EXTENSION = '.config'
//--------------------------------------------------------------------------------
// Regular expressions to analyze a Threema messages file:
const REGEX_NEW_CHAT = /^\s*\[(\d{4}\-\d{2}\-\d{2}\,\s*\d{2}\:\d{2})\]\s+([^:]*)\:\s*([\S\s]*)$/
const REGEX_IMG = /^([\S\s]*)(<([^>]*)>)([\S\s]*)$/
const REGEX_BOLD = /\*([^\*]*)\*/
const REGEX_ITALICS = /\_([^_]*)\_/
const REGEX_STRIKETHROUGH = /~([^_]*)~/
//--------------------------------------------------------------------------------
const REGEX_PLATFORM_WINDOWS = /^win/i // "process.platform" string for Windows
//--------------------------------------------------------------------------------
// ANSI codes to select colors for command line output:
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const HIGHLIGHT = '\x1b[31m' // red
const HEADING = '\x1b[1;32m' // green + bold
const BYLINE = '\x1b[35m' // magenta
const FILE = '\x1b[36m' // cyan

//--------------------------------------------------------------------------------
const globals = ((path.basename(process.argv[1], path.extname(process.argv[1])).toLowerCase() == path.basename(process.execPath, path.extname(process.execPath)).toLowerCase()) ? {
		prgExe: true,
		prgDir: path.dirname(process.execPath),
		prgBasename: path.basename(process.execPath),
		prgName: path.basename(process.execPath, path.extname(process.execPath)),
		prgExt: path.extname(process.execPath)
	} : {
		prgExe: false,
		prgDir: path.dirname(process.argv[1]),
		prgBasename: path.basename(process.argv[1]),
		prgName: path.basename(process.argv[1], path.extname(process.argv[1])),
		prgExt: path.extname(process.argv[1]) || `.js`
	})
//--------------------------------------------------------------------------------
// Derive configuration filename from program filename and Threema files folder:
let relevantDirs = [ // use in this sequence:
	process.argv[2] || process.cwd(), // optional command line argument, current dir otherwise
	process.cwd(), // current dir
	globals.prgDir // script dir
].map(d => ensureTrailingSlash(path.resolve(d))) // expand & normalize
relevantDirs = [...new Set(relevantDirs)] // Remove duplicates

//--------------------------------------------------------------------------------
// Default values and prototype; values can be modified via the ".config" JSON file:
let configuration = {
	"messagesFilename": "messages.txt", // default filename Threema uses for the messages text file
	"htmlPrimaryLanguage": "de",
	"htmlTitle": "Threema",
	"htmlBaseStyles": [
		"body{ font-family:Arial,Helvetica,sans-serif; }",
		"img{ width:100%; max-width:500px; }",
		".bold { font-weight: bold; }",
		".italics { font-style: italic; }",
		".strikethrough { text-decoration: line-through; }",
		".prefix { font-style: italic; font-size:x-small; }"
	],
	"htmlSingleMessageStyle": "margin-top: 15px; margin-bottom: 0px; margin-right: 0px; margin-left: 0px;",
	"namedColors": ["FireBrick", "DarkBlue", "Green", "Purple", "Maroon", "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "RebeccaPurple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"] // Web colors used for different senders. Colors are assigned in the order senders appear in the messages text; 1st appearing sender gets color[0]
}

//================================================================================
// Local functions
//--------------------------------------------------------------------------------

//--------------------------------------------------------------------------------
// Wrap a string with ANSI codes for colored output:
function colStr(col, s) {
	return col + s + RESET
}

//--------------------------------------------------------------------------------
// Print help/usage message:
function usage(exitCode = 0) {
	console.log(`\n-------------------------------------------------------------------------------`)
	console.log(colStr(HEADING, `Help and hints:`))
	console.log(`-------------------------------------------------------------------------------`)
	console.log(colStr(HEADING, `What the program does:`))
	console.log(`Converts a Threema chat archive into an HTML file with media links.`)
	console.log(`-------------------------------------------------------------------------------`)
	console.log(colStr(HEADING, `Follow these steps:`))
	console.log(colStr(HIGHLIGHT, `1.`) + ` Archive the chat:`)
	console.log(`   ` + colStr(HIGHLIGHT, `a)`) + ` In Threema, select the chat,`)
	console.log(`   ` + colStr(HIGHLIGHT, `b)`) + ` then choose "Archive chat" from the pop-up menu.`)
	console.log(colStr(HIGHLIGHT, `2.`) + ` Transfer the archive: Copy or move the resulting archive file to your PC.`)
	console.log(colStr(HIGHLIGHT, `3.`) + ` Switch to your PC.`)
	console.log(colStr(HIGHLIGHT, `4.`) + ` Create a new empty folder in any location you prefer.`)
	console.log(colStr(HIGHLIGHT, `5.`) + ` Unpack the archived Threema chat into this empty folder.`)
	console.log(colStr(HIGHLIGHT, `6.`) + ` Run this program. You can either:`)
	console.log(`   ` + colStr(HIGHLIGHT, `a)`) + ` Copy the program to the same folder and double-click it.`)
	console.log(`   ` + colStr(HIGHLIGHT, `b)`) + ` Or run the program from the command line.`)
	console.log(`-------------------------------------------------------------------------------`)
	console.log(colStr(HEADING, `Command line usage:`))
	console.log(`  ` + colStr(FILE, ((/\.js/i.test(globals.prgExt)) ? `node ` : ``) + globals.prgName + `[` + globals.prgExt + `]`) + colStr(HIGHLIGHT, ` [directory_path [messages_filename]]`))
	console.log(`\n` + colStr(HEADING, `Arguments (both optional):`))
	console.log(`  ` + colStr(HIGHLIGHT, `directory_path`) + `     Path to the folder containing the extracted Threema files.`)
	console.log(`                     Default: Current directory.`)
	console.log(`  ` + colStr(HIGHLIGHT, `messages_filename`) + `  Name of the messages file.`)
	console.log(`                     Default: '` + colStr(FILE, configuration.messagesFilename) + `'.`)
	console.log(`-------------------------------------------------------------------------------`)
	console.log(colStr(HEADING, `Configuration file:`))
	console.log(`The first existing configuration file found in this list of paths will be used:`)
	console.log(colStr(HIGHLIGHT, `a)`) + ` "directory_path" from command line (s. above)`)
	console.log(colStr(HIGHLIGHT, `b)`) + ` current directory`)
	console.log(colStr(HIGHLIGHT, `c)`) + ` directory containing this program file '` + colStr(FILE, globals.prgName + globals.prgExt) + `'`)
	console.log(`If none are found, the program will fall back to a hard-coded configuration.`)
	console.log(`-------------------------------------------------------------------------------`)
	console.log(colStr(BYLINE, `Version: ` + sourceVersion))
	console.log(colStr(BYLINE, `Source:  ` + sourceDate))
	console.log(colStr(BYLINE, `Author:  ` + author))
	console.log(`-------------------------------------------------------------------------------`)
	console.log(`Program terminates...\n`)
	process.exit(exitCode)
}

//--------------------------------------------------------------------------------
// If a configuration file exists: overwrite default configuration:
function readConfiguration() {
	const cfgFile = relevantDirs.map(d => d + globals.prgName + CFG_FILE_EXTENSION).find(s => fileExistSync(s)) || null // find configuration file; or null
	let sPre = `Configuration file '` + colStr(FILE, cfgFile) + `'`
	let sPost = `will use default configuration values.`
	if (cfgFile) {
		try {
			let data = fs.readFileSync(cfgFile, 'utf8') // may throw
			try {
				data = JSON.parse(data) // may throw
				// check data structure:
				if (Array.isArray(data) || (typeof data !== 'object')) {
					throw new Error('no object')
				}
				for (let key in data) {
					if (data[key] === undefined) { // "Object.assign" must not use a key if it has no value:
						delete data[key]

					} else if (configuration[key] === undefined) { // check if key exists in prototype:
						throw new Error(`forbidden key '` + key + `'`)

					} else if (Array.isArray(configuration[key])) {
						if (!Array.isArray(data[key])) {
							throw new Error(`key '` + key + `' must be an array`)
						}

					} else if (typeof data[key] === 'object') {
						for (let subKey in data[key]) {
							if (typeof data[key][subKey] !== 'string') {
								throw new Error(`key '` + subKey + `' in key '` + key + `' must be a string`)
							}
						}
					}
				}
				Object.assign(configuration, (data || {})) // overwrite configuration with new values
				console.log(colStr(HIGHLIGHT, `Info: `) + `Using data from configuration file '` + colStr(FILE, cfgFile) + `'.\n`)

			} catch(err) {
				console.error(colStr(HIGHLIGHT, `Error: `) + sPre + `does not contain a valid JSON object;\n` + err +  + `;\n` + sPost + `\n`)
			}

		} catch(err) {
			console.error(colStr(HIGHLIGHT, `Error: `) + sPre + `not readable;\n` + err + `;\n` + sPost + `\n`)
		}

	} else {
		console.log(colStr(HIGHLIGHT, `Info: `) + ((relevantDirs.length > 1) ? `Neither ` : ``) + relevantDirs.map(s => `'` + colStr(FILE, s + globals.prgName + CFG_FILE_EXTENSION) + `'`).join(`,\n      nor `) + ((relevantDirs.length > 1) ? ` was` : ` not`) + ` found;\n      ` + sPost + `\n`)
	}
}

//--------------------------------------------------------------------------------
// Replace all occurences of "re" in "s", enclose each appearance in "sPre" + "sPost":
function doReplace(s, re, sPre, sPost) {
	while (re.test(s)) {
		s = s.replace(re, ($1,$2) => sPre + $2 + sPost)
	}
	return s
}

//--------------------------------------------------------------------------------
// Replace all reserved HTML characters:
function ensurePureHtml(s) {
	if ((typeof s === 'string') && s) {
		// Create a map of special characters and their corresponding HTML entities:
		const map = { // NOTE: "map" must not contain keys "]", "\", "^", or "-"!
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'/': '&#x2F;',
			'`': '&#x60;',
			'=': '&#x3D;'
		}
		const re = new RegExp('[' + Object.keys(map).join('') + ']', 'g') // create RegExp from object keys
		// Replace each special character with its corresponding entity
		return s.replace(re, (char) => map[char] || char)
	}
	return s
}

//--------------------------------------------------------------------------------
// Replace all "\" by "/":
function ensureSlashes(s) {
	if (typeof s === 'string') {
		return s.replace(/\\/g, '/')
	}
	return ''
}

//--------------------------------------------------------------------------------
// If "s" is a non-empty string, return the same string with a trailing "/":
function ensureTrailingSlash(s) {
	if (typeof s === 'string') {
		s = ensureSlashes(s)
		if (s && (!/\/$/.test(s))) {
			return s + '/'
		}
		return s
	}
	return ''
}

//--------------------------------------------------------------------------------
// Check synchronously if file exists:
function fileExistSync(s) {
	try {
		if (fs.statSync(s).isFile()) {
			return true
		}

	} catch(err) {} // no reaction needed, file simply doesn't exist
	return false
}

//--------------------------------------------------------------------------------
// Check synchronously if folder exists:
function folderExistSync(s) {
	try {
		if (fs.statSync(s).isDirectory()) {
			return true
		}

	} catch(err) {} // no reaction needed, folder simply doesn't exist
	return false
}

//--------------------------------------------------------------------------------
// Recursively retrieve all files in a directory and return them sorted in ascending order by name:
function readFilesSync(dir) {
	try {
		let files = []
		fs.readdirSync(dir).forEach(fileName => {
			const fullName = ensureSlashes(path.resolve(dir, fileName)) // get path plus filename
			const stat = fs.statSync(fullName) // get full file information
			if (stat.isDirectory()) { // if folder, read recursively:
				files = files.concat(readFilesSync(fullName))
			}
			if (stat.isFile()) { // if file, add it to the list:
				const parsed = path.parse(fileName) // get filename, extension, etc.
				files.push({
					fullName,
					name: parsed.name,
					ext: parsed.ext,
					baseLower: parsed.base.toLowerCase(),
					stat
				})
			}
		})

		files.sort((a, b) => {
			// natural sort alphanumeric strings
			// https://stackoverflow.com/a/38641281
			return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
		})
		return files

	} catch(err) {
		console.error(colStr(HIGHLIGHT, `Error: `) + `Could not read source files: ` + err)
	}
}

//--------------------------------------------------------------------------------
// Find file with name "fileName" in array of files:
function fileInList(fileName, files) {
	fileName = fileName.toLowerCase()
	for (let i = 0; i < files.length; i++) {
		if (files[i].baseLower === fileName) {
			return files[i]
		}
	}
	return null
}

//--------------------------------------------------------------------------------
// Returns the system temp folder (Windows, Linux, MacOS):
function getTempFolder() {
	let s = process.env.TMPDIR || process.env.TEMP || process.env.TMP
	if (s) {
		return ensureTrailingSlash(s)
	}
	// not yet found, try more for Linux or MacOS:
	if (!REGEX_PLATFORM_WINDOWS.test(process.platform)) {
		s = '/tmp'
		if (folderExistSync(s)) {
			return ensureTrailingSlash(s)
		}
	}
	return './'
}

//--------------------------------------------------------------------------------
// Generate a temporary filename; if "part" includes a path, it will be preserved; otherwise, the default temporary folder will be used:
function getTempFilename(extension = '', part = '', addTs = true, addRndNr = false, delim = '-') {
	let a = ((part && (typeof part === 'string')) ? [part] : [])
	if (addTs || ((!addTs) && (!part) && (!addRndNr))) {
		a.push((new Date()).toISOString().replace('Z', '').replace(/[^\d]/g, delim))
	}
	if (addRndNr) {
		a.push(String(Math.floor(1000 * Math.random())).padStart(3, '0'))
	}
	let s = ensureSlashes(a.join(delim) + (extension || ''))
	return ((/\//.test(s)) ? '' : getTempFolder()) + s
}

//--------------------------------------------------------------------------------
// Main:
try {
	// Display help screen if requested:
	if ((process.argv[2]) && (/^[\/-](?:[h?])$|^--help$/i.test(process.argv[2]))) {
		usage()
	}
	readConfiguration()
	// start processing:
	if (folderExistSync(relevantDirs[0])) {
		console.log(`Reading all files from path '` + colStr(FILE, relevantDirs[0]) + `' ...`)
		let files = readFilesSync(relevantDirs[0])
		if (Array.isArray(files)) {
			console.log(colStr(HEADING, `... done.`) + `\n`)
			let msgFileName = ensureSlashes((process.argv[3]) ? process.argv[3] : configuration.messagesFilename)
			console.log(`Looking for file '` + colStr(FILE, msgFileName) + `' ...`)
			let msgFile = fileInList(msgFileName, files)
			if (msgFile) {
				console.log(colStr(HEADING, `... found.`) + `\n`)
				let htmlFile = getTempFilename('.html', relevantDirs[0] + 'threema')
				let a = fs.readFileSync(msgFile.fullName, 'utf8').replace(/(\r?\n|\r)+$/, '').split(/\r?\n|\r/)
				for (let i = a.length - 1; i >= 0; i--) { // we work backwards, because we delete from array
					if ((!REGEX_NEW_CHAT.test(a[i])) && (i > 0)) {
						a[i - 1] += `\n` + a[i]
						a.splice(i, 1)
					}
				}
				let senders = ['Me']
				for (let i = 0; i < a.length; i++) {
					if (REGEX_NEW_CHAT.test(a[i])) {
						a[i] = {
							idx: i,
							ts: a[i].replace(REGEX_NEW_CHAT, ($1, $2) => $2),
							sender: a[i].replace(REGEX_NEW_CHAT, ($1, $2, $3) => $3).replace(/\s/g,'_'),
							txt: a[i].replace(REGEX_NEW_CHAT, ($1, $2, $3, $4) => $4).replace(/\t/g, ` `),
							media: []
						}
						while (REGEX_IMG.test(a[i].txt)) {
							a[i].media.push({
								outer: a[i].txt.replace(REGEX_IMG, ($1, $2, $3) => $3),
								inner: a[i].txt.replace(REGEX_IMG, ($1, $2, $3, $4) => $4)
							})
							a[i].txt = a[i].txt.replace(REGEX_IMG, ($1, $2, $3, $4, $5) => $2 + '\t'.repeat(a[i].media.length) + $5)
						}
						a[i].txt = ensurePureHtml(a[i].txt)
						a[i].txt = doReplace(a[i].txt, REGEX_BOLD, '<span class="bold">', '</span>')
						a[i].txt = doReplace(a[i].txt, REGEX_ITALICS, '<span class="italics">', '</span>')
						a[i].txt = doReplace(a[i].txt, REGEX_STRIKETHROUGH, '<span class="strikethrough">', '</span>')
						if (a[i].media.length) {
							for (let k = a[i].media.length - 1; k >= 0; k--) {
								let file = fileInList(a[i].media[k].inner, files)
								if (file) {
									let contentType = mime.getType(file.fullName)
									let code = `<a href="` + encodeURI(a[i].media[k].inner) + `" target="_blank">` + a[i].media[k].inner + `</a>`
									if (/^image/i.test(contentType)) {
										code = `<br><img src="` + encodeURI(a[i].media[k].inner) + `" alt ="` + a[i].media[k].inner + `">`

									} else if (/^audio/i.test(contentType)) {
										code = `<audio controls><source src="` + encodeURI(a[i].media[k].inner) + `" type="` + contentType + `">Your browser does not support the audio tag.</audio>`

									} else if (/^video/i.test(contentType)) {
										code = `<br><video controls><source src="` + encodeURI(a[i].media[k].inner) + `" type="` + contentType + `">Your browser does not support the video tag.</video>`
									}
									a[i].txt = a[i].txt.replace('\t'.repeat(k + 1), code)

								} else {
									a[i].txt = a[i].txt.replace('\t'.repeat(k + 1), ensurePureHtml(a[i].media[k].outer))
								}
							}
						}
						a[i].txt = a[i].txt.replace(/\n/g, '<br>')
						a[i].html = `<div class="` + a[i].sender + `"><span class="prefix">` + a[i].ts + ` (` + a[i].sender + `):</span> ` + a[i].txt + `</div>`
						if (!senders.includes(a[i].sender)) {
							senders.push(a[i].sender)
						}

					} else {
						throw new Error(`line does not start with Threema timestamp; not a Threema archive file? (` + a[i] + `)`)
					}
				}
				console.log(`Going to write file '` + colStr(FILE, htmlFile) + `' ...`)
				fs.writeFileSync(htmlFile,
					`<!DOCTYPE html>
					<html lang="` + configuration.htmlPrimaryLanguage + `">
					<head>
						<meta charset="UTF-8">
						<title>` + configuration.htmlTitle + `</title>
						<style>` + configuration.htmlBaseStyles.join('\n') + senders.map(s => '.' + s + ' { color: ' + configuration.namedColors[Math.max(Math.min(senders.indexOf(s), configuration.namedColors.length - 1), 0) ] + '; ' + configuration.htmlSingleMessageStyle + ' }'
							).join('\n') + `
						</style>
					</head>
					<body>` + a.map(o => o.html).join('\n') + `</body>
					</html>`,
					{ encoding: 'utf8' }
				)
				console.log(colStr(HEADING, `... done.`) + `\n`)

			} else {
				console.error(colStr(HIGHLIGHT, `Error: `) + `Could not find file '` + colStr(FILE, msgFileName) + `'.`)
				usage(1)
			}

		} else {
			console.error(colStr(HIGHLIGHT, `Error: `) + `Could not find any file in '` + colStr(FILE, relevantDirs[0]) + `'.`)
			usage(2)
		}

	} else {
		console.error(colStr(HIGHLIGHT, `Error: `) + `Path '` + colStr(FILE, relevantDirs[0]) + `' not found.`)
		usage(3)
	}

} catch(err) {
	console.error(colStr(HIGHLIGHT, `Error occured: `) + err)
	usage(4)
}

