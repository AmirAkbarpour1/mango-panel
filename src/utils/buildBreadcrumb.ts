import type { InferSelectModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'

import db from '@/db'
import type { services } from '@/db/schema'
import { categories } from '@/db/schema'

type Service = InferSelectModel<typeof services>

async function buildBreadcrumb(service: Service): Promise<string> {
  const path: string[] = []
  let currentCategoryId: number = service.categoryId

  while (currentCategoryId !== 0) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, currentCategoryId),
    })

    if (!category)
      break

    path.unshift(category.title)
    currentCategoryId = category.parentId
  }

  const breadcrumb = [...path, service.title].join(' ⬅️ ')
  return breadcrumb
}

export default buildBreadcrumb
