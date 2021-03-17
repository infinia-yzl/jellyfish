---
id: introduction
title: Introduction
sidebar_label: Introduction
slug: /
---

A collection of TypeScript + JavaScript tools and libraries for DeFiChain developers to build decentralized finance on Bitcoin.
Consisting of 4 packages with more to be added in the future, the jellyfish project allow DeFiChain developers to build decentralized apps that are modern, easy to use and easy to test.

Jellyfish follows a monorepo methodology, all maintained packages are in the same repo and published with the same version tag.

## Packages

* `@defichain/jellyfish` bundled usage entrypoint with conventional defaults for 4 bundles: umd, esm, cjs
  and d.ts
* `@defichain/jellyfish-core` is a protocol agnostic DeFiChain client interfaces, with a "foreign function interface"
  design.
* `@defichain/jellyfish-jsonrpc` implements the [JSON-RPC 1.0](https://www.jsonrpc.org/specification_v1) specification.
* `@defichain/testcontainers` provides a lightweight, throw away instances for DeFiD node provisioned automatically in
  Docker container.

### Latest releases

|package|@latest|@next|
|---|---|---|
|`@defichain/jellyfish`|[![npm](https://img.shields.io/npm/v/@defichain/jellyfish)](https://www.npmjs.com/package/@defichain/jellyfish/v/latest)|[![npm@next](https://img.shields.io/npm/v/@defichain/jellyfish/next)](https://www.npmjs.com/package/@defichain/jellyfish/v/next)|
|`@defichain/jellyfish-core`|[![npm](https://img.shields.io/npm/v/@defichain/jellyfish-core)](https://www.npmjs.com/package/@defichain/jellyfish-core/v/latest)|[![npm@next](https://img.shields.io/npm/v/@defichain/jellyfish-core/next)](https://www.npmjs.com/package/@defichain/jellyfish-core/v/next)|
|`@defichain/jellyfish-jsonrpc`|[![npm](https://img.shields.io/npm/v/@defichain/jellyfish-jsonrpc)](https://www.npmjs.com/package/@defichain/jellyfish-jsonrpc/v/latest)|[![npm@next](https://img.shields.io/npm/v/@defichain/jellyfish-jsonrpc/next)](https://www.npmjs.com/package/@defichain/jellyfish-jsonrpc/v/next)|
|`@defichain/testcontainers`|[![npm](https://img.shields.io/npm/v/@defichain/testcontainers)](https://www.npmjs.com/package/@defichain/testcontainers/v/latest)|[![npm@next](https://img.shields.io/npm/v/@defichain/testcontainers/next)](https://www.npmjs.com/package/@defichain/testcontainers/v/next)|