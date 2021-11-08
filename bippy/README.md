# Bippy

This utility will split a BIP39 seed phrase in 2 parts.

It uses a XOR operation to combine a [One-time pad](https://en.wikipedia.org/wiki/One-time_pad) with the seed,
resulting in
2 new seed phrases. Having just one part won't provide an attacker any useful information - both are required to
regenerate the original seed phrase.

How is this useful ? Here's a few examples:
- Store one part at home, store one part at work,
- Store one part in a password manager, store one part in a safe on paper,
- Keep one part in your wallet, keep one part at your parent's house. etc.
    
Better yet, create 3 different split keys and do all 3.

# Author
Michael McMaster @mmcmaster-au <Michael.McMaster@gmail.com>