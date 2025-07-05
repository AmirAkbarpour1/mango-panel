import { isResponseError } from 'up-fetch'

async function createApiHandler<T>(
  callback: () => Promise<T>,
  options?: { ignore404?: boolean },
): Promise<T> {
  try {
    return await callback()
  }
  catch (error: unknown) {
    if (isResponseError(error)) {
      if (error.status === 404 && options?.ignore404) {
        return undefined as unknown as T
      }

      throw new Error(`API Response Error: ${error.status} ${error.message}`)
    }

    throw new Error('Unexpected API error')
  }
}

export default createApiHandler
