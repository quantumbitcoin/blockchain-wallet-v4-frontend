import React from 'react'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { LinkContainer } from 'react-router-bootstrap'

import { getData } from './selectors'
import { Icon, Image, Link } from 'blockchain-info-components'
import { Row } from '../Layout'
import { ExchangeText } from 'components/Exchange'

const InfoRow = styled(Row)`
  padding: 16px 4px;
`
const InfoLink = styled(Link)`
  display: inline-block;
`
const InfoIcon = styled(Icon)`
  display: inline-block;
  transform: rotate(270deg);
  margin-left: 4px;
  font-size: 10px;
  font-weight: 800;
`
const InfoImage = styled(Image)`
  height: 40px;
  padding-bottom: 8px;
  margin-right: 16px;
`

const VerificationInfo = ({ showNotification }) => {
  if (!showNotification) return null

  return (
    <InfoRow>
      <InfoImage name='failed-kyc' />
      <ExchangeText>
        <FormattedMessage
          id='scenes.exchange.exchangeform.verification_info.notificatoin'
          defaultMessage='We had trouble approving your identity. Your Swap feature has been disabled at this time.'
        />
        &nbsp;
        <LinkContainer to='/swap/account'>
          <InfoLink>
            <ExchangeText color='brand-secondary'>
              <FormattedMessage
                id='scenes.exchange.exchangeform.limit_info.learn_more'
                defaultMessage='Learn more'
              />
              <InfoIcon name='down-arrow-filled' color='brand-secondary' />
            </ExchangeText>
          </InfoLink>
        </LinkContainer>
      </ExchangeText>
    </InfoRow>
  )
}

export default connect(getData)(VerificationInfo)
