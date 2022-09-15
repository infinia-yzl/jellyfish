import { StatusApiTesting } from '../../testing/StatusApiTesting'
import { ApiPagedResponse, WhaleApiClient } from '@defichain/whale-api-client'
import { Oracle, OraclePriceFeed } from '@defichain/whale-api-client/dist/api/oracles'
import { PriceOracle, PriceTicker } from '@defichain/whale-api-client/dist/api/prices'

const apiTesting = StatusApiTesting.create()

beforeAll(async () => {
  await apiTesting.start()
  jest.spyOn(apiTesting.app.get(WhaleApiClient).oracles, 'getOracleByAddress')
    .mockReturnValue(getMockedOracle())
})

afterAll(async () => {
  await apiTesting.stop()
})

describe('OracleStatusController - Status test', () => {
  it('/oracles/<address> - should get operational as last published <= 60 mins ago', async () => {
    jest.spyOn(apiTesting.app.get(WhaleApiClient).oracles, 'getPriceFeed')
      .mockReturnValueOnce(getMockedOraclePriceFeed('df1qm7f2cx8vs9lqn8v43034nvckz6dxxpqezfh6dw', 5))

    const res = await apiTesting.app.inject({
      method: 'GET',
      url: 'oracles/df1qm7f2cx8vs9lqn8v43034nvckz6dxxpqezfh6dw'
    })
    expect(res.json()).toStrictEqual({
      status: 'operational'
    })
    expect(res.statusCode).toStrictEqual(200)
  })

  it('/oracles/<address> - should get outage as last published > 60 mins ago', async () => {
    jest.spyOn(apiTesting.app.get(WhaleApiClient).oracles, 'getPriceFeed')
      .mockReturnValueOnce(getMockedOraclePriceFeed('df1qcpp3entq53tdyklm5v0lnvqer4verr4puxchq4', 62))

    const res = await apiTesting.app.inject({
      method: 'GET',
      url: 'oracles/df1qcpp3entq53tdyklm5v0lnvqer4verr4puxchq4'
    })
    expect(res.json()).toStrictEqual({
      status: 'outage'
    })
    expect(res.statusCode).toStrictEqual(200)
  })

  it('/oracles/<address> - should get outage if no results are returned', async () => {
    jest.spyOn(apiTesting.app.get(WhaleApiClient).oracles, 'getPriceFeed')
      .mockReturnValueOnce(getMockedOraclePriceFeedEmpty('df1qm7f2cx8vs9lqn8v43034nvp0fjsnvie93j'))

    const res = await apiTesting.app.inject({
      method: 'GET',
      url: 'oracles/df1qm7f2cx8vs9lqn8v43034nvp0fjsnvie93j'
    })
    expect(res.json()).toStrictEqual({
      status: 'outage'
    })
    expect(res.statusCode).toStrictEqual(200)
  })
})

async function getMockedOraclePriceFeed (oracleAddress: string, minutesDiff: number): Promise<ApiPagedResponse<OraclePriceFeed>> {
  const blockMedianTime = Date.now() / 1000 - (minutesDiff * 60)

  return new ApiPagedResponse({
    data: [{
      block: {
        medianTime: blockMedianTime,
        hash: '',
        height: 0,
        time: 0
      },
      id: '',
      key: '',
      sort: '',
      token: '',
      currency: '',
      oracleId: '',
      txid: '',
      time: 0,
      amount: ''
    }]
  }, 'GET', `oracles/${oracleAddress}/AAPL-USD/feed`)
}

async function getMockedOraclePriceFeedEmpty (oracleAddress: string): Promise<ApiPagedResponse<OraclePriceFeed>> {
  return new ApiPagedResponse({
    data: []
  }, 'GET', `oracles/${oracleAddress}/AAPL-USD/feed`)
}

async function getMockedOracle (): Promise<Oracle> {
  return {
    id: '',
    block: {
      hash: '',
      height: 0,
      medianTime: 0,
      time: 0
    },
    ownerAddress: '',
    priceFeeds: [{
      token: '',
      currency: ''
    }],
    weightage: 0
  }
}

describe('OracleStatusController - Oracle Active Status test', () => {
  it('/oracles/<token>-<currency> - should get operational if more than ', async () => {
    jest.spyOn(apiTesting.app.get(WhaleApiClient).prices, 'getOracles')
      .mockReturnValueOnce(getMockedPriceOracle(3))

    jest.spyOn(apiTesting.app.get(WhaleApiClient).prices, 'get')
      .mockReturnValueOnce(getMockedPriceTicker(3))

    const res = await apiTesting.app.inject({
      method: 'GET',
      url: 'oracles/DFI/DUSD'
    })
    expect(res.json()).toStrictEqual({
      status: 'operational'
    })
    expect(res.statusCode).toStrictEqual(200)
  })
})

async function getMockedPriceOracle (numberOfOracles: number): Promise<ApiPagedResponse<PriceOracle>> {
  const data = []

  while (numberOfOracles-- > 0) {
    data.push({
      feed: undefined,
      key: '',
      oracleId: '',
      token: '',
      id: '',
      block: {
        hash: '',
        height: 0,
        medianTime: 0,
        time: 0
      },
      currency: '',
      weightage: 0
    })
  }
  return new ApiPagedResponse({
    data: data
  }, 'GET', 'getOracles')
}

async function getMockedPriceTicker (active: number): Promise<PriceTicker> {
  return {
    id: '',
    price: {
      id: '',
      key: '',
      sort: '',
      token: '',
      currency: '',
      aggregated: {
        amount: '',
        weightage: 0,
        oracles: {
          active: active,
          total: 0
        }
      },
      block: {
        hash: '',
        height: 0,
        time: 0,
        medianTime: 0
      }
    },
    sort: ''
  }
}
