import { BigInt } from "@graphprotocol/graph-ts"
import {
  Borrow,
  IsolationModeTotalDebtUpdated,
  RebalanceStableBorrowRate,
  Repay,
  SwapBorrowRateMode
} from "../generated/Pool/Pool"
import { BorrowEvent, Account, Reserve, RepayEvent } from "../generated/schema"
import { createAccount, updateCommonATokenStats, createReserve } from "./helpers";

export function handleBorrow(event: Borrow): void {
  
  let reserve = Reserve.load(event.address.toHexString());
  if (reserve == null) {
    reserve = createReserve(event.address.toHexString());
  }
  if (reserve == null) return;

  let accountID = event.params.user.toHex();
  let account = Account.load(accountID);
  if (account == null) {
    account = createAccount(accountID);
  }
  account.hasBorrowed = true;
  account.save();

  let aTokenStats = updateCommonATokenStats(
    reserve.id,
    accountID,
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
  borrow.reserve = event.address
  borrow.borrower = event.params.user;
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
  let reserve = Reserve.load(event.address.toHexString());
  if (reserve == null) {
    reserve = createReserve(event.address.toHexString());
  }
  let accountID = event.params.user.toHex();
  let account = Account.load(accountID);
  if (account == null) {
    account = createAccount(accountID);
  }

  let aTokenStats = updateCommonATokenStats(
    reserve.id,
    accountID,
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
  repay.reserve = event.address
  repay.amount = repayAmount
  repay.borrower = event.params.user
  repay.repayer = event.params.repayer
  repay.useATokens = event.params.useATokens
  repay.blockTime = event.block.timestamp.toI32()
  repay.blockNumber = event.block.number.toI32()
  
  repay.save()
}

export function handleSwapBorrowRateMode(event: SwapBorrowRateMode): void {}
