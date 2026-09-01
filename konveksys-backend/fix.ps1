=[System.IO.File]::ReadAllBytes('prisma\schema.prisma')  
if([0] -eq 0xEF){=[3..(.Length-1)]}  
=[System.Text.Encoding]::UTF8.GetString()  
= -replace '= prisma-client-js','= \" "prisma-client-js\'  
= -replace '= postgresql','= \postgresql\'  
[System.IO.File]::WriteAllText('prisma\schema.prisma',,(New-Object System.Text.UTF8Encoding(False)))  
Write-Host 'Done' 
