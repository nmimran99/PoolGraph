import { Bytes, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Account, AccountAToken, AccountATokenTransaction, Market, Protocol, Asset} from "../generated/schema";

export let zeroBD = BigDecimal.fromString('0')
export const AAVE_V3 = "0x3561c45840e2681495acca3c50ef4dae330c94f8"

export function createAccount(accountID: string): Account {
    let account = new Account(accountID);
    account.hasBorrowed = false;
    account.save();
    return account;
}

export function updateCommonATokenStats(
    marketID: string,
    accountID: string,
    tx_hash: Bytes,
    timestamp: BigInt,
    blockNumber: BigInt,
    logIndex: BigInt,
): AccountAToken {
    let aTokenStatsID = marketID.concat('-').concat(accountID);
    let aTokenStats = AccountAToken.load(aTokenStatsID);
    if (aTokenStats == null) {
        aTokenStats = createAccountAToken(aTokenStatsID , accountID, marketID)
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
    marketID: string,
  ): AccountAToken {
    let aTokenStats = new AccountAToken(aTokenStatsID)
    aTokenStats.market = marketID
    aTokenStats.account = accountID
    aTokenStats.accrualBlockNumber = BigInt.fromI32(0)
    aTokenStats.aTokenBalance = zeroBD
    aTokenStats.totalUnderlyingSupplied = zeroBD
    aTokenStats.totalUnderlyingRedeemed = zeroBD
    aTokenStats.accountBorrowIndex = zeroBD
    aTokenStats.totalUnderlyingBorrowed = zeroBD
    aTokenStats.totalUnderlyingRepaid = zeroBD
    aTokenStats.storedBorrowBalance = zeroBD
    aTokenStats.enteredMarket = false
    return aTokenStats
  }


  // TODO Fix - A transaction is always unique on chain - therefore there is no need to getOrCreate it. It will always just be created!
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


export function createMarket(marketID: string): Market {
  let protocol = getOrCreateProtocol(marketID)
  let market = new Market(marketID);
  market.protocol = protocol.id
  market.name = null
  market.depositAsset = null
  market.borrowAsset = null
  market.aTokenAddress = null
  market.stableDebtTokenAddress = null
	market.variableDebtTokenAddress = null
	market.interestRateStrategyAddress = null
	market.accruedToTreasury = null
	market.liquidityIndex = null
	market.currentLiquidityRate = null
	market.variableBorrowIndex = null
	market.currentVariableBorrowRate = null
	market.currentStableBorrowRate = null
	market.lastUpdateTimestamp = 0
	market.unbacked = null
	market.isolationModeTotalDebt = null
  market.liquidityRate = new BigInt(50000) // TODO dk - read this from the contract
  
  market.save()
  
  return market;
}


function createProtocol(id: string): Protocol {
    let protocol = new Protocol(id)
    protocol.network = "Rinkeby"
    protocol.type = "Pooled"
    protocol.riskType = "Global"
    protocol.save()
    return protocol
}

export function getOrCreateMarket(marketId: string): Market {
  let market = Market.load(marketId);
  if (market == null) {
    market = createMarket(marketId);
  }
  return market
}

export function getOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);
  if (account == null) {
    account = createAccount(accountId);
  }
  return account
}

function marketAddressToProtocol(address: string): string{
  if (address == AAVE_V3){
    return "AAVE-V3"
  }
  return "unknown"
}

export function getOrCreateProtocol(address: string): Protocol {
  let id = marketAddressToProtocol(address)
  let protocol = Protocol.load(id)
  if (!protocol) {
    protocol = createProtocol(id)
  }
  return protocol
}

// TODO dk - this should be read from  contract too
export function calculateLiquidationProfit(liquidationRate: BigInt, debt: BigDecimal): BigDecimal {
  if (!liquidationRate) {
    return new BigDecimal(new BigInt(0));
  }
  return debt
    .times(new BigDecimal(new BigInt(1000000)))
    .div(new BigDecimal(liquidationRate))
}