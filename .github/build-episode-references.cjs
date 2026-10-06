#!/usr/bin/env node
// Add static reading references to the three original, independently built episodes.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {renderReference,referenceStyle,begin,end}=require('./episode-references.cjs');
const root=path.resolve(__dirname,'../proof-episodes');
for(const slug of ['centroid','circumcenter','orthocenter']){
 const file=path.join(root,slug,'index.html');let html=fs.readFileSync(file,'utf8');
 const start=html.indexOf(begin),finish=html.indexOf(end);
 if(start>=0&&finish<start)throw new Error('Unclosed book reference in '+slug);
 if(start>=0)html=html.slice(0,start)+html.slice(finish+end.length).replace(/^\n/,'');
 html=html.replace(/<link rel="stylesheet" href="\.\.\/shared\/book-references\.css[^\"]*">\n?/g,'');
 html=html.replace('</head>',referenceStyle(slug)+'\n</head>');
 html=html.replace('</main>',renderReference(slug)+'\n</main>');
 fs.writeFileSync(file,html);
}
console.log('Built reading references for the three original episodes.');
