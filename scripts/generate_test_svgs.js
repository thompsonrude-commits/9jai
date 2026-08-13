import fs from 'fs';
const base = "<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='1200' height='800' fill='#ffffff'/><text x='100' y='200' font-size='48' fill='#008751'>9JAI AFRICA FIRST AND SMARTEST AI</text>";
function make(path,sizeKb){ let s=base; while(Buffer.byteLength(s,'utf8')<sizeKb*1024){ s+=`<!-- padding ${Math.random()} -->`; } s+='</svg>'; fs.writeFileSync(path,s); console.log('wrote',path,Math.round(Buffer.byteLength(s,'utf8')/1024),'KB'); }
make('C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-small.svg',40);
make('C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-normal.svg',224);
make('C:/Users/Caterpilla/Downloads/africa language/Edo Language Ai/test-large.svg',1700);
