# Massa Private Key generator using Mnemonic

A mnemonic is typically used to generate private keys. The idea is to base the generation of the private key on a collection of words. This way, you do not need to remember the private key directly, but a list of words or text, which is much easier.

Note that you should still rely on randomness. You list of words should be random to avoid any issue with bruteforce attacks.

## GitHub Pages

Hosted on [GitHub Pages](https://0nyr.github.io/massa_private_key_mnemonic_gen/).

## Credits

* Fira Code Nerd Font, from [Nerd Font Project](https://github.com/ryanoasis/nerd-fonts). Copyright (c) 2014, The Fira Code Project Authors (https://github.com/tonsky/FiraCode)

## Security aspects of random word mnemonic

The random word generator has 120 words. 32 words are choosen randomly. This is an arrangment with repetitions.

n = 120

k = 32

There are n^k arrangements, for an entropy of log2(arrangements).

`Number of possible words outcome: 3.418218918716685e+66 (221.0204990594726 bits of entropy)`

Note that modern encryption schemes often require at least 128 bits of entropy, and
some go up to 256 bits or more for higher levels of security. A low entropy means that an attacker would have a relatively easier time cracking the key through brute-force methods. Add more words to the list, or add your own, to increase those numbers and improve security.

## TODO

* [ ] Add unit tests
* [ ] Add a Favicon
* [X] Display error message if generated key doesn't have the right character size. More info [here](https://docs.massa.net/docs/learn/architecture/basic-concepts#secret-key).
* [ ] Host on Massa blockchain directly
* [ ] Add improved way to get random words. For now, a single list is actually enough.
* [ ] Add the address value generated from the key, alongside the result private key from mnemonic.
