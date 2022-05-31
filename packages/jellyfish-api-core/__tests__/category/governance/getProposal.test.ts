import { ContainerAdapterClient } from '../../container_adapter_client'
import { RpcApiError } from '../../../src'
import { ProposalStatus, ProposalType } from '../../../src/category/governance'
import BigNumber from 'bignumber.js'
import { MasterNodeRegTestContainer } from '@defichain/testcontainers'
import { RegTestFoundationKeys } from '@defichain/jellyfish-network'

describe('Governance', () => {
  const container = new MasterNodeRegTestContainer()
  const client = new ContainerAdapterClient(container)

  beforeAll(async () => {
    await container.start()
    await container.waitForWalletCoinbaseMaturity()

    await client.wallet.sendToAddress(RegTestFoundationKeys[0].owner.address, 10)
    await container.generate(1)
  })

  afterAll(async () => {
    await container.stop()
  })

  it('should getGovProposal', async () => {
    const data = {
      title: 'Testing new community fund proposal',
      context: 'https://github.com/DeFiCh/dfips',
      amount: 100,
      payoutAddress: await container.call('getnewaddress'),
      cycles: 2
    }
    const proposalId = await container.call('creategovcfp', [data])
    await container.generate(1)

    expect(typeof proposalId).toStrictEqual('string')

    const proposal = await client.governance.getGovProposal(proposalId)
    expect(typeof proposal.cyclesPaid).toStrictEqual('number')
    expect(typeof proposal.finalizeAfter).toStrictEqual('number')
    expect(proposal.proposalId).toStrictEqual(proposalId)
    expect(proposal.title).toStrictEqual(data.title)
    expect(proposal.type).toStrictEqual(ProposalType.COMMUNITY_FUND_PROPOSAL)
    expect(proposal.status).toStrictEqual(ProposalStatus.VOTING)
    expect(proposal.amount).toStrictEqual(new BigNumber(data.amount))
    expect(proposal.totalCycles).toStrictEqual(data.cycles)
    expect(proposal.payoutAddress).toStrictEqual(data.payoutAddress)
  })

  it('should not getGovProposal if proposalId is invalid', async () => {
    const proposalId = 'e4087598bb396cd3a94429843453e67e68b1c7625a99b0b4c505abcc4506697b'
    const promise = client.governance.getGovProposal(proposalId)

    await expect(promise).rejects.toThrow(RpcApiError)
    await expect(promise).rejects.toThrow(`RpcApiError: 'Proposal <${proposalId}> does not exists', code: -8, method: getgovproposal`)
  })
})
