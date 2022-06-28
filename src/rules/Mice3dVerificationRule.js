const logger = require("../utils/logger");
const getProvider = require("../web3/provider");
const { Contract } = require("ethers");
const discordBot = require("../discordBot");

/**
 * Anonymice 3d OG Verification Rule - checks for any and all mice to give the appropriate role
 * based on their holdings.Checks for Mice held in the Users wallet, staked for CHEETH
 * or incubating babies in the breeding process.
 * 
 * Modified by Doyler (@NftDoyler) - 0xeD19c8970c7BE64f5AC3f4beBFDDFd571861c3b7
 */
class Mice3dVerificationRule {
    constructor(config) {
        this.config = config;
        this.logger = require("../utils/logger");
        
        // The max number of users that can have the role
        this.maxCount = 10000;
    }

    /**
     * Executes changes to the Discord Users assigned roles using the result from
     * the check method.
     * 
     * As we are only adding ONE role this is a modified version of the AnonymiceVerificationRule.
     * 
     * @param discordUser - The Discord User
     * @param role - The Discord Role which should be affected
     * @param result - The result returned from the check method
     */
    async execute(discordUser, role, result) {
        //  note:   this rule is customized to allow for more than one role assignment so we
        //          can ignore the fact that no specific role has been passed in

        let executionResults = [];

        let discordRoles = await this.getDiscordRoles(this.config.roles);

        let qualifiesForGenesisRole = false;
        let qualifiesForBabyRole = false;

        let genesisRoleConfig = this.config.roles.find(
            (r) => r.name === "genesis mice"
        );
        let genesisRole = discordRoles.find(
            (r) => r.id === genesisRoleConfig.id
        );

        let babyRoleConfig = this.config.roles.find(
            (r) => r.name === "baby mice"
        );
        let babyRole = discordRoles.find(
            (r) => r.id === babyRoleConfig.id
        );

        //let roleCount = await this.getRoleCount(anonymiceRole.id);
        //let roleAvail = (roleCount < this.maxCount);
        let roleAvail = true;

        try {
            qualifiesForGenesisRole =
                result.mice.length > 0 ||
                result.cheethGrinding.length > 0 ||
                result.cheethV2Grinding.length > 0 ||
                result.breeding.length > 0;
            await this.manageRoles(discordUser, genesisRole, qualifiesForGenesisRole, roleAvail);
            executionResults.push({
                role: "genesis mice",
                roleId: genesisRole.id,
                qualified: qualifiesForGenesisRole,
                roleAvailable: roleAvail,
                result: {
                    mice: result.mice,
                    staking: result.cheethGrinding,
                    stakingv2: result.cheethV2Grinding,
                    breeding: result.breeding,
                },
            });
        } catch (err) {
            logger.error(err.message);
            logger.error(err.stack);
        }
        try {
            qualifiesForBabyRole =
                result.babies.length > 0;
            await this.manageRoles(discordUser, babyRole, qualifiesForBabyRole, roleAvail);
            executionResults.push({
                role: "baby mice",
                roleId: babyRole.id,
                qualified: qualifiesForBabyRole,
                roleAvailable: roleAvail,
                result: {
                    babies: result.babies,
                },
            });
        } catch (err) {
            logger.error(err.message);
            logger.error(err.stack);
        }

        return executionResults;
    }

    async check(user) {
        const provider = await getProvider();
        let genesisMiceResult = await this.getGenesisMice(
            this.config.AnonymiceContract,
            user,
            provider
        );
        let babyMiceResult = await this.getBabyMice(
            this.config.AnonymiceBreedingContract,
            user,
            provider
        );
        let cheethGrindingMiceResult = await this.getCheethGrindingMice(
            this.config.CheethContract,
            user,
            provider
        );
        let cheethV2GrindingMiceResult = await this.getCheethV2GrindingMice(
            this.config.CheethV2Contract,
            user,
            provider
        );
        let breedingMiceResult = await this.getBreedingMice(
            this.config.AnonymiceBreedingContract,
            user,
            provider
        );

        let result = {
            mice: genesisMiceResult,
            babies: babyMiceResult,
            cheethGrinding: cheethGrindingMiceResult,
            cheethV2Grinding: cheethV2GrindingMiceResult,
            breeding: breedingMiceResult,
        };
        return result;
    }

    async getRoleCount(roleID) {
        let guild = discordBot.getGuild();
        let members = await guild.members.fetch();
        let memberCount = await guild.roles.cache.get(roleID).members.size;

        return memberCount;
    }

    async getDiscordRoles(rolesConfig) {
        let guild = discordBot.getGuild();
        let roles = [];
        //retrieve each of the discord roles defined in the config
        await rolesConfig.forEachAsync(async (r) => {
            let role = await guild.roles.fetch(r.id, { force: true });
            if (!role) {
                logger.error(
                    `Could not find the role id configured for ${r.name}. Please confirm your configuration.`
                );
                return;
            }
            roles.push(role);
        });

        return roles;
    }

    async getGenesisMice(config, user, provider) {
        let logMessage = `Onliners Verification Rule is executing - Get Genesis Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

        if (!user.walletAddress) {
            logMessage += `
Wallet Address is null/empty. Skipping check against contract and returning 0.`;
            logger.info(logMessage);
            return 0;
        }

        const contract = new Contract(config.Address, config.ABI, provider);

        const result = await contract.balanceOf(user.walletAddress);

        logMessage += `
Result:       ${result}`;
        logger.info(logMessage);

        return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
    }

    async getBabyMice(config, user, provider) {
        let logMessage = `Onliners Verification Rule is executing - Get Baby Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

        if (!user.walletAddress) {
            logMessage += `
Wallet Address is null/empty. Skipping check against contract and returning 0.`;
            logger.info(logMessage);
            return 0;
        }

        const contract = new Contract(config.Address, config.ABI, provider);

        const result = await contract.balanceOf(user.walletAddress);

        logMessage += `
Result:       ${result}`;
        logger.info(logMessage);

        return result.toNumber() > 0 ? [1] : []; // quickfix as we dont get tokenIds
    }

    async getCheethGrindingMice(config, user, provider) {
        let logMessage = `Onliners Verification Rule is executing - Get Cheeth Grinding Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

        if (!user.walletAddress) {
            logMessage += `
Wallet Address is null/empty. Skipping check against contract and returning [].`;
            logger.info(logMessage);
            return [];
        }

        const contract = new Contract(config.Address, config.ABI, provider);

        const result = await contract.getTokensStaked(user.walletAddress);
        logMessage += `
Result:       ${result}`;
        logger.info(logMessage);

        return result.map((r) => r.toNumber());
    }

    async getCheethV2GrindingMice(config, user, provider) {
        let logMessage = `Onliners Verification Rule is executing - Get Cheeth V2 Grinding Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

        if (!user.walletAddress) {
            logMessage += `
Wallet Address is null/empty. Skipping check against contract and returning [].`;
            logger.info(logMessage);
            return [];
        }

        const contract = new Contract(config.Address, config.ABI, provider);

        const result = await contract.tokensStaked(user.walletAddress);
        logMessage += `
Result:       ${result}`;
        logger.info(logMessage);

        return result.map((r) => r.toNumber());
    }

    async getBreedingMice(config, user, provider) {
        let logMessage = `Onliners Verification Rule is executing - Get Breeding Mice:
Contract:       ${config.Address}
Argument(s):    ${user.walletAddress}`;

        if (!user.walletAddress) {
            logMessage += `
Wallet Address is null/empty. Skipping check against contract and returning [].`;
            logger.info(logMessage);
            return [];
        }

        const contract = new Contract(config.Address, config.ABI, provider);

        const pairs = await contract.getBreedingEventsLengthByAddress(
            user.walletAddress
        );
        const results = [];
        for (let i = 0; i < pairs.toNumber(); i++) {
            const breedingEvent = await contract._addressToBreedingEvents(
                user.walletAddress,
                i
            );
            results.push(breedingEvent.parentId1);
            results.push(breedingEvent.parentId2);
        }
        let result = results.map((r) => r.toNumber());

        logMessage += `
Result:       ${results}`;
        logger.info(logMessage);

        return result;
    }

    //todo: cleanup return values arent consumed

    async manageRoles(discordUser, role, qualifies, roleAvail) {
        if (!role) {
            logger.error(
                `Could not locate the ${roleName} discord role using id ${roleId} specified. Please confirm your configuration.`
            );
            return false;
        }

        try {
            if (qualifies) {
                if (roleAvail) {
                    if (!discordUser.roles.cache.has(role.id)) {
                        logger.info(`Assigning Role: ${role.name}`);
                        await discordUser.roles.add(role);
                    }
                    return true;
                }
                else {
                    logger.error(`There are already ${this.maxCount} users with the ${role.name} role.`);
                }
            } else {
                if (discordUser.roles.cache.has(role.id)) {
                    logger.info(`Removing Role: ${role.name}`);
                    await discordUser.roles.remove(role);
                }
                return false;
            }
        } catch (err) {
            logger.error(err.message);
            logger.error(err.stack)
        }
    }
}

module.exports = Mice3dVerificationRule;