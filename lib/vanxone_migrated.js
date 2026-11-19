/**
 * VanxOne to Furina MD Migration Adapter & Helpers
 * Contains adapted core functionalities from VanxOne converted into Furina-compatible helpers.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

// 1. Local Database Helpers (Games & Knowledge)
const DATA_DIR = path.join(__dirname, '../data/games');

function getLocalGameData(filename) {
    const fullPath = path.join(DATA_DIR, filename);
    if (fs.existsSync(fullPath)) {
        try {
            return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        } catch (e) {
            console.error(`[VanxOne Migrated] Failed parsing ${filename}:`, e.message);
        }
    }
    return [];
}

// 2. Islamic Knowledge Helpers
const asmaulHusnaData = getLocalGameData('asmaulhusna.json');

const AYAT_KURSI = {
    surah: 'Al-Baqarah',
    ayat: 255,
    arabic: `اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ`,
    latin: `Allāhu lā ilāha illā huw, al-ḥayyul-qayyūm, lā ta'khużuhū sinatuw wa lā na'ūm, lahū mā fis-samāwāti wa mā fil-arḍ, man żallażī yasyfa'u 'indahū illā bi'iżnih, ya'lamu mā baina aidīhim wa mā khalfahum, wa lā yuḥīṭūna bisyai'im min 'ilmihī illā bimā syā', wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhū ḥifẓuhumā, wa huwal-'aliyyul-'aẓīm.`,
    translation: `Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus-menerus mengurus (makhluk-Nya), tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang ada di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Mahatinggi, Mahabesar.`
};

const KISAH_NABI_LIST = [
    { nabi: 'Adam AS', rangkuman: 'Manusia dan nabi pertama yang diciptakan Allah SWT dari tanah, ditempatkan di surga lalu diturunkan ke bumi bersama Hawa.' },
    { nabi: 'Idris AS', rangkuman: 'Nabi pertama yang pandai menulis dengan pena, menjahit pakaian, dan menguasai ilmu perbintangan serta matematika.' },
    { nabi: 'Nuh AS', rangkuman: 'Berdakwah selama 950 tahun dan membuat bahtera raksasa atas perintah Allah untuk menyelamatkan orang beriman dari banjir bandang.' },
    { nabi: 'Hud AS', rangkuman: 'Diutus kepada kaum \'Ad yang sombong dan bertubuh kekar, yang akhirnya dibinasakan dengan angin topan dingin yang membekukan.' },
    { nabi: 'Saleh AS', rangkuman: 'Diutus kepada kaum Tsamud dengan mukjizat unta betina yang keluar dari batu besar, namun unta tersebut dibunuh kaumnya.' },
    { nabi: 'Ibrahim AS', rangkuman: 'Bapak para nabi (Khalilullah), selamat dari kobaran api Raja Namrud, membangun Ka\'bah bersama Nabi Ismail AS.' },
    { nabi: 'Luth AS', rangkuman: 'Keponakan Nabi Ibrahim yang diutus ke kota Sodom untuk memperbaiki moral kaum yang menyimpang.' },
    { nabi: 'Ismail AS', rangkuman: 'Putra Nabi Ibrahim yang taat ketika hendak disembelih, mata air Zamzam memancar dari jejak kakinya.' },
    { nabi: 'Ishaq AS', rangkuman: 'Putra kedua Nabi Ibrahim dari Siti Sarah, dikenal sangat bijaksana dan menurunkan nabi-nabi Bani Israil.' },
    { nabi: 'Ya\'qub AS', rangkuman: 'Putra Nabi Ishaq yang juga bergelar Israil, ayah dari 12 putra termasuk Nabi Yusuf AS.' },
    { nabi: 'Yusuf AS', rangkuman: 'Nabi berwajah sangat tampan, dibuang ke sumur oleh saudaranya, dipenjara karena fitnah, hingga menjadi bendaharawan Mesir.' },
    { nabi: 'Ayyub AS', rangkuman: 'Teladan kesabaran luar biasa ketika diuji dengan penyakit parah, kehilangan seluruh harta dan anak-anaknya selama bertahun-tahun.' },
    { nabi: 'Syu\'aib AS', rangkuman: 'Diutus kepada kaum Madyan yang curang dalam timbangan dan takaran.' },
    { nabi: 'Musa AS', rangkuman: 'Kalimullah yang berbicara langsung dengan Allah, membelah Laut Merah dengan tongkatnya dan menenggelamkan Fir\'aun.' },
    { nabi: 'Harun AS', rangkuman: 'Saudara Nabi Musa yang fasih berbicara dan mendampingi Nabi Musa menghadapi Fir\'aun.' },
    { nabi: 'Zulkifli AS', rangkuman: 'Dikenal sangat sabar, tidak pernah marah, dan selalu menepati janji serta adil dalam memutuskan perkara.' },
    { nabi: 'Daud AS', rangkuman: 'Diberikan kitab Zabur, melunakkan besi dengan tangannya, mengalahkan Jalut, dan memiliki suara merdu saat bertasbih.' },
    { nabi: 'Sulaiman AS', rangkuman: 'Raja yang memahami bahasa hewan, menundukkan angin, dan memimpin pasukan dari kalangan manusia, jin, dan burung.' },
    { nabi: 'Ilyas AS', rangkuman: 'Diutus kepada kaum Ba\'al di kota Ba\'labak yang menyembah berhala patung emas bernama Ba\'al.' },
    { nabi: 'Ilyasa\' AS', rangkuman: 'Penerus dakwah Nabi Ilyas yang memimpin kaumnya dengan hukum Taurat dengan penuh kedamaian.' },
    { nabi: 'Yunus AS', rangkuman: 'Meninggalkan kaumnya lalu ditelan ikan paus (Nun), bertasbih di dalam kegelapan hingga diselamatkan Allah.' },
    { nabi: 'Zakariya AS', rangkuman: 'Ayah dari Nabi Yahya AS, mengasuh Maryam binti Imran di Mihrab Baitul Maqdis.' },
    { nabi: 'Yahya AS', rangkuman: 'Putra Nabi Zakariya yang dianugerahi hikmah sejak kanak-kanak, berani menegakkan kebenaran tanpa takut celaan.' },
    { nabi: 'Isa AS', rangkuman: 'Lahir tanpa ayah dari perawan Maryam, berbicara saat bayi, menyembuhkan orang kusta, menghidupkan orang mati atas izin Allah.' },
    { nabi: 'Muhammad SAW', rangkuman: 'Penutup para nabi dan rasul (Khatamun Nabiyyin), pembawa rahmat bagi seluruh alam (Rahmatan lil \'Alamin), mukjizat terbesarnya adalah Al-Qur\'an.' }
];

const BACAAN_SHOLAT_DATA = [
    {
        nama: 'Niat Sholat Subuh',
        arab: `أُصَلِّى فَرْضَ الصُّبْح رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى`,
        latin: `Ushalli fardhash-shubhi rak'ataini mustaqbilal-qiblati adaa'an lillaahi ta'aalaa`,
        arti: `Aku berniat sholat fardhu Subuh dua rakaat menghadap kiblat karena Allah Ta'ala.`
    },
    {
        nama: 'Niat Sholat Dzuhur',
        arab: `أُصَلِّى فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى`,
        latin: `Ushalli fardhadz-dzuhri arba'a raka'aatin mustaqbilal-qiblati adaa'an lillaahi ta'aalaa`,
        arti: `Aku berniat sholat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta'ala.`
    },
    {
        nama: 'Niat Sholat Ashar',
        arab: `أُصَلِّى فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى`,
        latin: `Ushalli fardhal-'ashri arba'a raka'aatin mustaqbilal-qiblati adaa'an lillaahi ta'aalaa`,
        arti: `Aku berniat sholat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta'ala.`
    },
    {
        nama: 'Niat Sholat Maghrib',
        arab: `أُصَلِّى فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى`,
        latin: `Ushalli fardhal-maghribi tsalaatsa raka'aatin mustaqbilal-qiblati adaa'an lillaahi ta'aalaa`,
        arti: `Aku berniat sholat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta'ala.`
    },
    {
        nama: 'Niat Sholat Isya',
        arab: `أُصَلِّى فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى`,
        latin: `Ushalli fardhal-'isyaa'i arba'a raka'aatin mustaqbilal-qiblati adaa'an lillaahi ta'aalaa`,
        arti: `Aku berniat sholat fardhu Isya empat rakaat menghadap kiblat karena Allah Ta'ala.`
    },
    {
        nama: 'Doa Iftitah',
        arab: `اللَّهُ أَكْبَرُ كَبِيرًا وَالْحَمْدُ لِلَّهِ كَثِيرًا وَسُبْحَانَ اللَّهِ بُكْرَةً وَأَصِيلًا، إِنِّى وَجَّهْتُ وَجْهِىَ لِلَّذِى فَطَرَ السَّمَاوَاتِ وَالأَرْضَ حَنِيفًا مُسْلِمًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ، إِنَّ صَلاَتِى وَنُسُكِى وَمَحْيَاىَ وَمَمَاتِى لِلَّهِ رَبِّ الْعَالَمِينَ، لاَ شَرِيكَ لَهُ وَبِذَلِكَ أُمِرْتُ وَأَنَا مِنَ الْمُسْلِمِينَ`,
        latin: `Allaahu akbaru kabiiraw-wal-hamdu lillaahi katsiiraw-wasubhaanallaahi bukrataw-wa ashiilaa. Inni wajjahtu wajhiya lilladzii fatharas-samaawaati wal-ardha haniifam-muslimaw-wamaa anaa minal-musyrikiin. Inna shalaatii wa nusukii wa mahyaaya wa mamaatii lillaahi rabbil-'aalamiin. Laa syariikalahu wa bidzaalika umirtu wa anaa minal-muslimiin.`,
        arti: `Allah Maha Besar lagi sempurna kebesaran-Nya, segala puji bagi Allah dengan pujian yang banyak. Maha Suci Allah sepanjang pagi dan petang. Sesungguhnya kuhadapkan wajahku kepada Dzat yang menciptakan langit dan bumi dengan keadaan lurus dan berserah diri, dan aku bukanlah dari golongan orang-orang musyrik. Sesungguhnya sholatku, ibadahku, hidupku dan matiku hanyalah untuk Allah, Tuhan semesta alam. Tidak ada sekutu bagi-Nya dan dengan itulah aku diperintahkan dan aku termasuk orang-orang muslim.`
    },
    {
        nama: 'Doa Ruku\'',
        arab: `سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ`,
        latin: `Subhaana rabbiyal-'azhiimi wa bihamdih (3x)`,
        arti: `Maha Suci Tuhanku Yang Maha Agung dan dengan memuji-Nya.`
    },
    {
        nama: 'Doa I\'tidal',
        arab: `رَبَّنَا لَكَ الْحَمْدُ مِلْءَ السَّمَاوَاتِ وَمِلْءَ الْأَرْضِ وَمِلْءَ مَا شِئْتَ مِنْ شَيْءٍ بَعْدُ`,
        latin: `Rabbanaa lakal-hamdu mil'us-samaawaati wa mil'ul-ardhi wa mil'u maa syi'ta min syai'in ba'd.`,
        arti: `Wahai Tuhan kami, bagi-Mu lah segala puji, sepenuh langit dan sepenuh bumi, dan sepenuh apa yang Engkau kehendaki setelah itu.`
    },
    {
        nama: 'Doa Sujud',
        arab: `سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ`,
        latin: `Subhaana rabbiyal-a'laa wa bihamdih (3x)`,
        arti: `Maha Suci Tuhanku Yang Maha Tinggi dan dengan memuji-Nya.`
    },
    {
        nama: 'Doa Duduk Antara Dua Sujud',
        arab: `رَبِّ اغْفِرْ لِي وَارْحَمْنِي وَاجْبُرْنِي وَارْفَعْنِي وَارْزُقْنِي وَاهْدِنِي وَعَافِنِي وَاعْفُ عَنِّي`,
        latin: `Rabbighfirlii warhamnii wajburnii warfa'nii warzuqnii wahdinii wa 'aafinii wa'fu 'annii.`,
        arti: `Ya Tuhanku ampunilah dosaku, kasihanilah aku, cukupkanlah kekuranganku, tinggikanlah derajatku, berilah aku rezeki, berilah aku petunjuk, berilah aku kesehatan dan maafkanlah aku.`
    },
    {
        nama: 'Doa Tahiyyat Akhir',
        arab: `التَّحِيَّاتُ الْمُبَارَكَاتُ الصَّلَوَاتُ الطَّيِّبَاتُ لِلَّهِ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِىُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلاَمُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ. اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى سَيِّدِنَا إِبْرَاهِيمَ وَعَلَى آلِ سَيِّدِنَا إِبْرَاهِيمَ، فِى الْعَالَمِينَ إِنَّكَ حَمِيدٌ مَجِيدٌ`,
        latin: `At-tahiyyaatul-mubaarakaatush-shalawaatuth-thayyibaatu lillaah. As-salaamu 'alaika ayyuhan-nabiyyu wa rahmatullaahi wa barakaatuh. As-salaamu 'alainaa wa 'alaa 'ibaadillaahish-shaalihiin. Asyhadu allaa ilaaha illallaah, wa asyhadu anna muhammadar-rasuulullaah. Allaahumma shalli 'alaa sayyidinaa muhammad wa 'alaa aali sayyidinaa muhammad, kamaa shallaita 'alaa sayyidinaa ibraahiim wa 'alaa aali sayyidinaa ibraahiim, wa baarik 'alaa sayyidinaa muhammad wa 'alaa aali sayyidinaa muhammad, kamaa baarakta 'alaa sayyidinaa ibraahiim wa 'alaa aali sayyidinaa ibraahiim, fil-'aalamiina innaka hamiidum-majiid.`,
        arti: `Segala penghormatan, keberkahan, shalawat dan kebaikan adalah milik Allah. Semoga keselamatan, rahmat Allah dan berkah-Nya tercurah kepadamu wahai Nabi. Semoga keselamatan tercurah kepada kami dan hamba-hamba Allah yang sholeh. Aku bersaksi tidak ada tuhan selain Allah dan aku bersaksi bahwa Muhammad adalah utusan Allah. Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad dan keluarganya, sebagaimana Engkau telah melimpahkan rahmat kepada Nabi Ibrahim dan keluarganya... Sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.`
    }
];

// 3. Audio Effects Engine via ffmpeg
async function applyAudioEffect(inputBuffer, effectType) {
    const tempIn = path.join(process.cwd(), 'temp', `audio_in_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
    const tempOut = path.join(process.cwd(), 'temp', `audio_out_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
    
    fs.writeFileSync(tempIn, inputBuffer);
    
    let filter = '';
    switch (effectType.toLowerCase()) {
        case '8d':
        case 'audio8d':
            filter = 'apulsator=hz=0.125';
            break;
        case 'slowed':
        case 'slowreverb':
            filter = 'asetrate=44100*0.85,aresample=44100,aecho=0.8:0.88:60:0.4';
            break;
        case 'nightcore':
        case 'speedup':
            filter = 'asetrate=44100*1.25,aresample=44100';
            break;
        default:
            filter = 'asetrate=44100*1.1,aresample=44100';
    }

    return new Promise((resolve, reject) => {
        exec(`ffmpeg -y -i "${tempIn}" -af "${filter}" "${tempOut}"`, (err) => {
            try { fs.unlinkSync(tempIn); } catch (e) {}
            if (err) {
                try { fs.unlinkSync(tempOut); } catch (e) {}
                return reject(err);
            }
            try {
                const outBuf = fs.readFileSync(tempOut);
                fs.unlinkSync(tempOut);
                resolve(outBuf);
            } catch (e) {
                reject(e);
            }
        });
    });
}

// 4. URL Shortener & Expander
async function shortenUrl(longUrl) {
    try {
        const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, { timeout: 8000 });
        if (data && String(data).startsWith('http')) return String(data).trim();
    } catch (e) {}
    try {
        const { data } = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`, { timeout: 8000 });
        if (data && String(data).startsWith('http')) return String(data).trim();
    } catch (e) {}
    throw new Error('Semua provider URL Shortener sedang sibuk!');
}

async function expandUrl(shortUrl) {
    try {
        const res = await axios.get(shortUrl, {
            maxRedirects: 10,
            validateStatus: () => true,
            timeout: 8000
        });
        const finalUrl = res.request?.res?.responseUrl || res.config?.url || shortUrl;
        return finalUrl;
    } catch (e) {
        throw new Error(`Gagal mengekspansi link: ${e.message}`);
    }
}

// 5. Network / DNS / IP Helpers
async function ipStalk(ip) {
    try {
        const { data } = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, { timeout: 8000 });
        if (data && data.status === 'success') return { status: true, data };
        throw new Error(data.message || 'IP tidak valid');
    } catch (e) {
        throw new Error(`Gagal melacak IP: ${e.message}`);
    }
}

// 6. Safe require for VanxOne scrapers
function getScraper(name) {
    try {
        return require(path.join(__dirname, '../scrape/vanxone', name));
    } catch (e) {
        console.warn(`[VanxOne Migrated] Scraper ${name} not available:`, e.message);
        return null;
    }
}


// Namespace export compatibility

// Enhanced normalized islamic data
if (!AYAT_KURSI.audio) AYAT_KURSI.audio = 'https://audio.qurancdn.com/wbw/002_255.mp3';
if (!AYAT_KURSI.virtue) AYAT_KURSI.virtue = 'Melindungi dari gangguan jin dan syaitan serta mendatangkan ketenangan.';

const normalizedKisahNabi = KISAH_NABI_LIST.map(n => ({
    name: n.name || n.nabi.replace(/s+AS$/i, ''),
    nabi: n.nabi || (n.name + ' AS'),
    place: n.place || 'Timur Tengah',
    age: n.age || '-',
    story: n.story || n.rangkuman,
    rangkuman: n.rangkuman || n.story
}));

const normalizedBacaanSholat = BACAAN_SHOLAT_DATA.map((s, idx) => ({
    id: idx + 1,
    title: s.title || s.nama,
    nama: s.nama || s.title,
    arabic: s.arabic || s.arab,
    arab: s.arab || s.arabic,
    latin: s.latin,
    translation: s.translation || s.arti,
    arti: s.arti || s.translation
}));

const islamicData = {
    ayatKursi: AYAT_KURSI,
    asmaulHusna: asmaulHusnaData,
    kisahNabi: normalizedKisahNabi,
    bacaanSholat: normalizedBacaanSholat
};

async function safeIpStalk(ip) {
    try {
        const res = await ipStalk(ip);
        return { status: true, data: res };
    } catch (e) {
        return { status: false, error: e.message };
    }
}

module.exports = {
    getLocalGameData,
    asmaulHusnaData,
    AYAT_KURSI,
    KISAH_NABI_LIST,
    BACAAN_SHOLAT_DATA,
    islamicData,
    applyAudioEffect,
    processAudio: applyAudioEffect,
    shortenUrl,
    shortUrl: shortenUrl,
    expandUrl,
    unshortUrl: expandUrl,
    ipStalk: safeIpStalk,
    getScraper
};

