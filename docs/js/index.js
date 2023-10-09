const MASSA_PRIVATE_KEY_VERSION_NUMBER = 0;
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// SHA256 Hashing using Web Crypto API
async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = new Uint8Array(hashBuffer);
    return hashArray;
}

async function double_sha256(buffer) {
    const hash_buffer = await sha256(buffer);
    return sha256(hash_buffer);
}

// functions for Base58 encoding
function byteArrayToBigInt(byteArray) {
    let value = BigInt(0);
    for (let i = 0; i < byteArray.length; i++) {
        value = (value << BigInt(8)) + BigInt(byteArray[i]);
    }
    return value;
}

function base58Encode(buffer) {
    // Count leading zeros
    let zeroCount = 0;
    while (buffer[zeroCount] === 0) {
    zeroCount++;
    }

    // Convert the buffer to a big integer.
    let big_int = byteArrayToBigInt(buffer);

    // Initialize the base58 encoded string.
    let encodedString = '';

    // Repeatedly divide the big integer by 58 and add the remainder to the base58 encoded string.
    while (big_int > 0) {
    const remainder = big_int % 58n;
    encodedString = ALPHABET[Number(remainder)] + encodedString;
    big_int /= 58n;
    }

    // Prepend leading zeros
    while (zeroCount > 0) {
    encodedString = '1' + encodedString;
    zeroCount--;
    }

    // Return the base58 encoded string.
    return encodedString;
}

// Generate concatenated hash
async function generateConcatenatedHash(words) {
    const wordList = words.split(" ");
    const nbBytes = wordList.length; // 1 byte per word
    let concatenatedHash = new Uint8Array(nbBytes);

    for (let i = 0; i < nbBytes; i++) {
        const word = wordList[i];
        const word_buffer = new TextEncoder().encode(word);
        const hash = await sha256(word_buffer);
        concatenatedHash[i] = hash[0]; // keep only the first byte of hashed word
    }

    return concatenatedHash
}

async function checkPayloadWithChecksum(buffer) {
    var payload = buffer.slice(0, -4)
    var checksum = buffer.slice(-4, buffer.length)

    // double_sha256(payload)[:4]
    let newChecksum = (await double_sha256(payload)).slice(0, 4);

    console.log("payload:", payload);
    console.log("checksum:", checksum);
    console.log("newChecksum:", newChecksum);

    if (checksum[0] ^ newChecksum[0] |
        checksum[1] ^ newChecksum[1] |
        checksum[2] ^ newChecksum[2] |
        checksum[3] ^ newChecksum[3]
    ) {
        throw new Error('Invalid checksum')
    }
}

// Generate Massa private key
// mnemonic: string of words separated by space
async function generateMassaPrivateKeyFromMnemonic(mnemonic, nbBytes) {
    // Generate bytes from mnemonic
    const bytesFromMnemonic = await generateConcatenatedHash(mnemonic, nbBytes);

    // Add version number as the first byte
    const versionedBytes = Uint8Array.from([MASSA_PRIVATE_KEY_VERSION_NUMBER, ...bytesFromMnemonic]);

    // Compute checksum
    const checksum = await double_sha256(versionedBytes);
    const checksumFirst4Bytes = checksum.slice(0, 4);

    // Concatenate versionedBytes and checksum
    const inputWithChecksum = new Uint8Array([...versionedBytes, ...checksumFirst4Bytes]);

    // Base58 encode the concatenated byte array
    const encoded = base58Encode(inputWithChecksum);

    // Add 'S' prefix
    const finalPrivateKey = 'S' + encoded;

    // Perform length check
    if (finalPrivateKey.length !== 51) {
        print_logs_in_page(`WARNING: MASSA private key should be 51 characters long, but is: ${finalPrivateKey.length}`);
    }

    return finalPrivateKey;
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
  