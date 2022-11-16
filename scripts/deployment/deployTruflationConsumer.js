const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")
const LINK_TOKEN_ABI = require("@chainlink/contracts/abi/v0.4/LinkToken.json")

async function deployTruflationConsumer(chainId) {
    //set log level to ignore non errors
    ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

    const accounts = await ethers.getSigners()
    const deployer = accounts[0]

    let linkToken
    let mockOracle
    let linkTokenAddress
    let oracleAddress

    if (chainId == 31337) {
        const linkTokenFactory = await ethers.getContractFactory("LinkToken")
        linkToken = await linkTokenFactory.connect(deployer).deploy()

        const mockOracleFactory = await ethers.getContractFactory("MockOracle")
        mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)

        linkTokenAddress = linkToken.address
        oracleAddress = mockOracle.address
    } else {
        oracleAddress = networkConfig[chainId]["oracle"]
        linkTokenAddress = networkConfig[chainId]["linkToken"]
        linkToken = new ethers.Contract(linkTokenAddress, LINK_TOKEN_ABI, deployer)
    }
    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["trufluationJobId"])
    const fee = networkConfig[chainId]["fee"]

    console.log("LINK token address: ", linkTokenAddress);
    console.log("Truflation Oracle Address: ", oracleAddress);
    console.log("Truflation Job Id: ", networkConfig[chainId]["trufluationJobId"]); //29fa9aa13bf1468788b7cc4a500a45b8
    console.log("Truflation fee: ", fee);

    const truflationConsumerFactory = await ethers.getContractFactory("TruflationConsumer")
    const truflationConsumer = await truflationConsumerFactory.deploy(oracleAddress, jobId, fee, linkTokenAddress)

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    await truflationConsumer.deployTransaction.wait(waitBlockConfirmations)

    console.log(`TruflationConsumer deployed to ${truflationConsumer.address} on ${network.name}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: truflationConsumer.address,
            constructorArguments: [oracleAddress, jobId, fee, linkTokenAddress],
        })
    }

    // auto-funding
    const fundAmount = networkConfig[chainId]["fundAmount"]
    await linkToken.transfer(truflationConsumer.address, fundAmount)

    console.log(`TruflationConsumer funded with ${fundAmount} JUELS`)
}

module.exports = {
    deployTruflationConsumer,
}
