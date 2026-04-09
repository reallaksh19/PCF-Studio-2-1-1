const fs = require('fs');
let c = fs.readFileSync('js/pcf-fixer-runtime/ui/tabs/DrawCanvasTab.js', 'utf8');

const regex = /    \}\), showGridSettings && _jsxs\("div", \{\n      className: "w-\[330px\] flex-shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col z-10",([\s\S]*?)      \}\)]\n/m;
const match = c.match(regex);
if (!match) { console.log("Panel not found!"); process.exit(1); }

c = c.replace(match[0], '');

const targetRegex = /        children: "Open Properties"\n      \}\)]\n    \}\), isListOpen \&\& /m;

const newInjection = `        children: "Open Properties"
      }), showGridSettings && _jsxs("div", {
      className: "w-[330px] flex-shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col z-10",${match[1]}      })]
    }), isListOpen && `;

c = c.replace(targetRegex, newInjection);

fs.writeFileSync('js/pcf-fixer-runtime/ui/tabs/DrawCanvasTab.js', c, 'utf8');
console.log("FIXED");
