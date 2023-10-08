// SHA256 Hashing using Web Crypto API
async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = new Uint8Array(hashBuffer);
    return hashArray;
}

// Base58 encoding
function byteArrayToBigInt(byteArray) {
    let value = BigInt(0);
    for (let i = 0; i < byteArray.length; i++) {
        value = (value << BigInt(8)) + BigInt(byteArray[i]);
    }
    return value;
}

function byteArrayToBigInt(byteArray) {
    let value = BigInt(0);
    for (let i = 0; i < byteArray.length; i++) {
        value = (value << BigInt(8)) + BigInt(byteArray[i]);
    }
    return value;
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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

// This is a developer test function
function test_base58Encode() {
    const buffer = new Uint8Array([]);
    const encodedString = base58Encode(buffer);
    if (encodedString !== '') {
        throw new Error("Error: base58Encode([]) should be empty string");
    }

    const buffer2 = new Uint8Array([72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100]);
    const encodedString2 = base58Encode(buffer2);
    if (encodedString2 !== '1L625c4e3664332452b9') {
        throw new Error("Error: base58Encode('Hello, world!') should be 1L625c4e3664332452b9");
    }

    const buffer3 = new Uint8Array(100).fill((Math.random() * 255) | 0);
    const encodedString3 = base58Encode(buffer3);
    if (encodedString3.length !== 137) {
        throw new Error("Error: base58Encode(random) should be 137 characters");
    }
}

// Test the function
const uint8Array = new Uint8Array([255, 254, 253, 252]);
console.log("Output should be 8Vh1Nm134: ", base58Encode(uint8Array));  // Output should be "8Vh1Nm134"

// Generate concatenated hash
async function generateConcatenatedHash(words) {
    const wordList = words.split(" ");
    const nbBytes = wordList.length; // 1 byte per word
    let concatenatedHash = new Uint8Array(nbBytes);

    for (let i = 0; i < nbBytes; i++) {
        const word = wordList[i];
        const word_buffer = new TextEncoder().encode(word);
        const hash = await sha256(word_buffer);
        concatenatedHash[i] = hash[0]; // keep only first byte
    }

    return concatenatedHash
}

async function checkPayloadWithChecksum(buffer) {
    var payload = buffer.slice(0, -4)
    var checksum = buffer.slice(-4, buffer.length)

    // double_sha256(payload)[:4]
    let newChecksum = (await sha256(payload)).slice(0, 4);

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
async function generateMassaPrivateKeyFromMnemonic(mnemonic) {
    const payload = await generateConcatenatedHash(mnemonic);
    const checksum = await sha256(payload);
    console.log("concatenatedHash:", payload);

    let buffer = new Uint8Array(payload.length + 4); // create a new buffer
    buffer.set(payload); // copy concatenatedHash to buffer
    // copy first 4 bytes of hashed payload to end of buffer (this is the checksum)
    buffer.set(checksum.slice(0, 4), payload.length); 
    console.log(">>> buffer:", buffer);
    checkPayloadWithChecksum(buffer);

    const encoded = base58Encode(buffer);

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
  