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
    const nbFirstBytes = 1;
    const concatenatedHash = await generateConcatenatedHash(mnemonic, nbFirstBytes);
    const checksum = (await doubleSha256(concatenatedHash)).substring(0, 8);
    const inputWithChecksum = concatenatedHash + checksum;
    const encoded = base58Encode(inputWithChecksum);

    // perform check. Massa generated private keys 
    // should be between 18 (included) to 62 (included) characters
    if (encoded.length < 18 || encoded.length > 62) {
        print_logs_in_page("Error: generated private key is invalid. Please check your mnemonic and try again.");
    }

    return 'S' + encoded;
}

// Button Functions
async function processInput(idTextarea) {
    print_logs_in_page("Generating Private Key from Mnemonic for Massa.");
    const input = document.getElementById(idTextarea).value;
    const res = await generateMassaPrivateKeyFromMnemonic(input);

    document.getElementById("result_textarea").value = res;
}

function clearTextarea(textareaIds) {
    textareaIds.forEach((id) => {
        document.getElementById(id).value = "";
    });

    clear_logs_in_page();
}

function generateRandomListOfWords(idTextarea) {
    const nbWords = 32;
    let words = [];
    try {
        words = generateRandomWords(nbWords);
    } catch (e) {
        print_logs_in_page(e);
        words = ["Error", "loading", "random", "words", "file", "from", "docs/res/random_words.txt", "Please", "check", "the", "file", "and", "try", "again", "or", "use", "your", "own", "list", "of", "words"];
    }

    const mnemonic = words.join(" ");
    document.getElementById(idTextarea).value = mnemonic;
}

function arrangementWithRepetition(n, k) {
    return Math.pow(n, k);
}

function calculateEntropy(n, k) {
    const arrangements = Math.pow(n, k);
    const entropy = Math.log2(arrangements);
    return entropy;
}

function generateRandomWords(numWords) {
    const words = get_random_word_list();

    // Security: log the combination of words for specified number of words
    const nb_combinations = arrangementWithRepetition(words.length, numWords);
    const entropy = calculateEntropy(words.length, numWords);
    console.log("Number of possible words outcome: " + nb_combinations + " (" + entropy + " bits of entropy)");
  
    const randomWords = [];
    for (let i = 0; i < numWords; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      randomWords.push(words[randomIndex]);
    }
  
    return randomWords;
}

function print_logs_in_page(message) {
    const log_id = "log_area";
    console.log(message);
    document.getElementById(log_id).innerText = message;
}

function clear_logs_in_page() {
    const log_id = "log_area";
    document.getElementById(log_id).innerText = "";
}
  