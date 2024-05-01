// const stage = 'prepare'
const stage:string = ''

export const getEnv = (): string => {
  const sysEnv = process.env.NEXT_PUBLIC_ENV_PARAM
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
