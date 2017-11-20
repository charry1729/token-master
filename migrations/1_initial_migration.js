var Migrations = artifacts.require("FirstBloodToken");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
