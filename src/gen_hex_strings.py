"""
Doing test about Mnemonic secret key for Address Generation.

Note from Aurelien: Nos clés ne sont pas du base58 seul 
c'est expliqué ici : https://docs.massa.net/docs/learn/architecture/basic-concepts#secret-key 
alors je viens de voir que le fromat en text est super a jour c'est:
    'S' + base58encode(varintencode(VERSION_NUMBER) + bytes) 
avec VERSION_NUMBER = 0 pour l'instant
"""

import os
import binascii
import sys
import argparse
import hashlib
import base58

MASSA_VERSION_NUMBER = 0

# -------------------- CLI arguments -------------------- #
# wrapped program flags
class CLIArguments:
    args: argparse.Namespace

    def __init__(self) -> None:
        self.__log_raw_argv()
        self.__parse_argv()
    
    def __log_raw_argv(self) -> None:
        print("Passed program params:")
        for i in range(len(sys.argv)):
            print("param[{0}]: {1}".format(
                i, sys.argv[i]
            ))
    
    def __parse_argv(self) -> None:
        """
        python main [ARGUMENTS ...]
        """
        parser = argparse.ArgumentParser(description='Program [ARGUMENTS]')
        parser.add_argument(
            '--debug', 
            action='store_true',
            help="debug, True or False"
        )
        # add file path or directory path argument
        parser.add_argument(
            '--input',
            type=str,
            help="String or sequence of words (ex: \"hello world\") to generate a hex string from."
        )
        # nb bytes to take from each hash
        parser.add_argument(
            '--nb-bytes',
            type=int,
            default=4,
            help="Number of bytes to take from each hash."
        )

        # save parsed arguments
        self.args = parser.parse_args()

        # overwrite debug flag
        os.environ["DEBUG"] = "True" if self.args.debug else "False"

        # log parsed arguments
        print("Parsed program params:")
        for arg in vars(self.args):
            print("{0}: {1}".format(
                arg, getattr(self.args, arg)
            ))


def generate_hex_string(input_string=None):
    if input_string:
        input_bytes = input_string.encode('utf-8')
        needed_bytes = 32 - len(input_bytes)
    else:
        input_bytes = b''
        needed_bytes = 32

    if needed_bytes > 0:
        random_bytes = os.urandom(needed_bytes)
    else:
        random_bytes = b''

    final_bytes = input_bytes[:32] + random_bytes
    assert len(final_bytes) == 32
    hex_string = binascii.hexlify(final_bytes).decode('utf-8')
    
    return hex_string

def decode_hex_string(hex_string):
    """
    Returns a string in UTF-8 encoding, given a hex string.
    """
    try:
        res = binascii.unhexlify(hex_string).decode('utf-8')
    except binascii.Error:
        print("ERROR: Invalid hex string error: {}".format(hex_string))
        res = None
    except UnicodeDecodeError:
        print("ERROR: Invalid UTF-8 encoding: {}".format(hex_string))
        res = None
    return res

def generate_concatenated_hash(words, nb_first_bytes):
    concatenated_bytes = b''
    word_list = words.split()
    
    for word in word_list:
        # Create a SHA-256 hash object
        sha256_hash = hashlib.sha256()
        
        # Update the hash object with the bytes of the word
        sha256_hash.update(word.encode())
        
        # Get the hash bytes
        hash_bytes = sha256_hash.digest()
        
        # Take the first nb_first_bytes from the hash
        truncated_bytes = hash_bytes[:nb_first_bytes]
        
        # Concatenate the truncated bytes
        concatenated_bytes += truncated_bytes
    
    # Convert concatenated bytes to hex string
    print("generate_concatenated_hash:", binascii.hexlify(concatenated_bytes).decode('utf-8'))
    
    return concatenated_bytes

def double_sha256(data):
    return hashlib.sha256(hashlib.sha256(data).digest()).digest()

def base58_encode(bytes_input):
    """
    Base58 encoding function.
    Uses the 4 bytes checksum at the end of the input bytes.
    """
    alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    num = int.from_bytes(bytes_input, 'big')
    encode = ''
    
    while num > 0:
        num, remainder = divmod(num, 58)
        encode = alphabet[remainder] + encode
    
    pad = 0
    for b in bytes_input:
        if b == 0:
            pad += 1
        else:
            break
    
    return alphabet[0] * pad + encode

def base58_decode(base58_input):
    """
    Decodes a Base58 string into bytes
    """
    alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    num = 0
    for char in base58_input:
        num *= 58
        num += alphabet.index(char)
    
    num_bytes = num.to_bytes((num.bit_length() + 7) // 8, 'big')
    return num_bytes

def bytes_to_base58_library(input: bytes) -> str:
    """
    Converts input bytes to a base58 encoded string with a checksum.
    """
    return base58.b58encode_check(input).decode('utf-8')


def check_base58_checksum(base58_input):
    """
    Checks the checksum of a base58 encoded string.
    Returns True if the checksum is valid, False otherwise.
    """
    decoded = base58_decode(base58_input)
    payload = decoded[:-4]
    checksum = decoded[-4:]
    new_checksum = double_sha256(payload)[:4]
    
    return new_checksum == checksum

def check_base58_from_library(base58_str):
    """
    Checks if a string is a valid base58 encoded string with a correct checksum.
    Returns True if valid, False otherwise.
    """
    try:
        base58.b58decode_check(base58_str)
        return True
    # if any error, print error and return False
    except Exception as e:
        print("ERROR: Invalid base58 string: {}".format(base58_str))
        return False

def generate_massa_private_key(mnemonix, nb_bytes):
    """
    Generates a MASSA private key from a mnemonic.
    """
    # Generate bytes from the mnemonic
    bytes_from_mnemonic = generate_concatenated_hash(mnemonix, nb_bytes)
    
    # Add the version number to first byte
    versioned_bytes = bytes([MASSA_VERSION_NUMBER]) + bytes_from_mnemonic
    
    # Compute the checksum
    checksum = double_sha256(versioned_bytes)[:4]
    
    # Concatenate the versioned bytes and the checksum
    input_with_checksum = versioned_bytes + checksum
    
    # Encode the input with checksum
    encoded = base58_encode(input_with_checksum)
    
    # Add the 'S' prefix
    final_private_key = 'S' + encoded

    # Check the length of the private key
    if len(final_private_key) != 51:
        print("WARNING: MASSA private key should be 51 characters long, but is:", len(final_private_key))
    
    return final_private_key

if __name__ == "__main__":
    cli_args = CLIArguments()

    # example base58
    print("--- Reverse engineering example base58 from MASSA Wallet gen ---")
    example_base58 = "S12mnpzhmnE88zhwPKssESnz4BybRQoeEMh28WTx8VKPEJffHegw" # generated from https://massa.net/testnet/wallet
    example_base58_payload_checksum = example_base58.replace("S1", "")
    print(f"Test Base58 checksum validity: {check_base58_checksum(example_base58_payload_checksum)}", "and from library:", check_base58_from_library(example_base58_payload_checksum))
    example_base58_decoded = base58_decode(example_base58.replace("S", ""))
    print("MASSA decoded:", example_base58_decoded, "of length:", len(example_base58_decoded))
    print("--- --- ---")

    # some testing 
    test_bytes_hello_world = b"hello world"
    print("test_hello_word_with_checksum as list of bytes:", list(test_bytes_hello_world))

    # generate MASSA private key from mnemonic    
    private_key = generate_massa_private_key(cli_args.args.input, cli_args.args.nb_bytes)
    print(">>> MASSA private key:", private_key, "of nb chars:", len(private_key))

