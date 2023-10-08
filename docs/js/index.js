// SHA256 Hashing using Web Crypto API
async function sha256(data) {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Double SHA256
async function doubleSha256(data) {
    const firstHash = await sha256(data);
    return sha256(firstHash);
}

// Base58 encoding
function byteArrayToBigInt(byteArray) {
    let value = BigInt(0);
    for (let i = 0; i < byteArray.length; i++) {
        value = (value << BigInt(8)) + BigInt(byteArray[i]);
    }
    return value;
}

function base58Encode(hexString) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let encoded = '';
    let num = byteArrayToBigInt(new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))));

    while (num > 0) {
        const divmod = num % BigInt(58);
        encoded = alphabet[Number(divmod)] + encoded;
        num = num / BigInt(58);
    }

    return encoded;
}

// Generate concatenated hash
async function generateConcatenatedHash(words, nbFirstBytes) {
    const wordList = words.split(" ");
    let concatenatedHash = "";

    for (const word of wordList) {
        const hash = await sha256(word);
        const truncatedHash = hash.substring(0, nbFirstBytes * 2);
        concatenatedHash += truncatedHash;
    }

    return concatenatedHash;
}

// Generate Massa private key
async function generateMassaPrivateKeyFromMnemonic(mnemonic) {
    const nbFirstBytes = 2;
    const concatenatedHash = await generateConcatenatedHash(mnemonic, nbFirstBytes);
    const checksum = (await doubleSha256(concatenatedHash)).substring(0, 8);
    const inputWithChecksum = concatenatedHash + checksum;
    const encoded = base58Encode(inputWithChecksum);

    return 'S' + encoded;
}

// Button Functions
async function processInput(idTextarea) {
    console.log("Generate Private Key from Mnemonic for Massa");
    const input = document.getElementById(idTextarea).value;
    const res = await generateMassaPrivateKeyFromMnemonic(input);

    document.getElementById("result_textarea").value = res;
}

function clearTextarea(textareaIds) {
    textareaIds.forEach((id) => {
        document.getElementById(id).value = "";
    });
}

function generateRandomListOfWords(idTextarea) {
    const nbWords = 16;
    let words = [];
    try {
        let words = generateRandomWords(16);
    } catch (e) {
        console.log(e);
        words = ["Error", "loading", "random", "words", "file", "from", "docs/res/random_words.txt", "Please", "check", "the", "file", "and", "try", "again", "or", "use", "your", "own", "list", "of", "words"];
    }

    document.getElementById("result_textarea").value = words;
}

async function generateRandomWords(numWords) {
    const response = await fetch('docs/res/random_words.txt');
    const data = await response.text();
    const words = data.split(/\s+/);
  
    const randomWords = [];
    for (let i = 0; i < numWords; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      randomWords.push(words[randomIndex]);
    }
  
    return randomWords;
}
  
  // Example usage
generateRandomWords(5).then((randomWords) => {
    console.log(randomWords);
});
  