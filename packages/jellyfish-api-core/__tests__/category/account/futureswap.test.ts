import { MasterNodeRegTestContainer } from '@defichain/testcontainers'
import BigNumber from 'bignumber.js'
import { Testing } from '@defichain/jellyfish-testing'
import { FutureSwap } from 'packages/jellyfish-api-core/src/category/account'

const container = new MasterNodeRegTestContainer()
const testing = Testing.create(container)
let collateralAddress: string
let oracleId: string
let idDUSD: string
let idTSLA: string
// let idAMZN: string
// let idBTC: string
const attributeKey = 'ATTRIBUTES'
// let key: string
let futInterval: number
let futRewardPercentage: number
const contractAddress = 'bcrt1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpsqgljc'

async function setup (): Promise<void> {
  collateralAddress = await testing.generateAddress()
  await testing.token.dfi({ address: collateralAddress, amount: 300000 })
  await testing.token.create({ symbol: 'BTC', collateralAddress })
  await testing.generate(1)
  await testing.token.mint({ symbol: 'BTC', amount: 20000 })
  await testing.generate(1)

  // loan scheme
  await testing.container.call('createloanscheme', [100, 1, 'default'])
  await testing.generate(1)

  // price oracle
  const priceFeeds = [
    { token: 'DFI', currency: 'USD' },
    { token: 'BTC', currency: 'USD' },
    { token: 'TSLA', currency: 'USD' },
    { token: 'AMZN', currency: 'USD' },
    { token: 'DUSD', currency: 'USD' }
  ]

  const addr = await testing.generateAddress()
  oracleId = await testing.rpc.oracle.appointOracle(addr, priceFeeds, { weightage: 1 })
  await testing.generate(1)

  const timestamp = Math.floor(new Date().getTime() / 1000)
  await testing.rpc.oracle.setOracleData(
    oracleId,
    timestamp,
    {
      prices: [
        { tokenAmount: '1@DFI', currency: 'USD' },
        { tokenAmount: '10000@BTC', currency: 'USD' },
        { tokenAmount: '2@TSLA', currency: 'USD' },
        { tokenAmount: '4@AMZN', currency: 'USD' },
        { tokenAmount: '1@DUSD', currency: 'USD' }
      ]
    }
  )
  await testing.generate(1)

  // collateral tokens
  await testing.rpc.loan.setCollateralToken({
    token: 'DFI',
    factor: new BigNumber(1),
    fixedIntervalPriceId: 'DFI/USD'
  })
  await testing.generate(1)

  await testing.rpc.loan.setCollateralToken({
    token: 'BTC',
    factor: new BigNumber(0.5),
    fixedIntervalPriceId: 'BTC/USD'
  })
  await testing.generate(1)

  // loan token
  await testing.rpc.loan.setLoanToken({
    symbol: 'TSLA',
    fixedIntervalPriceId: 'TSLA/USD'
  })
  await testing.generate(1)

  await testing.rpc.loan.setLoanToken({
    symbol: 'AMZN',
    fixedIntervalPriceId: 'AMZN/USD'
  })
  await testing.generate(1)

  await testing.rpc.loan.setLoanToken({
    symbol: 'DUSD',
    fixedIntervalPriceId: 'DUSD/USD'
  })
  await testing.generate(1)

  // idBTC = await testing.token.getTokenId('BTC')
  idTSLA = await testing.token.getTokenId('TSLA')
  // idAMZN = await testing.token.getTokenId('AMZN')
  idDUSD = await testing.token.getTokenId('DUSD')

  // create a vault and take loans
  const vaultAddr = await testing.generateAddress()
  const vaultId = await testing.rpc.loan.createVault({
    ownerAddress: vaultAddr,
    loanSchemeId: 'default'
  })
  await testing.generate(1)

  await testing.rpc.loan.depositToVault({
    vaultId: vaultId, from: collateralAddress, amount: '100000@DFI'
  })

  // wait till the price valid.
  await testing.container.waitForPriceValid('TSLA/USD')

  // take multiple loans
  await testing.rpc.loan.takeLoan({
    vaultId: vaultId,
    to: collateralAddress,
    amounts: ['300@TSLA', '500@DUSD', '100@AMZN']
  })
  await testing.generate(1)

  // Futures setup
  // set the dfip2203/active to false
  await testing.rpc.masternode.setGov({ [attributeKey]: { 'v0/params/dfip2203/active': 'false' } })
  await testing.generate(1)

  // set dfip2203 params
  futInterval = 25
  futRewardPercentage = 0.05
  await testing.rpc.masternode.setGov({ [attributeKey]: { 'v0/params/dfip2203/reward_pct': futRewardPercentage.toString(), 'v0/params/dfip2203/block_period': futInterval.toString() } })
  await testing.generate(1)

  // activat the dfip2203/active now
  await testing.rpc.masternode.setGov({ [attributeKey]: { 'v0/params/dfip2203/active': 'true' } })
  await testing.generate(1)

  // Retrive and verify gov vars
  const attributes = await testing.rpc.masternode.getGov('ATTRIBUTES')
  expect(attributes.ATTRIBUTES['v0/params/dfip2203/active']).toStrictEqual('true')
  expect(attributes.ATTRIBUTES['v0/params/dfip2203/reward_pct']).toStrictEqual(futRewardPercentage.toString())
  expect(attributes.ATTRIBUTES['v0/params/dfip2203/block_period']).toStrictEqual(futInterval.toString())
}

async function getNextSettleBlock (): Promise<number> {
  const blockCount = await testing.rpc.blockchain.getBlockCount()
  const nextSettleBlock = blockCount + (futInterval - (blockCount % futInterval))
  return nextSettleBlock
}

describe('futureSwap', () => {
  beforeEach(async () => {
    await testing.container.start()
    await testing.container.waitForWalletCoinbaseMaturity()
    await setup()
  })

  afterEach(async () => {
    await testing.container.stop()
  })

  it('should create futureswap dtoken to dusd', async () => {
    const tslaAddress = await testing.generateAddress()
    await testing.rpc.account.accountToAccount(collateralAddress, { [tslaAddress]: '1@TSLA' })
    await testing.generate(1)

    const swapAmount = 1
    const fswap: FutureSwap = {
      address: tslaAddress,
      amount: swapAmount.toString() + '@TSLA'
    }
    await testing.rpc.account.futureSwap(fswap)
    await testing.generate(1)

    // check the future is in effect
    {
      const pendingFutures = await testing.container.call('listpendingfutureswaps')
      expect(pendingFutures.length).toStrictEqual(1)
      expect(pendingFutures[0].owner).toStrictEqual(tslaAddress)
      expect(pendingFutures[0].source).toStrictEqual(swapAmount.toFixed(8) + '@TSLA')
      expect(pendingFutures[0].destination).toStrictEqual('DUSD')

      // check live/economy/dfip2203_*
      const attributes = await testing.rpc.masternode.getGov('ATTRIBUTES')
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_current']).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_burned']).toBeUndefined()
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_minted']).toBeUndefined()

      // dfip2203 burn should be empty
      const burnBefore = await testing.rpc.account.getBurnInfo()
      expect(burnBefore.dfip2203).toStrictEqual([])

      {
        // check contractAddress
        const balance = await testing.rpc.account.getAccount(contractAddress)
        expect(balance).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
      }

      {
        // check tslaAddress
        const balance = await testing.rpc.account.getAccount(tslaAddress)
        expect(balance).toStrictEqual([])
      }
    }

    // get minted DUSD
    const dusdMintedBefore = (await testing.rpc.token.getToken(idDUSD))[idDUSD].minted

    // move to next settle block
    const nextSettleBlock = await getNextSettleBlock()
    await testing.generate(nextSettleBlock - await testing.rpc.blockchain.getBlockCount())

    // check future settled
    {
      // calclulate minted DUSD. dtoken goes for a discount.
      const mintedDUSD = (1 - futRewardPercentage) * 2 * swapAmount // (1 - reward percentage) * TSLADUSD value * TSLA swap amount;
      const dusdMintedAfter = (await testing.rpc.token.getToken(idDUSD))[idDUSD].minted
      expect(dusdMintedAfter).toStrictEqual(dusdMintedBefore.plus(mintedDUSD))

      const pendingFutures = await testing.container.call('listpendingfutureswaps')
      expect(pendingFutures.length).toStrictEqual(0)

      // check live/economy/dfip2203_*
      const attributes = await testing.rpc.masternode.getGov('ATTRIBUTES')
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_current']).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_burned']).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_minted']).toStrictEqual([mintedDUSD.toFixed(8) + '@DUSD'])

      {
        // check contractAddress
        const balance = await testing.rpc.account.getAccount(contractAddress)
        expect(balance).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
      }

      {
        // check tslaAddress
        const balance = await testing.rpc.account.getAccount(tslaAddress)
        expect(balance).toStrictEqual([mintedDUSD.toFixed(8) + '@DUSD'])
      }
    }

    // check burn
    const burnAfter = await testing.rpc.account.getBurnInfo()
    expect(burnAfter.dfip2203).toStrictEqual([swapAmount.toFixed(8) + '@TSLA'])
  })

  it('should create futureswap dusd to dtoken', async () => {
    const tslaAddress = await testing.generateAddress()
    await testing.rpc.account.accountToAccount(collateralAddress, { [tslaAddress]: '1@DUSD' })
    await testing.generate(1)

    const swapAmount = 1
    const fswap: FutureSwap = {
      address: tslaAddress,
      amount: swapAmount.toString() + '@DUSD',
      destination: 'TSLA'
    }
    await testing.rpc.account.futureSwap(fswap)
    await testing.generate(1)

    // check the future is in effect
    {
      const pendingFutures = await testing.container.call('listpendingfutureswaps')
      expect(pendingFutures.length).toStrictEqual(1)
      expect(pendingFutures[0].owner).toStrictEqual(tslaAddress)
      expect(pendingFutures[0].source).toStrictEqual(swapAmount.toFixed(8) + '@DUSD')
      expect(pendingFutures[0].destination).toStrictEqual('TSLA')

      // check live/economy/dfip2203_*
      const attributes = await testing.rpc.masternode.getGov('ATTRIBUTES')
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_current']).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_burned']).toBeUndefined()
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_minted']).toBeUndefined()

      // dfip2203 burn should be empty
      const burnBefore = await testing.rpc.account.getBurnInfo()
      expect(burnBefore.dfip2203).toStrictEqual([])

      {
        // check contractAddress
        const balance = await testing.rpc.account.getAccount(contractAddress)
        expect(balance).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
      }

      {
        // check tslaAddress
        const balance = await testing.rpc.account.getAccount(tslaAddress)
        expect(balance).toStrictEqual([])
      }
    }

    // get minted TSLA
    const tslaMintedBefore = (await testing.rpc.token.getToken(idTSLA))[idTSLA].minted

    // move to next settle block
    const nextSettleBlock = await getNextSettleBlock()
    await testing.generate(nextSettleBlock - await testing.rpc.blockchain.getBlockCount())

    // check future settled
    {
      // calclulate minted TSLA. dtoken goes for a premium.
      const mintedTSLA = new BigNumber((1 / (1 + futRewardPercentage)) * (1 / 2) * swapAmount).dp(8, BigNumber.ROUND_FLOOR) // (1/(1 + reward percentage)) * (DUSDTSLA) value * DUSD swap amount;
      const tslaMintedAfter = (await testing.rpc.token.getToken(idTSLA))[idTSLA].minted
      expect(tslaMintedAfter).toStrictEqual(tslaMintedBefore.plus(mintedTSLA))

      const pendingFutures = await testing.container.call('listpendingfutureswaps')
      expect(pendingFutures.length).toStrictEqual(0)

      // check live/economy/dfip2203_*
      const attributes = await testing.rpc.masternode.getGov('ATTRIBUTES')
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_current']).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_burned']).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
      expect(attributes.ATTRIBUTES['v0/live/economy/dfip2203_minted']).toStrictEqual([mintedTSLA.toString() + '@TSLA'])

      {
        // check contractAddress
        const balance = await testing.rpc.account.getAccount(contractAddress)
        expect(balance).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
      }

      {
        // check tslaAddress
        const balance = await testing.rpc.account.getAccount(tslaAddress)
        expect(balance).toStrictEqual([mintedTSLA.toString() + '@TSLA'])
      }
    }

    // check burn
    const burnAfter = await testing.rpc.account.getBurnInfo()
    expect(burnAfter.dfip2203).toStrictEqual([swapAmount.toFixed(8) + '@DUSD'])
  })
})