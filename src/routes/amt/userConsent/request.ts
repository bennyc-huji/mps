/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Response, Request } from 'express'
import { logger, messages } from '../../../logging'
import { ErrorResponse } from '../../../utils/amtHelper'
import { MqttProvider } from '../../../utils/MqttProvider'
import { AMTStatusCodes } from '../../../utils/constants'

export async function request (req: Request, res: Response): Promise<void> {
  try {
    const guid: string = req.params.guid
    // Request an opt-in code. Intel(R) AMT generates code internally.
    const response = await req.deviceAction.requestUserConsentCode()
    if (response != null) {
      const result = {
        Header: response.Header,
        Body: response.Body.StartOptIn_OUTPUT
      }
      result.Body.ReturnValueStr = AMTStatusCodes[result.Body.ReturnValue]
      if (result.Body.ReturnValue.toString() === '0') {
        MqttProvider.publishEvent('success', ['Request_User_Consent_Code'], messages.USER_CONSENT_REQUEST_SUCCESS, guid)
        res.status(200).json(result)
      } else {
        logger.error(`${messages.USER_CONSENT_REQUEST_FAILED} for guid : ${guid}.`)
        MqttProvider.publishEvent('fail', ['Request_User_Consent_Code'], messages.USER_CONSENT_REQUEST_FAILED, guid)
        res.status(400).json(result)
      }
    } else {
      logger.error(`${messages.USER_CONSENT_REQUEST_FAILED} for guid : ${guid}.`)
      MqttProvider.publishEvent('fail', ['Request_User_Consent_Code'], messages.USER_CONSENT_REQUEST_FAILED, guid)
      res.status(400).json(ErrorResponse(400, `${messages.USER_CONSENT_REQUEST_FAILED} for guid : ${guid}.`))
    }
  } catch (error) {
    logger.error(`${messages.USER_CONSENT_REQUEST_EXCEPTION} : ${error}`)
    MqttProvider.publishEvent('fail', ['Request_User_Consent_Code'], messages.INTERNAL_SERVICE_ERROR)
    res.status(500).json(ErrorResponse(500, messages.USER_CONSENT_REQUEST_EXCEPTION))
  }
}
