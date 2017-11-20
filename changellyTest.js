var TestRPC = require("ethereumjs-testrpc");
var Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var async = require('async');
var assert = require('assert');
var BigNumber = require('bignumber.js');
var sha256 = require('js-sha256').sha256;
var Changelly = require('./changellyLib.js');
var json = require('json');


//Config
var solidityFile = './contracts/FirstBloodToken_test.sol';
var contractName = 'FirstBloodToken';
var startBlock = 2326762; //9-26-2016 midnight UTC assuming 14 second blocks
var endBlock = 2499819; //10-23-2016 midnight UTC assuming 14 second blocks
var web3 = new Web3();
  var port = 8545;
  var contract;
  var contractAddress;

function sign(web3, address, value, callback) {
  web3.eth.sign(address, value, function(err, sig) {
    if (!err) {
      try {
        var r = sig.slice(0, 66);
        var s = '0x' + sig.slice(66, 130);
        var v = parseInt('0x' + sig.slice(130, 132), 16);
        if (sig.length<132) {
          //web3.eth.sign shouldn't return a signature of length<132, but if it does...
          sig = sig.slice(2);
          r = '0x' + sig.slice(0, 64);
          s = '0x00' + sig.slice(64, 126);
          v = parseInt('0x' + sig.slice(126, 128), 16);
        }
        if (v!=27 && v!=28) v+=27;
        callback(undefined, {r: r, s: s, v: v});
      } catch (err) {
        callback(err, undefined);
      }
    } else {
      callback(err, undefined);
    }
  });
}

//calls contract with exchanged ether
  function BuyTokensUsingEther (etherReceived, contract, etherWalletAddr){

                web3.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));

                contractAddr = '0x211e7265cC581Aa8FD786c5A7b1f13d80E8393cB';
                abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"endBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"bountyAllocated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"signer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"blockNumber","type":"uint256"}],"name":"testPrice","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"presaleEtherRaised","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"startBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"allocateBountyAndEcosystemTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"founder","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"halt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"etherCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ecosystemAllocated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"founderAllocation","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"founderLockup","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"founderAllocated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"allocateFounderTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"ecosystemAllocation","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"transferLockup","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"presaleTokenSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unhalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"recipient","type":"address"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"buyRecipient","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"buy","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"bountyAllocation","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"founderInput","type":"address"},{"name":"signerInput","type":"address"},{"name":"startBlockInput","type":"uint256"},{"name":"endBlockInput","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"eth","type":"uint256"},{"indexed":false,"name":"fbt","type":"uint256"}],"name":"Buy","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"to","type":"address"},{"indexed":false,"name":"eth","type":"uint256"}],"name":"Withdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"}],"name":"AllocateFounderTokens","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"}],"name":"AllocateBountyAndEcosystemTokens","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
                contract = web3.eth.contract(abi).at(contractAddr);


          contract.testPrice(0, function(err, result){
          assert.equal(err, null);
          console.log("test token price per ether",  result.toNumber());
/* this is web3 1.0 version code, needs  to be changed to 0.x as 1.0 not released yet
            contract.methods.buy(0,undefined,undefined).send({to: contractAddr, from: etherWalletAddr, value: etherReceived,gas: 200000})
            .on('transactionHash', function(hash){
                console.log("transactionHash" , hash)
            })
*/
                     contract.balanceOf(etherWalletAddr, function(err, result){
                   assert.equal(err, null);
                    console.log("tokens balance of user "+ result.toNumber());
                    });
  });


}

describe('Smart contract token test ', function() {
  this.timeout(240*1000);
  //globals

  var accounts;
  var testCases;
  var unit = new BigNumber(Math.pow(10,18));
  var founder;
  var signer = '0x00bd7C4893CDfcefD3918f0A1600645E6614EA85';
  var contractAddr;
  var abi;
  var contract;

 /*provide a wallet address(receipent's address) where you can receive your exchanged currency.
    successsful transaction would generate a changelly address to which user needs to send the currency(btc) to be exchanged */
  var etherWalletAddr = '0x00bd7C4893CDfcefD3918f0A1600645E6614EA85';



  before("set web3 provider", function(done) {

    done();
  });





  it('Test changelly', function(done){


  // register at https://changelly.com/developers for changelly apiKey and apiSecret
  var changelly = new Changelly(
    '32d3e6062ffb498fae102d3ded2e2c19',
    'bbf531f6764e1b9e8c30012ed1b16aaee4fc61317f880325523d453500281ecd'
  );



  // get minimum exchangeable amount btc to be sent for the currency pair ('btc', 'eth') to notify user
  var btcToEthRate;
  var minbtcAmount;
  changelly.getExchangeAmount('btc', 'eth', 1, function(err, data) {
            if (err){
              console.log('Error!', err);
            } else {
              console.log('exchange rate from 1 btc to eth: ', data.result);
              btcToEthRate = data.result;
              changelly.getMinAmount('btc', 'eth', function(err, data) {
              if (err){
              console.log('Error!', err);
              } else {
                minbtcAmount = data.result;
                   console.log('minimum exchange amount for btc to eth: ', minbtcAmount);

                   //create changelly transaction now
                //   if(bitCoins < minbtcAmount) {
                  // throw "less than minimum exchange amount";
                   //}
                   changelly.createTransaction('btc', 'eth', etherWalletAddr, minbtcAmount , undefined, function(err, data) {
                      if (err){
                        console.log('Error!', err);
                      } else {
                        //console.log('createTransaction', data);

                        var payinAddress = data.result.address;

                        console.log('createTransaction success');

                        console.log('payinAddress to deposit btc: ', payinAddress);

                        changelly.getStatus(data.id, function(err, data) {
                          if (err){
                            console.log('Error!', err);
                          } else {
                            console.log('getStatus', data);
                          }
                        });
                         changelly.getTransactions(1, 0,null,etherWalletAddr,undefined, function(err, data) {
                           if (err){
                             console.log('Error!', err);
                           } else {
                             console.log('getTransactions', data);
                             console.log("transaction status: ", data.status  );


                              var etherReceived = btcToEthRate * minbtcAmount;
                              console.log("final ether being sent to contract to buy tokens ", etherReceived);
                              //this is a hack for now ideally must be called when "payout" event is fired after successful payout
                              BuyTokensUsingEther(etherReceived, contract, etherWalletAddr)
                           }
                         });


                      }
                   });
                }

                })

            }
  });
/*note:can send another amount of coins to the address generated before multiple times without creating a new transaction.
  and your coins sent will be automatically exchanged to the same currency and sent to the same wallet address.
*/

  changelly.on('payin', function(data) {
    // bitcoins are sent successfully to payinAddress
    console.log('payin', data);
  });

  changelly.on('payout', function(data) {
    console.log('payout', data);
    //after payout to the etherWallet  call contract.buy from the etherWallet address and the exchangedAmount as value.
    var etherReceived;
    console.log("final ether being sent to contract to buy tokens ", etherReceived);

    //should extract etherReceived from data
    BuyTokensUsingEther(etherReceived, contract, etherWalletAddr);
  });



}); });