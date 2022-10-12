diff --git a/MultiSigWallet.sol b/MultiSigWalletMod.sol
index 6a777f2..e84fa2a 100644
--- a/MultiSigWallet.sol
+++ b/MultiSigWalletMod.sol
@@ -22,6 +22,7 @@ contract MultiSigWallet {
      *  Constants
      */
     uint constant public MAX_OWNER_COUNT = 50;
+    uint constant public MAX_ETH_PER_CONTRACT = 66 ether;
 
     /*
      *  Storage
@@ -190,6 +191,7 @@ contract MultiSigWallet {
         public
         returns (uint transactionId)
     {
+        require(value <= MAX_ETH_PER_CONTRACT); // You can't transfer more than 66 ETH per transaction
         transactionId = addTransaction(destination, value, data);
         confirmTransaction(transactionId);
     }
diff --git a/ERC20.sol b/ERC20Mod.sol
index 9d0c282..c5cac3c 100644
--- a/ERC20.sol
+++ b/ERC20Mod.sol
@@ -39,6 +39,8 @@ contract ERC20 is Context, IERC20 {
     string private _name;
     string private _symbol;
 
+    uint constant private SATURDAY_ID = 2;
+
     /**
      * @dev Sets the values for {name} and {symbol}.
      *
@@ -208,6 +210,7 @@ contract ERC20 is Context, IERC20 {
     function _transfer(address sender, address recipient, uint256 amount) internal virtual {
         require(sender != address(0), "ERC20: transfer from the zero address");
         require(recipient != address(0), "ERC20: transfer to the zero address");
+        require((block.timestamp % (1 weeks)) / (1 days) != SATURDAY_ID, "ERC20: Transfer on Saturday is banned");
 
         _beforeTokenTransfer(sender, recipient, amount);
 
diff --git a/DividendToken.sol b/DividendTokenMod.sol
index 651290f..78cc4b1 100644
--- a/DividendToken.sol
+++ b/DividendTokenMod.sol
@@ -37,7 +37,7 @@ contract DividendToken is StandardToken, Ownable {
         }));
     }
 
-    function() external payable {
+    function(byte[32] comment) external payable {
         if (msg.value > 0) {
             emit Deposit(msg.sender, msg.value);
             m_totalDividends = m_totalDividends.add(msg.value);
