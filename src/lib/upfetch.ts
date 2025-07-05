import { up } from 'up-fetch'

function upfetch({ url, token }: { url: string, token?: string }) {
  return up(fetch, () => ({
    baseUrl: `${url}/api`,
    headers: {
      accept: 'application/json',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  }))
}

export default upfetch
