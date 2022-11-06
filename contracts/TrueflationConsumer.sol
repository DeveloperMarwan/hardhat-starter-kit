// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";


contract TruflationConsumer is ChainlinkClient, ConfirmedOwner {
  using Chainlink for Chainlink.Request;
  
  string public yoyInflation;
  address public oracleId;
  // string public jobId;
  bytes32 private jobId;
  uint256 public fee;

  // Please refer to
  // https://github.com/truflation/quickstart/blob/main/network.md
  // for oracle address. job id, and fee for a given network

  constructor(
    address oracleId_,
    bytes32 jobId_,
    uint256 fee_,
    address _link
  ) ConfirmedOwner(msg.sender) {
    // setPublicChainlinkToken();
    if (_link == address(0)) {
        setPublicChainlinkToken();
    } else {
        setChainlinkToken(_link);
    }

    // use this for Goerli (chain: 5)
    // setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
    
    oracleId = oracleId_;
    jobId = jobId_;
    fee = fee_;
  }

        
  function requestYoyInflation() public returns (bytes32 requestId) {
    Chainlink.Request memory req = buildChainlinkRequest(
      jobId,
      address(this),
      //this.fulfillYoyInflation.selector
      this.fulfillInflationWei.selector
    );
    req.add("service", "truflation/current");
    req.add("keypath", "yearOverYearInflation");
    req.add("abi", "json");
    return sendChainlinkRequestTo(oracleId, req, fee);
  }

  function fulfillYoyInflation(
    bytes32 _requestId,
    bytes memory _inflation
  ) public recordChainlinkFulfillment(_requestId) {
    yoyInflation = string(_inflation);
  }

  function changeOracle(address _oracle) public onlyOwner {
    oracleId = _oracle;
  }

  function changeJobId(bytes32 _jobId) public onlyOwner {
    jobId = _jobId;
  }

  function getChainlinkToken() public view returns (address) {
    return chainlinkTokenAddress();
  }

  function withdrawLink() public onlyOwner {
    LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
    require(link.transfer(msg.sender, link.balanceOf(address(this))),
    "Unable to transfer");
  }

  // The following are for retrieving inflation in terms of wei
  // This is useful in situations where you want to do numerical
  // processing of values within the smart contract

  // This will require a int256 rather than a uint256 as inflation
  // can be negative

  int256 public inflationWei;
  function requestInflationWei() public returns (bytes32 requestId) {
    Chainlink.Request memory req = buildChainlinkRequest(
      jobId,
      address(this),
      this.fulfillInflationWei.selector
    );
    req.add("service", "truflation/current");
    req.add("keypath", "yearOverYearInflation");
    req.add("abi", "int256");
    req.add("multiplier", "1000000000000000000");
    return sendChainlinkRequestTo(oracleId, req, fee);
  }

  function fulfillInflationWei(
    bytes32 _requestId,
    bytes memory _inflation
  ) public recordChainlinkFulfillment(_requestId) {
    // _inflation = "7256429882893159000"; // we are hard coding the value when running locally!
    inflationWei = 7256429882893159000; //bytes32(bytes(jobId))
  }

  function toInt256(bytes memory _bytes) internal pure
  returns (int256 value) {
    assembly {
      value := mload(add(_bytes, 0x20))
    }
  }
}