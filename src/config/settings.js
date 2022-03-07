/*##############################################################################
# File: outliners-settings.js                                                  #
# Project: Outliners Discord Bot for Anonymice                                 #
# Author: Doyler (@NftDoyler)                                                  #
# Original Author(s): Oliver Renner (@_orenner) & slingn.eth (@slingncrypto)   #
# © 2021                                                                       #
###############################################################################*/

const AnonymiceABI = require("../contracts/mice_abi.json");
const CheethABI = require("../contracts/cheeth_abi.json");
const AnonymiceBreedingABI = require("../contracts/baby_mice_abi.json");

const settings = {
  rules: [
    {
      name: "Outliners Verifier for Anonymice",
      executor: {
        type: "OutlinersVerificationRule.js",
        config: {
          roles: [
            {
              // Make sure that these values are correct
              name: "Outliners OG",
              id: "950273459013955614"
            }
          ],
          AnonymiceContract: {
            Address: "0xC7492fDE60f2eA4DBa3d7660e9B6F651b2841f00",
            ABI: AnonymiceABI,
          },
          CheethContract: {
            Address: "0x5f7BA84c7984Aa5ef329B66E313498F0aEd6d23A",
            ABI: CheethABI,
          },
          AnonymiceBreedingContract: {
            Address: "0x15cc16bfe6fac624247490aa29b6d632be549f00",
            ABI: AnonymiceBreedingABI,
          }
        },
      },
    },
  ],
};

module.exports = settings;