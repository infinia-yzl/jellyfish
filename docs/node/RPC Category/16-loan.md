---
id: loan
title: Loan API
sidebar_label: Loan API
slug: /jellyfish/api/loan
---

```js
import {Client} from '@defichain/jellyfish'
const client = new Client()

// Using client.loan.
const something = await client.loan.method()
```

## createLoanScheme

Creates a loan scheme transaction.

```ts title="client.loan.createLoanScheme()"
interface loan {
  createLoanScheme (scheme: CreateLoanScheme, utxos: UTXO[] = []): Promise<string>
}

interface CreateLoanScheme {
  minColRatio: number
  interestRate: BigNumber
  id: string
}

interface UTXO {
  txid: string
  vout: number
}
```

## updateLoanScheme

Updates an existing loan scheme.

```ts title="client.loan.updateLoanScheme()"
interface loan {
  updateLoanScheme (scheme: UpdateLoanScheme, utxos: UTXO[] = []): Promise<string>
}

interface UpdateLoanScheme {
  minColRatio: number
  interestRate: BigNumber
  id: string
  activateAfterBlock?: number
}

interface UTXO {
  txid: string
  vout: number
}
```

## listLoanSchemes

List all available loan schemes.

```ts title="client.loan.listLoanSchemes()"
interface loan {
  listLoanSchemes (): Promise<LoanSchemeResult[]>
}

interface LoanSchemeResult {
  id: string
  mincolratio: BigNumber
  interestrate: BigNumber
  default: boolean
}
```

## getLoanScheme

Get loan scheme.

```ts title="client.loan.getLoanScheme()"
interface loan {
  getLoanScheme (id: string): Promise<GetLoanSchemeResult>
}

interface GetLoanSchemeResult {
  id: string
  interestrate: BigNumber
  mincolratio: BigNumber
}
```

## setDefaultLoanScheme

Sets the default loan scheme.

```ts title="client.loan.setDefaultLoanScheme()"
interface loan {
  setDefaultLoanScheme (id: string, utxos: UTXO[] = []): Promise<string>
}

interface UTXO {
  txid: string
  vout: number
}
```

## destroyLoanScheme

Destroys a loan scheme.

```ts title="client.loan.destroyLoanScheme()"
interface loan {
  destroyLoanScheme (scheme: DestroyLoanScheme, utxos: UTXO[] = []): Promise<string>
}

interface DestroyLoanScheme {
  id: string
  activateAfterBlock?: number
}

interface UTXO {
  txid: string
  vout: number
}
```

## setCollateralToken

Set a collateral token transaction.

```ts title="client.loan.setCollateralToken()"
interface loan {
  setCollateralToken (collateralToken: SetCollateralToken, utxos: UTXO[] = []): Promise<string>
}

interface SetCollateralToken {
  token: string
  factor: BigNumber
  priceFeedId: string
  activateAfterBlock?: number
}

interface UTXO {
  txid: string
  vout: number
}
```

## listCollateralTokens

List collateral tokens.

```ts title="client.loan.listCollateralTokens()"
interface loan {
  listCollateralTokens (collateralToken: ListCollateralTokens = {}): Promise<CollateralTokensData>
}

interface ListCollateralTokens {
  height?: number
  all?: boolean
}

interface CollateralTokensData {
  [key: string]: CollateralTokenDetails
}

interface CollateralTokenDetails {
  token: string
  factor: BigNumber
  priceFeedId: string
  activateAfterBlock: BigNumber
}
```

## getCollateralToken

Get collateral token.

```ts title="client.loan.getCollateralToken()"
interface loan {
  getCollateralToken (token: string): Promise<CollateralTokenDetails>
}

interface CollateralTokenDetails {
  token: string
  factor: BigNumber
  priceFeedId: string
  activateAfterBlock: BigNumber
}
```

## setLoanToken

Creates (and submits to local node and network) a token for a price feed set in collateral token.

```ts title="client.loan.setLoanToken()"
interface loan {
  setLoanToken (loanToken: SetLoanToken, utxos: UTXO[] = []): Promise<string>
}

interface SetLoanToken {
  symbol: string
  name?: string
  priceFeedId: string
  mintable?: boolean
  interest?: BigNumber
}

interface UTXO {
  txid: string
  vout: number
}
```

## updateLoanToken

Updates an existing loan token.

```ts title="client.loan.updateLoanToken()"
interface loan {
  updateLoanToken (oldToken: string, newTokenDetails: UpdateLoanToken, utxos: UTXO[] = []): Promise<string>
}

interface UpdateLoanToken {
  symbol?: string
  name?: string
  priceFeedId?: string
  mintable?: boolean
  interest?: BigNumber
}

interface UTXO {
  txid: string
  vout: number
}
```

## getInterest

Get interest info.

```ts title="client.loan.getInterest()"
interface loan {
  getInterest (id: string, token?: string): Promise<Interest[]>
}

interface Interest {
  token: string
  totalInterest: BigNumber
  interestPerBlock: BigNumber
}
```

## listLoanTokens

List all created loan tokens.

```ts title="client.loan.listLoanTokens()"
interface loan {
  listLoanTokens (): Promise<ListLoanTokenResult>
}

interface ListLoanTokenResult {
  [key: string]: LoanTokenDetails
}

interface LoanTokenDetails {
  token: token.TokenResult
  priceFeedId: string
  interest: BigNumber
}

interface TokenResult {
  [id: string]: TokenInfo
}

interface TokenInfo {
  symbol: string
  symbolKey: string
  name: string
  decimal: BigNumber
  limit: BigNumber
  mintable: boolean
  tradeable: boolean
  isDAT: boolean
  isLPS: boolean
  isLoanToken: boolean
  finalized: boolean
  minted: BigNumber
  creationTx: string
  creationHeight: BigNumber
  destructionTx: string
  destructionHeight: BigNumber
  collateralAddress: string
}
```

## createVault

Creates a vault transaction.

```ts title="client.loan.createVault()"
interface loan {
  createVault (vault: CreateVault, utxos: UTXO[] = []): Promise<string>
}

interface CreateVault {
  ownerAddress: string
  loanSchemeId?: string
}

interface UTXO {
  txid: string
  vout: number
}
```

## getVault

Returns information about vault.

```ts title="client.loan.getVault()"
interface loan {
  getVault (vaultId: string): Promise<VaultDetails>
}

interface VaultDetails {
  vaultId?: string
  loanSchemeId: string
  ownerAddress: string
  isUnderLiquidation: boolean
  batches?: AuctionBatchDetails[]
  collateralAmounts?: string[]
  loanAmount?: string[]
  collateralValue?: BigNumber
  loanValue?: BigNumber
  currentRatio?: BigNumber
}

interface AuctionBatchDetails {
  index: BigNumber
  collaterals: string[]
  loan: string
}
```

## listVaults

List all available vaults.

```ts title="client.loan.listVaults()"
interface loan {
  listVaults (pagination: VaultPagination = {}, options: ListVaultOptions = {}): Promise<VaultDetails[]>
}

interface ListVaultOptions {
  ownerAddress?: string
  loanSchemeId?: string
  isUnderLiquidation?: boolean
}

interface VaultPagination {
  start?: string
  including_start?: boolean
  limit?: number
}

interface VaultDetails {
  vaultId?: string
  loanSchemeId: string
  ownerAddress: string
  isUnderLiquidation: boolean
  batches?: AuctionBatchDetails[]
  collateralAmounts?: string[]
  loanAmount?: string[]
  collateralValue?: BigNumber
  loanValue?: BigNumber
  currentRatio?: BigNumber
}

interface AuctionBatchDetails {
  index: BigNumber
  collaterals: string[]
  loan: string
}
```

## depositToVault

Deposit to vault.

```ts title="client.loan.depositToVault()"
interface loan {
  depositToVault (depositVault: DepositVault, utxos: UTXO[] = []): Promise<string>
}

interface DepositVault {
  vaultId: string
  from: string
  amount: string // amount@symbol
}

interface UTXO {
  txid: string
  vout: number
}
```

## takeLoan

Take loan.

```ts title="client.loan.takeLoan()"
interface loan {
  takeLoan (metadata: TakeLoanMetadata, utxos: UTXO[] = []): Promise<string>
}

interface TakeLoanMetadata {
  vaultId: string
  amounts: string | string[] // amount@symbol
  to?: string
}

interface UTXO {
  txid: string
  vout: number
}
```

## auctionBid

To obtain the liquidated vault by offering a particular up for bid.

```ts title="client.loan.auctionBid()"
interface loan {
  auctionBid (auctionBid: AuctionBid, utxos: UTXO[] = []): Promise<string>
}

interface AuctionBid {
  vaultId: string
  index: number
  from: string
  amount: string // amount@symbol
}

interface UTXO {
  txid: string
  vout: number
}
```