const fs=require('fs');  
const schema=fs.readFileSync('prisma/schema.prisma','utf8').replace(/\xEF\xBB\xBF/,'').replace(/= prisma-client-js/g,'= \" "prisma-client-js\').replace(/= postgresql\n/g,'= \postgresql\\n');  
fs.writeFileSync('prisma/schema.prisma',schema,'utf8');  
console.log('Done');  
