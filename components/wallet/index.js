import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Portis from '@portis/web3'
import WalletLink from 'walletlink'
import { providers, utils } from 'ethers'
import { IoWalletOutline } from 'react-icons/io5'

import { WALLET_DATA, WALLET_RESET } from '../../reducers/types'

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        1: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        56: 'https://bsc-dataseed.binance.org',
        137: 'https://polygon-rpc.com',
        42161: 'https://arb1.arbitrum.io/rpc',
        10: 'https://mainnet.optimism.io',
        43114: 'https://api.avax.network/ext/bc/C/rpc',
        250: 'https://rpc.ftm.tools',
        100: 'https://rpc.gnosischain.com',
        1284: 'https://rpc.api.moonbeam.network',
        1285: 'https://rpc.api.moonriver.moonbeam.network',
        122: 'https://rpc.fuse.io',
        2001: 'https://rpc.c1.milkomeda.com:8545',
        288: 'https://mainnet.boba.network',
        1666600000: 'https://api.harmony.one',
        192837465: 'https://mainnet.gather.network',
        25: 'https://evm.cronos.org',
        9001: 'https://eth.bd.evmos.org:8545',
        3: `https://ropsten.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        4: `https://rinkey.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        5: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        42: `https://kovan.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_ID}`,
        97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        80001: 'https://rpc-mumbai.matic.today',
        421611: 'https://rinkeby.arbitrum.io/rpc',
        69: 'https://kovan.optimism.io',
        43113: 'https://api.avax-test.network/ext/bc/C/rpc',
        4002: 'https://rpc.testnet.fantom.network',
        1287: 'https://rpc.api.moonbase.moonbeam.network',
      },
    },
    display: {
      description: 'Gnosis Safe is not supported.',
    },
  },
  portis: process.env.NEXT_PUBLIC_PORTIS_ID && {
    package: Portis,
    options: {
      id: process.env.NEXT_PUBLIC_PORTIS_ID,
    },
  },
  walletlink: process.env.NEXT_PUBLIC_INFURA_ID && {
    package: WalletLink,
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
      appName: 'Coinbase Wallet',
      appLogoUrl: '/logos/wallets/coinbase.svg',
    },
  },
}

const chainIdToNetwork = chain_id => {
  return {
    1: 'mainnet',
    56: 'binance',
    137: 'matic',
    42161: 'arbitrum',
    10: 'optimism',
    43114: 'avalanche-fuji-mainnet',
    250: 'fantom',
    100: 'xdai',
    // 1284: 'moonbeam',
    // 1285: 'moonriver',
    // 122: 'fuse',
    // 2001: 'milkomeda',
    // 288: 'boba',
    // 1666600000: 'harmony-one',
    // 192837465: 'gather',
    25: 'cronos',
    // 9001: 'evmos',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
    42: 'kovan',
    80001: 'mumbai',
    421611: 'arbitrum-rinkeby',
  }[chain_id]
}

const externalWallet = {
  kadena: [
    {
      id: "x-wallet",
      name: "X-Wallet",
      icon: "/logos/wallets/xwallet.jpg",
    },
  ],
};

const supportedChains = [
  { id: "ethereum", name: "Ethereum", icon: "/logos/wallets/ethereum.png" },
  { id: "kadena", name: "Kadena", icon: "/logos/wallets/kadena.png" },
];

let web3Modal

export default function Wallet({ chainIdToConnect, main, hidden, disabled = false, buttonConnectTitle, buttonConnectClassName, buttonDisconnectTitle, buttonDisconnectClassName, onChangeNetwork }) {
  const dispatch = useDispatch()
  const { preferences, chains, wallet } = useSelector(state => ({ preferences: state.preferences, chains: state.chains, wallet: state.wallet }), shallowEqual)
  const { chains_data } = { ...chains }
  const { theme } = { ...preferences }
  const { wallet_data } = { ...wallet }
  const { provider, web3_provider, chain_id } = { ...wallet_data }

  const [defaultChainId, setDefaultChainId] = useState(null)
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  useEffect(() => {
    if (chainIdToConnect && chainIdToConnect !== defaultChainId) {
      setDefaultChainId(chainIdToConnect)
    }
  }, [chainIdToConnect])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (web3_provider) {
        dispatch({
          type: WALLET_DATA,
          value: { default_chain_id: defaultChainId },
        })
      }

      // if (window.ethereum) {
      //   providerOptions['custom-tally'] = {
      //     display: {
      //       name: 'Tally',
      //       logo: '/logos/wallets/tally.svg',
      //     },
      //     package: async () => {
      //       let provider = null
      //       if (typeof window.ethereum !== 'undefined') {
      //         provider = window.ethereum
      //         try {
      //           await provider.request({ method: 'eth_requestAccounts' })
      //         } catch (error) {
      //           throw new Error('User Rejected')
      //         }
      //       } else if (window.web3) {
      //         provider = window.web3.currentProvider
      //       } else if (window.celo) {
      //         provider = window.celo
      //       } else {
      //         throw new Error('No Web3 Provider found')
      //       }
      //       return provider
      //     },
      //     connector: async (ProviderPackage, options) => {
      //       const provider = new ProviderPackage(options)
      //       try {
      //         await provider.enable()
      //       } catch (error) {}
      //       return provider
      //     },
      //   }
      // }

      if (window.clover) {
        providerOptions['custom-clover'] = {
          display: {
            name: 'Clover',
            logo: '/logos/wallets/clover.png',
          },
          package: async () => {
            let provider = null
            if (typeof window.clover !== 'undefined') {
              provider = window.clover
              try {
                await provider.request({ method: 'eth_requestAccounts' })
              } catch (error) {
                throw new Error('User Rejected')
              }
            } else if (typeof window.ethereum !== 'undefined') {
              provider = window.ethereum
              try {
                await provider.request({ method: 'eth_requestAccounts' })
              } catch (error) {
                throw new Error('User Rejected')
              }
            } else if (window.web3) {
              provider = window.web3.currentProvider
            } else if (window.celo) {
              provider = window.celo
            } else {
              throw new Error('No Web3 Provider found')
            }
            return provider
          },
          connector: async (ProviderPackage, options) => {
            const provider = new ProviderPackage(options)
            try {
              await provider.enable()
            } catch (error) { }
            return provider
          },
        }
      }

      web3Modal = new Web3Modal({
        network: chainIdToNetwork(defaultChainId) || 'mainnet',
        cacheProvider: true,
        providerOptions,
      })
    }
  }, [defaultChainId])

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connect()
    }
  }, [web3Modal])

  useEffect(async () => {
    if (web3Modal) {
      await web3Modal.updateTheme(theme)
    }
  }, [theme])

  const connect = useCallback(async () => {
    setShowModal(false);
    setSelectedNetwork(null);

    const provider = await web3Modal.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const network = await web3Provider.getNetwork()
    const address = await signer.getAddress()

    dispatch({
      type: WALLET_DATA,
      value: {
        provider,
        web3_provider: web3Provider,
        signer,
        chain_id: network.chainId,
        address,
      },
    })
  }, [web3Modal])

  const connectXwallet = async () => {
    setShowModal(false);
    setSelectedNetwork(null);
    if (typeof window !== 'undefined' && typeof window.kadena !== 'undefined') {
      try {
        window.kadena.request({ method: 'kda_connect', networkId: 'testnet04' });
        window.kadena.request({ method: 'kda_requestAccount', networkId: 'testnet04' }).then(({ wallet }) => {
          console.log(wallet)
          dispatch({
            type: WALLET_DATA,
            value: {
              provider: window.kadena,
              web3_provider: window.kadena,
              signer: null,
              chain_id: wallet.chainId,
              address: wallet.account,
            },
          })
        });

        // const network = { chainId: result.account.chainId }
        // const address = result.account.account;

      } catch (err) {
        console.log(err)
      }
    }
  }

  const disconnect = useCallback(async (e, is_reestablish) => {
    if (web3Modal && !is_reestablish) {
      await web3Modal.clearCachedProvider()
    }

    if (provider?.disconnect && typeof provider.disconnect === 'function') {
      await provider.disconnect()
    }

    dispatch({
      type: WALLET_RESET,
    })
  }, [web3Modal, provider])

  const switchNetwork = async () => {
    if (chainIdToConnect && chainIdToConnect !== chain_id && provider) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: utils.hexValue(chainIdToConnect) }],
        })
      } catch (error) {
        if (error.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: chains_data?.find(c => c.chain_id === chainIdToConnect)?.provider_params,
            })
          } catch (error) { }
        }
      }
    }
  }

  useEffect(() => {
    if (provider?.on) {
      const handleChainChanged = chainId => {
        if (!chainId) {
          disconnect()
        }
        else {
          connect()
        }
      }

      const handleAccountsChanged = accounts => {
        if (!accounts[0]) {
          disconnect()
        }
        else {
          dispatch({
            type: WALLET_DATA,
            value: {
              address: accounts[0],
            },
          })
        }
      }

      const handleDisconnect = e => {
        disconnect(e, e.code === 1013)

        if (e.code === 1013) {
          connect()
        }
      }

      provider.on('chainChanged', handleChainChanged)
      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('disconnect', handleDisconnect)

      return () => {
        if (provider.removeListener) {
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

  return !hidden && (
    <>
      {web3_provider ?
        !main && chainIdToConnect ?
          <button
            disabled={disabled}
            onClick={() => {
              switchNetwork()

              if (onChangeNetwork) {
                onChangeNetwork()
              }
            }}
            className={buttonDisconnectClassName || 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg whitespace-nowrap font-medium py-1 px-2'}
          >
            {buttonDisconnectTitle || 'Wrong Network'}
          </button>
          :
          <button
            disabled={disabled}
            onClick={disconnect}
            className={buttonDisconnectClassName || 'bg-gray-100 hover:bg-gray-200 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg font-medium py-1 px-2'}
          >
            {buttonDisconnectTitle || 'Disconnect'}
          </button>
        :
        <button
          disabled={disabled}
          onClick={() => setShowModal(!showModal)}
          className={buttonConnectClassName || 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg text-white font-medium py-1 px-2'}
          style={buttonConnectClassName?.includes('w-full') ? null : { width: 'max-content' }}
        >
          {buttonConnectTitle || (
            <div className="flex items-center space-x-1.5">
              <span>Connect</span>
              <IoWalletOutline size={18} />
            </div>
          )}
        </button>
      }
      <div
        tabIndex="-1"
        aria-hidden="true"
        aria-modal="true"
        role="dialog"
        className={`${!showModal ? "hidden" : "flex"
          } overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center bg-gray-900 bg-opacity-50 dark:bg-opacity-80 inset-0 z-40`}
      >
        <div className="relative p-4 w-full max-w-md h-full md:h-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={() => {
                setShowModal(false);
                setSelectedNetwork(null);
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>

            <div className="py-4 px-6 rounded-t border-b dark:border-gray-600">
              <h3 className="text-base font-semibold text-gray-900 lg:text-xl dark:text-white">
                Connect wallet
              </h3>
            </div>

            <div className="p-6">
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Connect with one of our available wallet
                providers or create a new one.
              </p>
              <ul className="my-4 space-y-3">
                {!selectedNetwork &&
                  supportedChains.map(
                    (network, index) => (
                      <li
                        key={"network" + index}
                        onClick={() => {
                          setSelectedNetwork(
                            network.id
                          )
                          if (network.id === "ethereum") connect();
                          else return;
                        }
                        }
                      >
                        <a className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                          <img
                            src={network.icon}
                            height={24}
                            width={24}
                          />
                          <span className="flex-1 ml-3 whitespace-nowrap">
                            {network.name}
                          </span>
                        </a>
                      </li>
                    )
                  )}

                {selectedNetwork && externalWallet[selectedNetwork] &&
                  externalWallet[selectedNetwork].map(
                    (_wallet, index) => (
                      <li key={"wallet" + index}>
                        <a
                          className="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                          onClick={() => {
                            if (_wallet.id === "x-wallet") connectXwallet()
                          }
                          }
                        >
                          <img
                            src={_wallet.icon}
                            height={20}
                            width={20}
                          />

                          <span className="flex-1 ml-3 whitespace-nowrap">
                            {_wallet.name}
                          </span>
                          {_wallet.id ===
                            "metamask" && (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-gray-500 bg-gray-200 rounded dark:bg-gray-700 dark:text-gray-400">
                                Popular
                              </span>
                            )}
                        </a>
                      </li>
                    )
                  )}
              </ul>
              <div>
                <a className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline dark:text-gray-400">
                  Why do I need to connect with my wallet?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}