// Import lib
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js'); //main wa api //Buttons, List
const express = require('express');
const socketIO = require('socket.io'); //koneksi
//const qrcode = require('qrcode-terminal'); //qrcode in terminal
const qrcode = require('qrcode'); //qrcode in html base64
const http = require('http');
const path = require('path');
const fs = require('fs'); //fs session? buat csv
const csv = require('csv-parser'); //csv
//const https = require('https');
const fetch = require('node-fetch');
const { count, time, info } = require('console');

// Init
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const htmlPath = path.join(__dirname, 'files');
const SESSION_FILE_PATH = './wa-session.json';

// Session
//let sessionCfg;
//if (fs.existsSync(SESSION_FILE_PATH)){
//    sessionCfg = require(SESSION_FILE_PATH);
//}

// Send response ke web? --------------
app.use(express.static(htmlPath));
app.get('/', (req,res) => {
    res.set('Content-Type', 'text/csv');
    //res.sendFile('index.php', { root: __dirname });
    //res.status(200).json({
    //    status: true,
    //    message: 'Hello world!'
    //});
});
//--------------------

// Start
const client = new Client({
    puppeteer: {
        args: [
            '--no-sandbox', //important
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
        ],
        headless: true
    }, 
    //session:sessionCfg
    authStrategy: new LocalAuth()
})

// FUNGSI
const sleep = ms => new Promise(r => setTimeout(r, ms));
//setTimeout(() => {  itung=0; kembali=0; obrolc=0; }, 5000);


// Start client WA
//client.initialize();


//CHANGE THESSSSSSS
var noadmin = '628xxx'
var nowabot = '628xxx'

// Koneksi socket io
//socket sebagai koneksi, jdi setiap client yang connect ke socket akan dikirim sebuah pesan misal terkoneksi
//var namafile = 'daftar_try.csv';
io.on('connection', function(socket){
    //socket.emit('logmenu', 'Menggunakan file: ',namafile);
    socket.emit('logmenu', 'Pilih data csv yang digunakan dulu!');
    socket.emit('config', noadmin, nowabot);
    // Fitur via message WA
    client.on('message', async msg => {

        // Cek active or not
        if (msg.body == "!ping"){
            await client.sendMessage(msg.from, "pong!!!");
        }

        // Cek registered on WA or not
        if (msg.body.startsWith('!cek ')){
            let number = msg.body.slice(5);
            //number = '628xxx5';
            number_details = await client.isRegisteredUser(number);
            if (number_details){
                //socket.emit('logmenu', 'Nomor '+number+' terdaftar');
                await client.sendMessage(msg.from, 'Nomor '+number+' terdaftar');
            } else {
                //console.log(number_details,'gaal');
                await client.sendMessage(msg.from, 'Nomor '+number+' TIDAK terdaftar');
            }
            await client.sendMessage(msg.from, 'File untuk broadcast yang digunakan: '+namafile);
        }
    
        // Cek group WA info
        if (msg.body == "!cekgroupinfo"){
            let chat = await msg.getChat();
            //console.log(chat);
            if (chat.isGroup){
                //console.log('isgroup');
                //await client.sendMessage(msg.from, 'getting info');
                await client.sendMessage(msg.from, `
                    *Group Details*
                    ID: ${chat.id.user}
                    Name: ${chat.name}
                    Participant count: ${chat.participants.length}
                `);
            }
        }
        // Add members group WA
        if (msg.body === '!addmembers') {
            const group = await msg.getChat();
            if (group.isGroup){
                var datarow = [];
                fs.createReadStream('./files/'+namafile)
                .pipe(csv())
                .on('data', (row) => {
                    //console.log(typeof row['Nama']);
                    datarow.push(row);
                })
                .on('end', async () => {
                    //console.log('CSV file successfully processed');
                    //console.log(datarow[0]['Nomor']);
                    socket.emit('logmenu',"Memasukkan "+datarow.length+" orang ke grup '"+group.name+"' dalam hitungan ke-10");
                    //sleep(5000);
                    setTimeout(async () => {                          
                        for (let i = 0; i < datarow.length; i++) {
                            //const element = datarow[i];
                            let number = datarow[i]['no'];
                            number = number.includes('@c.us') ? number : `${number}@c.us`;
                            const result = await group.addParticipants([number],
                                //{ comment: 'Welcome '+datarow[i]['nama']+'! bentar lagi anda akan di kick' },
                                { autoSendInviteV4: true },
                                { sleep: 200 });
                            //socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' telah dikirimin');
                            socket.emit('logmenu', i+1+'-'+datarow[i]['no']+" | "+result[number].message);
                        }
                        //socket.emit('logmenu', "Blast Terkirim ke: "+ (datarow.length - gagalkirim) +" orang\nGagal: "+gagalkirim);
                        socket.emit('logmenu','Selesaiiiiiiiiiiiii');
                            
                    }, 10000); //10 s timer delay 
                    
                });
                //end added--------------------------
            }
        }

        // Cek peserta grup lom ada?
    
        // Change file untuk broadcast
        if (msg.body == "!changef"){
            if (namafile === "daftar_try.csv"){
                namafile = "daftar_final.csv"
            } else if (namafile === "daftar_final.csv"){
                namafile = "daftar_try.csv"
            }
            await client.sendMessage(msg.from, "Mengubah file untuk broadcast menjadi: ```"+namafile+"```");
            socket.emit('logmenu', 'Menggunakan file: ',namafile);
        }
        
        // Rawblast
        if (msg.body.startsWith('!rawblast ')){
            msg.reply("Pesan diterima. Blast berdasarkan file: ```"+namafile+"```");
            //const csv = require('csv-parser');
            //const fs = require('fs');
            var datarow = [];
            fs.createReadStream('./files/'+namafile)
            .pipe(csv())
            .on('data', (row) => {
                //console.log(typeof row['Nama']);
                datarow.push(row);
            })
            .on('end', async () => {
                //console.log('CSV file successfully processed');
                //console.log(datarow[0]['Nomor']);
                await client.sendMessage(msg.from, "Mengirim Blast ke "+datarow.length+" orang dalam hitungan ke-10");
                //sleep(5000);
                setTimeout(async () => {  
                    await client.sendMessage(msg.from, "Started");
                    socket.emit('logmenu', 'Mulai broadcast (lagi) dengan ',namafile);
                    let gagalkirim = 0;
                    for (let i = 0; i < datarow.length; i++) {
                        // UBAH PESAN INIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
                        //let pesan = 'Selamat malam '+datarow[i]['nama']+', \nMohon maaf mengganggu';
                        let number = datarow[i]['no'];
                        number = number.includes('@c.us') ? number : `${number}@c.us`;
                        //let chat = await msg.getChat();
                        //chat.sendSeen();
                        try {
                            registered = await client.isRegisteredUser(number);
                            if (registered){
                                await client.sendMessage(number, pesan);
                                socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' telah dikirimin');
                                //console.log(datarow[i]['no']+' telah dikirimin');
                            } else {
                                throw new Error("Mobile no is not registered on Whatsapp")
                            }
                        } catch (err) {
                            socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' terjadi ',err);
                            //console.log(datarow[i]['no']+' terjadi '+err);
                            gagalkirim++;
                        }
                    }
                    await client.sendMessage(msg.from, "Blast Terkirim ke "+ (datarow.length - gagalkirim) +" orang\nGagal: "+gagalkirim);
                     
                }, 10000); //10 s timer delay 
    
            });
            //end rawblast--------------------------
        }

        // Blast
        if (msg.body.startsWith('!blast ')){
            msg.reply("Pesan diterima. Blast berdasarkan file: ```"+namafile+"```");
            //const csv = require('csv-parser');
            //const fs = require('fs');
            var datarow = [];
            fs.createReadStream('./files/'+namafile)
            .pipe(csv())
            .on('data', (row) => {
                //console.log(typeof row['Nama']);
                datarow.push(row);
            })
            .on('end', async () => {
                //console.log('CSV file successfully processed');
                //console.log(datarow[0]['Nomor']);
                await client.sendMessage(msg.from, "Mengirim Blast ke "+datarow.length+" orang dalam hitungan ke-10");
                //sleep(5000);
                setTimeout(async () => {  
                    await client.sendMessage(msg.from, "Started");
                    socket.emit('logmenu', 'Mulai broadcast (lagi) dengan ',namafile);
                    let gagalkirim = 0;
                    for (let i = 0; i < datarow.length; i++) {
                        //const element = datarow[i];
                        let pesan = msg.body.slice(7);
                        //let pesan = 'Selamat malam '+datarow[i]['nama']+', \nMohon maaf mengganggu';
                        let number = datarow[i]['no'];
                        number = number.includes('@c.us') ? number : `${number}@c.us`;
                        //let chat = await msg.getChat();
                        //chat.sendSeen();
                        try {
                            registered = await client.isRegisteredUser(number);
                            if (registered){
                                await client.sendMessage(number, pesan);
                                socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' telah dikirimin');
                                //console.log(datarow[i]['no']+' telah dikirimin');
                            } else {
                                throw new Error("Mobile no is not registered on Whatsapp")
                            }
                        } catch (err) {
                            socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' terjadi ',err);
                            //console.log(datarow[i]['no']+' terjadi '+err);
                            gagalkirim++;
                        }
                    }
                    await client.sendMessage(msg.from, "Blast Terkirim ke "+ (datarow.length - gagalkirim) +" orang\nGagal: "+gagalkirim);
                     
                }, 10000); //10 s timer delay 
    
            });
            //end blast--------------------------
        }
    
    }); // end client on message--------------------------

    // FITURRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
    // Fitur View data
    socket.on('viewdata', function() {      
        var datarow = [];
        var j = 0;
        fs.createReadStream('./files/'+namafile)
        .pipe(csv())
        .on('headers', (headers) => {
            socket.emit('viewdatar');
            for (let i=0; i < headers.length; i++) {
                //socket.emit('viewdatah', `| ${headers[i]}`);
                j = j+1;
            }
        })
        .on('data', (row) => {
            //console.log(typeof row['Nama']);
            datarow.push(row);
            //socket.emit('viewdatad', 'Size data: '+);
            socket.emit('viewdatad', datarow.length+" "+JSON.stringify(row, null, 4));
        })
        .on('end', async () => {
            //console.log('CSV file successfully processed');
            //console.log(datarow[0]['Nomor']);
            //for (let i = 0; i < datarow.length; i++) {
                // UBAH PESAN INIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
                //let pesan = 'Selamat malam '+datarow[i]['nama']+', \nMohon maaf mengganggu';                
                //socket.emit('viewdatar');
                //socket.emit('viewdatad', datarow[i]['nama']);
            //}                    
        });
    });
    // Fitur Ceknomor
    socket.on('ceknomor', async function(number) {      
        number_details = await client.isRegisteredUser(number);
        if (number_details){
            socket.emit('logmenu', 'Nomor '+number+' terdaftar/punya WA');
            //await client.sendMessage(msg.from, 'Nomor '+number+' terdaftar');
        } else {
            //console.log(number_details,'gaal');
            socket.emit('logmenu', 'Nomor '+number+' TIDAK terdaftar di WA');
            //await client.sendMessage(msg.from, 'Nomor '+number+' TIDAK terdaftar');
        }
    });
    // Fitur Ping
    socket.on('ping', async function(number) {      
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(number, 'PING!!!');
        socket.emit('logmenu', 'Ping terkirim ke '+number);
    });
    // Fitur Ganti File
    socket.on('gantifile', function(namafileubah){
        namafile = namafileubah;
        //await client.sendMessage(msg.from, "Mengubah file untuk broadcast menjadi: ```"+namafile+"```");
        socket.emit('logmenu', 'Menggunakan file: ',namafile);
    })
    // Fitur Blast / Rawblast
    socket.on('blast', function(pesan, raw, imgpath=false){
        var datarow = [];
        fs.createReadStream('./files/'+namafile)
        .pipe(csv())
        .on('data', (row) => {
            //console.log(typeof row['Nama']);
            datarow.push(row);
        })
        .on('end', async () => {
            //console.log('CSV file successfully processed');
            //console.log(datarow[0]['Nomor']);
            socket.emit('logmenu',"Mengirim Blast ke "+datarow.length+" orang dalam hitungan ke-10");
            socket.emit('logmenu', 'Cek nomor awal: '+datarow[0]['no']);
            //sleep(5000);
            setTimeout(async () => {  
                socket.emit('logmenu', 'Mulai blast pesan dengan ',namafile);
                let gagalkirim = 0;
                for (let i = 0; i < datarow.length; i++) {
                    //const element = datarow[i];
                    let number = datarow[i]['no'];
                    number = number.includes('@c.us') ? number : `${number}@c.us`;
                    //let chat = await msg.getChat();
                    //chat.sendSeen();
                    try {
                        registered = await client.isRegisteredUser(number);
                        if (registered){
                            if (imgpath) {
                                var media = MessageMedia.fromFilePath('./files/' + imgpath);
                                await client.sendMessage(number, media);
                            }
                            if (raw){
                                await client.sendMessage(number, eval(pesan));
                            } else {
                                await client.sendMessage(number, pesan);
                            }
                            socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' telah dikirimin');
                            //console.log(datarow[i]['no']+' telah dikirimin');
                        } else {
                            throw new Error("Mobile no is not registered on Whatsapp")
                        }
                    } catch (err) {
                        socket.emit('logmenu', i+1+'-'+datarow[i]['no']+' terjadi error: ',err.message);
                        //console.log(datarow[i]['no']+' terjadi '+err);
                        gagalkirim++;
                    }
                }
                socket.emit('logmenu', "Blast Terkirim ke: "+ (datarow.length - gagalkirim) +" orang\nGagal: "+gagalkirim);
                     
            }, 10000); //10 s timer delay 
    
        });
        //end fitur blast--------------------------
    })
    

    // Start client WA
    socket.emit('message', 'Connecting...');
    socket.on('init', async function() {      
        client.initialize();
        socket.emit('message', 'Initializing connection Wabot...'); //send message
    });
    socket.on('dc', async function() {      
        client.destroy();
        socket.emit('message', 'Wabot disconnected...'); //send message
    });
    client.on('loading_screen', (percent, message) => {
        //console.log('Loading Screen', percent, message);
        socket.emit('message', 'Loading '+ percent+"%");
    });

    // QR
    client.on('qr', qr => {
        //console.log('QR Received:', qr);
        //qrcode.generate(qr, {small: true}); //qrcode terminal
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr',url);
            socket.emit('message','QR Code received, please scan...');
        }) //ubah qrcode string ke img html
    });

    // Otentikasi (ntar kesimpan di session)
    /*client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
            if (err){
                console.error(err);
            }
        })
    })*/
    client.on('authenticated', (session) => {
        socket.emit('authenticated','Wabot is authenticated!');
        socket.emit('message','Wabot is authenticated!');
        //console.log('AUTHENTICATED', session);
    })
    client.on('auth_failure', msg => {
        // Fired if session restore was unsuccessful
        //console.error('AUTHENTICATION FAILURE', msg);
        socket.emit('message','Error: Authentication failure!');
    });

    // Tersambung
    client.on('ready', () => {
        socket.emit('ready','Wabot is ready!');
        socket.emit('message','Wabot ('+client.info.wid.user+' / '+client.info.pushname+') is ready!');
        //console.log('Client is ready!');
        //console.log(client.info.wid.user);
        socket.emit('config', noadmin, client.info.wid.user);
        //socket.emit('message', 'Nomor '+client.info.wid.user+' ('+client.info.pushname+') telah jadi WABot')
    });

    // Disconnected
    client.on('disconnected', (reason) => {
        socket.emit('message','Wabot is disconnected!' + reason);
        //console.log('Client was logged out!', reason);
        /*fs.unlinkSync(SESSION_FILE_PATH, function(err){
            if(err) return console.log(err);
            console.log('Session file deleted!');
        });*/
        client.destroy();
        client.initialize();
    });

    // Error show
    process.on('uncaughtException', function(err) {
        //console.log('Caught exception: ' + err);
        socket.emit('message', 'Caught exception: '+err);
    });


});

// Localhost?
server.listen(8000, function(){
    console.log('App running on *:' + 8000);
    console.log('Please refresh');
});
