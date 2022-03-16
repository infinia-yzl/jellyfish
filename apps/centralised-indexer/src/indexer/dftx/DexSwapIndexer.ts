import { DfTxIndexer, DfTxTransaction } from './RootDfTxIndexer'
import { ApiClient, blockchain as defid } from '@defichain/jellyfish-api-core'
import { CPoolSwap, PoolSwap } from '@defichain/jellyfish-transaction'
import { DexSwap, DexSwapService } from '../../models/dftx/DexSwap'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { TokenService } from '../../models/dftx/Token'
import { fromScript } from '@defichain/jellyfish-address'
import { AccountHistory } from '@defichain/jellyfish-api-core/src/category/account'
import { NetworkName } from '@defichain/jellyfish-network'
import BigNumber from 'bignumber.js'

/**
 * Indexes dex swaps to support performant queries
 */
@Injectable()
export class DexSwapIndexer implements DfTxIndexer<PoolSwap> {
  OP_CODE = CPoolSwap.OP_CODE

  constructor (
    private readonly apiClient: ApiClient,
    private readonly dexSwapService: DexSwapService,
    private readonly tokenService: TokenService,
    @Inject('NETWORK') private readonly network: NetworkName
  ) {
  }

  async index (block: defid.Block<defid.Transaction>, dfTx: DfTxTransaction<PoolSwap>): Promise<void> {
    await this.dexSwapService.upsert(await this.map(block, dfTx))
  }

  async invalidate (block: defid.Block<defid.Transaction>, dfTx: DfTxTransaction<PoolSwap>): Promise<void> {
    // TODO(eli-lim)
  }

  async map (block: defid.Block<defid.Transaction>, dfTx: DfTxTransaction<PoolSwap>): Promise<DexSwap> {
    const poolSwap = dfTx.dftx.data
    const fromToken = await this.tokenService.get(poolSwap.fromTokenId)
    const toToken = await this.tokenService.get(poolSwap.toTokenId)

    if (fromToken === undefined || toToken === undefined) {
      throw new NotFoundException(
        'Failed lookup for token data - ' +
        JSON.stringify({
          [poolSwap.fromTokenId]: fromToken,
          [poolSwap.toTokenId]: toToken
        })
      )
    }

    return {
      block: {
        hash: block.hash,
        height: block.height,
        medianTime: block.mediantime,
        time: block.time
      },
      id: dfTx.txn.txid,
      txno: dfTx.txnNo,
      timestamp: block.mediantime.toFixed(0),
      fromAmount: poolSwap.fromAmount,
      fromSymbol: fromToken.symbol,
      toAmount: await this.findToAmount(block, dfTx),
      toSymbol: toToken.symbol
    }
  }

  /**
   * Calls getaccounthistory to get the amount received by the pool (i.e. the `toAmount` of the dex swap)
   */
  async findToAmount (block: defid.Block<defid.Transaction>, dfTx: DfTxTransaction<PoolSwap>): Promise<BigNumber> {
    const poolSwap: PoolSwap = dfTx.dftx.data
    const blockHeight = block.height
    const transactionOrder = dfTx.txnNo

    const toAddress = fromScript(poolSwap.toScript, this.network)?.address

    const poolHistory = await this.apiClient.call<AccountHistory>(
      'getaccounthistory',
      [toAddress, blockHeight, transactionOrder],
      'number'
    )

    return findAmountReceivedByPoolAddress(poolHistory)
  }
}

function findAmountReceivedByPoolAddress (poolAccountHistory: AccountHistory): BigNumber {
  for (const amount of poolAccountHistory.amounts) {
    const [value] = amount.split('@')
    const isPositive = !value.startsWith('-')
    if (isPositive) {
      return new BigNumber(value).absoluteValue()
    }
  }

  throw new Error(
    `Could not find toAmount from pool account history ${poolAccountHistory.txid}. ` +
    `Amounts: [${poolAccountHistory.amounts.join(', ')}]`
  )
}