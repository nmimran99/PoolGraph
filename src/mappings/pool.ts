import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  Borrow as BorrowEvent,
  IsolationModeTotalDebtUpdated,
  RebalanceStableBorrowRate,
  Repay as RepayEvent,
  SwapBorrowRateMode,
  LiquidationCall,
  Withdraw as WithdrawEvent,
  Supply
} from "../../generated/Pool/Pool"
import { Borrow, Account, Market, Repay, Liquidation, Withdraw, Deposit } from "../../generated/schema"
import { updateCommonATokenStats, getOrCreateMarket, getOrCreateAccount, getOrCreateProtocol, calculateLiquidationProfit } from "../helpers";

export function handleBorrow(event: BorrowEvent): void {
  getOrCreateProtocol(event.address.toHexString())
  let market = getOrCreateMarket(event.address.toHexString());
  let borrower = getOrCreateAccount(event.params.user.toHexString())
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

  let borrow = new Borrow(borrowId);

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


export function handleRepay(event: RepayEvent): void {
  getOrCreateProtocol(event.address.toHexString())
  let market = getOrCreateMarket(event.address.toHexString());
  let account = getOrCreateAccount(event.params.user.toHexString())
  let repayer = getOrCreateAccount(event.params.repayer.toHexString())

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

  let repay = new Repay(repayID)

  repay.market = market.id
  repay.amount = repayAmount
  repay.borrower = account.id
  repay.repayer = repayer.id
  repay.useATokens = event.params.useATokens
  repay.blockTime = event.block.timestamp.toI32()
  repay.blockNumber = event.block.number.toI32()
  
  repay.save()
}

export function handleLiquidationCall(event: LiquidationCall): void {
  getOrCreateProtocol(event.address.toHexString())
  let market = getOrCreateMarket(event.address.toHexString());
  let asset = market.depositAsset
  let amount = event.params.debtToCover.toBigDecimal()
  let collateralAmount = event.params.liquidatedCollateralAmount.toBigDecimal()
  let liquidator = getOrCreateAccount(event.params.liquidator.toHexString())
  let liquidatee = getOrCreateAccount(event.params.user.toHexString())
  let collateralAsset = event.params.collateralAsset.toHexString()
  let debtAsset = event.params.debtAsset.toHexString()
  let liquidationId = event.transaction.hash
    .toHex()
    .concat('-')
    .concat(event.transactionLogIndex.toString())
  let received = calculateLiquidationProfit(market.liquidityRate, amount)

  let liquidation = new Liquidation(liquidationId)
  liquidation.id = liquidationId
  liquidation.protocol = market.protocol
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

export function handleWithdraw(event: WithdrawEvent): void {
  getOrCreateProtocol(event.address.toHexString())
  let market = getOrCreateMarket(event.params.reserve.toHexString())
  let user = getOrCreateAccount(event.params.user.toHexString())
  let to = getOrCreateAccount(event.params.to.toHexString())
  let amount = event.params.amount.toBigDecimal()
  let withdrawId = event.transaction.hash
    .toHex()
    .concat('-')
    .concat(event.transactionLogIndex.toString())

  let withdrawal = new Withdraw(withdrawId)
  withdrawal.asset = market.depositAsset
  withdrawal.amount = amount
  withdrawal.to = user.id
  withdrawal.from = market.id
  withdrawal.blockNumber = event.block.number.toI32()
  withdrawal.blockTime = event.block.timestamp.toI32()
  withdrawal.protocol = market.protocol
  withdrawal.market = market.id

  withdrawal.save()
}

export function handleDeposit(event: Supply): void {
  getOrCreateProtocol(event.address.toHexString())
  let market = getOrCreateMarket(event.params.reserve.toHexString())
  let user = getOrCreateAccount(event.params.user.toHexString())
  let onBehalfOf = getOrCreateAccount(event.params.onBehalfOf.toHexString())
  let amount = event.params.amount.toBigDecimal()
  let referralCode = event.params.referralCode
  let depositId = event.transaction.hash
  .toHex()
  .concat('-')
  .concat(event.transactionLogIndex.toString())

  let deposit = new Deposit(depositId)
  deposit.asset = market.depositAsset
  deposit.amount = amount
  deposit.from = user.id
  deposit.to = market.id
  deposit.onBehalfOf = onBehalfOf.id
  deposit.blockNumber = event.block.number.toI32()
  deposit.blockTime = event.block.timestamp.toI32()
  deposit.market = market.id
  deposit.protocol = market.protocol
  deposit.referralCode = referralCode

  deposit.save()
}


export function handleIsolationModeTotalDebtUpdated(
  event: IsolationModeTotalDebtUpdated
): void {}

export function handleRebalanceStableBorrowRate(
  event: RebalanceStableBorrowRate
): void {}

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {}
