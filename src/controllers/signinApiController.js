const logger = require("../utils/logger");
const RequestError = require("../utils/RequestError");
const VerifySignature = require("../web3/signature");
const verificationRequestValidator = require("../validators/VerificationRequestValidator");
const VerificationRequest = require("../db/models/verificationRequest");
const User = require("../db/models/user");

const DiscordBot = require("../discordBot");
const { manageRolesOfUser } = require("../discordBot/roleManager");

const ruleExecutor = require("../rules/RuleExecutor");

class SignInApiController {
  //processes requests for sign in using web 3
  async post(req, res) {
    const message = req.body;

    if (!message) {
      throw new RequestError({
        statusCode: 422,
        message: "Could not process the sign in request.",
      });
    }

    //retrieve original verification request record which was provided to
    //the user on the sign in page
    const verificationRequestRecord = await VerificationRequest.findOne({
      requestId: message.nonce,
    }).exec();

    //validate the verification request record
    const validationResult = verificationRequestValidator.validate(
      verificationRequestRecord
    );

    if (!validationResult.isValid()) {
      logger.error(
        `Verification requestId ${
          verificationRequestRecord.requestId
        } from wallet: ${message.address} failed.
        Validation Error: ${validationResult.getErrorMessage()}`
      );

      throw new RequestError(400, validationResult.getErrorMessage());
    }

    //verify the users signature
    await this.verifySignature(message);

    //retrive the first user found tied to the wallet address of signer
    //or a new user record if none exists
    const user = await this.getUser(
      message.address
    );
    
    user.userId = verificationRequestRecord.userId;
    user.walletAddress = message.address;
    user.lastVerified = verificationRequestRecord.ts;

    //run each of the rules specified from settings.js
    const status = await ruleExecutor.run(user);

    //mark verification request complete
    // verificationRequestRecord.completed = true;
    // verificationRequestRecord.save();

    user.status = status;
    user.save();

    // return something to frontend .. we're done here
    res
      .status(200)
      .json({
        status,
      })
      .end();
  }

  async getUser(walletAddress) {
    const user = await User.findOne({ walletAddress: walletAddress}).exec();
    return user || new User();
  }

  async verifySignature(message) {
    //verify web 3 signature
    const signatureVerified = await VerifySignature(message);

    if (!signatureVerified) {
      logger.error(
        `Signature verification from wallet: ${message.address} failed.`
      );
      // signature could not be verified, abort mission
      res.status(422).json({ message: "Could not verify signature." }).end();
      return;
    }
  }
}

module.exports = new SignInApiController();