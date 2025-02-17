/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import path from 'path'
import fs from 'fs'

import { logger, messages } from '../logging'
import { mpsConfigType, webConfigType, directConfigType } from '../models/Config'
import { constants } from 'crypto'

const webTlsConfigPath = path.join(__dirname, '../../private/webtlsconfig.json')
const mpsTlsConfigPath = path.join(__dirname, '../../private/mpstlsconfig.json')
const directConnTlsConfigPath = path.join(__dirname, '../../private/directConntlsconfig.json')
export default {
  web: (): webConfigType => {
    try {
      let webConfig: webConfigType
      // Parse Web TLS Configuration json file
      try {
        if (fs.existsSync(webTlsConfigPath)) {
          webConfig = JSON.parse(fs.readFileSync(webTlsConfigPath, 'utf8'))
        } else {
          logger.error(`${messages.TLS_CONFIGURATION_WEB_TLS_CONFIG_DOES_NOT_EXIST} ${webTlsConfigPath}`)
          return
        }
      } catch (ex) {
        logger.error(messages.TLS_CONFIGURATION_JSON_PARSE_EXCEPTION, ex.message)
        return process.exit()
      }

      for (const i in webConfig) {
        if (webConfig[i] == null) {
          delete webConfig[i]
        }
        if (webConfig[i] instanceof Array) {
          if (webConfig[i].length === 0) {
            delete webConfig[i]
            continue
          }
        }
      }

      // Load SSL Cert and key
      if (webConfig.key && webConfig.cert) {
        if (
          !fs.existsSync(path.join(__dirname, webConfig.key)) &&
          !fs.existsSync(path.join(__dirname, webConfig.cert))
        ) {
          logger.error(messages.TLS_CONFIGURATION_TLS_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
          return process.exit()
        } else {
          webConfig.key = fs.readFileSync(
            path.join(__dirname, webConfig.key),
            'utf8'
          )
          webConfig.cert = fs.readFileSync(
            path.join(__dirname, webConfig.cert),
            'utf8'
          )
        }
      } else {
        logger.error(messages.TLS_CONFIGURATION_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
        return process.exit()
      }

      // Load CA certificates
      if (webConfig.ca) {
        const caCertLocationArr = webConfig.ca
        const caCertArr = []
        for (let i: number = 0; i < caCertLocationArr.length; i++) {
          if (!fs.existsSync(path.join(__dirname, caCertLocationArr[i]))) {
            caCertArr.push(
              fs.readFileSync(
                path.join(__dirname, caCertLocationArr[i]),
                'utf8'
              )
            )
          }
        }
        webConfig.ca = caCertArr
      } else {
        logger.error(messages.TLS_CONFIGURATION_WEBSERVER_CA_CERTIFICATE_DOES_NOT_EXIST)
        return process.exit()
      }

      // Perform 'OR' operation between SecureOptions
      // Example: { secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 |  constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv11}
      if (webConfig.secureOptions) {
        if (webConfig.secureOptions.length === 1) {
          // No need of 'OR' if only one option
          webConfig.secureOptions = webConfig.secureOptions[0]
        } else {
          const optionArr = webConfig.secureOptions
          let secoption: any = constants[optionArr[0]] | constants[optionArr[1]]
          for (let i: number = 2; i < optionArr.length; i++) {
            secoption = secoption | constants[optionArr[i]]
          }
          webConfig.secureOptions = secoption
        }
      }
      return webConfig
    } catch (ex) {
      logger.error(messages.TLS_CONFIGURATION_WEB_TLS_EXCEPTION, ex)
      return process.exit()
    }
  },

  mps: (): mpsConfigType => {
    try {
      let mpsConfig: mpsConfigType
      // Parse MPS TLS Configuration json file
      try {
        if (fs.existsSync(mpsTlsConfigPath)) {
          mpsConfig = JSON.parse(fs.readFileSync(mpsTlsConfigPath, 'utf8'))
        } else {
          logger.error(`${messages.TLS_CONFIGURATION_MPS_TLS_CONFIG_DOES_NOT_EXIST} ${mpsTlsConfigPath}`)
          return
        }
      } catch (ex) {
        logger.error(messages.TLS_CONFIGURATION_JSON_PARSE_EXCEPTION, ex.message)
        return process.exit()
      }

      // Delete elements that are null
      for (const i in mpsConfig) {
        if (mpsConfig[i] == null) {
          delete mpsConfig[i]
          continue
        }
        if (mpsConfig[i] instanceof Array) {
          if (mpsConfig[i].length === 0) {
            delete mpsConfig[i]
            continue
          }
        }
      }

      // Load SSL Cert and key
      if (mpsConfig.key && mpsConfig.cert) {
        if (
          !fs.existsSync(path.join(__dirname, mpsConfig.key)) ||
          !fs.existsSync(path.join(__dirname, mpsConfig.cert))
        ) {
          logger.error(messages.TLS_CONFIGURATION_TLS_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
          return process.exit()
        } else {
          mpsConfig.key = fs.readFileSync(
            path.join(__dirname, mpsConfig.key),
            'utf8'
          )
          mpsConfig.cert = fs.readFileSync(
            path.join(__dirname, mpsConfig.cert),
            'utf8'
          )
        }
      } else {
        logger.error(messages.TLS_CONFIGURATION_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
        return process.exit()
      }

      // Perform 'OR' operation between SecureOptions
      // Example: { secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 |  constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv11}
      if (mpsConfig.secureOptions) {
        if (mpsConfig.secureOptions.length === 1) {
          // No need of 'OR' if only one option
          mpsConfig.secureOptions = mpsConfig.secureOptions[0]
        } else {
          const optionArr = mpsConfig.secureOptions
          let secoption: any =
            constants[optionArr[0]] | constants[optionArr[1]]
          for (let i: number = 2; i < optionArr.length; i++) {
            secoption = secoption | constants[optionArr[i]]
          }
          mpsConfig.secureOptions = secoption
        }
      }
      return mpsConfig
    } catch (ex) {
      logger.error(messages.TLS_CONFIGURATION_MPS_TLS_CONFIGURATION_EXCEPTION, ex.message)
      return process.exit()
    }
  },

  direct: (): directConfigType => {
    try {
      let directConnConfig: directConfigType
      // Parse MPS TLS Configuration json file
      try {
        if (fs.existsSync(directConnTlsConfigPath)) {
          directConnConfig = JSON.parse(fs.readFileSync(directConnTlsConfigPath, 'utf8'))
        } else {
          logger.error(`${messages.TLS_CONFIGURATION_DIRECT_TLS_CONFIG_DOES_NOT_EXIST} ${directConnTlsConfigPath}`)
          return
        }
      } catch (ex) {
        logger.error(messages.TLS_CONFIGURATION_JSON_PARSE_EXCEPTION, ex.message)
        return process.exit()
      }

      // Load SSL Cert and key
      if (directConnConfig.key && directConnConfig.cert && directConnConfig.ca) {
        if (!fs.existsSync(path.join(__dirname, directConnConfig.key)) || !fs.existsSync(path.join(__dirname, directConnConfig.cert))) {
          logger.error(messages.TLS_CONFIGURATION_TLS_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
          return process.exit()
        } else {
          directConnConfig.key = fs.readFileSync(path.join(__dirname, directConnConfig.key), 'utf8')
          directConnConfig.cert = fs.readFileSync(path.join(__dirname, directConnConfig.cert), 'utf8')
          directConnConfig.ca = fs.readFileSync(path.join(__dirname, directConnConfig.ca), 'utf8')
        }
      } else {
        logger.error(messages.TLS_CONFIGURATION_CERTIFICATE_OR_KEY_DOES_NOT_EXIST)
        return process.exit()
      }
      if (directConnConfig.secureOptions) {
        const optionArr = directConnConfig.secureOptions
        let secoption: any = constants[optionArr[0]] | constants[optionArr[1]]
        for (let i: number = 2; i < optionArr.length; i++) {
          secoption = secoption | constants[optionArr[i]]
        }
        directConnConfig.secureOptions = secoption
      }
      return directConnConfig
    } catch (ex) {
      logger.error(messages.TLS_CONFIGURATION_DIRECT_TLS_CONFIGURATION_EXCEPTION, ex.message)
      return process.exit()
    }
  }
}
