// Essai sur une vraie carte (hors CI) du protocole REPL brut du wiki
// (src/components/EssayerMicroPython/repl.mjs), branché sur DAP.js en Node.
//
// dapjs et usb ne sont pas des dépendances du wiki : les installer dans un
// dossier à part, puis donner ce dossier dans DAPJS_MODULES :
//   mkdir /tmp/dapjs && cd /tmp/dapjs && npm install dapjs@2.3.0 usb
//   DAPJS_MODULES=/tmp/dapjs node scripts/essai-micropython-carte.mjs
// (DAPJS_MODULES : le dossier qui contient node_modules, ou node_modules lui-même.)
//
// La carte doit avoir MicroPython. Le script ne flashe jamais la carte : il ne
// se sert que du port série du DAPLink (115200 bauds). Il lance print(1+1),
// écrit deux fichiers dans le disque en RAM et les relit, lit la version du
// firmware, puis arrête un programme sans fin. Code de sortie 0 si tout réussit.
import { createRequire } from 'node:module';

import { creerRepl } from '../src/components/EssayerMicroPython/repl.mjs';

const dossier = process.env.DAPJS_MODULES;
if (!dossier) {
  console.error('DAPJS_MODULES manquant : voir l’en-tête du script.');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const charger = (nom) => require(require.resolve(nom, { paths: [dossier] }));
const DAPjs = charger('dapjs');
const usb = charger('usb');

const device = usb.findByIds(0x0d28, 0x0204);
if (!device) {
  console.error('Carte introuvable (DAPLink 0d28:0204).');
  process.exit(2);
}
// libusb répond BUSY à setConfiguration quand le noyau tient d'autres
// interfaces ; la carte est déjà dans la configuration 1, comme sous Chrome.
device.setConfiguration = (_v, cb) => cb && cb();
// node-usb : 1 s par transfert par défaut ; WebUSB n'a pas de délai.
device.timeout = 60000;

const dap = new DAPjs.DAPLink(new DAPjs.USB(device));
await dap.connect();
await dap.setSerialBaudrate(115200);

// DAP.js livre une chaîne d'un caractère par octet : conversion sans perte.
const ecouteurs = new Set();
dap.on(DAPjs.DAPLink.EVENT_SERIAL_DATA, (donnees) => {
  const octets = Uint8Array.from(donnees, (c) => c.charCodeAt(0));
  for (const fn of ecouteurs) fn(octets);
});
dap.startSerialRead(10).catch((err) => console.error('lecture série :', err.message));

const repl = creerRepl({
  ecrire: (octets) => dap.serialWrite(String.fromCharCode(...octets)),
  ecouter: (fn) => {
    ecouteurs.add(fn);
    return () => ecouteurs.delete(fn);
  },
});

let echecs = 0;
async function verifier(nom, essai) {
  const debut = Date.now();
  try {
    const detail = await essai();
    console.log(`OK    ${nom} (${Date.now() - debut} ms)${detail ? ` : ${detail}` : ''}`);
  } catch (err) {
    echecs++;
    console.log(`ÉCHEC ${nom} (${Date.now() - debut} ms) : ${err.message}`);
  }
}

function attendu(condition, message) {
  if (!condition) throw new Error(message);
}

async function executer(code) {
  let sortie = '';
  const r = await repl.executer(code, {
    surSortie: (t) => {
      sortie += t;
    },
  });
  return { ...r, sortie };
}

await verifier('interrompre (invite >>>)', async () => {
  attendu(await repl.interrompre(), 'pas d’invite >>> : MicroPython est-il installé ?');
});

await verifier('print(1+1)', async () => {
  const r = await executer('print(1+1)');
  attendu(r.sortie === '2\r\n' && r.erreur === null, JSON.stringify(r));
  return JSON.stringify(r.sortie);
});

await verifier('traceback de 1/0', async () => {
  const r = await executer('1/0');
  attendu(/ZeroDivisionError/.test(r.erreur ?? ''), JSON.stringify(r));
});

await verifier('code UTF-8 et sortie continue (300 lignes)', async () => {
  const r = await executer('for i in range(300):\n    print("ligne", i, "é")\n');
  const lignes = r.sortie.split('\r\n').filter(Boolean);
  attendu(r.erreur === null, r.erreur);
  attendu(lignes.length === 300 && lignes[299] === 'ligne 299 é', `${lignes.length} lignes`);
});

const contenu = `# é "x" 'y' \\ \x04 fin\nLED = 'ok-ram'\nTEXTE = "été"\n`;
const gros = Array.from({ length: 400 }, (_, i) => `V${i} = "é${i}"\n`).join('') + 'FIN = 1\n';

await verifier('fichier /ram (é, guillemets, \\, \\x04) relu et importé', async () => {
  await repl.ecrireFichierRam('essai_ram.py', contenu);
  const attenduB64 = Buffer.from(contenu, 'utf8').toString('base64');
  const r = await executer(
    "import binascii\nprint(binascii.b2a_base64(open('/ram/essai_ram.py', 'rb').read()).decode().strip())\nimport essai_ram\nprint(essai_ram.LED, essai_ram.TEXTE)\n",
  );
  attendu(r.erreur === null, r.erreur);
  const [b64, valeurs] = r.sortie.split('\r\n');
  attendu(b64 === attenduB64, `contenu relu différent : ${b64}`);
  attendu(valeurs === 'ok-ram été', valeurs);
});

await verifier(
  `second fichier /ram (${Buffer.byteLength(gros)} octets, disque déjà monté)`,
  async () => {
    await repl.ecrireFichierRam('essai_gros.py', gros);
    const r = await executer(
      "import os, essai_gros\nprint(essai_gros.FIN, essai_gros.V399, sorted(os.listdir('/ram')))\n",
    );
    attendu(r.erreur === null, r.erreur);
    attendu(r.sortie === "1 é399 ['essai_gros.py', 'essai_ram.py']\r\n", JSON.stringify(r.sortie));
  },
);

await verifier('lireVersion', async () => {
  const version = await repl.lireVersion();
  attendu(version === null || typeof version === 'string', String(version));
  return JSON.stringify(version);
});

await verifier('arreter un programme sans fin', async () => {
  let sortie = '';
  const execution = repl.executer(
    'import time\nwhile True:\n    print("tic")\n    time.sleep_ms(100)\n',
    {
      surSortie: (t) => {
        sortie += t;
      },
    },
  );
  await new Promise((r) => setTimeout(r, 1500));
  attendu(sortie.includes('tic'), 'aucune sortie pendant que le programme tourne');
  await repl.arreter();
  const r = await execution;
  attendu(r.arrete === true && r.erreur === null, JSON.stringify(r));
  return `${sortie.split('tic').length - 1} « tic » reçus`;
});

await verifier('invite >>> après arreter', async () => {
  attendu(await repl.interrompre(), 'pas d’invite >>>');
});

dap.stopSerialRead();
await new Promise((r) => setTimeout(r, 100));
await dap.disconnect();
console.log(echecs === 0 ? 'Tout a réussi.' : `${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);
