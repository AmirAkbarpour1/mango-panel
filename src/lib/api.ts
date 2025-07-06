import { eq } from 'drizzle-orm'
import type { FetcherOptions, StandardSchemaV1 } from 'up-fetch'
import { isResponseError, up } from 'up-fetch'

import db from '@/db'
import { panels } from '@/db/schema'
import logger from '@/lib/logger'

const panelCache = new Map<
  number,
  { url: string, token: string, username: string }
>()

async function getPanelInfo(
  panelId: number,
): Promise<{ url: string, token: string, username: string }> {
  if (panelCache.has(panelId))
    return panelCache.get(panelId)!

  const panel = await db.query.panels.findFirst({
    where: eq(panels.id, panelId),
  })

  if (!panel)
    throw new Error(`Panel not found (panelId: ${panelId})`)

  const info = { url: panel.url, token: panel.token, username: panel.username }
  panelCache.set(panelId, info)
  return info
}

interface ApiRequestOptions<TData = any, TResponse = any>
  extends FetcherOptions<
    typeof fetch,
    StandardSchemaV1<TData, TResponse>,
    TResponse,
    any
  > {
  panelId: number
  hasRetried?: boolean
}

const rawApi = up(fetch)

async function refreshToken(panelId: number): Promise<string> {
  const panel = await db.query.panels.findFirst({
    where: eq(panels.id, panelId),
  })

  if (!panel) {
    throw new Error(
      `Panel not found during token refresh (panelId: ${panelId})`,
    )
  }

  logger.info(`Refreshing token for panelId: ${panelId}, url: ${panel.url}`)

  const authResponse = await fetch(`${panel.url}/api/admin/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: panel.username,
      password: panel.password,
    }),
  })

  if (!authResponse.ok) {
    throw new Error(
      `Token refresh failed (panelId: ${panelId}, url: ${panel.url})`,
    )
  }

  const { access_token } = (await authResponse.json()) as {
    access_token: string
  }

  await db
    .update(panels)
    .set({ token: access_token })
    .where(eq(panels.id, panelId))
  panelCache.set(panelId, {
    url: panel.url,
    token: access_token,
    username: panel.username,
  })

  logger.info(
    `Token refreshed successfully for panelId: ${panelId}, url: ${panel.url}`,
  )

  return access_token
}

async function api<TResponse>(
  url: string,
  options: ApiRequestOptions<any, TResponse>,
): Promise<TResponse> {
  const { panelId, hasRetried, ...restOptions } = options

  const panelInfo = await getPanelInfo(panelId)
  const fullUrl = `${panelInfo.url}/api${url}`

  try {
    return await rawApi<TResponse>(fullUrl, {
      ...restOptions,
      headers: {
        ...restOptions.headers,
        Authorization: `Bearer ${panelInfo.token}`,
        Accept: 'application/json',
      },
    })
  }
  catch (error: unknown) {
    if (isResponseError(error)) {
      if (error.status === 401 && !hasRetried) {
        logger.warn(
          `Token expired (panelId: ${panelId}, url: ${panelInfo.url}, retrying with new token...`,
        )

        try {
          const newToken = await refreshToken(panelId)

          return await api<TResponse>(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
              Accept: 'application/json',
            },
            hasRetried: true,
          })
        }
        catch (refreshError) {
          logger.error(
            `Token refresh failed for panelId: ${panelId}, url: ${panelInfo.url}`,
            refreshError,
          )
          throw refreshError
        }
      }
    }

    logger.error(
      `Unhandled API Error (panelId: ${panelId}, url: ${panelInfo.url})`,
      error,
    )
    throw error
  }
}

export default api
