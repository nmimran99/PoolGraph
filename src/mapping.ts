import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  Borrow,
  IsolationModeTotalDebtUpdated,
  RebalanceStableBorrowRate,
  Repay,
  SwapBorrowRateMode,
  LiquidationCall,
  Withdraw,
  DepositCall,
  Supply
} from "../generated/Pool/Pool"
import { BorrowEvent, Account, Market, RepayEvent, LiquidationEvent, WithdrawEvent, DepositEvent } from "../generated/schema"
import { createAccount, updateCommonATokenStats, createMarket, getMarket, getAccount, getProtocol, calculateLiquidationProfit } from "./helpers";

export function handleBorrow(event: Borrow): void {
  
  let market = getMarket(event.address.toHexString());
  let borrower = getAccount(event.params.user.toHexString())
  borrower.hasBorrowed = true;
  borrower.save();

  let aTokenStats = updateCommonATokenStats(
    market.id,
    borrower.id,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex
  )
  
  aTokenStats.totalUnderlyingBorrowed = aTokenStats.totalUnderlyingBorrowed
    .plus(event.params.amount.toBigDecimal());

  aTokenStats.save()

  let borrowId = event.transaction.hash.toHexString();
  let borrowAmount = event.params.amount.toBigDecimal();

  let borrow = new BorrowEvent(borrowId);

  borrow.market = market.id
  borrow.borrower = borrower.id
  borrow.onBehalfOf = event.params.onBehalfOf;
  borrow.amount = borrowAmount;
  borrow.borrowRate = event.params.borrowRate;
  borrow.interestRateMode = event.params.interestRateMode;
  borrow.blockNumber = event.block.number.toI32();
  borrow.blockTime = event.block.timestamp.toI32();
  borrow.save();
}

export function handleIsolationModeTotalDebtUpdated(
  event: IsolationModeTotalDebtUpdated
): void {}

export function handleRebalanceStableBorrowRate(
  event: RebalanceStableBorrowRate
): void {}

export function handleRepay(event: Repay): void {
  let market = getMarket(event.address.toHexString());
  let account = getAccount(event.params.user.toHexString())
  let repayer = getAccount(event.params.repayer.toHexString())

  let aTokenStats = updateCommonATokenStats(
    market.id,
    account.id,
    event.transaction.hash,
    event.block.timestamp,
    event.block.number,
    event.logIndex
  )

  aTokenStats.totalUnderlyingRepaid = aTokenStats.totalUnderlyingRepaid
    .plus(event.params.amount.toBigDecimal())
  
  aTokenStats.save()
  
  let repayID = event.transaction.hash
  .toHex()
  .concat('-')
  .concat(event.transactionLogIndex.toString())

  let repayAmount = event.params.amount.toBigDecimal();

  let repay = new RepayEvent(repayID)

  repay.market = market.id
  repay.amount = repayAmount
  repay.borrower = account.id
  repay.repayer = repayer.id
  repay.useATokens = event.params.useATokens
  repay.blockTime = event.block.timestamp.toI32()
  repay.blockNumber = event.block.number.toI32()
  
  repay.save()
}

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {}


export function handleLiquidation(event: LiquidationCall): void {
  let market = getMarket(event.address.toHexString());
  let protocol = getProtocol("AAVEV3")
  let asset = market.depositAsset
  let amount = event.params.debtToCover.toBigDecimal()
  let collateralAmount = event.params.liquidatedCollateralAmount.toBigDecimal()
  let liquidator = getAccount(event.params.liquidator.toHexString())
  let liquidatee = getAccount(event.params.user.toHexString())
  let collateralAsset = event.params.collateralAsset.toHexString()
  let debtAsset = event.params.debtAsset.toHexString()
  let liquidationId = event.transaction.hash
    .toHex()
    .concat('-')
    .concat(event.transactionLogIndex.toString())
  let received = calculateLiquidationProfit(market.liquidityRate, amount)
  
  


  let liquidation = new LiquidationEvent(liquidationId)
  liquidation.id = liquidationId
  liquidation.protocol = protocol.id
  liquidation.market = market.id
  liquidation.asset = asset
  liquidation.collateralAsset = collateralAsset
  liquidation.amount = amount
  liquidation.debtAsset = debtAsset
  liquidation.collateralAmount = collateralAmount
  liquidation.liquidator = liquidator.id
  liquidation.from = liquidatee.id
  liquidation.to = market.id
  liquidation.received = received
  liquidation.blockNumber = event.block.number.toI32()
  liquidation.blockTime = event.block.timestamp.toI32()


  // TO ADD: Liquidation profit
  // liquidation rate - is it in demicals or natural

  liquidation.save()
}

export function handleWithdraw(event: Withdraw): void {
  let market = getMarket(event.params.reserve.toHexString())
  let protocol = getProtocol("AAVEV3")
  let user = getAccount(event.params.user.toHexString())
  let to = getAccount(event.params.to.toHexString())
  let amount = event.params.amount.toBigDecimal()
  let withdrawId = event.transaction.hash
    .toHex()
    .concat('-')
    .concat(event.transactionLogIndex.toString())

  let withdrawal = new WithdrawEvent(withdrawId)
  withdrawal.asset = market.depositAsset
  withdrawal.amount = amount
  withdrawal.to = user.id
  withdrawal.from = market.id
  withdrawal.blockNumber = event.block.number.toI32()
  withdrawal.blockTime = event.block.timestamp.toI32()
  withdrawal.protocol = protocol.id
  withdrawal.market = market.id

  withdrawal.save()
}

export function handleDeposit(event: Supply): void {
  let market = getMarket(event.params.reserve.toHexString())
  let protocol = getProtocol("AAVEV3")
  let user = getAccount(event.params.user.toHexString())
  let onBehalfOf = getAccount(event.params.onBehalfOf.toHexString())
  let amount = event.params.amount.toBigDecimal()
  let referralCode = event.params.referralCode
  let depositId = event.transaction.hash
  .toHex()
  .concat('-')
  .concat(event.transactionLogIndex.toString())

  let deposit = new DepositEvent(depositId)
  deposit.asset = market.depositAsset
  deposit.amount = amount
  deposit.from = user.id
  deposit.to = market.id
  deposit.onBehalfOf = onBehalfOf.id
  deposit.blockNumber = event.block.number.toI32()
  deposit.blockTime = event.block.timestamp.toI32()
  deposit.market = market.id
  deposit.protocol = protocol.id
  deposit.referralCode = referralCode

  deposit.save()
}


