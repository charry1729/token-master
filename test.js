var TestRPC = require("ethereumjs-testrpc");
var Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var async = require('async');
var assert = require('assert');
var BigNumber = require('bignumber.js');
var sha256 = require('js-sha256').sha256;

//Config
var solidityFile = './contracts/FirstBloodToken_test.sol';
var contractName = 'FirstBloodToken';
var startBlock = 2326762; //9-26-2016 midnight UTC assuming 14 second blocks
var endBlock = 2499819; //10-23-2016 midnight UTC assuming 14 second blocks

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

describe('Smart contract token test ', function() {
  this.timeout(240*1000);
  //globals
  var web3 = new Web3();
  var port = 8545;
  var contract;
  var contractAddress;
  var accounts;
  var testCases;
  var unit = new BigNumber(Math.pow(10,18));
  var founder;
  var signer;

  before("Initialize TestRPC server", function(done) {
    web3.setProvider(new Web3.providers.HttpProvider("http://localhost:"+port));
    done();
  });

  before('Get accounts', function(done) {
    web3.eth.getAccounts(function(err, accs) {

      if(err) {
        done(err);
        return;
      }

      accounts = accs;
      assert.equal(accounts.length, 10);
      done();
    });
  });


  it('Deploy smart contract', function(done) {
    fs.readFile(solidityFile, function(err, result){
      var source = result.toString();
      var output = solc.compile(source, 1); // 1 activates the optimiser
      var abi = JSON.parse(output.contracts[contractName].interface);
      var bytecode = output.contracts[contractName].bytecode;

      contract = web3.eth.contract(abi);
      //Put constructor arguments here:
      founder = accounts[0];
      signer = accounts[1];
      doneCalled = false;
      var contractInstance = contract.new(founder, signer, startBlock, endBlock, {from: accounts[0], gas: 9000000, data: bytecode}, function(err, myContract){
        assert.equal(err, null);
        web3.eth.getTransactionReceipt(myContract.transactionHash, function(err, result){
          assert.equal(err, null);
          assert.equal(result!=undefined, true);
          contractAddress = result.contractAddress;
          contract = web3.eth.contract(abi).at(contractAddress);
          if (!doneCalled) done();
          doneCalled = true;
        });
      });
    });
  });


  it('Set up test cases', function(done){
    var blockNumber = startBlock;
    testCases = [];
    var numBlocks = 8;
    for (i=0; i<numBlocks; i++) {
      var blockNumber = Math.round(startBlock + (endBlock-startBlock)*i/(numBlocks-1));
      var expectedPrice;
      if (blockNumber>=startBlock && blockNumber<startBlock+250) {
        expectedPrice = 170;
      } else if (blockNumber>endBlock || blockNumber<startBlock) {
        expectedPrice = 100;
      } else {
        //must use Math.floor to simulate Solidity's integer division
        expectedPrice = 100 + Math.floor(Math.floor(4*(endBlock - blockNumber)/(endBlock - startBlock + 1))*67/4);
      }
      var accountNum = Math.max(1,Math.min(i+1, accounts.length-1));
      var account = accounts[accountNum];
      expectedPrice = Math.round(expectedPrice);
      testCases.push(
        {
          accountNum: accountNum,
          blockNumber: blockNumber,
          expectedPrice: expectedPrice,
          account: account,
        }
      );
    }
    done();
  });

  it('Should sign test cases', function(done) {
    async.mapSeries(testCases,
      function(testCase, callbackMap) {
        var hash = sha256(new Buffer(testCase.account.slice(2),'hex'));
        sign(web3, signer, hash, function(err, sig) {
          testCase.v = sig.v;
          testCase.r = sig.r;
          testCase.s = sig.s;
          callbackMap(null, testCase);
        });
      },
      function(err, newTestCases) {
        testCases = newTestCases;
        done();
      }
    );
  });

  it('Test price', function(done) {
    async.eachSeries(testCases,
      function(testCase, callbackEach) {
        contract.testPrice(testCase.blockNumber, function(err, result){
          assert.equal(err, null);
          assert.equal(result.toNumber(), testCase.expectedPrice);
          callbackEach();
        });
      },
      function(err) {
        done();
      }
    );
  });


  it('Test buy', function(done) {
    var amountToBuy = 3;
    var amountBought = 0;
    web3.eth.getBalance(founder, function(err, result){
      var initialBalance = result;
      async.eachSeries(testCases,
        function(testCase, callbackEach) {
          contract.setBlockNumber(testCase.blockNumber, {from: testCase.account, value: 0}, function(err, result){
            assert.equal(err, null);
            contract.buy(testCase.v, testCase.r, testCase.s, {from: testCase.account, value:amountToBuy,gas: 200000 }, function(err, result){
              if(err != null){ throw err}
              assert.equal(err, null);
              amountBought += amountToBuy;
              contract.balanceOf(testCase.account, function(err, result){
                assert.equal(err, null);
                console.log(result.toNumber());
               // console.log(testCase.expectedPrice);
                assert.equal(result.equals(web3.toBigNumber(testCase.expectedPrice).times(amountToBuy)), true);
                callbackEach();
              });
            });
          });
        },
        function(err) {
          web3.eth.getBalance(founder, function(err, result){
            var finalBalance = result;
            assert.equal(finalBalance.minus(initialBalance).equals(unit.times(new BigNumber(amountBought))), true);
            done();
          });
        }
      );
    });
  });

  it('Test buying on behalf of a recipient', function(done) {
    var amountToBuy = web3.toWei(1, "ether");
    contract.setBlockNumber(endBlock-10, {from: accounts[0], value: 0}, function(err, result){
      assert.equal(err, null);
      contract.balanceOf(accounts[2], function(err, result){
        var initialBalance = result;
        var hash = sha256(new Buffer(accounts[1].slice(2),'hex'));
        sign(web3, signer, hash, function(err, sig) {
          contract.buyRecipient(accounts[2], sig.v, sig.r, sig.s, {from: accounts[1], value: amountToBuy}, function(err, result){
            assert.equal(err, null);
            contract.price(function(err, result){
              var price = result;
              contract.balanceOf(accounts[2], function(err, result){
                var finalBalance = result;
                assert.equal(finalBalance.sub(initialBalance).equals((new BigNumber(amountToBuy)).times(price)), true);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('Test halting, buying, and failing', function(done) {
    contract.halt({from: founder, value: 0}, function(err, result){
      assert.equal(err, null);
      var hash = sha256(new Buffer(accounts[1].slice(2),'hex'));
      sign(web3, signer, hash, function(err, sig) {
        contract.buy(sig.v, sig.r, sig.s, {from: accounts[1], value: web3.toWei(1, "ether")}, function(err, result){
          assert.equal(!err, false);
          done();
        });
      });
    });
  });

  it('Test unhalting, buying, and succeeding', function(done) {
    contract.unhalt({from: founder, value: 0}, function(err, result){
      assert.equal(err, null);
      var hash = sha256(new Buffer(accounts[1].slice(2),'hex'));
      sign(web3, signer, hash, function(err, sig) {
        contract.buy(sig.v, sig.r, sig.s, {from: accounts[1], value: web3.toWei(1, "ether")}, function(err, result){
          assert.equal(!err, true);
          done();
        });
      });
    });
  });

  it('Test buying after the sale ends', function(done) {
    contract.setBlockNumber(endBlock+1, {from: accounts[0], value: 0}, function(err, result){
      assert.equal(err, null);
      var hash = sha256(new Buffer(accounts[1].slice(2),'hex'));
      sign(web3, signer, hash, function(err, sig) {
        contract.buy(sig.v, sig.r, sig.s, {from: accounts[1], value: web3.toWei(1, "ether")}, function(err, result){
          assert.equal(!err, false);
          done();
        });
      });
    });
  });

  it('Test contract balance is zero', function(done){
    web3.eth.getBalance(contractAddress, function(err, balance){
      assert.equal(balance.equals(new BigNumber(0)), true);
      done();
    });
  });

  it('Test bounty and ecosystem allocation', function(done) {
    contract.totalSupply(function(err, result){
      var totalSupply = result;
      var expectedChange = new BigNumber(totalSupply).div(20).add((new BigNumber(2500000)).times(unit));
      var blockNumber = endBlock + 1;
      contract.balanceOf(founder, function(err, balance){
        var initialFounderBalance = balance;
        contract.setBlockNumber(blockNumber, {from: founder, value: 0}, function(err, result){
          assert.equal(err, null);
          contract.allocateBountyAndEcosystemTokens({from: founder, value: 0}, function(err, result){
            contract.balanceOf(founder, function(err, balance){
              var finalFounderBalance = balance;
              assert.equal(err, null);
              assert.equal(finalFounderBalance.minus(initialFounderBalance).equals(new BigNumber(expectedChange)), true);
              done();
            });
          });
        });
      });
    });
  });

  it('Test bounty and ecosystem allocation twice', function(done) {
    contract.allocateBountyAndEcosystemTokens({from: founder, value: 0}, function(err, result){
      assert.equal(!err, false);
      done();
    });
  });

  it('Test founder token allocation too early', function(done) {
    var blockNumber = endBlock + 86400/14 * 366;
    contract.allocateFounderTokens({from: founder, value: 0}, function(err, result){
      assert.equal(!err, false);
      done();
    });
  });

  it('Test founder token allocation on time', function(done) {
    contract.presaleTokenSupply(function(err, result){
      var totalSupply = result;
      var expectedFounderAllocation = new BigNumber(totalSupply).div(10);
      var blockNumber = endBlock + 86400/14 * 366;
      contract.balanceOf(founder, function(err, balance){
        var initialFounderBalance = balance;
        contract.setBlockNumber(blockNumber, {from: founder, value: 0}, function(err, result){
          assert.equal(err, null);
          contract.allocateFounderTokens({from: founder, value: 0}, function(err, result){
            contract.balanceOf(founder, function(err, balance){
              var finalFounderBalance = balance;
              assert.equal(err, null);
              assert.equal(finalFounderBalance.minus(initialFounderBalance).equals(expectedFounderAllocation), true);
              done();
            });
          });
        });
      });
    });
  });

  it('Test founder token allocation twice', function(done) {
    contract.allocateFounderTokens({from: founder, value: 0}, function(err, result){
      assert.equal(!err, false);
      done();
    });
  });

  it('Test founder change by hacker', function(done) {
    var newFounder = accounts[1];
    var hacker = accounts[1];
    contract.changeFounder(newFounder, {from: hacker, value: 0}, function(err, result){
      assert.equal(!err, false);
      done();
    });
  });

  it('Test founder change', function(done) {
    var newFounder = accounts[1];
    contract.changeFounder(newFounder, {from: founder, value: 0}, function(err, result){
      assert.equal(err, null);
      contract.founder(function(err, result){
        assert.equal(err, null);
        assert.equal(result, newFounder);
        done();
      });
    });
  });

  it('Test restricted early transfer', function(done) {
    var account3 = accounts[3];
    var account4 = accounts[4];
    var amount = web3.toWei(1, "ether");
    var blockNumber = endBlock + 100;
    contract.setBlockNumber(blockNumber, {from: founder, value: 0}, function(err, result){
      contract.transfer(account3, amount, {from: account4, value: 0}, function(err, result){
        assert.equal(!err, false);
        done();
      });
    });
  });

  it('Test transfer after restricted period', function(done) {
    var account3 = accounts[3];
    var account4 = accounts[4];
    var amount = web3.toWei(1, "ether");
    var blockNumber = Math.round(endBlock + 61*86400/14);
    contract.setBlockNumber(blockNumber, {from: founder, value: 0}, function(err, result){
      assert.equal(err, null);
      contract.transfer(account3, amount, {from: account4, value: 0}, function(err, result){
        assert.equal(err, null);
        done();
      });
    });
  });

});
