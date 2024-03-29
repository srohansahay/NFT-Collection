// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {

 string _baseTokenURI;

 IWhitelist whitelist;

 bool public presaleStarted;

 uint256 public presaleEnded;

 uint256 public tokenIds;

 uint256 public maxtokenIds = 20;

 uint256 public _price = 0.01 ether;

 bool public _paused;

 modifier OnlyWhenNotPaused {
  require(!_paused,"Contract is currently paused");
  _;
 }


 constructor(string memory baseURI, address whitelistContract) ERC721("Crypto Devs","CD") {
  _baseTokenURI = baseURI;
  whitelist = IWhitelist(whitelistContract);
 }

 function startPresale() public onlyOwner {
  presaleStarted = true;
  presaleEnded = block.timestamp + 5 minutes;
 }

 function presaleMint() public payable OnlyWhenNotPaused{
  require(presaleStarted && block.timestamp < presaleEnded,"Presale has ended");
  require(whitelist.whitelistedAddresses(msg.sender),"User is not whitelisted");
  require(tokenIds < maxtokenIds,"Tokens limit exceeded");
  require(msg.value >= _price,"Ethers sents is not sufficient");

  tokenIds += 1;

  _safeMint(msg.sender,tokenIds);

 }

 function mint() public payable OnlyWhenNotPaused{
  require(presaleStarted && block.timestamp > presaleEnded,"Presale has not yet ended");
  require(tokenIds < maxtokenIds,"Tokens limit exceeded");
  require(msg.value >= _price,"Ethers sents is not sufficient");

  tokenIds += 1;

  _safeMint(msg.sender,tokenIds);

 }

 function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
 }

 function _setPaused(bool val) public onlyOwner{
   _paused = val;
 }


 function withdraw() public onlyOwner {
  address _owner = owner();
  uint256 amount = address(this).balance;
  (bool sent, )= _owner.call{value: amount}("");
  require(sent,"Failed to send ether");

 }

 receive() external payable{}

 fallback() external payable{}

}

