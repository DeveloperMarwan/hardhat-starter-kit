const { ethers, network, run } = require("hardhat")
const {
    VERIFICATION_BLOCK_CONFIRMATIONS,
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

async function deployPriceConsumerV3(chainId) {
    let priceFeedAddress, weth_priceFeedAddress, wbtc_priceFeedAddress, vMATIC_priceFeedAddress;

    if (developmentChains.includes(network.name)) {
        const DECIMALS = "18"
        const INITIAL_PRICE = "200000000000000000000"

        const WETH_DECIMALS = "8"
        const WETH_INITIAL_PRICE = "300000000000000000000"

        const WBTC_DECIMALS = "8"
        const WBTC_INITIAL_PRICE = "400000000000000000000"

        const vMATIC_TOKEN_DECIMALS = "18"
        const vMATIC_TOKEN_PRICE = "100000000000000000000"

        const mockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator")
        const mockV3Aggregator = await mockV3AggregatorFactory.deploy(DECIMALS, INITIAL_PRICE)
        console.log(`mock aggregator deployed to ${mockV3Aggregator.address} on ${network.name}`)    
        const mockV3Aggregator_weth = await mockV3AggregatorFactory.deploy(WETH_DECIMALS, WETH_INITIAL_PRICE)
        console.log(`WETH mock aggregator deployed to ${mockV3Aggregator_weth.address} on ${network.name}`)    
        const mockV3Aggregator_wbtc = await mockV3AggregatorFactory.deploy(WBTC_DECIMALS, WBTC_INITIAL_PRICE)
        console.log(`WBTC mock aggregator deployed to ${mockV3Aggregator_wbtc.address} on ${network.name}`)
        const mockV3Aggregator_vMATIC = await mockV3AggregatorFactory.deploy(vMATIC_TOKEN_DECIMALS, vMATIC_TOKEN_PRICE)
        console.log(`BaseToken vMATIC mock aggregator deployed to ${mockV3Aggregator_vMATIC.address} on ${network.name}`)

        priceFeedAddress = mockV3Aggregator.address;
        weth_priceFeedAddress = mockV3Aggregator_weth.address;
        wbtc_priceFeedAddress = mockV3Aggregator_wbtc.address;
        vMATIC_priceFeedAddress = mockV3Aggregator_vMATIC.address;
    } else {
        priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const priceConsumerV3Factory = await ethers.getContractFactory("PriceConsumerV3")
    const priceConsumerV3 = await priceConsumerV3Factory.deploy(priceFeedAddress)

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    await priceConsumerV3.deployTransaction.wait(waitBlockConfirmations)

    console.log(`ETH/USD Price Consumer deployed to ${priceConsumerV3.address} on ${network.name}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await run("verify:verify", {
            address: priceConsumerV3.address,
            constructorArguments: [priceFeedAddress],
        })
    }
}

module.exports = {
    deployPriceConsumerV3,
}
