function createName(service: {
  nameMode: 'random' | 'prefix'
  namePrefix?: string
}): string {
  const randomString = Math.random().toString(36).substring(2, 8)

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
