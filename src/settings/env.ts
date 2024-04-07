const stage = 'prepare'

export const getEnv = (): string => {
  const sysEnv = process.env.NODE_ENV
  if (stage === 'prepare') {
    return 'Testnet'
  } else {
    if (sysEnv === 'development') {
      return 'Testnet'
    } else {
      return 'Mainnet'
    }
  }
}