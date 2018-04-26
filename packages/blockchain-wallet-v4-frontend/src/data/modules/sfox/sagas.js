import { takeLatest, put, call, select } from 'redux-saga/effects'
import * as AT from './actionTypes'
import * as A from './actions'
import { actions } from 'data'
import * as selectors from '../../selectors.js'
import * as MODALS_ACTIONS from '../../modals/actions'
import * as sendBtcActions from '../../components/sendBtc/actions'
import * as sendBtcSelectors from '../../components/sendBtc/selectors'
import settings from 'config'
import { Remote } from 'blockchain-wallet-v4/src'

export default ({ coreSagas }) => {
  const setBankManually = function * (action) {
    try {
      yield call(coreSagas.data.sfox.setBankManually, action.payload)
      yield put(actions.alerts.displaySuccess('Bank has been added!'))
    } catch (e) {
      console.warn(e)
      yield put(actions.alerts.displayError('Could not add bank. Please try again.'))
      // can dispatch an action here to set some kind of state
    }
  }

  const sfoxSignup = function * () {
    try {
      yield call(coreSagas.data.sfox.signup)
      const profile = yield select(selectors.core.data.sfox.getProfile)

      if (!profile.error) {
        yield put(A.nextStep('verify'))
        yield put(actions.alerts.displaySuccess('Account successfully created!'))
      } else {
        const error = JSON.parse(profile.error).error
        yield put(A.signupFailure(error))
        if (error === 'user_data is not verified') { yield put(actions.alerts.displayError('Something went wrong. Please contact our support team (or your local developer).')) }
      }
    } catch (e) {
      yield put(actions.alerts.displayError('Error creating account'))
    }
  }

  const setProfile = function * (payload) {
    try {
      yield call(coreSagas.data.sfox.setProfile, payload)

      const profile = yield select(selectors.core.data.sfox.getProfile)
      if (profile.error) {
        throw new Error(profile.error)
      } else {
        yield put(actions.alerts.displaySuccess('Profile submitted successfully for verification!'))
        yield put(A.nextStep('funding'))
      }
    } catch (e) {
      yield put(A.setVerifyError(e))
      yield put(actions.alerts.displayError(`Error verifying profile: ${e}`))
    }
  }

  const upload = function * (payload) {
    try {
      yield call(coreSagas.data.sfox.uploadDoc, payload)

      const profile = yield select(selectors.core.data.sfox.getProfile)
      if (profile.data._verification_status.required_docs.length) {
        yield put(actions.alerts.displaySuccess('Document uploaded successfully!'))
      } else {
        yield put(actions.alerts.displaySuccess('Document uploaded successfully!'))
        yield put(A.nextStep('link'))
      }
    } catch (e) {
      yield put(actions.alerts.displayError('Error uploading'))
    }
  }

  const setBank = function * (payload) {
    try {
      yield call(coreSagas.data.sfox.setBankAccount, payload)
      yield put(actions.alerts.displaySuccess('Bank account set successfully!'))
      yield put(MODALS_ACTIONS.closeAllModals())
    } catch (e) {
      yield put(actions.alerts.displayError('Error setting bank'))
    }
  }

  const submitMicroDeposits = function * (payload) {
    try {
      yield call(coreSagas.data.sfox.verifyMicroDeposits, payload)
      yield put(actions.alerts.displaySuccess('Bank Verified!'))
    } catch (e) {
      yield put(actions.alerts.displayError('Unable to verify bank'))
    }
  }

  const submitQuote = function * (action) {
    try {
      console.log('submitting quote:', action.payload)
      yield call(coreSagas.data.sfox.handleTrade, action.payload)
      let state = yield select()
      console.log('state', state)
      yield put(actions.form.change('buySellTabStatus', 'status', 'order_history'))
    } catch (e) {
      console.warn('FE submitQuote failed', e)
    }
  }

  const submitSellQuote = function * (action) {
    const q = action.payload
    try {
      console.log('submitting sell quote:', q)
      let p = yield select(sendBtcSelectors.getPayment)
      let payment = coreSagas.payment.btc.create({ payment: p.getOrElse({}), network: settings.NETWORK_BITCOIN })

      // assign payment amount from quote
      payment = yield payment.amount(parseInt(q.quoteAmount))

      // use priority fee
      payment = yield payment.fee(p.data.fees.priority)

      // will need the trade object for the address
      // const trade = yield call(coreSagas.data.sfox.handleSellTrade, action.payload)

      // assign payment to from trade
      payment = yield payment.to('1LiASK9MawXo9SppMn3RhfWUvHKW2ZHxFx')

      try { payment = yield payment.build() } catch (e) {}
      yield put(sendBtcActions.sendBtcPaymentUpdated(Remote.of(payment.value())))

      let logPayment = yield select(sendBtcSelectors.getPayment)
      console.log('logPayment', logPayment)
      // yield put(actions.form.change('buySellTabStatus', 'status', 'order_history'))
    } catch (e) {
      console.warn('FE submitQuote failed', e)
    }
  }

  return function * () {
    yield takeLatest(AT.SET_BANK_MANUALLY, setBankManually)
    yield takeLatest(AT.SET_BANK, setBank)
    yield takeLatest(AT.SFOX_SIGNUP, sfoxSignup)
    yield takeLatest(AT.SET_PROFILE, setProfile)
    yield takeLatest(AT.UPLOAD, upload)
    yield takeLatest(AT.SUBMIT_MICRO_DEPOSITS, submitMicroDeposits)
    yield takeLatest(AT.SUBMIT_QUOTE, submitQuote)
    yield takeLatest(AT.SUBMIT_SELL_QUOTE, submitSellQuote)
  }
}
