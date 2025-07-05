function createName(service: { nameMode: 'random' | 'prefix', namePrefix?: string }): string {
  const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 8)

  switch (service.nameMode) {
    case 'random':
      return randomString

    case 'prefix':
      if (!service.namePrefix) {
        throw new Error('namePrefix is necessary in prefix mode')
      }
      return `${service.namePrefix}-${randomString}`
  }
}

export default createName
