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

/*
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
*/

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


        var hash = sha256(new Buffer("0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db".slice(2),'hex'));



          sign(web3, signer, hash, function(err, sig) {
            testCase.v = sig.v;
            testCase.r = sig.r;
            testCase.s = sig.s;

            console.log("test case signed")
            callbackMap(null, testCase);
          });



      done();
      }
  );


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

});
