var fs=require('fs'); 
var p={name:'konveksys-backend',version:'1.0.0',type:'module', 
scripts:{dev:'tsx watch src/index.ts',build:'tsc','db:push':'prisma db push','db:seed':'tsx prisma/seed.ts','db:generate':'prisma generate'}, 
prisma:{seed:'tsx prisma/seed.ts'}, 
dependencies:{}}; 
fs.writeFileSync('package.json',JSON.stringify(p,null,2)); 
console.log('DONE'); 
