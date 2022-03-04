import { PeerCertificate } from 'tls'
import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios'

import { Monitor, MonitorTuples, MonitorResult } from '@httpmon/db'
import timer, { Timings } from '@szmarczak/http-timer'
import https from 'https'
import clone from 'lodash.clonedeep'
import Handlebars from 'handlebars'
import { randomInt } from 'crypto'

Handlebars.registerHelper('RandomInt', function () {
  return randomInt(10000)
})

const transport = {
  request: function httpsWithTimer(...args: any[]) {
    const request = https.request.apply(null, args)
    timer(request)
    return request
  },
}

function responseToMonitorResult(resp: AxiosResponse<any, any> | null) {
  let body: string = ''
  let bodyJson: string | undefined
  let bodySize = 0
  if (resp?.data) {
    if (typeof resp.data == 'object') {
      bodyJson = JSON.stringify(resp.data, null, 2)
      bodySize = bodyJson.length
    } else if (typeof resp.data == 'string') {
      body = resp.data
      bodySize = body.length
    }
  }
  let timings: Timings = resp?.request?.timings ?? null

  return {
    code: resp?.status ?? 0,
    codeStatus: resp?.statusText ?? '',
    dnsLookupTime: timings?.phases?.dns ?? 0,
    tcpConnectTime: timings?.phases?.tcp ?? 0,
    tlsHandshakeTime: timings?.phases?.tls ?? 0,
    timeToFirstByte: timings?.phases?.firstByte ?? 0,
    totalTime: timings?.phases?.total ?? 0,
    protocol: '',
    body,
    bodyJson,
    bodySize,
    headers: Object.entries(resp?.headers ?? {}) as MonitorTuples,
    certCommonName: '',
    certExpiryDays: 0,
  }
}

function headersToMap(headers: MonitorTuples) {
  let hmap = <AxiosRequestHeaders>{}
  headers.forEach((header) => {
    hmap[header[0]] = header[1]
  })
  return hmap
}

function processTemplates(mon: Monitor) {
  //url bar
  //header value fields
  //query value fields
  //body
  let env: { [k: string]: string } = {}
  if (mon.env && typeof mon.env != 'string') {
    mon.env.map(([name, value]) => {
      env[name] = value
    })
  }
  console.log('env', env)

  let m = clone(mon)

  m.url = Handlebars.compile(mon.url)(env)

  if (mon.headers && typeof mon.headers != 'string') {
    let hdrs = m.headers as MonitorTuples
    m.headers = hdrs.map(([name, value]) => [
      name,
      Handlebars.compile(value)(env),
    ])
  }

  if (mon.queryParams && typeof mon.queryParams != 'string') {
    let qp = m.queryParams as MonitorTuples
    m.queryParams = qp.map(([name, value]) => [
      name,
      Handlebars.compile(value)(env),
    ])
  }

  if (m.body) {
    m.body = Handlebars.compile(mon.body)(env)
  }
  return m
}

export async function execMonitor(monitor: Monitor) {
  let certCommonName = ''
  let certExpiryDays = 0
  let resp: AxiosResponse<any, any>

  var startTime = performance.now()
  const mon = processTemplates(monitor)
  var endTime = performance.now()
  console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

  try {
    resp = await axios.request({
      url: mon.url,
      method: mon.method == 'GET' ? 'GET' : 'POST',
      data: mon.body == '' ? undefined : mon.body,
      //@ts-ignore
      transport,
      httpsAgent: new https.Agent({ keepAlive: false }),
      headers: headersToMap((mon.headers as MonitorTuples) ?? []),
      responseType: 'text',
      params: headersToMap((mon.queryParams as MonitorTuples) ?? []),
    })

    const certificate: PeerCertificate =
      resp.request.res.socket.getPeerCertificate(false)
    if (certificate && certificate.subject) {
      certCommonName = certificate.subject.CN
      const expiry = new Date(certificate.valid_to).valueOf()
      const now = new Date().valueOf()
      certExpiryDays = Math.floor((expiry - now) / 1000 / 60 / 60 / 24)
    }

    const result: MonitorResult = {
      ...responseToMonitorResult(resp),
      monitorId: mon.id ?? 'ondemand',
      certCommonName,
      certExpiryDays,
      err: '',
    }

    return result
  } catch (e) {
    if (e.response) {
      const resp = e.response
      return {
        ...responseToMonitorResult(resp),
        monitorId: mon.id ?? 'ondemand',
        certCommonName,
        certExpiryDays,
        err: '',
      } as MonitorResult
    } else {
      return {
        ...responseToMonitorResult(null),
        err: e?.message ?? e.toString(),
        monitorId: mon.id ?? 'ondemand',
      } as MonitorResult
    }
  }
}
