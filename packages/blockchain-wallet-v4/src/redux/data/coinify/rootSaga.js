import ExchangeDelegate from '../../../exchange/delegate'
import { apply, call, put, select, takeLatest } from 'redux-saga/effects'
import * as buySellSelectors from '../../kvStore/buySell/selectors'
import * as buySellAT from '../../kvStore/buySell/actionTypes'
import * as buySellA from '../../kvStore/buySell/actions'
import * as AT from './actionTypes'
import * as S from './selectors'
import * as A from './actions'

export default ({ api, coinifyService } = {}) => {
  let coinify

  const refreshCoinify = function * () {
    yield put(A.fetchProfileLoading())
    const state = yield select()
    const delegate = new ExchangeDelegate(state, api)
    const value = yield select(buySellSelectors.getMetadata)
    coinify = yield apply(coinifyService, coinifyService.refresh, [value, delegate])
    yield apply(coinify, coinify.profile.fetch)
    yield put(A.fetchProfileSuccess(coinify))
  }

  const init = function * () {
    try {
      yield call(refreshCoinify)
    } catch (e) {
      throw new Error(e)
    }
  }

  const fetchProfile = function * () {
    try {
      yield put(A.fetchProfileLoading())
      yield apply(coinify, coinify.profile.fetch)
      yield put(A.fetchProfileSuccess(coinify.profile))
    } catch (e) {
      yield put(A.fetchProfileFailure(e))
    }
  }

  const fetchQuote = function * (data) {
    try {
      yield put(A.fetchQuoteLoading())
      const { amt, baseCurr, quoteCurr } = data.payload.quote

      const quote = yield apply(coinify, coinify.getBuyQuote, [amt, baseCurr, quoteCurr])

      yield put(A.fetchQuoteSuccess(quote))
    } catch (e) {
      console.warn('quote fail', e)
      yield put(A.fetchQuoteFailure(e))
    }
  }

  const fetchTrades = function * () {
    try {
      yield put(A.fetchTradesLoading())
      const trades = yield apply(coinify, coinify.getTrades)
      yield put(A.fetchTradesSuccess(trades))
    } catch (e) {
      yield put(A.fetchTradesFailure(e))
    }
  }

  const fetchAccounts = function * () {
    try {
      yield put(A.fetchAccountsLoading())
      const methods = yield apply(coinify, coinify.getBuyMethods)
      const accounts = yield apply(coinify, methods.ach.getAccounts)
      yield put(A.fetchAccountsSuccess(accounts))
    } catch (e) {
      yield put(A.fetchAccountsFailure(e))
    }
  }

  const handleTrade = function * (data) {
    try {
      yield put(A.handleTradeLoading())
      const quote = data.payload
      const accounts = yield select(S.getAccounts)
      const methods = yield apply(quote, quote.getPaymentMediums)
      const trade = yield apply(methods.ach, methods.ach.buy, [accounts.data[0]])
      yield put(A.handleTradeSuccess(trade))
      yield call(fetchTrades)
      const trades = yield select(S.getTrades)
      yield put(buySellA.setTradesBuySell(trades.data))
    } catch (e) {
      yield put(A.handleTradeFailure(e))
    }
  }

  const getBankAccounts = function * (data) {
    const token = data.payload
    try {
      const bankAccounts = yield apply(coinify.bankLink, coinify.bankLink.getAccounts, [token])
      yield put(A.getBankAccountsSuccess(bankAccounts))
    } catch (e) {
      yield put(A.getBankAccountsFailure(e))
    }
  }

  const resetProfile = function * () {
    yield put(A.resetProfile())
  }

  const getPaymentMediums = function * (data) {
    const quote = data.payload
    try {
      yield put(A.getPaymentMediumsLoading())
      const mediums = yield apply(quote, quote.getPaymentMediums)
      yield put(A.getPaymentMediumsSuccess(mediums))
    } catch (e) {
      yield put(A.getPaymentMediumsFailure(e))
    }
  }

  const getMediumAccounts = function * (data) {
    const medium = data.payload
    try {
      const account = yield apply(medium, medium.getAccounts)
      console.log('medium account success', account)
      yield put(A.getMediumAccountsSuccess(account))
    } catch (e) {
      yield put(A.getMediumAccountsFailure(e))
    }
  }

  return function * () {
    yield takeLatest(buySellAT.FETCH_METADATA_BUYSELL_SUCCESS, init)
    yield takeLatest(AT.FETCH_ACCOUNTS, fetchAccounts)
    yield takeLatest(AT.COINIFY_FETCH_PROFILE, fetchProfile)
    yield takeLatest(AT.HANDLE_TRADE, handleTrade)
    yield takeLatest(AT.FETCH_TRADES, fetchTrades)
    yield takeLatest(AT.COINIFY_FETCH_QUOTE, fetchQuote)
    yield takeLatest(AT.GET_BANK_ACCOUNTS, getBankAccounts)
    yield takeLatest(AT.RESET_PROFILE, resetProfile)
    yield takeLatest(AT.GET_PAYMENT_MEDIUMS, getPaymentMediums)
    yield takeLatest(AT.COINIFY_GET_MEDIUM_ACCOUNTS, getMediumAccounts)
  }
}
