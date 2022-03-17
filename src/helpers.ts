import { Bytes, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Account, AccountAToken, AccountATokenTransaction, Reserve } from "../generated/schema";

export let zeroBD = BigDecimal.fromString('0')

export function createAccount(accountID: string): Account {
    let account = new Account(accountID);
    account.hasBorrowed = false;
    account.save();
    return account;
}

export function updateCommonATokenStats(
    reserveID: string,
    accountID: string,
    tx_hash: Bytes,
    timestamp: BigInt,
    blockNumber: BigInt,
    logIndex: BigInt,
): AccountAToken {
    let aTokenStatsID = reserveID.concat('-').concat(accountID);
    let aTokenStats = AccountAToken.load(aTokenStatsID);
    if (aTokenStats == null) {
        aTokenStats = createAccountAToken(aTokenStatsID , accountID, reserveID)
    }
    getOrCreateAccountATokenTransaction(
        aTokenStatsID, 
        tx_hash, 
        timestamp, 
        blockNumber, 
        logIndex
    )
    aTokenStats.accrualBlockNumber = blockNumber
    return aTokenStats as AccountAToken;
}

export function createAccountAToken(
    aTokenStatsID: string,
    accountID: string,
    reserveID: string,
  ): AccountAToken {
    let aTokenStats = new AccountAToken(aTokenStatsID)
    aTokenStats.reserve = reserveID
    aTokenStats.account = accountID
    aTokenStats.accrualBlockNumber = BigInt.fromI32(0)
    aTokenStats.aTokenBalance = zeroBD
    aTokenStats.totalUnderlyingSupplied = zeroBD
    aTokenStats.totalUnderlyingRedeemed = zeroBD
    aTokenStats.accountBorrowIndex = zeroBD
    aTokenStats.totalUnderlyingBorrowed = zeroBD
    aTokenStats.totalUnderlyingRepaid = zeroBD
    aTokenStats.storedBorrowBalance = zeroBD
    aTokenStats.enteredReserve = false
    return aTokenStats
  }


  export function getOrCreateAccountATokenTransaction(
    accountID: string,
    tx_hash: Bytes,
    timestamp: BigInt,
    block: BigInt,
    logIndex: BigInt,
  ): AccountATokenTransaction {
    let id = accountID
      .concat('-')
      .concat(tx_hash.toHexString())
      .concat('-')
      .concat(logIndex.toString())
    let transaction = AccountATokenTransaction.load(id)
  
    if (transaction == null) {
      transaction = new AccountATokenTransaction(id)
      transaction.account = accountID
      transaction.tx_hash = tx_hash
      transaction.timestamp = timestamp
      transaction.block = block
      transaction.logIndex = logIndex
      transaction.save()
    }
  
    return transaction as AccountATokenTransaction
  }


export function createReserve(reserveID: string): Reserve {
  let reserve = new Reserve(reserveID);
  reserve.aTokenAddress = null
  reserve.stableDebtTokenAddress = null
	reserve.variableDebtTokenAddress = null
	reserve.interestRateStrategyAddress = null
	reserve.accruedToTreasury = null
	reserve.liquidityIndex = null
	reserve.currentLiquidityRate = null
	reserve.variableBorrowIndex = null
	reserve.currentVariableBorrowRate = null
	reserve.currentStableBorrowRate = null
	reserve.lastUpdateTimestamp = 0
	reserve.unbacked = null
	reserve.isolationModeTotalDebt = null
  return reserve;
}