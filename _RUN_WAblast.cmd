::place this file in same dir as WABOT
::req= node, nodemon
echo # Installing libraries
::remove until ..npm install &.. for using not updated dependencies
::npm i whatsapp-web.js & npm i -g npm-check-updates & ncu -u & 
npm install -g nodemon & npm install & start http://localhost:8000 & nodemon index_broadcast.js
cmd /k
